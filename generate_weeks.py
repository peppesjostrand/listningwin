"""
Genererar data/weeks/2026.json och data/weeks/2027.json med ISO 8601-veckor.

Varje nyckel är veckonumret som sträng ("1", "2", ...).
Varje värde har "start" (måndag) och "end" (söndag) som YYYY-MM-DD.

Användning:
    python generate_weeks.py
"""

from datetime import date
import json
import os


def get_iso_weeks(year: int) -> dict:
    weeks = {}
    week = 1
    while True:
        try:
            monday = date.fromisocalendar(year, week, 1)
            sunday = date.fromisocalendar(year, week, 7)
        except ValueError:
            break
        weeks[str(week)] = {
            "start": monday.isoformat(),
            "end": sunday.isoformat(),
        }
        week += 1
    return weeks


def main():
    os.makedirs("data/weeks", exist_ok=True)

    for year in [2026, 2027]:
        weeks = get_iso_weeks(year)
        path = f"data/weeks/{year}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(weeks, f, indent=2, ensure_ascii=False)

        first = weeks["1"]
        last_num = max(weeks, key=int)
        last = weeks[last_num]
        print(f"{year}: {len(weeks)} veckor")
        print(f"  Vecka   1: {first['start']} – {first['end']}")
        print(f"  Vecka {last_num:>2}: {last['start']} – {last['end']}")
        print()


if __name__ == "__main__":
    main()
