<?php

use App\core\Config;

if (!isset($this)) {
  die();
}
$user = $this->getContext("user");
const ANZ_REGION_CODE = ['NZ', 'AUS'];
if (!is_object($user)) {
  //Something bad to happen here..
}
?>
<script type="text/javascript">
  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
</script>
<!-- Sidebar -->
<div class="c-sidebar mCustomScrollbar">
  <?php
  $membership = $user->getMembership();
  $ft = $membership->isFreeTrial();
  $links = Config::get("menu.sidebar");

  $allowed_pages = $membership->getAllowedPages();

  /*
   * The dashboard url can be either with the slug "dashboard" or just the dashboard url
   * SITEURL/main-contractor or SITEURL/main-contractor
   */
  $current_url = stripos(app()->request->url, dashboard_url()) !== false ? dashboard_url() : app()->request->url;
  ?>
  <div class="dash-nav">
    <?php foreach ($links as $label => $link) : ?>
      <?php
      $is_allowed = in_array($link['uid'], $allowed_pages);
      if ($membership->isCpt()) {
        if (in_array('cost_planning_tool', $link['hide_by_subscription'] ?? [], true)) {
          continue;
        }
      }
      if (!$is_allowed && $membership->hidePages()) {
        continue;
      }
      // Check if the region if the user is NZ to hide the menu
      $regionId = $user->getRegionId();
      $regionGroup = $user->getRegionGroupByRegionId($regionId);
      $regionCode = $regionGroup["code"];
      if ($link['uid'] == 'help' && in_array($regionCode, ANZ_REGION_CODE)) {
        continue;
      }
      if ($link['uid'] == 'help-anz' && !in_array($regionCode, ANZ_REGION_CODE)) {
        continue;
      }
      $free = is_callable($link["free"]) ? $link["free"]($membership) : $link["free"];
      $disabled = ($ft && !$free) && !$is_allowed && !$membership->hidePages();
      $style = ($disabled) ? "opacity:0.5;pointer-events:none" : "";
      $blank = isset($link["blank"]) ? "target='_blank'" : "";
      $selected = ($current_url == $link["url"]) ? 'selected' : '';
      ?>
      <li class="<?php echo $selected; ?>" style="<?php echo $style; ?>">
        <a href="<?php echo $link["url"]; ?>" <?php echo $blank; ?>>
          <span class="icon"><img src="<?php echo static_path("images/svg/navigation-menu/" . $link["img"]); ?>" /></span>
          <span class="icon-text"><?php echo $link["label"]; ?></span>
          <?php if ($disabled) : ?>
            <span class="label label-default hidden"></span>
          <?php endif; ?>
        </a>
      </li>
    <?php endforeach; ?>
    <li class="last"></li>
    <div class="noPadding">
      <a href="javascript:void(0)" class="area-expand">
        <img src="<?php echo static_path("images/svg/navigation-menu/collapse_menu.svg") ?>" alt="Collapse Menu" /> <span class="collapse-menu-text">Collapse Menu</span>
      </a>
    </div>
  </div>
</div>
<!-- End of Sidebar -->
