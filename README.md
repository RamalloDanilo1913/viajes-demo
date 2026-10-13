# Viajes Filial — Plataforma de gestión de viajes

Sistema web para organizar viajes de hinchas, pensado para los partidos de Talleres de Córdoba pero también útil para viajes particulares durante todo el año. Reemplaza una solución artesanal en Google Apps Script / Google Sheets por una aplicación Next.js + Supabase.

> **Versión demo.** Este repositorio no contiene datos reales, claves ni configuración de producción. La versión que corre en producción es privada porque maneja datos personales de usuarios.

## El problema que resuelve

Viajar a un partido implica coordinar autos, colectivos, pagos y listas de pasajeros, normalmente por WhatsApp y planillas sueltas. Esta plataforma ordena todo en un solo lugar:

- **Quien viaja** publica su viaje para compartir gastos.
- **Quien necesita viajar** encuentra opciones disponibles y pide un lugar.
- **La organización** gestiona viajes especiales en grupo con todos los datos necesarios para trámites de seguro y control de pasajeros.

## Funcionalidades

### Autos compartidos

- Publicación de viajes (partido, salida, regreso, lugares, precio, punto de encuentro).
- Búsqueda de autos disponibles y solicitud de lugar.
- El conductor recibe un email con la solicitud y acepta o rechaza con un clic.
- Si acepta, el pasajero recibe un email con el WhatsApp del conductor.
- Calificaciones de conductores y pasajeros.
- Viajes particulares abiertos todo el año, no solo para partidos.

### InfoBondi — viajes en colectivo para grupos

- Sistema usado y probado en viajes reales para gestionar viajes especiales en grupo.
- Reserva de múltiples pasajeros (adultos y menores) con todos los datos requeridos para seguros: nombre, DNI, fecha de nacimiento, contacto de emergencia, parada de subida.
- Control de cupos en tiempo real.
- **Pagos flexibles:**
  - Transferencia bancaria, con o sin comprobante según el caso.
  - Mercado Pago (Checkout Pro) con confirmación automática por webhook firmado.
- Lista del colectivo en vivo para el coordinador, con carga desde PDF.
- Encuesta posterior al viaje y mails personalizados a los participantes, con baja de un clic.

### Panel de administración

Control total del sistema para los administradores:

- Habilitar o deshabilitar medios de pago.
- Configurar y publicar viajes, cupos, precios y paradas.
- Ver reservas, comprobantes y estado de pago; marcar cobros y cerrar viajes.
- Exportar listas de pasajeros y contactos a Excel y PDF.
- Gestionar partidos, perfiles, historial y registro de errores.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend / Backend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Base de datos y storage | Supabase (PostgreSQL, funciones RPC, Storage) |
| Pagos | Mercado Pago (Checkout Pro + webhooks) |
| Emails | Resend |
| Deploy | Vercel |
| Exportación | SheetJS (Excel), jsPDF |

## Decisiones de diseño

- **Dos formas de acceso, según el caso de uso.** El panel de administración usa cuentas con contraseña y sesión. La lista en vivo del colectivo, en cambio, se abre con un PIN compartido: esa lista existe solo el día del viaje (se carga el PDF, se usa y se elimina), así que no tiene sentido registrar usuarios ni guardar datos de pasajeros más allá de ese día.
- **Toda la lógica de confianza vive en el servidor.** Las rutas públicas validan y limitan los datos que reciben, y las rutas de administración verifican la sesión del lado servidor en cada pedido, nunca solo en la interfaz.
- **Las operaciones críticas pasan por funciones de PostgreSQL (RPC):** crear la reserva con sus pasajeros, descontar cupos y confirmar pagos, para que la lógica quede cerca de los datos y no dependa del navegador.
- **Un pago solo se confirma por el webhook de Mercado Pago**, con firma verificada, y el servidor consulta el pago a la API de Mercado Pago antes de marcarlo como cobrado. El navegador nunca puede declarar que algo se pagó.
- **Comprobantes en un bucket privado.** Los archivos se guardan con nombre aleatorio, se valida su tipo real por contenido y el administrador los ve con links firmados que vencen en una hora.
- **Respuestas siempre frescas.** Las rutas de la API no se cachean, para que cupos y estados reflejen siempre lo que hay en la base.
- **Aceptar o rechazar un viaje se resuelve con un link por email** con un token único por solicitud, para que el conductor no necesite crear una cuenta.

## Seguridad

Se prestó atención a no exponer datos y a reducir la superficie de ataque:

- Sin secretos en el repositorio: toda la configuración va por variables de entorno (`.env.example`).
- La clave `service_role` de Supabase se usa solo del lado servidor.
- Panel admin con contraseñas hasheadas (bcrypt), sesiones en base de datos, cookie `httpOnly` + `secure` + `sameSite=strict`, límite de intentos y comparación a tiempo constante.
- Todas las rutas `/api/admin/*` exigen sesión válida del lado servidor.
- Webhook de Mercado Pago con verificación de firma (HMAC-SHA256) que **falla cerrado**: sin firma válida no se procesa nada.
- Endpoint de cron protegido con `CRON_SECRET` obligatoria.
- Escape de HTML en emails y páginas que muestran datos escritos por usuarios (previene XSS e inyección en mails).
- Validación y límites de entrada en los formularios públicos, límite de intentos por IP.
- Comprobantes de pago: validación por contenido real del archivo (PDF/JPG/PNG/WEBP), máximo 5 MB, nombres aleatorios y bucket privado con links firmados temporales para el admin.
- Exportaciones a Excel protegidas contra *formula injection*.
- Headers de seguridad (HSTS, `nosniff`, `Referrer-Policy`, etc.) y bloqueo de iframes en el panel admin.
- Mensajes de error genéricos hacia el público.

## Limitaciones conocidas

- **El límite de intentos por IP vive en memoria.** En un entorno serverless cada instancia tiene su propia memoria, así que funciona como defensa de mejor esfuerzo. En producción se complementa con las reglas de rate limit del firewall de Vercel; la mejora prevista es un almacén compartido (por ejemplo Upstash Redis).
- **El PIN de la lista del colectivo es compartido.** No hay cuentas individuales ni registro de quién accedió; la seguridad depende de usar un PIN largo y de limitar los intentos fallidos dentro de la propia función de base de datos.
- **Dependencias con avisos pendientes.** `npm audit` marca vulnerabilidades en Next.js 14 que solo se resuelven migrando a una versión mayor, y no hay versión corregida de `xlsx` en npm. Esta librería se usa únicamente para *generar* archivos, nunca para leer archivos subidos por usuarios. Migrar Next.js es una mejora pendiente.
- **Los links de aceptar o rechazar un viaje usan GET.** Es práctico para el conductor, pero un antivirus de correo que "visite" los links podría accionarlos sin querer. La mejora prevista es una página de confirmación con un botón.

## Instalación

```bash
git clone https://github.com/RamalloDanilo1913/viajes-demo.git
cd viajes-demo
npm install
cp .env.example .env.local   # completá con tus propias credenciales
npm run dev
```

La app queda en http://localhost:3000.

### Base de datos

Creá un proyecto en [Supabase](https://supabase.com) y ejecutá los scripts de la carpeta [`sql/`](./sql) (ver el README de esa carpeta). Creá el bucket de Storage `comprobantes` como **privado**.

Para crear un administrador:

```bash
node scripts/generar-hash-admin.mjs "UnaContraseñaLarga"
```

y pegá el hash en la columna `password_hash` de la tabla `admins`.

### Variables de entorno

Todas están documentadas en [`.env.example`](./.env.example). Las obligatorias para que funcione el núcleo son las de Supabase y `NEXT_PUBLIC_APP_URL`; Resend, Mercado Pago y `CRON_SECRET` son necesarias para mails, pagos online y tareas programadas.

### Deploy

Importá el repositorio en Vercel, cargá las variables de entorno y desplegá. Después poné la URL resultante en `NEXT_PUBLIC_APP_URL` y configurá el webhook de Mercado Pago apuntando a `/api/mercadopago/webhook`.

## Estructura

```
app/
  admin/          Panel de administración
  api/            Rutas de API (públicas y de admin)
  viajefilial/    Lista en vivo del colectivo (PIN)
components/       Componentes de la interfaz
lib/              Supabase, Mercado Pago, emails, validaciones, seguridad
scripts/          Utilidades (generar hash de admin)
sql/              Esquema de base de datos
```

## Autor

**Danilo Ramallo** — Estudiante de Ingeniería Electrónica · Desarrollo web y ciberseguridad

[LinkedIn](https://www.linkedin.com/in/danilo-ramallo-9877a6289)
