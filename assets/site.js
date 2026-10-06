/* Mesa de Estudio — utilidades comunes: navegación, lienzos, series de precio,
   indicadores, checklist persistente y calculadora de riesgo. Sin dependencias. */
(function () {
  'use strict';

  var ROOT = (document.body && document.body.getAttribute('data-root')) || './';

  var PAGES = [
    { group: 'Fundamentos', dir: 'fundamentos', items: [
      { href: 'fundamentos/velas-japonesas.html', label: 'Velas japonesas', desc: 'Anatomía y 10 patrones en contexto' },
      { href: 'fundamentos/macd.html', label: 'MACD', desc: 'Cruces, histograma, divergencias' },
      { href: 'fundamentos/wyckoff.html', label: 'Método Wyckoff', desc: 'Leyes, ciclo, Spring y Upthrust' }
    ] },
    { group: 'Estrategias', dir: 'estrategias', items: [
      { href: 'estrategias/orderflow-world-cup.html', label: 'Orderflow World Cup', desc: 'VAL + Golden Pocket + footprint' },
      { href: 'estrategias/tendencial.html', label: 'Tendencial', desc: 'EMA 21 + Fibonacci + vela gatillo' },
      { href: 'estrategias/volumen-overnight.html', label: 'Volumen overnight', desc: 'Saque del área de valor' },
      { href: 'estrategias/little-rizzy.html', label: 'Little Rizzy', desc: 'Distancia D sobre la directriz' }
    ] },
    { group: 'Recursos', dir: 'recursos', items: [
      { href: 'recursos/interes-compuesto.html', label: 'Interés compuesto', desc: 'Riesgo, winrate, R:B y retiros parciales' },
      { href: 'recursos/registro-trading.html', label: 'Registro de trading', desc: 'App de AppSheet para anotar operaciones' },
      { href: 'recursos/mapas-mercado.html', label: 'Mapas de mercado', desc: 'Heatmaps de Finviz: sectores y futuros' }
    ] }
  ];

  function renderChrome() {
    var top = document.getElementById('topbar');
    if (top) {
      var here = location.pathname.replace(/\\/g, '/');
      var isHome = !PAGES.some(function (g) { return here.indexOf('/' + g.dir + '/') >= 0; });
      var html = '<div class="wrap"><a class="brand" href="' + ROOT + 'index.html">Mesa de Estudio</a><nav class="nav" aria-label="Secciones">';
      html += '<a class="nav-link" href="' + ROOT + 'index.html"' + (isHome ? ' aria-current="page"' : '') + '>Inicio</a>';
      PAGES.forEach(function (g) {
        var inGroup = here.indexOf('/' + g.dir + '/') >= 0;
        html += '<details class="menu"><summary' + (inGroup ? ' class="on"' : '') + '>' + g.group + '</summary><div class="menu-pop">';
        g.items.forEach(function (it) {
          var cur = here.endsWith('/' + it.href);
          html += '<a href="' + ROOT + it.href + '"' + (cur ? ' aria-current="page"' : '') + '><b>' + it.label + '</b><span>' + it.desc + '</span></a>';
        });
        html += '</div></details>';
      });
      html += '</nav></div>';
      top.className = 'topbar';
      top.innerHTML = html;
      var menus = top.querySelectorAll('details.menu');
      menus.forEach(function (m) {
        m.addEventListener('toggle', function () { if (m.open) menus.forEach(function (o) { if (o !== m) o.open = false; }); });
      });
      document.addEventListener('click', function (e) { menus.forEach(function (m) { if (!m.contains(e.target)) m.open = false; }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menus.forEach(function (m) { m.open = false; }); });
    }
    var foot = document.getElementById('foot');
    if (foot) {
      foot.className = 'foot';
      foot.innerHTML = '<div class="wrap"><span>Mesa de Estudio · material de estudio personal. No es asesoría de inversión: los simuladores usan datos de ejemplo.</span><span class="mono"><a href="/acceso/cuenta">Mi cuenta</a> · <a href="/acceso/admin">Administración</a> · <a href="/acceso/logout">Cerrar sesión</a></span></div>';
    }
  }

  /* ---------- números ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fmt(n, d) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    d = d === undefined ? 2 : d;
    var parts = Math.abs(n).toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var neg = n < 0 && +Math.abs(n).toFixed(d) !== 0;
    return (neg ? '-' : '') + parts[0] + (d ? ',' + parts[1] : '');
  }
  function fmtSigned(n, d) { return (n > 0 ? '+' : '') + fmt(n, d); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- indicadores ---------- */
  function ema(values, n) {
    var k = 2 / (n + 1), out = [], prev = null;
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v === null || v === undefined) { out.push(null); continue; }
      prev = prev === null ? v : v * k + prev * (1 - k);
      out.push(prev);
    }
    return out;
  }
  function sma(values, n) {
    return values.map(function (_, i) {
      if (i < n - 1) return null;
      var s = 0; for (var j = i - n + 1; j <= i; j++) s += values[j];
      return s / n;
    });
  }
  function bollinger(values, n, k) {
    return values.map(function (_, i) {
      var start = Math.max(0, i - n + 1), sl = values.slice(start, i + 1);
      var m = sl.reduce(function (a, b) { return a + b; }, 0) / sl.length;
      var v = sl.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / sl.length;
      var sd = Math.sqrt(v);
      return { mid: m, up: m + k * sd, lo: m - k * sd };
    });
  }
  function atr(candles, n) {
    var tr = candles.map(function (c, i) {
      var pc = i ? candles[i - 1].c : c.o;
      return Math.max(c.h - c.l, Math.abs(c.h - pc), Math.abs(c.l - pc));
    });
    return ema(tr, n);
  }

  /* Genera velas OHLC que pasan por los puntos de paso [[índice, cierre], ...]. */
  function candlesFromPath(points, opts) {
    opts = opts || {};
    var r = rng(opts.seed || 7), noise = opts.noise || 1, wick = opts.wick || 1.5, tick = opts.tick || 0.25;
    var n = points[points.length - 1][0] + 1, closes = [];
    for (var p = 0; p < points.length - 1; p++) {
      var a = points[p], b = points[p + 1];
      for (var i = a[0]; i < b[0]; i++) closes[i] = a[1] + (b[1] - a[1]) * (i - a[0]) / (b[0] - a[0]);
    }
    closes[n - 1] = points[points.length - 1][1];
    var round = function (v) { return Math.round(v / tick) * tick; };
    var out = [], prev = opts.open !== undefined ? opts.open : closes[0];
    for (var k = 0; k < n; k++) {
      var c = closes[k] + (r() - 0.5) * 2 * noise;
      var o = prev;
      var h = Math.max(o, c) + r() * wick, l = Math.min(o, c) - r() * wick;
      out.push({ o: round(o), h: round(h), l: round(l), c: round(c) });
      prev = c;
    }
    return out;
  }

  /* ---------- lienzo ---------- */
  function canvasStage(canvas, draw) {
    var state = { w: 0, h: 0, ctx: canvas.getContext('2d') };
    function resize() {
      var rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!rect.width || !rect.height) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      state.w = rect.width; state.h = rect.height;
      state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(state);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();
    return { redraw: function () { if (state.w) { state.ctx.clearRect(0, 0, state.w, state.h); draw(state); } }, state: state };
  }
  function scale(d0, d1, r0, r1) {
    var k = (r1 - r0) / ((d1 - d0) || 1);
    var f = function (v) { return r0 + (v - d0) * k; };
    f.invert = function (px) { return d0 + (px - r0) / k; };
    return f;
  }
  function niceTicks(min, max, count) {
    if (!isFinite(min) || !isFinite(max) || max <= min) return [];
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [];
    for (var v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  var C = {
    bg: '#0A0B0C', grid: 'rgba(255,255,255,.05)', axis: '#6C737B', ink: '#EEF0F2', ink2: '#A6ACB3',
    lime: '#9BE22D', limeSoft: 'rgba(155,226,45,.13)', red: '#F2565B', redSoft: 'rgba(242,86,91,.13)',
    amber: '#F2B84B', amberSoft: 'rgba(242,184,75,.12)', blue: '#7FB0FF', blueSoft: 'rgba(127,176,255,.10)'
  };
  function gridY(ctx, area, y, ticks, decimals) {
    ctx.save();
    ctx.font = '10.5px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ticks.forEach(function (t) {
      var py = Math.round(y(t)) + 0.5;
      if (py < area.t || py > area.b) return;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(area.l, py); ctx.lineTo(area.r, py); ctx.stroke();
      ctx.fillStyle = C.axis; ctx.textAlign = 'left';
      ctx.fillText(fmt(t, decimals === undefined ? 0 : decimals), area.r + 6, py);
    });
    ctx.restore();
  }
  function hline(ctx, area, py, color, label, opts) {
    opts = opts || {};
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = opts.width || 1;
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.beginPath(); ctx.moveTo(area.l, Math.round(py) + 0.5); ctx.lineTo(area.r, Math.round(py) + 0.5); ctx.stroke();
    ctx.setLineDash([]);
    if (label) {
      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      var tw = ctx.measureText(label).width;
      var x = opts.left ? area.l + 4 : area.r - tw - 10;
      ctx.fillStyle = 'rgba(10,11,12,.82)';
      ctx.fillRect(x - 4, py - 15, tw + 8, 13);
      ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillText(label, x, py - 5);
    }
    ctx.restore();
  }
  function band(ctx, area, y0, y1, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(area.l, Math.min(y0, y1), area.r - area.l, Math.abs(y1 - y0));
  }
  function drawCandles(ctx, candles, x, y, cw, opts) {
    opts = opts || {};
    var bw = Math.max(1.5, Math.min(14, cw * 0.62));
    candles.forEach(function (c, i) {
      if (!c) return;
      var up = c.c >= c.o, col = up ? C.lime : C.red;
      if (opts.color) col = opts.color(c, i, col) || col;
      var cx = Math.round(x(i)) + 0.5;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, y(c.h)); ctx.lineTo(cx, y(c.l)); ctx.stroke();
      var top = y(Math.max(c.o, c.c)), bot = y(Math.min(c.o, c.c));
      ctx.fillStyle = col;
      ctx.fillRect(cx - bw / 2, top, bw, Math.max(1.2, bot - top));
      if (opts.mark && opts.mark(i)) {
        ctx.strokeStyle = C.ink; ctx.setLineDash([3, 3]);
        ctx.strokeRect(cx - bw / 2 - 4, y(c.h) - 5, bw + 8, y(c.l) - y(c.h) + 10);
        ctx.setLineDash([]);
      }
    });
  }
  function marker(ctx, px, py, color, text, below) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
    if (text) {
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      var tw = ctx.measureText(text).width, ty = below ? py + 18 : py - 10;
      ctx.fillStyle = 'rgba(10,11,12,.85)'; ctx.fillRect(px - tw / 2 - 5, ty - 11, tw + 10, 15);
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, px, ty);
    }
    ctx.restore();
  }

  /* ---------- botones de escenario ---------- */
  function scenarios(container, onSelect) {
    var btns = Array.prototype.slice.call(container.querySelectorAll('[data-scn]'));
    function pick(id) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-scn') === id ? 'true' : 'false'); });
      onSelect(id);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-scn')); }); });
    var first = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || btns[0];
    if (first) pick(first.getAttribute('data-scn'));
    return pick;
  }

  /* ---------- reproductor de velas ---------- */
  function replay(root, total, start, onChange) {
    var range = root.querySelector('input[type=range]'), play = root.querySelector('[data-play]'), label = root.querySelector('[data-label]');
    var timer = null;
    range.min = 0; range.max = total - 1; range.value = start;
    function set(v) {
      range.value = v;
      if (label) label.textContent = 'Vela ' + (+v + 1) + ' / ' + total;
      onChange(+v);
    }
    function stop() { clearInterval(timer); timer = null; play.textContent = '▶ Reproducir'; }
    range.addEventListener('input', function () { stop(); set(+range.value); });
    play.addEventListener('click', function () {
      if (timer) { stop(); return; }
      if (+range.value >= total - 1) set(0);
      play.textContent = '❚❚ Pausa';
      timer = setInterval(function () {
        var v = +range.value + 1;
        if (v >= total) { stop(); return; }
        set(v);
      }, 260);
    });
    set(start);
    return { set: set, reset: function (t, s) { stop(); total = t; range.max = t - 1; set(s); } };
  }

  /* ---------- checklist persistente ---------- */
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function checklist(root) {
    var id = root.getAttribute('data-checklist');
    var key = 'mesa:cl:' + id;
    var boxes = Array.prototype.slice.call(root.querySelectorAll('.cl-item input[type=checkbox]'));
    var meter = root.querySelector('[data-meter]'), count = root.querySelector('[data-count]'), verdict = root.querySelector('[data-verdict]');
    var saved = {};
    try { saved = JSON.parse(store(key) || '{}') || {}; } catch (e) { saved = {}; }
    boxes.forEach(function (b, i) {
      if (!b.id) b.id = id + '-c' + i;
      if (saved[b.id]) b.checked = true;
      b.addEventListener('change', update);
    });
    function update() {
      var state = {}, done = 0, missingKiller = [];
      boxes.forEach(function (b) {
        state[b.id] = b.checked;
        if (b.checked) done++;
        else if (b.closest('.cl-item').classList.contains('killer')) missingKiller.push(b.closest('.cl-item').querySelector('b').textContent);
      });
      store(key, JSON.stringify(state));
      store('mesa:clp:' + id, done + '/' + boxes.length);
      root.querySelectorAll('.cl-group').forEach(function (g) {
        var gb = g.querySelectorAll('input[type=checkbox]'), gd = 0;
        gb.forEach(function (b) { if (b.checked) gd++; });
        var c = g.querySelector('.cl-count');
        if (c) { c.textContent = gd + ' / ' + gb.length; c.classList.toggle('done', gd === gb.length); }
      });
      var pct = boxes.length ? Math.round(done / boxes.length * 100) : 0;
      if (meter) meter.style.width = pct + '%';
      if (count) count.textContent = done + ' / ' + boxes.length + ' · ' + pct + '%';
      if (!verdict) return;
      if (done === boxes.length) {
        verdict.className = 'verdict ok';
        verdict.innerHTML = '<strong>Ejecución autorizada</strong>Todos los puntos están confirmados. Entra con el tamaño calculado y no toques el stop.';
      } else if (missingKiller.length) {
        verdict.className = 'verdict no';
        verdict.innerHTML = '<strong>No operar</strong>Falta un punto obligatorio: ' + missingKiller[0] + (missingKiller.length > 1 ? ' (y ' + (missingKiller.length - 1) + ' más)' : '') + '.';
      } else {
        verdict.className = 'verdict warn';
        verdict.innerHTML = '<strong>Faltan ' + (boxes.length - done) + ' puntos</strong>Los obligatorios están bien. Completa el resto antes de entrar.';
      }
    }
    var reset = root.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); update(); });
    update();
  }

  /* ---------- calculadora de riesgo ---------- */
  var INSTRUMENTS = {
    MNQ: { name: 'Micro Nasdaq-100 (MNQ)', tick: 0.25, tickVal: 0.5, cur: '$' },
    NQ: { name: 'E-mini Nasdaq-100 (NQ)', tick: 0.25, tickVal: 5, cur: '$' },
    MES: { name: 'Micro S&P 500 (MES)', tick: 0.25, tickVal: 1.25, cur: '$' },
    ES: { name: 'E-mini S&P 500 (ES)', tick: 0.25, tickVal: 12.5, cur: '$' },
    FDXS: { name: 'Micro-DAX (FDXS)', tick: 1, tickVal: 1, cur: '€' },
    '6E': { name: 'Euro FX (6E)', tick: 0.00005, tickVal: 6.25, cur: '$' },
    STK: { name: 'Acción (1 unidad)', tick: 0.01, tickVal: 0.01, cur: '$' }
  };
  var risks = {};
  function riskCalc(root) {
    var id = root.getAttribute('data-risk');
    var list = (root.getAttribute('data-instruments') || 'MNQ,NQ').split(',');
    var d = JSON.parse(root.getAttribute('data-defaults') || '{}');
    var hasTp2 = root.hasAttribute('data-tp2');
    var dec = d.decimals === undefined ? 2 : d.decimals;
    var opts = list.map(function (k) { return '<option value="' + k + '">' + INSTRUMENTS[k].name + '</option>'; }).join('');
    root.classList.add('card', 'risk');
    root.innerHTML =
      '<h3 class="card-label">Tamaño de posición</h3>' +
      '<div class="risk-grid">' +
      '<div class="field"><label for="' + id + '-cap">Capital</label><input type="number" id="' + id + '-cap" value="' + (d.capital || 10000) + '" min="0" step="100"></div>' +
      '<div class="field"><label for="' + id + '-pct">Riesgo %</label><input type="number" id="' + id + '-pct" value="' + (d.pct || 1) + '" min="0.1" max="5" step="0.1"></div>' +
      '<div class="field full"><label for="' + id + '-ins">Instrumento</label><select id="' + id + '-ins">' + opts + '</select></div>' +
      '<div class="full seg" role="group" aria-label="Dirección"><button type="button" data-dir="L" aria-pressed="true">LARGO</button><button type="button" data-dir="S" aria-pressed="false">CORTO</button></div>' +
      '<div class="field"><label for="' + id + '-en">Entrada</label><input type="number" id="' + id + '-en" step="any"></div>' +
      '<div class="field"><label for="' + id + '-sl">Stop</label><input type="number" id="' + id + '-sl" step="any"></div>' +
      '<div class="field' + (hasTp2 ? '' : ' full') + '"><label for="' + id + '-t1">' + (hasTp2 ? 'TP1 (50%)' : 'Objetivo') + '</label><input type="number" id="' + id + '-t1" step="any"></div>' +
      (hasTp2 ? '<div class="field"><label for="' + id + '-t2">TP2 (50%)</label><input type="number" id="' + id + '-t2" step="any"></div>' : '') +
      '</div><div data-out></div>';
    var $ = function (s) { return root.querySelector(s); };
    var dir = 'L';
    root.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { setDir(b.getAttribute('data-dir')); calc(); });
    });
    function setDir(v) {
      dir = v;
      root.querySelectorAll('[data-dir]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-dir') === v ? 'true' : 'false'); });
    }
    root.querySelectorAll('input,select').forEach(function (el) { el.addEventListener('input', calc); });
    function calc() {
      var ins = INSTRUMENTS[$('select').value];
      var cap = parseFloat($('#' + id + '-cap').value), pct = parseFloat($('#' + id + '-pct').value);
      var en = parseFloat($('#' + id + '-en').value), sl = parseFloat($('#' + id + '-sl').value), t1 = parseFloat($('#' + id + '-t1').value);
      var t2 = hasTp2 ? parseFloat($('#' + id + '-t2').value) : NaN;
      var out = $('[data-out]');
      if (![cap, pct, en, sl].every(isFinite)) { out.innerHTML = '<p class="note">Rellena capital, riesgo, entrada y stop.</p>'; return; }
      var sgn = dir === 'L' ? 1 : -1;
      var errs = [];
      if ((en - sl) * sgn <= 0) errs.push(dir === 'L' ? 'En un largo el stop va por debajo de la entrada.' : 'En un corto el stop va por encima de la entrada.');
      if (isFinite(t1) && (t1 - en) * sgn <= 0) errs.push('El objetivo está en el lado equivocado de la entrada.');
      if (errs.length) { out.innerHTML = '<div class="verdict no"><strong>Revisa los niveles</strong>' + errs.join(' ') + '</div>'; return; }
      var maxRisk = cap * pct / 100;
      var ticks = Math.abs(en - sl) / ins.tick;
      var perC = ticks * ins.tickVal;
      var n = Math.floor(maxRisk / perC + 1e-9);
      var real = n * perC;
      var rows = '';
      rows += kv('Riesgo máximo', ins.cur + fmt(maxRisk));
      rows += kv('Distancia al stop', fmt(Math.abs(en - sl), dec) + ' · ' + fmt(ticks, 0) + ' ticks');
      rows += kv('Riesgo por contrato', ins.cur + fmt(perC));
      var r1 = isFinite(t1) ? Math.abs(t1 - en) / Math.abs(en - sl) : NaN;
      var r2 = isFinite(t2) ? Math.abs(t2 - en) / Math.abs(en - sl) : NaN;
      if (isFinite(r1)) rows += kv(hasTp2 ? 'TP1' : 'Beneficio : riesgo', fmt(r1, 2) + 'R');
      if (isFinite(r2)) rows += kv('TP2', fmt(r2, 2) + 'R');
      var head;
      if (n < 1) {
        head = '<div class="verdict no"><strong>0 contratos</strong>Con este stop, 1 contrato arriesga ' + ins.cur + fmt(perC) + ', más que tu máximo de ' + ins.cur + fmt(maxRisk) + '. No entres o acerca el stop a un nivel válido.</div>';
      } else {
        var extra = '';
        if (isFinite(r1) && isFinite(r2) && n >= 2) {
          var half = Math.floor(n / 2), rest = n - half;
          var g = half * Math.abs(t1 - en) / ins.tick * ins.tickVal + rest * Math.abs(t2 - en) / ins.tick * ins.tickVal;
          extra = ' Salida escalonada: ' + half + ' en TP1 y ' + rest + ' en TP2 ≈ ' + ins.cur + fmt(g) + '.';
        }
        var rrWarn = isFinite(r1) && r1 < 1;
        head = '<div class="verdict ' + (rrWarn ? 'warn' : 'ok') + '"><strong>' + n + ' contrato' + (n > 1 ? 's' : '') + '</strong>Riesgo real ' + ins.cur + fmt(real) + ' (' + fmt(real / cap * 100, 2) + '% del capital).' + extra + (rrWarn ? ' El objetivo está a menos de 1R.' : '') + '</div>';
      }
      out.innerHTML = head + '<div>' + rows + '</div>';
    }
    function kv(k, v) { return '<div class="kv"><span>' + k + '</span><span>' + v + '</span></div>'; }
    function set(v) {
      if (v.instrument) $('select').value = v.instrument;
      if (v.dir) setDir(v.dir);
      var put = function (s, x) { if (x !== undefined && isFinite(x)) $(s).value = +x.toFixed(v.decimals === undefined ? dec : v.decimals); };
      put('#' + id + '-en', v.entry); put('#' + id + '-sl', v.stop); put('#' + id + '-t1', v.tp1);
      if (hasTp2) put('#' + id + '-t2', v.tp2);
      calc();
    }
    set(d);
    risks[id] = { set: set };
  }

  function init() {
    renderChrome();
    document.querySelectorAll('[data-checklist]').forEach(checklist);
    document.querySelectorAll('[data-risk]').forEach(riskCalc);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.Mesa = {
    rng: rng, fmt: fmt, fmtSigned: fmtSigned, clamp: clamp,
    ema: ema, sma: sma, bollinger: bollinger, atr: atr, candlesFromPath: candlesFromPath,
    canvasStage: canvasStage, scale: scale, niceTicks: niceTicks, C: C,
    gridY: gridY, hline: hline, band: band, drawCandles: drawCandles, marker: marker,
    scenarios: scenarios, replay: replay, risk: function (id) { return risks[id]; },
    instruments: INSTRUMENTS, pages: PAGES
  };
})();
