<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;
use Core\Service\StripeService;

class Stripe
{

    public const MEMBERSHIP_FLEXI_ID = 11;
    public const MEMBERSHIP_REGIONAL_ID = 12;
    public const MEMBERSHIP_NATIONAL_ID = 13;

    public const MEMBERSHIP_FLEXI_TOKENS = 10;


    /**
     * @param string $key
     * @return StripeService
     * @throws \Exception
     */
    public static function getService (string $key = "stripe"): StripeService
    {
        $service = Manager::getService($key);
        if ( $service instanceof StripeService ) {
            return $service;
        }

        throw new \Exception("Stripe service must be instance of StripeService");
    }

    /**
     * @param string $subField
     * @param string $tokenField
     * @param array<string> $datamap
     * @return callable
     */
    public static function paymentRequest(string $subField, string $tokenField = "token", array $datamap = []): callable
    {
        return function ($action) use ($subField, $tokenField, $datamap){
            try{
                $plan = $action->get($subField);
                $service = self::getService();
                $paymentLink = $service->createPaymentLink($plan, [
                    'payment_token' => $action->get($tokenField),
                    'plan_id'       => $plan,
                ] + $action->keys($datamap)->toArray());
                $action->set("payment_link", $paymentLink->url);
            }catch (\Exception $e){
                throw new MiddlewareException("stripePaymentRequest",
                    "Payment Request failed with error: ". $e->getMessage()
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function getResponse(): callable
    {
        return function ($action){
            try{
                $action->set("response", self::getService()->getResponse());
            }catch (\Exception $e){
                throw new MiddlewareException("stripeGetResponse",
                    "Getting the stripe response failed with error: ". $e->getMessage()
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function validatePayment(): callable
    {
        return function ($action){
            try{
                $action->set("payment_data", self::getService()->validatePayment($action->get("response")));
            }catch (\Exception $e){
                throw new MiddlewareException("stripeValidatePayment",
                    "Validate payment failed with error: ". $e->getMessage()
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function getPaymentSubscription(): callable
    {
        return function ($action){
            try{
                $validated = $action->get("payment_data");
                if(isset($validated['success']) && $validated['success']) {
                    $plan_id = $validated['metadata']->plan_id;
                    $subscription = Manager::getService("account")->fetch("account/subscription/$plan_id")->getShape("data");
                    $action->set("payment_data", ['subscription_id' => $subscription->get("id")], true);
                }
            }catch (\Exception $e){
                throw new MiddlewareException("stripePaymentSubscription",
                    "Invalid payment subscription: ". $e->getMessage()
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function getSubscriptionTokens() : callable
    {
        return function (Shape $action) {
            $validated = (array)$action->get("payment_data", []);
            if(is_array($validated) && isset($validated['success']) && $validated['success']){
                $data = (array)self::getService()->getSubscriptionData($validated['metadata']->plan_id);
                $action->set("payment_data", ["meta" => [
                    'tokens' => $data['tokens_received']
                ]], true);
            }
        };
    }

    /**
     * @return callable
     */
    public static function getPaymentMetadata() : callable
    {
        return function (Shape $action) {
            $validated = (array)$action->get("payment_data", []);
            $metadata = [
                'payment_token' => null,
                'plan_id'       => null
            ];
            if(isset($validated['success']) && $validated['success']) {
                $metadata = $validated['metadata'];
            }
            $action->set("payment_data", ["metadata" => $metadata], true);
        };
    }

    /**
     * @param string $resultKey
     * @return callable
     */
    public static function getAccountFromMetaData(string $resultKey = 'account') : callable
    {
        return function (Shape $action) use ($resultKey) {
            $stripe_payment = (array)$action->get("payment_data");
            $response = null;
            if(isset($stripe_payment['success']) && $stripe_payment['success']) {
                $stripe_payment['metadata'] = (object)$stripe_payment['metadata'];
                $token = $stripe_payment['metadata']->payment_token;
                if($token){
                    try{
                        $response = Manager::getService("account")->fetch("user/session/$token")->getShape("data");
                    }catch (\Exception $e){
                        $response = null;
                    }
                }
            }
            $action->set($resultKey, $response);
        };
    }


}
