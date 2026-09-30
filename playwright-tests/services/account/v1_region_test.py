import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/v1/region"


@pytest.fixture(scope="session")
def api_context():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests ###
def test_list_regions(api_context):
    """Test retrieving all regions"""
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


def test_get_region_group(api_context):
    """Test retrieving region group"""
    response = api_context.get(f"{BASE_URL}/group")
    assert response.status == 200


### 🔵 POST Requests ###
def test_create_region(api_context):
    """Test creating a new region"""
    data = {"name": "New Region"}
    response = api_context.post(f"{BASE_URL}", data=data)
    assert response.status == 201


### 🟠 PATCH Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_update_region(api_context, id):
    """Test updating a region by ID"""
    data = {"name": "Updated Region"}
    response = api_context.patch(f"{BASE_URL}/{id}", data=data)
    assert response.status == 200


### 🔴 DELETE Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_delete_region(api_context, id):
    """Test deleting a region by ID"""
    response = api_context.delete(f"{BASE_URL}/{id}")
    assert response.status == 200
