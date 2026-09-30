<?php
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
  <meta name="subject" content="Software platform for construction procurement">
  <link rel="icon" href="<?php echo static_path('images/favicon.png');?>" sizes="32x32" />
  <link rel="icon" href="<?php echo static_path('images/favicon.png');?>" sizes="192x192" />
  <link rel="apple-touch-icon" href="<?php echo static_path('images/favicon.png');?>" />
  <meta name="msapplication-TileImage" content="<?php echo static_path('images/favicon.png');?>" />
  <?php $meta = $this->getContext("meta", []); ?>
  <?php foreach ($meta as $tag): ; ?>
      <?php echo $tag; ?>
  <?php endforeach; ?>

    <?php $this->getSnippet("sentry"); ?>

  <?php $title = $this->getContext("title", "Construction Procurement Platform | C-Link"); ?>
  <title><?php echo $title; ?></title>

  <?php if($this->noFollowTags()): ?>
   <meta name='robots' content='noindex, nofollow' />
  <?php endif; ?>

  <!-- Google Tag Manager -->
  <?php if($this->googleTagManagerEnabled()): ?>

      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','<?php echo $this->getGoogleTagManagerId();?>');</script>
  <?php endif; ?>
  <!-- End Google Tag Manager -->

    <!-- Dependencies -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
  <link rel="stylesheet" href="<?php echo static_path();?>/css/style.css">

    <?php if($this->reactEnabled()): ?>
  <!-- React Dependencies -->
  <script src="<?php echo $this->getReact(); ?>" crossorigin></script>
  <script src="<?php echo $this->getReactDom(); ?>" crossorigin></script>
  <script type="text/javascript" src="<?php echo static_path();?>react/index.js"></script>
<?php endif; ?>

  <!-- JS Dependencies -->
  <script
    src="https://code.jquery.com/jquery-3.5.1.js"
    integrity="sha256-QWo7LDvxbWT2tbbQ97B53yJnYU3WhH/C8ycbRAkjPDc="
    crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.min.js" integrity="sha384-w1Q4orYjBQndcko6MimVbzY0tgp4pWB4lZ7lr30WKz0vr/aWKhXdBNmNb5D92v7s" crossorigin="anonymous"></script>

  <script type="text/javascript">

      $(function () {
          $('[data-toggle="popover"]').popover();
      })

  </script>



</head>

<body>

<!-- Google Tag Manager (noscript) -->
<?php if($this->googleTagManagerEnabled()): ?>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo $this->getGoogleTagManagerId();?>"
                  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<?php endif;?>
<!-- End Google Tag Manager (noscript) -->

<?php $this->getSnippet("notifications"); ?>
