<?php
if(!$this->getVar("company_name") && !$this->getVar("html")){
    return;
}
if($this->getVar("html")){
    echo $this->getVar("html");
}else{
    ?>
    <hr/>
    <div class="footer-text"><?= $this->getVar("company_name") ?> | <?= $this->getVar("subcontract") ?></div>
    <?php
}
