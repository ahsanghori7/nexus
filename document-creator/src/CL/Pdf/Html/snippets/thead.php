<?php
    $cols = $this->getElement()->getChildren();
    $colCount = count($cols);
?>

<?php foreach($cols as $i => $col): ?>
        <th style="text-align: left;"><?= $col->render(); ?></th>
<?php endforeach; ?>
