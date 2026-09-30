<?php

namespace Core\System\Exception;

class Formatter
{
    /**
     * Format exception information into a structured array
     *
     * @param mixed $exception The exception object to format
     * @param string $errorType The type of error for display purposes
     * @return array The formatted exception data
     */
    public static function format($exception, string $errorType = 'Exception'): array
    {
        return self::createResponse($exception, $errorType);
    }

    /**
     * Output formatted exception information
     *
     * @param mixed $exception The exception object to format
     * @param string $errorType The type of error for display purposes
     * @return void
     */
    public static function output($exception, string $errorType = 'Exception'): void
    {
        $response = self::createResponse($exception, $errorType);
        self::outputFromResponse($response, $errorType);
    }

    /**
     * Output a pre-formatted response array
     *
     * @param array $response The formatted response array
     * @param string $errorType The type of error for display purposes
     * @return void
     */
    private static function outputFromResponse(array $response, string $errorType): void
    {
        if (php_sapi_name() !== "cli") {
            header('Content-Type: application/json');
            echo json_encode($response, JSON_PRETTY_PRINT);
        } else {
            echo "$errorType:\n";
            echo "Type: " . $response['type'] . "\n";
            echo "Message: " . $response['message'] . "\n";
            echo "File: " . $response['file'] . ":" . $response['line'] . "\n";
            echo "Trace:\n" . $response['trace'] . "\n";
        }
        die();
    }

    /**
     * Create the response array structure
     *
     * @param mixed $exception The exception object to format
     * @param string $errorType The type of error for display purposes
     * @return array The formatted exception data
     */
    private static function createResponse($exception, string $errorType): array
    {
        return [
            'error' => $errorType,
            'type' => is_object($exception) ? get_class($exception) : gettype($exception),
            'message' => is_object($exception) && method_exists($exception, 'getMessage') ? $exception->getMessage() : 'Unknown error',
            'file' => is_object($exception) && method_exists($exception, 'getFile') ? $exception->getFile() : 'Unknown',
            'line' => is_object($exception) && method_exists($exception, 'getLine') ? $exception->getLine() : 'Unknown',
            'trace' => is_object($exception) && method_exists($exception, 'getTraceAsString') ? $exception->getTraceAsString() : 'No trace available'
        ];
    }
}
