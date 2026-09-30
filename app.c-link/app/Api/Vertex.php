<?php


namespace App\Api;

/**
 * Class Vertex
 * @package App\Api
 */
class Vertex extends Client
{

    /**
     * @return array
     */
    public static function getApiHeaders(): array
    {
        $config = self::getConfig();
        $headers = [];
        if ($config["token"]["enabled"]) {
            $headers["api_token"] = $config["token"]["hash"];
        }
        return $headers;
    }

    /**
     * @param array $payload
     * @param int $maxAttempts
     * @param int $retryDelayMs
     */
    public static function createNotificationSilently(array $payload, int $maxAttempts = 3, int $retryDelayMs = 200): void
    {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $request = self::post("notifications", $payload);

                if ($request->isSuccess()) {
                    return;
                }

                $status = $request->getStatus();
                // Check the status if invalid status.
                if ($status >= 400 && $status < 500) {
                    self::errorLog("Failed to create notification (status $status), not retrying: " . json_encode($request->json()));
                    return;
                }
            } catch (\Throwable $e) {
                if ($attempt >= $maxAttempts) {
                    self::errorLog("Failed to create notification after $attempt attempt(s): " . $e->getMessage());
                    return;
                }
            }

            if ($attempt < $maxAttempts) {
                usleep($retryDelayMs * 1000);
            }
        }

        self::errorLog("Failed to create notification after $maxAttempts attempts");
    }

}
