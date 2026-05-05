# Checklist de cambio a MyJornia

Usa esta lista despues de subir el commit con el rebranding.

## 1. GitHub

### Renombrar repositorio

En GitHub:

1. Entra en `https://github.com/jairopanait/MyWorkday`.
2. Ve a `Settings`.
3. En `Repository name`, cambia `MyWorkday` por `MyJornia`.
4. Pulsa `Rename`.

Despues, en PowerShell dentro del proyecto:

```powershell
cd "C:\Users\panai\MyJornia"
git remote set-url origin https://github.com/jairopanait/MyJornia.git
git remote -v
```

### Activar GitHub Pages

En el repositorio `MyJornia`:

1. Ve a `Settings > Pages`.
2. En `Build and deployment`, elige `Deploy from a branch`.
3. Branch: `main`.
4. Folder: `/docs`.
5. Guarda.

URLs esperadas sin dominio propio:

```txt
https://jairopanait.github.io/MyJornia/privacidad/
https://jairopanait.github.io/MyJornia/eliminar-cuenta/
```

URLs finales con dominio propio:

```txt
https://myjornia.app/privacidad/
https://myjornia.app/eliminar-cuenta/
```

## 2. Dominio myjornia.app

Cuando compres `myjornia.app`, configura estos DNS para GitHub Pages:

```txt
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    jairopanait.github.io
```

En GitHub Pages, el dominio personalizado debe ser:

```txt
myjornia.app
```

Despues activa `Enforce HTTPS`.

## 3. Supabase

En Supabase Dashboard:

1. Entra en tu proyecto.
2. Ve a `Authentication > URL Configuration`.
3. Cambia o añade estos redirects:

```txt
myjornia://password-reset
https://myjornia.app
https://myjornia.app/privacidad/
https://myjornia.app/eliminar-cuenta/
```

4. Si tienes todavia redirects antiguos de MyWorkday, eliminalos cuando hayas probado el nuevo enlace.

### Variables de la app

Tu `.env` debe tener:

```txt
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=myjornia://password-reset
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://myjornia.app/privacidad/
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://myjornia.app/eliminar-cuenta/
```

### Base de datos

No hay que renombrar tablas. Nombres como `work_rules` describen reglas laborales, no la marca. Renombrarlas ahora romperia consultas, RLS y migraciones sin beneficio real.

Si quieres dejar la base de datos "limpia" a nivel visible:

1. Ejecuta `supabase-security-hardening.sql` si todavia no lo has hecho.
2. Comprueba que el usuario admin sigue en `public.app_admins`.
3. Mantén el proyecto Supabase con nombre visible `MyJornia` en `Project Settings > General`.

## 4. Renombrar carpeta local

Cierra VS Code y servidores Expo. Luego abre PowerShell:

```powershell
cd "C:\Users\panai"
Rename-Item -LiteralPath ".\MyWorkday" -NewName "MyJornia"
cd ".\MyJornia"
npm install
npx expo start --clear
```

Si GitHub ya esta renombrado:

```powershell
git remote set-url origin https://github.com/jairopanait/MyJornia.git
```

## 5. App Store y Play Store

Identificadores ya preparados en `app.json`:

```txt
iOS bundleIdentifier: app.myjornia.mobile
Android package: app.myjornia.mobile
```

No los cambies despues de publicar salvo que sea estrictamente necesario.
