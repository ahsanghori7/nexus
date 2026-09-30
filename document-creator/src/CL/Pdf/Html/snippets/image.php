<?php

$image = $this->getElement();

$src = "";
$class = "";
if ($props = $image->getProps()) {
    $class = $props["className"] ?? $props["class"] ?? "";
    $src = $props["src"] ?? "";
}

?>

<img src="<?= $src; ?>" class="<?= $class; ?>" />
