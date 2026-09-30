import os

import pytest
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


@pytest.fixture
def app_c_link_login(page):
    # Perform the login steps
    page.goto("http://app.c-link.local/login")
    page.fill("input[name='username']", os.getenv("APP_C_LINK_USERNAME"))
    page.fill("input[name='pass']", os.getenv("APP_C_LINK_PASSWORD"))
    page.click("button[type='submit']", timeout=5000)
    page.wait_for_url("http://app.c-link.local/main-contractor", timeout=10000)
    yield page  # Return the page after login


@pytest.fixture
def go_project_dashboard(app_c_link_login):
    page = app_c_link_login  # Use the page returned by the login fixture
    # Step 2: Navigate to Joff's Project
    joffs_project_link = page.locator("a[href='/main-contractor/project_dashboard/joffs-project']")
    assert joffs_project_link, "Joffs Project link is not visible."

    joffs_project_link.click()
    page.wait_for_url("http://app.c-link.local/main-contractor/project_dashboard/joffs-project", timeout=10000)

    yield page  # Return the page


@pytest.fixture
def show_nav_menu(app_c_link_login):
    page = app_c_link_login  # Use the page returned by the login fixture
    # Navigate to Update Profile
    nav_update_button = page.locator("button[aria-label='account of current user']")
    assert nav_update_button, "Nav Profile is not visible."
    nav_update_button.click()

    yield page  # Return the page


@pytest.fixture
def show_sidebar(app_c_link_login):
    page = app_c_link_login  # Use the page returned by the login fixture
    # Navigate to Update Profile
    sidebar_button = page.locator("button[aria-label='menu']")
    assert sidebar_button, "Sidebar is not visible."
    sidebar_button.click()

    yield page  # Return the page


@pytest.fixture
def go_company_assets(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Company Assets")
    assert option_button, "Company Assets button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/company-assets", timeout=10000)

    element = page.locator("h1", has_text="Company Assets")
    assert element, "'Company Assets' element is not visible."

    yield page  # Return the page


@pytest.fixture
def go_supply_chain(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Supply Chain")
    assert option_button, "Supply Chain button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/supply_chain", timeout=10000)

    element = page.locator("h1", has_text="Supply Chain")
    assert element, "'Supply Chain' element is not visible."

    yield page  # Return the page
