# Flujo de Procesamiento de Pagos — Dashboard Admin

> **Última actualización:** Febrero 2026  
> Documentación del flujo completo de pagos a tarotistas: cálculo de pendientes, procesamiento mensual, historial y exportación CSV.

---

## Visión general

El sistema de pagos maneja **dos monedas/plataformas**:

| Moneda | Plataforma | Tarotistas que la usan |
|--------|-----------|----------------------|
| `ARS` | MercadoPago | `reader_profiles.preferred_currency = 'ARS'` |
| `USD` | PayPal | `reader_profiles.preferred_currency = 'USD'` |
| `EUR` | PayPal | `reader_profiles.preferred_currency = 'EUR'` |

La moneda de cada tarotista se almacena en `reader_profiles.preferred_currency`. Todos los cálculos de pago respetan esa moneda.

---

## Arquitectura del flujo

```
pagos/mensuales/page.tsx
    ├── useQuery → adminApi.getMonthlyPayouts({ month, year, platform })
    │       └── GET /admin-dashboard/monthly-payouts
    │
    ├── processMutation → adminApi.processPayout({ readerId, month, year, currency })
    │       └── POST /admin-dashboard/process-payout/:id
    │
    ├── updateStatusMutation → adminApi.updatePayoutStatus({ payoutId, status, ... })
    │       └── PATCH /admin-dashboard/update-payout-status/:id
    │
    └── uploadReceiptMutation → adminApi.uploadPayoutReceipt({ payoutId, file })
            └── POST /admin-dashboard/upload-payout-receipt/:id

pagos/historial/page.tsx
    └── useQuery → adminApi.getPayoutHistory({ page, limit, platform, readerId })
            └── GET /admin-dashboard/payout-history
```

---

## Tablas involucradas

| Tabla | Rol |
|-------|-----|
| `consultation_sessions` | Fuente de sesiones completadas (status `answered` \| `closed`, `answered_at` no nulo) |
| `service_net_prices` | Precio neto por tarotista para cada `service_kind`, en ARS/USD/EUR |
| `service_packs` | Precio de venta al público (usado para revenue en finanzas) |
| `tarotista_payouts` | Registro de cada pago procesado |
| `reader_profiles` | Moneda preferida del tarotista |
| `profiles` | Nombre/avatar para mostrar en UI |
| `payments` | Ingresos reales (pagos de usuarios aprobados) |

---

## Endpoint: `GET /admin-dashboard/monthly-payouts`

Calcula el estado de pago de cada tarotista activo para un mes dado.

### Parámetros

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `month` | mes actual | Número de mes (1–12) |
| `year` | año actual | Año |
| `platform` | `all` | `all` \| `mercadopago` \| `paypal_usd` \| `paypal_eur` |

### Lógica

1. Obtiene todos los `reader_profiles` activos con su `preferred_currency`.
2. Por cada tarotista, consulta sus `consultation_sessions` del período (`answered_at` dentro del rango del mes).
3. Suma el monto usando `service_net_prices` en la moneda preferida del tarotista.
4. Busca si ya existe un `tarotista_payouts` para ese tarotista, moneda y período.
5. Devuelve `payout_status: null` si no hay pago aún, o el status real del registro.

### Respuesta

```json
{
  "data": [
    {
      "reader_id": "uuid",
      "display_name": "Valentina Luna",
      "sessions_count": 12,
      "amount": 85.00,
      "currency": "USD",
      "platform": "paypal",
      "period_start": "2026-02-01T...",
      "period_end": "2026-02-28T...",
      "payout_status": null,
      "payout_id": null,
      "processed_at": null,
      "receipt_url": null
    }
  ],
  "by_platform": {
    "mercadopago": { "currency": "ARS", "payouts": [...], "total_amount": 150000, "pending_count": 3, "processed_count": 1 },
    "paypal_usd":  { "currency": "USD", "payouts": [...], "total_amount": 340.00, "pending_count": 2, "processed_count": 4 },
    "paypal_eur":  { "currency": "EUR", "payouts": [...], "total_amount": 90.00,  "pending_count": 1, "processed_count": 0 }
  },
  "summary": { "total_tarotistas": 6, "pending_count": 6, "processed_count": 5 }
}
```

---

## Endpoint: `POST /admin-dashboard/process-payout/:readerId`

Crea un registro de pago en `tarotista_payouts` con `status = 'completed'` para las sesiones no pagadas.

### Parámetros de query

| Parámetro | Descripción |
|-----------|-------------|
| `currency` | `USD` \| `ARS` \| `EUR` |
| `month` | Mes |
| `year` | Año |

### Lógica

1. Obtiene TODAS las sesiones `answered/closed` del tarotista con `answered_at` ordenado asc.
2. Carga los payouts completados existentes y **filtra** las sesiones que ya están cubiertas por un período pagado.
3. Calcula `totalAmount` usando `service_net_prices` en la moneda solicitada.
4. Lanza 400 si no hay sesiones pendientes o si el monto calculado es 0.
5. Inserta en `tarotista_payouts`:
   - `status: 'completed'`
   - `payment_method: 'admin_manual'`
   - `processed_by: auth.profile.id` (ID del admin)
   - `period_start` / `period_end` = primera/última `answered_at` de las sesiones no pagadas
   - `sessions_count`

> **Nota:** El estado se establece directamente como `'completed'` al procesar. Si se necesita un flujo de aprobación posterior, usar `updatePayoutStatus`.

---

## Endpoint: `PATCH /admin-dashboard/update-payout-status/:payoutId`

Actualiza campos de un pago existente en `tarotista_payouts`.

### Body JSON

```json
{
  "status": "pending" | "completed" | "failed" | "cancelled",
  "notes": "string opcional",
  "payment_date": "YYYY-MM-DD",
  "payment_method": "string",
  "transaction_reference": "string"
}
```

- Si `status = 'completed'` y `processed_at` no está seteado, lo asigna automáticamente.

---

## Endpoint: `POST /admin-dashboard/upload-payout-receipt/:payoutId`

Sube un comprobante de pago (imagen o PDF) a Supabase Storage.

### Validaciones

| Check | Detalle |
|-------|---------|
| Formato | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Tamaño | Máximo 5 MB |
| Existencia | El `payoutId` debe existir en `tarotista_payouts` |

### Almacenamiento

- Bucket: `media-uploads`
- Path: `payout-receipts/{payoutId}-{timestamp}.{ext}`
- Guarda el path relativo en `tarotista_payouts.receipt_url`

---

## Endpoint: `GET /admin-dashboard/payout-history`

Historial paginado de todos los pagos procesados.

### Parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `page` | Página (default 1) |
| `limit` | Resultados por página (default 20) |
| `platform` | `all` \| `mercadopago` \| `paypal_usd` \| `paypal_eur` |
| `readerId` | Filtra los pagos de un tarotista específico |

### Fix aplicado (bug #4)
El bloque `by_platform` ahora aplica el filtro `readerId` a la query de totales. Antes mostraba agregados globales incluso al ver el historial de un tarotista individual.

---

## Endpoint: `GET /admin-dashboard/export-payouts`

Genera y descarga un CSV con los pagos del mes/año solicitado.

### Parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `month` | Mes |
| `year` | Año |
| `status` | `all` \| `pending` \| `completed` \| `failed` \| `cancelled` |

### Columnas del CSV (post-fix)

```
ID, Tarotista, Email, Moneda, Plataforma, Monto, Consultas,
Período Inicio, Período Fin, Estado, Método Pago,
Referencia, Fecha Pago, Notas, Creado, Procesado
```

> **Bug crítico corregido:** La función anterior usaba nombres de columnas inexistentes en el esquema real (`tarotista_id`, `period_month`, `period_year`, `gross_earnings_*`, `net_payout_*`). Ahora usa las columnas reales de `tarotista_payouts` y el join correcto con `reader_profiles!reader_id → profiles`.

---

## Funciones helper: correcciones aplicadas

### `calculatePendingPayoutDetails` — fix: excluía sesiones pagadas

**Antes:** Sumaba TODAS las sesiones `answered/closed` del tarotista (toda la vida), sin verificar si ya habían sido pagadas. El widget "Pendiente" en la lista de tarotistas mostraba el total histórico.

**Después:** Carga primero `tarotista_payouts WHERE status = 'completed'` y filtra las sesiones cuya `answered_at` cae dentro de algún período ya pagado. El pending refleja solo la deuda real.

```typescript
// Patrón de exclusión:
const unpaidSessions = allSessions.filter(session => {
  const sessionDate = new Date(session.answered_at);
  return !completedPayouts?.some(p => {
    const start = new Date(p.period_start);
    const end = new Date(p.period_end);
    return sessionDate >= start && sessionDate <= end;
  });
});
```

### `fetchExpensesByCurrency` — fix: triple-counting

**Antes:** Por cada sesión completada, sumaba su precio en ARS, USD **y** EUR simultáneamente. Los gastos en la página de Finanzas estaban inflados hasta 3×.

**Después:** Obtiene `reader_profiles.preferred_currency` para todos los readers relevantes (una sola query), y cada sesión solo se contabiliza en la moneda de pago de su tarotista.

```typescript
// Ahora:
const currency = readerCurrencyMap.get(session.reader_id) || 'USD';
expensesByCurrency[currency] += price[currency] || 0;
```

---

## Estados del pago (`tarotista_payouts.status`)

| Status | Descripción | Badge UI |
|--------|-------------|----------|
| `null` (sin registro) | Período con sesiones, aún sin pago creado | 🟠 Pendiente |
| `pending` | Pago creado, en proceso | 🔵 En proceso |
| `completed` | Pago enviado y confirmado | 🟢 Completado |
| `failed` | Falló el pago | 🔴 Fallido |
| `cancelled` | Pago cancelado | ⚫ Cancelado |

---

## Flujo completo de pago mensual (happy path)

```
1. Admin accede a /pagos/mensuales
2. Selecciona mes/año y opcionalmente filtra por plataforma
3. Ve tarjetas resumen (MercadoPago ARS / PayPal USD / PayPal EUR)
4. Tabla lista tarotistas con sesiones en ese período y badge de estado
5. Hace clic en "Procesar pago" → ConfirmModal
6. POST /process-payout/:id → inserta tarotista_payouts con status=completed
7. Puede subir comprobante → POST /upload-payout-receipt/:id
8. Puede cambiar estado si es necesario → PATCH /update-payout-status/:id
9. Exporta CSV del mes → GET /export-payouts?month=&year=
```

---

## Notas sobre consistencia de datos

- **`service_net_prices`** es la fuente de verdad para lo que se le paga al tarotista por sesión.
- **`payments`** (pagos de usuarios vía MercadoPago/PayPal/Stripe) es la fuente para los ingresos brutos en la página de Finanzas.
- Ambas fuentes son independientes: no hay FK entre `payments` y `consultation_sessions`. Las Finanzas comparan ingresos reales (payments) vs. costos calculados (service_net_prices × sesiones).
- Si `service_net_prices` no tiene precio para un `service_kind`, ese servicio se omite del cálculo con un warning en logs.
