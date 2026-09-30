

<div style="width:100%;margin-top:0">
    <div style="margin-top:0;text-align:center;font-weight:bold;font-size:200%">Verified Client Reference</div>
</div>


<?php
if($action->get("logo.company")){
?>
<div style="text-align:center;margin-top:50px;">
    <img width="auto" height="200px" src="var:prosper_company_logo">
</div>
<?php
}
?>



<div style="margin-left:100px;margin-right:100px;">
    <br/>
    <div style="margin-top:10px;">
        <?php
        foreach($action->get("reference_data") as $key => $value){
            if(!$value){
                continue;
            }
            $label = ucwords(str_replace('_', ' ', $key));
            ?>
            <div style="margin-top:20px;">
                <span style="font-size: 12pt;">
                    <strong><span ><?php echo $label;?></span></strong>
                </span>
                <div style="margin-top:5px;">
                    <span style="font-size: 12pt;"><?php echo $value;?></span>
                </div>
            </div>
            <?php
        }
        ?>
    </div>
</div>
