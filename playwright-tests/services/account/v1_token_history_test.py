import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/v1/token_history"


@pytest.fixture(scope="session")
def api_context():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests ###
def test_list_token_history(api_context):
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


def test_list_token_history_issued(api_context):
    response = api_context.get(f"{BASE_URL}/issued")
    assert response.status == 200


def test_list_token_history_used(api_context):
    response = api_context.get(f"{BASE_URL}/used")
    assert response.status == 200


### 🔵 POST Requests ###
def test_create_token_issued_history(api_context):
    data = {"token_id": 1, "issued_by": "admin"}
    response = api_context.post(f"{BASE_URL}/issued", data=data)
    assert response.status == 201


def test_create_token_used_history(api_context):
    data = {"token_id": 1, "used_by": "user"}
    response = api_context.post(f"{BASE_URL}/used", data=data)
    assert response.status == 201
