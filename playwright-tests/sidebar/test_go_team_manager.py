from percy import percySnapshot


def test_go_team_manager(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Team Manager")
    assert option_button, "Team Manager button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/add_team", timeout=10000)

    element = page.locator("h1", has_text="Team Manager")
    assert element, "'Team Manager' element is not visible."

    # Wait for the 'panel' div to appear on the page
    page.wait_for_selector("table", state="visible", timeout=10000)

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_sidebar_team_manager",
        test_case="Team Manager is visible",
    )
