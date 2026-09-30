import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/v1/email"  # Change to match your API base URL


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests (Retrieve Data) ###
def test_list_blacklist(api_context):
    """Test retrieving email blacklist"""
    response = api_context.get(f"{BASE_URL}/blacklist")
    assert response.status == 200


### 🟠 PATCH Requests (Update Data) ###
def test_unsubscribe_email(api_context):
    """Test unsubscribing an email"""
    token = "sampletoken123"
    email_id = 123
    response = api_context.patch(f"{BASE_URL}/unsubscribe/{token}/{email_id}")
    assert response.status == 200


### 🏁 Run the tests with: ###
# pytest test_email_api.py --disable-warnings
