<?php

return [
    "live_tenders" => require('routes/cron/live_tenders.v1.php'),
    "free_trial" => require('routes/cron/free_trial.v1.php'),
    "quote_reminder" => require('routes/cron/quote_reminder.v1.php'),
    "token_campaign" => require('routes/script/token_campaign.v1.php'),
    "s3" => require('routes/script/s3.v1.php'),
    "free_train_campaign" => require('routes/script/free_train_campaign.v1.php'),
    "prosper_pro" => require('routes/cron/prosper_pro.v1.php'),
    "prequalification_document_request" => require('routes/cron/prequalification_document_request.v1.php'),
    "prequalification_document_expired" => require('routes/cron/prequalification_document_expired.v1.php'),
    "supply_chain_import" => require('routes/script/supply_chain_import.v1.php'),
     "prequalification_complete_request" => require('routes/cron/prequalification_complete_request.v1.php'),
    "bulk_subcontractor_import" => require('routes/script/bulk_subcontractor_import.v1.php'),
    "prequalification_statuses" => require('routes/cron/prequalification_statuses.v1.php'),
    "subcontractor_document_owner_mapping" => require('routes/script/subcontractor_document_owner_mapping.v1.php'),
    "contractor_approval_requests" => require('routes/cron/approval_requests.v1.php'),
];
