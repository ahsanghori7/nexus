<?php

namespace Core\Middleware\Template;

class MissingVariableException extends \Exception
{
    /**
     * @param string $template
     * @param array<string, string> $missingVars
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $template, array $missingVars, int $code = 0, ?\Throwable $previous = null)
    {
        $message = "Template ($template) has missing required vars \n";
        foreach($missingVars as $var => $note) {
            $message .= $var . " : " . $note . "\n";
        }
        parent::__construct($message, $code, $previous);
    }


}
