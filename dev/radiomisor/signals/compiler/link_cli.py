import argparse
import sys
from pathlib import Path

from .backends.aac_backend import AACBackend
from .exceptions import CompilerError
from .linker.linker import Linker
from .metadata.resolver import load_declared_metadata


def main() -> int:

    parser = argparse.ArgumentParser(
        description="Linker (Milestones 3-4): YouTube IDs -> station.json + signals/"
    )
    parser.add_argument("youtube_ids", nargs="+", help="YouTube IDs, en orden de emisión")
    parser.add_argument(
        "--epoch", required=True,
        help="Epoch declarado de la estación (ISO 8601). Nunca now() — ADR-008.",
    )
    parser.add_argument(
        "--name", default="Psicoandino Experimental Radio",
        help="Nombre de la estación",
    )
    parser.add_argument(
        "--output", type=Path, default=Path("linked_station"),
        help="Directorio de salida",
    )
    parser.add_argument(
        "--codec", choices=["pcm", "aac"], default="pcm",
        help="Backend de compilación de señal: pcm (RSIG-1, default) o "
             "aac (RSIG-2, AAC-LC nivel cero — ADR-011/ADR-012, Milestone 4).",
    )
    parser.add_argument(
        "--declared-metadata", type=Path, default=None,
        help="station.json existente del que tomar title/artist/album/year "
             "declarados (precedencia sobre lo extraído del Origin Store — "
             "Milestone 5, CONTRACTS.md sección Metadata).",
    )

    args = parser.parse_args()

    backend = AACBackend() if args.codec == "aac" else None
    linker = Linker(backend=backend)

    declared_metadata = (
        load_declared_metadata(args.declared_metadata)
        if args.declared_metadata
        else None
    )

    try:
        station_path = linker.link(
            args.youtube_ids, args.epoch, args.name, args.output,
            declared_metadata=declared_metadata,
        )
    except CompilerError as e:
        print(f"Linker error: {e}", file=sys.stderr)
        return 1

    for mismatch in linker.duration_mismatches:
        print(
            "DURATION MISMATCH (refutación, no parcheado): "
            f"{mismatch['id']} declared={mismatch['declared_duration']:.3f}s "
            f"decoded={mismatch['decoded_duration']:.3f}s",
            file=sys.stderr,
        )

    print(f"{station_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
