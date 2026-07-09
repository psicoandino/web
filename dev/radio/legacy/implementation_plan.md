# Implementation Plan — 5 Feature Changes
> `testin.html` · Psicoandino Radio v1.6

---

## (a) Right drawer [LIST]/[RAW] → Origin-filter tabs

### Problem
The `[RAW]` view was showing raw video IDs. The real intent is to **filter the COLAS view by origin** — see only tracks that came from PLAYLIST EXT vs. tracks from ENSAMBLAJE LOC.

### Proposed Change
Replace the `[LIST]` / `[RAW]` toggle buttons with three origin-filter tabs:

```
[TODOS]  [EXT]  [LOC]
```

- `[TODOS]` — shows all tracks in the active queue (current default)
- `[EXT]` — shows only tracks tagged as loaded from external playlist
- `[LOC]` — shows only tracks tagged as loaded from local assembly

### New Data
Add a `videoOrigin = {}` map (`videoId → 'ext' | 'loc'`) populated when `loadPlaylist` is called.  
Tags are stored in memory only (no persistence needed — queue reloads on refresh anyway).

The raw textarea editor is **removed** (it was unrelated to the real intent). Raw editing was already doable via ENSAMBLAJE LOC input.

---

## (b) Left bar — "SEÑALES CARGADAS" section

### Problem
No record of which IDs were successfully loaded into COLAS DE REPRODUCCIÓN.

### Proposed Change
Add a new section in the left `control-deck`, below `TELEMETRÍA DE DECK`, titled:

```
SEÑALES CARGADAS
```

This is a **scrollable compact list** of `{ videoId, title, origin }` entries, populated whenever a track **successfully plays** (`onPlayerStateChange PLAYING`).

- Entries are **deduplicated** (same ID appears only once)
- Persisted in `localStorage` as `psico_radio_history`
- Has a `[CLR]` button to wipe the log
- Each entry shows: number, short title or ID, origin badge `[EXT]` or `[LOC]`

> [!NOTE]
> This is different from the Archive — the Archive is curated (user-intentional); this log is **automatic** (everything that was ever in COLAS).

---

## (c) [ARC] removes from COLAS DE REPRODUCCIÓN

### Problem
Currently `[ARC]` copies a track to the Archive but **leaves it in the active queue**. The expected behavior is: archive it AND remove it from the queue.

### Proposed Change
After calling `archiveTrack()`, also:
1. `activeQueueIds.splice(idx, 1)` — remove from the array
2. `loadedPlaylistIds = []` — force DOM redraw
3. `updatePlayerQueue(adjustedCurrentIndex, 0)` — reload player without that track
4. Log: `SEÑAL ARCHIVADA Y RETIRADA DE COLA`

> [!IMPORTANT]
> If the archived track is **currently playing**, advance to next track before removing.

---

## (d) Duplicate guard on load

### Problem
If a video ID already in `psico_radio_history` (SEÑALES CARGADAS) is re-loaded via ENSAMBLAJE LOC, it should be silently skipped and a log entry should note it.

### Proposed Change
In `OriginManager.load()`, for **local assembly** mode:
- Before calling `player.loadPlaylist()`, filter `videoIds` against `loadedHistory`
- IDs found in history → skipped, logged as `WARN: ID YA EN HISTORIAL`
- Only fresh IDs are loaded

For **external playlist** mode: cannot pre-filter (YT controls the list), but after `syncTracklistUI`, any ID already in history gets a special badge `[SEEN]` instead of `[WAIT]`.

---

## (e) Video / Playlist toggle in both panels

### Problem
Both panels (CONTROL DE ORIGEN left, COLAS right) currently only work at the **video ID** level. The request is to also support working at the **playlist ID** level.

### Interpretation
This toggle changes **what kind of signal** is being managed:

| Mode | CONTROL DE ORIGEN | COLAS / ARCHIVO / CEMENTERIO |
|------|-------------------|------------------------------|
| `[SEÑALES]` (videos) | Current behavior — manage individual video IDs | Current behavior — per-track list |
| `[LISTAS]` (playlists) | Manage a list of **playlist IDs** (can queue multiple playlists) | Shows tracks **grouped by source playlist** |

### Proposed Change
Add a **global mode toggle** in the header (or top of each panel):

```
[SEÑALES ▸ LISTAS]
```

**In SEÑALES mode** (default — current behavior):
- Left bar: playlist ID input + local assembly textarea (unchanged)
- Right drawer: individual track list (unchanged)
- Archive/Cemetery: individual video entries (unchanged)

**In LISTAS mode**:
- Left bar: shows a **playlist queue** — a list of playlist IDs with `[+]` to add, `[X]` to remove, `[▶]` to play that playlist. Replaces the single playlist ID input.
- Right drawer: tracks grouped by their source playlist, with a section header per playlist
- Archive: can archive entire playlists (not just individual videos)
- Cemetery: same pattern

> [!IMPORTANT]
> This is the most complex change. Clarification needed:
>
> **Should the video/playlist toggle be global (one toggle affects everything) or per-panel (each panel has its own toggle)?**
>
> **Should LISTAS mode allow queuing multiple playlists in sequence, or just change how the existing queue is displayed?**

---

## Open Questions

> [!IMPORTANT]
> Please clarify (e) before implementation:
>
> 1. Is the video/playlist toggle **one global toggle** (top of page) or **per-panel**?
> 2. In LISTAS mode, can the user **queue multiple playlists** (play playlist A, then B, then C), or does it just group the existing queue visually?
> 3. Should Archive and Cemetery also support saving **entire playlist IDs** (not just individual video IDs) in LISTAS mode?

---

## Execution Order

Once approved, changes will be applied in this order to minimize regressions:

1. **(c)** `[ARC]` splice fix — isolated, low risk
2. **(b)** `SEÑALES CARGADAS` history section — new localStorage key, new DOM section
3. **(d)** Duplicate guard — builds on history from (b)
4. **(a)** Origin-filter tabs — replaces `[LIST]/[RAW]` UI + adds `videoOrigin` tracking
5. **(e)** Video/playlist toggle — largest change, implemented last

## Verification Plan

- Load an external playlist → verify tracks tagged `[EXT]`
- Load local assembly → verify tracks tagged `[LOC]`
- `[ARC]` a playing track → verify it leaves COLAS and appears in Archive
- Re-load a known ID via local assembly → verify `WARN: ID YA EN HISTORIAL` log
- Toggle `[EXT]` tab → verify only EXT tracks shown
- Toggle `[LISTAS]` mode (after clarification) → verify grouping
