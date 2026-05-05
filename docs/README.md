# Publicacion de las paginas legales

Estas paginas estan preparadas para GitHub Pages.

## URLs esperadas

Si activas GitHub Pages desde la carpeta `docs`, las rutas seran:

- `https://jairopanait.github.io/MyJornia/privacidad/`
- `https://jairopanait.github.io/MyJornia/eliminar-cuenta/`

Con un dominio propio configurado, quedarian asi:

- `https://myjornia.app/privacidad/`
- `https://myjornia.app/eliminar-cuenta/`

## Pasos en GitHub

1. Sube los cambios al repositorio.
2. En GitHub, entra en `Settings`.
3. Ve a `Pages`.
4. En `Build and deployment`, elige `Deploy from a branch`.
5. En `Branch`, selecciona `main` y carpeta `/docs`.
6. Guarda.
7. Copia la URL que GitHub te muestre y usala en App Store Connect y Play Console.

## Dominio propio

Cuando compres o configures `myjornia.app`, ya tienes un archivo `CNAME` dentro de `docs` con este contenido:

```txt
myjornia.app
```

Despues configura el DNS siguiendo las instrucciones de GitHub Pages.
