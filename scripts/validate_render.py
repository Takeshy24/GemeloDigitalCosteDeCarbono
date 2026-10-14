"""Valida render.yaml contra el esquema oficial; no crea recursos."""
import json
from pathlib import Path
from urllib.request import urlopen

import jsonschema
import yaml

root = Path(__file__).resolve().parent.parent
with urlopen("https://render.com/schema/render.yaml.json", timeout=30) as response:
    schema = json.load(response)
blueprint = yaml.safe_load((root / "render.yaml").read_text(encoding="utf-8"))
jsonschema.validate(blueprint, schema)
print("render.yaml: válido según el esquema oficial de Render")
