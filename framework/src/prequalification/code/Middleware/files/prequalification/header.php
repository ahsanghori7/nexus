<?php
$prequal = $action->get("prequalification");
$company = $prequal['company_information'];
?>
<hr style="width:100%;">
<div style="margin-top:-64px;font-size:8pt;">Construction Link Limited</div>
<div style="margin-top:-1px;font-size:8pt;"><a style="color:black" href="mailto:info@c-link.com">info@c-link.com</a></div>
<div style="margin-top:-1px;font-size:8pt;"><a style="color:black" href="https://c-link.com">www.c-link.com</a></div>
<div style="margin-top:-1px;font-size:8pt;"><?php echo $company['landline']; ?></div>
<div style="margin-top:-56px;font-size:8pt;text-align:right;"><?php echo $company['name']; ?> | Pre-Qualification Pack</div>
