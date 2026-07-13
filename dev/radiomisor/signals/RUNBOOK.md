# RUNBOOK — Operación de Radiomisor

> Guía ejecutable sin ningún modelo de IA. Copiar y pegar los comandos tal
> cual, desde la raíz del proyecto (`radiomisor/`).

## 1. Servir la radio localmente

```bash
cd /ruta/a/radiomisor
python3 -m http.server 8000
```

Abrir en el navegador: **http://localhost:8000/index.html**

### Probar desde el teléfono (misma red Wi-Fi)

1. Averiguar la IP local del computador:
   ```bash
   ipconfig getifaddr en0   # Wi-Fi, en Mac
   ```
2. Servir aceptando conexiones de la red, no solo localhost:
   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0
   ```
3. En el teléfono (conectado al mismo Wi-Fi), abrir en el navegador:
   `http://<IP-DEL-COMPUTADOR>:8000/index.html`

Para detener el servidor: `Ctrl+C` en la terminal donde corre.

## 2. Recompilar la estación

La raíz (`index.html`, `station.json`, `signals/`) es una copia de
`production_station/`. Recompilar significa regenerar `production_station/`
y luego copiar los archivos a la raíz.

### 2.1 Dependencias (una sola vez)

```bash
pip3 install yt-dlp static_ffmpeg pydub numpy
```

### 2.2 Compilar

El **epoch declarado** (`--epoch`) es el momento fijo de arranque de la
emisora — cambiarlo reinicia la posición de emisión (ver ADR-008, "time is
truth"). Para recompilar sin reiniciar la emisora, usar el epoch actual:

```bash
python3 -c "import json; print(json.load(open('station.json'))['station']['epoch'])"
```

Recompilar con las IDs de `station_ids.txt` (las primeras 10, que son las
que sirve hoy la raíz), mismo epoch, perfil nivel-cero (AAC-LC), tomando
metadata declarada del `station.json` actual:

```bash
python3 -m compiler.link_cli \
  $(head -10 station_ids.txt) \
  --epoch "<EPOCH-DEL-PASO-ANTERIOR>" \
  --codec aac \
  --output production_station \
  --declared-metadata station.json
```

Esto sobreescribe `production_station/station.json` y
`production_station/signals/`. **No toca la raíz.**

### 2.3 Publicar a la raíz

Verificar primero que compiló bien (ver sección 3), y solo entonces:

```bash
cp production_station/station.json station.json
rm -rf signals
cp -r production_station/signals signals
```

`index.html` de la raíz no cambia — sigue siendo el mismo archivo, solo
cambian los datos que sirve (`station.json` + `signals/`).

## 3. Verificar

### 3.1 Verificación mecánica (reproducibilidad)

Recompilar dos veces con los mismos IDs y epoch (repetir el paso 2.2 en un
directorio de salida distinto, p. ej. `--output /tmp/recompile_check`) y
comparar:

```bash
diff production_station/station.json /tmp/recompile_check/station.json
diff -rq production_station/signals /tmp/recompile_check/signals
```

Sin diferencias = reproducible (mismo input + misma toolchain → mismos
bytes). Si hay diferencias, no publicar — revisar antes.

### 3.2 Verificación humana (obligatoria antes de dar por buena una publicación)

Con el servidor local corriendo (paso 1):

1. **Desktop**: abrir `http://localhost:8000/index.html`. Debe verse un
   botón grande "▶ SINTONIZAR" y nada más compitiendo. Al hacer click,
   debe sonar, mostrar título y espectro animado.
2. **Volumen**: con la radio sonando, subir/bajar con `[-]`/`[+]` o los
   pasos de la barra — el audio debe cambiar de volumen en tiempo real.
3. **Modo libre**: click en "o entrar en modo libre" (o `[MODO LIBRE]`
   dentro del workspace) — debe permitir cargar IDs de YouTube propios.
4. **Deck y playlist**: botones `[DECK]` / `[LIST]` del header deben abrir
   paneles superpuestos con la biblioteca de señales / cola activa, y
   cerrarse al tocar fuera.
5. **Móvil real**: abrir la URL de red local (sección 1) desde el
   teléfono. Debe verse bien, sin desborde horizontal, y sintonizar/sonar
   igual que en desktop.

Si algo de esto falla, no se considera una publicación válida — volver al
paso 2 o reportar el defecto (ver `compiler/docs/MODEL_REFUTATIONS.md` para
el formato de registro).

## 4. Estructura de referencia

- `index.html`, `station.json`, `signals/` — lo que sirve la radio hoy
  (copia de `production_station/`).
- `radio-engine.js` — motor de reproducción (carga la estación, calcula
  posición de emisión desde el epoch, decodifica y reproduce). Tocarlo
  requiere autorización explícita — ver `compiler/docs/MILESTONES.md` y
  `compiler/docs/DECISIONS.md`.
- `compiler/link_cli.py` — recompila una estación completa (linker).
- `compiler/slice_cli.py` — compila una sola señal (vertical slice,
  diagnóstico/debug, no para producción).
- `station_ids.txt` — lista de IDs de YouTube disponibles para compilar.
- `legacy_station/`, `compiler/legacy/` — archivo histórico, no se usa en
  producción, no se borra.
- `compiler/docs/MILESTONES.md`, `IMPLEMENTATION.md`, `DECISIONS.md`,
  `MODEL_REFUTATIONS.md` — historial y estado del proyecto (leer antes de
  pedir un cambio grande).
