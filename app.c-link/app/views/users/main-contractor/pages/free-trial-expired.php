<?php
$isTrialExpired = $data["trial_expired"] ?? false;
$expiration_days = $data["expiration_days"] ?? 0;
?>
<div class="col-12 layout-wrapper d-flex flex-wrap justify-content-between align-content-center">
  <div style="padding: 5% 3% 0% 3%" class="col-12 layout-wrapper d-flex flex-wrap justify-content-between">
    <div class="c-box col-12 d-flex flex-wrap align-content-start">
      <?php if(!$isTrialExpired){ ?>
        <p>Your trial will expire in <?php echo $expiration_days;?> days. </p>
      <?php }else{ ?>
        <div class="col-12" style="text-align: center">
          <div style="margin: 0 auto" class="col-xs-12 col-lg-5 media">
            <img src="<?php echo static_path('images/svg/get-onboard.svg');?>" class="img-responsive">
          </div>
          <div class="col-xs-12 col-lg-12 content">
            <h3>Your trial period has expired</h3>
            <p>Ready to maximise profitability on your next project? Click the upgrade button below to become a C-Link member and start procuring with our platform.</p>
            <div class="d-flex">
              <a style="margin:0 auto;display: block;border: none;padding: 10px;border-radius: 5px;font-size: 0.85rem;" class="action-btn cta" href="/pricing">Upgrade now</a>
            </div>
          </div>
        </div>

      <?php } ?>
    </div>
  </div>
</div>
