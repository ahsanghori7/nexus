<?php
$sections = $action->get("sections");
?>
<!-- LOGO  !-->
<div style="margin-top:100px;">
    <img style="width:50px;height:50px"
         src="<?php echo $action->get("logo.clink") ?>"/>
    <div style="margin-left:50px;margin-top:-40px;">
                <span style="font-size: 18pt;">
                    <strong>&nbsp;&nbsp; Contents</strong>
                </span>
    </div>
</div>
<div style="margin-top:80px;">
    <table style="height: 108px; width: 94%; border-collapse: collapse;">
        <tbody>
        <tr style="height: 26px;border:0.1px solid gray;">
            <td style="background-color:gray;text-align:center;width: 50%; height: 18px; vertical-align: top;"><strong>Description</strong><br><br>
            </td>
            <td style="background-color:gray;text-align:center;width: 50%; height: 18px; vertical-align: top;"><strong>Section</strong>
            </td>
        </tr>
        <tr style="height: 26px;border:0.1px solid gray;">
            <td style="text-align:center;width: 50%; height: 18px; vertical-align: top;border-right:0.1px solid gray" ;>
                Executive Summary<br><br></td>
            <td style="text-align:center;width: 50%; height: 18px; vertical-align: top;">1</td>
        </tr>

        <?php
        if ( isset($sections) && is_array($sections) ) {
            foreach ($sections as $section) {
                if ( !isset($section['title']) || !$section['title'] ) {
                    continue;
                }
                ?>
                <tr style="height: 26px;border:0.1px solid gray;">
                    <td style="text-align:center;width: 50%; height: 18px; vertical-align: top;border-right:0.1px solid gray"
                        ;><?php echo $section['title']; ?><br><br></td>
                    <td style="text-align:center;width: 50%; height: 18px; vertical-align: top;"><?php echo $section['index']; ?></td>
                </tr>
                <?php
            }
        }
        ?>
        </tbody>
    </table>
</div>
