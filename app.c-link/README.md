# App C-link v1.25.10-v2

The application is structured as such:

    ├── app                          # Main application
        ├── Api                      # Making requests to different services
        ├── Cli                      # Is use to run cli commands
        ├── config                   # Configuration files
        ├── controllers              # Controllers for contractors, documents, download, etc
        ├── core                     # Application core files
        ├── Cron                     # Cron files
        ├── DocCreator               # Document creator that handles the document creator export to PDF
        ├── factories                # User factory
        ├── Factory                  # User factor and shortcode factory
        ├── helpers                  # Internal functions
        ├── log                      # Storing logs
        ├── Models                   # All models files
        ├── Script                   # Scrips files
        ├── Utility                  # Different utilities classes
        ├── Views                    # Render our html pages
    ├── public                       # Public files
    ├── vendor                       # 3rd party libraries
    ├── .env                         # Configuration file
    ├── .gitignore                   # Git ignore file
    ├── README.md                    # README
    ├── bootstrap.php                # Configuration file for cli
    ├── cli.php                      # Main cli file
    ├── composer.json                # Main composer APP file
    ├── package.json                 # Storing functional metadata
    ├── script.php                   # Running scripts files through cli


### Setup

Make sure that you already have Pandora working by following the documentation in the pandora repo.

    https://github.com/construction-link/pandora/blob/main/README.md

If Pandora is running in your local, run the following command to install app.c-link

    ./bin/install app.c-link

## Configuration
These are some important .env values to consider:
* _**ENV_DOCKER_API_PORT**_ This is used when running via docker. Then you'd access this service as _http://app.c-link.local:<ENV_DOCKER_API_PORT>/_
* **_APP_CLINK_URL_** This is specially important if running via docker. You'd need to append the relevant port used on ENV_DOCKER_API_PORT. Example: http://app.c-link.local:8085/
Also consider that the bundles passed on **REACT_SERVICE_HOST** and **REACT_SERVICE_V2_HOST** should also generate urls correctly. Mostly this is an issue if using ports (defaults to 8085 locally).

But if you are using pandora container, which is an apache server proxing the request so that it is on port 80, take that into consideration too. What I mean by that is that this pandora container is probably accepting urls like app.c-link.local to port 80, so you wont have issues with port 8085.
### Pointing to yout locall react bundles:
You most likely would need this values in the **REACT_SERVICE_HOST** and **REACT_SERVICE_V2_HOST** if you have the react project running locally and want to see your local changes:
```dotenv
export REACT_SERVICE_HOST=http://react_service.local:3001
export REACT_SERVICE_V2_HOST=http://react_service_v2.local:3002
```

### IMPORTANT!! GITHUB_TOKEN
In order for composer to be able to install internal packages, it needs to have access to Github somehow. This is done automatically
in the Dockerfile, but it needs a GITHUB_TOKEN present in the .env.
This is PAT token in GitHub. The maximum period of validity is 1 year, so this token should be renovated annually!
How to check current Fine-grained personal access tokens: https://github.com/organizations/construction-link/settings/personal-access-tokens/active
How to create a new PAT: https://github.com/settings/tokens?type=beta (might change as it is currently beta at the time of writing).
More details here.
Note this is also happening on the GitHun action secrets.

## Unittesting
run locally by:
```shell
composer test
```
Or on a docker image
```shell
make test_docker
```

As the names indicates, this will run the test in a safe docker environment,
loading your latest code as it is mounting it as a volume

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
