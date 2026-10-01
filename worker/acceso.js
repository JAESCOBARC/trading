/*
 * Mesa de Estudio · control de acceso (Cloudflare Worker)
 *
 * Se coloca delante de trading.jhonyescobar.com (ruta trading.jhonyescobar.com/*).
 * Sin sesión válida, cualquier página redirige a /acceso/login. Con sesión, la petición
 * pasa tal cual al sitio (GitHub Pages).
 *
 * Necesita en Cloudflare:
 *   - Enlace KV con nombre de variable  AUTH       (usuarios y sesiones)
 *   - Variable o secreto                SETUP_KEY  (clave para crear el primer administrador)
 *
 * Rutas propias:
 *   /acceso/setup   crear el primer administrador (solo mientras no existan usuarios)
 *   /acceso/login   iniciar sesión
 *   /acceso/logout  cerrar sesión
 *   /acceso/admin   panel: crear, borrar y cambiar contraseña de usuarios (solo administradores)
 *   /acceso/cuenta  cambiar la contraseña propia
 *   /acceso/datos/:ns  API JSON privada por usuario (GET lee, PUT guarda) para que páginas del
 *                   sitio guarden datos propios (p. ej. las plantillas de interés compuesto, ns=ic)
 *                   y sobrevivan a un borrado de caché del navegador. Requiere sesión; no es pública.
 *
 * Las contraseñas se guardan con PBKDF2-SHA256 (100.000 iteraciones, sal aleatoria), nunca en claro.
 */

const COOKIE = 'mesa_sid';
const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000;
const MAX_ATTEMPTS = 10;          // intentos fallidos por IP
const ATTEMPT_WINDOW = 15 * 60;   // en 15 minutos
const PUBLIC_PREFIXES = ['/assets/og/', '/assets/icons/'];
const PUBLIC_PATHS = ['/robots.txt', '/site.webmanifest'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!env.AUTH) return page('Configuración incompleta', '<p>Falta el enlace KV con el nombre <code>AUTH</code> en el Worker.</p>', 500);

    if (path.startsWith('/acceso/') || path === '/acceso') {
      const had = getCookie(request, CSRF_COOKIE);
      const csrf = had && /^[A-Za-z0-9_-]{20,64}$/.test(had) ? had : randomId(24);
      let res;
      try { res = await route(request, env, url, csrf); }
      catch (e) { res = page('Error', '<p>Ha ocurrido un error inesperado. Vuelve a intentarlo.</p>', 500); }
      return withCsrf(res, csrf, csrf !== had);
    }

    if (PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return fetch(request);

    const user = await currentUser(request, env);
    if (!user) {
      const next = path + url.search;
      return redirect('/acceso/login?next=' + encodeURIComponent(next));
    }
    const res = await fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    out.headers.set('Cache-Control', 'private, no-store');
    return out;
  }
};

/* ---------------- rutas ---------------- */

async function route(request, env, url, csrf) {
  const path = url.pathname.replace(/\/+$/, '') || '/acceso';
  const method = request.method;

  /* API JSON privada (fetch, no formularios): su propia validación, no el flujo de formularios de abajo. */
  if (path.startsWith('/acceso/datos/')) {
    const user = await currentUser(request, env);
    if (!user) return json({ error: 'No has iniciado sesión.' }, 401);
    return datos(request, env, user, url);
  }

  if (method === 'POST') {
    const check = await csrfCheck(request, url, csrf);
    if (check) return page('Petición rechazada', '<p>' + esc(check) + '</p><p class="muted">Recarga la página del formulario y vuelve a enviarlo.</p><p><a class="btn ghost" href="' + esc(url.pathname) + '">Volver a intentarlo</a></p>', 403);
  }

  if (path === '/acceso/setup') return setup(request, env, method);
  if (path === '/acceso/login') return login(request, env, url, method);
  if (path === '/acceso/logout') return logout(request, env);

  const user = await currentUser(request, env);
  if (!user) return redirect('/acceso/login?next=' + encodeURIComponent(url.pathname));

  if (path === '/acceso/cuenta') return account(request, env, user, method);
  if (path === '/acceso/admin') {
    if (user.role !== 'admin') return page('Sin permiso', '<p>Esta página es solo para administradores.</p><p><a class="btn ghost" href="/">Volver al sitio</a></p>', 403);
    return admin(request, env, user, method, url);
  }
  return redirect('/');
}

async function setup(request, env, method) {
  if (await hasUsers(env)) return page('Ya configurado', '<p>El administrador ya existe. <a href="/acceso/login">Inicia sesión</a>.</p>');
  if (!env.SETUP_KEY) return page('Falta la clave', '<p>Añade en el Worker la variable <code>SETUP_KEY</code> antes de crear el administrador.</p>', 500);
  let msg = '';
  if (method === 'POST') {
    const f = await request.formData();
    const key = String(f.get('key') || ''), u = normUser(f.get('user')), p1 = String(f.get('pass') || ''), p2 = String(f.get('pass2') || '');
    if (!safeEqual(key, String(env.SETUP_KEY))) msg = 'La clave de configuración no es correcta.';
    else if (!u) msg = usernameRule;
    else if (p1.length < 10) msg = 'La contraseña debe tener al menos 10 caracteres.';
    else if (p1 !== p2) msg = 'Las contraseñas no coinciden.';
    else {
      await saveUser(env, u, p1, 'admin');
      const sid = await createSession(env, u);
      return redirect('/acceso/admin?ok=' + encodeURIComponent('Administrador ' + u + ' creado.'), sessionCookie(sid));
    }
  }
  return page('Crear administrador', `
    <p class="muted">Primer paso: crea tu usuario administrador. Esta página se desactiva en cuanto exista un usuario.</p>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <form method="post" class="form">
      <label>Clave de configuración (SETUP_KEY)<input name="key" type="password" required autocomplete="off"></label>
      <label>Usuario<input name="user" required autocomplete="username" pattern="[a-zA-Z0-9._-]{3,32}"></label>
      <label>Contraseña (mín. 10 caracteres)<input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
      <label>Repite la contraseña<input name="pass2" type="password" required minlength="10" autocomplete="new-password"></label>
      <button class="btn" type="submit">Crear administrador</button>
    </form>`);
}

async function login(request, env, url, method) {
  if (!(await hasUsers(env))) return redirect('/acceso/setup');
  const next = safeNext(url.searchParams.get('next'));
  let msg = '';
  if (method === 'POST') {
    const ip = request.headers.get('CF-Connecting-IP') || 'x';
    const key = 'try:' + ip;
    const tries = parseInt((await env.AUTH.get(key)) || '0', 10);
    if (tries >= MAX_ATTEMPTS) {
      msg = 'Demasiados intentos. Espera 15 minutos.';
    } else {
      const f = await request.formData();
      const u = normUser(f.get('user')), p = String(f.get('pass') || '');
      const rec = u ? await getUser(env, u) : null;
      if (rec && (await verify(p, rec))) {
        await env.AUTH.delete(key);
        const sid = await createSession(env, u);
        return redirect(safeNext(f.get('next')) || '/', sessionCookie(sid));
      }
      await env.AUTH.put(key, String(tries + 1), { expirationTtl: ATTEMPT_WINDOW });
      msg = 'Usuario o contraseña incorrectos.';
    }
  }
  return page('Iniciar sesión', `
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <form method="post" class="form">
      <input type="hidden" name="next" value="${esc(next || '/')}">
      <label>Usuario<input name="user" required autocomplete="username" autofocus></label>
      <label>Contraseña<input name="pass" type="password" required autocomplete="current-password"></label>
      <button class="btn" type="submit">Entrar</button>
    </form>`, 200, { hideTitle: false });
}

async function logout(request, env) {
  const sid = getCookie(request, COOKIE);
  if (sid) await env.AUTH.delete('sess:' + sid);
  return redirect('/acceso/login', COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
}

async function account(request, env, user, method) {
  let msg = '', ok = '';
  if (method === 'POST') {
    const f = await request.formData();
    const cur = String(f.get('cur') || ''), p1 = String(f.get('pass') || ''), p2 = String(f.get('pass2') || '');
    const rec = await getUser(env, user.name);
    if (!rec || !(await verify(cur, rec))) msg = 'La contraseña actual no es correcta.';
    else if (p1.length < 10) msg = 'La nueva contraseña debe tener al menos 10 caracteres.';
    else if (p1 !== p2) msg = 'Las contraseñas nuevas no coinciden.';
    else { await saveUser(env, user.name, p1, rec.role, rec.created); ok = 'Contraseña cambiada.'; }
  }
  return page('Mi cuenta', `
    <p class="muted">Sesión iniciada como <b>${esc(user.name)}</b> (${user.role === 'admin' ? 'administrador' : 'usuario'}).</p>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}${ok ? `<p class="ok">${esc(ok)}</p>` : ''}
    <form method="post" class="form">
      <label>Contraseña actual<input name="cur" type="password" required autocomplete="current-password"></label>
      <label>Nueva contraseña (mín. 10 caracteres)<input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
      <label>Repite la nueva contraseña<input name="pass2" type="password" required minlength="10" autocomplete="new-password"></label>
      <button class="btn" type="submit">Cambiar contraseña</button>
    </form>
    <p class="links"><a href="/">Volver al sitio</a>${user.role === 'admin' ? ' · <a href="/acceso/admin">Administración</a>' : ''} · <a href="/acceso/logout">Cerrar sesión</a></p>`);
}

async function admin(request, env, user, method, url) {
  let msg = '', ok = url.searchParams.get('ok') || '';
  if (method === 'POST') {
    const f = await request.formData();
    const action = String(f.get('action') || '');
    const u = normUser(f.get('user'));
    if (action === 'create') {
      const p = String(f.get('pass') || ''), role = f.get('role') === 'admin' ? 'admin' : 'user';
      if (!u) msg = usernameRule;
      else if (await getUser(env, u)) msg = 'Ya existe un usuario con ese nombre.';
      else if (p.length < 10) msg = 'La contraseña debe tener al menos 10 caracteres.';
      else { await saveUser(env, u, p, role); ok = 'Usuario ' + u + ' creado.'; }
    } else if (action === 'reset') {
      const p = String(f.get('pass') || ''), rec = u ? await getUser(env, u) : null;
      if (!rec) msg = 'Ese usuario no existe.';
      else if (p.length < 10) msg = 'La contraseña debe tener al menos 10 caracteres.';
      else { await saveUser(env, u, p, rec.role, rec.created); await dropSessions(env, u); ok = 'Contraseña de ' + u + ' cambiada; sus sesiones se han cerrado.'; }
    } else if (action === 'delete') {
      const rec = u ? await getUser(env, u) : null;
      if (!rec) msg = 'Ese usuario no existe.';
      else if (u === user.name) msg = 'No puedes borrar tu propio usuario.';
      else if (rec.role === 'admin' && (await countAdmins(env)) <= 1) msg = 'No puedes borrar el último administrador.';
      else { await env.AUTH.delete('user:' + u); await dropSessions(env, u); ok = 'Usuario ' + u + ' borrado.'; }
    }
  }
  const users = await listUsers(env);
  const rows = users.map((x) => `
    <tr>
      <td><b>${esc(x.name)}</b>${x.name === user.name ? ' <span class="tag">tú</span>' : ''}</td>
      <td>${x.role === 'admin' ? '<span class="tag lime">admin</span>' : '<span class="tag">usuario</span>'}</td>
      <td class="mono">${esc((x.created || '').slice(0, 10))}</td>
      <td>
        <form method="post" class="inline"><input type="hidden" name="action" value="reset"><input type="hidden" name="user" value="${esc(x.name)}">
          <input name="pass" type="password" placeholder="Nueva contraseña" minlength="10" required autocomplete="new-password"><button class="btn ghost sm" type="submit">Cambiar</button></form>
      </td>
      <td>${x.name === user.name ? '' : `<form method="post" class="inline" onsubmit="return confirm('¿Borrar el usuario ${esc(x.name)}?')"><input type="hidden" name="action" value="delete"><input type="hidden" name="user" value="${esc(x.name)}"><button class="btn danger sm" type="submit">Borrar</button></form>`}</td>
    </tr>`).join('');
  return page('Administración', `
    <p class="muted">Sesión: <b>${esc(user.name)}</b> · <a href="/">Volver al sitio</a> · <a href="/acceso/cuenta">Mi contraseña</a> · <a href="/acceso/logout">Cerrar sesión</a></p>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}${ok ? `<p class="ok">${esc(ok)}</p>` : ''}
    <h2>Crear usuario</h2>
    <form method="post" class="form grid">
      <input type="hidden" name="action" value="create">
      <label>Usuario<input name="user" required pattern="[a-zA-Z0-9._-]{3,32}" autocomplete="off"></label>
      <label>Contraseña (mín. 10)<input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
      <label>Rol<select name="role"><option value="user">Usuario</option><option value="admin">Administrador</option></select></label>
      <button class="btn" type="submit">Crear</button>
    </form>
    <h2>Usuarios (${users.length})</h2>
    <div class="table"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Alta</th><th>Contraseña</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`, 200, { wide: true });
}

const DATA_NS = /^\/acceso\/datos\/([a-z0-9_-]{1,40})$/;
const MAX_DATA_BYTES = 200000; // 200 KB por usuario y espacio de nombres: de sobra para unas plantillas

async function datos(request, env, user, url) {
  const m = url.pathname.replace(/\/+$/, '').match(DATA_NS);
  if (!m) return json({ error: 'Ruta no válida.' }, 404);
  const key = 'data:' + user.name + ':' + m[1];

  if (request.method === 'GET') {
    const raw = await env.AUTH.get(key);
    return json({ data: raw ? JSON.parse(raw) : null });
  }
  if (request.method === 'PUT' || request.method === 'POST') {
    const o = request.headers.get('Origin');
    if (o && o !== 'null' && o !== url.origin) return json({ error: 'Origen no permitido.' }, 403);
    const body = await request.text();
    if (body.length > MAX_DATA_BYTES) return json({ error: 'Los datos superan el límite (200 KB).' }, 413);
    try { JSON.parse(body); } catch (e) { return json({ error: 'JSON no válido.' }, 400); }
    await env.AUTH.put(key, body);
    return json({ ok: true });
  }
  return json({ error: 'Método no permitido.' }, 405);
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

/* ---------------- usuarios y sesiones ---------------- */

const usernameRule = 'El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.';
function normUser(v) { const s = String(v || '').trim().toLowerCase(); return /^[a-z0-9._-]{3,32}$/.test(s) ? s : ''; }
async function getUser(env, u) { const r = await env.AUTH.get('user:' + u); return r ? JSON.parse(r) : null; }
async function hasUsers(env) { const l = await env.AUTH.list({ prefix: 'user:', limit: 1 }); return l.keys.length > 0; }
async function listUsers(env) {
  const out = []; let cursor;
  do {
    const l = await env.AUTH.list({ prefix: 'user:', cursor });
    for (const k of l.keys) { const r = await getUser(env, k.name.slice(5)); if (r) out.push({ name: k.name.slice(5), role: r.role, created: r.created }); }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
async function countAdmins(env) { return (await listUsers(env)).filter((x) => x.role === 'admin').length; }
async function saveUser(env, u, pass, role, created) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(pass, salt);
  await env.AUTH.put('user:' + u, JSON.stringify({ salt: b64(salt), hash: b64(hash), iter: PBKDF2_ITER, role: role, created: created || new Date().toISOString() }));
}
async function verify(pass, rec) {
  const hash = await pbkdf2(pass, unb64(rec.salt), rec.iter || PBKDF2_ITER);
  return safeEqual(b64(hash), rec.hash);
}
async function pbkdf2(pass, salt, iter) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter || PBKDF2_ITER }, key, 256);
  return new Uint8Array(bits);
}
async function createSession(env, u) {
  const sid = randomId(32);
  await env.AUTH.put('sess:' + sid, JSON.stringify({ u: u, t: Date.now() }), { expirationTtl: SESSION_DAYS * 86400 });
  return sid;
}
async function currentUser(request, env) {
  const sid = getCookie(request, COOKIE);
  if (!sid || !/^[A-Za-z0-9_-]{20,64}$/.test(sid)) return null;
  const s = await env.AUTH.get('sess:' + sid);
  if (!s) return null;
  const { u } = JSON.parse(s);
  const rec = await getUser(env, u);
  return rec ? { name: u, role: rec.role } : null;
}
async function dropSessions(env, u) {
  let cursor;
  do {
    const l = await env.AUTH.list({ prefix: 'sess:', cursor });
    for (const k of l.keys) { const s = await env.AUTH.get(k.name); if (s && JSON.parse(s).u === u) await env.AUTH.delete(k.name); }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
}

/* ---------------- utilidades ---------------- */

function sessionCookie(sid) { return `${COOKIE}=${sid}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`; }
function getCookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}
/* Anti-CSRF: token en cookie (SameSite=Lax) + campo oculto en cada formulario.
   Solo se rechaza un Origin explícito de otro sitio; un Origin vacío o "null" se acepta si el token coincide. */
const CSRF_COOKIE = 'mesa_csrf';
async function csrfCheck(request, url, csrf) {
  const o = request.headers.get('Origin');
  if (o && o !== 'null' && o !== url.origin) return 'El formulario viene de otro sitio (origen recibido: ' + o + '; esperado: ' + url.origin + ').';
  let sent = '';
  try { sent = String((await request.clone().formData()).get('_csrf') || ''); } catch (e) { sent = ''; }
  const had = getCookie(request, CSRF_COOKIE);
  if (!had || !sent || !safeEqual(sent, had) || sent !== csrf) return 'El formulario ha caducado o no tiene el código de seguridad.';
  return '';
}
async function withCsrf(res, csrf, setCookie) {
  const type = res.headers.get('Content-Type') || '';
  let out = res;
  if (type.startsWith('text/html')) {
    const html = (await res.text()).replace(/<form method="post"([^>]*)>/g, '<form method="post"$1><input type="hidden" name="_csrf" value="' + csrf + '">');
    out = new Response(html, { status: res.status, headers: res.headers });
  } else {
    out = new Response(res.body, res);
  }
  if (setCookie) out.headers.append('Set-Cookie', CSRF_COOKIE + '=' + csrf + '; Path=/acceso; HttpOnly; Secure; SameSite=Lax');
  return out;
}
function randomId(n) {
  return b64(crypto.getRandomValues(new Uint8Array(n))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]);
}
function safeNext(v) { const s = String(v || ''); return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/acceso/') ? s : ''; }
function safeEqual(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
function b64(bytes) { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); }
function unb64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function redirect(to, cookie) {
  const h = new Headers({ Location: to, 'Cache-Control': 'no-store' });
  if (cookie) h.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers: h });
}

function page(title, body, status, opts) {
  opts = opts || {};
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(title)} · Mesa de Estudio</title>
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#0A0B0C;--panel:#121417;--panel2:#171A1E;--line:#23272C;--line2:#30353B;--ink:#EEF0F2;--ink2:#A6ACB3;--ink3:#6C737B;--lime:#9BE22D;--red:#F2565B;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(900px 520px at 22% -8%,rgba(255,255,255,.10),transparent 62%),var(--bg);color:var(--ink);font:15px/1.6 Inter,-apple-system,"Segoe UI",Roboto,sans-serif;padding:48px 20px}
.box{max-width:${opts.wide ? '980px' : '420px'};margin:0 auto;display:flex;flex-direction:column;gap:18px}
.brand{font:800 18px/1 "Inter Tight",Inter,sans-serif;color:var(--lime);display:flex;align-items:center;gap:10px;text-decoration:none;letter-spacing:-.02em}
.brand img{width:30px;height:30px}
h1{font:800 34px/1.05 "Inter Tight",Inter,sans-serif;letter-spacing:-.03em;margin:8px 0 0}
h2{font:700 20px/1.2 "Inter Tight",Inter,sans-serif;letter-spacing:-.02em;margin:18px 0 0}
p{margin:0}.muted{color:var(--ink2)}a{color:var(--lime)}
.form{display:flex;flex-direction:column;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px}
.form.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end}
@media(max-width:760px){.form.grid{grid-template-columns:1fr}}
label{display:flex;flex-direction:column;gap:5px;font:500 11px/1.3 "JetBrains Mono",monospace;color:var(--ink3);letter-spacing:.04em}
input,select{background:#0E1012;color:var(--ink);border:1px solid var(--line2);border-radius:8px;font:14px "JetBrains Mono",monospace;padding:10px 12px;width:100%}
input:focus,select:focus{outline:none;border-color:var(--lime)}
.btn{display:inline-flex;justify-content:center;align-items:center;background:var(--lime);color:#0B1004;border:1px solid transparent;border-radius:8px;font:700 12.5px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:13px 20px;cursor:pointer;text-decoration:none;white-space:nowrap}
.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line2)}.btn.danger{background:transparent;color:var(--red);border-color:rgba(242,86,91,.5)}
.btn.sm{padding:8px 12px;font-size:11px}
.err{background:rgba(242,86,91,.13);border:1px solid rgba(242,86,91,.4);color:#ffb3b5;border-radius:8px;padding:10px 12px}
.ok{background:rgba(155,226,45,.12);border:1px solid rgba(155,226,45,.4);color:var(--lime);border-radius:8px;padding:10px 12px}
.table{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
table{width:100%;border-collapse:collapse;min-width:720px}th,td{padding:10px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
th{font:500 10.5px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);background:var(--panel2)}
tr:last-child td{border-bottom:none}.mono{font-family:"JetBrains Mono",monospace;color:var(--ink2)}
.inline{display:flex;gap:6px;align-items:center}.inline input{width:170px;padding:7px 10px;font-size:12.5px}
.tag{font:500 11px "JetBrains Mono",monospace;border:1px solid var(--line2);border-radius:99px;padding:2px 8px;color:var(--ink2)}.tag.lime{color:var(--lime);border-color:rgba(155,226,45,.4)}
.links{color:var(--ink3)}code{font-family:"JetBrains Mono",monospace;color:var(--lime)}
</style></head><body><div class="box">
<a class="brand" href="/"><img src="/assets/icons/favicon.svg" alt="">Mesa de Estudio</a>
<h1>${esc(title)}</h1>
${body}
</div></body></html>`;
  return new Response(html, { status: status || 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' } });
}
