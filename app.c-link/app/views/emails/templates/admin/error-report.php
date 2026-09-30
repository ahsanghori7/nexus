<tr>
    <td>
        <table width="100%" border="0" cellspacing="0" cellpadding="-5">
            <tbody>
            <tr>
                <td>

                    <p style="padding: 0px 20px 0px 20px; font-weight: 300; text-align: left; font-size: 80%; line-height: 20px; display: block; color: #959595;">Error Reporting</p>
                    <?php foreach($data["key"] ?? [] as $k => $v): ?>
                        <?php if(is_scalar($v)): ?>
                            <p><?php echo $k . " : " . $v; ?></p>
                        <?php else: ?>
                            <p><?php echo $k; ?></p>
                            <p><?php echo json_encode($v); ?></p>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </td>
            </tr>
            <tr>
                <td>
                    <p style="padding: 40px 20px 0px 20px; font-weight: 300; text-align: left; font-size: 80%; line-height: 20px; display: block; color: #959595;">
                        Construction Link Ltd.<br>T. +44 (0)207 096 1158<br>W. <a href="https://www.c-link.com">c-link.com</a>
                    </p>
                </td>
            </tr>
            </tbody>
        </table>
    </td><!-- Content Ends -->
</tr>
<?php
$raw = $data["raw"] ?? "";
echo $raw;
?>
