# Bitácora de Cambios — Psicoandino Radio (Radiomisor)

Todos los cambios notables en este proyecto se documentan en este archivo siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico [SemVer](https://semver.org/).

---

## [2.7.0] - 2026-09-08
### Añadido
* **Consola de Estudio Modular de 3 Columnas (Desktop >= 1120px):** Aprovechamiento inteligente del espacio en pantallas medianas y grandes con disposición tipo hardware rack (Cabina/Deck izquierda, Master Broadcast central y Programación derecha).
* **Analizador Espectral Expandido de 48 Bandas:** Espectrograma de alta resolución que llena el ancho de la consola con regla de escala de frecuencias (`40Hz` a `14kHz`).
* **Buscador Dinámico en Catálogo de 109 Pistas:** Filtrado instantáneo por texto en el panel de programación.
* **Banner de Siguiente Pista en Transmisión:** Indicador permanente de la próxima canción y su duración.
* **Selector de Modo de Vista (`[VISTA: ESTUDIO] / [VISTA: ENFOQUE]`):** Conmutador rápido para alternar entre consola de estudio completa o reproductor minimalista con guardado en preferencias locales.

---

## [2.6.2] - 2026-09-08
### Mejorado
* **Normalización Logarítmica del Espectro FFT:** Implementada escala psicoacústica logarítmica (40 Hz - 14.000 Hz) con compensación de inclinación espectral (*equal loudness tilt*) y resolución FFT de 512 bins, eliminando la saturación continua en frecuencias graves (`--sangre`) y logrando una respuesta dinámica y reactiva en todo el rango tonal.

---

## [2.6.0] - 2026-09-08
### Añadido
* **Identificadores Atmosféricos de Estación (`Station ID`):** Campanilla analógica de 3 tonos y síntesis de locución ("Estás en sintonía de Psicoandino Radio...") automática y manual.
* **Presets de Ecualización Analógica:** Modos de textura seleccionables en vivo ([Puro], [Cinta / Cassette], [Radio AM]).
* **Carátula Oficial de Transmisión (`psico-cover.png`):** Badge gráfico de alta resolución 512x512 para metadatos del sistema operativo y pantalla de bloqueo.
* **Control de Caché de Scripts:** Inclusión de parámetros de versión para asegurar la carga inmediata de las últimas funciones en navegadores locales y web.

### Corregido
* **Ámbito Global de Telemetría (`appLayout`):** Resolución de excepción `ReferenceError` al inicializar la lectura del estado de paneles.

---

## [2.5.0] - 2026-09-08
### Añadido
* **Catálogo Completo de 109 Canciones:** Integradas las 21 nuevas canciones del perfil `elpsicoandino` a las 88 existentes de `psicoandino`, completando ~4.0 horas de transmisión continua.
* **Analizador de Espectro FFT en Vivo:** Conexión directa del flujo de audio a un `AnalyserNode` de Web Audio API, mapeando frecuencias en tiempo real a caracteres monospace ` ▂▃▄▅▆▇█`.
* **Efecto de Sintonización Analógica (Dial FX):** Ráfaga de ruido blanco con barrido de filtro pasa-banda y tono heterodino al sintonizar la radio.
* **MediaSession API Nativa:** Metadatos de artista, título de pista, álbum y controles de reproducción en pantallas de bloqueo (iOS/Android) y teclas multimedia de macOS/Windows.
* **Visor de Bitácora / Changelog Integrado:** Modal interactivo accesible desde la interfaz web para consultar el historial de versiones.
* **Identificadores de Estación ("Station IDs"):** Locuciones y pulsos de frecuencia configurables entre bloques.

### Corregido
* **Resolución de Secuestro de Scroll:** Eliminado el llamado repetitivo de `scrollIntoView()` cada 250ms que impedía cerrar el panel de programación y bloquear el acceso al `[DECK]`.
* **Sintetizador de Vinilo de 4 Canales:** Conexión completa de todos los deslizadores de modulación analógica (`Hiss`, `Crackle`, `Thump` a 33⅓ RPM y `Rumble` sub-45Hz).
* **Control de Paneles Deslizantes:** Apertura y cierre suave con botón `[X]`, fondo con clic de escape y tecla `Escape`.

---

## [2.2.0] - 2026-08-31
### Añadido
* **Rotación Determinista por Ciclo (Mulberry32 PRNG):** Barajado pseudoaleatorio que genera un orden único para cada bloque de transmisión sin perder la sincronización universal *"Time is Truth"*.
* **Codificación Segura RFC 3986:** Manejo automático de corchetes, espacios y tildes en los nombres de archivos MP3.
* **Sincronización `loadedmetadata`:** Espera a la lectura de cabeceras de audio antes de posicionar el cursor temporal, eliminando silencios y errores de arranque.

---

## [2.0.0] - 2026-08-31
### Añadido
* **Motor Autónomo Local (RadioEngine v2.0):** Migración completa a reproducción de archivos locales MP3 de alta fidelidad.
* **Generación Automatizada de `station.json`:** Extracción de duraciones exactas al milisegundo mediante análisis con `ffprobe`.
* **Estructura Modular para Despliegue Web:** Organización en subcarpeta `/radiomisor` para servir en dominios públicos sin colisión de rutas.

---

## [1.6.0] - 2026-08-22
### Añadido
* **Diseño Tactile Deck Brutalista:** Interfaz monospace, paleta de colores cromática andina (hueso, oled, cobre, sangre, musgo, mostaza, amatista).
* **Fundamento "Time is Truth":** Sincronización matemática del punto de emisión basada en tiempo de época transcurrido.
* **Controles de Transporte y Volumen Escalonado LED.**
