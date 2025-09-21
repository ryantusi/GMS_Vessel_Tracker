#!/usr/bin/env python3
"""
build_locode_json.py

Inputs:
 - code-list.csv
 - country-codes.csv

Output:
 - locode.json   (array of objects with fields)
 - skipped.json  (rows with invalid location/coordinates)

Schema:
{
  "locode": "ADALV",
  "portCode": "ALV",
  "port": "Andorra la Vella",
  "countryCode": "AD",
  "country": "Andorra",
  "lat": 42.5,
  "lon": 1.5167,
  "port_norm": "ANDORRA LA VELLA, ANDORRA"
}
"""

import pandas as pd
import json
import re
from unidecode import unidecode
from pathlib import Path

CODELIST_CSV = "code-list.csv"
COUNTRY_CSV = "country-codes.csv"
OUT_JSON = "locode.json"
SKIP_JSON = "skipped.json"

# ---------------- Helpers ----------------
def normalize_port_name(s: str) -> str:
    """Normalize string for fuzzy matching"""
    if not isinstance(s, str):
        return ""
    s = unidecode(s)
    s = s.upper().strip()
    s = re.sub(r"[^\w\s]", " ", s)   # remove punctuation
    s = re.sub(r"\s+", " ", s)
    return s

def parse_coordinates(coord: str):
    """
    Convert UN/LOCODE 'Coordinates' (e.g. '4230N 00131E') to decimal lat/lon.
    Format: DDMMN DDDMME or similar.
    Returns (lat, lon) or (None, None).
    """
    if not isinstance(coord, str) or not coord.strip():
        return None, None

    parts = coord.strip().split()
    if len(parts) != 2:
        return None, None

    lat_raw, lon_raw = parts

    def convert(raw, is_lat=True):
        try:
            if is_lat:
                deg = int(raw[0:2])
                minutes = int(raw[2:4])
                hemi = raw[4]
                value = deg + minutes / 60.0
                if hemi == "S":
                    value = -value
            else:
                deg = int(raw[0:3])
                minutes = int(raw[3:5])
                hemi = raw[5]
                value = deg + minutes / 60.0
                if hemi == "W":
                    value = -value
            return value
        except Exception:
            return None

    lat = convert(lat_raw, is_lat=True)
    lon = convert(lon_raw, is_lat=False)
    return lat, lon

# ---------------- Load Data ----------------
print("Loading CSVs...")
df_codes = pd.read_csv(CODELIST_CSV, dtype=str, keep_default_na=False)
df_countries = pd.read_csv(COUNTRY_CSV, dtype=str, keep_default_na=False)

# Build country map
country_map = {row["CountryCode"].strip().upper(): row["CountryName"].strip()
               for _, row in df_countries.iterrows()}

# ---------------- Process ----------------
records = []
skipped = []
seen = set()

for _, row in df_codes.iterrows():
    c_code = row["Country"].strip().upper()
    loc = row["Location"].strip().upper()
    port_name_raw = row["Name"].strip()
    coords = row["Coordinates"].strip()

    if not c_code or not loc:
        skipped.append({"country": c_code, "location": loc, "name": port_name_raw})
        continue

    locode = c_code + loc
    if locode in seen:
        continue
    seen.add(locode)

    lat, lon = parse_coordinates(coords)
    country_full = country_map.get(c_code, "")

    # Build normalized port+country string
    port_norm = normalize_port_name(f"{port_name_raw}, {country_full}")

    rec = {
        "locode": locode,
        "portCode": loc,
        "port": port_name_raw,
        "countryCode": c_code,
        "country": country_full,
        "lat": lat,
        "lon": lon,
        "port_norm": port_norm
    }
    records.append(rec)

# ---------------- Save ----------------
print(f"Writing {len(records)} records to {OUT_JSON}")
Path(OUT_JSON).write_text(json.dumps(records, indent=2, ensure_ascii=False))

if skipped:
    print(f"Writing {len(skipped)} skipped rows to {SKIP_JSON}")
    Path(SKIP_JSON).write_text(json.dumps(skipped, indent=2, ensure_ascii=False))

print("Done.")
