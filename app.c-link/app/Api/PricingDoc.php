<?php


namespace App\Api;
use App\Api\Project;
use App\Api\Client\Response\JsonResponse;
use App\core\Environment;
use App\Models\User;
use App\core\Request;
use App\core\Email;
use App\core\Config;

class PricingDoc extends Client
{

    const API_CONFIG_KEY = "pricing_document";

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
    protected static $security = [];

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
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url) {
        self::$forward_address[$step] = $url;
    }


    /**
     * @param User $user
     * @param int $pid
     * @return bool
     * @throws Exception
     */
    public static function send(User $user, array $project) : bool {

        if($project) {
            self::notifyAdmin($user, $project["name"], $project["slug"], $project["tender"]);
            self::notifyClient($user, $project["name"]);

            return true;
        }

        return false;
    }

    /**
     * @param User $user
     * @param array $packages
     */
    public static function notifyAdmin(User $user, string $project, string $slug, array $packages) {
        $data = [
            "client" => $user->getData("display_name"),
            "client_email" => $user->getData("email"),
            "company" => $user->getAccountData("name"),
            "project" => $project,
            "project_link" => sprintf("%s/main-contractor/project/%s", Config::get("url.site"),  $slug),
            "packages" => array_map(function($i){ return $i["label"];}, $packages)
        ];

        $adminEmail  = (new Email())->setType("admin")->template(
            "pricing-document", $data
        );

        $subject = sprintf("Request for pricing document for %s from %s", $project, $user->getData("display_name"));
        $adminEmail->subject($subject)->send(self::getConfig()["email_to"], "AppCLink@c-link.com");
    }

    /**
     * @param User $user
     * @param string $projectName
     * @throws \Exception
     */
    public static function notifyClient(User $user, string $projectName) {
        $data = [
            "client" => $user->getData("display_name"),
            "project" => $projectName,
        ];

        $adminEmail  = (new Email())->setType("main-contractor")->template(
            "pricing-document", $data
        );

        $email = $user->getData("email");
        if(!Environment::isProduction()) {
            $debug = self::getConfig()["debug_client"] ?? "";
            if($debug) {
                $email = $debug;
            }
        }

        if($email) {
            $subject = sprintf("We have received your request for a pricing document on %s", $projectName);
            $adminEmail->subject($subject)->send($email, self::getConfig()["email_from"]);
        }
    }
}
