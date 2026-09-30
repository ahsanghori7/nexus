<?php

use Core\Middleware\Generic;

$relayGroups = [
    "relay_enquiries_api_v1" => require('routes/relay/enquiries.v1.php'),
    "relay_opportunities_api_v1" => require('routes/relay/opportunities.v1.php'),
    "relay_project_api_v1" => require('routes/relay/project.v1.php'),
    "relay_tender_api_v1" => require('routes/relay/tender.v1.php'),
    "relay_interests_api_v1" => require('routes/relay/interests.v1.php'),
    "relay_inbox_api_v1" => require('routes/relay/inbox.v1.php'),
    "relay_prequalification_api_v1" => require('routes/relay/prequalification.v1.php'),
    "relay_company_profile_api_v1" => require('routes/relay/company_profile.v1.php'),
    "relay_hubspot_api_v1" => require('routes/relay/hubspot.v1.php'),
    "relay_user_api_v1" => require('routes/relay/user.v1.php'),
    "relay_team_manager_api_v1" => require('routes/relay/team_manager.v1.php'),
    "relay_account_api_v1" => require('routes/relay/account.v1.php'),
    "relay_analytics_api_v1" => require('routes/relay/analytics.v1.php'),
    "relay_email_api_v1" => require('routes/relay/email.v1.php'),
    "relay_document_v1" => require('routes/relay/document.v1.php'),
];

/*
 * Guarantee every relay group returns a 401 (not a 500) when the session/token
 * is missing, invalid or expired. The group-level onError merges into all of a
 * group's actions, so this single default covers every relay endpoint without
 * overriding any group that already defines its own "noSession" handler.
 */
foreach ($relayGroups as &$relayGroup) {
    if (is_array($relayGroup)) {
        $relayGroup["onError"]["noSession"] ??= Generic::notAuthorised();
    }
}
unset($relayGroup);

return $relayGroups;
