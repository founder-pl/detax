"""Commands Router - CQRS write side for projects"""
from typing import Optional
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

from services.events import append_event

logger = logging.getLogger(__name__)
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bielik:bielik_dev_2024@localhost:5432/bielik_knowledge")


class ProjectCreateCommand(BaseModel):
    name: str
    description: Optional[str] = None
    contact: Optional[str] = None


class ProjectUpdateCommand(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    contact: Optional[str] = None


class ProjectDeleteCommand(BaseModel):
    id: int


class ProjectAddFileCommand(BaseModel):
    project_id: int
    filename: str
    path: Optional[str] = None


class ProjectRemoveFileCommand(BaseModel):
    file_id: int


@router.post("/commands/projects/create")
async def create_project(cmd: ProjectCreateCommand):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO projects (name, description, contact)
                VALUES (%s, %s, %s)
                RETURNING id, name, description, contact
                """,
                (cmd.name, cmd.description, cmd.contact),
            )
            row = cur.fetchone()
            conn.commit()
        conn.close()

        append_event(
            aggregate_type="project",
            aggregate_id=str(row["id"]),
            event_type="ProjectCreated",
            payload={
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "contact": row["contact"],
            },
        )

        return row
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/commands/projects/update")
async def update_project(cmd: ProjectUpdateCommand):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE projects
                SET name = %s,
                    description = %s,
                    contact = %s,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, name, description, contact
                """,
                (cmd.name, cmd.description, cmd.contact, cmd.id),
            )
            row = cur.fetchone()
            conn.commit()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Projekt nie znaleziony")

        append_event(
            aggregate_type="project",
            aggregate_id=str(row["id"]),
            event_type="ProjectUpdated",
            payload={
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "contact": row["contact"],
            },
        )

        return row
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/commands/projects/delete")
async def delete_project(cmd: ProjectDeleteCommand):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute("DELETE FROM projects WHERE id = %s", (cmd.id,))
            deleted = cur.rowcount
            conn.commit()
        conn.close()

        if deleted == 0:
            raise HTTPException(status_code=404, detail="Projekt nie znaleziony")

        append_event(
            aggregate_type="project",
            aggregate_id=str(cmd.id),
            event_type="ProjectDeleted",
            payload={"id": cmd.id},
        )

        return {"message": "Projekt usunięty", "id": cmd.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/commands/projects/add-file")
async def add_project_file(cmd: ProjectAddFileCommand):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO project_files (project_id, filename, path)
                VALUES (%s, %s, %s)
                RETURNING id, project_id, filename, path
                """,
                (cmd.project_id, cmd.filename, cmd.path),
            )
            row = cur.fetchone()
            conn.commit()
        conn.close()

        append_event(
            aggregate_type="project",
            aggregate_id=str(cmd.project_id),
            event_type="ProjectFileAdded",
            payload={
                "fileId": row["id"],
                "projectId": row["project_id"],
                "filename": row["filename"],
                "path": row["path"],
            },
        )

        return row
    except Exception as e:
        logger.error(f"Error adding project file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/commands/projects/remove-file")
async def remove_project_file(cmd: ProjectRemoveFileCommand):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Pobierz project_id i filename przed usunięciem
            cur.execute(
                "SELECT project_id, filename, path FROM project_files WHERE id = %s",
                (cmd.file_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                raise HTTPException(status_code=404, detail="Plik projektu nie znaleziony")

            project_id = row["project_id"]
            filename = row["filename"]
            path = row["path"]

            cur.execute("DELETE FROM project_files WHERE id = %s", (cmd.file_id,))
            conn.commit()
        conn.close()

        append_event(
            aggregate_type="project",
            aggregate_id=str(project_id),
            event_type="ProjectFileRemoved",
            payload={
                "fileId": cmd.file_id,
                "projectId": project_id,
                "filename": filename,
                "path": path,
            },
        )

        return {"message": "Plik usunięty", "id": cmd.file_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing project file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
