<?php
namespace App\DocCreator;

use Exception;
use App\Models\UserModel;
use App\Api\S3;
use CL\Pdf\Parser;
use App\Models\Project as ProjectModel;
use App\Models\Account as AccountModel;
use App\Models\Tender  as TenderModel;
use App\Api\Document   as DocumentApi;
use App\Api\Project    as ApiProject;
use App\Api\Tender     as ApiTender;
use App\Api\Account    as ApiAccount;

/**
 * This class extracts and centralises existing attachment handling logic
 * previously implemented inside DocumentCreator.
 *
 * No functional changes were introduced.
 * The purpose is to provide a single reusable source of truth
 * that can be used consistently across the application.
 */
class Attachment
{
    protected UserModel $user;

    /**
     * @param $user
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * @param array $doc_meta
     * @param $document
     * @param int $documentId
     * @return array
     */
    public function getAttachmentsForDocument(array $doc_meta, $document, int $documentId): array
    {
        $has_attachments = $doc_meta['attachments'] ?? false;
        if ( !$has_attachments ) {
            return [];
        }
        if ( !$document->getData("parent_id") ) {
            $parent_id = $documentId;
        } else {
            $parent_id = $document->getData("parent_id");
        }

        return DocumentApi::get(sprintf(
            "document?type=%s&subtype=%s&owner_id=%s&parent_id=%s",
            DocumentApi::getDocumentType('contractual'),
            DocumentApi::getSubType("document_attachment_list_item")->getId(),
            $this->user->getData("account_id"),
            $parent_id
        ));
    }

    /**
     * @param array $attachments
     * @param string $tmpFolder
     * @param int $pid
     * @param int $tid
     * @param array $settings
     * @return array
     */
    public function prepareTmpAttachmentPdfs(array $attachments, string $tmpFolder, int $pid, int $tid, array $settings, array $tmpFiles = [], int $index = 1
    ): array {

        foreach ($attachments as $attachment) {
            $attachment_meta = json_decode($attachment['meta'] ?? '[]', true) ?: [];
            $tmpFileName = rtrim($tmpFolder, "/\\") . DIRECTORY_SEPARATOR . "Part_" . $index . ".pdf";
            S3::save(S3::getBucket("document"), $attachment['s3_key'], $tmpFileName);
            $tmpFiles[] = $tmpFileName;
            if (isset($attachment_meta['render']) && $attachment_meta['render'] === true) {
                $this->renderAttachmentIntoPdf($attachment, $tmpFileName, $pid, $tid, $settings);
            }
            $index++;
        }

        return $tmpFiles;
    }

    /**
     * @param array $attachment
     * @param string $tmpFileName
     * @param int $pid
     * @param int $tid
     * @param array $settings
     * @return void
     * @throws Exception
     */
    public function renderAttachmentIntoPdf(array $attachment, string $tmpFileName, int $pid, int $tid, array $settings): void
    {
        $attachment_json = file_get_contents($tmpFileName);
        if (!$attachment_json) {
            return;
        }
        $doc_creator_attachment = new DocCreator(DocumentApi::load($attachment['id']));
        if($pid){
            $doc_creator_attachment->setModel("project", (new ProjectModel(ApiProject::getProject($pid), $pid)));
            if($tid){
                $doc_creator_attachment->setModel("tender", (new TenderModel(ApiTender::getTender($pid, $tid))));
            }
        }
        $doc_creator_attachment->setModels([
            'user'    => $this->user,
            'account' => (new AccountModel(ApiAccount::getAccount($this->user->getData("account_id")), $this->user->getData("account_id")))
        ]);
        $attachment_content = $doc_creator_attachment->preview($settings);
        $parser = new Parser($attachment_content);
        $pdfParsed = $parser->parse();
        $pdfParsed->Output($tmpFileName, 'F');
    }
}
