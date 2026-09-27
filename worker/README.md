# Acceso con usuario y contraseña (Cloudflare Worker)

`acceso.js` se pone delante de `trading.jhonyescobar.com`. Sin sesión, cualquier página redirige a
`/acceso/login`. Incluye panel de administración para crear, borrar y cambiar la contraseña de usuarios.

- Contraseñas con PBKDF2-SHA256 (100.000 iteraciones, sal aleatoria). Nunca se guardan en claro ni en el repositorio.
- Sesiones de 30 días en cookie `HttpOnly; Secure; SameSite=Lax`.
- Bloqueo tras 10 intentos fallidos por IP durante 15 minutos.
- Quedan públicas solo las imágenes de vista previa (`/assets/og/`), los iconos, `robots.txt` y el manifest.

## Instalación (una sola vez, en el panel de Cloudflare en español)

Nombres de menú en español con el original en inglés entre paréntesis (traducción aproximada: la interfaz cambia).

0. **Zero Trust → Acceso (Access) → Aplicaciones (Applications)**: si existe "Mesa de Estudio", **Eliminar (Delete)**.
1. **Almacenamiento y bases de datos (Storage & Databases) → KV → Crear (Create)**: nombre `mesa-acceso`.
2. **Workers y Pages (Workers & Pages) → Crear (Create) → Worker**, plantilla "Hello World", nombre `mesa-acceso` → **Implementar (Deploy)**.
3. **Editar código (Edit code)**: borra todo, pega el contenido de `worker/acceso.js` → **Implementar (Deploy)**.
4. **Configuración (Settings) → Enlaces (Bindings) → Añadir (Add) → Espacio de nombres KV (KV namespace)**:
   nombre de variable `AUTH`, espacio `mesa-acceso`.
5. **Configuración (Settings) → Variables y secretos (Variables and Secrets) → Añadir (Add)**: tipo **Secreto (Secret)**,
   nombre `SETUP_KEY`, valor = una frase larga que solo tú sepas.
6. **Configuración (Settings) → Dominios y rutas (Domains & Routes) → Añadir (Add) → Ruta (Route)**:
   zona `jhonyescobar.com`, ruta `trading.jhonyescobar.com/*`.
   Tiene que ser **Ruta (Route)**, no **Dominio personalizado (Custom domain)**: eso sustituiría a GitHub Pages.
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
