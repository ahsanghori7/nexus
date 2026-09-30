from percy import percySnapshot


def test_go_company_assets(go_company_assets):
    page = go_company_assets  # Use the page returned by the show nav menu fixture

    # Wait for the 'a.folder' div to appear on the page
    page.wait_for_selector("a.folder", state="visible", timeout=10000)

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_sidebar_company_assets",
        test_case="Company Assets is visible",
    )
