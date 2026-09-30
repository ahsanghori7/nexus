<?php

use Core\Middleware\Template\MissingVariableException;
use Core\System\Environment as E;

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
?>

<join-form styleTheme="SCA" tokenname="" tokenvalue="" action="<?php echo $vars['shape']->get("supply_chain_activation_url"); ?>" baseurl="<?php echo E::get('PROSPER_WORDPRESS_SITE_URL'); ?>" relaybaseurl="<?php echo E::get('SITE_URL'); ?>" login="<?php echo E::get("LOGIN_URL"); ?>" defaultValues='<?php echo $vars['shape']->get("supply_chain_form_data"); ?>'>
</join-form>
<script src="<?php echo $webcomponentsUrl; ?>"></script>
