# MILESTONES — Historial de capacidades demostradas

> No es un roadmap ni un backlog. Registra hechos, no planes.
> Un milestone se marca solo cuando la capacidad existe y fue observada.
> Ante cualquier idea nueva de arquitectura, la respuesta es:
> "muéstrame primero dónde falla el vertical slice."

## Milestone 0 — Arquitectura congelada
**Estado: ✓** (2026-07-10)

Demostrado:
- D1 definido (Origin Store + CAR), contratos congelados.
- Átomo del sistema definido: la señal como intención de emisión.
- Vertical slice especificado (IMPLEMENTATION.md, Fase 1).
- Ciclo completo de gobernanza: dominio → contratos → implementación →
  evidencia → decisiones.

## Milestone 1 — Primer recorrido completo
**Estado: ✓** (2026-07-11)

Objetivo:
```
YouTube ID → Origin Store → CAR → PCM Backend → test.rsig
```

Criterio de éxito — todo demostrado:
- Reproducible: dos ejecuciones independientes sobre `lGUNGiuaMI4`,
  `test.rsig` byte-idéntico
  (SHA-256 `1929c394…5694d13`, confirmado con diff + shasum).
- Cero cambios en FOUNDATION. Cero cambios en CONTRACTS.
- Cero ADR nuevos; 3 refutaciones registradas, las tres resueltas
  "el contrato se mantiene" (ver MODEL_REFUTATIONS.md #1–#3).
- Bonus: la Refutación #2 produce evidencia directa para D2
  (pass-through como política válida de backend).

Implementación: `origin_store/`, `frontend/` (car.py, frontend.py),
`backends/pcm_backend.py`, `slice_cli.py`. Ejecutor: Claude Code
(Sonnet). Los contratos D1 sobrevivieron su primer contacto con la realidad.

## Milestone 2 — El engine consume el artefacto del slice
**Estado: ✓** (2026-07-11)

Objetivo: radio-engine.js reproduce un test.rsig producido por el nuevo
compilador.

Demostrado: estéreo 44100 por ambos canales a velocidad normal, verificado
por oído humano; mono legado intacto (signal_001, 10 s, 22050). El "sin
modificar el engine" original fue refutado por la realidad (Refutación #5):
el engine cambió una vez, quirúrgicamente, por refutación registrada →
ADR-010 ("el engine implementa lo que declara"). D2 parcialmente decidido y
despacho por campos de codec establecido (embrión de D3). El milestone
cumplió su función exacta: lo que falló alimentó D2.

## Milestone 3 — Linker mínimo
**Estado: ✓** (2026-07-11)

Objetivo: un linker mínimo compila 3 señales (IDs ya presentes en
`station.json` actual) por el pipeline nuevo, para demostrar orden +
despacho por señal ya soportado por el engine (ADR-010; el despacho mono ya
había quedado demostrado en Milestone 2 con signal_001 legado). No toca D3:
el engine ya maneja formatos mixtos por señal dentro de una misma estación.

Epoch: dato declarado de entrada al linker (parámetro CLI o config
mínima), nunca `now()`. Paga la deuda de ADR-008.

Criterio de éxito — binario, los tres puntos, todos demostrados:
1. El linker produce un `station.json` + `signals/` que `radio-engine.js`
   reproduce en navegador, señales en orden, posición de emisión computada
   desde el epoch declarado — verificado mecánicamente (offset calculado
   desde el epoch, señal correcta ubicada en orden, sin errores) y por
   oído humano (Ricardo): la primera señal arrancó a mitad de canción,
   comportamiento esperado del epoch declarado ("time is truth"), no un
   defecto.
2. Ejecutar el linker dos veces con los mismos inputs (`lGUNGiuaMI4,
   yZ8mJgcsbw8, 3IRBm9DjBdQ`) produjo `station.json` y los 3 `.rsig`
   byte-idénticos (SHA-256 confirmado con shasum, sin artificios).
3. Verificación auditiva humana (Ricardo, 2026-07-11): las 3 señales
   sonaron correctas, transiciones limpias.

Fuera de alcance: ganancia relativa, espectros, perfiles, reemplazo del
publisher viejo en producción. El criterio "al menos una señal mono"
quedó eliminado de este texto (ver Refutación #6, MODEL_REFUTATIONS.md):
redundante con la demostración ya hecha en Milestone 2.

Implementación: `compiler/linker/`, `compiler/link_cli.py`. Ejecutor:
Claude Code (Sonnet). 2 refutaciones registradas (#6, #7), ambas resueltas
por decisión del operador.

## Milestone 4 — Primer backend comprimido (AAC-LC) y RSIG-2 en el engine
**Estado: ✓** (2026-07-11)

Objetivo: la misma estación de 3 señales de `linked_station/` (Milestone 3),
compilada con un backend nuevo a RSIG-2 (manifiesto JSON + binario `.m4a`
adyacente, ADR-011) usando AAC-LC vía ffmpeg (ya presente en la toolchain),
y reproducida por `radio-engine.js` con despacho por `format`+`codec.type`
(ADR-012). Perfil nivel-cero: AAC-LC 96 kbps, 44100 Hz, estéreo. Las ramas
RSIG-1 (PCM, mono y estéreo, Milestones 1-3) siguen intactas: el engine debe
manejar ambos formatos en la misma estación sin que uno rompa al otro —
artefactos publicados reproducibles para siempre (ADR-012).

Criterio de éxito — binario, los cuatro puntos, todos demostrados:
1. Peso total de la estación comprimida < 12 MB (contra ~150 MB del
   equivalente PCM) — `compressed_station/` (3 señales) pesó 8.9 MB.
2. Ejecutar el linker dos veces con los mismos inputs produce manifiestos
   RSIG-2 byte-idénticos y binarios `.m4a` byte-idénticos — confirmado con
   `shasum -a 256` sobre los 6 archivos de `signals/`, toolchain fijada
   (ffmpeg 7.0, `static_ffmpeg` darwin_arm64).
3. `test_station/` y `linked_station/` (RSIG-1) siguen reproduciendo igual
   que antes — sin regresión por el despacho nuevo. Verificado
   mecánicamente por consola (sin errores, sin requests fallidos).
4. Verificación auditiva humana de la estación comprimida (Ricardo,
   2026-07-11): OK.

Fuera de alcance: Opus, HE-AAC, perfiles múltiples (D5), metadata,
streaming progresivo.

Implementación: `compiler/backends/aac_backend.py` (nuevo), cambio
quirúrgico en `compiler/linker/linker.py` (sidecar binario), `compiler/
link_cli.py` (`--codec pcm|aac`), `radio-engine.js` (rama `decodeRSIG2`
despachada por `format:codec.type`, RSIG-1 intacta). Ejecutor: Claude Code
(Sonnet). Sin refutaciones nuevas — ver MODEL_REFUTATIONS.md.

## Milestone 5 — Estación real completa, en paralelo, con metadata y espectro
**Estado: ✓** (2026-07-11)

Objetivo: `production_station/` — las 10 señales de `station.json` actual,
canciones completas (sin recorte), compiladas por el pipeline nuevo con el
perfil nivel-cero (AAC-LC 96 kbps, RSIG-2, Milestone 4), en paralelo a la
estación pública actual (sin tocarla). Incluye dos etapas de Fase 2 que
este milestone exige y hasta ahora no tenían implementación:
(a) **metadata mínima**: el linker copia al índice title/artist/album/year
resueltos con precedencia declarada-sobre-extraída — lo declarado viene del
`station.json` actual, lo extraído del acta del Origin Store (Refutación
#7, CONTRACTS.md sección Metadata: "la resolución... ocurre en la
compilación de señal; el linker solo copia el resultado al índice");
(b) **espectro como backend de datos** (ADR-007): calculado desde la señal
emitida (el audio AAC ya decodificado), no desde la CAR de máxima
fidelidad. `index.html` (o una copia suya) reproduce con títulos visibles,
espectro animado y epoch declarado.

Criterio de éxito — binario, los cinco puntos, todos demostrados:
1. Las 10 señales suenan — verificación auditiva humana COMPLETADA
   (Ricardo, 2026-07-11): varias señales y 2-3 transiciones escuchadas,
   sin anomalías.
2. Metadata (title/artist/album/year) visible y correcta en la UI —
   confirmado.
3. Espectro visible y sincronizado con el audio emitido — confirmado
   mecánicamente y por verificación humana (Ricardo, 2026-07-11).
4. Recompilación completa con los mismos inputs → bytes idénticos: dos
   corridas independientes (re-adquiriendo de la fuente externa en ambas)
   produjeron los 10 manifiestos `.rsig`, los 10 binarios `.m4a`, los 10
   artefactos de espectro `<id>.json` y `station.json` byte-idénticos
   (`diff -rq` sin diferencias, SHA-256 confirmado).
5. Peso total de `production_station/`: **33 MB** — bajo los 40 MB del
   criterio.

Fuera de alcance: reemplazar la estación pública actual (Milestone 6), D4,
D5 más allá de `--codec` (sin perfiles múltiples nuevos), Opus, passes/LUFS,
índice de recursos.

Riesgo conocido vigilado (MODEL_REFUTATIONS.md, anotado en Milestone 4):
gaps audibles en las transiciones por priming/padding del encoder AAC. Se
midió explícitamente: duración declarada vs. duración real decodificada,
10/10 señales con diferencia `0.0000 s`. No se manifestó — sin refutación
nueva (ver MODEL_REFUTATIONS.md, Milestone 5).

Implementación: `compiler/metadata/` (nuevo), `compiler/backends/
spectrum_backend.py` (nuevo, no toca `pcm_backend.py` ni `aac_backend.py`),
cambio quirúrgico en `compiler/linker/linker.py` y `compiler/link_cli.py`
(`--declared-metadata`), `production_station/` (nuevo). Ejecutor: Claude
Code (Sonnet). Sin refutaciones nuevas — ver MODEL_REFUTATIONS.md.

## Milestone 6 — Corte a producción: la raíz sirve la estación nueva
**Estado: ✓** (2026-07-11)

Objetivo: la raíz del proyecto pasa a servir la estación nueva. `index.html`
(raíz) reproduce las 10 señales RSIG-2/AAC con metadata y espectros del
pipeline nuevo (Milestones 4-5), con el mismo epoch declarado de
`production_station/` (continuidad de emisión — el corte no reinicia la
emisora, ADR-008). Los artefactos viejos (`signals/*.rsig` de 10 s,
`station.json` legado) se archivan en `legacy_station/` — no se borran. El
compilador viejo (`audio_pipeline.py`, `compiler.py`, `publisher.py`,
`signal_encoder.py`, `frequency_analyzer.py`, `signal_frequency.py`,
`station_builder.py`, `cli.py`, `validator.py`) se mueve a
`compiler/legacy/` con un README de una línea. Con esto muere
`epoch = now()` y se salda la deuda de ADR-008.

Criterio de éxito — binario, los cinco puntos:
1. Abrir `index.html` raíz servido localmente reproduce la radio nueva —
   verificación auditiva humana (Ricardo).
2. `test_station/`, `linked_station/`, `compressed_station/` y
   `production_station/` intactos y funcionando (RSIG-1 sigue vivo —
   ADR-012).
3. Recompilar la estación produce bytes idénticos a los servidos.
4. Cero referencias activas al compilador viejo fuera de
   `compiler/legacy/` (verificable por grep).
5. Las tres entradas de deuda de ADR-008/constantes/espectro-pre-backend en
   IMPLEMENTATION.md quedan marcadas o reasignadas con justificación.

Fuera de alcance: D4 (las dos convenciones de naming en `signals/` conviven
por ahora), D5, Opus, passes/LUFS, índice de recursos, colores del
visualizador (deuda cosmética separada, IMPLEMENTATION.md).

Nota de proceso: este milestone toca la raíz del proyecto. Antes de mover o
modificar cualquier archivo, el ejecutor debe listar exactamente qué se
mueve/modifica y esperar confirmación explícita del operador en la misma
sesión — no se ejecuta por adelantado.

Criterio de éxito — binario, los cinco puntos, todos demostrados:
1. Verificación auditiva humana (Ricardo, 2026-07-11): radio raíz
   funcional — 10 señales, transiciones, espectro y metadata OK,
   continuidad de epoch confirmada (el corte no reinició la emisora).
   Hallazgo lateral no bloqueante: control de volumen inoperante en modo
   radio, bug de UI preexistente por linaje (`index.html` raíz es copia de
   `production_station/index.html`, que a su vez es copia de la UI
   original) — no causado por este milestone, registrado en
   IMPLEMENTATION.md como deuda, diferido a Milestone 7.
2. `test_station/`, `linked_station/` y `compressed_station/` intactos y
   funcionando — confirmado (Ricardo, 2026-07-11): cargan y suenan. RSIG-1
   sigue vivo (ADR-012).
3. Recompilar la estación produce bytes idénticos a los servidos —
   confirmado por `shasum -a 256`: `station.json` de raíz y de
   `production_station/` idénticos byte a byte
   (`c2d9d40322cc34e2cf9ec001687407ccd7e436b65aef825f82147af5e3a19b75`); los
   30 archivos de `signals/` de raíz y de `production_station/signals/`
   idénticos byte a byte. `production_station/` usado solo como fuente de
   lectura, sin modificar.
4. Cero referencias activas al compilador viejo fuera de
   `compiler/legacy/` — confirmado por grep sobre los 9 módulos movidos:
   única coincidencia fuera de `compiler/legacy/` es un comentario en
   `compiler/metadata/resolver.py:10`, sin import ni ejecución.
5. Deuda de ADR-008/constantes/espectro-pre-backend: marcada en
   IMPLEMENTATION.md — dos saldadas por archivado del publisher viejo, una
   (constantes) reasignada a D5 como mejora del pipeline nuevo, ya no como
   deuda heredada.

Implementación: `legacy_station/` (nuevo, archiva `station.json` y
`signals/` viejos de raíz sin borrar nada), `compiler/legacy/` (nuevo, con
`README.md`, archiva los 9 módulos del compilador viejo), raíz (`index.html`,
`station.json`, `signals/`) reemplazada por copia de `production_station/`
(fuente sin modificar; `index.html` idéntico salvo 3 rutas de asset
reescritas de `../X` a `X`). Ejecutor: Claude Code (Sonnet). Sin
refutaciones nuevas — ningún contrato de CONTRACTS.md contradicho.

Fuera de alcance (no resuelto, registrado como deuda para Milestone 7):
control de volumen inoperante en modo radio (bug de UI preexistente,
detectado en verificación auditiva de este milestone, no causado por él).

## Milestone 7 — Experiencia de entrada (lanzamiento)
**Estado:** (definido 2026-07-11, no iniciado)

Objetivo: al entrar a `index.html`, la acción primaria es inequívoca —
sintonizar la radio, sin competencia visual. Se siente como encender una
radio, no como elegir entre varios modos.

Alcance: solo UI (`index.html`). Cero cambios a `radio-engine.js`, al
pipeline o a los contratos.
(a) Botón prominente de SINTONIZAR como acción primaria; nada compite con
él.
(b) Modo libre y el deck de síntesis/vinilo pasan a secundarios:
accesibles pero plegados/ocultos por defecto.
(c) Control de volumen funcional (paga la deuda registrada en
IMPLEMENTATION.md: hoy no baja el volumen en modo radio) y comprensible,
un solo control visible.
(d) Responsive: usable en móvil (hoy roto).

Criterio de éxito — binario, los cuatro puntos:
1. Verificación del operador en desktop: entra, entiende qué apretar sin
   pensar, sintoniza, sube/baja volumen y funciona.
2. Verificación del operador en móvil real: carga, se ve bien, sintoniza y
   suena.
3. Modo libre y deck de síntesis/vinilo siguen accesibles y funcionando.
4. La radio (engine, señales, espectro) intacta — sin regresión.

Fuera de alcance: rediseño visual completo, colores del visualizador
(deuda cosmética separada, IMPLEMENTATION.md), nuevas funcionalidades, D4,
D5, índice de recursos.

Nota de proceso: `index.html` es un monolito grande — la sesión de código
usa la skill `engineering`.

## Milestone 8 — Compilación incremental de lista
**Estado:** (definido 2026-07-11, no iniciado)

Objetivo: `link_cli` acepta un archivo de lista de IDs (`station_ids.txt`
como fuente; la lista puede crecer libremente) y compila incrementalmente —
solo adquiere y encodea lo que falta.

Alcance: índice de recursos (recurso → adquisición vigente) en el build
system. Si un ID ya tiene adquisición en el Origin Store, no se descarga de
nuevo. Si una señal ya tiene artefactos compilados para (adquisición +
perfil + toolchain), no se re-encodea. Este milestone abre D4: las
decisiones de identidad/naming que esto exija se registran como ADR en la
sesión — no se improvisan en silencio.

Criterio de éxito — binario, los cuatro puntos:
1. Compilar la lista completa (29 IDs de `station_ids.txt`) produce la
   estación.
2. Segunda corrida inmediata sobre los mismos 29 IDs: cero descargas y
   cero encodeos, terminación en segundos, artefactos byte-idénticos.
3. Agregar 1 ID nuevo a la lista y recompilar: descarga y encodea SOLO ese
   ID; los 29 anteriores no se tocan.
4. Verificación auditiva por muestreo de la estación de 29 (operador).

Fuera de alcance: UI, perfiles múltiples (D5), passes, re-adquisición
forzada (política superseded — queda para cuando duela).

## Milestone 9+ — Se definen al completar el anterior
No se planifican milestones futuros por adelantado: cada uno nace de la
evidencia del anterior.
