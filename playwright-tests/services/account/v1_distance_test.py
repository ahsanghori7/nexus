import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://account.local/v1/distance"  # Change to match your API base URL


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests (Retrieve Data) ###
def test_list_distances(api_context):
    """Test retrieving all distances"""
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


### 🔵 POST Requests (Create Data) ###
def test_add_distances(api_context):
    """Test adding distances"""
    data = [{"origin": "London", "destination": "Los Angeles", "distance": {"text": "50.2 miles", "value": "80834"}}]
    response = api_context.post(f"{BASE_URL}", data=data)
    assert response.status == 203
