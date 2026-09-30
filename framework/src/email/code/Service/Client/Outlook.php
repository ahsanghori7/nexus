<?php

namespace Email\Service\Client;

use Core\Config;
use Email\Service\Client;
use Email\Service\EmailInterface;
use PHPMailer\PHPMailer\PHPMailer;
use Core\Middleware\Exception as MiddlewareException;

/**
 * Class Outlook
 */
class Outlook extends Client implements EmailInterface
{

    /**
     * @var mixed
     */
    protected mixed $client;

    /**
     * @return mixed
     * @throws MiddlewareException
     */
    public function init(): mixed
    {
        try{
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = Config::get("clients.outlook.smtp");
            $mail->SMTPAuth   = Config::get("clients.outlook.auth");
            $mail->SMTPSecure = Config::get("clients.outlook.secure");
            $mail->Port       = Config::get("clients.outlook.port");
            $mail->Username   = $this->getEmailData("email");
            $mail->Password   = $this->getEmailData("password");
        }catch (\Exception $e){
            throw new MiddlewareException("faildEmailAuthenticate", $e);
        }
        return $mail;
    }

    /**
     * @param string $to
     * @param string $subject
     * @param string $template
     * @param array $cc
     * @throws MiddlewareException
     */
    public function send(string $to, string $subject, string $template, array $cc = []): void
    {
        try{
            $mail = $this->init();
            $mail->setFrom($this->getEmailData("email"));
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $template;
            $mail->send();
        }catch (\Exception $e){
            throw new MiddlewareException("failSendEmail", $e);
        }
    }
}
