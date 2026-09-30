
export const approverList = [
    {
      level_number: 1,
      status: 'pending',
      approvers: [
        {
          id: '1',
          role_label: 'Operational Lead',
          approver_user: {
            display_name: 'James Patterson',
            email: 'james.p@mclaren.com',
            initials: 'JP',
          },
          status: { value: 'pending', label: 'Pending' },
          approval_requested_at: '2026-03-01T09:00:00Z',
          actioned_at: null,
        },
        {
          id: '2',
          role_label: 'Commercial Lead',
          approver_user: {
            display_name: 'Michael Brooks',
            email: 'michael.b@mclaren.com',
            initials: 'MB',
          },
          status: { value: 'approved', label: 'Approved' },
          approval_requested_at: '2026-03-01T09:00:00Z',
          actioned_at: '2026-03-01T09:30:00Z',
        },
        {
          id: '3',
          role_label: 'Managing QS',
          approver_user: {
            display_name: 'Shahrukh Khan',
            email: 'shahrukh.khan@xynotech.com',
            initials: 'SK',
          },
          status: { value: 'pending', label: 'Pending' },
          approval_requested_at: '2026-03-01T09:00:00Z',
          actioned_at: null,
        },
      ],
    },
    {
      level_number: 2,
      status: 'locked',
      approvers: [
        {
          id: '4',
          role_label: 'Commercial Director',
          approver_user: {
            display_name: 'Andrew Stewart',
            email: 'andrew.s@mclaren.com',
            initials: 'AS',
          },
          status: { value: 'locked', label: 'Locked' },
          approval_requested_at: null,
          actioned_at: null,
        },
        {
          id: '5',
          role_label: 'Divisional Director',
          approver_user: {
            display_name: 'Peter Thompson',
            email: 'peter.t@mclaren.com',
            initials: 'PT',
          },
          status: { value: 'locked', label: 'Locked' },
          approval_requested_at: null,
          actioned_at: null,
        },
        {
          id: '6',
          role_label: 'Operations Manager',
          approver_user: {
            display_name: 'Mark Robinson',
            email: 'mark.r@mclaren.com',
            initials: 'MR',
          },
          status: { value: 'locked', label: 'Locked' },
          approval_requested_at: null,
          actioned_at: null,
        },
      ],
    },
  ];


export const projectProcurementMockResponse =  [
    {
        "id": 43634,
        "label": "3d Laser Scanning Survey",
        "awarded": 0,
        "is_custom": 0,
        "size_label": "Packages £25k to £100k",
        "service_label": "Design and Supply",
        "has_document": 0,
        "state": 1,
        "start_on_site": "31-12-2023",
        "tender_return": "23-12-2023",
        "has_tender_addendum": 0,
        "has_boq": true,
        "packages": [
            326
        ],
        "procurement": {
            "21638": {
                "name": "AB ADDITIVE LTD",
                "email": "c-linkgodwin.charan@minofangle.org",
                "type_id": "4",
                "type": "Enquiry",
                "subscription_id": "15",
                "sub_id": 21638,
                "logo": "https://clink-assets.s3.eu-west-2.amazonaws.com/development/account/logo/58fde4ab3885868bd4f0ac606c609b5c/company.png",
                "status": {
                    "id": 10,
                    "uid": "added",
                    "label": "",
                    "clink_label": "Approved & Added",
                    "prosper_label": null
                },
                "last_action": {
                    "author_id": 21638,
                    "created_at": "6th Apr 2026",
                    "status_id": 10,
                    "specialist_id": 21638,
                    "meta": ""
                }
            },
            "22158": {
                "name": "11 LTD.",
                "email": "c-linkaraina.elowen@madeforthat.org",
                "type_id": "4",
                "type": "Enquiry",
                "subscription_id": "16",
                "sub_id": 22158,
                "logo": "https://clink-assets.s3.eu-west-2.amazonaws.com/development/account/logo/58fde4ab3885868bd4f0ac606c609b5c/company.png",
                "status": {
                    "id": 10,
                    "uid": "added",
                    "label": "",
                    "clink_label": "Approved & Added",
                    "prosper_label": null
                },
                "last_action": {
                    "author_id": 22158,
                    "created_at": "6th Apr 2026",
                    "status_id": 10,
                    "specialist_id": 22158,
                    "meta": ""
                }
            }
        },
        "shortlisted_subcontractors": [
            {
                "id": 3,
                "subcontractor_id": 22330,
                "name": "AB ADVENTURES LIMITED",
                "submitted_by": {
                    "id": "1",
                    "display_name": "admin"
                },
                "status": "Draft",
                "approver_id": null,
                "approver_user_id": null,
                "approver_name": null,
                "approver_notes": ""
            },
            {
                "id": 4,
                "subcontractor_id": 17446,
                "name": "APO CONSULTANTS LTD",
                "submitted_by": {
                    "id": "1",
                    "display_name": "admin"
                },
                "status": "Draft",
                "approver_id": null,
                "approver_user_id": null,
                "approver_name": null,
                "approver_notes": ""
            },
            {
                "id": 5,
                "subcontractor_id": 21719,
                "name": "APOP LTD",
                "submitted_by": {
                    "id": "1",
                    "display_name": "admin"
                },
                "status": "Draft",
                "approver_id": null,
                "approver_user_id": null,
                "approver_name": null,
                "approver_notes": ""
            },
            {
                "id": 2,
                "subcontractor_id": 21734,
                "name": "TYLIN CAE LIMITED",
                "submitted_by": {
                    "id": "1",
                    "display_name": "admin"
                },
                "status": "Pending",
                "approver_id": 4,
                "approver_user_id": 432435,
                "approver_name": null,
                "approver_notes": ""
            },
            {
                "id": 1,
                "subcontractor_id": 21639,
                "name": "AB ACCOUNTS AND CONSULTANCY SERVICE LTD",
                "submitted_by": {
                    "id": "1",
                    "display_name": "admin"
                },
                "status": "Rejected",
                "approver_id": 2,
                "approver_user_id": 4565456,
                "approver_name": null,
                "approver_notes": "",
                "approver_list": approverList
            },

        ]
    },
    {
        "id": 44018,
        "label": "Archaeologist",
        "awarded": 0,
        "is_custom": 0,
        "size_label": "Packages £250k to £500k",
        "service_label": "Design and Supply",
        "has_document": 1,
        "state": 1,
        "start_on_site": "31-12-2023",
        "tender_return": "15-12-2023",
        "has_tender_addendum": 1,
        "has_boq": false,
        "packages": [
            2386
        ],
        "procurement": {
            "17446": {
                "name": "APO CONSULTANTS LTD",
                "email": "apophiss2004@yahoo.com",
                "type_id": "3",
                "type": "Enquiry",
                "subscription_id": "10",
                "sub_id": 17446,
                "logo": "https://clink-assets.s3.eu-west-2.amazonaws.com/development/account/logo/1a00d3d0d22df253d3cee0a109084dad/company.png",
                "status": {
                    "id": 1,
                    "uid": "sent",
                    "label": "Sent",
                    "clink_label": "Awaiting Response",
                    "prosper_label": null
                },
                "last_action": {
                    "author_id": 3745,
                    "created_at": "8th Jan 2024",
                    "status_id": 1,
                    "specialist_id": 17446,
                    "meta": {
                        "document": {
                            "17446": {
                                "path": "production/contractual/enquiries/75190/Data-Project-Archaeologist-08-01-2024.pdf",
                                "name": "Data-Project-Archaeologist-08-01-2024.pdf",
                                "url": "https://clink-pdfs.s3.eu-west-2.amazonaws.com/production/contractual/enquiries/75190/Data-Project-Archaeologist-08-01-2024.pdf",
                                "id": 75190,
                                "is_tender_addendum": true
                            }
                        },
                        "enquiry": 75188,
                        "email_sent_to": null
                    }
                }
            }
        },
        "shortlisted_subcontractors": []
    }
]
