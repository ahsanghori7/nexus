<?php
// Helper functions
function formatCurrency($amount) {
    return '£' . number_format($amount / 100, 2);
}

function formatDate($date) {
    return date('d/m/Y', strtotime($date));
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <title>Tender Recommendation Report</title>
  <?php include __DIR__ . '/styles.php'; ?>
</head>

<body>
  <div class="report-container">
    <h1>Tender Recommendation Report</h1>

    <div class="report-header">
      <table>
        <tr>
          <td>
            <strong>Project:</strong> <?= htmlspecialchars($pdfData->get('project.name')) ?><br>
            <strong>Package:</strong> <?= htmlspecialchars($pdfData->get('tender.label')) ?>
          </td>
          <td align="right">
            <strong>Date:</strong> <?= formatDate($pdfData->get('tender_recommendation.created_at')) ?><br>
            <strong>Submitted By:</strong> <?= htmlspecialchars($pdfData->get('author.display_name')) ?>
          </td>
        </tr>
      </table>
    </div>

    <?php include __DIR__ . '/chunks/executive_summary.php'; ?>
    <?php include __DIR__ . '/chunks/subcontractor_details.php'; ?>
    <?php include __DIR__ . '/chunks/project_info.php'; ?>
    <?php include __DIR__ . '/chunks/pricing_summary.php'; ?>
    <?php include __DIR__ . '/chunks/final_summary.php'; ?>
    <?php include __DIR__ . '/chunks/tender_recommendation_attachments.php'; ?>

    <footer>
      Report generated on <?= formatDate($pdfData->get('tender_recommendation.created_at')) ?> by <?= htmlspecialchars($pdfData->get('author.display_name')) ?><br>
      Source: Construction Management System
    </footer>
  </div>
</body>

</html>
