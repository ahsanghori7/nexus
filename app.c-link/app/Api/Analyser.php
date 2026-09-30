<?php


namespace App\Api;

use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Api\Document\Validator as DocValidator;
use App\Api\Project\Validator as ProjectValidator;
use App\Utility\Upload;

class Analyser extends Client
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
            "analyse" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"],
                    [DocValidator::class, "uploadedDocumentPresent"]
                ],
                "required_args" => [
                    "pid" => "int",
                    "cid" => "int"
                ]
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
     * @param array $file
     * @param array $data
     * @return mixed|null
     */
    public static function analyse(Request $request, User $user, $args)
    {
        if (!self::getConfig("enabled")) {
            return self::jsonResponse([]);
        }

        // We could, in future iterations, provide multiple files to upload,
        // but for now only use the first in list
        $data = self::createSuggestions(
            $args["documents"][0],
            $args["pid"],
            $args["cid"]
        );
        $project = $args["project"];
        $suggestions = [];
        foreach ($data as $key => $suggestion) {
            foreach ($suggestion['trades'] as $trade_key => $trade) {

                $tender = $project->getTenderByLabel($trade);
                $suggestions[] = [
                    "id" => ($tender) ? $tender->getId() : null,
                    "label" => $trade,
                    "packages" => [$trade_key],
                    "is_custom" => 0,
                    "was_suggestion" => 1,
                    "size" => Tender::DEFAULT_SIZE,
                    "service" => Tender::DEFAULT_SERVICE
                ];
            }
        }

        return self::jsonResponse($suggestions);
    }

    /**
     * @param Upload $file
     * @param int $pid
     * @param int $cid
     * @return array
     */
    public static function createSuggestions(Upload $file, int $pid, int $cid): array
    {
        $res = self::post("", [
            'pid' => $pid,
            'category' => $cid,
            'file' => new \CURLFile(
                $file->getPath(), $file->getType(), $file->getName()
            )
        ],
            ["Content-Type" => "multipart/form-data"],
            [CURLOPT_HEADER => 0]
        );

        $json = $res->json();
        return (isset($json['data'])) ? $json['data'] : [];
    }

}
