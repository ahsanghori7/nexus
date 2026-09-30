<tr>
    <td>
        <p style="font-size: 18px; color: #747474;">Hi <strong><?php echo $data['name'] ?? ""; ?></strong></p>
        <p style="font-size: 15px; line-height: 24px; color: #747474;">You have just received an enquiry from <strong><?php echo $data['company'] ?? ""; ?></strong> via C-Link for the <strong><?php echo $data['tender_name'] ?? ""; ?></strong> on <strong><?php echo $data['project_name'] ?? ""; ?></strong>.</p>
        <p style="font-size: 15px; color: #747474;">The enquiry is available through the link below. You will find that all the relevant drawings and documents for this package can be downloaded in the PDF documents list.</p>
    </td>
</tr>
<tr>
    <td align="center">
        <a href="<?php echo $data['attachment'] ?? ""; ?>" style="background: #8e8dbe; color: white; text-align: center; padding: 20px; text-decoration: none;">Open Tender</a>
    </td>
</tr>
<tr>
    <td>
        <p style="font-size:15px; color: #747474;">The tender was issued by <?php echo $data['user_name'] ?? ""; ?> from <strong><?php echo $data['company'] ?? ""; ?></strong>. Please direct all communications to them directly -- using the Inbox tool or as below:</p>
        <ul>
            <li style="font-size: 15px;color: #747474;"><strong>Telephone</strong>: <?php echo $data['company_telephone'] ?? ""; ?></li>
        </ul>
        <p style="font-size: 15px;color: #747474;">
            We look forward to hearing from you.
        </p>
        <p style="font-size: 15px;color: #747474;">
            Thanks,
        </p>
        <p style="font-size: 15px;color: #747474;">
            <strong><?php echo $data['user_name'] ?? ""; ?></strong>
        </p>
        <p style="font-size: 15px;color: #747474;">
            <strong><?php echo $data['company'] ?? ""; ?></strong>
        </p>

    </td>
</tr>
