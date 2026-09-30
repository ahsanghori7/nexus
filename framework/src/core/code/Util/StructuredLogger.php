<?php

namespace Core\Util;

use Core\Config;

/**
 * Structured logging utility for consistent, parseable log output
 *
 * Provides structured logging with log levels, prefixes, and JSON context
 * for easy parsing and aggregation across the application.
 *
 * Example usage:
 * StructuredLogger::log('TI', 'INFO', 'POST', 'document resolved', ['doc_id' => 123]);
 * Output: [2026-01-22T10:30:45.123456Z] [TI] [INFO] [POST] document resolved {"doc_id":123}
 */
class StructuredLogger
{
    /**
     * Log a structured message with prefix, level, context, and optional data
     *
     * @param string $prefix Module/component identifier (e.g., 'TI', 'DOC', 'API')
     * @param string $level Log level: DEBUG, INFO, WARNING, ERROR
     * @param string $context Context identifier (e.g., endpoint name, operation type)
     * @param string $message Human-readable message describing the event
     * @param array $data Additional context data (will be JSON-encoded)
     * @param string|null $debugConfigKey Optional config key to gate DEBUG logs (e.g., 'module.debug')
     */
    public static function log(
        string $prefix,
        string $level,
        string $context,
        string $message,
        array $data = [],
        ?string $debugConfigKey = null
    ): void {
        // Gate DEBUG logs behind optional config
        if ($level === "DEBUG" && $debugConfigKey && !Config::get($debugConfigKey, false)) {
            return;
        }

        // Generate ISO 8601 timestamp with microseconds (UTC)
        $timestamp = gmdate('Y-m-d\TH:i:s') . '.' . sprintf('%06d', (int)(microtime(true) * 1000000) % 1000000) . 'Z';

        $dataStr = !empty($data) ? ' ' . json_encode($data) : '';
        error_log("[{$timestamp}] [{$prefix}] [{$level}] [{$context}] {$message}{$dataStr}");
    }
}
