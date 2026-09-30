import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://account.local/v1/feature"  # Adjust to match your API base URL


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests (Retrieve Data) ###


def test_fetch_features(api_context):
    """Test retrieving all features"""
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


def test_fetch_accounts_with_features(api_context):
    """Test retrieving accounts with features"""
    response = api_context.get(f"{BASE_URL}/accounts")
    assert response.status == 200


def test_fetch_specific_account_features(api_context):
    """Test retrieving features of a specific account"""
    account_id = 1  # Replace with a valid ID
    response = api_context.get(f"{BASE_URL}/accounts/{account_id}")
    assert response.status == 200 or response.status == 404  # Ensure valid handling


def test_fetch_account_envelopes(api_context):
    """Test retrieving envelopes for a specific account"""
    account_id = 1  # Replace with a valid ID
    response = api_context.get(f"{BASE_URL}/envelope/{account_id}")
    assert response.status == 200 or response.status == 404


### 🟡 PATCH Requests (Update Data) ###


def test_update_accounts_features(api_context):
    """Test updating accounts' features"""
    payload = {"account_id": 1, "feature_id": 2, "enabled": True}
    response = api_context.patch(f"{BASE_URL}/accounts", data=payload)
    assert response.status in [200]


def test_update_envelopes(api_context):
    """Test updating envelopes for an account"""
    account_id = 1  # Replace with a valid ID
    payload = {"status": "updated"}
    response = api_context.patch(f"{BASE_URL}/envelope/{account_id}", data=payload)
    assert response.status in [200]


def test_update_accounts_features_mapping(api_context):
    """Test updating account feature mapping"""
    feature_id = 1  # Replace with a valid ID
    mapping_id = 2  # Replace with a valid ID
    payload = {}
    response = api_context.patch(f"{BASE_URL}/{feature_id}/account_mapping/{mapping_id}", data=payload)
    assert response.status in [200]


### 🔴 DELETE Requests (Remove Data) ###
def test_delete_accounts_features(api_context):
    """Test deleting features from an account"""
    account_id = 1  # Replace with a valid ID
    response = api_context.delete(f"{BASE_URL}/accounts/{account_id}")
    assert response.status in [200]
