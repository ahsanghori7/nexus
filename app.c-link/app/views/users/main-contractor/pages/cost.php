<?php
if (!isset($this)) {
    die();
}
$app = $this->getContext("react_app");
$react = config("tools.react");
$v = $this->getContext("version");
$version = !is_null($v) ?  "_v" . $v : "";
$service = $react["service_url" . $version];
?>

<div id='app' style='width:100%'></div>
<script>
    var config = <?= json_encode(App\core\Config::getJsConfig()); ?>;
</script>
<script src="<?php echo $service; ?>/common-app/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/vendors/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/runtime/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service . "/" . $app; ?>/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
</body>
<style type="text/css">
    html,
    body {
        font-family: "sofia_pro_softlight";
        font-weight: 300;
        font-style: normal;
    }

    .intro-description {
        line-height: 30px;
    }

    #cost-planning-tool .lift-arrows {
        height: 55px;
    }

    #cost-planning-tool .lift-arrows #increment_lift {
        position: relative;
        top: 10.5px;
        height: 20px;
        padding-bottom: 0px;
    }

    #cost-planning-tool .lift-arrows #decrement_lift {
        position: relative;
        top: 13px;
        height: 24.3px;
        padding-bottom: 0px;
    }

    .cost-planning-tool label {
        margin-bottom: 8px;
    }

    .business-location-carret {
        top: 44px !important;
    }

    .cost-planning-tool .datepicker-wrapper .datepicker-carret {
        top: 1.5rem !important;
    }

    .cost-planning-tool .datepicker-wrapper .date-container #ui-datepicker-div table {
        margin-bottom: 0px;
    }

    .cost-planning-tool .datepicker-wrapper .date-container #ui-datepicker-div table thead {
        border: solid 1px #c6c5de;
        border-top: none;
    }

    .cost-planning-tool .datepicker-wrapper .date-container #ui-datepicker-div table thead tr th {
        height: 26.5px;
        vertical-align: middle;
        text-align: center;
    }

    #cost-planning-tool .clickable-input-wrapper label.cpt-input .checkmark {
        top: -3px;
    }

    #cost-planning-tool .date-container .ui-datepicker-group {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    #cost-planning-tool .submit-button-version-2 {
        max-width: 840px;
        margin: auto;
    }
</style>

<?php

use CL\CostPlanningTool\CostPlanningApp;

use App\core\Config;

$app = new CostPlanningApp();
$assets = Config::get("cost_planning_tool.assets");
$app->init([
    'api' => [
        'address' => Config::get("cost_planning_tool.address_api.key")
    ],
    'images' => $assets . "/images",
    'css' => [
        $assets . "/js/select-picker-master/dist/picker.min.css",
        $assets . "/css/cost-planning-tool.css",
    ],
    'js' => [
        $assets . "/js/select-picker-master/dist/picker.min.js",
        $assets . "/js/cost_planning.js",
        $assets . "/js/datepicker.js",
    ],
    'icons' => [
        'yes' => $assets . "/icons/cpt-icon-yes.png",
        'no'  => $assets . "/icons/cpt-icon-no.png",
    ],
    'steps' => [
        'exclude' => [11, 12]
    ],
    'footer_url' => Config::get("url.c-link"),
    'terms_urls' => [
        'terms-conditions' => Config::get("url.c-link") . "/terms-conditions",
        'privacy-policy'   => Config::get("url.c-link") . "/privacy-policy"
    ]
]);
echo file_get_contents(views_path() . "users/main-contractor/layout/footer-sidebar-js.php");


if (isset($data['res']['success']) && $data['res']['success']):
?>
    <script type="text/javascript">
        window.open('<?php echo $data['url']; ?>', '_blank')
    </script>
<?php
endif;
