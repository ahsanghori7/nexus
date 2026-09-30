<?php
if (!isset($this)) {
    die();
}
$user = $this->getContext("user");
$regionId = $user->getRegionId();
$regionGroup = $user->getRegionGroupByRegionId($regionId);
$regionCode = $regionGroup["code"];
$membership = $user->getMembership();
$isCostPlanningTool = $membership->isCPT();
?>
<div class="c-main">
    <header class="c-header-simple d-flex align-items-center justify-content-between">
        <div class="c-header-logo">
            <a href="/">
                <img src="<?php echo static_path("images/c-link-min-logo.svg") ?>" alt="C-link Favicon" />
            </a>
        </div>
        <div class="c-header-menu d-flex justify-content-center align-items-center">
            <div class="c-menu-item">
                <?php if ($user::isAdministrator()) : ?>
                    <a class="admin-btn" href="<?php echo $this->getSiteUrl("main-contractor/back_to_admin"); ?>">Back to Admin</a>
                <?php endif; ?>
            </div>
            <?php if (!$isCostPlanningTool) : ?>
                <div class="c-menu-item round">
                    <a class="d-flex justify-content-center align-items-center" href="javascript:void(0);">
                        <img src="<?php echo static_path("images/svg/bell-icon.svg") ?>" alt="Alert Icon">
                    </a>
                </div>
                <?php if (!in_array($regionCode, ANZ_REGION_CODE)) : ?>
                    <div class="c-menu-item round dialog">
                        <style type="text/css">
                            .c-menu-item comms-icon {
                                padding-right: 16px;
                            }
                        </style>
                        <comms-icon height="48px" iwidth="24px" width="48px" icon="/static/images/svg/dialog.svg" url="/main-contractor/inbox" api="<?= COMMS_URL ?>"></comms-icon>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
            <div class="c-menu-item c-dropdown round profile-user d-flex justify-content-center align-items-center">
                <a class="d-flex justify-content-center align-items-center" href="javascript:void(0);">
                    <?php echo $user->getNameInitials(); ?>
                </a>
                <i class="fa fa-chevron-down" aria-hidden="true"></i>
                <div class="c-dropdown-content">
                    <span>
                        <?php if ($membership->isFreeTrial() && !$isCostPlanningTool) : ?>
                            <a class="action-btn cta" href="/pricing">Upgrade now</a>
                            <a class="cta main-btn" href="<?php echo getClinkUrl("book-demo"); ?>">Book a demo</a>
                        <?php endif; ?>
                        <a href="<?php echo SITE_URL . "/main-contractor/profile" ?>">Update profile</a>
                        <a href="<?php echo logout_url(); ?>" class="red">Log out</a>
                    </span>
                </div>
            </div>
        </div>
    </header>
