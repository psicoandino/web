# FOUNDATION — Constitución del compilador Radiomisor

> Cambia casi nunca.

## Propósito

Radiomisor es un compilador. El audio es su lenguaje fuente. Transforma
intenciones de emisión en artefactos estáticos, reproducibles en navegador,
sin backend.

## Principios

1. **Contratos sobre implementación.** La arquitectura es el conjunto de
   contratos; parámetro es todo lo que varía sin romper uno.
2. **Semántica sobre representación.** Un contrato dice qué garantiza algo,
   nunca cómo se almacena.
3. **Toda transformación se declara.** Lo irreversible no está prohibido;
   lo no-declarado sí.
4. **Compilar es función pura.** Mismo input, misma toolchain, mismos bytes.
   La reproducibilidad empieza en el Origin Store — nunca antes.
5. **Un dueño por responsabilidad.** Responsabilidad sin dueño = defecto
   de modelo.
6. **El modelo define al compilador**, no al revés. El átomo es la señal:
   una intención de emisión.

## Límites

- El Origin Store es privado: jamás se distribuye.
- El engine es consumidor de los contratos, no parte del compilador.
- La fuente externa es no-determinista por naturaleza; no se promete
  reproducibilidad hacia atrás de la captura.

## Reglas de cambio

- `FOUNDATION.md` cambia casi nunca.
- `CONTRACTS.md` cambia solo por falla demostrada en producción o
  contradicción demostrada por el código. Nunca por una idea nueva.
- Todo lo demás vive en `DECISIONS.md`, `THEORY.md` o código.
- **Cada documento nuevo requiere eliminar o fusionar otro.** La
  documentación también tiene deuda técnica; destilar sin perder potencia.

**El código tiene el derecho de refutar la teoría. La teoría ya no tiene
derecho a posponer el código.**

## Nota al Ricardo del futuro

No protejas la arquitectura. Protege el criterio con el que la cambias.

Si descubres que la CAR estaba mal, que el Linker no debía existir o que D2
fue una mala decisión, el mecanismo habrá funcionado: el objetivo nunca fue
acertar a la primera, sino que las hipótesis fueran explícitas, las
decisiones trazables, las refutaciones registradas, y los cambios ocurrieran
por evidencia y no por entusiasmo. Con ese proceso, incluso una arquitectura
equivocada evoluciona bien; sin él, incluso una brillante se degrada.

**La evidencia tiene autoridad; el diseño solo tiene responsabilidad.**
