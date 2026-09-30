<?php

namespace Email\Service;

use Email\Template\AbstractTemplateLoader;

/**
 * Interface EmailInterface
 */
interface EmailInterface{

    /**
     * @return bool
     */
    public function init(): mixed;

    /**
     * @param string $to
     * @param string $subject
     * @param string $template
     * @param array $cc
     * @param array $bcc
     */
    public function send(string $to, string $subject, string $template, array $cc = [], array $bcc = []): void;

    /**
     * @param AbstractTemplateLoader $template
     */
    public function setTemplateLoader(AbstractTemplateLoader $template): void;

}
