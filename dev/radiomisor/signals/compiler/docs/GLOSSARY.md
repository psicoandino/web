# GLOSSARY — Vocabulario del compilador Radiomisor

**Señal** — El átomo del sistema. Una intención de emisión: "esto debe poder
ser emitido". Concepto del dominio, independiente de fuente, obtención,
compilación y codificación. Forma de declaración actual: recurso + metadata
declarada + perfil.

**Estación** — El programa. Producto del linker: índice, orden, epoch,
señales enlazadas. No es unidad de trabajo.

**Adquisición** — Un evento de captura de una fuente externa. Unidad del
Origin Store. Identidad = hash del contenido capturado. Inmutable.

**Origin Store** — Almacén append-only, content-addressed y privado de
adquisiciones. La materia prima del compilador. Frontera donde empieza la
reproducibilidad. Nunca se distribuye.

**Recurso** — La identidad lógica de una fuente (p. ej. una canción) a
través de sus adquisiciones. El índice de recursos resuelve
recurso → adquisición vigente.

**CAR (Canonical Audio Representation)** — El lenguaje interno del
compilador: representación canónica del audio decodificado, con derivación
declarada. Es un valor que circula entre etapas; no es unidad, producto ni
contrato público. Ciega hacia adelante.

**Acta** — Registro declarativo que acompaña a todo objeto derivado:
de qué deriva, con qué herramienta/versión/parámetros, y hashes. Un objeto
sin acta no existe para el sistema.

**Frontend** — Etapa que decodifica una adquisición a la CAR inicial.
Su CAR es libre de transformaciones irreversibles.

**Pass** — Transformación CAR → CAR declarada, a nivel señal (trim, fades,
ganancia). Puede ser irreversible; nunca no-declarada.

**Medición (análisis interno)** — CAR → datos para consumo interno o
exportación al linker (LUFS, duración). No produce artefactos publicados.

**Backend** — Etapa CAR → artefacto publicado. Único lugar donde existen
códecs, bitrates y parámetros de salida. Agregar un códec = agregar un
backend, cero cambios en otras etapas.

**Backend de datos** — Backend cuyo artefacto no es audio (p. ej. el
espectro para visualización, derivado de la señal emitida).

**Linker** — Etapa que enlaza señales compiladas en una estación. Dueño de
las decisiones de nivel programa (orden, epoch, ganancia relativa) usando
las mediciones exportadas por cada señal. No recompila.

**Perfil** — Conjunto nombrado de parámetros de compilación (códec, bitrate,
sample rate, canales, loudness objetivo...). Configuración, nunca código.

**Toolchain fijada** — Versiones exactas de las herramientas declaradas en
actas. Base del determinismo: mismo input + misma toolchain → mismos bytes.

**Forma normal (hashing form)** — Serialización canónica versionada usada
solo para computar la identidad de una CAR. Implementación versionada, no
contrato.

**Engine** — El runtime de emisión en navegador (radio-engine.js).
Consumidor de los contratos de salida; no es parte del compilador.
Su invariante: "time is truth" — el estado se computa desde el epoch,
nunca se almacena.

**RSIG / RM-STATION** — Formatos de artefacto publicados (versión actual:
RSIG-1, RM-STATION-1). Su evolución se rige por D3 (pendiente).
