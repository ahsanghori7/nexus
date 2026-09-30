from percy import percySnapshot


def test_go_logout(show_nav_menu):
    page = show_nav_menu  # Use the page returned by the show nav menu fixture

    option_button = page.locator("span", has_text="Logout")
    assert option_button, "Logout button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/login", timeout=10000)

    element = page.locator("h1", has_text="Sign in")
    assert element, "'Sign in' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_nav_logout",
        test_case="Login is visible",
    )
