# Mesa de Estudio

Publicado en **https://trading.jhonyescobar.com/** (GitHub Pages; DNS y proxy en Cloudflare).
Acceso con usuario y contraseña mediante un Cloudflare Worker: ver `worker/README.md`.

Sitio estático privado para estudiar, simular y ejecutar estrategias de trading, en tres bloques:

- **Fundamentos**: simuladores para aprender a leer el gráfico (sin checklist).
- **Estrategias**: cada una con **1. Simulador gráfico** y **2. Checklist de ejecución**.
- **Recursos**: herramientas de cálculo.

> **Sitio NO indexable.** No quitar las etiquetas `<meta name="robots" content="noindex, ...">`
> de ninguna página, ni el archivo `_headers`. Ver `robots.txt` para el porqué de no usar `Disallow: /`.
> No indexable no significa privado: cualquiera con el enlace puede abrir las páginas.

## Páginas

| Ruta | Contenido |
|---|---|
| `index.html` | Inicio: los tres bloques y el progreso de las checklists de estrategia (guardado en el navegador) |
| `estrategias/orderflow-world-cup.html` | Golden Pocket bajo el VAL + footprint (absorción, test & fail, imbalance ≥ 400%) |
| `estrategias/tendencial.html` | EMA 21 + retroceso 38,2–61,8% + vela de intención |
| `estrategias/volumen-overnight.html` | Perfil overnight (POC y área de valor calculados) + saque y vuelta al POC |
| `estrategias/little-rizzy.html` | Directriz dibujable + distancia D + proyección |
| `fundamentos/velas-japonesas.html` | Constructor de velas + 10 patrones en contexto |
| `fundamentos/macd.html` | MACD, señal e histograma calculados + cruces y divergencias |
| `fundamentos/wyckoff.html` | Simulador de acumulación/distribución con eventos + laboratorio de las 3 leyes, Operador Compuesto, rupturas, Spring/Upthrust y errores |
| `recursos/interes-compuesto.html` | Interés compuesto por operativa: % riesgo, winrate, R:B y operaciones por periodo; retiros parciales por periodo, simulación de rachas (Montecarlo), plantillas y CSV |
| `recursos/registro-trading.html` | Registro de trading: app de AppSheet embebida (iframe) con enlace para abrirla aparte |

## Estructura

- `assets/site.css`: sistema visual común (fondo negro, acento lima, Inter Tight / Inter / JetBrains Mono).
- `assets/site.js`: navegación, lienzos, indicadores (EMA, ATR, Bollinger), checklist persistente y calculadora de riesgo.
- `assets/icons/`: favicon e iconos de app con las iniciales JT (SVG + PNG 16/32/180/192/512) y `site.webmanifest`.
- `assets/og/`: imágenes Open Graph 1200×630 de cada página, para la vista previa al compartir un enlace.
- Sin dependencias ni compilación: se abre `index.html` directamente o se publica la carpeta tal cual.

Los simuladores usan datos de ejemplo generados con semilla fija (siempre salen igual). No es asesoría de inversión.
