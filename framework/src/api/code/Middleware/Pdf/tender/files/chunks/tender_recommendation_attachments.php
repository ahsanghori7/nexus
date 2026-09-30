<!-- ATTACHMENTS -->
<div class="card">
    <div class="card-header">Attachments</div>

    <div class="card-body">

        <?php
            $documents = $pdfData->get(
                'tender_recommendation_attachments.tender_recommendation_attachment.documents'
            ) ?? [];
            $baseUrl = $pdfData->get('tender_recommendation_attachments.tender_recommendation_attachment.base_url');

            $id  = $pdfData->get('tender_recommendation_attachments.tender_recommendation_attachment.id');
            $pid = $pdfData->get('tender_recommendation_attachments.tender_recommendation_attachment.pid');

            $downloadUrl   = "{$baseUrl}/download-manager/tender_recommendation_attachment/{$id}?pid={$pid}";
            $documentCount = (int) $pdfData->get('tender_recommendation_attachments.tender_recommendation_attachment.document_count');
        ?>

        <?php if ($documentCount > 0) : ?>

            <p>
                <?= htmlspecialchars($documentCount) ?>
                supporting documents attached to this Tender Recommendation.
            </p>

            <ul style="margin:12px 0 18px 18px; padding:0;">
                <?php foreach ($documents as $document) : ?>
                    <li style="margin-bottom:8px;">
                        <?= htmlspecialchars($document) ?>
                    </li>
                <?php endforeach; ?>
            </ul>

            <a href="<?= htmlspecialchars($downloadUrl) ?>"style="color: #4cc0ad;">
              View Tender Recommendation Documents
            </a>
        <?php else : ?>
            <p style="color: #888; font-style: italic; margin-top: 10px;">No supporting documents have been attached to this recommendation.</p>
        <?php endif; ?>

    </div>
</div>
