<!-- PROJECT & TRADE INFORMATION SIDE BY SIDE -->
<div class="info-row">
  <div class="card half-card">
    <div class="card-header">Project Information</div>
    <div class="card-body">
      <table width="100%">
        <tr>
          <td width="50%">
            <div class="info-item"><strong>Project Name:</strong> <?= htmlspecialchars($pdfData->get('project.name')) ?></div>
            <?php
            $pms = (array)($pdfData->get('project.project_managers') ?? []);
            $label = (count($pms) > 1) ? 'Project Managers' : 'Project Manager';
            ?>
            <div class="info-item">
              <strong><?= $label ?>:</strong>
              <?= $pms ? htmlspecialchars(implode(', ', $pms)) : 'N/A' ?>
            </div>
          </td>
          <td width="50%">
            <?php $projEnd = $pdfData->get('project.end'); ?>
            <div class="info-item"><strong>Completion Date:</strong> <?= $projEnd ? formatDate($projEnd) : '' ?></div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <div class="card half-card">
    <div class="card-header">Package Information</div>
    <div class="card-body">
      <table width="100%">
        <tr>
          <td width="50%">
            <div class="info-item"><strong>Package Name:</strong> <?= htmlspecialchars($pdfData->get('tender.label')) ?></div>
          </td>
          <td width="50%">
            <div class="info-item"><strong>Trade Category:</strong> <?= htmlspecialchars($pdfData->get('tender.trade_category') ?? 'N/A') ?></div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</div>
