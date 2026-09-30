<?php $report = $data ?? []; ?>

<table>
    <thead>
        <tr>
            <th>Company</th>
            <th>Contact name(s)</th>
            <th>Contact number</th>
            <th>Trades</th>
            <th>Activated</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($report as $tender) : ?>
            <tr>
                <td><?= $tender["company"] ?? "" ?></td>
                <td><?= $tender["contact_name"] ?? "" ?></td>
                <td><?= $tender["contact_number"] ?? "" ?></td>
                <td><?= $tender["trades"] ?? "" ?></td>
                <td><?= $tender["activated"] ?? "" ?></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
