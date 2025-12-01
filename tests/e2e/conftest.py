"""
E2E Tests Configuration
"""
import pytest
import os

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8005/api/v1")

@pytest.fixture
def api_base():
    """Returns API base URL."""
    return API_BASE_URL

@pytest.fixture
def headers():
    """Returns default headers."""
    return {"Content-Type": "application/json"}
