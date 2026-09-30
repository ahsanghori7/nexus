<tr>
    <td>

        <h1 style="font-size: 130%; line-height: 28px; color:#8e8dbe; font-weight: bold; display:block; width: 90%; margin: 0px auto; padding: 0px 0px 20px 0px;">Hi <?php echo $data['name'] ?? ''; ?></h1>
        <p style="font-size: 110%; line-height: 26px; color:#959595; font-weight: normal; display:block; width: 90%; margin: 0px auto; padding: 0px 0px 10px 0px; text-align: justify; font-weight: 300;">You've been added to <?php echo $data['company_name'] ?? ''; ?>'s C-Link team.</p>
        <p style="font-size: 110%; line-height: 26px; color:#959595; font-weight: normal; display:block; width: 90%; margin: 0px auto; padding: 0px 0px 10px 0px; text-align: justify; font-weight: 300;">To access your team page, please follow <a href="<?php echo $data['complete_signup'] ?? ''; ?>">this</a> and register your personal account using this email address. </p>

    </td>
</tr>
