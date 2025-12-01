import os
import logging
from typing import Optional, Dict, Any

import psycopg2
from psycopg2.extras import Json, RealDictCursor

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bielik:bielik_dev_2024@localhost:5432/bielik_knowledge")


def append_event(
    aggregate_type: str,
    aggregate_id: str,
    event_type: str,
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO domain_events (aggregate_type, aggregate_id, event_type, payload, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    aggregate_type,
                    aggregate_id,
                    event_type,
                    Json(payload),
                    Json(metadata or {}),
                ),
            )
            conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error appending event {event_type} for {aggregate_type} {aggregate_id}: {e}")


def get_events(aggregate_type: str, aggregate_id: str, limit: int = 50):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, aggregate_type, aggregate_id, event_type, payload, metadata, created_at
                FROM domain_events
                WHERE aggregate_type = %s AND aggregate_id = %s
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (aggregate_type, aggregate_id, limit),
            )
            rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error getting events for {aggregate_type} {aggregate_id}: {e}")
        return []
