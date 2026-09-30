<?php

use Core\Service\RestService;
use Core\Config;
use Core\Service\PdfService;
use Core\Service\S3Service;
use Core\Service\SSMService;
use Api\Service\ProQuoAiService;
use Core\Service\SnsService;

$projectV2 = Config::getArray("services.project");
$projectV2["url"] = str_replace("v1","v2", $projectV2["url"]);

$accountV2 = Config::getArray("services.account");
$accountV2["url"] = str_replace("v1","v2", $accountV2["url"]);

return [
    "project_v2"  => new RestService($projectV2),
    "account_v2"  => new RestService($accountV2),
    "pdf" => new PdfService(),
    "s3" => new S3Service(Config::getArray("services.aws.s3")),
    "ssm" => new SSMService(Config::getArray("services.aws.ssm")),
    "sns" => new SnsService(Config::getArray("services.aws.sns")),
    "document" => new RestService(Config::getArray("services.document")),
    "qsai" => new ProQuoAiService(Config::getArray("services.ai.qsai"))
];
