<tr>
    <td>
        <h1 style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            Hi <?php echo $data['name'] ?? ""; ?>,</h1>

        <p style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            Please find attached your order <span
                style="font-weight: bold;"><?php echo $data['SubContractOrderNo'] ?? ""; ?></span>
            for the <span
                style="font-weight: bold;"><?php echo $data['tender_name'] ?? ""; ?></span> on
            <span style="font-weight: bold;"><?php echo $data['project_name'] ?? ""; ?></span>
            project from
            <?php echo $data['company'] ?? ""; ?>.
        </p>

        <p style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            You will find that all the relevant documents can be downloaded via the
            documents list on the PDF. If you have any queries, please follow the contact
            details below:
        </p>
    </td>
</tr>
<tr>
    <td align="center">
        <a href="<?php echo $data['attachment'] ?? ""; ?>"
            style="background: #8e8dbe; color: white; text-align: center; padding: 20px; text-decoration: none;">Open
            Order</a>
    </td>
</tr>

<tr>
    <td style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: flex; justify-content: center;color: #000;">
        <div>
            <ul>
                <li><span style="font-weight: bold;">Name:</span>
                    <?php echo $data['user_name'] ?? ""; ?>
                </li>
                <li><span style="font-weight: bold;">Company:</span>
                    <?php echo $data['company'] ?? ""; ?>
                </li>
                <li><span style="font-weight: bold;">Email:</span>
                    <?php echo $data['email'] ?? ""; ?>
                </li>
                <li><span style="font-weight: bold;">Contact Number:</span>
                    <?php echo $data['company_telephone'] ?? ""; ?>
                </li>
            </ul>
        </div>

    </td>
</tr>
<tr>
    <td>
        <p style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            Thanks,<br /></p>
        <p style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            <span style="font-weight: bold;"><?php echo $data['user_name'] ?? ""; ?></span>
        </p>
        <p style="font-weight: 300; text-align: justify; font-size: 100%; line-height: 24px; display: block; color: #959595;">
            <span style="font-weight: bold;"><?php echo $data['company'] ?? ""; ?></span>
        </p>

    </td>
</tr>
