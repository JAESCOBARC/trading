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
- Diseño común en `assets/site.css` y utilidades en `assets/site.js` (ver README.md).
