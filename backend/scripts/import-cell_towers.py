# i used this to import the cell tower data from the csv file into the db.
# it is a huge file(24lakh lines approx) so it reads it in chunks of 50k lines and inserts it into the db.
# you can edit the path to the csv file and the db url as required.
# also make sure to have the cell_towers table created in your db before running this.

# its always useful to get your terminal output to a file when running this so you can check for any errors or missing entries.

import pandas as pd
from sqlalchemy import create_engine

DATABSE_URL = your_database_url_here  # e.g., "postgresql://user:password@localhost:5432/signal_map"
engine = create_engine(DATABSE_URL)

# we will be using chunks to read the csv as it is huge and we don't want to load it all into memory at once
CHUNK_SIZE = 50000
chunk_num = 0

# edit the path as required for you file
for chunk in pd.read_csv("data.csv", chunksize=CHUNK_SIZE):
    chunk_num += 1
    chunk.rename(
        columns={
            "long": "longitude",
            "lat": "latitude",
            "sample": "samples",
            "created": "created_at",
            "updated": "updated_at",
            "avgsignal": "avg_signal",
        },
        inplace=True,
    )

    chunk["location"] = (
        "SRID=4326;POINT("
        + chunk["longitude"].astype(str)
        + " "
        + chunk["latitude"].astype(str)
        + ")"
    )

    chunk = chunk[
        [
            "radio",
            "mcc",
            "mnc",
            "lac",
            "cid",
            "longitude",
            "latitude",
            "range",
            "samples",
            "created_at",
            "updated_at",
            "avg_signal",
            "location",
        ]
    ]
    try:
        chunk.to_sql(
        "cell_towers",
        engine,
        if_exists="append",
        index=False,
        method="multi"
        )

        print(f"Inserted chunk {chunk_num}")

    except Exception as e:
        print(f"FAILED CHUNK {chunk_num}")
        print(e)
        break

print("Done")
