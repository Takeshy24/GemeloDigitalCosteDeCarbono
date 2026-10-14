"""Publicación de la exportación estática Next.js junto a la API."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles


def mount_frontend(app: FastAPI, directory: Path | None):
    if directory is None:
        return
    directory = directory.resolve()
    if not (directory / "index.html").is_file():
        raise RuntimeError("FRONTEND_DIST_DIR no contiene la exportación estática de Next.js")
    # Se monta al final: /api/*, /docs y /openapi.json conservan sus rutas.
    app.mount("/", StaticFiles(directory=directory, html=True), name="frontend")
