# document-config

Repository for all Doc Creator configuration JSON files.

## Working Locally

1. **Install Dependencies**
   Run `composer install` (Note: This may not work until the Document Creator folder is properly dockerized. For now, ask Dan for the vendor files).

2. **Build a PDF**
   Run the following command to generate a PDF based on a specific configuration file:
   ```bash
   php cli.php [ROUTE_TO_JSON]

   // EXAMPLE
   php cli.php orders/x-construct/x-construct.json
   ```
   This command will build the PDF using the specified JSON configuration.

3. **Access Documents**
   To access a new document you're working on inside app.c-link, make sure to add it to your C-LINK user in the `document_owner_mapping` table.
