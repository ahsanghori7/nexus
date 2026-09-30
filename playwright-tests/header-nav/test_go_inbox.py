from percy import percySnapshot


def test_go_inbox(show_nav_menu):
    page = show_nav_menu  # Use the page returned by the show nav menu fixture

    option_button = page.locator("span", has_text="Inbox")
    assert option_button, "Inbox button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/inbox", timeout=10000)

    element = page.locator("a", has_text="Inbox ")
    assert element, "'Inbox' element is not visible."

    # Wait for the 'button.new-message-btn' div to appear on the page
    page.wait_for_selector("button.new-message-btn", state="visible", timeout=10000)

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_nav_inbox",
        test_case="Inbox is visible",
    )
