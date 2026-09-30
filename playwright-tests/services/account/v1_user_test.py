import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/v1/user"


@pytest.fixture(scope="session")
def api_context():
    """Setup Playwright API testing context"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        yield context.request
        browser.close()


### 🟢 GET Requests ###
def test_list_users(api_context):
    """Test retrieving all users"""
    response = api_context.get(f"{BASE_URL}")
    assert response.status == 200


@pytest.mark.parametrize("ids", ["[1,2,3]", "[4,5,6]"])
def test_list_users_by_id(api_context, ids):
    """Test retrieving users by multiple IDs"""
    response = api_context.get(f"{BASE_URL}/{ids}")
    assert response.status == 200


@pytest.mark.parametrize("ids", ["[10,20]", "[30,40]"])
def test_list_users_by_account_id(api_context, ids):
    """Test retrieving users by account ID"""
    response = api_context.get(f"{BASE_URL}/account/{ids}")
    assert response.status == 200


def test_list_all_users(api_context):
    """Test retrieving all users"""
    response = api_context.get(f"{BASE_URL}/all")
    assert response.status == 200


def test_list_user_types(api_context):
    """Test retrieving user types"""
    response = api_context.get(f"{BASE_URL}/type")
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2, 3])
def test_get_user_profile(api_context, id):
    """Test retrieving user profile by ID"""
    response = api_context.get(f"{BASE_URL}/{id}/profile")
    assert response.status == 200


@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_verify_session(api_context, token):
    """Test verifying user session"""
    response = api_context.get(f"{BASE_URL}/session/{token}")
    assert response.status == 200


@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_renew_session(api_context, token):
    """Test renewing user session"""
    response = api_context.get(f"{BASE_URL}/renew_session/{token}")
    assert response.status == 200


@pytest.mark.parametrize("email", ["test@example.com", "user@domain.com"])
def test_reset_password(api_context, email):
    """Test requesting password reset"""
    response = api_context.get(f"{BASE_URL}/reset_password/{email}")
    assert response.status == 200


def test_check_password(api_context):
    """Test checking password"""
    response = api_context.get(f"{BASE_URL}/check_password")
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2])
def test_get_user_engagement(api_context, id):
    """Test retrieving user engagement data"""
    response = api_context.get(f"{BASE_URL}/{id}/engagement")
    assert response.status == 200


@pytest.mark.parametrize("token", ["session1", "session2"])
def test_get_session_usage(api_context, token):
    """Test retrieving session usage"""
    response = api_context.get(f"{BASE_URL}/session_usage/{token}")
    assert response.status == 200


@pytest.mark.parametrize("id", [1, 2])
def test_get_auto_loader_token(api_context, id):
    """Test retrieving auto loader token"""
    response = api_context.get(f"{BASE_URL}/{id}/token/auto_loader")
    assert response.status == 200


### 🔵 POST Requests ###
def test_create_user(api_context):
    """Test creating a new user"""
    data = {"name": "Test User", "email": "test@example.com", "password": "securePass"}
    response = api_context.post(f"{BASE_URL}", data=data)
    assert response.status == 201


def test_user_login(api_context):
    """Test user login"""
    data = {"email": "test@example.com", "password": "securePass"}
    response = api_context.post(f"{BASE_URL}/session", data=data)
    assert response.status == 200


def test_renew_password(api_context):
    """Test renewing password"""
    data = {"email": "test@example.com", "new_password": "newPass123"}
    response = api_context.post(f"{BASE_URL}/renew_password", data=data)
    assert response.status == 200


### 🟠 PATCH Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_update_user_profile(api_context, id):
    """Test updating user profile"""
    data = {"name": "Updated Name"}
    response = api_context.patch(f"{BASE_URL}/{id}/profile", data=data)
    assert response.status == 200


@pytest.mark.parametrize("token", ["session1", "session2"])
def test_update_session_meta(api_context, token):
    """Test updating session metadata"""
    data = {"metadata": "Updated session metadata"}
    response = api_context.patch(f"{BASE_URL}/session/{token}", data=data)
    assert response.status == 200


@pytest.mark.parametrize("token", ["session1", "session2"])
def test_increment_session_usage(api_context, token):
    """Test incrementing session usage"""
    response = api_context.patch(f"{BASE_URL}/session_usage/{token}")
    assert response.status == 200


### 🔴 DELETE Requests ###
@pytest.mark.parametrize("id", [1, 2])
def test_delete_user(api_context, id):
    """Test deleting a user by ID"""
    response = api_context.delete(f"{BASE_URL}/{id}")
    assert response.status == 200


@pytest.mark.parametrize("token", ["abc123", "xyz789"])
def test_logout_user(api_context, token):
    """Test user logout"""
    response = api_context.delete(f"{BASE_URL}/session/{token}")
    assert response.status == 200
