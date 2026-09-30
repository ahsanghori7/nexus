<?php

use Core\Middleware\Template\MissingVariableException;
use Core\Middleware\Session;
use Core\System\Environment as E;
use Core\Config;

$vars   = get_defined_vars();
$shape = $vars["shape"] ?? false;
$token  = ($shape) ? $shape->get("csfr_token", "") : "";
setcookie("csfr_token", $token, time() + 3600);
$data = ($shape) ? $shape->get("reactData", '{}') : '{}';
// A failed json_encode (invalid UTF-8) hands us false/'' here, which would emit
// a broken object literal and take the whole page down with it.
if (!is_string($data) || json_decode($data) === null) {
    $data = '{}';
}
// The payload is inlined below as a JS object literal - escape the characters
// that are legal inside a JSON string but would either close the script block
// or break the JS parser.
$data = str_replace(
    ['<', '>', '&', "\u{2028}", "\u{2029}"],
    ['\\u003C', '\\u003E', '\\u0026', '\\u2028', '\\u2029'],
    $data
);
$reactUrl = $vars["react_url"] ?? false;
$reactApp = $vars["react_app"] ?? false;
$messages = [];
foreach (Session::cleanMessages() as $type => $message) {
    $messages[] = "'" . $type . "' : '" . $message . "'";
}

if (!$reactUrl || !$reactApp) {
    throw new MissingVariableException(
        __FILE__,
        [
            "react_url" => "This variable is required to source the react application runtime bundle",
            "react_app" => "This variable is required to identify the react app in use"
        ]
    );
}

echo '<!DOCTYPE html>';

//GOOGLE TAG MANAGER HEADER SCRIPT
if (E::get('GOOGLE_TAG_MANAGER_ENABLED')) : ?>
    <!-- Google Tag Manager -->
    <script>
        (function(w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
            });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src =
                'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', '<?php echo E::get('GOOGLE_TAG_MANAGER_ID'); ?>');
    </script>
    <!-- End Google Tag Manager -->
<?php endif; ?>

<link href="<?= $reactUrl; ?>/vendors/style.css" rel="stylesheet">
<link href="<?= $reactUrl . "/" . $reactApp; ?>/style.css" rel="stylesheet">

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximun-scale=1" />
<meta http-equiv="X-UA-Compatible" content="ie=edge" />
<?php
if(Config::get("environment") === "production"){
?>
<script src="/assets/relic.js"></script>
<?php
}
$favicons = Config::get("site_favicon");
if(is_array($favicons)):
    foreach($favicons as $favicon):
        $sizes = $favicon['sizes'] ?? null;
        ?>
        <link rel="<?= $favicon['rel'] ?>" href="<?= $favicon['image'] ?>" <?php echo $sizes ? "size='$sizes'" : '';  ?> />
    <?php
    endforeach;
endif;
?>
<div id="app" class="app"></div>
<script>
    window.reactData = {
        csfr: '<?= $token; ?>',
        data: <?= $data; ?>,
        messages: {
            <?= implode(",", $messages); ?>
        }
    };
</script>

<script src="<?= $reactUrl; ?>/runtime/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?= $reactUrl; ?>/common-app/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?= $reactUrl; ?>/vendors/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?= $reactUrl . "/" . $reactApp; ?>/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>

<?php
//GOOGLE TAG MANAGER BODY SCRIPT
if (E::get('GOOGLE_TAG_MANAGER_ENABLED')) : ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo E::get('GOOGLE_TAG_MANAGER_ID') ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
<?php endif; ?>

</body>
