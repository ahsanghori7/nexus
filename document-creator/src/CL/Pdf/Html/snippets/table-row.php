<?php
$children = $this->getElement()->getChildren();
$cols = count($children);

if (!function_exists('internalRender')) {
    function internalRender($child)
    {
        $render = "";
        if (count($child->getChildren()) !== 0) {
            foreach ($child->getChildren() as $innerChild) {
                $render .= $innerChild->render();
            }
        } else {
            $render .= $child;
        }
        return $render;
    }
}
?>

<?php foreach ($children as $i => $child) : ?>
    <?php
    if ($child !== null && $child->getProps() !== null && isset($child->getProps()['class'])) { ?>
        <td class="<?= $child->getProps()['class']; ?> col-<?= $i; ?> td-<?= $cols; ?>">
            <?php echo internalRender($child); ?>
        </td>
    <?php } else { ?>
        <td class="col-<?= $i; ?> td-<?= $cols; ?>">
            <?php echo internalRender($child); ?>
        </td>
    <?php } ?>
<?php endforeach; ?>
