import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/v1/token"


@pytest.fixture(scope="session")
def api_context():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests ###
def test_list_token_types(api_context):
    response = api_context.get(f"{BASE_URL}/type")
    assert response.status == 200


def test_list_tokens(api_context):
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_verify_token(api_context, token):
    response = api_context.get(f"{BASE_URL}/verify/{token}")
    assert response.status == 200


### 🔵 POST Requests ###
def test_create_token(api_context):
    data = {"type": "api_key", "expires": "2025-01-01"}
    response = api_context.post(f"{BASE_URL}", data=data)
    assert response.status == 201


### 🟠 PATCH Requests ###
@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_update_meta_token(api_context, token):
    response = api_context.patch(f"{BASE_URL}/{token}/meta", data={"description": "Updated meta"})
    assert response.status == 200


### 🔴 DELETE Requests ###
@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_disable_token(api_context, token):
    response = api_context.delete(f"{BASE_URL}/{token}")
    assert response.status == 200
