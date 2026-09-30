from percy import percySnapshot


def test_go_project_dashboard(go_project_dashboard):
    page = go_project_dashboard  # Use the page returned by the login fixture

    # Percy Snapshot 3
    percySnapshot(
        page,
        name="snapshot_3",
        test_case="The Project dashboard is visible.",
    )
