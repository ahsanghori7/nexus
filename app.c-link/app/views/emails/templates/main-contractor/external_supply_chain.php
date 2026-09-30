<!doctype html>
<html>

<body style="height: 100vh;">

    <table width="100%" height="100%" border="0" cellspacing="0" cellpadding="5" align="center" style="font-family: 'Gill Sans', 'Gill Sans MT', 'Myriad Pro', 'DejaVu Sans Condensed', Helvetica, Arial, 'sans-serif'; background: #f9f9f9;">
        <tbody>
            <tr valign="middle" align="center">
                <td>

                    <table width="100%" border="0" cellspacing="0" cellpadding="15" style="border: 2px solid #f2f2f2; padding: 30px; background: #fff; max-width: 600px;">
                        <tbody>
                            <tr>
                                <td><img style="max-width: 160px;" src="<?php echo $data['asset_url'] ?? ''; ?>/email/clink-sign.png" alt="c-link sign" width="50px"></td>
                            </tr>
                            <tr>
                                <td>
                                    <h1 style="font-size: 14px; line-height: 22px; display: block; color: #2A3845; margin: 0px auto; padding: 0px 0px 20px 0px; font-weight: normal;">
                                        Hi <?php echo $data['name'] ?? ''; ?>,</h1>

                                    <p style="font-size: 14px; line-height: 22px; font-weight: normal; color: #2A3845; display:block; margin: 0px auto; padding: 0px 0px 20px 0px; text-align: justify;">

                                        <span style="font-weight: bold;">
                                            <?php echo $data['contact_name'] ?? ''; ?>
                                        </span>
                                        from
                                        <span style="font-weight: bold;"><?php echo $data['main_contractor'] ?? ''; ?></span>
                                        have added you to their C-Link supply chain.
                                    </p>

                                    <p style="font-size: 14px; line-height: 22px; font-weight: normal; color: #2A3845; display:block; margin: 0px auto; padding: 0px 0px 20px 0px; text-align: justify;">
                                        <span style="font-weight: bold;"><?php echo $data['main_contractor'] ?? ''; ?></span>
                                        are using C-Link to manage their procurement on up-coming projects.
                                    </p>

                                    <p style="font-size: 14px; line-height: 22px; font-weight: normal; color: #2A3845; display:block; margin: 0px auto; padding: 0px 0px 2px 0px; text-align: justify;">
                                        <span style="font-weight: bold;">Trade(s): </span>
                                        <?= implode(",", $data["trades"] ?? []);  ?>
                                    </p>

                                    <p style="font-size: 14px; line-height: 22px; font-weight: normal; color: #2A3845; display:block; margin: 0px auto; padding: 0px 0px 20px 0px; text-align: justify;">
                                        <span style="font-weight: bold;">Location: </span>
                                        <?= implode(",", $data["regions"] ?? []);  ?>
                                    </p>

                                    <p style="font-size: 14px; line-height: 22px; font-weight: normal; color: #2A3845; display:block; margin: 0px auto; padding: 0px 0px 20px 0px; text-align: justify;">
                                        To find out more and what to expect next, please click the button below.</p>

                                    <a style="font-size: 18px; color: #fff; background-color: #56C7B6; padding: 14px 44px; display: inline-block; margin: 20px 0 10px; text-decoration: none; border-radius: 32px;" href="https://c-link.com/supply-chain-crm">Find out more</a>

                                </td>
                            </tr>
                            <p style="color: #2A3845; font-size: 14px; margin: 0 0 2px; font-family: Arial, Regular;">Regards,</p>
                            <p style="color: #2A3845; font-size: 14px; margin: 0 0 2px; font-family: Arial, Regular;">The C-Link team</p>
                            <p style="font-size: 14px; margin: 0;"><a style="color: #4CC0AD; font-family: Arial, Regular;" href="https://c-link.com/">www.c-link.com</a></p>

                            <div style="display:flex; margin-top: 20px;">
                                <div style="margin-right: 10px;">

                                    <a href="https://www.youtube.com/channel/UCn6cTmDD2PSUidpaw9gn3PA">
                                        <img style="height: 24px; width: auto;" src="<?php echo $data['asset_url'] ?? ''; ?>/email/youtube-icon.png" width="80px" alt="Youtube">
                                    </a>

                                </div>
                                <div>

                                    <a href="https://www.linkedin.com/company/construction-link-limited">
                                        <img style="height: 24px; width: auto;" src="<?php echo $data['asset_url'] ?? ''; ?>/email/linkedin-icon.png" width="80px" alt="LinkedIn">
                                    </a>

                                </div>
                            </div>

                </td>
            </tr>
        </tbody>
    </table>


    <table width="470px" border="0" cellspacing="0" cellpadding="0">
        <tbody>
            <tr>
                <td colspan="2">
                    <p style="font-size: 15px; line-height: 24px; color: #747474;text-align:justify">&hearts; This email was sent by Construction Link Limited a procurement platform for the construction industry.</p>
                </td>
            </tr>
            <tr>

                <td>
                    <p style="font-size: 15px; line-height: 24px; color: #747474;">
                        Construction Link Ltd.<br>
                        T. +44 (0)203 4686 430<br>
                        W. c-link.com
                    </p>
                </td>
                <td align="right"><a href="/unsubscribe/" style="font-size: 50%; text-transform: uppercase; color: #747474">unsubscribe</a></td>
            </tr>
        </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>

</body>

</html>
