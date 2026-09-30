<?php

use Core\Data\Shape;
$differences   = $pdfData->get("differences");
$project       = $pdfData->getShape("project");
$boq           = $pdfData->getShape("boq");
$account       = $pdfData->getShape("account");
$subcontractor = $pdfData->getShape("subcontractor");

?>
<h1>
    Addendum to Bill of Quantities
</h1>
<div style="font-size:16px">
    <div><b>Project Name:</b> <?php echo $project->get("name");?></div>
    <div><b>Project Location:</b> <?php echo $project->get("location");?></div>
    <div><b>Original Issue Date:</b> <?php echo date("d/m/Y", strtotime($subcontractor->get("sent_date")));?></div>
    <div><b>Addendum Issue Date:</b> <?php echo date("d/m/Y", strtotime($boq->get("addendum_date")));?></div>
    <div><b>DPB BoQ Revision Number:</b> <?php echo $boq->get("version");?></div>
    <br>
    <div><b>To:</b> <?php echo $subcontractor->get("name");?></div>
    <div><b>From:</b> <?php echo $account->get("company_name");?></div>
    <div><b>Subject:</b> DPB BoQ Revision Number <?php echo $boq->get("version");?> to Digital Price Breakdown</div>
</div>
<br>
<div style="font-size:16px;text-align: justify">
    <h3>Introduction</h3>
    <div>This addendum, numbered <?php echo $boq->get("version");?>, modifies and updates the previously issued Digital Price Breakdown dated <?php echo date("d/m/Y", strtotime($boq->get("addendum_date")));?>. These changes are necessitated by :  <?php echo $boq->get("reason");?>. All recipients of this addendum must consider these modifications when preparing or revising their bids for the project.</div>
    <br>
    <h3>Summary of Item Changes</h3>
    <div>This section details the changes to the items listed in the original Bill of Quantities. These changes may include additions, deletions, and modifications to quantities and descriptions. </div>
    <div>Please review the following summary carefully:</div>
</div>
<br>
<table style="font-size:14px;border-collapse: collapse;border:1px solid #000">
    <tr>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Item</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Original Item Description</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Original Item Quantity</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Description</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Quantity</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Change Type</th>
    </tr>
    <?php
    foreach ($differences as $difference) {
        ?>
        <tr>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['item'];?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['original']['description'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['original']['quantity'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['new']['description'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['new']['quantity'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['type'];?></td>
        </tr>
        <?php
    }
    ?>
</table>
<br>
<div style="font-size:16px;">
    <h3>Contact Information</h3>
    <div>For any queries or further clarifications, please contact:</div>
    <div>- Name: <?php echo $account->get("name");?></div>
    <div>- Position: <?php echo $account->get("job");?></div>
    <div>- Email: <?php echo $account->get("email");?></div>
    <div>- Phone: <?php echo $account->get("phone");?></div>
    <br>
    <div>Thank you for your attention to this addendum and continued interest in <?php echo $project->get("name");?>.</div>
</div>
