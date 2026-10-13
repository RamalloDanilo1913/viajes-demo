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
- Lista del colectivo en vivo para el coordinador, con carga desde PDF. Se accede con un PIN compartido en lugar de cuentas de usuario: la lista existe solo el día del viaje (se carga el PDF, se usa y se elimina), así que no tiene sentido registrar usuarios ni guardar datos de pasajeros más allá de ese día.
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
