<?php


namespace App\Api;


use App\core\Request;
use App\Models\User;

class Util
{
    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "error" => [
                "type" => 'POST',
               "requires_session" => true
            ]
        ]
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function error(Request $request, User $user) {
        $res = ["success" => true];
        try {
            self::sendErrorReportEmail($request->getJson(), $user->getData());
        }
        catch(\Exception $e) {
            $res = ["error" => $e->getMessage()];
        }
    }

    /**
     * @param array $data
     * @param array $userData
     */
    public static function sendErrorReportEmail(array $data, array $userData = []) {
        $data['failed_at'] = (new \DateTime())->format('Y-m-d H:i:s');
        $errorRef = $data["ref"] ?? "";
        $data["user"] = $userData;

        $email = admin_email();
        $email->subject('Error Email: ' . $errorRef);
        $email->to(config('debug.email.to'));
        $email->template('error-report', ['key' => $data, "raw" => json_encode($data, JSON_PRETTY_PRINT)]);
        $email->send();
    }
}
