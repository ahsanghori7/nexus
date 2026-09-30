<?php
if (!isset($this)) {
    die();
}
?>
<?php $message = $this->getContext("message"); ?>

<?php if ($message && isset($message["content"])): ?>
    <div class="custom-alert bottom-right d-flex close-notification">

        <figure>
            <img src="<?php echo static_path('images/png/wrong.png'); ?>" class="img-fluid">
        </figure>

        <div class="content position-relative">


            <h4 class="text-danger"><?php echo $message["type"]; ?></h4>
            <p><?php echo $message["content"]; ?></p>

        </div>

        <button id="close" type="button" class="close position-absolute" style="top: 2px; right: 8px" aria-label="Close" onclick="closeMe()">
            <span aria-hidden="true">&times;</span>
        </button>

        <script>
            function closeMe() {
                let closeNotification = document.querySelector('.close-notification');
                closeNotification.remove();
            }
        </script>

    </div>
<?php endif; ?>
