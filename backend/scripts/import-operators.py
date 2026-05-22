# i used this to import the operator data from the csv file into the db.
# you can edit the path to the csv file and the db url as required.
# also make sure to have the operators table created in your db before running this.

# its always useful to get your terminal output to a file when running this so you can check for any errors or missing entries.

import pandas as pd
from sqlalchemy import create_engine

DATABSE_URL = your_database_url_here  # e.g., "postgresql://user:password@localhost:5432/signal_map"
engine = create_engine(DATABSE_URL)

# here chunks werent req as the file is quite small but i still did so that i can pinpoint paticular errors better
# honestly not required u can access the paticular error in a log file as well because terminal might fill up
CHUNK_SIZE = 50

# edit the path as required for you file
for chunk in pd.read_csv("data.csv", chunksize=CHUNK_SIZE):
    chunk = chunk[
        [
            "mcc",
            "mnc",
            "operator_name",
            "brand",
        ]
    ]
    # normalize missing operator info to 'unknown' to avoid NULLs in DB
    if "operator_name" in chunk.columns:
        chunk["operator_name"] = (
            chunk["operator_name"].replace("", None).fillna("unknown")
        )
    if "brand" in chunk.columns:
        chunk["brand"] = chunk["brand"].replace("", None).fillna("unknown")
    chunk.to_sql("operators", engine, if_exists="append", index=False, method="multi")

    print(f"Inserted {len(chunk)} rows")

print("Done")
