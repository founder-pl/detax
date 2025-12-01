"""Context Router - hierarchical context: Contact -> Projects -> Files -> Channels"""
from typing import Optional, List, Dict, Any
import logging
import os

from fastapi import APIRouter, HTTPException, Query
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bielik:bielik_dev_2024@localhost:5432/bielik_knowledge")


MODULES = [
    {"id": "default", "name": "Ogólne"},
    {"id": "ksef", "name": "KSeF"},
    {"id": "b2b", "name": "B2B"},
    {"id": "zus", "name": "ZUS"},
    {"id": "vat", "name": "VAT"},
]


def _get_connection():
    return psycopg2.connect(DATABASE_URL)


def _get_project(project_id: int) -> Optional[Dict[str, Any]]:
    try:
        conn = _get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, name, description, contact FROM projects WHERE id = %s",
                (project_id,),
            )
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {e}")
        return None


def _get_project_file(file_id: int) -> Optional[Dict[str, Any]]:
    try:
        conn = _get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, project_id, filename, path FROM project_files WHERE id = %s",
                (file_id,),
            )
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error getting project file {file_id}: {e}")
        return None


def _recommend_channels(contact: Optional[str], project: Optional[Dict[str, Any]], project_file: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prosta heurystyka doboru kanałów na podstawie nazwy projektu/pliku."""
    text = " ".join(
        [
            contact or "",
            (project or {}).get("name", ""),
            (project or {}).get("description", ""),
            (project_file or {}).get("filename", ""),
            (project_file or {}).get("path", ""),
        ]
    ).lower()

    recommended_ids = set(["default"])

    if any(k in text for k in ["ksef", "e-fakt", "faktura"]):
        recommended_ids.add("ksef")
    if any(k in text for k in ["umowa", "b2b", "kontrakt", "sprzeda"]):
        recommended_ids.add("b2b")
    if any(k in text for k in ["zus", "składk", "ubezpiecze"]):
        recommended_ids.add("zus")
    if any(k in text for k in ["vat", "jpk", "oss"]):
        recommended_ids.add("vat")

    return [m for m in MODULES if m["id"] in recommended_ids]


@router.get("/context/channels")
async def get_context_channels(
    contact: Optional[str] = Query(default=None, description="Nazwa kontaktu / kontrahenta"),
    project_id: Optional[int] = Query(default=None, description="ID projektu"),
    file_id: Optional[int] = Query(default=None, description="ID pliku projektu"),
):
    """Zwraca rekomendowane kanały (moduły) w kontekście Kontakt -> Projekt -> Plik.

    Kanały są wyliczane heurystycznie na podstawie nazw i opisów projektu/plików.
    """
    try:
        project = _get_project(project_id) if project_id is not None else None
        project_file = _get_project_file(file_id) if file_id is not None else None

        channels = _recommend_channels(contact, project, project_file)

        return {
            "contact": contact,
            "project": project,
            "file": project_file,
            "channels": channels,
        }
    except Exception as e:
        logger.error(f"Error getting context channels: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się wyliczyć kanałów kontekstowych")
