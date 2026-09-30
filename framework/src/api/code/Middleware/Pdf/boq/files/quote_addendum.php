<?php

use Core\Data\Shape;
$differences   = $pdfData->get("differences");
$project       = $pdfData->getShape("project");
$boq           = $pdfData->getShape("boq");
$account       = $pdfData->getShape("account");
$ccontractor   = $pdfData->getShape("contractor");
$documents     = $pdfData->get("differences_documents");

$original_difference = reset($differences);
?>
<div style="font-size:16px">
    <h1>
        Quote Revision
    </h1>
</div>
<div style="font-size:16px">
    <div><h2>Reason for changes</h2></div>
    <div><?php echo $boq->get("reason");?>.</div>
</div>
<br>
<div style="font-size:16px;text-align: justify">
    <h2>Quote Updates</h2>
    <div>Date of Update: <?php echo date("d/m/Y");?></div>
    <div>Previous Version Date: <?php echo date("d/m/Y", strtotime($boq->get("addendum_date")));?></div>
</div>
<br>
<div style="font-size:16px;text-align: justify">
    <h2>Item Changes</h2>
</div>
<table style="font-size:14px;border-collapse: collapse;border:1px solid #000">
    <tr>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Item</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Original Item Description</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Original Item Rate</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Original Item Total</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Description</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Rate</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Total</th>
        <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">Change Type</th>
    </tr>
    <?php
    foreach ($differences as $difference) {
        ?>
        <tr>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['item'];?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['original']['description'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['original']['rate'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['original']['price'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['new']['description'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['new']['rate'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['new']['price'] ?? '';?></td>
            <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $difference['type'];?></td>
        </tr>
        <?php
    }
    ?>
</table>

<?php
if($documents):
?>
    <br>
    <br>
    <div style="font-size:16px;text-align: justify">
        <h2>Document Changes</h2>
    </div>
    <table style="width:100%;font-size:14px;border-collapse: collapse;border:1px solid #000">
        <tr>
            <th style="vertical-align:top;text-align:left;padding:10px;border:1px solid #000">New Document</th>
        </tr>
        <?php
        foreach ($documents as $document) {
            ?>
            <tr>
                <td style="vertical-align:top;padding:10px;border:1px solid #000"><?php echo $document['name'];?></td>
            </tr>
            <?php
        }
        ?>
    </table>
<?php
endif;
?>
<br>
<div style="font-size:16px;">
    <br>
    <div>Should you have any questions or require further clarification on the updates, please do not hesitate to get in touch with <?php echo $account->get("name") ;?> at <?php echo $account->get("company_name") ;?>.</div>
</div>
