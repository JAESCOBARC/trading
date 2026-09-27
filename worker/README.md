# Acceso con usuario y contraseña (Cloudflare Worker)

`acceso.js` se pone delante de `trading.jhonyescobar.com`. Sin sesión, cualquier página redirige a
`/acceso/login`. Incluye panel de administración para crear, borrar y cambiar la contraseña de usuarios.

- Contraseñas con PBKDF2-SHA256 (100.000 iteraciones, sal aleatoria). Nunca se guardan en claro ni en el repositorio.
- Sesiones de 30 días en cookie `HttpOnly; Secure; SameSite=Lax`.
- Bloqueo tras 10 intentos fallidos por IP durante 15 minutos.
- Quedan públicas solo las imágenes de vista previa (`/assets/og/`), los iconos, `robots.txt` y el manifest.

## Instalación (una sola vez, en el panel de Cloudflare)

0. Si creaste una aplicación en **Zero Trust → Access**, bórrala para no tener dos logins.
1. **Storage & Databases → KV → Create**: nombre `mesa-acceso`.
2. **Workers & Pages → Create → Worker** (plantilla "Hello World"): nombre `mesa-acceso` → **Deploy**.
3. **Edit code**: borra todo, pega el contenido de `worker/acceso.js` → **Deploy**.
4. En el Worker, **Settings → Bindings → Add → KV namespace**: nombre de variable `AUTH`, espacio `mesa-acceso`.
5. **Settings → Variables and Secrets → Add**: tipo **Secret**, nombre `SETUP_KEY`, valor = una frase larga que solo tú sepas.
6. **Settings → Domains & Routes → Add → Route**: zona `jhonyescobar.com`, ruta `trading.jhonyescobar.com/*`.
   Tiene que ser **Route**, no "Custom domain" (eso sustituiría a GitHub Pages).
7. Abre `https://trading.jhonyescobar.com/acceso/setup`, escribe la `SETUP_KEY`, tu usuario y contraseña.
   Entras directamente al panel `/acceso/admin`, donde creas el resto de usuarios.

Para actualizar el Worker: repetir el paso 3 con la nueva versión de `acceso.js`. Los usuarios se conservan (están en KV).

## Rutas

| Ruta | Uso |
|---|---|
| `/acceso/setup` | Crear el primer administrador (se desactiva cuando existe un usuario) |
| `/acceso/login` | Iniciar sesión |
| `/acceso/logout` | Cerrar sesión |
| `/acceso/admin` | Panel de usuarios (solo administradores) |
| `/acceso/cuenta` | Cambiar la contraseña propia |
