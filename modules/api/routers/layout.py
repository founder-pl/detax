import logging
import os
import json
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bielik:bielik_dev_2024@localhost:5432/bielik_knowledge")


class ModulePosition(BaseModel):
    id: str
    column: str
    order: int


class DashboardLayout(BaseModel):
    modules: List[ModulePosition]


DEFAULT_LAYOUT = {
    "modules": [
        {"id": "topics", "column": "left", "order": 0},
        {"id": "contacts", "column": "left", "order": 1},
        {"id": "channels", "column": "left", "order": 2},
        {"id": "chat", "column": "left", "order": 3},
        {"id": "quick", "column": "left", "order": 4},
        {"id": "projects", "column": "right", "order": 0},
        {"id": "files", "column": "right", "order": 1},
    ]
}


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS dashboard_layouts (
                id SERIAL PRIMARY KEY,
                profile VARCHAR(50) UNIQUE NOT NULL,
                layout_json TEXT NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.commit()


@router.get("/layout")
async def get_layout():
    try:
        conn = get_connection()
        ensure_table(conn)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT layout_json FROM dashboard_layouts WHERE profile = %s", ("default",))
            row = cur.fetchone()
        conn.close()

        if row and row.get("layout_json"):
            try:
                data = json.loads(row["layout_json"])
                return data
            except Exception as exc:
                logger.error(f"Failed to parse saved layout: {exc}")

        return DEFAULT_LAYOUT

    except Exception as e:
        logger.error(f"Error getting layout: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się pobrać układu dashboardu")


@router.post("/layout")
async def save_layout(layout: DashboardLayout):
    try:
        conn = get_connection()
        ensure_table(conn)
        payload = json.dumps(layout.dict())

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO dashboard_layouts (profile, layout_json)
                VALUES (%s, %s)
                ON CONFLICT (profile) DO UPDATE
                SET layout_json = EXCLUDED.layout_json,
                    updated_at = NOW()
                """,
                ("default", payload),
            )
            conn.commit()
        conn.close()

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Error saving layout: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się zapisać układu dashboardu")
