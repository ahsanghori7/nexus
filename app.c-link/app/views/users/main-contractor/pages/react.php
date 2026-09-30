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

<link href="<?php echo $service; ?>/vendors/style.css" rel="stylesheet">
<link href="<?php echo $service . "/" . $app; ?>/style.css" rel="stylesheet">

<div id="app" class="app"></div>

<script>
    var config = <?= json_encode(App\core\Config::getJsConfig()); ?>;
</script>

<?php App\core\Config::setJsConfig('csrfToken', csrf_token()); ?>
<script>
    var config = <?= json_encode(App\core\Config::getJsConfig()); ?>;
</script>
<script src="<?php echo $service; ?>/common-app/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/vendors/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/runtime/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service . "/" . $app; ?>/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
</body>
