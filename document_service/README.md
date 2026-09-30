## Setup

Make sure that you already have Pandora working by following the documentation in the pandora repo.

    https://github.com/construction-link/pandora/blob/main/README.md

If Pandora is running in your local, run the following command to install document_service

    ./bin/install document_service                  #normal installation

    ./bin/install document_service --nodb           #to install without deleting existing database files

## DB Schema generation
To generate the schema automatically we use [schemaspy](https://schemaspy.readthedocs.io/en/latest/).
In order to make it work, you need:
1. Make sure pandora has the mysql running. Needed as it assumes it will find mysql in pandora_mysql inside the pandora_web docker network.
2. Review your .env make sure the _DB_HOST_ is pointing to the pandora-mysql or equivalent on docker
3. You should have applied locally the latest migration you want to generate the schema for
4. Run `make db_diagram`.

Files will be generated at `db/diagrams`
Note: The output seems very chatty with some errors, but it should be working.

## DB Migrations
For DB migrations we are using [Phinx](https://book.cakephp.org/phinx/0/en/index.html).
How to work with migrations? read more [HERE!!!](./docs/migrations.md)

## Testing
- **Layout:** Unit specs live in `tests/Unit/**`; DB or migration-dependent specs belong in `tests/Integration/**`; shared sample data can sit in `tests/Fixtures/`.
- **Running suites:** `make document_service_unittests` (or `composer test:unit`) runs only the Unit suite with coverage and threshold enforcement (`COVERAGE_MINIMUM` defaults to 50). `make document_service_integrationtests` (or `composer test:integration`) runs Integration; run migrations first if those tests need schema. `composer test` runs both.
- **Unit rules:** No Phinx, no live MySQL adapters, and no `SetupDatabase` in Unit tests—swap collaborators for fakes/mocks instead.
- **Mocking example:** Use PHPUnit doubles in place of repositories/adapters instead of touching the DB:
```php
$repo = $this->createMock(App\Infrastructure\Persistence\Repository::class);
$repo->method('find')->willReturn(['id' => 1]);
```
- **Reviewer checklist:** Unit suite emits no DB/migration logs; Integration tests clearly state any schema/setup they require; don’t edit production code just to improve coverage.
