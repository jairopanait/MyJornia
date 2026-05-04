# Seguridad de MyWorkday

MyWorkday maneja turnos, datos laborales y estimaciones de nomina. Estos son datos personales, asi que el objetivo es que la app no dependa solo de "portarse bien" en el frontend.

## Implementado en la app

- La sesion de Supabase se guarda con `expo-secure-store`, usando Keychain en iOS y Keystore en Android cuando esta disponible.
- Hay bloqueo opcional de app desde `Mas > Seguridad`, usando Face ID, huella o el desbloqueo local que permita el movil.
- Hay doble factor TOTP opcional desde `Mas > Seguridad`; si el usuario lo activa, la app exige el codigo tras iniciar sesion.
- La clave secreta de Supabase no se usa en la app. En `.env` solo debe estar la URL y la Publishable key.
- `.env` esta ignorado por Git.
- La contrasena exige minimo 8 caracteres, un numero y un simbolo.

## Ejecutar en Supabase

Ejecuta `supabase-security-hardening.sql` en el SQL Editor de Supabase despues de las migraciones de tablas.

Ese archivo:

- Activa RLS en las tablas sensibles.
- Limita cada tabla por `auth.uid()`.
- Permite a administradores leer datos globales solo mediante `public.is_admin()`.
- Evita que la app movil pueda crear administradores.

## Ajustes manuales recomendados en Supabase

- Auth: mantener confirmacion de correo activada.
- Auth: comprobar que MFA TOTP esta habilitado en Supabase Auth.
- Auth: revisar rate limits y protecciones anti-abuso.
- API keys: no usar nunca `Secret key` ni `service_role` en Expo.
- Database: revisar que las tablas nuevas siempre tengan RLS antes de usarlas desde la app.

## Antes de publicar

- Probar recuperacion de contrasena con el deep link final.
- Probar bloqueo biometrico en un build real de iOS/Android, no solo Expo Go.
- Revisar `npm audit` y actualizar Expo cuando haya parche compatible sin romper la version del SDK.
- Preparar politica de privacidad propia de MyWorkday antes de App Store y Play Store.
