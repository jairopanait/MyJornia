# Ficha de privacidad para App Store y Google Play

Esta ficha resume lo que habra que declarar en las tiendas. Debe coincidir con la politica publica final.

## Datos recogidos y vinculados al usuario

- Correo electronico: crear cuenta, iniciar sesion, recuperar contrasena y soporte.
- Identificador de usuario: separar datos por cuenta en Supabase.
- Nombre: opcional, si el usuario lo introduce al registrarse.
- Contenido generado por el usuario: turnos, notas, plantillas, configuracion de nomina, festivos y preferencias.

## Datos sensibles o especialmente delicados

La app puede contener datos laborales y economicos introducidos por el usuario. Aunque no sean categorias especiales del RGPD por defecto, deben tratarse como informacion sensible por contexto.

## Datos no recogidos actualmente

- Ubicacion.
- Contactos.
- Fotos o videos.
- Audio.
- Calendario del sistema.
- Salud.
- Datos de pago.
- Publicidad o tracking entre apps.

## Uso de datos

- Funcionalidad de la app.
- Gestion de cuenta.
- Seguridad y prevencion de abuso.
- Soporte al usuario.

## Comparticion

- Supabase actua como proveedor/encargado para autenticacion y base de datos.
- No se venden datos.
- No se comparten datos con anunciantes.

## Seguridad declarable

- Datos cifrados en transito mediante HTTPS.
- Acceso protegido por cuenta de usuario.
- Row Level Security en base de datos.
- Sesion guardada en almacenamiento seguro del dispositivo cuando esta disponible.
- Doble factor y bloqueo local opcionales.

## Eliminacion de cuenta

En la app debe existir una opcion visible para solicitar eliminacion de cuenta. En Google Play tambien hara falta una URL publica externa para iniciar esa solicitud desde fuera de la app.
