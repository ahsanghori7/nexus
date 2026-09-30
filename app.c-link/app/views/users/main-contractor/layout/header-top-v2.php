<?php

use App\core\Environment as Env;

if (!isset($this)) {
    die();
}

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="copyright" content="Construction Link Limited">
    <meta name="description" content="Login to your C-Link account to start managing your project or identifying new work to tender.">
    <meta name="subject" content="Software platform for construction procurement">
    <?php
    if (Env::getValue("ENVIRONMENT") === "production") {
    ?>
        <script type="text/javascript" src="<?php echo static_path('js/relic.js'); ?>"></script>
    <?php
    }
    ?>
    <link rel="icon" href="<?php echo static_path('images/favicon.png'); ?>" sizes="32x32" />
    <link rel="icon" href="<?php echo static_path('images/favicon.png'); ?>" sizes="192x192" />
    <link rel="apple-touch-icon" href="<?php echo static_path('images/favicon.png'); ?>" />
    <meta name="msapplication-TileImage" content="<?php echo static_path('images/favicon.png'); ?>" />
    <?php $title = $this->getContext("title", "Construction Procurement Platform | C-Link"); ?>
    <?php $this->getSnippet("sentry"); ?>
    <title><?php echo $title; ?></title>

    <?php if ($this->noFollowTags()): ?>
        <meta name='robots' content='noindex, nofollow' />
    <?php endif; ?>

    <!-- Google Tag Manager -->
    <?php if ($this->googleTagManagerEnabled()): ?>

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
            })(window, document, 'script', 'dataLayer', '<?php echo $this->getGoogleTagManagerId(); ?>');
        </script>
    <?php endif; ?>
    <!-- End Google Tag Manager -->
</head>

<body>

    <!-- Google Tag Manager (noscript) -->
    <?php if ($this->googleTagManagerEnabled()): ?>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo $this->getGoogleTagManagerId(); ?>"
                height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <?php endif; ?>
    <!-- End Google Tag Manager (noscript) -->
