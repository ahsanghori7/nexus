from percy import percySnapshot


def test_go_supply_chain(go_supply_chain):
    page = go_supply_chain  # Use the page returned by the show nav menu fixture

    # Wait for the 'table' div to appear on the page
    page.wait_for_selector("div.supply-chain-table", state="visible", timeout=10000)

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_sidebar_supply_chain",
        test_case="Supply Chain is visible",
    )
