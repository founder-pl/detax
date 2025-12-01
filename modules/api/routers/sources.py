"""
Data Sources Router - API dla źródeł danych prawnych
=====================================================
Endpointy do zarządzania źródłami danych i weryfikacji podmiotów.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Import serwisu (lazy import aby uniknąć circular imports)
def get_service():
    from services.data_sources import data_sources_service
    return data_sources_service


# ============================================
# MODELE
# ============================================

class DataSourceResponse(BaseModel):
    """Odpowiedź z danymi źródła."""
    id: str
    name: str
    type: str
    base_url: str
    description: str
    active: bool


class LegalDocumentResponse(BaseModel):
    """Odpowiedź z dokumentem prawnym."""
    id: str
    title: str
    category: str
    url: str


class VerificationRequest(BaseModel):
    """Żądanie weryfikacji podmiotu."""
    identifier: str
    type: str  # nip, krs, vat_eu


class VerificationResponse(BaseModel):
    """Odpowiedź weryfikacji podmiotu."""
    valid: bool
    identifier: str
    type: str
    data: Optional[dict] = None
    error: Optional[str] = None


# ============================================
# ENDPOINTY
# ============================================

@router.get("/sources", response_model=List[DataSourceResponse])
async def list_sources(
    source_type: Optional[str] = Query(
        default=None,
        description="Filtruj po typie: official, commercial"
    )
):
    """Zwraca listę dostępnych źródeł danych prawnych.
    
    Źródła urzędowe:
    - ISAP (Sejm RP)
    - Dziennik Ustaw
    - KSeF (MF)
    - e-Urząd Skarbowy
    - eZUS
    - CEIDG
    - KRS
    - GUS
    - VIES (UE)
    
    Źródła komercyjne:
    - LEX (Wolters Kluwer)
    - Legalis (C.H. Beck)
    """
    try:
        service = get_service()
        from services.data_sources import SourceType
        
        stype = None
        if source_type:
            try:
                stype = SourceType(source_type)
            except ValueError:
                raise HTTPException(400, f"Invalid source_type: {source_type}")
        
        sources = service.list_sources(stype)
        return [
            DataSourceResponse(
                id=s.id,
                name=s.name,
                type=s.type.value,
                base_url=s.base_url,
                description=s.description,
                active=s.active
            )
            for s in sources
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing sources: {e}")
        raise HTTPException(500, "Nie udało się pobrać listy źródeł")


@router.get("/sources/{source_id}", response_model=DataSourceResponse)
async def get_source(source_id: str):
    """Zwraca szczegóły źródła danych."""
    try:
        service = get_service()
        source = service.get_source(source_id)
        if not source:
            raise HTTPException(404, f"Źródło '{source_id}' nie istnieje")
        
        return DataSourceResponse(
            id=source.id,
            name=source.name,
            type=source.type.value,
            base_url=source.base_url,
            description=source.description,
            active=source.active
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting source {source_id}: {e}")
        raise HTTPException(500, "Nie udało się pobrać źródła")


@router.get("/sources/category/{category}", response_model=List[DataSourceResponse])
async def get_sources_for_category(category: str):
    """Zwraca źródła danych dla kategorii (ksef, vat, zus, b2b)."""
    try:
        service = get_service()
        sources_data = service.get_document_sources_for_category(category)
        
        return [
            DataSourceResponse(
                id=s["id"],
                name=s["name"],
                type=s["type"].value if hasattr(s["type"], 'value') else str(s["type"]),
                base_url=s["base_url"],
                description=s["description"],
                active=s["active"]
            )
            for s in sources_data
        ]
    except Exception as e:
        logger.error(f"Error getting sources for category {category}: {e}")
        raise HTTPException(500, "Nie udało się pobrać źródeł dla kategorii")


@router.get("/legal-documents", response_model=List[LegalDocumentResponse])
async def list_key_legal_documents():
    """Zwraca listę kluczowych dokumentów prawnych.
    
    Dokumenty z ISAP:
    - Ustawa o KSeF
    - Ustawa VAT
    - Kodeks pracy
    - Ustawa o ZUS
    - Ustawa o PIP
    - Ordynacja podatkowa
    """
    try:
        service = get_service()
        docs = service.list_key_legal_documents()
        
        return [
            LegalDocumentResponse(
                id=d["id"],
                title=d["title"],
                category=d["category"],
                url=d["url"]
            )
            for d in docs
        ]
    except Exception as e:
        logger.error(f"Error listing legal documents: {e}")
        raise HTTPException(500, "Nie udało się pobrać listy dokumentów")


@router.post("/verify", response_model=VerificationResponse)
async def verify_entity(request: VerificationRequest):
    """Weryfikuje podmiot w zewnętrznych źródłach.
    
    Obsługiwane typy:
    - nip: Weryfikacja w CEIDG (wymaga CEIDG_API_KEY)
    - krs: Weryfikacja w KRS
    - vat_eu: Weryfikacja VAT UE w VIES (format: PL1234567890)
    """
    try:
        service = get_service()
        
        if request.type == "nip":
            data = service.verify_company_nip(request.identifier)
            if data:
                return VerificationResponse(
                    valid=True,
                    identifier=request.identifier,
                    type=request.type,
                    data=data
                )
            return VerificationResponse(
                valid=False,
                identifier=request.identifier,
                type=request.type,
                error="NIP nie znaleziony lub brak klucza API"
            )
        
        elif request.type == "krs":
            data = service.verify_company_krs(request.identifier)
            if data:
                return VerificationResponse(
                    valid=True,
                    identifier=request.identifier,
                    type=request.type,
                    data=data
                )
            return VerificationResponse(
                valid=False,
                identifier=request.identifier,
                type=request.type,
                error="KRS nie znaleziony"
            )
        
        elif request.type == "vat_eu":
            # Format: PL1234567890
            if len(request.identifier) < 3:
                raise HTTPException(400, "Nieprawidłowy format VAT UE")
            
            country_code = request.identifier[:2]
            vat_number = request.identifier[2:]
            
            data = service.verify_vat_eu(country_code, vat_number)
            if data:
                return VerificationResponse(
                    valid=data.get("valid", False),
                    identifier=request.identifier,
                    type=request.type,
                    data=data
                )
            return VerificationResponse(
                valid=False,
                identifier=request.identifier,
                type=request.type,
                error="Błąd weryfikacji VAT UE"
            )
        
        else:
            raise HTTPException(400, f"Nieobsługiwany typ weryfikacji: {request.type}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying {request.type} {request.identifier}: {e}")
        raise HTTPException(500, "Błąd weryfikacji")


@router.get("/verify/vat/{vat_number}")
async def verify_vat_quick(vat_number: str):
    """Szybka weryfikacja VAT UE.
    
    Format: PL1234567890
    """
    try:
        if len(vat_number) < 3:
            raise HTTPException(400, "Nieprawidłowy format VAT")
        
        service = get_service()
        country_code = vat_number[:2].upper()
        number = vat_number[2:]
        
        data = service.verify_vat_eu(country_code, number)
        
        if data:
            return {
                "valid": data.get("valid", False),
                "country_code": country_code,
                "vat_number": number,
                "name": data.get("name"),
                "address": data.get("address")
            }
        
        return {
            "valid": False,
            "country_code": country_code,
            "vat_number": number,
            "error": "Nie można zweryfikować"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying VAT {vat_number}: {e}")
        raise HTTPException(500, "Błąd weryfikacji VAT")
