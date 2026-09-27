# Instrucciones del proyecto

## Git
- Todo el trabajo se hace, se confirma (commit) y se sube (push) directamente en la rama `main`.
- No crear ramas de trabajo ni pull requests salvo que se pida expresamente.

## Sitio
- Sitio privado NO indexable: toda página nueva lleva las etiquetas `<meta name="robots" content="noindex, ...">`,
  `googlebot` y `bingbot` que ya usan las páginas existentes. No quitarlas.
- Tres bloques: Fundamentos (`fundamentos/`, solo simulador, sin checklist), Estrategias (`estrategias/`, solo dos
  secciones: 1. Simulador gráfico y 2. Checklist de ejecución) y Recursos (`recursos/`, herramientas de cálculo).
- Toda página nueva se añade al menú en `PAGES` de `assets/site.js` y a su bloque en `index.html`.
- Capa SEO en cada página (aunque el sitio es noindex, sirve para previsualizar enlaces y accesibilidad):
  un solo `h1`, secciones con `h2`, bloques con `h3`; `meta description`; Open Graph y Twitter con imagen
  `assets/og/<pagina>.png` (1200×630) y URL absoluta sobre `https://jaescobarc.github.io/trading/`;
  favicon JT (`assets/icons/`) y `site.webmanifest`. Copiar el bloque de `<head>` de una página existente.
- Diseño común en `assets/site.css` y utilidades en `assets/site.js` (ver README.md).
