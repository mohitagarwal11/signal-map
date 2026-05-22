# i used this to compare the db against the csv file so i know which entries were missing and needed to be inserted.
# should have the db url ofc and the csv file path as arguments
# also if u want to insert the missing rows into the db, pass --insert as a second argument.

# its always useful to get your terminal output to a file when running this so you can check the missing entries

import csv
import sys

from sqlalchemy import create_engine, text

DATABASE_URL = your_database_url_here  # e.g., "postgresql://user:password@localhost:5432/signal_map"
ENGINE = create_engine(DATABASE_URL)


def normalize_int(value):
    value = str(value).strip()
    if not value:
        return None
    return int(value)


def read_csv_pairs(path):
    pairs = []
    seen = set()

    with open(path, newline="", encoding="utf-8-sig", errors="ignore") as file_obj:
        reader = csv.DictReader(file_obj)

        for row in reader:
            try:
                mcc = normalize_int(row.get("mcc"))
                mnc = normalize_int(row.get("mnc"))
            except ValueError:
                continue

            if mcc is None or mnc is None:
                continue

            key = (mcc, mnc)
            if key not in seen:
                seen.add(key)
                pairs.append(key)

    return pairs


def fetch_db_pairs():
    with ENGINE.connect() as connection:
        rows = connection.execute(text("SELECT mcc, mnc FROM operators")).all()
    return {(int(row.mcc), int(row.mnc)) for row in rows}


def sort_key(item):
    return item[0], item[1]


def insert_missing_rows(missing_pairs):
    if not missing_pairs:
        return 0

    inserted = 0
    with ENGINE.begin() as connection:
        for mcc, mnc in missing_pairs:
            result = connection.execute(
                text("""
                    INSERT INTO operators (mcc, mnc, operator_name, brand)
                    SELECT :mcc, :mnc, 'unknown', 'unknown'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM operators WHERE mcc = :mcc AND mnc = :mnc
                    )
                    """),
                {"mcc": mcc, "mnc": mnc},
            )
            inserted += result.rowcount or 0
    return inserted


def main():
    # here u can change your file path as required or pass it as an argument when running the script.
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "405.csv"
    do_insert = len(sys.argv) > 2 and sys.argv[2].lower() in {"--insert", "insert"}

    csv_pairs = read_csv_pairs(csv_path)
    db_pairs = fetch_db_pairs()

    missing = sorted((pair for pair in csv_pairs if pair not in db_pairs), key=sort_key)

    for mcc, mnc in missing:
        print(f"{mcc},{mnc}")

    print(f"COUNT: {len(missing)}")

    if do_insert:
        inserted = insert_missing_rows(missing)
        print(f"INSERTED: {inserted}")


if __name__ == "__main__":
    main()
