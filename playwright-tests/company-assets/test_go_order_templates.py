from percy import percySnapshot


def test_go_order_templates(go_company_assets):
    page = go_company_assets  # Use the page returned by the show nav menu fixture

    option_button = page.locator("a", has_text="Order Templates")
    assert option_button, "Order Templates button is not visible."
    option_button.click()

    page.wait_for_url("http://app.c-link.local/main-contractor/company-assets/order-templates", timeout=10000)

    element = page.locator("span", has_text="View Order Templates")
    assert element, "'View Order Templates' element is not visible."

    # Wait for the 'table' div to appear on the page
    page.wait_for_selector("table", state="visible", timeout=10000)

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_order_templates",
        test_case="Order Templates is visible",
    )
