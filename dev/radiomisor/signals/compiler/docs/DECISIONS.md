# DECISIONS — Architecture Decision Records

> Registro vivo. Toda decisión nueva se agrega aquí; los contratos no se tocan.
> Formato: contexto → decisión → consecuencias.

## ADR-001 — El problema es de diseño de compilador, no de audio
**Contexto:** la optimización inicial buscaba parámetros (códec, bitrate).
**Decisión:** tratar Radiomisor como compilador; el audio es el lenguaje
fuente. Los parámetros se investigan después de fijar la arquitectura.
**Consecuencia:** el objetivo pasó a ser que todo parámetro sea configuración
y no código.

## ADR-002 — Separación Origin Store ≠ IR
**Contexto:** el primer diseño de D1 llamó "IR" a la captura del origen.
La auditoría demostró que era un source cache, no una representación
intermedia: cada etapa habría tenido que decodificar contenedores arbitrarios.
**Decisión:** dos capas — Origin Store (captura) y CAR (forma canónica).
**Consecuencia:** las etapas solo conocen CAR; el acoplamiento al formato de
origen queda confinado al frontend.

## ADR-003 — Semántica sobre representación física en la CAR
**Contexto:** el primer contrato de CAR fijaba float32/sample rate nativo.
**Decisión:** el contrato define semántica (PCM lineal, sin pérdida en el
frontend, derivación declarada); la representación física es implementación.
La identidad se computa sobre una forma normal versionada (`hashing_form`).
**Consecuencia:** la implementación puede cambiar de formato interno sin
romper el contrato ni invalidar hashes históricos.

## ADR-004 — El invariante de no-pérdida pertenece al frontend
**Contexto:** contradicción detectada en auditoría: "CAR libre de
transformaciones irreversibles" vs passes de trim/loudness (irreversibles).
**Decisión:** la no-pérdida es invariante de la CAR *inicial* (frontend).
Las CAR derivadas admiten transformaciones irreversibles declaradas.
**Consecuencia:** lo prohibido no es lo irreversible sino lo no-declarado.

## ADR-005 — El átomo del sistema es la señal
**Contexto:** responsabilidades sin dueño (metadata, loudness relativo,
espectro) reaparecían porque la unidad de compilación no estaba definida.
**Decisión:** la señal — una intención de emisión — es la unidad de
compilación. La estación es producto del linker; la adquisición es unidad
del store; la CAR es valor.
**Consecuencia:** incrementalidad por señal; decisiones de nivel programa
van al linker usando mediciones exportadas (modelo translation-unit /
link-time).

## ADR-006 — La señal se define por el dominio, no por su forma actual
**Contexto:** la definición "recurso + metadata + perfil" estaba cerca de la
implementación y podría no sobrevivir a fuentes futuras (síntesis, IA,
archivos locales, silencio programado).
**Decisión:** la señal es "esto debe poder ser emitido". La tupla
(recurso, metadata declarada, perfil) es su forma de declaración actual,
registrada aquí y no en el contrato.
**Consecuencia:** agregar tipos de señal futuros no toca CONTRACTS.md.

## ADR-007 — El espectro es un backend de datos
**Contexto:** el espectro estaba clasificado como "análisis" pero produce un
artefacto publicado que consume el engine, y debe reflejar la señal emitida
(degradada), no la CAR de máxima fidelidad.
**Decisión:** el espectro es un backend que deriva de la salida emitida.
**Consecuencia:** "análisis" queda reservado a mediciones internas (LUFS,
duración) que alimentan passes o al linker.

## ADR-008 — Epoch declarado, no timestamp de build
**Contexto:** el publisher actual escribe `epoch = now()` en cada build,
rompiendo el invariante del engine ("time is truth") y la reproducibilidad.
**Decisión:** el epoch es dato declarado e inmutable del programa, propiedad
del linker.
**Consecuencia:** recompilar no reinicia la emisora. (Pendiente de
implementación — defecto conocido del código actual.)

## ADR-009 — Cierre de la fase conceptual
**Contexto:** las últimas sesiones solo reubicaban responsabilidades sin
agregar capacidades — señal de madurez del modelo.
**Decisión:** ninguna discusión conceptual nueva sin contradicción demostrada
por el código o necesidad real. La implementación tiene derecho de refutación.
**Consecuencia:** el trabajo siguiente es D2–D5 y código, no teoría.

## ADR-010 — El engine implementa lo que declara (resolución de Refutación #5)
**Contexto:** la verificación auditiva humana demostró que radio-engine.js
lee `codec.channels` pero solo implementa mono: estéreo suena por un canal
y ralentizado 2x. El contrato de facto de RSIG-1 era más estrecho que el
declarado. Opciones: (A) el backend emite dentro del contrato de facto,
(B) el engine desintercala según `codec.channels`, (C) A ahora + B después.
**Decisión:** B. El engine se corrige para implementar íntegramente los
campos de codec que RSIG-1 ya declara (channels, sampleRate). Cambio
quirúrgico que convierte canales en parámetro real del compilador, en vez
de congelar mono como techo (A escondía el defecto).
**Consecuencia:** el despacho por campos de codec queda establecido en la
práctica — embrión de D3. D2 queda parcialmente decidido: "el engine
implementa todo lo que el artefacto declara"; sigue abierto el encapsulado
del payload (base64 vs binario), a decidir cuando un milestone lo exija.
Primera modificación del engine en el proyecto: ocurre por refutación
registrada, no por idea.

## ADR-011 — D2 decidido: manifiesto + binario (RSIG-2)
**Contexto:** el objetivo original del producto es distribución de costo
mínimo ("nivel cero: el más económico, la persona escucha y disfruta" —
criterio del operador, 2026-07-11). Base64 impone +33% de peso permanente
sobre cualquier payload comprimido.
**Decisión:** nace RSIG-2: el `.rsig` es un manifiesto JSON pequeño que
referencia un archivo binario adyacente; el engine hace fetch del binario
(arrayBuffer) y decodifica con `decodeAudioData`. RSIG-1 (PCM base64
embebido) permanece válido y reproducible para siempre.
**Consecuencia:** cero overhead de encapsulado; puerta abierta a streaming
progresivo; el engine gana una rama de carga nueva (ver ADR-012).

## ADR-012 — D3 decidido: despacho por format + codec.type, congelado
**Contexto:** el engine ya despacha de facto por codec.channels (ADR-010);
faltaba la regla general antes de introducir el segundo formato.
**Decisión:** el engine despacha por `format` + `codec.type`. Artefactos
publicados reproducibles para siempre; códecs/formatos nuevos se agregan
como ramas de decodificación, nunca reemplazando. Códec, bitrate y
encapsulado quedan convertidos en parámetros del compilador.
**Consecuencia:** los "niveles" del producto (perfiles de costo/calidad)
son configuración, no arquitectura. Insumo directo para D5: el nivel cero
es el primer perfil nombrado.

## ADR-013 — El engine expone ganancia (resolución de Refutación #8)
**Contexto:** Milestone 7 (experiencia de entrada) exige un control de
volumen único y funcional. `radio-engine.js` conectaba el
`AudioBufferSourceNode` directo a `audioContext.destination` en ambas ramas
de reproducción (RSIG-1 y RSIG-2) — sin `GainNode` ni método de volumen. El
control de `index.html` ya invocaba el patrón `player.setVolume(...)` para
el modo emisora, pero ese método nunca existió del lado del engine: el
volumen nunca bajó el audio real, solo lo simulaba en la UI local
(Refutación #8, MODEL_REFUTATIONS.md).
**Decisión:** el operador autoriza una modificación quirúrgica de
`radio-engine.js`: se agrega un `GainNode` creado junto con el
`AudioContext` (en `tune()`), interpuesto entre cada source y
`destination`, y un método público `setVolume(value)` (rango 0–1, con
clamp) que ajusta su ganancia. Ningún otro comportamiento del engine
cambia — mismo patrón que ADR-010 ("el engine implementa lo que declara"):
el cambio nace de una refutación registrada, no de una idea.
**Consecuencia:** `index.html` llama `broadcastEngine.setVolume(currentVolume
/ 100)` desde el mismo punto donde ya sincroniza el volumen de YouTube en
modo libre — un solo control de volumen, funcional en ambos modos.
Verificado mecánicamente: `gainNode.gain.value` sigue a `currentVolume` en
todo el rango (0 a 1), sin regresión en RSIG-1 (`test_station/`) ni RSIG-2
(reproducción normal en la raíz). Refutación #8 queda cerrada apuntando a
este ADR.

## Decisiones pendientes (se registrarán aquí al tomarse)
- D4: naming content-addressed vs posicional; política de re-adquisición
  (coexistencia vs superseded).
- D5: esquema de la config de estación y del perfil de compilación.
- Valores de parámetros para marcha blanca (códec, bitrate, sample rate,
  canales, LUFS objetivo) — requiere la investigación de audio, después de D2/D3.
