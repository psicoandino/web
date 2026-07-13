# MODEL_REFUTATIONS — Registro de refutaciones del modelo

> No es un archivo de bugs. Es el registro de cada vez que el código ejerce
> su derecho de refutación contra un contrato. Cada entrada termina en uno
> de dos resultados: "el contrato se mantiene" o "ADR-NNN creado".
>
> Ciclo completo: dominio → contratos → implementación → evidencia → decisiones.

## Formato

```
## Refutación #NNN — <título corto>

Contrato afectado: <D1-A | D1-B | átomo | ...>
Código observado: <qué pasó al implementar>
Hipótesis original: <qué afirmaba el contrato>
Resultado: El contrato se mantiene. | ADR-NNN creado.
```

## Experimentos de validación pendientes

- **Experimento 1 (valida D1):** YouTube ID → Origin Store → CAR.
  Sin RSIG, sin station, sin engine, sin linker, sin perfiles.
  Éxito = el objeto producido cumple el contrato D1 sin modificarlo.
- **Experimento 2 (ilumina D2):** CAR → Backend PCM → artefacto.
  Éxito = funciona sin tocar CONTRACTS; se espera que D2 se vuelva evidente.

---

## Refutación #1 — Identidad de adquisición y re-captura de contenido idéntico

Contrato afectado: D1-A

Código observado: `OriginStore.acquire()` se implementó como content-addressed:
si dos adquisiciones producen el mismo hash de contenido, la segunda no
crea un directorio nuevo, reutiliza el registro existente (evita duplicar
bytes idénticos y garantiza el mismo `acquisition_hash` entre corridas del
slice contra el mismo YouTube ID).

Hipótesis original: "append-only (re-adquirir crea registro nuevo, nunca
sobrescribe)" podía leerse como "cada llamada a `acquire()` debe generar un
registro distinto, siempre".

Resultado: El contrato se mantiene. Lectura correcta: identidad = hash del
contenido, por lo tanto contenido idéntico ⇒ misma identidad ⇒ mismo
registro; "nunca sobrescribe" prohíbe mutar un registro existente, no
prohíbe la deduplicación natural de un store direccionado por contenido.
Esta lectura fue necesaria para que el criterio de éxito del Milestone 1
(dos corridas del slice completo, mismo SHA-256 de `test.rsig`) fuera
alcanzable sin artificios — confirmado en terminal con dos ejecuciones de
`compiler/slice_cli.py` sobre `lGUNGiuaMI4`.

## Refutación #2 — Backend PCM sin resample: D2 se vuelve parcialmente evidente

Contrato afectado: Etapas del Signal Compiler (Backend)

Código observado: el PCM Backend mínimo no fuerza sample rate ni canales de
salida — los toma directamente de la CAR, que a su vez preserva lo que el
frontend decodificó del componente adquirido (en el experimento: 22050 Hz,
mono, 16-bit, determinado por el stream de origen, no por el compilador).
`radio-engine.js` ya lee `codec.sampleRate`/`codec.channels` por señal
desde el propio artefacto, así que esta variabilidad no rompe la
reproducción (a confirmar en Milestone 2).

Hipótesis original: "único lugar del sistema donde existen... sample rates
de salida, canales de salida" sugiere que el backend decide activamente
estos parámetros en cada compilación.

Resultado: El contrato se mantiene. "Decidir" incluye la decisión de no
transformar. Evidencia para D2: un backend puede pasar-through la CAR como
política válida y mínima; D2/D5 deberán decidir si esa pasividad es
aceptable de forma permanente o si un perfil debe forzar un target
explícito para consistencia entre señales de distintas fuentes/formatos.

## Refutación #3 — "Mejor audio disponible" depende de lo que el extractor puede alcanzar ese día

Contrato afectado: D1-A

Código observado: con el cliente `android` de yt-dlp (usado para evitar el
requisito de PO token en los streams de solo-audio), el único formato
descargable para `lGUNGiuaMI4` fue `18` — un mp4 muxed audio+video de
22050 Hz — no un stream de audio puro. `bestaudio/best` cayó a ese
formato porque los formatos de solo-audio quedaron filtrados por el propio
extractor (403 sin PO token).

Hipótesis original: "siempre el mejor audio disponible" se leía como
"siempre existe un componente de solo-audio disponible".

Resultado: El contrato se mantiene. El contrato dice "componentes de audio
tal como el extractor los materializa" — un contenedor muxed con pista de
audio sigue siendo un componente de audio válido para el store; el
frontend lo decodifica igual. La política es correcta tal como está
escrita; lo que varía es la disponibilidad real de formatos, que es
responsabilidad de la fuente externa, no del store.

## Refutación #4 — El engine consume `test.rsig` sin modificarse; confirmación auditiva queda fuera del entorno de verificación automatizado

Contrato afectado: Ninguno (Milestone 2, no D1/D1-B) — fricción de proceso,
no de modelo.

Código observado: se sirvió `test_station/` (station.json de una señal +
`signals/test.rsig`, copia del artefacto del slice) con
`python -m http.server` y se ejecutó `radio-engine.js` sin tocarlo en un
navegador automatizado. `loadStation()`, `loadSignal()` y `decodeSignal()`
corrieron sin error: el fetch de `signals/test.rsig` devolvió 200, el
`atob`+`Int16Array`+`Float32Array` decodificó el payload base64, y
`audioContext.createBuffer(codec.channels, samples.length,
codec.sampleRate)` se construyó con 44100 Hz estéreo — valores leídos del
propio artefacto, distintos de los 22050 Hz mono de los `signal_NNN.rsig`
existentes en `station.json` — confirmando en la práctica la predicción de
la Refutación #2 (el engine ya es agnóstico al sample rate/canales
declarados por señal). `AudioContext.state` quedó en `"running"` y
`currentSource` activo sin excepciones. Se observó además que, en el
navegador automatizado (pestaña en segundo plano, sin foco de usuario real),
`audioContext.currentTime` avanza más lento que `Date.now()` — es decir el
reloj de audio se atrasa respecto al reloj de pared que usa
`currentOffset()`. Esto es consistente con *throttling* de pestañas en
background, no con un bug del engine.

Hipótesis original: "audio audible en navegador" (criterio de éxito del
Milestone 2) se puede confirmar íntegramente desde una sesión de
verificación automatizada.

Resultado: El contrato se mantiene — el engine no requirió ningún cambio y
el pipeline completo (fetch → decode → buffer → source.start) corrió sin
error, que es todo lo que el engine promete. Lo que no se puede demostrar
desde este entorno es la percepción auditiva humana, porque el navegador
automatizado no tiene altavoces ni oído. Fricción registrada, no ADR: el
criterio de éxito de un milestone que depende de percepción humana necesita
un paso de confirmación manual explícito — ver instrucciones de reproducción
en la respuesta de esta sesión.

## Refutación #5 — El engine declara canales pero solo implementa mono (verificación auditiva humana, 2026-07-11)

Contrato afectado: Refutación #2 (su hipótesis de cierre) y la decisión
abierta D2. Ningún contrato congelado de D1.

Código observado: en reproducción real con oído humano, el `test.rsig`
estéreo/44100 del slice sonó (a) solo por el canal izquierdo y (b)
ralentizado ~2x. Causa única: `radio-engine.js` construye el AudioBuffer
con los canales declarados pero escribe el payload intercalado (L,R,L,R…)
como una sola secuencia en el canal 0, sin desintercalar. El canal derecho
queda vacío (síntoma a) y el buffer declara el doble de frames reales, de
modo que la reproducción dura el doble a la mitad de velocidad (síntoma b).
El engine *lee* `codec.channels` pero nunca lo *implementó*: el compilador
viejo solo producía mono y el código de decodificación asumió mono para
siempre.

Hipótesis original: (Refutación #2) "radio-engine.js ya lee
codec.sampleRate/channels por señal, así que la variabilidad del
pass-through no rompe la reproducción". La verificación automatizada de la
Refutación #4 la dio por confirmada porque el pipeline corrió sin
excepciones — pero "sin excepciones" no es "correcto": el defecto era
inaudible para un verificador sin oídos.

Resultado: Refutación #2 queda refutada en su parte optimista. El contrato
de facto de RSIG-1 es más estrecho que el declarado: mono-only (ley de
Hyrum). Consecuencias: (1) el pass-through como política por defecto del
backend queda invalidado — un backend debe emitir dentro del contrato de
facto del consumidor o el consumidor debe ampliarse, y esa es exactamente
la decisión D2/D3; (2) el criterio de éxito de milestones perceptuales debe
incluir verificación humana obligatoria, no opcional. Resuelta 2026-07-11: ADR-010 creado
(opción B — el engine implementa lo que declara).

---

## Refutación #6 — Las 10 señales de `station.json` actual decodifican todas estéreo/44100 con el pipeline nuevo; el criterio "al menos una mono" del Milestone 3 no se puede satisfacer dentro del conjunto declarado

Contrato afectado: Ninguno (Milestone 3, criterio de éxito, no D1/D1-B/D2) —
contradicción entre el criterio del milestone y la evidencia del código, no
del modelo.

Código observado: se probaron las 10 IDs presentes en `station.json`
(`lGUNGiuaMI4, yZ8mJgcsbw8, 3IRBm9DjBdQ, 5a_YthPacB0, X7P8zX3xl_A,
FH2v50zAbqo, 1nejjuPEJkE, 0e_kHYrEhqg, h_I9xto06A0, IhnOpwOMHgk`) a través de
`OriginStore → Frontend` (pipeline nuevo, sin tocar CONTRACTS). Las 10
decodificaron `channels=2, sample_rate=44100`. Ninguna produjo mono. Esto
contradice la Refutación #3 (que observó `18` — mp4 muxed 22050 mono — para
`lGUNGiuaMI4` bajo el mismo client `android`): la disponibilidad de formatos
de yt-dlp cambió entre sesiones (confirma la Refutación #3: "lo que varía es
la disponibilidad real de formatos... responsabilidad de la fuente externa").

Hipótesis original: Milestone 3 asume que, entre 3 señales elegidas del
conjunto ya presente en `station.json`, la variabilidad natural de formato
de origen produciría al menos un resultado mono y uno estéreo, demostrando
el despacho por señal (ADR-010) sin que el linker ni el backend fuercen
canales.

Resultado: decidido por el usuario (2026-07-11) — opción (b). Se acepta el
milestone con las 3 señales estéreo ya compiladas en `linked_station/`
(`lGUNGiuaMI4, yZ8mJgcsbw8, 3IRBm9DjBdQ`). El mecanismo de despacho por señal
ya está listo para mono en cuanto una fuente lo produzca: el backend PCM es
pass-through (Refutación #2) y el engine desintercala según `codec.channels`
(ADR-010) — no hace falta tocar código, solo un input mono real. Queda
registrado como pendiente: ninguna de las 10 IDs de `station.json` lo
demuestra hoy; se demostrará el día que una fuente externa entregue mono
para alguna de ellas, o se elija deliberadamente un ID fuera de la lista.

Ratificado explícitamente por el operador (2026-07-11). El despacho mono ya
quedó demostrado en Milestone 2 con signal_001 legado; el criterio "al menos
una mono" del Milestone 3 era redundante y se elimina de su texto en
MILESTONES.md.

## Refutación #7 — El linker no tiene "resultado de metadata" que copiar: el pipeline nuevo aún no resuelve title/artist/album/year

Contrato afectado: sección Linker + Etapas del Signal Compiler (Metadata).

Código observado: CONTRACTS.md dice "el linker solo copia el resultado al
índice" de una resolución declarada-vs-extraída que ocurre "en la
compilación de señal". El pipeline nuevo (`OriginStore → Frontend →
PCMBackend`) no tiene ninguna etapa que produzca ese resultado — solo
`Acquisition.acta["raw_metadata"]` (crudo, sin resolver) existe. El linker
implementado en este milestone (`compiler/linker/linker.py`) escribe
`station.json` con únicamente `file/id/duration` por señal — omite
title/artist/album/year en vez de leerlos directamente del acta, porque
hacerlo sería el linker resolviendo metadata (rol que no le pertenece).
`radio-engine.js` no lee esos campos (confirmado por grep: solo usa
`signal.id` para logging), así que el criterio de éxito del Milestone 3 no
lo requiere.

Hipótesis original: el índice de la estación siempre incluye
title/artist/album/year (como en el `station.json` legado, escrito por el
publisher viejo).

Resultado: El contrato se mantiene. El índice sin title/artist/album/year es
válido para Milestone 3 (el engine no los consume). La etapa de metadata
(resolución declarada-vs-extraída, propiedad de la compilación de señal)
queda como casilla nueva en Fase 2 de IMPLEMENTATION.md; el linker la
copiará al índice cuando exista. Resuelta por el operador (2026-07-11).

---

*(Estado 2026-07-11: Milestones 0-3 cerrados. Refutaciones #1-#7
resueltas.)*

## Milestone 4 — Sin refutaciones

Contrato afectado: ninguno.

Código observado: `AACBackend` (CAR -> RSIG-2, AAC-LC nivel cero) y el
cambio quirúrgico en `Linker._link_signal` (extracción de binario
adyacente) se implementaron dentro de CONTRACTS.md sin contradicción — el
backend sigue siendo "el único lugar donde existen códecs, bitrates,
sample rates y canales de salida"; el linker no recompila ni decide
códec, solo escribe el binario que el backend ya produjo. La rama
`decodeRSIG2` en `radio-engine.js`, despachada por `format:codec.type`,
no tocó la rama `decodePCMBase64` (RSIG-1) — verificado mecánicamente
(`linked_station/`, `test_station/` sin regresión).

Un riesgo quedó identificado pero no observado como defecto: la duración
declarada en el manifiesto RSIG-2 se calcula sobre los frames de la CAR
de entrada (igual que PCMBackend), no sobre el audio ya decodificado por
`decodeAudioData` — un encoder AAC puede introducir *priming/padding*
que desplace levemente la duración real del buffer decodificado respecto
de la declarada. No se demostró como falla (las 3 señales de Milestone 4
no mostraron error mecánico ni offset visible en consola), así que no se
registra como refutación; queda anotado aquí para el día que un milestone
futuro dependa de precisión de duración submuestral en RSIG-2.

Resultado: El contrato se mantiene.

## Milestone 5 — Sin refutaciones

Contrato afectado: ninguno.

Código observado: `compiler/metadata/` (resolución declarada-sobre-extraída)
y `compiler/backends/spectrum_backend.py` (espectro como backend de datos,
ADR-007) se implementaron dentro de CONTRACTS.md sin contradicción — el
linker sigue sin decidir metadata ni códecs, solo copia al índice el
resultado que le entregan las etapas correspondientes (Refutación #7,
ahora resuelta con implementación); el espectro se deriva del binario ya
emitido por `AACBackend`, nunca de la CAR, tal como exige ADR-007.

El riesgo anotado en Milestone 4 (gaps por priming/padding del encoder AAC:
la duración declarada por el backend de audio viene de la CAR, no del
audio ya decodificado) se verificó explícitamente en esta corrida:
decodificando los 10 `.m4a` de `production_station/` de forma independiente
y comparando contra la duración declarada, la diferencia fue `0.0000 s` en
las 10 señales — el riesgo no se manifestó con este perfil/toolchain
(`static_ffmpeg` ffmpeg 7.0, contenedor M4A, AAC-LC 96 kbps/44100/estéreo).
No se registra refutación porque no hubo discrepancia que refutar; el
riesgo queda anotado para perfiles o toolchains futuros que puedan
comportarse distinto.

Verificación auditiva humana de las 10 señales y sus transiciones
COMPLETADA (Ricardo, 2026-07-11): sin anomalías — ver IMPLEMENTATION.md,
Milestone 5.

Resultado: El contrato se mantiene.

## Refutación #8 — El arreglo del volumen en modo radio requiere tocar `radio-engine.js`, fuera de alcance de Milestone 7

Contrato afectado: Ninguno de D1-D3/CONTRACTS.md — alcance declarado de
Milestone 7 ("Alcance: solo UI (`index.html`). Cero cambios a
`radio-engine.js`").

Código observado: `radio-engine.js` conecta el `AudioBufferSourceNode`
directo a `this.audioContext.destination` en ambas ramas de reproducción
(RSIG-1 `decodePCMBase64` y RSIG-2 `decodeRSIG2`, líneas ~285 y ~350). No
existe ningún `GainNode` intermedio, ni un método `setVolume`/`setGain` en
la clase `RadioEngine`, ni ninguna propiedad pública pensada para ese fin —
confirmado por grep (`volume|gain` sobre el archivo completo: cero
coincidencias). `index.html` ya invoca el patrón correcto
(`typeof player.setVolume === 'function'`) para el modo emisora, pero ese
método nunca existió del lado del engine — por eso el control nunca bajó el
volumen real, solo lo simuló en la UI local.

Hipótesis original: el control de volumen inoperante en modo radio era un
"bug de UI preexistente" (Milestone 6, IMPLEMENTATION.md § Deuda conocida)
arreglable desde `index.html` únicamente.

Resultado: el operador decidió opción (a) — ADR-013 creado
(`radio-engine.js` gana un `GainNode` + método `setVolume(0..1)`, cambio
quirúrgico, mismo patrón que ADR-010). Ver DECISIONS.md, ADR-013. El
control único de volumen de `index.html` queda funcional en ambos modos
(emisora y libre), verificado mecánicamente: `gainNode.gain.value` sigue a
la UI en todo el rango, sin regresión en RSIG-1 ni RSIG-2.

**Refutación #8: cerrada → ADR-013 creado.**
