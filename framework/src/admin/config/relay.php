<?php

use Core\Middleware\Generic;

$relayGroups = [
"relay_project_api_v1" => require('routes/relay/project.v1.php'),
    "relay_account_api_v1" => require('routes/relay/account.v1.php'),
    "relay_user_api_v1" => require('routes/relay/user.v1.php'),
    "relay_website_api_v1" => require('routes/relay/website.v1.php'),
    "relay_prequalification_api_v1" => require('routes/relay/prequalification.v1.php'),
    "relay_company_profile_api_v1" => require('routes/relay/company_profile.v1.php'),
    "relay_analytics_api_v1" => require('routes/relay/analytics.v1.php'),
    "relay_features_api_v1" => require('routes/relay/features.v1.php'),
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
