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
- **Unit vs Integration:** Unit tests live under `tests/Unit/**` and must avoid live MySQL/migrations. Use the in-memory doubles in `tests/Support/Fakes` and `tests/TestDoubles` (e.g., `FakeDB`, `FakeRedBean`) or PHPUnit mocks to isolate behaviour. DB-dependent checks belong in `tests/Integration/**`.
- **Running suites:** `composer test:unit` (or `make account_service_unittests`) runs only the Unit suite with coverage and threshold enforcement (`COVERAGE_MINIMUM` defaults to 50). `composer test:integration` (or `make account_service_integrationtests`) runs the Integration suite; run the appropriate migrations first if those tests need schema data. `composer test` runs both suites sequentially.
- **Do not patch production code for coverage.** Swap collaborators for fakes/mocks instead of reaching for real persistence.
- **Reviewer checklist:** Unit suite produces no DB/migration logs; new Unit tests don’t touch persistence; any DB-dependent checks live in `tests/Integration` with clear setup notes.

## Code Quality Checks

This project includes a variety of development tools to help maintain code quality and consistency:

- **prettify**: Uses PHP-CS-Fixer to automatically correct code to match the project's coding standards.
  > Usage: `composer prettify`

- **prettify-check**: Checks the code against the project's coding standards without making any changes using PHP-CS-Fixer.
  > Usage: `composer prettify-check`

- **static-analysis**: Uses PHPStan for static code analysis. It checks for type safety and other potential issues in the code. This is set to run at level 5 in the _phpstan.neon_ file.
  > Usage: `composer static-analysis`

- **code-quality-checks**: A composite command that runs both the prettify check and static analysis.
  > Usage: `composer code-quality-checks`

## Pre-Commit hooks
[Pre-commit](https://pre-commit.com/index.html#intro) is a tool used to manage and maintain multi-language pre-commit hooks. It helps in identifying simple issues before submission to code review. Our PHP repository leverages pre-commit to ensure code quality and consistency.
Currently running php-stan and php-cs-fixer.

### Installation and Setup

To get started with pre-commit in this repository, follow these steps:

1. **Install pre-commit**: If you haven't already installed pre-commit on your system, you need to install it first. For detailed installation instructions, refer to the [official pre-commit installation documentation](https://pre-commit.com/#install). Generally you could do
```shell
pip install pre-commit
```
or use [homewbrew](https://brew.sh/):
```shell
brew install pre-commit
```
2. **Install the pre-commit Hooks**: With pre-commit installed, you now need to set up the hooks defined in the `.pre-commit-config.yaml` file. Run the following command: `
```shell
pre-commit install
```
Now each time you commit the commands on the config will be run on the changed files.
You can run manually on ALL files by doing:
```shell
pre-commit run --all-files
```
Or skip this pre-commit checks by adding a flag in the commit like:
```shell
git commit --no-verify
```
