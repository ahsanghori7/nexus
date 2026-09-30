<?php

if (!isset($this)) {
  die();
}

if ($this->getContext("logged_in")) {
  $message = "Your account was successfully upgraded!";
  $action  = "";
  $link =  SITE_URL . '/main-contractor';
  $button = " Account";
} else {
  $ft = isset($_GET["free-trial"]) ? true : false;
  $message = ($ft) ? "Your free trial was successfully created."  : "Your account was successfully created.";
  $action = "Please login into your account with your credentials.";
  $link =  SITE_URL . '/login';
  $button = " Login";
}
?>
<div class="c-content d-flex align-items-center justify-content-center">
  <div class="success">
    <figure class="avatar">
      <img src="<?php echo static_path('images/svg/rocket.svg'); ?>" alt="C-Link rocket">
    </figure>
    <h1>Congratulations</h1>
    <article>
      <p><?php echo $message; ?></p>
      <p><?php echo $action; ?></p>
    </article>
    <a href="<?php echo $link; ?>"><button class="main-btn"><i class="fas fa-unlock-alt"></i><?php echo $button; ?></button< /a>
  </div>
</div>
