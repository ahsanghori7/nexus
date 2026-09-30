from percy import percySnapshot


def test_login_successful(app_c_link_login):
    page = app_c_link_login
    # Check if the current URL is as expected
    current_url = page.url
    assert current_url == "http://app.c-link.local/main-contractor", "The login did not redirect to the expected URL."

    # Check for the existence of the Projects heading
    h1_element = page.get_by_role("heading", name="Projects")
    assert h1_element, "The Projects heading is not visible."

    # Percy Snapshot 2
    percySnapshot(
        page,
        name="snapshot_2",
        test_case="The Projects heading is visible.",
    )
