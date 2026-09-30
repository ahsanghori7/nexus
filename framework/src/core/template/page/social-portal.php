<!DOCTYPE html>
<?php

use Core\Middleware\Template\MissingVariableException;
use Core\System\Environment as E;
use Core\Config;

$vars   = get_defined_vars();
$webcomponentsUrl = $vars["webcomponents_url"] ?? false;

if (!$webcomponentsUrl) {
    throw new MissingVariableException(
        __FILE__,
        [
            "webcomponents_url" => "This variable is required to identify the react app in use",
        ]
    );
}

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
if(is_array($favicons)):
    foreach($favicons as $favicon):
        $sizes = $favicon['sizes'] ?? null;
        ?>
        <link rel="<?= $favicon['rel'] ?>" href="<?= $favicon['image'] ?>" <?php echo $sizes ? "size='$sizes'" : '';  ?> />
    <?php
    endforeach;
endif;
?>
<link href="./assets/fonts.css" rel="stylesheet">

<join-form styleTheme="SPA" tokenname="" tokenvalue="" action="<?php echo E::get('SIGNUP_URL');?>" baseurl="<?php echo E::get('PROSPER_WORDPRESS_SITE_URL');?>" relaybaseurl="<?php echo E::get('SITE_URL');?>" login="<?php echo E::get("LOGIN_URL");?>">
</join-form>
<script src="<?php echo $webcomponentsUrl;?>"></script>


<?php
//GOOGLE TAG MANAGER BODY SCRIPT
if (E::get('GOOGLE_TAG_MANAGER_ENABLED')) : ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo E::get('GOOGLE_TAG_MANAGER_ID') ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
<?php endif; ?>

<style type="text/css">
    body{
        margin:0;
    }
</style>

</body>
