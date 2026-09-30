<?php
$prequal = $action->get("prequalification");
$company = $prequal['company_information'];
$region_symbol = $company['region_symbol'] ?? '£';
?>

<!-- LOGO  !-->
<div style="margin-top:100px;">
    <img style="width:50px;height:50px"
         src="<?php echo $action->get("logo.clink") ?>"/>
    <div style="margin-left:50px;margin-top:-40px;">
                <span style="font-size: 18pt;">
                    <strong>&nbsp;&nbsp; Section 1 - Executive Summary</strong>
                </span>
    </div>
</div>

<!-- COMPANY INFORMATION  !-->
<div style="margin-top:80px;"><span style="font-size: 12pt;"><strong><span
                    style="color: #ed1164;">Company Information</span></strong></span><br><br>

    <div>
        <span style="font-size: 12pt;"><strong>Registered Company Name</strong> - <?php echo $company['name']; ?></span>
    </div>

    <?php
    if ( isset($company['trading_name']) && $company['trading_name'] ) {
        ?>
        <div>
            <span style="font-size: 12pt;"><strong>Trading Name</strong> - <?php echo $company['trading_name']; ?></span>
        </div>
        <?php
    }
    ?>

    <?php
    if ( isset($company['reg_number']) && $company['reg_number'] ) {
        ?>
        <div>
            <span style="font-size: 12pt;"><strong>Registration No</strong> - <?php echo $company['reg_number']; ?></span>
        </div>
        <?php
    }
    ?>

    <?php
    if ( isset($company['vat_number']) && $company['vat_number'] ) {
        ?>
        <div><span style="font-size: 12pt;"><strong>VAT No</strong> - <?php echo $company['vat_number']; ?></span></div>
        <?php
    }
    ?>

    <?php
    if ( isset($company['utr_number']) && $company['utr_number'] ) {
        ?>
        <div><span style="font-size: 12pt;"><strong>UTR No</strong> - <?php echo $company['utr_number']; ?></span></div>
        <?php
    }
    ?>

    <?php
    if ( isset($company['main_trade']) && $company['main_trade'] ) {
        ?>
        <div><span style="font-size: 12pt;"><strong>Main Trade</strong> - <?php echo $company['main_trade']; ?></span>
        </div>
        <?php
    }
    ?>
</div>

<!-- DESCRIPTION  !-->
<?php
if ( isset($company['description']) && $company['description'] ) {
    ?>
    <div style="margin-top:20px;">
        <span style="font-size: 12pt;"><strong><span style="color: #ed1164;">Company Description</span></strong></span>
        <br><br>
        <div><?php echo $company['description']; ?></div>
    </div>
    <?php
}
?>

<?php
if ( isset($pdf_data['insurances']) && isset($pdf_data['section_refer']['insurances']) ) {
    $pdf_pages[2] .= '<div style="margin-top:20px;"><span style="font-size: 12pt;"><strong><span style="color: #ed1164;">Insurances</span></strong></span><br><br><div>Refer to Section ' . $pdf_data['section_refer']['insurances'] . '. ' . $pdf_data['company_name'] . ' currently holds:</div>';
    $pdf_pages[2] .= '<ul>';
    foreach ($pdf_data['insurances'] as $key => $section):
        $pdf_pages[2] .= '<li>' . $section['label'] . ' - ' . $region_symbol . ' ' . ($section['value'] ?? '') . '</li>';
    endforeach;
    $pdf_pages[2] .= '</ul>';
}
?>

<!-- FINANCIALS  !-->
<?php
if ( isset($prequal['financials']) && $prequal['financials'] ) {
    ?>
    <div style="margin-top:20px;">
        <span style="font-size: 12pt;"><strong><span style="color: #ed1164;">Company Turnover for the last three financial years</span></strong></span>

        <ul style="font-size: 12pt;">
            <?php
            usort($prequal['financials'], fn($a, $b) => $a['year'] <=> $b['year']);
            foreach ($prequal['financials'] as $year) {
                if ( !$year['value'] ) {
                    $year['active_trading'] = false;
                }
                $year['value'] = $region_symbol . $year['value'];
                $year['profit_before_tax'] = $region_symbol . $year['profit_before_tax'];
                if ( !$year['active_trading'] ) {
                    $year['value'] = 'Not trading';
                }
                ?>
                <li>Year Ending <?php echo $year['year']; ?> - <?php echo $year['value']; ?>
                    <ul>
                        <li>Profit before tax: <?php echo $year['profit_before_tax'] ?? ''; ?></li>
                    </ul>
                </li>
                <?php
            }
            ?>
        </ul>
    </div>
    <?php
}
?>

<!-- ORGANISATION  !-->
<?php
if(!empty($prequal['organisation'])){
?>
    <div style="margin-top:20px;"><span style="font-size: 12pt;"><strong><span style="color: #ed1164;">Company Structure</span></strong></span>
        <br><br>
        <div style="margin-top:0px;">
            <table style="height: 108px; width: 100%; border-collapse: collapse;">
                <tbody>
                <tr style="height: 29px;border:0.1px solid gray;">
                    <td style="font-size:20px;background-color:gray;text-align:center;width: 50%; height: 22px; vertical-align: top;">
                        <strong>Title</strong><br><br></td>
                    <td style="font-size:20px;background-color:gray;text-align:center;width: 50%; height: 22px; vertical-align: top;">
                        <strong>Name</strong></td>
                    <td style="font-size:20px;background-color:gray;text-align:center;width: 50%; height: 22px; vertical-align: top;">
                        <strong>E-Mail</strong></td>
                </tr>

                <?php
                foreach ($prequal['organisation'] as $company) {
                    $name = $company['firstname'] . " " . $company['lastname'];
                    ?>
                    <tr style="height: 29px;border:0.1px solid gray;">
                        <td style="text-align:center;font-size:18px;width: 50%; height: 22px; vertical-align: top;border-right:0.1px solid gray"
                            ;><?php echo($company['title'] ?? ''); ?><br><br></td>
                        <td style="text-align:center;font-size:18px;width: 50%; height: 22px; vertical-align: top;border-right:0.1px solid gray"><?php echo $name; ?></td>
                        <td style="text-align:center;font-size:18px;width: 50%; height: 22px; vertical-align: top;"><?php echo($company['email'] ?? ''); ?></td>
                    </tr>
                    <?php
                }
                ?>
                </tbody>
            </table>
        </div>
    </div>
<?php
}
?>

<!-- EMPLOYEES  !-->
<?php
if(isset($prequal['company_information']['employees_number']) && $prequal['company_information']['employees_number']){
?>
<div style="margin-top:20px;">
    <span style="font-size: 12pt;"><strong><span style="color: #ed1164;">Number of Employees</span></strong></span>
    <br><br>
    <div style="margin-top:-10px;">
        <div>
            <?php echo $prequal['company_information']['name']; ?> currently
            employs <?php echo $prequal['company_information']['employees_number']; ?> people
            <?php
            if ( $prequal['company_information']['subcontractors_number'] ) {
                ?>
                and <?php echo $prequal['company_information']['subcontractors_number']; ?> subcontractors
                <?php
            }
            ?>
        </div>
    </div>
</div>
<?php
}
