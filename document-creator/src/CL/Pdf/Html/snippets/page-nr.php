<?php
if($this->getVar("page_nr") && !$this->getVar("html")):
    ?>
    <div class="footer-text" style="margin-top:-14px;text-align: left">{PAGENO} of {nbpg}</div>
<?php
endif;
