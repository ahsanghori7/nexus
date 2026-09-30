<?php

namespace Core\Middleware\Service;

use Core\Data\Shape;
use Core\Service\Manager;

class SubcontractorMiddleware extends AccountMiddleware
{
    public static function creditToken(
        string $tokenCountKey = "token_credit_total",
        int $tokenCount = 1,
        string $accountDataKey = "account"
    ): callable {
        return function ($a) use ($tokenCountKey, $tokenCount, $accountDataKey) {
            $account    = $a->getShape($accountDataKey);
            $aid        = $account->get("id");
            $membership = $account->get("membership");
            $count = intval($a->get($tokenCountKey, $tokenCount));

            $used = false;
            if ($membership && $count) {
                $meta = json_decode($membership['meta'], true);
                if (isset($meta['tokens'])) {
                    $count = $count + (int) $meta['tokens'];
                }
                $meta['tokens'] = $count;
                $res = Manager::getService('account')->update("account/$aid/membership", new Shape([
                    'data' => [
                        'meta' => $meta
                    ]
                ]));

                $used = $res->get("info.http_code") === 203;
            }
            $a->set("promo_token_already_used", $used);
        };
    }
}
