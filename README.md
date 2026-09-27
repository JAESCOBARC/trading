# Mesa de Estudio

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
| `recursos/interes-compuesto.html` | Calculadora de interés compuesto con retiros parciales por periodo, plantillas y exportación CSV |

## Estructura

- `assets/site.css`: sistema visual común (fondo negro, acento lima, Inter Tight / Inter / JetBrains Mono).
- `assets/site.js`: navegación, lienzos, indicadores (EMA, ATR, Bollinger), checklist persistente y calculadora de riesgo.
- Sin dependencias ni compilación: se abre `index.html` directamente o se publica la carpeta tal cual.

Los simuladores usan datos de ejemplo generados con semilla fija (siempre salen igual). No es asesoría de inversión.
