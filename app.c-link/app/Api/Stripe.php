<?php

namespace App\Api;

use App\core\Config;

use App\core\Request;
use App\Api\Account;
use App\Models\Subscription;
use App\core\Session;


/**
 * Class Stripe
 * @package App\Api
 * STRIPE TEST CREDIT CARD
 * CARD NUMBER - 4242 4242 4242 4242
 */
class Stripe
{
    /**
     * @var string[]
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "paymentRequest" => [
                "type" => "GET",
                "required_args" => [
                    "plan_id" => "int",
                ]
            ],
            "paymentVerification" => [
                "type" => "GET"
            ],
        ]
    ];

    protected static $error = [
        "message" => "",
        "exception" => false
    ];

    protected static $subscription;

    protected static $subscriptions = [
        'flexi',
        'regional',
        'national'
    ];

    /**
     * Import the account fields into the gocardless secuirty, as better
     * to tight couple gocardless to account, than the other way around.
     * @return array
     */
    public static function getSecurity()
    {
        $accountSecurity = Account::getSecurity();
        return [
            "fields" => $accountSecurity["fields"],
            "methods" => self::$security["methods"]
        ];
    }

    /**
     * @return \Stripe\StripeClient
     */
    public static function getStripe(): \Stripe\StripeClient
    {
        return new \Stripe\StripeClient(config('stripe.access_token'));
    }

    /**
     * @param Request $request
     */
    public static function paymentVerification(Request $request): void
    {

        $json = file_get_contents("php://input");

        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null;
        $event = null;
        try {
            $event = \Stripe\Webhook::constructEvent($json, $sig_header, config('stripe.webhook_secret_key'));
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            /*
             * @TODO implement error logic
             */
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            /*
             * @TODO implement error logic
             */
        }

        if($event) {


            if($event->type == 'invoice.payment_succeeded' ) {
                $metadata = $event->data->object->lines->data[0]->metadata;
            }else{
                $metadata = $event->data->object->metadata;
            }

            if ( $event->type == "payment_intent.payment_failed" ) {
                /*
                 * @TODO implement error logic
                 */
            }
            /*
             * Payment successfull
             */
            if ( $event->type == "checkout.session.completed" || $event->type == 'invoice.payment_succeeded' ) {
                $token = $metadata['payment_token'];
                if ( $token ) {
                    /*
                     * verifiy the session
                     */
                    try {
                        $response = Account::get('user/session/' . $token);
                        $aid = $response['user']['account_id'] ?? null;
                        if ( !$aid ) {
                            /*
                             * @TODO proper catch the errors with sns
                             */
                        }

                        $plan_id = $metadata['plan_id'] ?? null;
                        if ( !$plan_id ) {
                            /*
                             * @TODO no plan metadata found error
                             */
                        }

                        $subscription = Account::getSubscription($plan_id);
                        if ( !$subscription ) {
                            /*
                             * @TODO proper catch the errors with sns
                             */
                        }
                        $subscription_data = $subscription->getData();

                        $tokens = null;
                        $meta = [
                            'tokens' => $tokens
                        ];
                        if ( $subscription_data['label'] == Account::MEMBERSHIP_FLEXI_LABEL ) {
                            $tokens = Account::MEMBERSHIP_FLEXI_TOKENS;
                            $meta = [
                                'tokens' => $tokens
                            ];
                        }

                        /*
                         * If the membership is regional we need to store the previously selected region to membership meta
                         */
                        if ( $subscription_data['label'] == Account::MEMBERSHIP_REGIONAL_LABEL ) {
                            $region = $metadata['regions'] ?? 0;
                            if($region) {
                                $meta['regions'] = [$region];
                            }
                        }

                        Account::updateMembership($aid, [
                            'subscription_id' => $plan_id,
                            'meta' => $meta
                        ]);

                        $account_data = Account::getAccount($aid);
                        $user = array_shift($account_data['users']);
                        /*
                         * Update hubspot
                         */
                        Hubspot::prosperUpdateAccount($user['email'], ['create' => true,'subscription_type' => ucwords($subscription_data['label'])]);


                    } catch (\Exception $e) {
                        /*
                         * @TODO proper catch the errors
                         */
                    }

                }
            }
        }
    }

    /**
     * @return \string[][]
     */
    public static function getPaymentLinks(): array
    {
        $links = [];
        foreach(config('stripe.subscriptions') as $key => $value)
        {
            $links[$key] = [
                'price_id' => $value['price_id'],
                'recurring' => $value['recurring'],
                'quantity' => 1 //default value
            ];
        }
        return $links;
    }

    /**
     * @param string $type
     * @param null $default
     * @return mixed|null
     */
    public static function getPaymentLink(string $type, $default = null): ?array
    {
        return self::getPaymentLinks()[$type] ?? $default;
    }

    /**
     * @return string[]
     */
    public static function getSubscriptions(): array
    {
        return self::$subscriptions;
    }

    /**
     * @param Subscription $subscription
     * @return false|mixed|string
     */
    public static function isValidSubscription(Subscription $subscription)
    {
        $data = $subscription->getData();
        return in_array(strtolower($data['label']), self::getSubscriptions());
    }

    /**
     * @param Subscription $subscription
     * @param array $metadata
     * @return \Stripe\Checkout\Session|\Stripe\PaymentLink
     * @throws \Stripe\Exception\ApiErrorException
     */
    public static function createPaymentLink(Subscription $subscription, array $metadata = [])
    {

        \Stripe\Stripe::setApiKey(config('stripe.access_token'));

        $data = self::getPaymentLink(strtolower($subscription->getData()['label']));

        /*
         * Recurring payment
         */
        if(isset($data['recurring']) && $data['recurring'])
        {
            return \Stripe\Checkout\Session::create([
                'success_url' => config('stripe.redirect.success'),
                'cancel_url' => config('stripe.redirect.error'),
                'mode' => 'subscription',
                'allow_promotion_codes' => true,
                'subscription_data' => [
                    'metadata' => $metadata
                ],
                'line_items' => [[
                    'price' => $data['price_id'],
                    'quantity' => $data['quantity']
                ]],
            ]);
        }

        /*
         * One time payment
         */
        return self::getStripe()->paymentLinks->create([
            'line_items' => [[
                'price' => $data['price_id'],
                'quantity' => $data['quantity']
            ]],
            'allow_promotion_codes' => true,
            'metadata' => $metadata,
            'after_completion' => [
                'type' => 'redirect',
                'redirect' => [
                    'url' => config('stripe.redirect.success')
                ]
            ]
        ]);

    }


    /**
     * @param Request $request
     */
    public static function paymentRequest(Request $request): void
    {

        if(!isLoggedIn()){
            redirect(config('url.app_prosper') . '/login');
        }

        $data = $request->getQuery();

        /*
         * Check if the request is made to a valid subscription
         */

        try{
            $subscription = Account::getSubscription($data["plan_id"]);
        }catch (\Exception $e) {
            self::formError($e->getMessage());
            return;
        }

        /*
         * If the user tries to subscribe to an unsupported stripe subscriptions
         */
        if(!self::isValidSubscription($subscription)){
            self::formError('Invalid Subscription');
        }

        self::$subscription = $subscription;

        /*
         * Generate a payment token so we can retrieve user data from the stripe metadata
         */
        try{
            $response_token = Account::get('account/payment_request/' . user_id());
            if (!$response_token['token']) {
                self::formError('User not found');
            }
        }catch (\Exception $e) {
            self::formError($e->getMessage());
            return;
        }


        /*
         * Create the payment link for stripe
         */
        $paymentLink = self::createPaymentLink($subscription, [
            'payment_token' => $response_token['token'],
            'plan_id' => $data['plan_id'],
            'regions' => (int) ($data['region'] ?? 0)
        ]);

        /*
         * Redirect the user to the newly created stripe payment url
         */
        self::$forward_address['paymentRequest'] = $paymentLink->url;
    }


    /**
     * @param string $message
     * @param \Exception $exception
     */
    public static function setError(string $message, \Exception $exception)
    {
        self::$error["message"] = $message;
        self::$error["exception"] = $exception;
    }

    /**
     * @return bool
     */
    public static function hasError(): bool
    {
        return (self::$error["exception"] !== false);
    }

    /**
     * @param string $k
     * @return false
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @param string $message
     * @param string $step
     */
    public static function formError(string $message, $step = 'paymentRequest'): void
    {
        Session::setMessage($message, "form_error");
        $signup_url = config('url.prosper') . '/plans-pricing';
        self::$forward_address[$step] = $signup_url;
    }
}
