<?php
$notIsoAccreditedContents = $action->get("not_iso_accredited_content");
?>
<h1 style="padding-top:80px;">Not ISO Accredited</h1>
<ul>
    <?php foreach ($notIsoAccreditedContents as $content) { ?>
        <li>
            <?php echo $content["description"]; ?>
        </li>
    <?php } ?>
</ul>
