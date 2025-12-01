"""
Data Sources Service - Integracje z źródłami danych prawnych
=============================================================

Źródła urzędowe (oficjalne):
- ISAP (Internetowy System Aktów Prawnych Sejmu)
- Dziennik Ustaw / Monitor Polski
- MF (Ministerstwo Finansów) - API KSeF, e-Urząd Skarbowy
- ZUS - eZUS API
- CEIDG - Centralna Ewidencja Działalności Gospodarczej
- KRS - Krajowy Rejestr Sądowy
- GUS - Główny Urząd Statystyczny

Źródła komercyjne:
- LEX / Wolters Kluwer
- Legalis / C.H. Beck
- InfoVeriti / Bisnode
- VIES (VAT Information Exchange System)
"""
import os
import logging
import requests
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, date
from enum import Enum

logger = logging.getLogger(__name__)


class SourceType(Enum):
    """Typ źródła danych."""
    OFFICIAL = "official"      # Źródła urzędowe
    COMMERCIAL = "commercial"  # Źródła komercyjne
    INTERNAL = "internal"      # Wewnętrzne dokumenty


@dataclass
class DataSource:
    """Definicja źródła danych."""
    id: str
    name: str
    type: SourceType
    base_url: str
    api_key_env: Optional[str] = None
    description: str = ""
    active: bool = True


@dataclass
class LegalDocument:
    """Dokument prawny ze źródła."""
    source_id: str
    external_id: str
    title: str
    content: str
    category: str
    url: Optional[str] = None
    publication_date: Optional[date] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================
# DEFINICJE ŹRÓDEŁ
# ============================================

SOURCES: Dict[str, DataSource] = {
    # Źródła urzędowe
    "isap": DataSource(
        id="isap",
        name="ISAP - Internetowy System Aktów Prawnych",
        type=SourceType.OFFICIAL,
        base_url="https://isap.sejm.gov.pl",
        description="Oficjalne akty prawne publikowane przez Sejm RP"
    ),
    "dziennik_ustaw": DataSource(
        id="dziennik_ustaw",
        name="Dziennik Ustaw",
        type=SourceType.OFFICIAL,
        base_url="https://dziennikustaw.gov.pl",
        description="Oficjalny dziennik publikacyjny aktów prawnych"
    ),
    "mf_ksef": DataSource(
        id="mf_ksef",
        name="KSeF - Krajowy System e-Faktur",
        type=SourceType.OFFICIAL,
        base_url="https://ksef.mf.gov.pl",
        api_key_env="KSEF_API_KEY",
        description="API Krajowego Systemu e-Faktur"
    ),
    "mf_eurząd": DataSource(
        id="mf_eurząd",
        name="e-Urząd Skarbowy",
        type=SourceType.OFFICIAL,
        base_url="https://www.podatki.gov.pl",
        description="Portal e-Urzędu Skarbowego"
    ),
    "zus_ezus": DataSource(
        id="zus_ezus",
        name="eZUS - Platforma Usług Elektronicznych",
        type=SourceType.OFFICIAL,
        base_url="https://www.zus.pl",
        api_key_env="ZUS_API_KEY",
        description="Elektroniczne usługi ZUS"
    ),
    "ceidg": DataSource(
        id="ceidg",
        name="CEIDG - Centralna Ewidencja Działalności",
        type=SourceType.OFFICIAL,
        base_url="https://dane.biznes.gov.pl/api/ceidg/v2",
        api_key_env="CEIDG_API_KEY",
        description="API CEIDG do weryfikacji działalności gospodarczych"
    ),
    "krs": DataSource(
        id="krs",
        name="KRS - Krajowy Rejestr Sądowy",
        type=SourceType.OFFICIAL,
        base_url="https://api-krs.ms.gov.pl",
        description="API KRS do weryfikacji spółek"
    ),
    "gus": DataSource(
        id="gus",
        name="GUS - API Banku Danych Lokalnych",
        type=SourceType.OFFICIAL,
        base_url="https://bdl.stat.gov.pl/api/v1",
        api_key_env="GUS_API_KEY",
        description="Dane statystyczne GUS"
    ),
    "vies": DataSource(
        id="vies",
        name="VIES - VAT Information Exchange System",
        type=SourceType.OFFICIAL,
        base_url="https://ec.europa.eu/taxation_customs/vies/rest-api",
        description="Weryfikacja numeru VAT UE"
    ),
    
    # Źródła komercyjne
    "lex": DataSource(
        id="lex",
        name="LEX - Wolters Kluwer",
        type=SourceType.COMMERCIAL,
        base_url="https://sip.lex.pl/api",
        api_key_env="LEX_API_KEY",
        description="Komercyjna baza aktów prawnych i komentarzy",
        active=False  # Wymaga licencji
    ),
    "legalis": DataSource(
        id="legalis",
        name="Legalis - C.H. Beck",
        type=SourceType.COMMERCIAL,
        base_url="https://legalis.pl/api",
        api_key_env="LEGALIS_API_KEY",
        description="Komercyjna baza prawna C.H. Beck",
        active=False  # Wymaga licencji
    ),
}


# ============================================
# KLIENCI API
# ============================================

class ISAPClient:
    """Klient ISAP - pobieranie aktów prawnych."""
    
    BASE_URL = "https://isap.sejm.gov.pl"
    
    # Kluczowe akty prawne dla systemu
    KEY_DOCUMENTS = {
        "ksef_ustawa": {
            "id": "WDU20220001463",
            "title": "Ustawa o Krajowym Systemie e-Faktur",
            "category": "ksef"
        },
        "ustawa_vat": {
            "id": "WDU20040540535",
            "title": "Ustawa o podatku od towarów i usług (VAT)",
            "category": "vat"
        },
        "kodeks_pracy": {
            "id": "WDU19740240141",
            "title": "Kodeks pracy",
            "category": "b2b"
        },
        "ustawa_zus": {
            "id": "WDU19981370887",
            "title": "Ustawa o systemie ubezpieczeń społecznych",
            "category": "zus"
        },
        "ustawa_pip": {
            "id": "WDU20070890589",
            "title": "Ustawa o Państwowej Inspekcji Pracy",
            "category": "b2b"
        },
        "ordynacja_podatkowa": {
            "id": "WDU19971370926",
            "title": "Ordynacja podatkowa",
            "category": "vat"
        }
    }
    
    def get_document_url(self, isap_id: str) -> str:
        """Zwraca URL do dokumentu ISAP."""
        return f"{self.BASE_URL}/isap.nsf/DocDetails.xsp?id={isap_id}"
    
    def get_pdf_url(self, isap_id: str) -> str:
        """Zwraca URL do PDF dokumentu."""
        return f"{self.BASE_URL}/isap.nsf/download.xsp/{isap_id}/T/D{isap_id[3:]}L.pdf"
    
    def fetch_document_metadata(self, isap_id: str) -> Optional[Dict[str, Any]]:
        """Pobiera metadane dokumentu z ISAP."""
        try:
            url = f"{self.BASE_URL}/isap.nsf/DocDetails.xsp?id={isap_id}"
            resp = requests.get(url, timeout=30)
            if resp.status_code == 200:
                # TODO: Parse HTML to extract metadata
                return {
                    "id": isap_id,
                    "url": url,
                    "pdf_url": self.get_pdf_url(isap_id)
                }
        except Exception as e:
            logger.error(f"Error fetching ISAP document {isap_id}: {e}")
        return None
    
    def list_key_documents(self) -> List[Dict[str, Any]]:
        """Zwraca listę kluczowych dokumentów."""
        return [
            {**doc, "url": self.get_document_url(doc["id"])}
            for doc in self.KEY_DOCUMENTS.values()
        ]


class CEIDGClient:
    """Klient CEIDG - weryfikacja działalności gospodarczych."""
    
    def __init__(self):
        self.api_key = os.getenv("CEIDG_API_KEY")
        self.base_url = "https://dane.biznes.gov.pl/api/ceidg/v2"
    
    def verify_nip(self, nip: str) -> Optional[Dict[str, Any]]:
        """Weryfikuje NIP w CEIDG."""
        if not self.api_key:
            logger.warning("CEIDG_API_KEY not configured")
            return None
        
        try:
            resp = requests.get(
                f"{self.base_url}/firmy",
                params={"nip": nip},
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error(f"Error verifying NIP {nip}: {e}")
        return None


class VIESClient:
    """Klient VIES - weryfikacja VAT UE."""
    
    BASE_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number"
    
    def verify_vat(self, country_code: str, vat_number: str) -> Optional[Dict[str, Any]]:
        """Weryfikuje numer VAT w systemie VIES."""
        try:
            resp = requests.post(
                self.BASE_URL,
                json={
                    "countryCode": country_code.upper(),
                    "vatNumber": vat_number
                },
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error(f"Error verifying VAT {country_code}{vat_number}: {e}")
        return None


class KRSClient:
    """Klient KRS - dane spółek."""
    
    BASE_URL = "https://api-krs.ms.gov.pl/api/krs/OdsijKrs"
    
    def search_company(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Wyszukuje spółkę w KRS."""
        try:
            resp = requests.get(
                self.BASE_URL,
                params={"rejestr": "P", "nazwa": query, "maxWynikow": 10},
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json().get("odpis", [])
        except Exception as e:
            logger.error(f"Error searching KRS for '{query}': {e}")
        return None
    
    def get_company_by_krs(self, krs_number: str) -> Optional[Dict[str, Any]]:
        """Pobiera dane spółki po numerze KRS."""
        try:
            resp = requests.get(
                f"https://api-krs.ms.gov.pl/api/krs/OdpisPelny/{krs_number}",
                params={"rejestr": "P", "format": "json"},
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error(f"Error fetching KRS {krs_number}: {e}")
        return None


# ============================================
# GŁÓWNY SERWIS
# ============================================

class DataSourcesService:
    """Główny serwis zarządzający źródłami danych."""
    
    def __init__(self):
        self.isap = ISAPClient()
        self.ceidg = CEIDGClient()
        self.vies = VIESClient()
        self.krs = KRSClient()
    
    def list_sources(self, source_type: Optional[SourceType] = None) -> List[DataSource]:
        """Zwraca listę dostępnych źródeł."""
        sources = list(SOURCES.values())
        if source_type:
            sources = [s for s in sources if s.type == source_type]
        return sources
    
    def get_source(self, source_id: str) -> Optional[DataSource]:
        """Zwraca źródło po ID."""
        return SOURCES.get(source_id)
    
    def list_key_legal_documents(self) -> List[Dict[str, Any]]:
        """Zwraca listę kluczowych dokumentów prawnych."""
        return self.isap.list_key_documents()
    
    def verify_company_nip(self, nip: str) -> Optional[Dict[str, Any]]:
        """Weryfikuje firmę po NIP w CEIDG."""
        return self.ceidg.verify_nip(nip)
    
    def verify_company_krs(self, krs: str) -> Optional[Dict[str, Any]]:
        """Pobiera dane spółki z KRS."""
        return self.krs.get_company_by_krs(krs)
    
    def verify_vat_eu(self, country_code: str, vat_number: str) -> Optional[Dict[str, Any]]:
        """Weryfikuje numer VAT UE w VIES."""
        return self.vies.verify_vat(country_code, vat_number)
    
    def get_document_sources_for_category(self, category: str) -> List[Dict[str, Any]]:
        """Zwraca źródła dokumentów dla kategorii."""
        category_map = {
            "ksef": ["mf_ksef", "isap", "dziennik_ustaw"],
            "vat": ["mf_eurząd", "isap", "vies"],
            "zus": ["zus_ezus", "isap"],
            "b2b": ["isap", "ceidg", "krs"],
            "default": ["isap", "dziennik_ustaw"]
        }
        
        source_ids = category_map.get(category, category_map["default"])
        return [SOURCES[sid].__dict__ for sid in source_ids if sid in SOURCES]


# ============================================
# SINGLETON INSTANCE
# ============================================

data_sources_service = DataSourcesService()
