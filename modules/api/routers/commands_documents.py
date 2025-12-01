"""Commands Router - CQRS write side for documents"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging

from . import documents as documents_router
from .documents import Document, DocumentCreate, DocumentUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentCreateCommand(BaseModel):
    """Command: utworzenie dokumentu."""
    title: str
    source: Optional[str] = None
    category: str
    content: str


class DocumentUpdateCommand(BaseModel):
    """Command: aktualizacja dokumentu."""
    id: int
    title: str
    source: Optional[str] = None
    category: str
    content: str


class DocumentDeleteCommand(BaseModel):
    """Command: usunięcie dokumentu."""
    id: int


@router.post("/commands/documents/create", response_model=Document)
async def create_document_command(cmd: DocumentCreateCommand):
    logger.info("CQRS command: CreateDocument - %s", cmd.title)
    doc = DocumentCreate(**cmd.dict())
    return await documents_router.create_document(doc)


@router.post("/commands/documents/update", response_model=Document)
async def update_document_command(cmd: DocumentUpdateCommand):
    logger.info("CQRS command: UpdateDocument id=%s", cmd.id)
    update = DocumentUpdate(
        title=cmd.title,
        source=cmd.source,
        category=cmd.category,
        content=cmd.content,
    )
    return await documents_router.update_document(cmd.id, update)


@router.post("/commands/documents/delete")
async def delete_document_command(cmd: DocumentDeleteCommand):
    logger.info("CQRS command: DeleteDocument id=%s", cmd.id)
    return await documents_router.delete_document(cmd.id)
