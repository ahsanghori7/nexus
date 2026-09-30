<?php
// Shared CSS styles for tender recommendation PDF
?>
<style>
    body {
      font-family: DejaVu Sans, sans-serif;
      background-color: #f5f6fa;
      margin: 0;
      padding: 0;
      color: #333;
    }

    .report-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 20px;
      box-sizing: border-box;
    }

    h1 {
      font-size: 18pt;
      margin-bottom: 10px;
      color: #111827;
    }

    .report-header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
      width: 100%;
    }

    .report-header table {
      width: 100%;
      border-collapse: collapse;
    }

    .report-header td {
      vertical-align: top;
      font-size: 10pt;
      padding: 2px 0;
    }

    .report-header strong {
      font-weight: bold;
      color: #111;
    }

    .card {
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .card-header {
      background-color: rgb(249, 250, 251);
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      font-size: 11pt;
      color: #111827;
    }

    .card-body {
      background-color: #ffffff;
      padding: 10px 12px;
      font-size: 10pt;
    }
	.info-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.half-card {
  flex: 1;
}

    .info-item {
      margin-bottom: 5px;
    }

    .info-item strong {
      display: block;
      color: #555;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10pt;
    }

    th,
    td {
      padding: 6px 8px;
      text-align: left;
	  vertical-align: baseline;
    }

    th {
      background: #f2f2f2;
      font-weight: bold;
    }

    .text-negative {
      color: #b91c1c;
    }

    .badge {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
    }

    .badge-success {
          background: #07b610;
    color: #dee4de;
    border-radius: 10px;
    }

    .badge-info {
      background: #f0f0f0;
      color: #000000;
    }

    .pricing-breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .pricing-breakdown-table td {
      vertical-align: top;
      width: 33%;
      padding: 8px;
    }

    .pricing-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 11pt;
    }

    .pricing-title.procurement {
      color: #2563eb;
    }

    .pricing-title.budget {
      color: #ea580c;
    }

    .pricing-title.forecast {
      color: #2e7d32;
    }

    footer {
      text-align: center;
      font-size: 8pt;
      color: #999;
      margin-top: 30px;
    }

    @page {
      size: A4;
      margin: 20mm;
    }
</style>
