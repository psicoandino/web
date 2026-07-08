/**
 * BIBLIOTECA.JS — Astransys
 * Bibliografía estructurada de cuerpos celestes y constelaciones IAU.
 *
 * Origen: investigación NotebookLM (Deep Research + Fast Research) sobre
 * un corpus de 21 obras académicas verificadas (arqueoastronomía, historia
 * de las religiones, historia de la ciencia) + curación y traducción manual.
 *
 * Consolidado: julio 2026.
 *
 * Correcciones aplicadas en esta consolidación:
 * - Cita de Graeme Tobyn corregida en TODAS las entradas: el título
 *   "The English Physitian and the Star Medicine" nunca existió; el título
 *   real, confirmado leyendo la fuente primaria, es "Did the Astrological
 *   Content of Culpeper's English Physitian Undermine its Usefulness?"
 *   (Culture and Cosmos, Vol. 26 No. 2, 2022, pp. 35–53).
 * - Marte: eliminada una línea de encabezado de plantilla que se filtró
 *   al resultado original (sin efecto en el contenido).
 * - Escorpio: ajustado el reclamo de "consenso independiente" — la
 *   afirmación original incluía "Hindu" sin ninguna fuente que lo respalde,
 *   y agrupaba Mesopotamia+Egipto como "sin contacto" cuando ambas
 *   culturas sí tuvieron contacto histórico documentado.
 * - Citas genéricas a "Celestial Symbols" (el informe de síntesis propio
 *   de Fase 1, no una obra académica externa) quedan etiquetadas como
 *   tales para no aparentar más autoridad de la que tienen.
 * - Se usan las versiones en inglés de Luna y Venus (más completas que
 *   las corridas en español iniciales), traducidas aquí al español.
 *
 * Pendiente, fuera de alcance de este archivo (tarea aparte, no bloquea
 * el uso de este archivo):
 * - identidad_real.transito_por_constelacion: cálculo real de cuánto
 *   tarda cada cuerpo en cruzar cada constelación IAU, usando los límites
 *   reales ya confirmados en el array IAU[] de index.html. No son datos
 *   bibliográficos — son cálculo puro, no le corresponden a este archivo.
 * - Capa de interpretación: en reposo, según lo decidido.
 * - Fichas combinadas cuerpo×constelación: en reposo, se pueblan bajo
 *   demanda según uso real, no especulativamente.
 */

// ============================================================
// CUERPOS CELESTES
// Claves ("Sun", "Moon", etc.) coinciden exactamente con PLANETS[].key
// en index.html, para lookup directo: BIBLIOTECA_CUERPOS[planeta.key]
// ============================================================

const BIBLIOTECA_CUERPOS = {

  Sun: {
    id: "Sun",
    nombre: "Sol",
    simbolo: "☉",
    identidad_real: {
      categoria: "personal", // desde PLANETS[].cat
      transito_por_constelacion: null // pendiente — ver nota de cabecera
    },
    dominio: {
      descripcion: "El Sol rige los ciclos estacionales y diarios fundamentales de la Tierra, como fuente primordial de calor, luz y vitalidad diurna. Ilumina la transición hacia la adultez temprana (22–40 años) y se mapea anatómicamente al corazón y la facultad de la vista.",
      consenso_independiente: {
        existe: true,
        detalle: "Grecorromana, Mesoamericana e Inca usaron, de forma independiente, las posiciones extremas del Sol en el horizonte (solsticios y equinoccios) para orientar arquitectura monumental y sincronizar calendarios rituales."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII–V a.C.", planteamiento: "Se impuso una «lógica solar» duodecimal sobre constelaciones hasta entonces irregulares para crear signos iguales de 30°; el movimiento del Sol de aprox. 1° por día definió el año esquemático.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Influencia primaria sobre el entorno terrestre; define los «signos tropicales» (Cáncer y Capricornio) donde invierte su progresión en latitud. Rige la cuarta edad del hombre (adultez temprana), caracterizada por ambición y responsabilidad, y significa al esposo en la carta de una mujer.", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Maya", periodo: "Clásico y Posclásico", planteamiento: "Edificios cívicos y ceremoniales se alineaban sistemáticamente con salidas y puestas de sol en fechas específicas; el «sol nocturno» representaba un aspecto liminal y nocturno del astro, vinculado al héroe gemelo Xbalanqué y a la fertilidad.", fuente: "Ivan Šprajc, Lunar Alignments in Mesoamerican Architecture, 2016", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Inca", periodo: "Período Tahuantinsuyu", planteamiento: "Se realizaban observaciones estatales del solsticio de junio, con participación de población de élite y no-élite, particularmente en la Isla del Sol.", fuente: "Clive Ruggles (ed.), Handbook of Archaeoastronomy and Ethnoastronomy, 2015", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Cuerpo cálido y seco que rige el corazón y los ojos; sus hierbas (como la levística o la eufrasia) se usan por simpatía para fortalecer la vista o tratar dolencias causadas por Saturno, planeta «frío».", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [],
    notas: ["Ninguna contradicción identificada; las fuentes muestran alta consistencia transcultural respecto al rol del Sol como marcador de tiempo, estaciones y orientación arquitectónica."],
    estado: "poblado"
  },

  Moon: {
    id: "Moon",
    nombre: "Luna",
    simbolo: "☽",
    identidad_real: {
      categoria: "personal",
      transito_por_constelacion: null
    },
    dominio: {
      descripcion: "La Luna rige el crecimiento biológico, la nutrición física del cuerpo (especialmente en la infancia) y la sincronización de los ciclos naturales del agua, incluyendo mareas, lluvias y fertilidad agrícola. También ilumina los aspectos sensoriales, irracionales y subconscientes del alma humana.",
      consenso_independiente: {
        existe: true,
        detalle: "Maya y Grecorromana asocian, de forma independiente, a la Luna con los ciclos de agua/humedad, la fertilidad biológica y la regulación del crecimiento agrícola."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "El «camino de la luna» define los sectores de 17 o 18 deidades estelares por los que transita mensualmente, estableciendo las bases del zodíaco.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Luminaria femenina de naturaleza humectante que rige la «primera edad del hombre» (infancia), caracterizada por el crecimiento y la mutabilidad; también rige el alma sensorial y las indicaciones matrimoniales para los hombres.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Maya", periodo: "Clásico a Posclásico", planteamiento: "Representada por la diosa Ixchel; rige el embarazo, el parto, la medicina y el tejido, con sus ciclos de parada extrema de 18.6 años determinando la alineación de santuarios de peregrinación costeros.", fuente: "Ivan Šprajc, Lunar Alignments in Mesoamerican Architecture, 2016", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Inca", periodo: "Período Tahuantinsuyu", planteamiento: "Se realizaron observaciones sistemáticas de la Luna, integradas en el complejo sistema calendárico del estado.", fuente: "Clive Ruggles (ed.), Handbook of Archaeoastronomy and Ethnoastronomy, 2015", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Cuerpo frío y húmedo que rige el cerebro y los humores flemáticos; sus hierbas (como la lechuga silvestre) se usan por simpatía para equilibrar el calor corporal.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Frigia", periodo: "c. 100 d.C.", planteamiento: "La deidad lunar Mên era venerada como figura sanadora, asociada a los ritos curativos de Apolo y Asclepio.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "En el contexto mesoamericano, la Luna aparece explícitamente documentada como regente de ciclos militares y guerra ritual — dominio ausente en las tradiciones grecorromana e inglesa, centradas en domesticidad, nutrición y temperamento.",
      "Existe debate académico dentro de los estudios mayas sobre si la diosa Ixchel es estrictamente lunar (Diosa I) o una deidad del agua y el tejido (Diosa O); la síntesis académica sugiere que representan fases o aspectos distintos del mismo cuerpo celeste."
    ],
    notas: [],
    estado: "poblado"
  },

  Mercury: {
    id: "Mercury",
    nombre: "Mercurio",
    simbolo: "☿",
    identidad_real: { categoria: "personal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Mercurio ilumina el desarrollo de la inteligencia, el razonamiento consciente, la articulación y el comercio; rige la «segunda edad del hombre» (niñez, 4–13 años) y es el regente anatómico del cerebro y la destreza física/mental.",
      consenso_independiente: {
        existe: false,
        detalle: "Las fuentes documentan una transmisión de los atributos de Mercurio desde bases mesopotámicas hacia las tradiciones grecorromana y médico-inglesa — línea de transmisión, no convergencia independiente."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Incluido como deidad planetaria en el compendio astronómico MUL.APIN.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "Período clásico", planteamiento: "Conocido como Stilbon («el resplandeciente»); asignado al dios Hermes (Mercurio) como el planeta más veloz, mensajero de los dioses y protector de viajeros.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Rige la segunda edad de la vida (niñez) y la facultad racional del alma; su condición determina el habla articulada y la capacidad de razonamiento consciente.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Planeta de naturaleza fría y seca que rige el cerebro y los pulmones; regente de los signos Géminis y Virgo.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Identificado como «enemigo esencial» de Júpiter y Venus, pero amigo de Saturno.", fuente: "Nicholas Culpeper, Semeiotica Uranica, 1651 (reportado en Tobyn, 2022)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [],
    notas: ["Ninguna contradicción identificada; las tradiciones documentadas mantienen asociaciones consistentes entre Mercurio y las cualidades de velocidad, inteligencia y gobierno del cerebro."],
    estado: "poblado"
  },

  Venus: {
    id: "Venus",
    nombre: "Venus",
    simbolo: "♀",
    identidad_real: { categoria: "personal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Venus ilumina las esferas de la fertilidad biológica, la regulación de la humedad y el desarrollo de la pasión y la sexualidad humanas. Se mapea anatómicamente a los riñones y los órganos reproductivos, y rige la «tercera edad del hombre», la juventud.",
      consenso_independiente: {
        existe: true,
        detalle: "Mesoamericana y Grecorromana asocian, de forma independiente, a Venus con la regulación de los ciclos de agua/lluvia y la fertilidad biológica."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Incluida como deidad planetaria en el compendio MUL.APIN, entre los dioses «errantes» cuyos movimientos se rastreaban para la adivinación.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "Período clásico", planteamiento: "Conocida como Phosphoros («la portadora de luz») como estrella matutina y vespertina; consagrada a Afrodita (Venus) como el más brillante y bello de los cuerpos errantes visibles.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Rige la tercera edad del hombre (juventud, 14–21 años), caracterizada por pasión ardiente, sexualidad y astucia. Planeta femenino, nocturno, de naturaleza templada y humectante, de color celeste amarillo, usado para juzgar presagios de eclipses.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Mesoamericana (Maya/Olmeca)", periodo: "Clásico y Posclásico", planteamiento: "Templos y palacios se alineaban sistemáticamente con sus extremos en el horizonte para señalar el inicio de la temporada de lluvias. Vinculada al «sol nocturno», la fertilidad del maíz y la «guerra ritual».", fuente: "Ivan Šprajc, Venus in Mesoamerica, 2018", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Planeta femenino y templado que rige los riñones y el signo de Libra. Sus hierbas, como la pimpinela o las ciruelas, se usan para fortalecer los riñones o la salud reproductiva por simpatía.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Clasificada como «enemiga esencial» del Sol, Marte y Mercurio, pero reconocida como amiga de Júpiter.", fuente: "Nicholas Culpeper, Semeiotica Uranica, 1651 (reportado en Tobyn, 2022)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Dominio funcional: en las tradiciones occidentales (grecorromana e inglesa), Venus se asocia con la domesticidad, el amor y «el lecho», en contraste explícito con la naturaleza violenta de Marte. La tradición mesoamericana, en cambio, vincula explícitamente a Venus con la «guerra ritual» y los ciclos militares.",
      "Iconografía: mientras la tradición occidental personifica al planeta como una bella deidad femenina, el Códice Dresde maya presenta un «Dios Buceador» con cabeza representada por el glifo de Venus, actuando como agente de eclipses."
    ],
    notas: [],
    estado: "poblado"
  },

  Mars: {
    id: "Mars",
    nombre: "Marte",
    simbolo: "♂",
    identidad_real: { categoria: "personal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Marte ilumina las esferas del conflicto, la severidad y el trabajo físico, actuando como fuerza «maléfica» y «destructiva» caracterizada por sequedad excesiva. Rige la «quinta edad del hombre» (adultez tardía, 41–55 años) y se usa en medicina por sus cualidades purgantes y abrientes.",
      consenso_independiente: {
        existe: false,
        detalle: "Transmisión desde bases mesopotámicas hacia grecorromana y médico-inglesa. Las alineaciones arquitectónicas mesoamericanas para Marte se documentan como «mucho menos ciertas» que las del Sol, la Luna y Venus."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Rastreado como una de las deidades planetarias «errantes» en el compendio MUL.APIN.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "Período clásico", planteamiento: "Conocido como Pyroeis («el rojizo») y asignado a Ares (Marte), divinidad de la guerra, porque su color evoca el tono de la sangre.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Planeta «destructivo» de naturaleza excesivamente seca que rige la quinta edad del hombre (adultez tardía, 41–55 años), caracterizada por la constatación del ocaso del vigor y el esfuerzo por completar las tareas de la vida.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Rige el viento del oeste y actúa como regente asistente (junto a Júpiter) de la triplicidad de Aries, Leo y Sagitario, que gobierna el noroeste de Europa.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Asociado a naciones como Britania, haciendo a sus habitantes «independientes, amantes de las armas», pero también «más fieros, testarudos y bestiales».", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Rige hierbas de cualidades purgantes y abrientes (como el rusco o el ajenjo amargo) para tratar dolencias como cálculos renales, por antipatía.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Clasificado como «enemigo esencial» de Júpiter, Venus, Saturno y la Luna, pero amigo del Sol.", fuente: "Nicholas Culpeper, Semeiotica Uranica, 1651", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Relaciones interplanetarias: Ptolomeo (s. II d.C.) afirma que Marte «asiste» a Júpiter en el gobierno de la triplicidad de Aries. La tradición del s. XVII (Culpeper) define a Marte y Júpiter como «enemigos esenciales», argumentando que Júpiter ama la paz y la justicia mientras Marte ama la violencia y la opresión.",
      "Dominio funcional de la guerra: en la tradición occidental, Marte es la divinidad y significador primario de la guerra. La tradición mesoamericana identifica a Venus — no a Marte — como la deidad vinculada específicamente a la «guerra ritual» y los ciclos militares."
    ],
    notas: [],
    estado: "poblado"
  },

  Jupiter: {
    id: "Jupiter",
    nombre: "Júpiter",
    simbolo: "♃",
    identidad_real: { categoria: "social", transito_por_constelacion: null },
    dominio: {
      descripcion: "Júpiter ilumina las esferas de la autoridad soberana, el crecimiento biológico, la justicia social y la prosperidad; fuerza «benéfica» y templada, rige la «sexta edad del hombre» (plena madurez, 56–67 años). Anatómicamente es regente del hígado y los pulmones.",
      consenso_independiente: {
        existe: false,
        detalle: "Transmisión cultural e iconográfica directa desde las deidades planetarias mesopotámicas hacia grecorromana y médico-inglesa."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Registrado como uno de los dioses planetarios «errantes» en el compendio astronómico MUL.APIN.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "Período clásico", planteamiento: "Conocido como Phaethon («el radiante») y asignado a Zeus (Júpiter) como soberano del Olimpo, por su brillo majestuoso y tránsito equilibrado.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Planeta «benéfico» de naturaleza templada (cálida y humectante) que promueve el crecimiento y la fertilidad biológica. Rige la sexta edad del hombre (56–67 años): retiro, independencia, dignidad y deliberación.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Regente principal de la triplicidad de Aries, Leo y Sagitario, que gobierna el noroeste del «mundo habitado» (Europa), influyendo en naciones como España hacia la independencia y el amor a la limpieza.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Regente del hígado y los pulmones y de los signos Sagitario y Piscis; sus hierbas asociadas se usaban para tratar dolencias de estos órganos por simpatía.", fuente: "Nicholas Culpeper, The English Physitian Enlarged, 1653 (reportado en Tobyn, 2022)", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Identificado como «amigo» de Venus pero «enemigo esencial» de Mercurio, Marte y Saturno. Su enemistad con Marte se atribuye a su amor por la paz y la justicia, en contraste con el amor marciano por la violencia y la opresión.", fuente: "Nicholas Culpeper, Semeiotica Uranica, 1651 (reportado en Tobyn, 2022)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Relaciones interplanetarias: Ptolomeo afirma que Marte «asiste» a Júpiter en la triplicidad de Aries; Culpeper (s. XVII) los identifica como «enemigos esenciales», por condiciones morales opuestas — paz versus violencia. (Misma tensión documentada en la ficha de Marte.)",
      "Temperaturas estelares: la clasificación ptolemaica de estrellas fijas asigna a las estrellas en las «pinzas» del Escorpión (actual Libra) una temperatura similar a la de Júpiter y Mercurio, mientras que el análisis moderno de Antares en el «cuerpo» la identifica como similar a Marte."
    ],
    notas: ["Vacío en las fuentes respecto a Júpiter en tradiciones mesoamericanas o pre-neolíticas; las alineaciones no occidentales para Júpiter se señalan como «mucho menos ciertas»."],
    estado: "poblado"
  },

  Saturn: {
    id: "Saturn",
    nombre: "Saturno",
    simbolo: "♄",
    identidad_real: { categoria: "social", transito_por_constelacion: null },
    dominio: {
      descripcion: "Saturno ilumina la etapa final de la vida humana (vejez) y las cualidades físicas de frío y sequedad extremos, actuando como fuerza «maléfica» o reductiva. Simboliza al titán del tiempo y la agricultura; se usa en medicina por sus operaciones astringentes y de contención.",
      consenso_independiente: {
        existe: false,
        detalle: "Transmisión cultural e iconográfica directa desde bases mesopotámicas hacia grecorromana y médico-inglesa. La relación de Saturno con alineaciones arquitectónicas mesoamericanas se documenta como «mucho menos cierta» que la del Sol, la Luna y Venus."
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Identificado como uno de los «dioses errantes» cuyos movimientos se rastreaban para la adivinación en el compendio MUL.APIN.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "Período clásico", planteamiento: "Conocido como Phainon («el imponente») y asignado a Crono (Saturno), titán del tiempo y la agricultura, por ser el planeta visible más lento e imponente.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Planeta «maléfico» de naturaleza excesivamente enfriante y secante que rige la séptima edad del hombre (vejez, desde los 68 hasta la muerte): debilidad, declive y desánimo.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Regente planetario (domicilio) de Capricornio y Acuario y significador anatómico del bazo.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Las estrellas fijas de la región de las Híades reciben una temperatura «similar a la de Saturno y moderadamente similar a la de Mercurio».", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Rige hierbas de operación fría y seca (como la bistorta) usadas para detener sangrados o flujos, y se usa por antipatía para tratar infecciones de garganta.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Clasificado como «enemigo esencial» del Sol, la Luna, Júpiter y Marte, pero reconocido como amigo de Mercurio.", fuente: "Nicholas Culpeper, Semeiotica Uranica, 1651 (reportado en Tobyn, 2022)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [],
    notas: [],
    estado: "poblado"
  },

  Uranus: {
    id: "Uranus",
    nombre: "Urano",
    simbolo: "♅",
    identidad_real: { categoria: "transpersonal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Urano ilumina la transición desde la asimilación mitológica orgánica hacia la negociación institucional y nacionalista en la nomenclatura celeste; su descubrimiento marca el inicio de la era telescópica que expandió el sistema solar conocido más allá del límite clásico de Saturno.",
      consenso_independiente: {
        existe: false,
        detalle: "Las fuentes documentan a Urano exclusivamente dentro de las tradiciones científicas e institucionales occidentales modernas, posteriores a su descubrimiento en 1781 — no hay tradición antigua con la que comparar."
      }
    },
    voces_historicas: [
      { tradicion: "Europea Moderna", periodo: "1781", planteamiento: "Descubierto accidentalmente por William Herschel, quien intentó llamarlo Georgium Sidus («la estrella de Jorge») para asegurar el patrocinio del rey Jorge III de Inglaterra.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Europea Moderna", periodo: "s. XVIII–XIX", planteamiento: "Astrónomos continentales (franceses, alemanes y estadounidenses) rechazaron el nombre británico, refiriéndose al cuerpo como Herschel o proponiendo alternativas clásicas como Minerva u Oceanus.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Europea Moderna", periodo: "mediados s. XIX", planteamiento: "El nombre Urano (Ouranos) prevaleció según la propuesta de Johann Elert Bode, respetando la teogonía clásica de sucesión: Júpiter (Zeus) era hijo de Saturno (Crono), y Saturno era hijo de Urano.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Astrología Occidental", periodo: "2008–2009", planteamiento: "Urano se integra en la narrativa histórica del desarrollo astrológico como cuerpo planetario moderno.", fuente: "Nicholas Campion, A History of Western Astrology (citado en informe Fase 1)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Nomenclatura: conflicto significativo entre astrónomos británicos y la comunidad científica internacional, enfrentando etiquetas personalistas/nacionalistas (Georgium Sidus, Herschel) contra propuestas mitológicas clásicas (Urano, Minerva, Oceanus)."
    ],
    notas: ["Vacío total en las fuentes respecto a Urano en tradiciones mesopotámica, grecorromana o mesoamericana antiguas: su descubrimiento requirió instrumentación telescópica no disponible en esos períodos."],
    estado: "poblado"
  },

  Neptune: {
    id: "Neptune",
    nombre: "Neptuno",
    simbolo: "♆",
    identidad_real: { categoria: "transpersonal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Neptuno ilumina la intersección entre predicción matemática y negociación geopolítica internacional en la cartografía celeste; su nomenclatura sirvió para estabilizar tensiones diplomáticas entre potencias imperiales mediante mitología oceánica romana clásica.",
      consenso_independiente: {
        existe: false,
        detalle: "Las fuentes documentan a Neptuno exclusivamente dentro de las tradiciones científicas e institucionales occidentales modernas, posteriores a su descubrimiento en 1846."
      }
    },
    voces_historicas: [
      { tradicion: "Europea Moderna", periodo: "1846", planteamiento: "Localizado por Johann Gottfried Galle con base en las predicciones matemáticas de Urbain Le Verrier y John Couch Adams sobre perturbaciones gravitacionales en la órbita de Urano.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Europea Moderna", periodo: "1846", planteamiento: "El nombre Neptuno (dios romano de los océanos) se adoptó internacionalmente para neutralizar propuestas rivales como Janus (Galle, Alemania) y Oceanus (defendido en Inglaterra).", fuente: "síntesis del corpus (informe Fase 1); Nick Kollerstrom, The Naming of Neptune, 2009", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Astrología Occidental", periodo: "2008–2009", planteamiento: "Neptuno se integra en el panorama histórico del desarrollo astrológico como cuerpo trans-saturnino moderno.", fuente: "Nicholas Campion, A History of Western Astrology (citado en informe Fase 1)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Nomenclatura: conflicto documentado entre intereses científicos alemanes, británicos y franceses, con propuestas rivales (Janus, Oceanus) antes de la consolidación internacional de «Neptuno»."
    ],
    notas: ["Vacío total en las fuentes respecto a Neptuno en tradiciones antiguas: su descubrimiento requirió capacidades matemáticas y telescópicas no disponibles en esos períodos."],
    estado: "poblado"
  },

  Pluto: {
    id: "Pluto",
    nombre: "Plutón",
    simbolo: "♇",
    identidad_real: { categoria: "transpersonal", transito_por_constelacion: null },
    dominio: {
      descripcion: "Plutón ilumina la intersección entre continuidad mitológica clásica y memorialización institucional en la era moderna del descubrimiento celeste; representa el reino de lo invisible, el inframundo y los «confines oscuros» fuera del alcance de la luz solar.",
      consenso_independiente: {
        existe: false,
        detalle: "Las fuentes documentan a Plutón exclusivamente dentro de las tradiciones científicas e institucionales internacionales del siglo XX, posteriores a su descubrimiento en 1930."
      }
    },
    voces_historicas: [
      { tradicion: "Científica Internacional Moderna", periodo: "1930", planteamiento: "Descubierto por Clyde Tombaugh en el Observatorio Lowell; su nomenclatura involucró un escrutinio internacional que priorizó la mitología romana clásica sobre propuestas personalistas.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Científica Internacional Moderna", periodo: "1930", planteamiento: "El nombre Plutón (dios romano del inframundo) fue sugerido por Venetia Burney, una estudiante de once años de Oxford, para representar un cuerpo relegado a los confines oscuros del sistema solar.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Científica Internacional Moderna", periodo: "1930", planteamiento: "El nombre fue ratificado por unanimidad porque sus dos primeras letras (P.L.) homenajean las iniciales de Percival Lowell, pionero de la búsqueda del «Planeta X».", fuente: "Vesto M. Slipher & Herbert Hall Turner, Correspondence and Telegrams on Naming Pluto, 1930 (citado en informe Fase 1)", tipo_fuente: "fuente primaria" },
      { tradicion: "Astrología Occidental", periodo: "2008–2009", planteamiento: "Integrado en la narrativa histórica del desarrollo astrológico como el último cuerpo trans-saturnino moderno del siglo XX.", fuente: "Nicholas Campion, A History of Western Astrology (citado en informe Fase 1)", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [],
    notas: [
      "Ninguna contradicción identificada; las fuentes describen un esfuerzo internacional unánime y coordinado para establecer el nombre y la identidad simbólica del planeta en 1930.",
      "Vacío total en las fuentes respecto a Plutón en tradiciones antiguas: su descubrimiento en 1930 ocurrió mucho después de que dichas culturas cesaran sus principales desarrollos astronómicos."
    ],
    estado: "poblado"
  }

};

// ============================================================
// CONSTELACIONES IAU
// Claves ("Aries", "Taurus", etc.) coinciden exactamente con IAU[].name
// en index.html, para lookup directo: BIBLIOTECA_CONSTELACIONES[c.name]
// ============================================================

const BIBLIOTECA_CONSTELACIONES = {

  Aries: {
    id: "Aries", nombre: "Aries", simbolo: "♈️",
    origen: {
      nombres_antiguos: "Lú.Hun.Gá (sumerio/mesopotámico)",
      figura: "Representado originalmente como el «Labrador Contratado» o «Hombre Contratado». En la tradición grecorromana posterior, se representa como el Carnero."
    },
    dominio: {
      descripcion: "Aries se identifica como marcador de la «primera edad del hombre» o infancia en algunos esquemas, aunque específicamente rige la cabeza y el rostro en el mapeo anatómico del «hombre zodiacal». Se asocia con características testarudas, fieras y «bestiales» en las asignaciones geográficas mundanas.",
      consenso_independiente: { existe: false, detalle: "Línea clara de transmisión desde el «Hombre Contratado» mesopotámico hacia las tradiciones grecorromana y médico-europea occidental." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como el «Labrador Contratado» (Lú.Hun.Gá); en registros como el MUL.APIN era la última deidad/constelación en el camino de la luna, que entonces comenzaba la secuencia con Tauro.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Definido como «signo tropical» cuyo inicio se fija en el equinoccio vernal calculado matemáticamente; masculino, diurno, «casa» de Marte. Se le asigna el gobierno de Britania, haciendo a sus habitantes testarudos y fieros.", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "El gobierno sobre la cabeza y el rostro se usa para determinar remedios; el cardo bendito (hierba de Marte) trata vértigo y dolores de cabeza porque «Aries está en la casa de Marte» y rige la cabeza.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Posición en la secuencia: los registros mesopotámicos tempranos ubican a Aries al final de la secuencia de constelaciones (que comenzaba con Tauro/Pléyades); la tradición grecorromana lo estableció como el inicio definitivo del zodíaco.",
      "Iconografía: cambio total en la representación, del «Trabajador Contratado» mesopotámico al «Carnero» grecorromano."
    ],
    notas: [], estado: "poblado"
  },

  Taurus: {
    id: "Taurus", nombre: "Tauro", simbolo: "♉️",
    origen: {
      nombres_antiguos: "Gu.an.na (mesopotámico/sumerio); el asterismo de la cabeza se conocía como «La Mandíbula del Toro» (Is.li.e)",
      figura: "Representa al «Toro del Cielo», entidad mitológica de la Epopeya de Gilgamesh. En la tradición grecorromana se mantiene como el Toro."
    },
    dominio: {
      descripcion: "Tauro simboliza la estabilidad biológica y el punto álgido de la primavera; en el mapeo anatómico rige el cuello y la garganta. Signo femenino, nocturno y fijo, «casa» del planeta Venus.",
      consenso_independiente: { existe: false, detalle: "Línea clara de transmisión cultural y evolución iconográfica desde bases mesopotámicas hacia grecorromana y europea occidental." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Documentado en el MUL.APIN como «La Mandíbula del Toro» (Is.li.e); primera constelación en el camino de la luna, iniciando la secuencia de dieciocho deidades estelares que definían los sectores de la eclíptica.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «fijo» donde se establece el avance en latitud del Sol; templado y humectante, domicilio de Venus. Ptolomeo especifica que sus efectos varían por sección, particularmente cerca de las Pléyades e Híades.", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Asignado al cuello y la garganta; la hierba levística (regida por el Sol en Tauro) se usaba para tratar dolencias de garganta causadas por Saturno.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Secuencia zodiacal: el MUL.APIN ubica a Tauro al inicio de la secuencia; la tradición grecorromana y los sistemas occidentales posteriores establecieron a Aries como inicio.",
      "Iconografía: ambas tradiciones usan al toro, pero el «Toro del Cielo» mesopotámico era visualmente distinto de la representación grecorromana posterior, aunque ambas compartían a las Híades como cabeza de la figura."
    ],
    notas: [], estado: "poblado"
  },

  Gemini: {
    id: "Gemini", nombre: "Géminis", simbolo: "♊️",
    origen: {
      nombres_antiguos: "Mesopotámico (sumerio/babilónico)",
      figura: "Representa a los «Grandes Gemelos» del inframundo: las deidades Lugalirra y Meslamtaea. En la tradición grecorromana posterior se unificaron en los Gemelos celestes."
    },
    dominio: {
      descripcion: "Géminis se caracteriza como signo «bicorpóreo» que comparte las propiedades cambiantes del fin de una estación y el inicio de la siguiente; rige los brazos y los hombros. «Casa» del planeta Mercurio.",
      consenso_independiente: { existe: false, detalle: "Línea directa de transmisión cultural y racionalización desde asterismos mesopotámicos hacia el zodíaco grecorromano y la astrología médica occidental posterior." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Registrado en el MUL.APIN como los «Grandes Gemelos» (MAŠ.TAB.BA.GAL.GAL), personificando a los dioses del inframundo Lugalirra y Meslamtaea.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «bicorpóreo» que comparte propiedades de dos estados climáticos. Domicilio de Mercurio y parte de la triplicidad que gobierna el noreste del mundo habitado (Escitia).", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Asignado a los brazos y hombros; su asociación con Mercurio se usaba para determinar tratamientos simpáticos o antipáticos.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Naturaleza mitológica: la tradición mesopotámica temprana asocia la constelación con deidades específicas del inframundo; las tradiciones grecorromana y occidental posteriores se centran en su naturaleza «bicorpórea» y su vínculo con Mercurio."
    ],
    notas: [], estado: "poblado"
  },

  Cancer: {
    id: "Cancer", nombre: "Cáncer", simbolo: "♋️",
    origen: {
      nombres_antiguos: "Alluttu (sumerio/mesopotámico)",
      figura: "Representa «El Cangrejo»."
    },
    dominio: {
      descripcion: "Cáncer simboliza el punto de giro estacional del solsticio de verano y el punto álgido de la temporada estival; anatómicamente se mapea al pecho, el estómago y las costillas.",
      consenso_independiente: { existe: false, detalle: "Línea directa de transmisión cultural e iconográfica desde el «Cangrejo» mesopotámico hacia grecorromana y médica occidental posterior." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como «El Cangrejo» (Alluttu); una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «tropical» porque el Sol «gira» al inicio de este signo, invirtiendo su avance en latitud y causando el solsticio de verano; femenino, nocturno, domicilio planetario de la Luna.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad (junto a Escorpio y Piscis) que gobierna el suroeste del mundo habitado, específicamente el noroeste de África (antigua Libia).", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado al pecho, el estómago y las costillas; esta correspondencia y la regencia lunar se usaban para determinar remedios herbarios apropiados.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [], notas: [], estado: "poblado"
  },

  Leo: {
    id: "Leo", nombre: "Leo", simbolo: "♌️",
    origen: {
      nombres_antiguos: "Urgula (mesopotámico/sumerio)",
      figura: "Representa «El León»."
    },
    dominio: {
      descripcion: "Leo simboliza la soberanía solar y la estabilidad estacional; signo fijo, domicilio planetario del Sol, rige anatómicamente el corazón, la espalda y la vista.",
      consenso_independiente: { existe: false, detalle: "Línea directa de transmisión cultural e iconográfica desde bases mesopotámicas hacia grecorromana y médica occidental posterior." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como «El León» (Urgula); una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Mesopotámica", periodo: "s. VI a.C.", planteamiento: "Durante la racionalización matemática del zodíaco en doce signos iguales, la constelación original de Leo, más grande, fue «decapitada» por su límite de signo para ajustarse al requisito de 30 grados.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «fijo» donde se establece la cualidad estacional del Sol; masculino, diurno, «casa» del Sol.", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad de Aries (junto a Aries y Sagitario), dominada por Júpiter y Marte, que gobierna el noroeste del mundo habitado (Europa).", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado al corazón y la espalda; la regencia solar sobre Leo se usaba para tratamientos, como la hierba eufrasia (regida por el Sol en Leo) para fallas de visión.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [], notas: [], estado: "poblado"
  },

  Virgo: {
    id: "Virgo", nombre: "Virgo", simbolo: "♍️",
    origen: {
      nombres_antiguos: "Absin (sumerio/mesopotámico); Parthenos (griego)",
      figura: "Representada originalmente como «El Surco de Siembra», personificando a la diosa Shala de la fertilidad. En tradiciones grecorromana y egipcia posteriores se transformó en una Virgen o deidad tipo Isis portando una gavilla de trigo (identificada con la estrella Spica)."
    },
    dominio: {
      descripcion: "Virgo simboliza la fertilidad agrícola y la cosecha; en el mapeo anatómico rige los intestinos y el vientre. Signo femenino, nocturno y bicorpóreo; domicilio y exaltación de Mercurio.",
      consenso_independiente: { existe: false, detalle: "Línea directa de transmisión cultural e iconográfica desde el «Surco» mesopotámico hacia la «Virgen» grecorromana y las tradiciones médicas occidentales posteriores." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocida como «El Surco» (Absin); una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Egipcia", periodo: "c. 30 a.C.", planteamiento: "Representada en el zodíaco de Dénderah como una figura erguida tipo Isis portando una gavilla de trigo.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «bicorpóreo» que comparte propiedades de dos estados climáticos; domicilio de Mercurio, parte de la triplicidad que gobierna el sureste del mundo habitado (Asia mayor).", fuente: "Claudio Ptolomeo, Tetrabiblos (ed. Hübner)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeada a los intestinos y el vientre; su asociación con Mercurio se usaba para tratamientos de dolencias en la zona media del cuerpo.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Postura iconográfica: las representaciones tempranas (fragmentos babilónicos, zodíaco de Dénderah) muestran a Virgo erguida; Ptolomeo describe una constelación muy extensa (46°) con la Virgen «tendida de espaldas».",
      "Posición de Spica: en el zodíaco estelar sideral, Spica era estrella límite (29°–30° de Virgo); en la descripción constelacional de Ptolomeo, se ubica en el medio de la figura.",
      "Identidad mitológica: cambio total desde el «Surco» agrícola mesopotámico hacia la personificación grecorromana como «Virgen»."
    ],
    notas: [], estado: "poblado"
  },

  Libra: {
    id: "Libra", nombre: "Libra", simbolo: "♎️",
    origen: {
      nombres_antiguos: "Zibanitu (sumerio/mesopotámico); Chelae (griego), «Las Pinzas»",
      figura: "Representada originalmente como «Las Pinzas» del Escorpión. Se separó formalmente después para representar el instrumento de pesaje y las «Balanzas de la Justicia»."
    },
    dominio: {
      descripcion: "Libra simboliza el equilibrio y la justicia a través de la imagen de la balanza; anatómicamente se mapea a los riñones, los lomos y la parte baja de la espalda. Signo equinoccial, femenino, nocturno, domicilio de Venus.",
      consenso_independiente: { existe: false, detalle: "Línea directa de evolución iconográfica desde las «Pinzas» mesopotámicas hacia las «Balanzas» grecorromanas." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocida como «La Balanza» (Zibanitu) o «Pinzas» (Chelae); una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «equinoccial» que marca el Equinoccio de Otoño, donde el Sol «gira» en latitud celeste; femenino, nocturno, «casa» de Venus. Gobierna el sureste del mundo habitado (Asia mayor).", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeada a los riñones y los lomos; remedios como la pimpinela (regida por Venus en Libra) se elegían para tratar esta zona por simpatía.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Transición iconográfica: cambio histórico documentado desde la identificación mesopotámica y griega temprana de la constelación como «Pinzas» del Escorpión hacia su independencia posterior como «Balanza».",
      "Conflicto de límite: en definiciones siderales del zodíaco estelar, la estrella Spica se consideraba el marcador límite (30° Virgo/0° Libra); en otros esquemas se ubica dentro de la figura de la Virgen."
    ],
    notas: [], estado: "poblado"
  },

  Scorpius: {
    id: "Scorpius", nombre: "Escorpio", simbolo: "♏️",
    origen: {
      nombres_antiguos: "Girtab (mesopotámico/sumerio); Chelae (griego, referido originalmente a las «Pinzas» que después se independizaron como Libra)",
      figura: "Representa «El Escorpión». En la tradición mesopotámica personificaba a la diosa Ishhara; en el Antiguo Egipto, su estrella más brillante (Antares) representaba a la diosa-escorpión Serket y se asociaba con Isis."
    },
    dominio: {
      descripcion: "Escorpio simboliza estabilidad estacional establecida (signo «fijo») y se mapea anatómicamente a los «miembros secretos» u órganos reproductivos en la astrología médica.",
      consenso_independiente: {
        existe: true,
        detalle: "Mesopotámica y Azteca — sin contacto histórico conocido entre sí — identificaron independientemente esta región estelar con la figura de un escorpión. (La tradición egipcia comparte el motivo del escorpión, pero mantuvo contacto documentado con Mesopotamia, por lo que no se cuenta como una tercera convergencia independiente. Nota de corrección: la afirmación original de este hallazgo incluía «Hindú» sin fuente que lo respalde en este corpus — se retiró.)"
      }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como «El Escorpión» (Girtab); una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Egipcia Antigua", periodo: "sin fecha", planteamiento: "La estrella Antares representaba a la diosa Serket y servía como significador celeste en ceremonias piramidales asociadas a Isis.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Definido como signo «fijo», parte de la triplicidad (junto a Cáncer y Piscis) que gobierna el suroeste del mundo habitado, específicamente el noroeste de África (antigua Libia).", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Ptolomeo asigna a las estrellas del «cuerpo de Escorpio» una temperatura «similar a la de Marte», mientras que las de las pinzas son similares a Júpiter y Mercurio.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997 (citando Tetrabiblos I.9)", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Azteca", periodo: "sin fecha", planteamiento: "Documentado como asterismo predilecto atribuido a deidades específicas y representado como un escorpión.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado a los «miembros secretos» (órganos reproductivos) en el esquema del «hombre zodiacal» usado para determinar remedios herbarios.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Límite de la constelación: las tradiciones mesopotámica y griega tempranas veían al Escorpión como una entidad mucho más grande que incluía las «Pinzas» (actual Libra); la tradición matemática grecorromana posterior las separó formalmente en dos signos distintos."
    ],
    notas: [], estado: "poblado"
  },

  Ophiuchus: {
    id: "Ophiuchus", nombre: "Ofiuco", simbolo: "⛎",
    origen: {
      nombres_antiguos: "Ophioukhos (griego), «el portador de la serpiente»; Serpentarius en latín. Las fuentes cargadas no documentan un nombre mesopotámico o sumerio equivalente al de las doce constelaciones zodiacales estándar.",
      figura: "Representa al sanador griego Asclepio (Esculapio en tradición romana). Según el mito, hijo de Apolo y la mortal Corónide, educado en medicina por el centauro Quirón. Tras dominar la capacidad de resucitar muertos, Júpiter lo mató con un rayo a petición de Plutón, que temía la despoblación del inframundo. Júpiter lo colocó en el cielo sosteniendo los dos segmentos de la constelación Serpiente (Serpens Caput y Serpens Cauda)."
    },
    dominio: {
      descripcion: "Ofiuco simboliza la abstracción de la pericia médica y quirúrgica humana a un nivel divino y metafísico, personificando la regeneración, el dominio de raíces curativas y la luz sanadora.",
      consenso_independiente: {
        existe: false,
        detalle: "Aunque las tradiciones griega y egipcia asocian la región con deidades sanadoras (Asclepio e Imhotep, respectivamente), ambas culturas mantuvieron contacto activo durante los períodos documentados — no cuenta como convergencia independiente."
      }
    },
    voces_historicas: [
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Clasificada como una de las 48 constelaciones; identificada como el «portador de la serpiente» que representa a Asclepio.", fuente: "Claudio Ptolomeo, Almagesto / Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. I d.C.", planteamiento: "Definida como influyente constelación «extra-zodiacal» (paranatellonta) cuyo orto y ocaso afectan el carácter humano.", fuente: "Manilio, Astronomica", tipo_fuente: "fuente primaria" },
      { tradicion: "Egipcia Antigua", periodo: "sin fecha", planteamiento: "Asociada con la deidad sanadora Imhotep, utilizada como significador celeste en ceremonias.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Frigia", periodo: "c. 100 d.C.", planteamiento: "Vinculada a la naturaleza sanadora del santuario de Apolo Lairbeno, posiblemente asociada a la deidad lunar local Mên.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Arqueoastronomía Griega", periodo: "s. VII a.C. – s. II d.C.", planteamiento: "Santuarios dedicados a los cultos sanadores de Apolo y Asclepio (como Epidauro y Mesene) se alineaban intencionalmente con el orto o el ocaso helíaco de Ofiuco para asegurar el éxito ritual.", fuente: "Ioannis Liritzis et al., Asclepius and Apollo Cult Archaeoastronomy, 2017", tipo_fuente: "síntesis secundaria" },
      { tradicion: "IAU", periodo: "1930", planteamiento: "Definida formalmente con límites científicos que la establecen como la decimotercera constelación por la que el Sol cruza la eclíptica anualmente.", fuente: "Eugène Joseph Delporte, Délimitation Scientifique des Constellations", tipo_fuente: "fuente primaria (reportada en síntesis secundaria)" }
    ],
    contradicciones: [
      "Estatus zodiacal: autoridades clásicas (Ptolomeo, Manilio, Hübner) categorizan a Ofiuco como constelación «extra-zodiacal» o paranatellonta, fuera de la cuadrícula matemática de doce signos. Esto contradice la delimitación científica IAU de 1930, que la integra formalmente como decimotercera constelación de la eclíptica.",
      "Iconografía: mientras las fuentes griegas estándar representan a Ofiuco como un hombre sosteniendo una serpiente, algunos contextos arqueoastronómicos de Asia Menor asocian la naturaleza sanadora del sitio con atributos lunares o solares antes que con la figura específica del portador de serpiente."
    ],
    notas: [], estado: "poblado"
  },

  Sagittarius: {
    id: "Sagittarius", nombre: "Sagitario", simbolo: "♐️",
    origen: {
      nombres_antiguos: "Pabilsag (sumerio/mesopotámico)",
      figura: "Representado originalmente como la deidad Pabilsag, figura tipo centauro con alas y cola de escorpión. En el contexto pre-neolítico de Göbekli Tepe (Pilar 43), la región estelar se asocia con iconografía de buitre."
    },
    dominio: {
      descripcion: "Sagitario simboliza transición estacional como signo «bicorpóreo» y se asocia con independencia, limpieza y la etapa de «plena madurez» de la vida humana; anatómicamente se mapea a los muslos.",
      consenso_independiente: { existe: false, detalle: "Línea clara de transmisión cultural y evolución iconográfica desde bases mesopotámicas hacia grecorromana y tradiciones occidentales posteriores." }
    },
    voces_historicas: [
      { tradicion: "Pre-Neolítica", periodo: "c. 9000 a.C.", planteamiento: "La iconografía de buitre en el Pilar 43 de Göbekli Tepe se vincula, según investigación contemporánea, a los catasterismos más antiguos documentados de la región de Sagitario.", fuente: "síntesis del corpus (informe Fase 1) — sin obra específica identificada aún", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como Pabilsag; una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «bicorpóreo» porque comparte las propiedades naturales de los dos estados climáticos al fin y al inicio de estaciones. Masculino, diurno, «casa» (domicilio) de Júpiter.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad que gobierna el noroeste del mundo habitado (Europa); asignada específicamente a España, influyendo a sus habitantes hacia la independencia y el amor a la limpieza.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado a los muslos; usado para determinar remedios herbarios mediante regencia planetaria.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Iconografía: cambio distintivo en la representación, del «Buitre» pre-neolítico al «centauro alado con cola de escorpión» mesopotámico, que finalmente se regularizó en el «Arquero» grecorromano."
    ],
    notas: [], estado: "poblado"
  },

  Capricornus: {
    id: "Capricornus", nombre: "Capricornio", simbolo: "♑️",
    origen: {
      nombres_antiguos: "Suhurmas (sumerio/mesopotámico)",
      figura: "Representa la «Cabra-Pez». Mitológicamente asociada de forma directa con la deidad primordial de las aguas dulces, Ea."
    },
    dominio: {
      descripcion: "Capricornio simboliza el punto de giro estacional del solsticio de invierno, donde el Sol invierte su avance en latitud; anatómicamente se mapea a las rodillas.",
      consenso_independiente: { existe: false, detalle: "Línea directa de transmisión cultural y continuidad iconográfica desde la «Cabra-Pez» mesopotámica hacia grecorromana y tradiciones occidentales posteriores." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como la «Cabra-Pez» (Suhurmas); registrado en el MUL.APIN como una de las deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «tropical» porque el Sol «gira» al inicio de este signo e invierte su avance en latitud, causando el invierno; femenino, nocturno, domicilio planetario de Saturno.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad de Tauro (junto a Tauro y Virgo), que gobierna el sureste del mundo habitado, específicamente Asia mayor.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado específicamente a las rodillas; esta correspondencia se usaba para determinar remedios herbarios para dolencias de las articulaciones.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [],
    notas: ["Ninguna contradicción identificada; la iconografía de la «Cabra-Pez» y su rol como marcador del solsticio de invierno se mantienen consistentes en las fuentes documentadas.", "Vacío en las fuentes respecto a Capricornio en tradiciones mesoamericana o pre-neolítica, sí documentadas para otras constelaciones eclípticas."],
    estado: "poblado"
  },

  Aquarius: {
    id: "Aquarius", nombre: "Acuario", simbolo: "♒️",
    origen: {
      nombres_antiguos: "Gu.La (sumerio/mesopotámico)",
      figura: "Representado originalmente como «El Gigante» (Gu.La) en la tradición mesopotámica. En la tradición grecorromana posterior se transformó en el Portador de Agua."
    },
    dominio: {
      descripcion: "Acuario simboliza estabilidad estacional establecida (signo «fijo») y se asocia con la naturaleza planetaria de su domicilio regente, Saturno; anatómicamente se mapea a las piernas y específicamente rige los vasos sanguíneos.",
      consenso_independiente: { existe: false, detalle: "Línea clara de transmisión cultural e iconográfica desde bases mesopotámicas hacia grecorromana y médica occidental posterior." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Conocido como «El Gigante» (Gu.La); una de las «deidades situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Hunger & Pingree, MUL.APIN: An Astronomical Compendium in Cuneiform, 1989", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «fijo» donde se establece la cualidad estacional; masculino, diurno, domicilio planetario de Saturno.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad de Géminis (junto a Géminis y Libra), que gobierna el noreste del mundo habitado, específicamente Escitia.", fuente: "Claudio Ptolomeo, Tetrabiblos (según síntesis de «Tetrabiblos – Wikipedia»)", tipo_fuente: "fuente primaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado a las piernas y específicamente asociado a los vasos sanguíneos; usado por practicantes como Culpeper para diagnosticar «plenitud de humores» y excesos flemáticos en la sangre.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Iconografía: cambio histórico documentado desde la identificación mesopotámica de la constelación como «El Gigante» hacia su representación posterior en las tradiciones grecorromana y occidental como el «Portador de Agua»."
    ],
    notas: ["Vacío en las fuentes cargadas respecto a Acuario en tradiciones mesoamericana (maya/azteca) o pre-neolítica, sí documentadas para otras constelaciones eclípticas."],
    estado: "poblado"
  },

  Pisces: {
    id: "Pisces", nombre: "Piscis", simbolo: "♓️",
    origen: {
      nombres_antiguos: "Shinunutu («La Gran Golondrina») y Anunitum («La Señora de los Cielos») (mesopotámico/sumerio)",
      figura: "Representa dos peces unidos. Mitológicamente se originó de la fusión de dos asterismos mesopotámicos independientes — una golondrina y una diosa — transformados en peces y unificados en un solo signo zodiacal bajo influencia griega."
    },
    dominio: {
      descripcion: "Piscis simboliza transición estacional como signo «bicorpóreo» y se asocia con asuntos marítimos, el mar y las inundaciones; anatómicamente se mapea a los pies.",
      consenso_independiente: { existe: false, detalle: "Línea clara de transmisión cultural y evolución iconográfica desde bases mesopotámicas hacia grecorromana y tradiciones occidentales posteriores." }
    },
    voces_historicas: [
      { tradicion: "Mesopotámica", periodo: "s. VII a.C.", planteamiento: "Compuesto por dos asterismos separados, la «Gran Golondrina» y la «Señora de los Cielos», identificados como deidades «situadas en el camino de la luna» por cuyos sectores pasaba mensualmente.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Mesopotámica", periodo: "s. VI a.C.", planteamiento: "Como resultado de la reorganización del zodíaco en doce signos iguales, varias constelaciones independientes de esta región estelar se fusionaron en el signo único de Piscis.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Signo «bicorpóreo» que comparte propiedades de dos estados climáticos; femenino, nocturno, domicilio planetario de Júpiter.", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Grecorromana", periodo: "s. II d.C.", planteamiento: "Parte de la triplicidad de Cáncer (junto a Cáncer y Escorpio), que gobierna el suroeste del mundo habitado, específicamente el noroeste de África (antigua Libia).", fuente: "Claudio Ptolomeo, Tetrabiblos", tipo_fuente: "fuente primaria" },
      { tradicion: "Cristiana Primitiva", periodo: "s. II d.C.", planteamiento: "El símbolo del pez se adoptó en Alejandría para representar a la nueva religión, coincidiendo con la transición del Punto Vernal hacia el signo sideral de Piscis por efecto de la precesión.", fuente: "Nick Kollerstrom, The Star Zodiac of Antiquity, 1997", tipo_fuente: "síntesis secundaria" },
      { tradicion: "Medicina Astrológica Inglesa", periodo: "s. XVII", planteamiento: "Mapeado específicamente a los pies; su regente, Júpiter, se usa para determinar tratamientos y se considera enemigo esencial de Mercurio.", fuente: "Graeme Tobyn, «¿El contenido astrológico del English Physitian de Culpeper socavó su utilidad?», Culture and Cosmos, Vol. 26 N.º 2, 2022, pp. 35–53", tipo_fuente: "síntesis secundaria" }
    ],
    contradicciones: [
      "Evolución iconográfica: cambio histórico documentado desde la tradición mesopotámica de dos figuras distintas y biológicamente diferentes (una golondrina y una diosa) hacia la representación unificada grecorromana de dos «Peces»."
    ],
    notas: ["Vacío en las fuentes cargadas respecto a Piscis en tradiciones mesoamericana o pre-neolítica, sí documentadas para otras constelaciones eclípticas."],
    estado: "poblado"
  }

};