import pytest
from playwright.sync_api import sync_playwright

from services.account.data.account import mock_accounts

BASE_URL = "http://account.local/v1/account"  # Change to match your API base URL


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


@pytest.fixture(scope="session")
def created_account(api_context):
    """Create an account once per session and store the ID"""
    data = mock_accounts[0]
    response = api_context.post(f"{BASE_URL}", data=data)
    json = response.json()

    assert response.status in [200, 201], f"Unexpected status: {response.status} - {response.text()}"

    return json["data"]["id"]  # Return the account ID


def test_get_base(api_context):
    """Test GET requests for base endpoint"""
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


### 🟢 GET Requests (Retrieve Data) ###
@pytest.mark.parametrize(
    "endpoint",
    [
        "list",
        "type",
        "subscription",
        "website",
        "membership",
        "offerings",
        "supply_chain",
        "all",
        "organisation/type",
        "customer_health_score",
    ],
)
def test_get_endpoints(api_context, endpoint):
    """Test GET requests for multiple endpoints"""
    response = api_context.get(f"{BASE_URL}/{endpoint}")
    assert response.status == 200


@pytest.mark.parametrize("id", [1])
@pytest.mark.parametrize(
    "endpoint",
    [
        "{id}",
        "{id}/membership",
        "{id}/region",
        "{id}/trades",
        "{id}/projecttypes",
        "{id}/engagement",
        "{id}/organisation",
        "region/{id}",
    ],
)
def test_get_by_id(api_context, id, endpoint):
    """Test GET requests that require an ID"""
    response = api_context.get(f"{BASE_URL}/{endpoint.format(id=id)}")
    assert response.status == 200


def test_get_search(api_context):
    """Test requests for search endpoint"""
    """ToDo: set fixture for search query """
    response = api_context.get(f"{BASE_URL}/search?query=test")
    assert response.status == 200


### 🔵 POST Requests (Create Account) ###
def test_create_account(created_account):
    """Test that account creation works and returns a valid ID"""
    assert created_account is not None
    print(f"Created Account ID: {created_account}")


@pytest.mark.parametrize("endpoint", ["{id}/supply_chain", "{id}/supply_chain/added_to", "{id}/supply_chain_v2"])
def test_supply_chain(api_context, created_account, endpoint):
    """Test GET requests using the created account ID"""
    response = api_context.get(f"{BASE_URL}/{endpoint.format(id=created_account)}")
    assert response.status == 200


@pytest.mark.parametrize("sid", [10, 20])
def test_get_subcontractor(api_context, created_account, sid):
    """Test fetching subcontractor data using created account"""
    response = api_context.get(f"{BASE_URL}/{created_account}/supply_chain/subcontractor/{sid}")
    assert response.status == 200


def test_create_organisation(api_context, created_account):
    """Test POST requests"""
    id = 1  # Sample ID
    payload = {
        "account_id": created_account,
        "user_firstname": "John",
        "user_lastname": "Doe",
        "user_email": "john.doe@example.com",
        "user_phone": "+1234567890",
        "type_id": 1,
        "custom_type_label": "Custom Label",
    }

    response = api_context.post(f"{BASE_URL}/1/organisation".format(id=id), data=payload)

    if response.status == 500:
        print(response.text())
    assert response.status == 201 or response.status == 200


### 🟠 PATCH Requests (Update Data) ###
@pytest.mark.parametrize(
    "endpoint, data",
    [
        ("{id}", {"name": "Updated Name"}),
        ("{id}/membership", {"subscription_id": 1}),
        ("{id}/meta", {"meta": "updated"}),
    ],
)
def test_patch_endpoints(api_context, endpoint, data):
    """Test PATCH requests"""
    id, child = 1, 10
    response = api_context.patch(f"{BASE_URL}/{endpoint.format(id=id, child=child)}", data=data)
    assert response.status == 200 or response.status == 203


### 🟠 PATCH Requests (Update Data) ###
@pytest.mark.parametrize("endpoint, data", [("customer_health_score", [1])])
def test_customer_health_score(api_context, endpoint, data):
    """Test PATCH requests"""
    id = 1
    response = api_context.patch(f"{BASE_URL}/{endpoint.format(id=id)}", data=data)
    assert response.status == 200 or response.status == 203
