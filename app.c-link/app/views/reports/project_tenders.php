<?php
    $reportData    = $data['report']       ?? [];
    $projectName   = $data['project_name'] ?? '';
    $preparedBy    = $data['prepared_by']  ?? '';
    $dateGenerated = date('Y-m-d');
?>
<div style="text-align:center; margin-bottom: 20px;">
    <h1 style="font-size: 24px; font-weight: bold;">Tender Report</h1>
</div>

<div style="margin-bottom: 20px; font-size: 13px; line-height: 1.8;">
    <p style="margin: 0 0 4px 0;"><strong>Project:</strong> <?= $projectName ?></p>
    <p style="margin: 0 0 4px 0;"><strong>Date Generated:</strong> <?= $dateGenerated ?></p>
    <p style="margin: 0;"><strong>Prepared By:</strong> <?= $preparedBy ?></p>
</div>

<table>
    <thead>
        <tr>
            <th style="text-align:center; width:15%;">Trade Package</th>
            <th style="text-align:center; width:15%;">Tender Name</th>
            <th style="text-align:center; width:20%;">Company</th>
            <th style="text-align:center; width:10%;">Status</th>
            <th style="text-align:center; width:15%;">Created Date</th>
            <th style="text-align:center; width:15%;">Sent date</th>
            <th style="text-align:center; width:12%;">Approver</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($reportData as $packageName => $tenders): ?>
            <!-- Package heading -->
            <tr>
                <td colspan="7"
                    style="background:#e6e6e6;
                        font-weight:bold;
                        text-align:left;
                        padding:8px;">
                    <?= $packageName ?>
                </td>
            </tr>

            <?php $rowIndex = 0; // SAFE numeric counter ?>

            <?php foreach ($tenders as $tender): ?>
                <?php
                    $rowColor = ($rowIndex % 2 === 0) ? '#ffffff' : '#f2f2f2';
                    $rowIndex++;
                ?>
                <tr>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["label"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["name"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["company"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["approval_status"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["created_date"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["sent_date"] ?>
                    </td>
                    <td style="text-align:center; background-color: <?= $rowColor ?>;">
                        <?= $tender["approver_name"] ?>
                    </td>
                </tr>
            <?php endforeach; ?>

        <?php endforeach; ?>
    </tbody>
</table>
