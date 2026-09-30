<?php
$prequal = $action->get("prequalification");
?>
<div style="margin-top:180px;text-align:center;">
    <img width="50px" height="50px" src="<?php echo $action->get("logo.clink"); ?>">
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <span style="padding-left:30px;padding-top:5px;font-size: 36pt;"><strong>PREQUALIFICATION</strong></span>
</div>
<div style="margin-top:50px;margin-left:50px;">
    <span style="font-size: 24pt;">
         <strong>Pre qualification pack</strong>
    </span>
    <strong>
            <span style="font-size: 24pt;">for <?php echo $prequal['company_information']['name']; ?>
                <?php
                if ( isset($prequal['company_information']['trading_name']) && $prequal['company_information']['trading_name'] != '' ) {
                    ?>
                    <span style="color: #ed1164;">(<?php echo $prequal['company_information']['trading_name']; ?>)</span>
                    <?php
                }
                ?>
            </span>
    </strong>
    <div style="text-align:center;margin-left:-20px;margin-top:80px;">
        <img src="<?php echo $action->get("logo.account")."?time=".time(); ?>"/>
    </div>
</div>
