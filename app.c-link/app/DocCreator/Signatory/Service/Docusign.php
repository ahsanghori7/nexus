<?php

namespace App\DocCreator\Signatory\Service;

use App\Api\S3;
use App\core\Config;
use App\DocCreator\Signatory\Signatory;
use App\DocCreator\Signatory\Interfaces\Signatory as SignatoryInterface;
use App\DocCreator\Signatory\Signer\Docusign as DocusignSigner;
use DocuSign\eSign\Api\EnvelopesApi;
use DocuSign\eSign\Client\ApiClient;
use DocuSign\eSign\Model\EnvelopeDefinition;
use DocuSign\eSign\Model\EnvelopeSummary;
use DocuSign\eSign\Model\Recipients;
use DocuSign\eSign\Model\Document;
use DocuSign\eSign\Model\Envelope;
use App\Models\Document as DocumentModel;
use App\Models\UserModel;

class Docusign extends Signatory implements SignatoryInterface
{

    /**
     * @var string
     */
    protected string $access_token = '';

    /**
     * @var EnvelopeDefinition
     */
    protected ?EnvelopeDefinition $definition = null;

    /**
     * @var EnvelopesApi
     */
    protected ?EnvelopesApi $envelopeApi = null;

    /**
     * @var EnvelopeSummary
     */
    protected ?EnvelopeSummary $envelope_summary = null;

    /**
     * @var Envelope
     */
    protected ?Envelope $envelope = null;

    /**
     * Docusign constructor.
     * @param array $config
     * @throws \Exception
     */
    public function __construct(array $config = [])
    {
        $config = $config ?: [
            'host'             => Config::get("signatory.docusign.host"),
            'integration_key'  => Config::get("signatory.docusign.auth.integration_key"),
            'account_id'       => Config::get("signatory.docusign.auth.account_id"),
            'user_id'          => Config::get("signatory.docusign.auth.user_id"),
            'private_key_file' => Config::get("signatory.docusign.auth.private_key_file"),
            'scope'            => Config::get("signatory.docusign.auth.scope"),
            'base_path'        => Config::get("signatory.docusign.auth.base_path"),
            'save_path'        => Config::get("signatory.docusign.save.path")
        ];
        $this->setConfig($config);
    }

    /**
     * @throws \Exception
     */
    public function create(): void
    {
        $this->getAccessToken();
        $this->createDefinition()->createEnvelope();
    }

    /**
     * @param string $envelope_id
     * @param string $return_url
     * @return string
     * @throws \Exception
     */
    public function getSignerLink(string $envelope_id, string $return_url): string
    {
        $this->getAccessToken();
        return $this->getSigner()->getSignerLink($envelope_id, $this->getConfig("account_id"), $return_url);
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getEnvelopeId(): string
    {
        $envelopeSummary = $this->getEnvelopeSummary();
        if (!$envelopeSummary) {
            return $this->definition->getEnvelopeId();
        }
        return $envelopeSummary->getEnvelopeId();
    }

    /**
     * @param DocumentModel $document
     * @param string $path
     * @throws \Exception
     */
    public function addDocument(DocumentModel $document, string $path = ''): void
    {
        if (!$path) {
            $path = S3::getSaveTmpPath($document->getData("name"));
        }
        if (file_exists($path)) {
            $this->documents[] = new Document(
                [
                    'document_base64' => base64_encode(file_get_contents($path)),
                    'name'            => $document->getData("name"),
                    'file_extension'  => $document->getExt(),
                    'document_id'     => $document->getData("id")
                ]
            );
        } else {
            throw new \Exception("Document $path not exist");
        }
    }

    /**
     * @param UserModel $user
     * @throws \Exception
     */
    public function addSigner(UserModel $user): void
    {
        $signer = new DocusignSigner();
        $prefix = $this->getPrefixArea();
        $signatoryAreaId = $prefix . $user->getData("signatory_area_id");
        $user->setData("signatory", $signatoryAreaId);
        $user->setData("signatory_order", $user->getData("signatory_routing_order"));
        $user->setData("signatory_date", $this->getPrefixDateArea() . $user->getData("signatory_area_id"));
        $signer->setSignerUser($user);
        $this->setSigner($signer);
    }

    /**
     * @param string $envelope_id
     * @return array
     * @throws \Exception
     */
    public function getSignatoryDocumentsById(string $envelope_id): array
    {
        return (new EnvelopesApi())->listDocuments($this->getConfig("account_id"), $envelope_id)->getEnvelopeDocuments();
    }

    /**
     * @param string $did
     * @param string $envelope_id
     * @return \SplFileObject
     * @throws \Exception
     */
    public function getSignatoryDocument(string $did, string $envelope_id): \SplFileObject
    {
        return (new EnvelopesApi())->getDocument($this->getConfig("account_id"), $did, $envelope_id);
    }

    /**
     * @param string $envelope_id
     * @param string $filename Preferred download name, normally the document name held
     *                         in our own database. Falls back to the name DocuSign holds,
     *                         which for long names may have been truncated on their side.
     * @throws \DocuSign\eSign\Client\ApiException
     */
    public function preview(string $envelope_id, string $filename = ''): void
    {
        $this->getAccessToken();
        if ($documents = $this->getSignatoryDocumentsById($envelope_id)) {
            foreach ($documents as $document) {
                if ($document['type'] === 'content') {
                    $document_pdf = $this->getSignatoryDocument($document['document_id'], $envelope_id);
                    file_put_contents($this->getConfig("save_path") . $document['name'], $document_pdf->fread($document_pdf->getSize()));
                    break;
                }
            }
        }
        $filePath = $this->getConfig("save_path") . ($document['name'] ?? '');
        $download_name = self::pdfDownloadName($filename ?: ($document['name'] ?? ''));
        header('Content-type:application/pdf');
        header('Content-disposition: inline; filename="' . $download_name . '"');
        header('content-Transfer-Encoding:binary');
        header('Accept-Ranges:bytes');
        @readfile($filePath);
    }

    /**
     * @param string $name
     * @return string
     */
    public static function pdfDownloadName(string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            return 'document.pdf';
        }
        if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) === 'pdf') {
            return $name;
        }
        return preg_replace('/\.(p(d(f)?)?)?$/i', '', $name) . '.pdf';
    }

    /**
     * @param string $access_token
     */
    public function setAccessToken(string $access_token): void
    {
        $this->access_token = $access_token;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getAccessToken(): string
    {
        if (!$this->access_token) {
            $this->setAccessToken($this->getNewAccessToken());
        }
        return $this->access_token;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getNewAccessToken(): string
    {
        $client = new ApiClient();
        $client->getConfig()->setHost($this->getConfig("host"));
        $client->getOAuth()->setOAuthBasePath($this->getConfig("base_path"));
        $response = $client->requestJWTUserToken(
            $this->getConfig("integration_key"),
            $this->getConfig("user_id"),
            file_get_contents($this->getConfig("private_key_file")),
            $this->getConfig("scope"),
        );
        return $response[0]->getAccessToken();
    }

    /**
     * @param string $subject
     * @param array $options
     * @return $this
     */
    public function createDefinition(string $subject = "Please sign this document", array $options = []): Docusign
    {
        $signers = [];
        foreach ($this->getSigners() as $signer) {
            $signers[] = $signer->getSigner();
        }
        $this->definition = new EnvelopeDefinition(
            [
                'email_subject' => $subject,
                'documents'     => $this->getDocuments(),
                'recipients'    => new Recipients(['signers' => $signers]),
                'status'        => "sent",
            ] + $options
        );
        return $this;
    }

    /**
     * @throws \Exception
     */
    public function createEnvelope(): void
    {
        $this->envelopeApi = new EnvelopesApi();
        $this->envelope_summary = $this->envelopeApi->createEnvelope($this->getConfig("account_id"), $this->getDefinition());
    }

    /**
     * @return EnvelopeDefinition
     */
    public function getDefinition(): EnvelopeDefinition
    {
        return $this->definition;
    }

    /**
     * @return EnvelopeSummary
     */
    public function getEnvelopeSummary(): ?EnvelopeSummary
    {
        return $this->envelope_summary;
    }

    /**
     * @return EnvelopesApi
     */
    public function getEnvelopeApi(): EnvelopesApi
    {
        return $this->envelopeApi;
    }

    /**
     * @param string $envelope_id
     * @return Envelope
     * throws \Exception
     */
    public function getEnvelopeObject(string $envelope_id): Envelope
    {
        $this->getAccessToken();
        if (!$this->envelopeApi) {
            $this->envelopeApi = new EnvelopesApi();
        }

        if (!$this->definition) {
            $this->createDefinition();
        }

        $this->definition->setEnvelopeId($envelope_id);

        try {
            $this->envelope = $this->envelopeApi->getEnvelope($this->getConfig("account_id"), $envelope_id);
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }

        return $this->envelope;
    }

    /**
     * @param string $envelope_id
     * @param string $reason
     * @return void
     * @throws \Exception
     */
    public function void(string $envelope_id, string $reason = 'Document was voided by the main contractor.'): void
    {
        $accessToken = $this->getAccessToken();
        file_get_contents(sprintf("%s/v2.1/accounts/%s/envelopes/%s", $this->getConfig("host"), $this->getConfig("account_id"), $envelope_id), false, stream_context_create([
            "http" => [
                "header" => "Authorization: Bearer $accessToken\r\n" . "Content-Type: application/json\r\n",
                "method" => "PUT",
                "content" => json_encode([
                    "status"       => "voided",
                    "voidedReason" => $reason
                ])
            ]
        ]));
    }
}
