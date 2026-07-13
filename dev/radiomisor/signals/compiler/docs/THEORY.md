# THEORY — El modelo del sistema

> Explica el lenguaje que el código implementa. Los contratos exactos viven
> en CONTRACTS.md; aquí vive el porqué de la forma.
> Documento provisional: si con el tiempo su contenido migra a los ADRs y a
> los contratos, este archivo se reduce a documentación de onboarding o
> desaparece. Esa migración sería señal de madurez, no de pérdida.

## Dos sistemas, una frontera

Radiomisor contiene dos sistemas que no comparten conceptos:

- **Build system** (mundo Nix/Bazel): adquiere, almacena, cachea, invalida.
- **Compilador** (mundo LLVM): transforma señales en artefactos.

Cuando una responsabilidad parece de ambos, está mal asignada.

## La gramática

```
Signal → CAR → Pass* → Backend → Linker → Station
```

- **Signal** — el átomo. Una intención de emisión: "esto debe poder ser
  emitido". Concepto del dominio: canción, jingle, identificación, silencio
  programado, audio sintetizado. No depende de fuente ni de formato.
- **CAR** — el lenguaje interno. Valor que circula entre etapas: audio
  decodificado en forma canónica, con derivación declarada, ciego hacia
  adelante. No es unidad, producto ni contrato público.
- **Pass** — transformación CAR → CAR declarada, a nivel señal.
- **Backend** — CAR → artefacto publicado. Único lugar donde existen códecs
  y parámetros de salida. Nuevo códec = nuevo backend, cero cambios en el
  resto.
- **Linker** — enlaza señales compiladas en una estación. Dueño de las
  decisiones de nivel programa (orden, epoch, ganancia relativa), tomadas
  sobre las mediciones que cada señal exporta.
- **Station** — el programa. Producto, no unidad de trabajo.

## Por qué la señal es el átomo

Es la única unidad que da exactamente un dueño a cada responsabilidad:

- La **adquisición** como átomo definiría el compilador por cómo llegan las
  cosas, no por qué significa compilarlas.
- La **estación** como átomo mata la incrementalidad: cambiar una canción
  recompilaría todo.
- La **CAR** como átomo la obligaría a conocer su destino, perdiendo su
  ceguera hacia adelante.

La señal se compila de forma independiente y pura:
`compilar(señal, adquisición, toolchain, config) → artefactos + mediciones`.
Lo que ninguna señal puede decidir sola (loudness relativo, orden) es
decisión de enlace — la relación clásica translation-unit / link-time.

## El flujo completo

```
Fuente externa (no determinista)
      │ fetcher
      ▼
Origin Store ──── build system · unidad: adquisición
      │ frontend (decodificación declarada, sin pérdida)
      ▼
CAR ──── passes → mediciones → backends        · unidad: señal
      │ artefactos + mediciones exportadas
      ▼
Linker ──── orden, epoch, índice               · producto: estación
      ▼
Engine (runtime, consumidor de contratos)
```

## Los tres niveles de identidad

- **Adquisición:** hash del contenido capturado (una captura concreta).
- **Recurso:** identidad lógica a través de adquisiciones (el índice
  resuelve recurso → adquisición vigente).
- **CAR:** hash sobre una forma normal de serialización versionada.

## Historia

Este modelo salió de tres correcciones sucesivas, cada una el mismo error a
distinta escala — confundir niveles:

1. Origen ≠ IR (el "IR" era un source cache → nació el Origin Store).
2. Semántica ≠ representación (float32 era implementación, no contrato).
3. Unidad ≠ valor ≠ producto (la señal es el átomo; CAR y estación no).

La regla que cerró la fase: ninguna discusión conceptual nueva sin
contradicción demostrada por el código.
