<?php
// Helper function to format currency
function formatCurrency($amount) {
    return '£' . number_format($amount / 100, 2);
}

// Helper function to format date
function formatDate($date) {
    return date('d/m/Y', strtotime($date));
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <title>Tender Recommendation Report</title>
  <?php include __DIR__ . '/../styles.php'; ?>
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
