<style type="text/css">
    p, ul li {
        padding: 0px 20px 0px 20px; font-weight: 300; text-align: left; font-size: 80%; line-height: 20px; display: block; color: #959595;
    }

</style>
<tr>
    <td>
        <table width="100%" border="0" cellspacing="0" cellpadding="-5">
            <tbody>
            <tr>
                <p>Hi Paul and Chris,</p>
                <p>We’ve just received a request for a pricing document from <?php echo $data["client"] ?? ''; ?> on the <?php echo $data["project"] ?? ''; ?> project. All information related to the project is available <a href="<?php echo $data["project_link"] ?? ''; ?>">here</a>. Please respond to the user within 48 hours (working days) with a quoted price to produce the document. User details are:</p>
            </tr>
            <tr>
                <td>
                    <p>Pricing Document Request: </p>
                    <p>Name - <?php echo $data["client"] ?? ''; ?> </p>
                    <p>Email - <?php echo $data["client_email"] ?? ''; ?> </p>
                    <p>Company Name -  <?php echo $data["company"] ?? ''; ?>  </p>
                    <p>Project - <?php echo $data["project"] ?? ''; ?>  </p>

                    <p>Packages: </p>
                    <ul>
                        <?php foreach($data["packages"] ?? [] as $package): ?>
                            <li><?php echo $package; ?></li>
                        <?php endforeach; ?>
                    </ul>
                </td>
            </tr>
            <tr>
                <td><p>Thanks the C-Link Team</p></td>
            </tr>
            <tr>
                <td>
                    <p style="padding: 40px 20px 0px 20px; font-weight: 300; text-align: left; font-size: 80%; line-height: 20px; display: block; color: #959595;">
                        Construction Link Ltd.<br>T. +44 (0)203 4686 430<br>W. <a href="https://www.c-link.com">c-link.com</a>
                    </p>
                </td>
            </tr>
            </tbody>
        </table>
    </td><!-- Content Ends -->
</tr>
