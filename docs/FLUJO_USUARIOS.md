# Flujo de Gestión de Usuarios — Dashboard Admin

> **Última actualización:** Febrero 2026  
> Documentación del flujo completo de listado y moderación de usuarios.

---

## Arquitectura del flujo

```
usuarios/page.tsx
    └── useUsers(params)                   ← React Query hook
            └── adminApi.getUsers(params)  ← fetch wrapper
                    └── admin-dashboard/users          ← Supabase Edge Function
                            ├── auth.admin.listUsers() (bulk)
                            └── profiles (Postgres)

usuarios/page.tsx → [Banear] → useDeleteUser()
    └── adminApi.deleteUser(userId)
            └── admin-dashboard/users/:id (DELETE)
                    ├── auth.admin.updateUserById(ban_duration: '876600h')
                    ├── profiles.is_active = false
                    └── auth.admin.signOut(userId, 'global')
```

---

## Endpoint: `GET /admin-dashboard/users`

### Parámetros de query

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `search` | string | — | Busca por `display_name` (ilike) **o** por email (cruzando auth) |
| `page` | number | 1 | Página actual |
| `limit` | number | 10 | Resultados por página |
| `status` | `all` \| `active` \| `banned` | `all` | Filtra por `profiles.is_active` |

### Lógica del backend (post-refactor)

1. **Bulk fetch de auth users** — un único loop de `auth.admin.listUsers({ perPage: 1000 })` pagina todos los usuarios auth y construye un `Map<id, { email, last_sign_in_at, banned_until }>`. Elimina el N+1 que existía antes (un `getUserById` por fila de perfil).

2. **Email search** — si hay parámetro `search`, escanea el Map buscando el string en `email`. Devuelve los IDs coincidentes (`emailMatchIds`).

3. **Exclusión de tarotistas** — consulta `reader_profiles` para obtener los IDs a excluir con `.not('id', 'in', ...)`.

4. **Query a `profiles`** — combina búsqueda por `display_name.ilike` y/o `id.in(emailMatchIds)` con el operador `or`. Aplica filtro `is_active` según `status`.

5. **Merge** — enriquece cada fila de `profiles` con `email`, `last_sign_in`, `is_banned` del Map (O(n)).

### Forma de respuesta

```json
{
  "data": [
    {
      "id": "uuid",
      "display_name": "Juan García",
      "avatar_url": null,
      "email": "juan@example.com",
      "role": "user",
      "is_active": true,
      "is_banned": false,
      "created_at": "2025-01-15T10:00:00Z",
      "last_sign_in": "2026-02-10T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "pages": 5
  }
}
```

---

## Endpoint: `DELETE /admin-dashboard/users/:id`

### Comportamiento — ban + desactivar (sin eliminar datos)

> **Criterio de diseño:** Nunca se llama a `auth.admin.deleteUser`. Toda la data relacional (preguntas, compras, mensajes, threads, ledger) queda intacta.

**Pasos que ejecuta el handler:**

| Paso | Acción | Tabla/API | Efecto |
|------|--------|-----------|--------|
| 1 | Bloquear tarotistas | `reader_profiles` | 400 si el userId pertenece a un tarotista |
| 2 | Verificar existencia | `auth.admin.getUserById` | 404 si no existe |
| 3 | **Banear email** | `auth.admin.updateUserById({ ban_duration: '876600h' })` | ~100 años; el email no puede registrarse de nuevo |
| 4 | **Desactivar perfil** | `profiles` UPDATE `is_active = false` | Aparece como inactivo; datos preservados |
| 5 | **Revocar sesiones** | `auth.admin.signOut(userId, 'global')` | Cierra todas las sesiones activas |

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Usuario baneado y desactivado. El correo juan@example.com no podrá usarse para crear una nueva cuenta."
}
```

### Errores posibles

| Código | Causa |
|--------|-------|
| 400 | El `userId` es un tarotista |
| 404 | El usuario no existe en el sistema de autenticación |
| 500 | Error parcial (uno de los pasos falló); incluye detalle |

---

## Capa de tipos — `UserData`

```typescript
// web-dashboard/lib/api/admin.ts
export interface UserData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;          // 'user' | 'admin' (app_role enum)
  is_active: boolean;    // profiles.is_active
  is_banned: boolean;    // calculado: banned_until > ahora
  created_at: string;
  last_sign_in: string | null;
}
```

---

## Hook: `useUsers`

```typescript
// web-dashboard/lib/hooks/useUsers.ts
useUsers({
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'banned';
})
```

El `queryKey` incluye `status` para invalidación correcta de caché al cambiar el filtro.

---

## Página UI: `app/(dashboard)/usuarios/page.tsx`

### Componentes clave

- **`StatusBadge`** — pill con punto de color: verde "Activo" / gris "Inactivo" / rojo "Baneado". Deriva el estado de `is_banned` (prioridad) luego `is_active`.
- **Filtro de estado** — `<select>` con opciones Todos / Activos / Baneados. Al cambiar resetea `page` a 1.
- **Botón de acción** — "Banear" solo aparece si `!user.is_banned`. Si ya está baneado muestra "Ya baneado" en texto gris.
- **`ConfirmModal`** — título "Banear y desactivar usuario"; describe que se preservan preguntas, compras y mensajes; botón de confirmación "Sí, banear".

### Estados del badge

| `is_banned` | `is_active` | Badge |
|-------------|-------------|-------|
| `true` | cualquiera | 🔴 Baneado |
| `false` | `false` | ⚫ Inactivo |
| `false` | `true` | 🟢 Activo |

---

## Tablas de base de datos involucradas

| Tabla | Acción | Propósito |
|-------|--------|-----------|
| `auth.users` (Supabase Auth) | READ + UPDATE | Email, ban_duration, sesiones |
| `profiles` | READ + UPDATE | display_name, is_active, role |
| `reader_profiles` | READ | Verificar si es tarotista |
| `global_questions` | ninguna | Preservadas |
| `payments` | ninguna | Preservadas |
| `dm_messages` / `dm_threads` | ninguna | Preservados |
| `ledger` | ninguna | Preservado |

---

## Notas de seguridad

- El endpoint valida que el solicitante sea el admin (email hardcodeado en `handleRequest`).
- Los tarotistas no pueden ser baneados desde esta sección; deben gestionarse desde `/tarotistas`.
- El ban de Supabase Auth bloquea login y registro con ese email de forma permanente (~100 años).
