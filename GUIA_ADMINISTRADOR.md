# 📊 Panel de Administración - Guía Completa

> **Última actualización:** Enero 2026  
> **Versión:** 1.0

---

## 🎯 Visión General

El Panel de Administración de Oraclia es tu centro de control para gestionar todos los aspectos del negocio: desde el monitoreo de ingresos hasta la gestión de tarotistas y resolución de reportes de usuarios.

---

## 📱 Módulos Disponibles

### 1. Dashboard Principal (`/`)

**Propósito:** Vista rápida del estado del negocio.

| Métrica | Descripción |
|---------|-------------|
| 💰 **Ingresos Brutos** | Total de pagos recibidos en el mes |
| 👥 **Pagos a Tarotistas** | Monto total a pagar por servicios realizados |
| 📈 **Ganancia Neta** | Diferencia entre ingresos y gastos |
| 💬 **Consultas del Mes** | Número total de consultas realizadas |

**Características:**
- Selector de moneda (USD, ARS, EUR)
- Top 5 tarotistas del mes por ganancias
- Botón de actualización manual

---

### 2. Consultas Flash (`/consultas`)

**Propósito:** Gestionar las preguntas flash de los usuarios.

**Acciones disponibles:**
| Acción | Descripción |
|--------|-------------|
| 🔍 **Buscar** | Filtrar por contenido de la pregunta |
| 📊 **Filtrar por estado** | Abierta, Reclamada, Respondida, Cerrada, Cancelada, Expirada |
| 🗑️ **Eliminar** | Borrar preguntas (con confirmación) |
| 👁️ **Ver respuesta** | Ver el contenido de la respuesta si existe |

**Estados de una pregunta:**
- 🟢 **Abierta:** Esperando ser tomada por un tarotista
- 🔵 **Reclamada:** Un tarotista la tomó y tiene 30 min para responder
- 🟣 **Respondida:** El tarotista envió su respuesta
- ⚪ **Cerrada:** Consulta finalizada
- 🔴 **Cancelada:** El usuario canceló antes de ser tomada
- 🟠 **Expirada:** Pasaron 30 min sin respuesta

---

### 3. Tarotistas (`/tarotistas`)

**Propósito:** Gestionar el equipo de tarotistas.

**Lista de tarotistas:**
| Columna | Información |
|---------|-------------|
| Nombre | Nombre de display y avatar |
| País | Ubicación geográfica |
| Estado | Activo/Inactivo |
| Rating | Puntuación promedio |
| Pago Pendiente | Monto acumulado sin pagar |

**Filtros disponibles:**
- Búsqueda por nombre
- Filtro por estado (Activo/Inactivo)
- Paginación

#### Vista de Detalle (`/tarotistas/[id]`)

Al hacer clic en un tarotista se muestra:

| Sección | Contenido |
|---------|-----------|
| 📋 **Información básica** | Email, teléfono, país, fecha de registro |
| 💵 **Estadísticas financieras** | Total ganado, pendiente de pago, consultas realizadas |
| 📊 **Gráfico mensual** | Evolución de consultas y ganancias (6 meses) |
| 📜 **Consultas recientes** | Últimas 10 consultas con montos |
| ⭐ **Especialidades** | Áreas de expertise |

**Acción principal:** Botón "Procesar Pago" para liquidar el monto pendiente.

---

### 4. Finanzas (`/finanzas`)

**Propósito:** Análisis financiero detallado por período.

**Controles:**
- Selector de mes
- Selector de año
- Selector de moneda

**Métricas mostradas:**
| Card | Descripción |
|------|-------------|
| 📥 **Ingresos Totales** | Suma de pagos aprobados |
| 📤 **Gastos Totales** | Pagos a tarotistas |
| 💎 **Beneficio Neto** | Ganancia real del mes |
| 📉 **Margen** | Porcentaje de ganancia sobre ingresos |

**Tabla de desglose por servicio:**
Muestra para cada tipo de servicio:
- Ingresos generados
- Gastos asociados
- Beneficio
- Margen de ganancia

---

### 5. Pagos (`/pagos`)

#### 5a. Pagos Mensuales (`/pagos/mensuales`)

**Propósito:** Gestionar pagos mensuales a tarotistas.

**Vista por mes:**
- Navegación mes a mes
- Lista de tarotistas con trabajo en ese período
- Estado del pago (Pendiente, Completado, etc.)

**Acciones:**
| Acción | Descripción |
|--------|-------------|
| ✅ **Procesar pago** | Marcar el pago como completado |
| 🔄 **Cambiar estado** | Actualizar estado del pago |

#### 5b. Historial de Pagos (`/pagos/historial`)

**Propósito:** Registro completo de pagos procesados.

**Información mostrada:**
- Nombre del tarotista
- Monto pagado
- Número de sesiones incluidas
- Fecha de procesamiento
- Estado actual

---

### 6. Reportes (`/reportes`)

**Propósito:** Gestionar denuncias de usuarios.

**Estados de un reporte:**
| Estado | Significado |
|--------|-------------|
| 🟡 **Pendiente** | Nuevo, sin revisar |
| 🔵 **Revisando** | En proceso de investigación |
| 🟢 **Resuelto** | Acción tomada |
| ⚪ **Desestimado** | Sin mérito, cerrado |

**Información del reporte:**
- Quién reporta
- Quién es reportado
- Razón del reporte
- Descripción detallada
- Hilo de conversación (si aplica)

**Acciones:**
- Cambiar estado
- Agregar notas de resolución

---

### 7. Configuración (`/configuracion`)

**Propósito:** Ver configuración de servicios.

**Tabla de servicios:**
| Columna | Descripción |
|---------|-------------|
| Servicio | Nombre y slug |
| Tipo | Categoría del servicio |
| Precio USD | Precio base en dólares |
| Precio ARS | Precio base en pesos |
| Precio EUR | Precio base en euros |
| Estado | Activo/Inactivo |

> ⚠️ **Nota:** Los precios mostrados son los precios NETOS (lo que gana el tarotista). Para editar precios, contactar al equipo técnico.

---

## 🚀 Flujos de Trabajo Comunes

### Procesar pagos del mes

1. Ir a **Pagos → Mensuales**
2. Seleccionar el mes a procesar
3. Para cada tarotista con trabajo:
   - Verificar el monto y número de sesiones
   - Click en "Procesar Pago"
   - Confirmar la acción
4. El estado cambiará a "Completado"

### Investigar un reporte

1. Ir a **Reportes**
2. Filtrar por estado "Pendiente"
3. Abrir el reporte
4. Cambiar estado a "Revisando"
5. Investigar los hechos
6. Cambiar a "Resuelto" o "Desestimado"
7. Agregar notas de resolución

### Revisar rendimiento de un tarotista

1. Ir a **Tarotistas**
2. Buscar el tarotista por nombre
3. Click para ver el detalle
4. Revisar:
   - Gráfico de últimos 6 meses
   - Rating promedio
   - Consultas recientes

---

## 📊 Tipos de Servicio

| Código | Nombre Display | Categoría |
|--------|----------------|-----------|
| `flash_1carta` | ⚡ Pregunta Flash | Consultas Rápidas |
| `flash_1carta_gratis` | 🎁 Pregunta Flash (Regalo) | Consultas Rápidas |
| `privada_3cartas` | 💬 Consulta Privada | Consultas Privadas |
| `extensa_5cartas` | 📖 Consulta Extensa | Consultas Privadas |
| `lectura_solos_solas` | 💔 Lectura Solos/Solas | Lecturas de Amor |
| `lectura_amores_pasados` | ⏳ Lectura Amores Pasados | Lecturas de Amor |
| `lectura_amores_nuevos` | 💕 Lectura Amores Nuevos | Lecturas de Amor |
| `lectura_almas_gemelas` | ✨ Lectura Almas Gemelas | Lecturas de Amor |
| `carta_astral` | ⭐ Carta Astral | Servicios Especiales |
| `sesion_reiki` | 🙏 Sesión de Reiki | Servicios Especiales |
| `registros_akashicos` | 📜 Registros Akáshicos | Servicios Especiales |
| `sesion_numerologia` | 🔢 Numerología | Servicios Especiales |
| `analisis_suenos` | 🌙 Análisis de Sueños | Servicios Especiales |

---

## 💡 Recomendaciones de Mejora

### Corto Plazo (Quick Wins)

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 1 | **Exportar a Excel** - Agregar botón para descargar reportes financieros | Alto | Bajo |
| 2 | **Notificaciones** - Alertas cuando hay reportes pendientes | Alto | Medio |
| 3 | **Búsqueda global** - Barra de búsqueda en el header | Medio | Bajo |

### Mediano Plazo

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 4 | **Dashboard de métricas** - Gráficos de tendencias (ingresos, consultas, usuarios) | Alto | Medio |
| 5 | **Gestión de precios** - Editar precios de servicios desde el dashboard | Alto | Medio |
| 6 | **Calendario de pagos** - Vista de calendario para programar pagos | Medio | Medio |
| 7 | **Logs de auditoría** - Registro de acciones administrativas | Alto | Medio |

### Largo Plazo

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 8 | **Multi-admin** - Diferentes niveles de acceso (viewer, editor, superadmin) | Alto | Alto |
| 9 | **API de integración** - Conectar con sistemas contables externos | Medio | Alto |
| 10 | **App móvil admin** - Versión móvil del dashboard para emergencias | Medio | Alto |

---

## 🔧 Soporte Técnico

Si encuentras algún problema o necesitas asistencia:

1. **Errores en el dashboard:** Captura de pantalla + descripción del problema
2. **Problemas de datos:** Verificar primero los filtros aplicados
3. **Bugs críticos:** Contactar al equipo de desarrollo inmediatamente

---

*Documento generado automáticamente. Para actualizaciones, contactar al equipo técnico.*
