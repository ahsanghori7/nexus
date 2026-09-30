<?php

use App\core\Config;

$assets = Config::get("cost_planning_tool.assets");
?>
<link rel="stylesheet" href="<?php echo $assets . "/css/cost-planning-tool.css"; ?>" />

<div class="col-12 layout-wrapper d-flex flex-wrap justify-content-between align-content-center">

    <div style="padding: 5% 3% 0% 3%" class="col-12 layout-wrapper d-flex flex-wrap justify-content-between">

        <div class="thank__you__holder align-items-center">
            <div class="thank__you__content">
                <img src="<?php echo $assets . "/icons/clap.svg"; ?>" class="img-fluid">
                <h1>An Error has occured!</h1>
                <p>We apologise, but an error has occurred while processing your financial appraisal.</p>
                <p>A member of staff has been notified of the error, please follow the link below to try again.</p>
                <div class="actions d-flex justify-content-center">
                    <button class="cl-full-purple" onclick="window.location.href='<?php echo $data['url'] ?? ''; ?>'">Try Again</button>
                </div>

            </div>
        </div>

    </div>

</div>
