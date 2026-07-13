# Materia prima metodológica — destilado de una fase de diseño

> Conocimiento reutilizable extraído de una secuencia real de diseño
> arquitectónico. Sin referencias al proyecto de origen.

## I. Principios

1. **La arquitectura es el conjunto de contratos.** Parámetro es todo lo que
   varía sin romper un contrato. Diseñar = decidir dónde está esa frontera.
2. **Semántica sobre representación.** Un contrato define qué garantiza algo,
   nunca cómo se almacena o implementa. Todo "cómo" en un contrato es una
   decisión estructural disfrazada.
3. **Lo irreversible no se prohíbe; lo no-declarado sí.** Las transformaciones
   con pérdida son legítimas si dejan acta de qué, con qué y por qué.
4. **Un dueño por responsabilidad.** Una responsabilidad sin dueño único no es
   una tarea pendiente: es un defecto del modelo.
5. **El modelo del dominio define al sistema; el sistema no define al modelo.**
   Los conceptos que sobreviven décadas son del dominio ("una intención de X"),
   no de la tecnología ("un archivo con formato Y").
6. **La evidencia tiene autoridad; el diseño solo tiene responsabilidad.**
7. **La reproducibilidad tiene una frontera.** Con fuentes externas mutables,
   no se promete determinismo hacia atrás de la captura — se declara dónde
   empieza y se garantiza desde ahí.
8. **La mejor documentación no es la más grande; es la que sigue siendo
   suficiente.**

## II. Patrones

- **Separar sistemas fusionados.** Cuando un diseño acumula responsabilidades
  híbridas, suele contener dos sistemas distintos (p. ej. "obtener y cachear"
  vs "transformar") pretendiendo ser uno. Declarar la frontera disuelve la
  mayoría de las ambigüedades pendientes.
- **Captura ≠ forma canónica.** La copia inmutable de la fuente (store
  append-only, content-addressed, privado) y la representación interna común
  a todas las etapas son dos capas distintas. Fusionarlas acopla cada etapa
  al formato de origen.
- **Forma canónica ciega hacia adelante.** La representación interna no debe
  conocer sus consumidores. Es lo que permite agregar salidas nuevas sin
  tocar el resto.
- **Unidad / valor / producto.** Toda pieza del sistema es exactamente una de
  tres cosas: unidad de trabajo (lo que se procesa independientemente), valor
  (lo que circula entre etapas) o producto (lo que se compone al final).
  Confundirlas genera responsabilidades sin dueño.
- **Unidad pequeña + fase de composición.** Las decisiones que ninguna unidad
  puede tomar sola (globales, relativas) no justifican agrandar la unidad:
  se resuelven en una fase de composición que consume lo que cada unidad
  exporta (el patrón translation-unit/link-time).
- **Identidad en tres niveles:** la captura concreta (hash de contenido), la
  entidad lógica a través de capturas (índice), y el valor derivado (hash
  sobre una forma normal versionada). Cada nivel con su mecanismo.
- **Forma normal versionada para identidad.** Si la representación física es
  libre, la identidad se computa sobre una serialización canónica declarada y
  versionada — la semántica queda libre, el hash queda estable.
- **Trade-offs multi-objetivo → perfiles nombrados.** Los objetivos en
  tensión (peso/calidad/tiempo) no se resuelven en código: se empaquetan como
  configuraciones nombradas.

## III. Protocolos de decisión

1. **Mapear antes de optimizar.** Nunca investigar el valor óptimo de una
   variable antes de conocer el espacio completo de variables y su
   clasificación (parámetro / estructural / restricción externa). Optimizar
   primero fija por accidente lo que debía quedar libre.
2. **Ordenar decisiones por dependencia lógica, no por implementación.**
   Nivel 0: el axioma del que todo depende. Nivel 1: los contratos de
   frontera. Nivel 2: la evolución. Nivel 3: la operación. Se fija un nivel
   antes de abrir el siguiente.
3. **Encontrar el átomo antes de congelar.** Preguntar "¿cuál es la unidad
   fundamental?" y validarla con un test: ¿da exactamente un dueño a cada
   responsabilidad conocida? Las candidatas que matan la incrementalidad o
   exigen que un valor conozca su destino se descartan.
4. **Auditoría adversarial antes de congelar cualquier contrato.** Sesión
   dedicada exclusivamente a destruir el diseño: supuestos falsos, decisiones
   escondidas, capturas faltantes/sobrantes, dependencias frágiles,
   violaciones de separación, la crítica que harían los diseñadores de
   sistemas maduros del género. Sin proponer mejoras. Un diseño vale por los
   intentos de destrucción que sobrevivió, no por las mejoras que recibió.
5. **Congelar con regla de descongelamiento.** Un contrato congelado solo se
   reabre por: contradicción demostrada por el código, nuevo requisito del
   dominio, o cambio explícito de objetivos. Nunca por una idea nueva.
6. **Detectar el punto de rendimiento decreciente.** Señal de madurez: las
   iteraciones dejan de agregar capacidades y solo reubican responsabilidades
   o mejoran nombres. Ahí se cierra la fase conceptual — no cuando "no quedan
   ideas".
7. **Transferir la autoridad a la implementación.** Al cerrar la teoría se
   declara: el código tiene derecho de refutación; la teoría pierde el
   derecho de posponer el código. Toda pregunta arquitectónica posterior se
   responde con "muéstrame primero dónde falla".
8. **Primer código = vertical slice.** Una entrada, una salida, atravesando
   todas las capas, sin ninguna capacidad lateral. Objetivo binario: ¿existe
   el recorrido completo? Con permiso explícito de ser simple, no definitivo.
9. **Presupuestar la investigación externa.** Antes de lanzarla: máximo de
   cambios que puede producir, y condición de término. La investigación sin
   tope no termina.

## IV. Errores recurrentes (observados, no hipotéticos)

- **El mismo error a distintas escalas.** El error dominante fue siempre
  "confundir niveles": origen confundido con representación interna;
  semántica confundida con formato físico; unidad confundida con valor y con
  producto. Corregirlo una vez no inmuniza: reaparece un nivel más abajo.
- **La decisión escondida en una frase inocente.** Expresiones como "guardar
  X tal cual" contienen decisiones enormes sin tomar. Toda frase que suene
  obvia en un contrato debe expandirse hasta que sus decisiones queden
  explícitas.
- **Nombrar mal fija el error.** Llamar "IR" a un cache, o "análisis" a un
  generador de artefactos, asigna responsabilidades incorrectas que luego
  parecen naturales. El error de modelo suele entrar por el nombre.
- **Capturar todo "por si acaso".** Guardar datos volátiles/efímeros dentro
  de registros inmutables contradice la inmutabilidad que se declara.
  No-interpretar ≠ no-excluir lo estructuralmente volátil.
- **Timestamps de proceso dentro de artefactos.** Todo `now()` escrito en una
  salida rompe reproducibilidad y, a menudo, algún invariante del dominio.
  Los tiempos del dominio se declaran; los del proceso no se publican.
- **Constantes de código que debían ser configuración.** El estado natural de
  un prototipo es que todo parámetro esté fosilizado como constante. Sin una
  capa de configuración declarada desde el inicio, la fosilización se repite
  en cada implementación apurada.

## V. Anti-patrones

- **Optimizar la primera variable visible** (el "¿qué códec/librería/valor
  uso?") antes de saber si esa variable es siquiera estructural.
- **Congelar implementación como contrato** (fijar formatos físicos, números
  concretos, mecanismos) — cada uno es un rediseño futuro garantizado.
- **El andamio que se vuelve edificio:** seguir produciendo documentos,
  frameworks y refinamientos cuando el conocimiento faltante ya solo puede
  obtenerse implementando.
- **El documento-todo:** un solo archivo que mezcla filosofía, contratos,
  decisiones, estado y teoría. Se vuelve imposible de congelar parcialmente.
- **Documentación en crecimiento monótono.** Antídoto: cada documento nuevo
  exige eliminar o fusionar otro.
- **Roadmaps de planes en vez de historial de hechos:** registrar capacidades
  demostradas (milestones con criterio de éxito binario) en lugar de listas
  de intenciones.
- **Adoptar prácticas de escala industrial en proyectos de una persona** sin
  filtro de aplicabilidad: cada principio importado debe declarar a qué
  escala paga.

## VI. Heurísticas

- Si una respuesta "suena a paper", puede comprimirse 30–40% sin perder nada.
- Si una responsabilidad parece pertenecer a dos capas, la frontera está mal
  trazada — no la responsabilidad.
- La pregunta que desbloquea responsabilidades sin dueño casi siempre es:
  "¿cuál es la unidad fundamental?"
- Lo que se publica, alguien lo asume (ley de Hyrum): todo contrato expuesto
  debe nacer con mecanismo de versionado/despacho, o su primera evolución
  será una migración total.
- Las elecciones de productos reales bajo presión de costos son evidencia
  ("ingeniería revelada") tan válida como los papers.
- El primer error de la terminal enseña más que cien páginas de teoría —
  planificar para llegar a ese error lo antes posible sin traicionar los
  contratos.
- Test de autosuficiencia para cualquier captura/caché: "¿puedo reconstruir
  todo con la fuente externa apagada?"
- Un proceso sano alterna: construir → intentar destruir → corregir →
  congelar → implementar → refutar. Saltarse "intentar destruir" es la
  omisión más cara.

## VII. El andamiaje documental mínimo (transferible a cualquier proyecto)

| Documento | Función | Ritmo de cambio |
|---|---|---|
| FOUNDATION | Constitución: propósito, principios, reglas de cambio | Casi nunca |
| CONTRACTS | Lo congelado; estado de decisiones abiertas | Solo por refutación demostrada |
| DECISIONS (ADRs) | Contexto → decisión → consecuencia | Append-only |
| IMPLEMENTATION | Estado operacional: fases, casillas binarias | Continuo |
| REFUTATIONS | Evidencia contra contratos; termina en "se mantiene" o "ADR nuevo" | Por evento |
| MILESTONES | Capacidades demostradas, no planes | Por hecho |
| GLOSSARY | Vocabulario fijado | Con los contratos |

Isomorfismo con el ciclo científico: paradigma → hipótesis → diseño
experimental → experimentos → evidencia → revisión. Gestionar esto no es
gestionar documentos: es gestionar conocimiento.

## VIII. El meta-hallazgo

El activo más reutilizable de una buena fase de diseño no es la arquitectura
resultante sino **el proceso para no enamorarse de las propias ideas**:
hipótesis explícitas, decisiones trazables, refutaciones registradas, cambios
solo por evidencia. Con ese proceso, una arquitectura equivocada evoluciona
bien; sin él, una brillante se degrada.

Corolario operativo: no proteger la arquitectura — proteger el criterio con
el que se cambia.
