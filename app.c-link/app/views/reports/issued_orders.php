<?php

const ANZ_REGION_CODE = ['NZ', 'AUS'];

$code = $data["region_code"] ?? "";

$currencySymbol = "£";
switch ($code) {
    case "NZ":
    case "AUS":
        $currencySymbol = "$";
        break;
    case "UK":
        $currencySymbol = "£";
        break;
    default:
        $currencySymbol = "€";
        break;
}
?>
<?php foreach ($data ?? [] as $item) { ?>
    <?php $entries = $item['entries'] ?? []; ?>
    <h3><?= $item["tender"]["label"] ?? "" ?></h3>
    <table>
        <thead>
            <tr>
                <th style="width: 12%;">Order No</th>
                <th style="width: 13%;">Order Date</th>
                <th style="width: 45%;">Company</th>
                <th style="width: 15%;">Order Value</th>
                <th style="width: 15%;">Status</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($entries as $order) : ?>
                <?php if (empty($order)) {
                    continue;
                } ?>
                <?php $orderDate = new DateTime($order["created_at"]); ?>
                <?php $price = number_format($order["value"], 2, '.', ','); ?>
                <tr>
                    <td><?= $order["order_nr"] ?? "" ?></td>
                    <td><?= $orderDate->format("d/m/Y") ?? "" ?></td>
                    <td><?= $order["subcontractor"]['name'] ?? "" ?></td>
                    <td><?= $currencySymbol . $price ?></td>
                    <td><?= $order["status"] ?? "" ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <br />
<?php } ?>
