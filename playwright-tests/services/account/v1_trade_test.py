import pytest
from playwright.sync_api import sync_playwright

BASE_URL_CATEGORY = "http://localhost/v1/trade_category"
BASE_URL_GROUP = "http://localhost/v1/trade_group"
BASE_URL_TRADE = "http://localhost/v1/trade"


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests ###
def test_list_trade_categories(api_context):
    """Test retrieving all trade categories"""
    response = api_context.get(f"{BASE_URL_CATEGORY}")
    assert response.status == 200


@pytest.mark.parametrize("type", [1, 2])
def test_get_trade_group(api_context, type):
    """Test retrieving trade group by type"""
    response = api_context.get(f"{BASE_URL_GROUP}/{type}")
    assert response.status == 200


def test_list_all_trades(api_context):
    """Test retrieving all trades"""
    response = api_context.get(f"{BASE_URL_TRADE}")
    assert response.status == 200


### 🔵 POST Requests ###
def test_create_trade_category(api_context):
    """Test creating a new trade category"""
    data = {"name": "New Category"}
    response = api_context.post(f"{BASE_URL_CATEGORY}", data=data)
    assert response.status == 201


def test_create_trade_package(api_context):
    """Test creating a new trade package"""
    data = {"name": "New Package"}
    response = api_context.post(f"{BASE_URL_CATEGORY}/package", data=data)
    assert response.status == 201


### 🟠 PATCH Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_update_trade_category(api_context, id):
    """Test updating trade category by ID"""
    data = {"name": "Updated Category"}
    response = api_context.patch(f"{BASE_URL_CATEGORY}/{id}", data=data)
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2])
def test_update_trade_package(api_context, id):
    """Test updating trade package by ID"""
    data = {"name": "Updated Package"}
    response = api_context.patch(f"{BASE_URL_CATEGORY}/package/{id}", data=data)
    assert response.status == 200


### 🔴 DELETE Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_delete_trade_category(api_context, id):
    """Test deleting trade category by ID"""
    response = api_context.delete(f"{BASE_URL_CATEGORY}/{id}")
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2])
def test_delete_trade_package(api_context, id):
    """Test deleting trade package by ID"""
    response = api_context.delete(f"{BASE_URL_CATEGORY}/package/{id}")
    assert response.status == 200
