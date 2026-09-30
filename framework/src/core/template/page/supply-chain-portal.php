<!DOCTYPE html>
<?php

use Core\System\Environment as E;
use Core\Config;

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

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximun-scale=1" />
<meta http-equiv="X-UA-Compatible" content="ie=edge" />

<?php
$favicons = Config::get("site_favicon");
if (is_array($favicons)) :
    foreach ($favicons as $favicon) :
        $sizes = $favicon['sizes'] ?? null;
?>
        <link rel="<?= $favicon['rel'] ?>" href="<?= $favicon['image'] ?>" <?php echo $sizes ? "size='$sizes'" : '';  ?> />
<?php
    endforeach;
endif;
?>
<link href="/assets/fonts.css" rel="stylesheet">
<link href="/assets/scp.css" rel="stylesheet">

<div class="supply-chain-portal-container">
    <div id="supply-chain-welcome-container">
        <?php include("supply-chain-welcome.php"); ?>
    </div>
    <div id="sign-up-form-container">
        <?php include("sign-up-form.php"); ?>
    </div>
</div>

<?php
//GOOGLE TAG MANAGER BODY SCRIPT
if (E::get('GOOGLE_TAG_MANAGER_ENABLED')) : ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo E::get('GOOGLE_TAG_MANAGER_ID') ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
<?php endif; ?>

<style type="text/css">
    body {
        margin: 0;
    }
</style>
</body>
