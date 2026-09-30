<?php
declare(strict_types=1);

namespace App\Application\Actions {
    use Tests\Application\Actions\Support\PhpInput;

    if (!function_exists(__NAMESPACE__ . '\file_get_contents')) {
        /**
         * Override for php://input reads during tests so payloads can be injected deterministically.
         *
         * @param string $filename
         * @return string|false
         */
        function file_get_contents(string $filename)
        {
            if ($filename === 'php://input') {
                return PhpInput::get();
            }

            return \file_get_contents($filename);
        }
    }
}
