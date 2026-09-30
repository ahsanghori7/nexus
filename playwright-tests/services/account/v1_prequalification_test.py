import os

import pytest
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("ACCOUNT_API_URL") + "prequalification"  # Change to match your API base URL


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests (Retrieve Data) ###
@pytest.mark.parametrize("endpoint", ["sections", "section_list"])
def test_get_endpoints(api_context, endpoint):
    """Test GET requests for multiple endpoints"""
    response = api_context.get(f"{BASE_URL}/{endpoint}")
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2])
@pytest.mark.parametrize("endpoint", ["{id}/sections"])
def test_get_by_id(api_context, id, endpoint):
    """Test GET requests that require an ID"""
    response = api_context.get(f"{BASE_URL}/{endpoint.format(id=id)}")
    assert response.status == 200


### 🔵 POST Requests (Create Data) ###
@pytest.mark.parametrize("endpoint, data", [("{id}/sections", {"section": "New Section"})])
def test_post_endpoints(api_context, endpoint, data):
    """Test POST requests"""
    id = 1  # Sample ID
    response = api_context.post(f"{BASE_URL}/{endpoint.format(id=id)}", data=data)
    assert response.status == 200


def test_create_and_update_organisation(api_context):
    """Test POST requests"""
    id = 1  # Sample ID
    base = os.getenv("ACCOUNT_API_URL")
    payload = {
        "account_id": id,
        "user_firstname": "John",
        "user_lastname": "Doe",
        "user_email": "john.doe@example.com",
        "user_phone": "+1234567890",
        "type_id": 1,
        "custom_type_label": "Custom Label",
    }

    response = api_context.post(f"{base}/1/organisation".format(id=id), data=payload)
    data = [
        {
            "account_id": id,
            "title": "Updated Org",
            "firstname": "John",
            "lastname": "Doe",
            "email": "john.doe@example.com",
        }
    ]
    response = api_context.patch(f"{BASE_URL}/1/organisation", data=data)

    assert response.status == 203


### 🟠 PATCH Requests (Update Data) ###
@pytest.mark.parametrize(
    "endpoint, data",
    [
        ("{id}/company_information", {"company": "Updated Company"}),
        ("{id}/turnover", {"turnover": 100000}),
        ("{id}/references", {"references": "Updated References"}),
        ("{id}/statuses", {"status": "Updated Status"}),
        ("{id}/sections", {"section_status": "Updated Section"}),
        ("{id}/section", {"section": "Updated Section Name"}),
    ],
)
def test_patch_endpoints(api_context, endpoint, data):
    """Test PATCH requests"""
    id = 1
    response = api_context.patch(f"{BASE_URL}/{endpoint.format(id=id)}", data=data)
    assert response.status == 203


@pytest.mark.parametrize("id, rid", [(1, 10), (2, 20)])
def test_patch_reference(api_context, id, rid):
    """Test updating a specific reference"""
    response = api_context.patch(f"{BASE_URL}/{id}/reference/{rid}", data={"reference": "Updated Reference"})
    assert response.status == 200
