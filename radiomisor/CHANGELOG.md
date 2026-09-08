# Bitácora de Cambios — Psicoandino Radio (Radiomisor)

Todos los cambios notables en este proyecto se documentan en este archivo siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico [SemVer](https://semver.org/).

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
