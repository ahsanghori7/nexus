import pytest
from percy import percySnapshot


@pytest.fixture
def go_scope_of_works(go_company_assets):
    page = go_company_assets  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Scope of Works")
    assert option_button, "Scope of Works button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/company-assets/scope-of-works", timeout=10000)

    element = page.locator("span", has_text="Select a Scope of Works template to view")
    assert element, "'Select a Scope of Works template to view' element is not visible."

    # Wait for the 'table' div to appear on the page
    page.wait_for_selector("table", state="visible", timeout=10000)

    yield page  # Return the page


def test_go_scope_of_works(go_scope_of_works):
    page = go_scope_of_works  # Use the page returned by the show nav menu fixture
    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_scope_of_works",
        test_case="Scope of Works is visible",
    )


def test_go_scope_of_works_template(go_scope_of_works):
    page = go_scope_of_works  # Use the page returned by the show nav menu fixture

    edit_button = page.locator("button.edit-template-sow-2")
    edit_button.first.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/company-assets/scope-of-works/36597", timeout=10000)

    element = page.locator("div", has_text="Architectural Glazing Template")
    assert element, "'Architectural Glazing Template' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_scope_of_works_template",
        test_case="Scope of Works Template is visible",
    )
