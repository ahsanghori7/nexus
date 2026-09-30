    <!-- PRICING SUMMARY -->
    <div class="card">
      <div class="card-header">Pricing Summary</div>
      <div class="card-body">
        <table>
          <thead>
            <tr>
              <th>Subcontractor Name</th>
              <th>Subcontractor Sum</th>
              <th>Recommended Value (£)</th>
              <th>Budget</th>
              <th>Profit / (Loss)</th>
            </tr>
          </thead>
          <tbody>
            <?php $budget = (int) ($pdfData->get('tender.tender_return') ?? 0); ?>
            <?php foreach ($pdfData->get('all_transactions') as $transaction): ?>
            <?php
              $isRecommended = !empty($transaction['is_recommended']);
              $cellBg        = $isRecommended ? 'background-color: rgba(0,128,128,0.08);' : '';
              $firstCellBg   = $isRecommended ? 'background-color: rgba(0,128,128,0.08); border-left: 4px solid #4cc0ad;' : '';
              $rowBudget     = isset($transaction['budget']) ? (int)$transaction['budget'] : (int)$pdfData->get('tender.budget');
              $profit        = isset($transaction['profit']) ? (int)$transaction['profit'] : ($rowBudget - (int)$transaction['forecast']);
              $isNegative    = $profit < 0;
              $formattedProfit = formatCurrency(abs($profit));
              $displayProfit = $isNegative ? '(' . $formattedProfit . ')' : $formattedProfit;
            ?>
            <tr>
              <td style="<?= $firstCellBg ?>">
                <?= htmlspecialchars($transaction['subcontractor_name']) ?>
                <?php if ($isRecommended): ?>
                  <span class="badge" style="background-color: #4cc0ad; color: #ffffff; border-radius: 10px; margin-left: 6px;">Recommended</span>
                <?php endif; ?>
              </td>
              <td style="<?= $cellBg ?>"><?= formatCurrency($transaction['price']) ?></td>
              <td style="<?= $cellBg ?>"><?= formatCurrency($transaction['forecast']) ?></td>
              <td style="<?= $cellBg ?>"><?= formatCurrency($rowBudget) ?></td>
              <td style="<?= $cellBg ?>">
                <span style="color: <?= $isNegative ? '#d32f2f' : '#2e7d32' ?>; font-weight: 600;">
                  <?= $displayProfit ?>
                </span>
              </td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
