# Mesa de Estudio

Publicado en **https://trading.jhonyescobar.com/** (GitHub Pages; DNS y proxy en Cloudflare).
Acceso con usuario y contraseña mediante un Cloudflare Worker: ver `worker/README.md`.

Sitio estático privado para estudiar, simular y ejecutar estrategias de trading, en tres bloques:

- **Fundamentos**: simuladores para aprender a leer el gráfico (sin checklist).
- **Estrategias**: cada una con **1. Simulador gráfico** y **2. Checklist de ejecución**.
- **Recursos**: herramientas de cálculo y datos de mercado.

> **Sitio NO indexable.** No quitar las etiquetas `<meta name="robots" content="noindex, ...">`
> de ninguna página, ni el archivo `_headers`. Ver `robots.txt` para el porqué de no usar `Disallow: /`.
> No indexable no significa privado: cualquiera con el enlace puede abrir las páginas.

> **Excepción a propósito:** `fundamentos/jesus-navarrete.html` sí lleva checklist (y calculadoras), a diferencia del resto de Fundamentos. Es un manual completo de 5 unidades que no encaja en el formato de una sola estrategia; se decidió mantenerlo en Fundamentos como página única en vez de repartirlo entre Estrategias y Recursos.

## Páginas

| Ruta | Contenido |
|---|---|
| `index.html` | Inicio: los tres bloques y el progreso de las checklists de estrategia (guardado en el navegador) |
| `estrategias/orderflow-world-cup.html` | Golden Pocket bajo el VAL + footprint (absorción, test & fail, imbalance ≥ 400%) |
| `estrategias/tendencial.html` | EMA 21 + retroceso 38,2–61,8% + vela de intención |
| `estrategias/volumen-overnight.html` | Perfil overnight (POC y área de valor calculados) + saque y vuelta al POC |
| `estrategias/little-rizzy.html` | Directriz dibujable + distancia D + proyección |
| `estrategias/atlas.html` | Vela contraria + imbalance (FVG) marcan la mitigación; barrido de liquidez, vela de fuerza y R:B fijo 1:2 |
| `estrategias/poc.html` | Perfil de volumen de la sesión anterior: rebote en el POC, reversión del área de valor o ruptura con estructura; objetivo fijo 2R |
| `estrategias/ley-estelar.html` | Piso de capitulación (máximo − 2× rango matutino, confirmado con SOXX), reversión al abrir por %B extremo y confluencia de tres niveles (Trinchera Estelar) |
| `fundamentos/velas-japonesas.html` | Constructor de velas + 18 patrones en contexto |
| `fundamentos/macd.html` | MACD, señal e histograma calculados + cruces y divergencias |
| `fundamentos/wyckoff.html` | Simulador de acumulación/distribución con eventos + laboratorio de las 3 leyes, Operador Compuesto, rupturas, Spring/Upthrust y errores |
| `fundamentos/imbalances.html` | Vela contraria + imbalance (FVG) y cómo el mercado lo mitiga, total o parcialmente |
| `fundamentos/olhc.html` | El orden real en que nace una vela (abre, manipula, distribuye, cierra), cómo se repite de una vela a la siguiente, cuándo falla y por qué una misma mecha se ve distinta en otro marco temporal |
| `fundamentos/jesus-navarrete.html` *(excepción, ver nota)* | Canvas operativo de 5 unidades: checklist de 9 bloques, ecosistema SAR/EMA con Doji en "T" y empalme de 3 velas, Oráculo de pre-market, ingeniería de capital (techo $5,000, P_prom, trailing stop) y auditoría de 900 operaciones con matriz de calificación y guion de defensa en video |
| `recursos/interes-compuesto.html` | Interés compuesto por operativa: % riesgo, winrate, R:B y operaciones por periodo; retiros parciales por periodo, simulación de rachas (Montecarlo), plantillas y CSV |
| `recursos/registro-trading.html` | Registro de trading: botón que abre la app de AppSheet en una ventana emergente (no embebida) |
| `recursos/mapas-mercado.html` | Tres mapas de calor de Finviz uno bajo otro: sectores S&P 500, sectores Russell 2000 y futuros |

## Estructura

- `assets/site.css`: sistema visual común (fondo negro, acento lima, Inter Tight / Inter / JetBrains Mono).
- `assets/site.js`: navegación, lienzos, indicadores (EMA, ATR, Bollinger), checklist persistente y calculadora de riesgo.
- `assets/icons/`: favicon e iconos de app con las iniciales JT (SVG + PNG 16/32/180/192/512) y `site.webmanifest`.
- `assets/og/`: imágenes Open Graph 1200×630 de cada página, para la vista previa al compartir un enlace.
- Sin dependencias ni compilación: se abre `index.html` directamente o se publica la carpeta tal cual.

Los simuladores usan datos de ejemplo generados con semilla fija (siempre salen igual). No es asesoría de inversión.
