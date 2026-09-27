# Acceso con usuario y contraseña (Cloudflare Worker)

`acceso.js` se pone delante de `trading.jhonyescobar.com`. Sin sesión, cualquier página redirige a
`/acceso/login`. Incluye panel de administración para crear, borrar y cambiar la contraseña de usuarios.

- Contraseñas con PBKDF2-SHA256 (100.000 iteraciones, sal aleatoria). Nunca se guardan en claro ni en el repositorio.
- Sesiones de 30 días en cookie `HttpOnly; Secure; SameSite=Lax`.
- Bloqueo tras 10 intentos fallidos por IP durante 15 minutos.
- Quedan públicas solo las imágenes de vista previa (`/assets/og/`), los iconos, `robots.txt` y el manifest.

## Instalación (una sola vez, en el panel de Cloudflare en español)

Nombres de menú tal como aparecen en el panel en español (comprobados en septiembre de 2026).

0. **Zero Trust → Acceso → Aplicaciones**: si existe una aplicación para `trading`, eliminarla.
1. Desde **Inicio de la cuenta**: **Desarrollo → Almacenamiento y bases de datos → Workers KV → Crear**: nombre `mesa-acceso`.
   (No confundir con "Almacenamiento y caché", que es la caché del dominio.)
2. **Desarrollo → Cómputo → Workers y Pages → Crear → Worker** ("Deploy Hello World"): nombre `mesa-acceso`,
   sin activar "Protect with Cloudflare Access" → **Implementar**.
3. **Editar código**: borra todo y pega `worker/acceso.js` completo desde
   `https://raw.githubusercontent.com/JAESCOBARC/trading/main/worker/acceso.js` → **Implementar**.
4. Worker → pestaña **Configuración → Vinculaciones → Agregar vinculación → Espacio de nombres KV**:
   nombre de variable `AUTH`, espacio `mesa-acceso`.
5. Misma pantalla, **Runtime variables and secrets → Agregar variable**: tipo **Secreto**, nombre `SETUP_KEY`,
   valor = una frase larga que solo tú sepas.
6. Worker → pestaña **Dominios → Añadir ruta** (no "Añadir dominio"): zona `jhonyescobar.com`,
   ruta `trading.jhonyescobar.com/*`. En esa misma pestaña, desactivar `workers.dev` y "Vista previa".
7. Abre `https://trading.jhonyescobar.com/acceso/setup`, escribe la `SETUP_KEY`, tu usuario y contraseña.
   Entras directamente al panel `/acceso/admin`, donde creas el resto de usuarios.

Para actualizar el Worker: repetir el paso 3 (Editar código → pegar → Implementar) con la nueva versión de `acceso.js`. Los usuarios se conservan (están en KV).

## Rutas

| Ruta | Uso |
|---|---|
| `/acceso/setup` | Crear el primer administrador (se desactiva cuando existe un usuario) |
| `/acceso/login` | Iniciar sesión |
| `/acceso/logout` | Cerrar sesión |
| `/acceso/admin` | Panel de usuarios (solo administradores) |
| `/acceso/cuenta` | Cambiar la contraseña propia |
