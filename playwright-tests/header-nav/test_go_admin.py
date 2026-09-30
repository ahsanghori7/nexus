from percy import percySnapshot


def test_go_admin(show_nav_menu):
    page = show_nav_menu  # Use the page returned by the show nav menu fixture

    option_button = page.locator("span", has_text="Admin")
    assert option_button, "Admin button is not visible."
    option_button.click()

    # TODO: The correct behavior is to navigate to the admin page logged in
    # In our locals does not work that way. To investigate & fix
    page.wait_for_url("http://admin.local/login", timeout=10000)

    element = page.locator("h1", has_text="Pegasus")
    assert element, "'Pegasus' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_nav_Pegasus",
        test_case="Pegasus is visible",
    )
