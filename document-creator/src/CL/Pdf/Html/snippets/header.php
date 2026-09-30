<?php
$logo = $this->getVar("logo");
$address = $this->getVar("address", "");
if(is_array($address)) {
    $address = implode(", ", $address);
}
$web_address = $this->getVar("web_address", "");
$web_label = $web_address;
if(is_array($web_address)) {
    $web_label = $web_address['label'];
    $web_address = $web_address['href'];
}
?>

<?php if($logo): ?>
    <img class="header-img" src="<?= $logo ?>"/>
<?php else: ?>
    <div class="header-no-img"></div>
<?php endif; ?>
<hr/>
<?php
if(!$this->getVar("html")):
?>
<div class="header-details-row header-details-first"><?= $this->getVar("company_name", "") ?></div>
<div class="header-details-row"><?= $address ?></div>
<div class="header-details-row">Company Reg <?= $this->getVar("company_reg", "") ?></div>
<div class="header-details-row">
    <a href="<?= $web_address ?>"><?= $web_label ?></a>
</div>
<?php
else:
?>
<div class="header-details-row header-details-first"><?= $this->getVar("html") ?></div>
<?php
endif;
