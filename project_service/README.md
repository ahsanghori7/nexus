# Project Service

The service application is structured as such:

    ├── app                      # Making requests to different services
        ├── connections.php      # Database configurations
        ├── dependencies.php     # Depedencies classes ex: Logger
        ├── middleware.php       # Loading middleware classes
        ├── repositories.php     # Load repositories
        ├── routes.php           # Store all routes for our service
        ├── settings.php         # Settings based on different environments
    ├── dev_resources            # Used to run http commands through phpstorm editor, only for developers
    ├── logs                     # Store log files
    ├── public                   # Public files
    ├── src                      # Application core files
    ├── tests                    # Application tests files
    ├── var                      # Storing cache files
    ├── vendor                   # 3rd party libraries
    ├── .env                     # Configuration file
    ├── .gitignore               # Git ignore file
    ├── README.md                # README
    ├── cli.php                  # Main cli file
    ├── composer.json            # Main composer service file


## Setup

Make sure that you already have Pandora working by following the documentation in the pandora repo.

    https://github.com/construction-link/pandora/blob/main/README.md

If Pandora is running in your local, run the following command to install app.c-link

    ./bin/install project_service                   #normal installation

    ./bin/install project_service --nodb            #to install without deleting existing database files

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
- **Unit vs Integration:** Unit tests live under `tests/Unit/**` and may not touch MySQL, Phinx migrations, or other real infrastructure. Integration tests belong in `tests/Integration/**` and can rely on the DB after `tests/SetupDatabase.php` provisions schemas/fixtures.
- **Running suites:** `composer test:unit` (or `make project_service_unittests`) runs only the Unit suite with coverage + threshold enforcement (`COVERAGE_MINIMUM` defaults to 50). `composer test:integration` (or `make project_service_integrationtests`) runs integration tests after bootstrapping the database. `composer test` runs both suites sequentially.
- **Mocking guidance:** Prefer PHPUnit mocks or simple in-memory doubles (e.g., `Tests\TestDoubles\FakeCollection`) for repositories/adapters instead of real MySQL calls. Do not change production code just to satisfy coverage—swap collaborators for fakes instead.
- **Reviewer checklist:** Unit suite runs without DB/migration logs; new Unit tests avoid persistence; any DB-dependent checks sit in `tests/Integration` and clearly state their setup requirements.
- **Env fixtures:** Use the committed `.env.test.bad` file or per-test temp env files loaded via `Environment::loadEnvFile()` to keep runs deterministic without touching your real `.env`.

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
