# Base de datos

Esquema de Supabase (PostgreSQL) del proyecto, sin datos reales.

| Archivo | Contenido |
|---|---|
| `01_tablas.sql` | Las 20 tablas con sus claves, restricciones e índices |
| `02_funciones.sql` | Funciones RPC: reservas de bondi con descuento atómico de cupos, confirmación de pagos de Mercado Pago, expiración de reservas pendientes, cupos de autos y lista en vivo del colectivo (`bondi_*`) |
| `03_rls_permisos.sql` | Row Level Security en todas las tablas y permisos de ejecución de las funciones |
| `04_semilla.sql` | Filas iniciales vacías y el bucket privado `comprobantes` |

La función `consumir_token_prellenado` vive en el proyecto Supabase del portal de socios y no forma parte de este esquema.
