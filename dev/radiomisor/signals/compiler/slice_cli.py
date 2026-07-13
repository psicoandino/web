import argparse
import hashlib
import json
import sys
from pathlib import Path

from .backends.pcm_backend import PCMBackend
from .exceptions import CompilerError
from .frontend.frontend import Frontend
from .origin_store.store import OriginStore


def run_slice(youtube_id: str, output: Path) -> str:

    acquisition = OriginStore().acquire(youtube_id)
    car = Frontend().decode(acquisition)
    rsig = PCMBackend().encode(car, signal_id=youtube_id, provider="youtube")

    data = json.dumps(rsig, sort_keys=True).encode("utf-8")
    output.write_bytes(data)

    return hashlib.sha256(data).hexdigest()


def main() -> int:

    parser = argparse.ArgumentParser(
        description="Vertical slice (Milestone 1): YouTube ID -> test.rsig"
    )
    parser.add_argument("youtube_id", help="YouTube video ID")
    parser.add_argument("--output", type=Path, default=Path("test.rsig"))

    args = parser.parse_args()

    try:
        digest = run_slice(args.youtube_id, args.output)
    except CompilerError as e:
        print(f"Slice error: {e}", file=sys.stderr)
        return 1

    print(f"{args.output} sha256={digest}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
