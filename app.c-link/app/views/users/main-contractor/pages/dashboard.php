<?php
if (!isset($this)) {
    die();
}
?>

<?php $message = $this->getContext("message", "") ?>

<?php if ($message): ?>
    <div class="custom-alert bottom-right error">

        <figure>
            <img src="<?php echo static_path('images/png/wrong.png'); ?>" class="img-fluid">
        </figure>

        <div class="content">

            <p class="title">Error!</p>
            <p><?php echo $message; ?></p>

        </div>

    </div>
<?php endif; ?>

<div class="col-12 layout-wrapper d-flex flex-wrap justify-content-between align-content-center">

    <div class="c-box d-flex flex-wrap align-content-start" id="activity-box">

        <div class="col-12 c-box-heading">
            <p><i class="far fa-hourglass"></i> Activity</p>
        </div>

        <div class="col-12 c-box-content activity-feed-wrapper">

            <div class="no-activities d-none">
                <figure>
                    <img src="<?php echo static_path('images/svg/chill.svg'); ?>" class="img-fluid">
                </figure>
                <p class="heading">Great work</p>
                <p>You have no new notifications so it's time to relax.</p>
            </div>

        </div>


    </div>

    <div class="c-box d-flex flex-wrap align-content-start" id="calendar-box">

        <div class="col-12 c-box-heading">
            <p><i class="far fa-calendar-alt"></i> General Calendar</p>
        </div>

        <div class="col-12 c-box-content">

            <div id="calendar-dashboard" class="calendar"></div>

        </div>

    </div>

</div>
