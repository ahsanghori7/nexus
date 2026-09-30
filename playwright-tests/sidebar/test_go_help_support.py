from percy import percySnapshot


def test_go_help_support(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture
    context = page.context

    option_button = page.locator("a", has_text="Help & Support")
    assert option_button, "Help & Support button is not visible."
    option_button.click()

    # Wait for a new page (tab) to open
    new_page = context.wait_for_event("page", timeout=10000)
    new_page.wait_for_load_state()

    # Check the URL of the new page
    assert "https://knowledge.c-link.com/en/guides" in new_page.url, "The 'Help & Support' link did not open a new tab."

    # Verify the element is present on the new page
    element = new_page.locator("h3", has_text="Getting Started with C-Link")
    assert element.is_visible(), "'Getting Started with C-Link' element is not visible on the new page."

    # Percy Snapshot
    percySnapshot(
        new_page,
        name="snapshot_sidebar_help_support",
        test_case="Getting Started with C-Link",
    )
