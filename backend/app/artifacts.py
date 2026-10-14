"""Rutas de ML independientes del directorio desde el que se inicia la API."""
from pathlib import Path
import os
import shutil

SEED_ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "ml_artifacts"
ARTIFACTS_DIR = Path(os.environ.get("ML_ARTIFACTS_DIR", str(SEED_ARTIFACTS_DIR))).resolve()


def initialize_artifacts(destination: Path = ARTIFACTS_DIR, source: Path = SEED_ARTIFACTS_DIR):
    """Inicializa el disco persistente sin reemplazar modelos ya entrenados."""
    destination.mkdir(parents=True, exist_ok=True)
    if destination.resolve() == source.resolve():
        return
    for seed in source.rglob("*"):
        target = destination / seed.relative_to(source)
        if seed.is_file() and not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(seed, target)
