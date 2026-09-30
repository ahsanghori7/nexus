<?php

namespace Email\Service;


use Core\Data\Shape;
use Email\Template\AbstractTemplateLoader;

/**
 * Class Email
 */
class Client
{

    /**
     * @var Shape|null
     */
    protected ?Shape $email_data = null;

    /**
     * @var string
     */
    protected string $email;

    /**
     * @var string
     */
    protected string $password;

    /**
     * Client constructor.
     * @param string $email
     * @param string $password
     * @throws \Exception
     */
    public function __construct(string $email, string $password)
    {
        $this->email_data = new Shape([
            'email'    => $email,
            'password' => $password
        ]);
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function getEmailData(string $key = ''): mixed
    {
        return $key ? $this->email_data->get($key) : $this->email_data;
    }

    /**
     * @param Shape $data
     */
    public function setEmailData(Shape $data): void
    {
        $this->email_data->set("email_data", $data);
    }

    /**
     * @var AbstractTemplateLoader
     */
    protected AbstractTemplateLoader $template;

    /**
     * @param AbstractTemplateLoader $template
     */
    public function setTemplateLoader(AbstractTemplateLoader $template): void
    {
        $this->template = $template;
    }

    /**
     * @return string
     */
    public function getTemplate(): string
    {
        return $this->template->getHtml();
    }

}
