<?php $report = $data ?? []; ?>

<?php foreach ($report as $tender) : ?>
    <table class="inner">
        <tr>
            <th colspan="4"><?= $tender["tender"] ?? "" ?></th>
            <th colspan="2"><?= $tender["awarded"] ?? "" ?></th>
        </tr>
        <tr>
            <th>Company</th>
            <th>Quotation Price</th>
            <th>Measured Work</th>
            <th>Prelims</th>
            <th>Prov Sums / Other Items</th>
            <th>Programme (Weeks)</th>
        </tr>
        <tbody>
            <?php foreach ($tender["quotes"] as $qid => $quote) : ?>
                <tr>
                    <td class="quotes-company"><?= $quote["company"] ?? "" ?></td>
                    <td><?= $quote["quotation_price"] ?? "" ?></td>
                    <td><?= $quote["measured_work"] ?? "" ?></td>
                    <td><?= $quote["prelims"] ?? "" ?></td>
                    <td><?= $quote["prov_sums_others"] ?? "" ?></td>
                    <td><?= $quote["programme"] ?? "" ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <br />
<?php endforeach; ?>
