import argparse
import sys
from pathlib import Path

from .compiler import Compiler
from .exceptions import CompilerError


def main() -> int:

    parser = argparse.ArgumentParser(description="Radiomisor station compiler")
    parser.add_argument("ids_file", type=Path, help="Path to a text file with one YouTube ID per line")

    args = parser.parse_args()

    compiler = Compiler()

    try:
        compiler.compile(args.ids_file)
    except CompilerError as e:
        print(f"Compiler error: {e}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
