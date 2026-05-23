#!/usr/bin/env python3
"""Example skill script.

This is an illustrative template showing how a skill script is structured.
It reads the example journey's sample.csv, aggregates the rows by category,
and prints a small summary. Copy and adapt it for your own skill.

Run from anywhere:  python3 example.py
"""

import csv
from collections import defaultdict
from pathlib import Path


def find_data_file() -> Path:
    """Resolve the sample CSV relative to this script's location.

    The script lives at skills/example-skill/scripts/example.py, so the
    knowledge directory is three levels up. Adjust if you move the script.
    """
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    return repo_root / "knowledge" / "journey-data" / "example-journey" / "sample.csv"


def load_rows(csv_path: Path) -> list[dict]:
    """Read a CSV into a list of dicts keyed by column header."""
    with csv_path.open(newline="") as f:
        return list(csv.DictReader(f))


def summarize(rows: list[dict]) -> dict:
    """Group rows by `category` and total the numeric `value` column."""
    totals: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        category = row.get("category", "uncategorized")
        counts[category] += 1
        try:
            totals[category] += float(row.get("value", 0) or 0)
        except ValueError:
            # Skip rows whose value cannot be parsed; a real skill would log this.
            pass
    return {cat: {"count": counts[cat], "total": totals[cat]} for cat in counts}


def main() -> None:
    csv_path = find_data_file()
    rows = load_rows(csv_path)

    print("=" * 50)
    print("EXAMPLE SKILL — DATASET SUMMARY")
    print("=" * 50)
    print(f"Source: {csv_path}")
    print(f"Rows read: {len(rows)}\n")

    summary = summarize(rows)
    print(f"{'Category':<16}{'Count':>8}{'Total Value':>16}")
    print("-" * 40)
    for category, stats in sorted(summary.items()):
        print(f"{category:<16}{stats['count']:>8}{stats['total']:>16,.2f}")


if __name__ == "__main__":
    main()
