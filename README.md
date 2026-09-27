# Mesa de Estudio

Sitio estático privado para estudiar, simular y ejecutar estrategias de trading.
Cada página tiene dos secciones: **1. Simulador gráfico** y **2. Checklist de ejecución**.

> **Sitio NO indexable.** No quitar las etiquetas `<meta name="robots" content="noindex, ...">`
> de ninguna página, ni el archivo `_headers`. Ver `robots.txt` para el porqué de no usar `Disallow: /`.
> No indexable no significa privado: cualquiera con el enlace puede abrir las páginas.

## Páginas

| Ruta | Contenido |
|---|---|
| `index.html` | Inicio: accesos, ruta de trabajo y progreso de las checklists (guardado en el navegador) |
| `estrategias/orderflow-world-cup.html` | Golden Pocket bajo el VAL + footprint (absorción, test & fail, imbalance ≥ 400%) |
| `estrategias/tendencial.html` | EMA 21 + retroceso 38,2–61,8% + vela de intención |
| `estrategias/volumen-overnight.html` | Perfil overnight (POC y área de valor calculados) + saque y vuelta al POC |
| `estrategias/little-rizzy.html` | Directriz dibujable + distancia D + proyección |
| `fundamentos/velas-japonesas.html` | Constructor de velas + 10 patrones en contexto |
| `fundamentos/macd.html` | MACD, señal e histograma calculados + cruces y divergencias |

## Estructura

- `assets/site.css`: sistema visual común (fondo negro, acento lima, Inter Tight / Inter / JetBrains Mono).
- `assets/site.js`: navegación, lienzos, indicadores (EMA, ATR, Bollinger), checklist persistente y calculadora de riesgo.
- Sin dependencias ni compilación: se abre `index.html` directamente o se publica la carpeta tal cual.

Los simuladores usan datos de ejemplo generados con semilla fija (siempre salen igual). No es asesoría de inversión.
