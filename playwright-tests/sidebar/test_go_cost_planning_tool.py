from percy import percySnapshot


def test_go_cost_planning_tool(show_sidebar):
    page = show_sidebar  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Cost Planning Tool")
    assert option_button, "Cost Planning Tool button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/cost-planning-tool", timeout=10000)

    element = page.locator("h2", has_text="Cost Planning Tool")
    assert element, "'Cost Planning Tool' element is not visible."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_sidebar_cost_planning_tool",
        test_case="Cost Planning Tool is visible",
    )
