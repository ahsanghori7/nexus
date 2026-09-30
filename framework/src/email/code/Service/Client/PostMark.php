<?php

namespace Email\Service\Client;

use Core\Config;
use Email\Service\Client;
use Email\Service\EmailInterface;
use Core\Middleware\Exception as MiddlewareException;
use Postmark\Models\PostmarkException;
use Postmark\PostmarkClient;

/**
 * Class PostMark
 */
class PostMark extends Client implements EmailInterface
{

    /**
     * @var mixed
     */
    protected mixed $client;

    /**
     * @return array
     * @throws \Exception
     */
    public function loadData(): array
    {
        $email_data = $this->getEmailData("email_data");
        $sender = $email_data->get("sender");
        $recipient = $email_data->get("recipient");
        $metadata = $email_data->get("metadata");
        $result = [
            'sender'    => $sender ? $sender->get() : [],
            'recipient' => $recipient ? $recipient->get() : [],
            'recipient_name' => $recipient ? $recipient->get("display_name") : "",
            'sender_name' => $sender ? $sender->get("display_name") : Config::get("email.fallback.no_reply_name"),
            'sender_email' => $sender ? $sender->get("email") : Config::get("email.fallback.no_reply_email"),
            'metadata' => $metadata
        ];
        foreach (explode(",", Config::get("email.shortcodes.list", "")) as $value) {
            if ($data = $email_data->get($value)) {
                $result[$value] = $data;
            }
        }

        return $result;
    }

    /**
     * @return mixed
     * @throws MiddlewareException
     */
    public function init(): mixed
    {
        try {
            $client = new PostmarkClient(Config::get("clients.postmark.auth"));
        } catch (\Exception $e) {
            throw new MiddlewareException("faildEmailAuthenticate", $e);
        }
        return $client;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function loadAttachments(): array
    {
        try {
            $emailData = $this->loadData();
            $attachments = $emailData['extra']['attachments'] ?? [];
            $data = [];
            if ($attachments) {
                foreach ($attachments as $attachment) {
                    if (isset($attachment['content'])) {
                        $data[] = [
                            'name'        => $attachment['name'],
                            'content'     => $attachment['content'],
                            "ContentType" => "application/octet-stream"
                        ];
                    }
                }
            }
        } catch (\Exception $e) {
            $data = [];
        }
        return $data;
    }

    /**
     * @param string $to
     * @param string $subject
     * @param string $template
     * @param array $cc
     * @param array $bcc
     * @throws MiddlewareException
     */
    public function send(string $to, string $subject, string $template, array $cc = [], array $bcc = []): void
    {
        try {
            $data = $this->loadData();
            //Remove the attahment from the template data as the limit for Postmark is 1MB and we dont need to document for the template as we attach it directly to the email
            if (isset($data['extra']['attachments'])) {
                unset($data['extra']['attachments']);
            }
            $client = $this->init();
            $client->sendEmailWithTemplate(
                $this->getEmailData("email"),
                $data["recipient_name"] . " " . $to,
                $this->template->getID(),
                $data,
                replyTo: $data["sender_name"] . " " . $data["sender_email"],
                metadata: $data["metadata"],
                attachments: $this->loadAttachments(),
                cc: implode(",", $cc),
                bcc: implode(",", $bcc),
            );
        } catch (PostmarkException $ex) {
            throw new MiddlewareException("failSendEmail", $ex);
        } catch (MiddlewareException $generalException) {
            throw new MiddlewareException("failSendEmail", $generalException);
        }
    }
}
