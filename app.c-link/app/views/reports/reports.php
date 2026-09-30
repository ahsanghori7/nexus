<?php $styles = $data['styles'] ?? []; ?>
<?php $report = $data['report'] ?? []; ?>
<?php $name = $data['name'] ?? ''; ?>
<?php $isTenderReport = !empty($data['is_tender_report']);?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <?php foreach ($styles as $style) : ?>
        <link rel="stylesheet" href="<?= $style ?? "" ?>">
    <?php endforeach; ?>
</head>

<body>
    <?php if (!$isTenderReport): ?>
        <h3><?= $name ?></h3>
    <?php endif; ?>
    <?= $report ?>
</body>

</html>
