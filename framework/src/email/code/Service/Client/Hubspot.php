<?php

namespace Email\Service\Client;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Hubspot as HubspotMiddleware;
use Email\Service\Client;
use Email\Service\EmailInterface;

/**
 * Class Hubspot
 */
class Hubspot extends Client implements EmailInterface
{

    /**
     * @return mixed
     * @throws \Exception
     */
    public function init(): mixed
    {
        return new Shape([
            'template' => $this->getTemplate($this->getEmailData("template"), new Shape([])),
            'class'    => $this->hubspot_app
        ]);
    }

    /**
     * @param string $to
     * @param string $subject
     * @param string $template
     * @param array $cc
     * @throws \Exception
     */
    public function send(string $to, string $subject, string $template, array $cc = []): void
    {
        $email = $this->init();
        HubspotMiddleware::email(
            $email->get("template.id"),
            'to', [],
            [
                "firstname"  => "first_name",
                "token_url",
                "unsubscribe_url"
            ], $email->get("class"),
        )($this->prepareEmailData());
    }
}
