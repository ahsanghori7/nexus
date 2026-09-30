    <!-- SUBCONTRACTOR DETAILS -->
    <div class="card">
      <div class="card-header">Recommended Subcontractor Details</div>
      <div class="card-body">
        <table width="100%">
          <tr>
            <td width="50%">
              <div class="info-item"><strong>Subcontractor Name:</strong> <?= htmlspecialchars($pdfData->get('subcontractor.name')) ?></div>
              <div class="info-item"><strong>Company Registration Number:</strong> <?= htmlspecialchars($pdfData->get('subcontractor.registration_number')) ?></div>
              <div class="info-item"><strong>Business Address:</strong> <?= htmlspecialchars($pdfData->get('subcontractor.business_address')) ?></div>
            </td>
            <td width="50%">
              <div class="info-item"><strong>Contact Name:</strong> <?= htmlspecialchars($pdfData->get('subcontractor_contact.display_name')) ?></div>
              <div class="info-item"><strong>Job Title:</strong> <?= htmlspecialchars($pdfData->get('subcontractor_contact.job_title')) ?></div>
              <div class="info-item"><strong>Phone:</strong> <?= htmlspecialchars($pdfData->get('subcontractor_contact.phone')) ?></div>
              <div class="info-item"><strong>Email:</strong> <?= htmlspecialchars($pdfData->get('subcontractor_contact.email')) ?></div>
            </td>
          </tr>
        </table>
      </div>
    </div>
