# CONTRACTS — Contratos congelados del compilador

> Solo cambia por falla demostrada en producción o contradicción demostrada
> por el código. Estado por decisión al final del documento.

## El modelo (congelado)

```
Fuente externa (YouTube, futuras)
      │  fetcher (no determinista — frontera de reproducibilidad)
      ▼
Origin Store          [build system · unidad: adquisición]
      │
      ▼
Signal Compiler       [compilador · unidad: señal]
      │   frontend → CAR → passes → análisis/mediciones → backends
      ▼
Linker                [compilador · consume señales compiladas]
      │
      ▼
Estación              [programa emitido; el engine es su consumidor]
```

Tabla de dueños — toda responsabilidad tiene exactamente un dueño:

| Responsabilidad | Dueño |
|---|---|
| Captura, procedencia, append-only | Origin Store |
| Identidad lógica recurso → adquisición vigente | Índice de recursos (build system) |
| Decodificación declarada, CAR, passes, mediciones, backends, resolución de metadata | Compilación de señal |
| Orden, epoch, ganancia relativa entre pistas, índice del programa | Linker |
| Caché e invalidación: hash(señal + adquisición + toolchain + perfil) | Build system |

## D1-A — Origin Store  [CONGELADO]

Captura inmutable de la fuente en el momento de adquisición.

- **Unidad:** la adquisición. Identidad = hash del contenido capturado.
  La identidad es de-la-adquisición, no de-la-canción (la fuente puede
  servir bytes distintos en el tiempo).
- **Contenido por registro:** componentes de audio tal como el extractor los
  materializa (multi-componente permitido), acta de adquisición (procedencia,
  URL resuelta, format_id, lista de formatos disponibles al momento de
  adquirir, herramienta extractora + versión + opciones exactas, fecha,
  hashes de todos los componentes), metadata cruda del extractor filtrada de
  efímeros (sin URLs firmadas ni contadores volátiles; todo lo descriptivo se
  conserva), miniatura.
- **Política de captura:** siempre el mejor audio disponible. Política fija
  del store, no parámetro.
- **Invariantes:** append-only (re-adquirir crea registro nuevo, nunca
  sobrescribe) · verificable (registro cuyos hashes no cierran es inválido)
  · autosuficiente (test: recompilar la estación completa con la fuente
  externa apagada) · ciego hacia adelante (no conoce RSIG, station ni engine)
  · privado, jamás se distribuye.

## D1-B — CAR: Canonical Audio Representation  [CONGELADO]

**La CAR es la representación canónica del audio decodificado, suficiente
para que cualquier etapa del compilador opere sin conocer el origen ni el
backend. La representación física utilizada para materializarla es una
decisión de implementación siempre que preserve íntegramente este contrato.**

- **Es un valor**, el lenguaje interno del compilador. No es unidad de
  trabajo, ni producto, ni contrato público.
- **Contrato semántico:** audio PCM lineal en dominio del tiempo. La CAR
  producida por el **frontend** es libre de transformaciones irreversibles
  respecto del origen decodificado (sin resample, downmix, recorte,
  normalización ni compresión). Las CAR derivadas por passes pueden contener
  transformaciones irreversibles **declaradas**.
- **Derivación:** toda CAR debe poder responder de qué deriva y mediante qué
  transformación, herramienta y versión (acta de derivación). Determinismo
  bit a bit por toolchain fijada.
- **Identidad:** se computa sobre una forma normal de serialización
  versionada en el acta (`hashing_form: vN`). La forma normal es
  implementación versionada; el contrato no fija formato físico.
- **Ceguera hacia adelante:** la CAR no sabe qué backends existen.

## Etapas del Signal Compiler  [CONGELADO]

- **Frontend:** Origin Store → CAR inicial (decodificación declarada).
- **Pass:** CAR → CAR, con acta (trim, fades, ganancia). Nivel señal
  únicamente; lo que requiera visión de programa pertenece al linker.
- **Medición (análisis interno):** CAR → datos consumidos por otras etapas
  o exportados al linker (LUFS, duración). No produce artefactos publicados.
- **Backend:** CAR (o artefacto emitido) → artefacto publicado. Único lugar
  del sistema donde existen códecs, bitrates, sample rates de salida,
  canales de salida. El espectro para visualización es un backend de datos y
  se deriva de la señal emitida (lo que el oyente oye), no de la CAR de
  máxima fidelidad.
- **Metadata:** canal propio de la señal. La resolución
  declarada-vs-extraída ocurre en la compilación de señal; el linker solo
  copia el resultado al índice.

## Linker  [CONGELADO como concepto]

Consume señales compiladas y sus mediciones exportadas. Dueño de las
decisiones de nivel programa: orden, epoch, ganancia relativa entre pistas,
índice de la estación. No recompila señales; enlaza. El epoch de la emisora
es dato declarado e inmutable del programa, nunca timestamp de build.

## Frontera de determinismo  [CONGELADO]

La reproducibilidad del sistema empieza en el Origin Store. Desde ahí:
mismo input + misma toolchain + misma config → mismos bytes. Los encoders
lossy no son bit-deterministas entre versiones de herramienta: el
determinismo se garantiza por toolchain fijada y declarada en actas.
El engine es consumidor de los contratos de salida, no parte del compilador.

## Estado de decisiones

| Decisión | Estado |
|---|---|
| D1-A Origin Store | **Congelado** |
| D1-B CAR | **Congelado** |
| Átomo = señal (intención de emisión) | **Congelado** |
| D2 Contrato de artefacto (payload ↔ engine) | **Decidido** (ADR-011): manifiesto + binario (RSIG-2); RSIG-1 válido para siempre |
| D3 Versionado / despacho por codec.type | **Congelado** (ADR-012): despacho por format+codec.type; ramas que se suman, nunca reemplazan |
| D4 Identidad y direccionamiento de artefactos | Abierto — depende de D2 |
| D5 Config de estación (interfaz del compilador) | Abierto — cierra el ciclo |
