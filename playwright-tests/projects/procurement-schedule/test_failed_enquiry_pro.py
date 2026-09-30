from percy import percySnapshot


def test_send_enquiry_modal_shows_when_no_tender_document_and_closes_on_outside_click(go_project_dashboard):
    """CLP-1593"""
    page = go_project_dashboard  # Use the page returned by the go project dashboard fixture

    # Step 3: Hover over Procurement Tools
    procurement_tools_link = page.locator(
        "a[href='/main-contractor/project_dashboard/joffs-project'] >> text=Procurement tools"
    )
    assert procurement_tools_link, "Procurement tools link is not visible."
    procurement_tools_link.hover()

    # Step 4: After hovering, click Procurement Schedule
    procurement_schedule_link = page.get_by_role("link", name="Procurement Schedule")
    assert procurement_schedule_link, "Procurement Schedule link is not visible."
    procurement_schedule_link.click()

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_5",
        test_case="The PS is visible.",
    )

    # Step 5: Click Dry Lining from Procurement Schedule
    dry_lining_link = page.locator("a[href='#Dry-Lining']")
    assert dry_lining_link, "Dry-Lining link is not visible."
    dry_lining_link.click()

    # Step 6: Find and click on the last "More Options" (3 dots) button in the Supply Chain table
    more_options_button = page.locator("tr >> .actions-tooltip >> button").last
    assert more_options_button, "More options (3 dots) button is not visible."
    more_options_button.click()

    # Step 7: Click on "Send Enquiry"
    send_enquiry_option = page.locator("li.MuiButtonBase-root:has-text('Send Enquiry')")
    assert send_enquiry_option, "Send Enquiry option is not visible."
    send_enquiry_option.click()

    # Step 8: Wait for the modal and verify warning message
    modal_alert = page.locator("div[role='alert'].alert-danger")
    modal_alert.wait_for(state="visible", timeout=10000)  # Wait for the modal to appear
    assert modal_alert.is_visible(), "Create Tender Document warning is not displayed."

    # Percy Snapshot
    percySnapshot(
        page,
        name="snapshot_8",
        test_case="The Create Tender Document warning is visible.",
    )

    assert "Create a tender document before issuing an enquiry." in modal_alert.text_content(), (
        "Incorrect warning message."
    )

    # Step 9: Click outside the modal to close it
    page.click("body", position={"x": 10, "y": 10})  # Clicking somewhere on the body outside the modal

    # Step 10: Wait for the modal to be hidden before asserting
    page.locator("div[role='alert'].alert-danger").wait_for(state="hidden", timeout=5000)

    # Step 11: Assert that the modal is not visible
    assert not page.locator("div[role='alert'].alert-danger").is_visible(), (
        "Modal did not close after clicking outside."
    )
