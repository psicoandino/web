VISUAL_SYSTEM.md
Sistema Base de Diseño Visual — Psicoandino
(cross-proyecto: Desarrollo + Arte)
Antes: art_design.md. Renombrado para evitar colisión de nombre con ART_DESIGN.md (retirado, contenido fusionado aquí). Paleta corregida: la versión original invertía sangre↔cobre y mostaza↔musgo — ya no es válida como referencia de hex.
--------------------------------------------------------------------------------
0. Principio estructural
Este sistema no define "estilos". Define un lenguaje generativo de forma. Toda pieza visual en Psicoandino es una manifestación de una estructura, no una decoración. Cada proyecto es un set autónomo, construido desde esta base común.
1. Núcleo de identidad visual
:root {
  --cobre: #248692;    /* profundidad / agua estructurada */
  --musgo: #6D7C50;    /* anclaje / tierra / estabilidad */
  --mostaza: #B78627;  /* expansión orgánica / crecimiento */
  --sangre: #C73A4A;   /* energía / corte / decisión */
  --hueso: #F5F3EC;    /* silencio / espacio consciente */
  --oled: #000000;     /* vacío / estructura absoluta */
  --amatista: #7D5AA1; /* espacio negativo intencional — nunca forma sólida rellena */
}
1.1 Nota: frecuencias, no jerarquía fija
Las asociaciones del bloque anterior (cobre=profundidad/eje técnico, musgo=anclaje, etc.) son frecuencias de partida, no roles permanentes. Ningún color es "rey" fijo del sistema. Cuál color es dominante, secundario o acento se decide por proyecto o por obra (ver §7-8 y ART_COMPILER.md/WRITING_COMPILER.md, Capa T) — no por una jerarquía inherente al color. Esto es coherente con el Concilio: ninguna voz tiene jerarquía fija tampoco: es una red de chequeo cruzado, no un pipeline.
2. Regla de composición
1 color dominante (estructura) + 1 secundario (ritmo) + 1 acento (ruptura)
espacio negativo como elemento activo. Nunca todos los colores a la vez sin jerarquía. No saturar sin intención funcional.
3. Lenguaje formal
Círculo → fuente/origen/continuidad · Triángulo → dirección/decisión/tensión · Línea → flujo/conexión/vector · Cuadrado → sistema/contención/estructura · Espacio negativo → silencio/inteligencia estructural.
4. Tipografía
Sans-serif geométrica o humanista. Alto contraste solo en títulos. Interletraje amplio en identidad. Jerarquía clara, nunca decorativa. Compatibles: Inter, Space Grotesk, IBM Plex Sans, Satoshi.
5. Jerarquía visual
Fuente (concepto) → Estructura (grid/composición) → Forma (figuras/símbolos) → Texto (si aplica) → Espacio (silencio activo).
6. Sistema de grid
12 columnas (digital) · 4 u 8 pt de unidad base · alineación estricta en ejes principales · ruptura solo como decisión conceptual.
7. Capa de identidad por proyecto
Cada proyecto redefine su identidad sin romper el sistema base:
## PROJECT_LAYER
- Nombre del proyecto
- Propósito estructural
- Intención visual dominante
- Color dominante / secundario / acento del set
- Regla de composición específica
- Símbolo base del proyecto
8. Sistema de sets (ejemplos vigentes)
Set: Oficina de Bolsillo Dominante: --cobre · Secundario: --hueso · Acento: --sangre Forma dominante: cuadrado (sistema) · Lenguaje: funcional/técnico/claro Nota: en producto real, la paleta se reserva exclusivamente para badges de calidad de lead — ningún botón o control usa color de paleta.
Set: El Concilio Literario (Psicoengine) Dominante: --oled · Secundario: --sangre · Acento: --mostaza Forma dominante: círculo (emergencia/proceso) · Lenguaje: abstracto/sistémico/recursivo
Set: Arte Psicoandino Dominante: --hueso · Secundario: --musgo · Acento: --sangre Forma dominante: triángulo + línea · Lenguaje: simbólico/contemplativo Nota: en Arte, estos roles se traducen a familia tonal propia por colección — nunca como hex literal. Ver ART_COMPILER.md, Capa T.
9. Regla de coherencia
Válido si: se identifica sin texto, mantiene consistencia entre piezas, expresa una sola idea estructural dominante, evita redundancia visual.
10. Anti-patrones
Decoración sin función estructural · gradientes sin intención · mezcla de estilos por pieza · saturación cromática sin jerarquía · simbolismo ambiguo sin anclaje.
11. Extensibilidad
Nuevos sets por proyecto · nuevas reglas internas por set · variación controlada de forma · expansión sin ruptura del núcleo.
12. Cierre operativo
Psicoandino no diseña imágenes. Diseña sistemas visuales que se manifiestan como imágenes. Cada pieza es evidencia de un sistema coherente funcionando en el mundo.