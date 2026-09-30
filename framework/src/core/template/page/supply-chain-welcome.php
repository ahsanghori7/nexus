<?php

use Core\System\Environment as E;

$vars   = get_defined_vars();
$supplyChain = $vars['shape']->get("supply_chain_form_data");

if (is_null($supplyChain)) {
    throw new \Exception("Invalid supply chain data");
}

$idCompany = (string)json_decode($supplyChain, true)["company_id"];
$idHash = md5($idCompany);

$s3Url = E::get('AWS_S3_ASSET_URL');
$prefix = E::get('ENV');
$supplyChainVideo = "$s3Url/production/prosper/videos/Supply+Chain.mp4";
$prosperLogo = "$s3Url/$prefix/prosper/images/prosper-logo.svg";
$clinkLogo = "$s3Url/production/c-link/images/clink-logo.svg"; // TODO: Add logo for staging env

?>
<input id="s3-url-source" type="hidden" value="<?php echo "$s3Url/$prefix/"; ?>" />
<input id="id-company-hash" type="hidden" value="<?php echo $idHash; ?>" />
<div class="form-header">
    <div class="form-logo">
        <img src="<?php echo $prosperLogo; ?>" class="custom-logo" alt="">
    </div>
    <div class="form-name scs-form-name">
        <div class="account-activation">Account activation</div>
        <div class="powered-by">
            <span class="powered-by-text">powered by</span>
            <span>
                <img src="<?php echo $clinkLogo; ?>" alt="C-link logo">
            </span>
        </div>
    </div>
</div>
<div class="form-body">
    <div class="sc-title">
        <h2>Welcome to Prosper</h2>
    </div>
    <div class="sc-description">
        <div class="sp-logo">
            <img id="sp-company-logo" />
        </div>
        <div class="sp-content">
            <p id="p1">As part of our tendering and subcontract management we are using <b>C-Link</b> and <b>Prosper</b> to manage our projects.</p>
            <p id="p2">To get started we will need you to <a href="#get-started-btn"><u>activate</u></a> your Prosper account so you can start receiving tenders and project communication from us.</p>
        </div>
    </div>
    <div class="sc-video-title">
        <b>New to Prosper?</b> Find out more by watching the video below:
    </div>
    <div class="sc-video">
        <script src="https://fast.wistia.com/embed/medias/xo066abb2x.jsonp" async></script>
        <script src="https://fast.wistia.com/assets/external/E-v1.js" async></script>
        <div class="wistia_responsive_padding" style="padding:56.25% 0 0 0;position:relative;">
            <div class="wistia_responsive_wrapper" style="height:100%;left:0;position:absolute;top:0;width:100%;">
                <div class="wistia_embed wistia_async_xo066abb2x videoFoam=true" style="height:100%;position:relative;width:100%">
                    <div class="wistia_swatch" style="height:100%;left:0;opacity:0;overflow:hidden;position:absolute;top:0;transition:opacity 200ms;width:100%;"><img src="https://fast.wistia.com/embed/medias/xo066abb2x/swatch" style="filter:blur(5px);height:100%;object-fit:contain;width:100%;" alt="" aria-hidden="true" onload="this.parentNode.style.opacity=1;" /></div>
                </div>
            </div>
        </div>
    </div>
    <div class="sc-info">
        <p><b>To get started simply click the button below</b></p>
        <p>It’s easy and only takes a few minutes!</p>
    </div>
    <div class="sc-start-btn">
        <button id="get-started-btn">Get started</button>
    </div>
</div>
<script src="/assets/scp.js"></script>
