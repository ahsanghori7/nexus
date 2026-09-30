from percy import percySnapshot


def test_go_suggestion(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Suggestion Box")
    assert option_button, "Suggestions button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/suggestion", timeout=10000)

    element = page.locator("h1", has_text="Suggestions")
    assert element, "'Suggestions' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_sidebar_suggestion",
        test_case="Suggestions is visible",
    )
