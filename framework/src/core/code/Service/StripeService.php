<?php

namespace Core\Service;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Stripe\StripeClient;

class StripeService extends RestService
{

    /**
     * @var StripeClient
     */
    protected StripeClient $stripe_client;

    /**
     * @return StripeClient
     */
    public function getClient(): StripeClient
    {
        if(!isset($this->stripe_client)){
            return new \Stripe\StripeClient(strval($this->get("access_token")));
        }
        return $this->stripe_client;
    }

    /**
     * @return array
     */
    public function getSubscriptionsData(): array
    {
        $data = [];
        $subscriptions = (array)$this->get('subscriptions', []);
        foreach($subscriptions as $key => $value) {
            $value = (array)$value;
            $data[$key] = [
                'tokens_received'  => $value['tokens_received'],
                'group'            => $value['group'],
            ];
        }
        return $data;
    }

    /**
     * @param string $type
     * @return array
     */
    public function getSubscriptionData(string $type): array
    {
        return $this->getSubscriptionsData()[$type] ?? [];
    }

    /**
     * @param int $quantity
     * @return array<string,mixed>
     */
    public function getPaymentLinks(int $quantity = 1): array
    {
        $links = [];
        $subscriptions = (array)$this->get('subscriptions', []);
        foreach($subscriptions as $key => $value) {
            $value = (array)$value;
            $links[$key] = [
                'price_id'  => $value['price_id'],
                'recurring' => $value['recurring'],
                'quantity'  => $quantity
            ];
        }
        return $links;
    }

    /**
     * @param string $type
     * @return mixed
     */
    public function getPaymentLink(string $type): mixed
    {
        return $this->getPaymentLinks()[$type] ?? [];
    }

    /**
     * @param string $subscription
     * @param array<string, mixed> $metadata
     * @return \Stripe\Checkout\Session|\Stripe\PaymentLink
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function createPaymentLink(string $subscription, array $metadata = [])
    {

        \Stripe\Stripe::setApiKey(strval($this->get("access_token")));

        $data = (array)$this->getPaymentLink(strtolower($subscription));

        if(empty($data)){
            throw new MiddlewareException("stripeCreatePaymentLink", "Could not create the payment link");
        }

        /*
         * Recurring payment
         */
        if(isset($data['recurring']) && $data['recurring'])
        {
            try{
                $link = \Stripe\Checkout\Session::create([
                    'success_url' => strval($this->get("redirect.success")),
                    'cancel_url' => strval($this->get("redirect.error")),
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
            }catch (\Exception $e){
                throw new MiddlewareException("stripeCreatePaymentLink", "Could not create the recurring payment link");
            }
        } else {
            try{
                /*
                 * One time payment
                */
                $link = $this->getClient()->paymentLinks->create([
                    'line_items' => [[
                        'price'    => $data['price_id'],
                        'quantity' => $data['quantity']
                    ]],
                    'allow_promotion_codes' => true,
                    'metadata' => $metadata,
                    'after_completion' => [
                        'type' => 'redirect',
                        'redirect' => [
                            'url' => $this->get("redirect.success")
                        ]
                    ]
                ]);
            }catch (\Exception $e){
                throw new MiddlewareException("stripeCreatePaymentLink", "Could not create the one time payment link");
            }
        }

        return $link;
    }

    /**
     * @return \Stripe\Event
     * @throws MiddlewareException
     */
    public function getResponse(): \Stripe\Event
    {
        $json = strval(file_get_contents("php://input"));
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null;
        try {
            return \Stripe\Webhook::constructEvent($json, $sig_header, strval($this->get("webhook_secret_key")));
        } catch (\UnexpectedValueException $e) {
            throw new MiddlewareException("stripeInvalidPayload", "Invalid payload");
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            throw new MiddlewareException("stripeInvalidSignature", "Invalid signature");
        }
    }

    /**
     * @param \Stripe\Event $event
     * @return array<mixed>
     * @throws MiddlewareException
     */
    public function validatePayment(\Stripe\Event $event): array
    {

        if($event->type == 'invoice.payment_succeeded'){
            $metadata = $event->data->object->lines->data[0]->metadata ?? [];
            $price = $event->data->object->lines->data[0]->amount ?? 0;
        }else{
            $metadata = $event->data->object->metadata ?? [];
            $price = $event->data->object->amount_total ?? 0;
        }

        if($event->type == "payment_intent.payment_failed"){
            throw new MiddlewareException("stripePaymentFailed", "Payment Failed");
        }

        return [
            'success'  => true,
            'metadata' => $metadata ?? [],
            'price'    => $price
        ];
    }

}
