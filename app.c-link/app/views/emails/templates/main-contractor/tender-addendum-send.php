<tr>
    <td>
        <p style="font-size: 18px; color: #747474;">Hi <strong><?php echo $data['name'] ?? ""; ?></strong></p>
        <p style="font-size: 15px; line-height: 24px; color: #747474;">You received a tender addendum from <strong><?php echo $data['company'] ?? ""; ?></strong> for the <strong><?php echo $data['tender_name'] ?? ""; ?></strong> package on <strong><?php echo $data['project_name'] ?? ""; ?></strong>.</p>
    </td>
</tr>
<tr>
    <td align="center">
        <a href="<?php echo $data['attachment'] ?? ""; ?>" style="background: #8e8dbe; color: white; text-align: center; padding: 20px; text-decoration: none;">Open Tender</a>
    </td>

</tr>
<tr>
    <td>
        <p style="font-size: 15px; line-height: 24px; color: #747474;">Thanks</p>
