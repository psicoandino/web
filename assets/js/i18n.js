/* ============================================================
   PSICOANDINO · TRANSLATIONS
   ============================================================
   Para editar los textos:
   · Busca la clave que quieres cambiar (ej: "inicio_sub")
   · Edita el valor en "es" para español
   · Edita el valor en "en" para inglés
   · Guarda el archivo. Listo.
   ============================================================ */

const i18n = (() => {

  const translations = {

    es: {

      /* ---- NAVEGACIÓN ---- */
      nav_lab:          'laboratorio',
      nav_manifest:     'manifiesto',
      nav_projects:     'proyectos',

      /* ---- INDEX · SIDENAV ---- */
      side_inicio:      'inicio',
      side_proceso:     'proceso',
      side_contacto:    'contacto',

      /* ---- INDEX · INICIO ---- */
      inicio_coord:     '−33.45° S / −70.66° W · LABORATORIO DIGITAL',
      inicio_sub:       'ARTESANÍA DIGITAL · EST. 2026',
      inicio_truth:     '<span>Construyo sistemas digitales simples, soberanos y a medida.</span><br>Primero el problema. Después la solución.<br>Lo que hacemos te pertenece — código, dominio y todo.',

      /* ---- INDEX · PROCESO ---- */
      proceso_label:    '// PROCESO',
      proceso_1_name:   'AGUA · DIOS',
      proceso_1_action: 'Escuchar el problema real',
      proceso_1_desc:   'diagnóstico',
      proceso_2_name:   'AIRE · MENTE',
      proceso_2_action: 'Diseñar la arquitectura',
      proceso_2_desc:   'propuesta',
      proceso_3_name:   'FUEGO · CIENCIA',
      proceso_3_action: 'Construir y probar',
      proceso_3_desc:   'desarrollo',
      proceso_4_name:   'TIERRA · MATERIA',
      proceso_4_action: 'Entregar y enseñar',
      proceso_4_desc:   'soberanía',

      /* ---- INDEX · CONTACTO ---- */
      contacto_label:       '// CONTACTO',
      contacto_intro:       'Antes de escribirte necesito entender tu situación. Son 4 preguntas. Menos de 2 minutos.',
      contacto_note:        'Respondo en 24-48 horas hábiles',
      contacto_btn_start:   'INICIAR SOLICITUD →',
      ms_q1:                '¿Con quién hablo?',
      ms_opt_persona:       'PERSONA',
      ms_opt_org:           'ORGANIZACIÓN',
      ms_name_ph:           'Nombre',
      ms_q2:                '¿Qué necesitas resolver?',
      ms_situation_ph:      'Tu situación...',
      ms_q3:                '¿Cuál es tu urgencia?',
      ms_opt_alta:          'ALTA',
      ms_opt_media:         'MEDIA',
      ms_opt_baja:          'BAJA',
      ms_siguiente:         'SIGUIENTE →',
      ms_atras:             '← ATRÁS',
      ms_q4:                'Resumen',
      ms_note2:             'Respondo en 24-48 horas hábiles',
      btn_wa:               'ENVIAR POR WHATSAPP',
      btn_email:            'ENVIAR POR CORREO',

      /* ---- CONTACTO · RESUMEN & MENSAJE ---- */
      summary_identity:     'Identidad',
      summary_name:         'Nombre',
      summary_situation:    'Situación',
      summary_urgency:      'Urgencia',
      msg_intro:            'Hola, detallo mi situación:',

      /* ---- MANIFIESTO · SIDENAV ---- */
      side_mision:          'misión',
      side_vision:          'visión',
      side_valores:         'valores',
      side_quienes:         'quiénes somos',

      /* ---- MANIFIESTO · CONTENIDO ---- */
      mision_label:         '// IDENTIDAD · 01',
      mision_title:         'MISIÓN',
      mision_text:          '<span>Propiciar la soberanía digital</span> mediante el diseño e implementación de sistemas limpios, lógicos y autónomos. Reivindicar el desarrollo web como un acto de artesanía precisa, devolviendo el control absoluto de la infraestructura y el conocimiento al usuario.',
      vision_label:         '// IDENTIDAD · 02',
      vision_title:         'VISIÓN',
      vision_text:          'Un ecosistema digital donde la complejidad innecesaria sea sustituida por <span>estructuras transparentes</span>. Un retorno a la web independiente, donde cada entidad posea arquitecturas sólidas sin depender de abstracciones monolíticas o intermediarios redundantes.',
      valores_label:        '// IDENTIDAD · 03',
      valores_title:        'VALORES',
      valores_text:         '· <span>Soberanía</span>: El código, los datos y la infraestructura pertenecen íntegramente a quien los origina.<br>· <span>Esencialismo</span>: Enfoque riguroso en la utilidad funcional; rechazo al adorno técnico innecesario.<br>· <span>Transparencia</span>: Estructuras legibles y metodologías claras que educan durante el proceso.',
      quienes_label:        '// IDENTIDAD · 04',
      quienes_title:        'QUIÉNES SOMOS',
      quienes_text:         'PSICOANDINO ó un espacio de convergencia entre <span>Dios, Ciencia y Mente</span>. No operamos como una factoría masiva de software, sino como un taller de arquitectura digital conceptual enfocado en resolver problemas profundos a través de herramientas perennes.',

      /* ---- PROYECTOS ---- */
      p001_label:           '// REGISTRO ARCHIVÍSTICO',
      p001_tag:             '001 · CLIENTE',
      p001_desc:            'Diseño e implementación de una infraestructura digital soberana para la gestión integral de servicios profesionales y repositorio de conocimiento transpersonal. Interfaz minimalista optimizada para la autonomía total del ecosistema sin dependencias propietarias opacas.',
      p001_testimonial:     '"La claridad de la arquitectura me devolvió el control absoluto sobre mi consulta y canales de difusión, eliminando intermediarios técnicos innecesarios." — Cliente',
      p002_label:           '// REGISTRO ARCHIVÍSTICO',
      p002_tag:             '002 · EXPERIMENTO',
      p002_desc:            'Motor experimental de renderizado gráfico de datos efemérides y cálculo posicional simbólico. Desarrollado enteramente bajo filosofías puristas de vanilla script sobre pantallas con tecnología OLED de alto contraste y nula sobrecarga de memoria de ejecución.',
    
      /* ---- SIGNAL ---- */
      signal_inactive:    'SISTEMA INACTIVO',
      signal_calibrating: 'CALIBRANDO CONTEXTO...',
      signal_ready:       'SEÑAL OPTIMA / COMPLETA',
    },

    en: {

      /* ---- NAVEGACIÓN ---- */
      nav_lab:          'laboratory',
      nav_manifest:     'manifesto',
      nav_projects:     'projects',

      /* ---- INDEX · SIDENAV ---- */
      side_inicio:      'start',
      side_proceso:     'process',
      side_contacto:    'contact',

      /* ---- INDEX · INICIO ---- */
      inicio_coord:     '−33.45° S / −70.66° W · DIGITAL LABORATORY',
      inicio_sub:       'DIGITAL CRAFTSMANSHIP · EST. 2026',
      inicio_truth:     '<span>I build simple, sovereign, custom digital systems.</span><br>Problem first. Solution after.<br>What we build is yours — code, domain and all.',

      /* ---- INDEX · PROCESO ---- */
      proceso_label:    '// PROCESS',
      proceso_1_name:   'WATER · GOD',
      proceso_1_action: 'Listen to the real problem',
      proceso_1_desc:   'diagnosis',
      proceso_2_name:   'AIR · MIND',
      proceso_2_action: 'Design the architecture',
      proceso_2_desc:   'proposal',
      proceso_3_name:   'FIRE · SCIENCE',
      proceso_3_action: 'Build and test',
      proceso_3_desc:   'development',
      proceso_4_name:   'EARTH · MATTER',
      proceso_4_action: 'Deliver and teach',
      proceso_4_desc:   'sovereignty',

      /* ---- INDEX · CONTACTO ---- */
      contacto_label:       '// CONTACT',
      contacto_intro:       'Before I write to you I need to understand your situation. 4 questions. Less than 2 minutes.',
      contacto_note:        'I respond within 24–48 business hours',
      contacto_btn_start:   'START REQUEST →',
      ms_q1:                'Who am I speaking with?',
      ms_opt_persona:       'PERSON',
      ms_opt_org:           'ORGANIZATION',
      ms_name_ph:           'Name',
      ms_q2:                'What do you need to solve?',
      ms_situation_ph:      'Your situation...',
      ms_q3:                'What is your urgency?',
      ms_opt_alta:          'HIGH',
      ms_opt_media:         'MEDIUM',
      ms_opt_baja:          'LOW',
      ms_siguiente:         'NEXT →',
      ms_atras:             '← BACK',
      ms_q4:                'Summary',
      ms_note2:             'I respond within 24–48 business hours',
      btn_wa:               'SEND VIA WHATSAPP',
      btn_email:            'SEND BY EMAIL',

      /* ---- CONTACTO · RESUMEN & MENSAJE ---- */
      summary_identity:     'Identity',
      summary_name:         'Name',
      summary_situation:    'Situation',
      summary_urgency:      'Urgency',
      msg_intro:            'Hello, here is my situation:',

      /* ---- MANIFIESTO · SIDENAV ---- */
      side_mision:          'mission',
      side_vision:          'vision',
      side_valores:         'values',
      side_quienes:         'who we are',

      /* ---- MANIFIESTO · CONTENIDO ---- */
      mision_label:         '// IDENTITY · 01',
      mision_title:         'MISSION',
      mision_text:          '<span>Foster digital sovereignty</span> through the design and implementation of clean, logical, autonomous systems. Reclaim web development as an act of precise craftsmanship, returning full control of infrastructure and knowledge to the user.',
      vision_label:         '// IDENTITY · 02',
      vision_title:         'VISION',
      vision_text:          'A digital ecosystem where unnecessary complexity is replaced by <span>transparent structures</span>. A return to the independent web, where every entity owns solid architectures without depending on monolithic abstractions or redundant intermediaries.',
      valores_label:        '// IDENTITY · 03',
      valores_title:        'VALUES',
      valores_text:         '· <span>Sovereignty</span>: Code, data and infrastructure belong entirely to those who originate them.<br>· <span>Essentialism</span>: Rigorous focus on functional utility; rejection of unnecessary technical ornament.<br>· <span>Transparency</span>: Readable structures and clear methodologies that educate throughout the process.',
      quienes_label:        '// IDENTITY · 04',
      quienes_title:        'WHO WE ARE',
      quienes_text:         'PSICOANDINO is a convergence space between <span>God, Science and Mind</span>. We do not operate as a mass software factory, but as a conceptual digital architecture studio focused on solving deep problems through enduring tools.',

      /* ---- PROYECTOS ---- */
      p001_label:           '// ARCHIVAL RECORD',
      p001_tag:             '001 · CLIENT',
      p001_desc:            'Design and implementation of a sovereign digital infrastructure for the comprehensive management of professional services and transpersonal knowledge repository. Minimalist interface optimized for total ecosystem autonomy without opaque proprietary dependencies.',
      p001_testimonial:     '"The clarity of the architecture gave me back absolute control over my practice and distribution channels, eliminating unnecessary technical intermediaries." — Client',
      p002_label:           '// ARCHIVAL RECORD',
      p002_tag:             '002 · EXPERIMENT',
      p002_desc:            'Experimental engine for graphical rendering of ephemeris data and symbolic positional calculation. Built entirely under purist vanilla script philosophy on high-contrast OLED screens with zero execution memory overhead.',
    
      /* ---- SIGNAL ---- */
      signal_inactive:    'SYSTEM INACTIVE',
      signal_calibrating: 'CALIBRATING CONTEXT...',
      signal_ready:       'SIGNAL OPTIMAL / COMPLETE',    
    }

  };

  let current = localStorage.getItem('pa-lang') || 'es';

  /* --- Public: get a translation by key --- */
  function t(key) {
    return translations[current][key] || key;
  }

  /* --- Apply a language to the DOM --- */
  function apply(lang) {
    current = lang;
    localStorage.setItem('pa-lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = translations[lang][el.getAttribute('data-i18n')];
      if (v !== undefined) el.textContent = v;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = translations[lang][el.getAttribute('data-i18n-html')];
      if (v !== undefined) el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = translations[lang][el.getAttribute('data-i18n-placeholder')];
      if (v !== undefined) el.setAttribute('placeholder', v);
    });

    const btn = document.querySelector('.pa-lang-toggle');
    if (btn) btn.textContent = lang === 'es' ? 'EN' : 'ES';
  }

  /* --- Init on DOM ready --- */
  document.addEventListener('DOMContentLoaded', () => {
    apply(current);

    const btn = document.querySelector('.pa-lang-toggle');
    if (btn) {
      btn.addEventListener('click', () => apply(current === 'es' ? 'en' : 'es'));
    }
  });

  return { t, apply, get current() { return current; } };

})();