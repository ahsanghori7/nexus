from percy import percySnapshot


def test_go_update_profile(show_nav_menu):
    page = show_nav_menu  # Use the page returned by the show nav menu fixture

    option_update_project_button = page.locator("span", has_text="Update profile")
    assert option_update_project_button, "Update Profile button is not visible."
    option_update_project_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/profile", timeout=10000)

    element = page.locator("p", has_text="Personal Information")
    assert element, "'Personal Information' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_nav_prof",
        test_case="Profile is visible",
    )
