    <footer>
      Report generated on <?= formatDate($pdfData->get('tender_recommendation.created_at')) ?> by <?= htmlspecialchars($pdfData->get('author.display_name')) ?><br>
      Source: Construction Management System
    </footer>
  </div>
</body>

</html>
