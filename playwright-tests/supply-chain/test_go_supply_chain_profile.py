from percy import percySnapshot


def test_go_supply_chain_profile(go_supply_chain):
    page = go_supply_chain  # Use the page returned by the show nav menu fixture
    context = page.context

    option_button = page.locator("a", has_text="APO CONSULTANTS LTD")
    assert option_button, "APO CONSULTANTS LTD button is not visible."
    option_button.click()

    # Wait for a new page (tab) to open
    new_page = context.wait_for_event("page", timeout=10000)
    new_page.wait_for_load_state()

    # Check the URL of the new page
    assert "http://app.c-link.local/main-contractor/supply_chain/17446?return=sc" in new_page.url, (
        "The 'APO CONSULTANTS LTD Link' link did not open a new tab."
    )

    # Wait for the 'panel' div to appear on the page
    new_page.wait_for_selector("#mui-panel", state="visible", timeout=10000)

    # Verify the element is present on the new page
    element = new_page.locator("h1", has_text="APO CONSULTANTS LTD")
    assert element.is_visible(), "'APO CONSULTANTS LTD' element is not visible on the new page."

    # Percy Snapshot
    percySnapshot(
        new_page,
        name="snapshot_supply_chain_profile",
        test_case="APO CONSULTANTS LTD",
    )
