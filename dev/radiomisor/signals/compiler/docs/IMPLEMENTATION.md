# IMPLEMENTATION — Estado operacional

> Cada casilla solo se marca cuando existe código funcionando.
> Las decisiones conceptuales se consideran cerradas. Solo se reabren cuando
> una contradicción demostrada por el código, un nuevo requisito del dominio
> o un cambio explícito de objetivos haga insuficientes los contratos actuales.

## Contratos

- [x] FOUNDATION congelado
- [x] CONTRACTS — D1 (Origin Store + CAR) congelado
- [x] Átomo definido (señal = intención de emisión)
- [x] D2 — contrato de artefacto (payload ↔ engine) — decidido en
  DECISIONS.md (ADR-011: RSIG-2, manifiesto + binario adyacente; RSIG-1
  válido para siempre); implementado en Milestone 4 (ver más abajo);
  verificación auditiva humana COMPLETADA (Ricardo, 2026-07-11)
- [x] D3 — versionado / despacho por codec.type — decidido en DECISIONS.md
  (ADR-012: despacho por format+codec.type, congelado; ramas que se suman,
  nunca reemplazan); implementado en Milestone 4 (ver más abajo);
  verificación auditiva humana COMPLETADA (Ricardo, 2026-07-11)
- [ ] D4 — identidad y direccionamiento de artefactos
- [ ] D5 — config de estación (interfaz del compilador)

## Fase 1 — Vertical Slice

> Objetivo binario: ¿existe una compilación completa de extremo a extremo?
> Un YouTube ID entra, un artefacto reproducible sale, atravesando todas las
> capas. Sin linker, sin perfiles múltiples, sin caché incremental, sin
> paralelismo. La implementación debe ser sencilla, no definitiva: solo
> correcta respecto de D1.

- [x] Origin Store (captura, acta, append-only, verificación)
- [x] Frontend → CAR (decodificación declarada, forma normal, hashing)
- [x] PCM Backend (CAR → test.rsig)
- [x] Artefacto reproducible (mismo input + misma toolchain → mismos bytes)

## Fase 2 — Expansión

- [ ] Índice de recursos (recurso → adquisición vigente)
- [ ] Passes y mediciones (trim, LUFS, duración)
- [x] Linker (orden, epoch declarado, índice) — (`compiler/linker/`,
  `compiler/link_cli.py`): compila 3 señales por el pipeline nuevo
  (`OriginStore → Frontend → PCMBackend`), emite `linked_station/station.json`
  + `signals/` con orden, epoch declarado por CLI (nunca `now()`, ADR-008)
  e índice (`file/id/duration`). Reproducibilidad confirmada: dos
  ejecuciones sobre los mismos 3 IDs producen `station.json` y los 3
  `.rsig` byte-idénticos (shasum 256 verificado). Verificación mecánica en
  navegador OK (carga estación, calcula offset desde epoch, ubica señal en
  orden, decodifica sin errores). Verificación auditiva humana COMPLETADA
  (Ricardo, 2026-07-11): las 3 señales sonaron correctas, transiciones
  limpias; la primera arrancó a mitad de canción — comportamiento esperado
  del epoch declarado, no defecto. Refutación #6 (mono/estéreo) y #7
  (metadata) resueltas por el operador — ver MODEL_REFUTATIONS.md.
- [x] Metadata de señal (resolución declarada-vs-extraída, propiedad de la
  compilación de señal — ver CONTRACTS.md sección Metadata y Refutación #7).
  Completado en Milestone 5 (`compiler/metadata/`): el linker copia el
  resultado (`title/artist/album/year`) al índice — verificación auditiva
  humana COMPLETADA (Ricardo, 2026-07-11).
- [x] Backends adicionales (espectro como backend de datos; códecs según D2/D3)
  — AAC-LC (RSIG-2, nivel cero) COMPLETADO en Milestone 4
  (`compiler/backends/aac_backend.py`); espectro como backend de datos
  (ADR-007) COMPLETADO en Milestone 5 (`compiler/backends/spectrum_backend.py`
  — deriva del AAC ya emitido, no de la CAR). Verificación auditiva humana
  COMPLETADA (Ricardo, 2026-07-11) para ambos.
- [ ] Caché incremental (D4)
- [x] Engine Adapter — completado 2026-07-11 tras el ciclo Refutación #5 →
  ADR-010 (opción B): `radio-engine.js` desintercala según `codec.channels`
  (mono intacto; estéreo L,R,L,R… → 2 canales, frames = samples/channels).
  Verificación mecánica OK (buffer.duration = duración declarada en estéreo
  44100 y en mono legado 22050) y verificación auditiva humana COMPLETADA:
  estéreo por ambos canales, velocidad normal (Ricardo, parlantes).

## Próximo movimiento (next-move, 2026-07-11, tras Milestone 6)

Paso 1 (REFUTATIONS): sin refutaciones abiertas — #1-7 (Milestones 1-3) +
Milestone 4 + Milestone 5, todas con "Resultado:" registrado, todas "el
contrato se mantiene". Milestone 6 no generó refutación nueva (el hallazgo
de volumen es bug de UI preexistente por linaje, no contradice ningún
contrato).

Paso 2 (MILESTONES): Milestones 0-6 ✓. No existe Milestone 7 definido —
por regla del método (MILESTONES.md no planifica por adelantado), el
siguiente movimiento es que **el operador defina Milestone 7** desde la
evidencia de Milestone 6, no que el ejecutor lo elija.

El operador ya ancló el objetivo más directo al cerrar Milestone 6:
- **Control de volumen inoperante en modo radio**: registrado como deuda
  (ver "Deuda conocida" arriba) con destino explícito "se resuelve en
  Milestone 7". Candidato con scope ya dado por el operador — falta solo
  fuera-de-alcance y criterio de éxito binario para poder codificar.

Otros candidatos que la evidencia deja visibles (no decididos, solo
señalados, heredados de la definición de Milestone 6):
- **D4 — identidad y direccionamiento de artefactos**: `signals/` de
  `production_station/` (ahora en raíz) sigue con naming posicional
  (`signal_NNN.rsig`/`.m4a`) + content-id (`<id>.json` de espectro)
  conviviendo — caso real sin resolver.
- **D5 — config de estación / perfil de compilación**: flags sueltos en
  `link_cli.py` (`--codec`, `--declared-metadata`) sin esquema formal.
- **Índice de recursos** (Fase 2, sin marcar): recurso → adquisición
  vigente, responsabilidad tabulada en CONTRACTS.md sin implementación.
- **Passes y mediciones** (Fase 2, sin marcar): trim/LUFS/duración.
- **Visualizador — colores sangre/mostaza** (deuda cosmética, sin
  milestone asignado): revisar normalización percentil 95 del espectro
  y/o paleta UI.
- **Vigilancia abierta, no refutación**: percepción del operador de
  posible salto de contenido en transiciones, sin síntoma medido. Si se
  observa, escala a refutación — no antes.

Acción: sesión de definición corta con el operador antes de codificar
Milestone 7 — falta fuera-de-alcance y criterio binario para el arreglo
de volumen (o para el objetivo que el operador decida priorizar).

## Milestone 4 — Primer backend comprimido (AAC-LC) y RSIG-2 en el engine

Implementación: `compiler/backends/aac_backend.py` (nuevo, no toca
`pcm_backend.py`), cambio quirúrgico en `compiler/linker/linker.py`
(`_link_signal` extrae `_binary`/`_binary_ext` del resultado del backend y
escribe el archivo adyacente cuando existen — no-op para PCMBackend),
`compiler/link_cli.py` (`--codec pcm|aac`, default `pcm`), `radio-engine.js`
(nueva rama `decodeSignal` → `decodeRSIG2` despachada por
`format:codec.type` vía switch, ADR-012; lógica RSIG-1 renombrada a
`decodePCMBase64` sin cambios de comportamiento; `play`/`decodeSignal`
pasaron a `async` para soportar `fetch` + `decodeAudioData`), salida en
`compressed_station/` (nueva).

Perfil nivel-cero: AAC-LC, 96 kbps, 44100 Hz, estéreo, contenedor M4A, vía
`ffmpeg` de la toolchain existente (`static_ffmpeg`, misma fijación que el
frontend). Versión de ffmpeg de la corrida (2026-07-11):
`ffmpeg version 7.0 Copyright (c) 2000-2024 the FFmpeg developers`
(`static_ffmpeg` darwin_arm64, mismo binario para ambas corridas de
determinismo).

Evidencia — los cuatro puntos del criterio de éxito:
1. **Peso total:** `compressed_station/` (3 señales de `linked_station/`:
   `lGUNGiuaMI4`, `yZ8mJgcsbw8`, `3IRBm9DjBdQ`) pesa 8.9 MB — bajo los
   12 MB del criterio.
2. **Determinismo:** dos ejecuciones de
   `compiler/link_cli.py ... --codec aac` sobre los mismos 3 IDs
   produjeron `station.json`, los 3 manifiestos `.rsig` y los 3 binarios
   `.m4a` byte-idénticos (confirmado con `diff` + `shasum -a 256` sobre
   los 6 archivos de `signals/`, sin artificios).
3. **Sin regresión en RSIG-1:** verificado mecánicamente por consola
   (navegador dirigido, sin oído): `linked_station/` (estéreo 44100) y
   `test_station/` (mono 22050 legado) cargan, reproducen y hacen
   prefetch sin errores en consola ni requests fallidos, con la rama
   `decodeSignal` nueva en producción. `compressed_station/` (RSIG-2)
   también verificado mecánicamente: fetch de `.rsig` + `.m4a` en 200 OK,
   `decodeAudioData` sin excepciones, "Broadcasting" + "PREFETCH READY"
   en consola.
4. **Verificación auditiva humana de `compressed_station/`:** COMPLETADA
   (Ricardo, 2026-07-11) — OK.

Ninguna contradicción con CONTRACTS.md fue observada — sin refutación
nueva para Milestone 4 (ver MODEL_REFUTATIONS.md).

**Milestone 4: ✓ (2026-07-11).** Los cuatro puntos del criterio de éxito
quedan demostrados — ver MILESTONES.md.

## Milestone 5 — Estación real completa, en paralelo, con metadata y espectro

Implementación: `compiler/metadata/` (nuevo — `resolve_metadata`,
`extract_from_raw_metadata`, `load_declared_metadata`; resolución
declarada-sobre-extraída, campo a campo), `compiler/backends/spectrum_backend.py`
(nuevo — ADR-007: decodifica el binario ya emitido por el backend de audio,
no la CAR, y calcula bandas log-espaciadas, mismo formato que los `<id>.json`
que `index.html` ya consumía), cambio en `compiler/linker/linker.py`
(`_link_signal` ahora también: escribe `signals/<id>.json` cuando el backend
emite binario, resuelve metadata con precedencia declarada-sobre-extraída y
la copia al índice, contrasta duración declarada vs. duración real
decodificada), `compiler/link_cli.py` (`--declared-metadata PATH`, imprime a
stderr cualquier discrepancia de duración detectada), `production_station/`
(nuevo — 10 señales, `index.html` copiado de la raíz y adaptado únicamente en
las 3 rutas de asset compartido — `../radio-engine.js`, `../psico-header.css`,
`../psico-header.js` — sin tocar los originales ni `station.json`/`signals/`
de la raíz).

IDs compilados (los mismos 10 con acquisition ya presente en
`compiler/origin_store/store/`, subconjunto de `station_ids.txt`):
`lGUNGiuaMI4, yZ8mJgcsbw8, 3IRBm9DjBdQ, 5a_YthPacB0, X7P8zX3xl_A, FH2v50zAbqo,
1nejjuPEJkE, 0e_kHYrEhqg, h_I9xto06A0, IhnOpwOMHgk`. Epoch declarado
(reutilizado del `station.json` público, ADR-008): `2026-07-10T21:25:22.576491+00:00`.
Perfil: AAC-LC 96 kbps, 44100 Hz, estéreo (Milestone 4, sin cambios).
Toolchain: `ffmpeg version 7.0` vía `static_ffmpeg` darwin_arm64 (misma
fijación que Milestone 4).

Evidencia — los cinco puntos del criterio de éxito:
1. **Las 10 señales suenan:** verificación mecánica OK — carga de
   `station.json`, cómputo de offset desde epoch, decodificación
   `decodeRSIG2` y reproducción sin excepciones ni requests fallidos
   (`read_console_messages`/`read_network_requests` en navegador dirigido,
   200 OK en manifiesto + binario + espectro de la señal en curso).
   **Verificación auditiva humana COMPLETADA** (Ricardo, 2026-07-11):
   varias señales muestreadas y 2-3 transiciones escuchadas, sin anomalías.
2. **Metadata visible y correcta:** confirmado mecánicamente — el título en
   cola/reproductor muestra `"PRONTA ENTREGA — VIRUS"` etc., leído
   directamente de `station.json.signals[].title/artist`; los cuatro campos
   (`title/artist/album/year`) en `production_station/station.json`
   coinciden campo a campo con los valores declarados en el `station.json`
   público para esas 10 IDs (precedencia declarada verificada: no hubo
   ningún campo declarado nulo en este subconjunto, así que la rama
   "extraído" de `resolve_metadata` no se ejercitó con datos reales en esta
   corrida — queda ejercitada solo por construcción/lectura de código).
3. **Espectro visible y sincronizado:** confirmado mecánicamente — log de
   consola `"ESPECTRO REAL SINCRONIZADO PARA: <id>"` y `spectrum-display`
   animado con la señal en curso; fetch de `signals/<id>.json` en 200 OK.
   **Verificación auditiva/visual humana COMPLETADA** (Ricardo, 2026-07-11):
   espectro sincronizado, sin anomalías.
4. **Recompilación byte-idéntica:** dos corridas completas e independientes
   de `compiler/link_cli.py` (mismos 10 IDs, mismo epoch, mismo
   `--declared-metadata station.json`, re-adquiriendo de la fuente externa
   en cada corrida — no se reusó ningún artefacto entre corridas) produjeron
   `production_station/` idéntico: `diff -rq` sin diferencias y
   `shasum -a 256` idéntico sobre los 10 manifiestos `.rsig`, los 10
   binarios `.m4a`, los 10 espectros `<id>.json` y `station.json`.
5. **Peso total:** `production_station/` (10 señales, canciones completas,
   incluye `index.html`) pesa **33 MB** — bajo los 40 MB del criterio.

Riesgo de Milestone 4 (gaps por priming/padding AAC) — vigilado, no
observado: se recalculó la duración real decodificando cada `.m4a` con
`SpectrumBackend` de forma independiente (fuera del linker) y se comparó
contra la duración declarada por `AACBackend` (CAR de entrada); las 10
señales dieron diferencia `0.0000 s`. No se registra refutación — el riesgo
sigue anotado para perfiles/toolchains futuros, pero en esta corrida
(`static_ffmpeg` 7.0, contenedor M4A) no se manifestó.

**Milestone 5: ✓ (2026-07-11).** Los cinco puntos del criterio de éxito
quedan demostrados, incluida la verificación auditiva humana COMPLETADA
(Ricardo, 2026-07-11) — ver MILESTONES.md.

## Deuda conocida del código actual

- [x] `epoch = now()` en publisher — viola ADR-008. **Saldada en Milestone 6**:
  el publisher viejo (`compiler/legacy/publisher.py`) queda archivado y sin
  referencias activas; la raíz sirve `production_station/station.json`, cuyo
  epoch es dato declarado por el linker nuevo (`compiler/linker/`), nunca
  `now()`.
- [x] Constantes de compilación en código (22050, mono, 10 s) — migrar a
  perfil (D5). **Reasignada**: pertenecía al pipeline viejo
  (`compiler/legacy/`), ahora archivado y fuera de producción. El pipeline
  nuevo ya recibe codec/canales/duración como datos de la CAR y flags de
  `link_cli.py`, no constantes; D5 (config de estación formal) sigue abierta
  pero como mejora del pipeline nuevo, no como deuda del viejo.
- [x] Espectro calculado desde audio pre-backend — reclasificar según ADR-007.
  **Saldada en Milestone 6**: el cálculo pre-backend vivía en el publisher
  viejo (`frequency_analyzer.py`/`signal_frequency.py`, ahora en
  `compiler/legacy/`), sin referencias activas. La raíz sirve el espectro de
  `spectrum_backend.py` (deriva del audio ya emitido, Milestone 5).
- [ ] Visualizador cargado a colores sangre/mostaza — revisar normalización
  percentil 95 del espectro y/o paleta UI; cosmético, sin milestone asignado.
  Fuera de alcance de Milestone 6 (declarado en su propio texto).
- [x] Control de volumen inoperante en modo radio — causa raíz identificada
  en Milestone 7 (Refutación #8, MODEL_REFUTATIONS.md): `radio-engine.js`
  conectaba el source de audio directo a `audioContext.destination`, sin
  `GainNode` ni método `setVolume`. **Saldada**: el operador autorizó una
  modificación quirúrgica del engine (ADR-013, DECISIONS.md) — `GainNode`
  interpuesto + `setVolume(0..1)`; `index.html` lo invoca desde el mismo
  punto donde ya sincroniza el volumen de YouTube en modo libre. Verificado
  mecánicamente: `gainNode.gain.value` sigue al control en todo el rango
  (0 a 1), sin regresión en RSIG-1 ni RSIG-2.

## Milestone 6 — Corte a producción: la raíz sirve la estación nueva

Implementación: `legacy_station/` (nuevo — archiva `station.json` y
`signals/` viejos de la raíz, 58 archivos: 29 `.rsig` + 29 `.json`, sin
borrar nada); `compiler/legacy/` (nuevo, con `README.md` de una línea —
archiva los 9 módulos del compilador viejo: `audio_pipeline.py`,
`compiler.py`, `publisher.py`, `signal_encoder.py`, `frequency_analyzer.py`,
`signal_frequency.py`, `station_builder.py`, `cli.py`, `validator.py`); raíz
(`index.html`, `station.json`, `signals/`) reemplazada por copia de
`production_station/` (usada solo como fuente de lectura, sin modificar):
`index.html` idéntico salvo 3 rutas de asset reescritas de `../X` a `X`
(confirmado por diff línea a línea contra la versión con rutas reescritas);
`station.json` y los 30 archivos de `signals/` (10 señales × `.rsig` + `.m4a`
+ espectro `.json`) copiados sin modificación.

Evidencia — los cinco puntos del criterio de éxito:
1. Verificación auditiva humana: **COMPLETADA** (Ricardo, 2026-07-11) —
   radio raíz funcional: 10 señales, transiciones, espectro y metadata OK,
   continuidad de epoch confirmada (el corte no reinició la emisora).
   Hallazgo lateral (no bloqueante): control de volumen inoperante en modo
   radio — bug de UI preexistente por linaje, no causado por este
   milestone; anotado en "Deuda conocida" arriba, resolución diferida a
   Milestone 7.
2. `test_station/`, `linked_station/`, `compressed_station/`: presentes e
   intactos (no tocados por esta operación — ninguna ruta de este milestone
   los referenció). RSIG-1 sigue vivo (ADR-012).
3. Recompilar produce bytes idénticos a los servidos — confirmado por
   `shasum -a 256`: `station.json` de raíz y de `production_station/`
   coinciden byte a byte
   (`c2d9d40322cc34e2cf9ec001687407ccd7e436b65aef825f82147af5e3a19b75`);
   los 30 archivos de `signals/` de raíz y de `production_station/signals/`
   coinciden byte a byte (`shasum -a 256` sobre ambos directorios, `diff`
   sin diferencias). `production_station/` es la fuente y no fue modificada.
4. Cero referencias activas al compilador viejo fuera de `compiler/legacy/`
   — confirmado por grep sobre `*.py` a los 9 módulos: única coincidencia
   fuera de `compiler/legacy/` es un comentario en
   `compiler/metadata/resolver.py:10` ("pipeline legado
   (audio_pipeline.AudioPipeline._extract_metadata)"), sin import ni
   ejecución activa.
5. Deuda de ADR-008/constantes/espectro-pre-backend: marcada arriba, dos
   saldadas por archivado del publisher viejo, una reasignada a D5 (config
   de estación del pipeline nuevo, sigue abierta como mejora, no como deuda
   heredada).

**Milestone 6: ✓ (2026-07-11).** Los cinco puntos del criterio de éxito
quedan demostrados, incluida la verificación auditiva humana COMPLETADA
(Ricardo, 2026-07-11) — ver MILESTONES.md.

## Milestone 7 — Experiencia de entrada (lanzamiento)

Implementación: `index.html` (raíz) para (a)/(b)/(d). El punto (c) requirió
una modificación quirúrgica de `radio-engine.js`, autorizada explícitamente
por el operador tras el hallazgo de la Refutación #8 (MODEL_REFUTATIONS.md)
y registrada en ADR-013 (DECISIONS.md) — ver detalle abajo. Nada del
pipeline ni de los contratos se tocó.

(a) Hero de entrada (`#hero-tune`, `.btn-sintonizar`): al cargar la página,
la única acción visible es un botón grande "▶ SINTONIZAR" — nada más compite
(workspace, deck, playlist, timeline y controles de transporte quedan
`display:none` hasta elegir modo, vía `body.mode-chosen`). Un solo click
hace `switchMode('emisora')` (ahora devuelve la promesa de
`activateEmisoraEngine()`, cambio quirúrgico de una línea) y encadena
`broadcastEngine.tune()` — el mismo flujo que antes requería dos clicks
(botón de modo + PLAY) ahora es uno. Debajo, un enlace secundario discreto
("o entrar en modo libre") da acceso al modo libre sin competir visualmente.
(b) `.control-deck` (biblioteca de señales + sintetizador de vinilo) y
`.playlist-drawer` (cola/archivo) pasan a paneles superpuestos ocultos por
defecto en cualquier tamaño de viewport (antes el colapso solo existía
&lt;1023px); se abren con los botones `[DECK]`/`[LIST]` del header — que
ahora son visibles siempre, no solo en mobile — y se cierran tocando fuera
del panel. Esto también resuelve (c) parcialmente: al quedar el slider de
volumen del sintetizador de vinilo plegado por defecto, solo el control de
la barra LED inferior queda visible — un solo control de volumen, no dos.
(c) Refutación #8 (MODEL_REFUTATIONS.md) encontró la causa raíz: el
control de volumen no bajaba el audio real en modo radio porque
`radio-engine.js` no exponía ganancia (source conectado directo a
`audioContext.destination`, sin `GainNode` ni `setVolume`). El operador
autorizó el arreglo (ADR-013): se agregó un `GainNode` (creado en `tune()`,
interpuesto entre cada source y `destination`) y un método
`setVolume(0..1)` en `RadioEngine` — cambio quirúrgico, nada más del
engine se tocó. `index.html` llama `broadcastEngine.setVolume(currentVolume
/ 100)` desde el mismo punto donde ya sincronizaba el volumen de YouTube en
modo libre. Resultado: un solo control de volumen visible (el slider del
sintetizador de vinilo queda plegado por defecto, punto b), funcional en
ambos modos.
(d) Responsive: se encontró y corrigió un bug preexistente de layout en
`body{grid-template-rows}` bajo 1023px — la regla mobile solo definía 4
pistas de grid para 5 hijos en el flujo (`psico-header`, `header`,
`app-layout`, `timeline-container`, `controls-row`), lo que le daba el
espacio flexible (`1fr`) al `<header>` en vez de al contenido principal
(la regla predata la incorporación de `psico-header` al layout). Se eliminó
el override incorrecto (la regla base de 5 pistas ya era correcta). Además,
`.header-title`/`.mobile-toggles`/`.header-status` se solapaban en la
columna 6 del grid de 12 columnas del header interno, forzando un salto de
fila — se corrigió con columnas explícitas sin solape. Se agregó un
breakpoint a 480px para apilar la fila de controles de transporte y
volumen (antes desbordaba en teléfonos angostos).

Evidencia — puntos 3 y 4 del criterio de éxito (verificación mecánica en
navegador, esta sesión):
3. Modo libre operativo tras el hero: cambia de modo, YouTube API inicializa,
   controles PREV/NEXT/SHUFFLE/LOOP visibles, control de volumen sube de
   80% a 90% y se refleja en `#telemetry-vol` (confirmado con
   `player.getVolume` indirectamente vía la UI).
4. Modo radio intacto: `station.json` se carga, `tune()` sintoniza,
   título/espectro/progreso se actualizan en vivo (verificado con logs de
   consola limpios — sin errores — y capturas en 800×450 y 390×844).
   `test_station/`, `linked_station/`, `compressed_station/` no fueron
   tocados por el alcance de UI de este milestone; sí ejercitados contra el
   `radio-engine.js` modificado (ver punto 5) sin regresión.
5. GainNode (ADR-013) verificado mecánicamente en modo radio: tras
   sintonizar, `broadcastEngine.gainNode.gain.value` sigue a
   `currentVolume` en todo el rango — 80%→60%→90%→0%→80% probado con los
   botones `[-]`/`[+]` y `setVolumeAndUnmute()` directamente, valores
   exactos (`0.6`, `0.9`, `0`, `0.8`). `test_station/` (RSIG-1) recargado
   de forma independiente tras el cambio del engine: sintoniza y transmite
   sin errores de consola — sin regresión.

Viewport 390×844: sin desborde horizontal
(`document.documentElement.scrollWidth === clientWidth === 390`,
confirmado con JS), hero, modo radio y panel `[DECK]` legibles y usables.

**Puntos 1 y 2 del criterio de éxito (verificación del operador en desktop
real y en móvil real): pendiente verificación humana desktop + móvil.** No
se marca la casilla de este milestone en MILESTONES.md hasta esa
confirmación.

### Hallazgo nuevo — reproducción en segundo plano en iOS (no bloquea M7)

Reportado por el operador: en iOS, la radio deja de sonar cuando la app
pasa a segundo plano — limitación de plataforma, no defecto de este
milestone (iOS suspende el `AudioContext` de Web Audio API cuando la
pestaña/PWA pierde foco; no es un bug de `radio-engine.js` ni de
`index.html`, es el comportamiento documentado de WebKit en iOS).
Candidato a milestone futuro, no a arreglo dentro de este: **reproducción
en segundo plano en iOS — requiere salida vía elemento `<audio>` +
Media Session API; es ingeniería propia (cambiar el mecanismo de salida de
audio del engine), no un parche.** Fuera de alcance de Milestone 7
(alcance declarado: solo UI, cero cambios estructurales al engine más allá
del `GainNode` de ADR-013).

## Vigilancia

- Percepción del operador (sin síntoma observado): posible salto de
  contenido en transiciones. Medición actual: duración declarada=decodificada
  en 10/10 (Milestone 5, `production_station/`). Solo escala a refutación si
  se observa.
