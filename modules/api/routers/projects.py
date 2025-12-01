"""Projects Router - CQRS read side for projects and files"""
from typing import List, Optional
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bielik:bielik_dev_2024@localhost:5432/bielik_knowledge")


class Project(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    contact: Optional[str] = None


class ProjectFile(BaseModel):
    id: int
    project_id: int
    filename: str
    path: Optional[str] = None


@router.get("/projects", response_model=List[Project])
async def list_projects(contact: Optional[str] = None, limit: int = 50):
    """Lista projektów (opcjonalnie filtrowana po kontakcie)."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if contact:
                cur.execute(
                    "SELECT id, name, description, contact FROM projects WHERE contact = %s ORDER BY id DESC LIMIT %s",
                    (contact, limit),
                )
            else:
                cur.execute(
                    "SELECT id, name, description, contact FROM projects ORDER BY id DESC LIMIT %s",
                    (limit,),
                )
            rows = cur.fetchall()
        conn.close()
        return [Project(**r) for r in rows]
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: int):
    """Szczegóły pojedynczego projektu."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, name, description, contact FROM projects WHERE id = %s",
                (project_id,),
            )
            row = cur.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Projekt nie znaleziony")
        return Project(**row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/files", response_model=List[ProjectFile])
async def get_project_files(project_id: int):
    """Lista plików danego projektu."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, project_id, filename, path FROM project_files WHERE project_id = %s ORDER BY id",
                (project_id,),
            )
            rows = cur.fetchall()
        conn.close()
        return [ProjectFile(**r) for r in rows]
    except Exception as e:
        logger.error(f"Error listing project files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
