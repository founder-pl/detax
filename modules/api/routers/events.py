"""Events Router - read history from event store"""
from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from services.events import get_events

logger = logging.getLogger(__name__)
router = APIRouter()


class DomainEvent(BaseModel):
    id: str
    aggregate_type: str
    aggregate_id: str
    event_type: str
    payload: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: datetime


@router.get("/events/documents/{document_id}", response_model=List[DomainEvent])
async def get_document_events(document_id: int, limit: int = 50):
    try:
        events = get_events("document", str(document_id), limit=limit)
        return events
    except Exception as e:
        logger.error(f"Error getting events for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się pobrać historii dokumentu")


@router.get("/events/projects/{project_id}", response_model=List[DomainEvent])
async def get_project_events(project_id: int, limit: int = 50):
    try:
        events = get_events("project", str(project_id), limit=limit)
        return events
    except Exception as e:
        logger.error(f"Error getting events for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się pobrać historii projektu")
