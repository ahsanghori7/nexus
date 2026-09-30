#!make
# OS detection
OS := $(shell uname)
export MYSQL_ROOT_PASSWORD=password

# Disable BuildKit provenance/SBOM attestations: they add nothing for local
# dev images and cause `docker compose build` to hang at
# "resolving provenance for metadata file" on Docker Desktop (containerd image store).
export BUILDX_NO_DEFAULT_ATTESTATIONS=1

# Colors
GREEN  := \033[32m
RED    := \033[31m
YELLOW := \033[33m
BLUE   := \033[34m
CYAN   := \033[36m
BOLD   := \033[1m
RESET  := \033[0m
COVERAGE_MINIMUM ?= 50

ifeq ($(OS), Darwin)
	export GITHUB_TOKEN = $(shell grep -E '^GITHUB_TOKEN=' app.c-link/.env | head -n1 | cut -d= -f2-)
	export SETASIGN_USERNAME=$(shell grep -E '^SETASIGN_USERNAME=' framework/.env | head -n1 | cut -d= -f2-)
	export SETASIGN_PASSWORD=$(shell grep -E '^SETASIGN_PASSWORD=' framework/.env | head -n1 | cut -d= -f2-)
	export APP_ENV=$(shell grep -E '^ENVIRONMENT=' app.c-link/.env | head -n1 | cut -d= -f2-)
else ifeq ($(OS), Linux)
	# Linux compatible SETASIGN
	export GITHUB_TOKEN=$(shell grep -oP 'GITHUB_TOKEN=\K.*' app.c-link/.env)
	export SETASIGN_USERNAME=$(shell grep -oP 'SETASIGN_USERNAME=\K.*' framework/.env)
	export SETASIGN_PASSWORD=$(shell grep -oP 'SETASIGN_PASSWORD=\K.*' framework/.env)
	export APP_ENV=$(shell grep -oP 'ENVIRONMENT=\K.*' app.c-link/.env)
endif

# Default APP_ENV if empty
APP_ENV ?= development

# Determine correct Dockerfile for app.c-link
ifneq ($(APP_ENV),production)
    export APP_CLINK_DOCKERFILE := app.c-link-develop.Dockerfile
else
    export APP_CLINK_DOCKERFILE := app.c-link.Dockerfile
endif

SERVICES := account_service project_service document_service
SCHEMASPY_COMMON_ARGS := -t mysql -host db -port 3306 -u root -p $(MYSQL_ROOT_PASSWORD) -hq -imageformat png

# Framework components list (strip the framework/src/ prefix), excluding vendor directories
FRAMEWORK_COMPONENTS := $(shell find framework/src -name 'composer.json' -not -path "*/vendor/*" -exec dirname {} \; | sed 's|framework/src/||')

# All composer-enabled directories
COMPOSER_SERVICES := $(SERVICES) app.c-link $(FRAMEWORK_COMPONENTS:%=framework-%)

.PHONY: help docker_cleanup docker_full_cleanup docker_build docker_up docker_down docker_restart \
    db_account_migrate db_project_migrate db_document_migrate db_migrate_all \
    db_account_rollback db_project_rollback db_document_rollback \
    db_reset_all db_nuclear_cleanup db_new_migration db_diagram db_diagrams_all \
    update_hosts initial_set_up composer-update-% composer-update-framework-% composer-update-all list-composer-services \
    gh_action_migration_test ai_setup_qsai framework_middleware_catalog

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
#########################################################################################
# DOCKER RELATED
#########################################################################################
docker_cleanup: ## Clean up docker images, containers, etc
	docker system prune -f

docker_full_cleanup: ## FULL Clean up docker images, containers, etc
	docker system prune -f --all

build_services_base: ## Build base image for services
	docker build -t services-base-8 -f docker_configuration/services-php8-base.Dockerfile docker_configuration

docker_build: build_services_base ## Build docker images
	docker compose -f docker_configuration/docker-compose.yml build

docker_up: docker_build ## Start docker containers
	 docker compose -f docker_configuration/docker-compose.yml up -d --remove-orphans

docker_down: ## Stop docker containers
	docker compose -f docker_configuration/docker-compose.yml down --remove-orphans

docker_restart: docker_down docker_up

## Restart docker containers#### REACT SERVICE COMMANDS ####

framework_middleware_catalog: ## Generate framework middleware catalog
	php scripts/generate_framework_middleware_catalog.php

react_init:
	cd react-service && pnpm install

react_update:
	cd react-service && pnpm update

react_start:
	cd react-service && pnpm start
#########################################################################################
# DB RELATED
#########################################################################################
# Phinx migrations
db_account_migrate: ## Run account service db migrations
	docker exec -t account_service composer db_migrate
db_project_migrate: ## Run project service db migrations
	docker exec -t project_service composer db_migrate
db_document_migrate: ## Run document service db migrations
	docker exec -t document_service composer db_migrate
db_migrate_all: db_account_migrate db_document_migrate db_project_migrate


db_create_migration:
	@if [ -z "$(service)" ]; then \
		echo "ERROR: you must set service, e.g. make db_create_migration service=my-app name=AddUsersTable"; \
		exit 1; \
	fi
	@if [ -z "$(name)" ]; then \
		echo "ERROR: you must set name, e.g. make db_create_migration service=my-app name=AddUsersTable"; \
		exit 1; \
	fi
	docker exec -t $(service) vendor/bin/phinx create "$(name)"
	sudo chown -R $(USER):$(USER) $(service)/db/migrations

db_account_rollback: ## account service db rollback last migration
	docker exec -t account_service composer db_rollback
db_project_rollback: ## project service db rollback last migration
	docker exec -t project_service composer db_rollback
db_document_rollback: ## document service db rollback last migration
	docker exec -t document_service composer db_rollback

# DB reset
db_account_reset: ## Reset account service db
	if [ -z "$$CI" ]; then \
		docker exec -it --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} account_service bash docker/sql/reset_db.sh; \
	else \
		docker exec --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} account_service bash docker/sql/reset_db.sh; \
	fi
	$(MAKE) db_account_migrate

db_project_reset: ## Reset project service db
	if [ -z "$$CI" ]; then \
		docker exec -it --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} project_service bash docker/sql/reset_db.sh; \
	else \
		docker exec --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} project_service bash docker/sql/reset_db.sh; \
	fi
	$(MAKE) db_project_migrate

db_document_reset: ## Reset document service db
	if [ -z "$$CI" ]; then \
		docker exec -it --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} document_service bash docker/sql/reset_db.sh; \
	else \
		docker exec --env SKIP_CONFIRMATION=${SKIP_CONFIRMATION} document_service bash docker/sql/reset_db.sh; \
	fi
	$(MAKE) db_document_migrate


# Reset all databases
db_reset_all: docker_up ## Reset all services databases
	@{ \
		$(MAKE) db_account_reset; \
		if [ $$? -ne 0 ]; then exit 1; fi; \
		$(MAKE) db_project_reset; \
		if [ $$? -ne 0 ]; then exit 1; fi; \
		$(MAKE) db_document_reset; \
		if [ $$? -ne 0 ]; then exit 1; fi; \
	} || { \
		echo "An error occurred in one of the reset tasks, fetching db logs..."; \
		docker logs db; \
		exit 1; \
	}

db_nuclear_cleanup: ## Nuclear database cleanup - removes all DB data and cache (WARNING: irreversible)
	@echo "⚠️  WARNING: This will completely destroy ALL database data and cache!"
	@echo "This operation:"
	@echo "  - Stops all Docker containers"
	@echo "  - Removes all database cache files (requires sudo)"
	@echo "  - Restarts Docker containers"
	@echo "  - Resets all databases without confirmation"
	@echo ""
	@echo "This is IRREVERSIBLE and will delete ALL your database data!"
	@echo ""
	@read -p "Are you absolutely sure you want to continue? (type 'yes' to confirm): " confirm && \
	if [ "$$confirm" != "yes" ]; then \
		echo "Operation cancelled."; \
		exit 1; \
	fi
	@echo "Proceeding with nuclear database cleanup..."
	@echo "You may be prompted for your sudo password to remove database cache files."
	$(MAKE) docker_down
	sudo rm -rf docker_configuration/databases_cache/db/*
	SKIP_CONFIRMATION=true $(MAKE) db_reset_all


db_new_migration: ## Usage eg.: make db_new_migration name=MyNewMigration service=account_service
	@if [ -z "$(name)" ]; then \
        echo "Error: Please provide a name for the migration."; \
        exit 1; \
    fi
	@if [ -z "$(service)" ]; then \
        echo "Error: Please provide the desired service."; \
        exit 1; \
    fi
	@if ! echo "$(SERVICES)" | grep -qw "$(service)"; then \
        echo "Error: Invalid service specified. Please choose one of $(SERVICES)."; \
        exit 1; \
    fi
	docker exec -t ${service} vendor/bin/phinx create $(name) && sudo chown -R $$USER:$$USER ${service}/db/migrations

# DB Diagrams commands
db_diagram: ## Generate DB diagram for a service. Usage: make db_diagram service=account_service
	@if [ -z "$(service)" ]; then \
		echo "Error: Please provide the service name. Example: make db_diagram service=account_service"; \
		exit 1; \
	fi
	@if ! echo "$(SERVICES)" | grep -qw "$(service)"; then \
		echo "Error: Invalid service specified. Please choose one of $(SERVICES)."; \
		exit 1; \
	fi
	$(eval OUTPUT_DIR := $(CURDIR)/$(service)/db/schema_diagrams/)
	docker run --network nexus_default \
		-v $(OUTPUT_DIR):/output/diagrams/ \
		schemaspy/schemaspy \
		$(SCHEMASPY_COMMON_ARGS) \
		-db $(service) \
		-s $(service) ; \
	rm -rf $(OUTPUT_DIR)tables

db_diagrams_all: ## Generate DB diagrams for all services
	@for service in $(SERVICES); do \
		$(MAKE) db_diagram service=$$service; \
	done

#########################################################################################
# COMPOSER RELATED
#########################################################################################
composer-update-%: ## Update composer dependencies for a specific service or framework component
	@echo "Updating composer dependencies for $*..."
	@if echo "$*" | grep -q "^framework-"; then \
		component=$$(echo "$*" | sed 's/framework-//') && \
		container_name="framework" && \
		internal_path="/var/www/html/framework/src/$$component" && \
		local_path="framework/src/$$component"; \
	else \
		container_name="$*" && \
		internal_path="/var/www/html/$*" && \
		local_path="$*"; \
	fi; \
	echo "Using container: $$container_name" && \
	docker exec $$container_name bash -c 'mkdir -p ~/.composer && echo "{\"github-oauth\":{\"github.com\":\"${GITHUB_TOKEN}\"}, \"http-basic\":{\"www.setasign.com\":{\"username\":\"${SETASIGN_USERNAME}\",\"password\":\"${SETASIGN_PASSWORD}\"}}}" > ~/.composer/auth.json' && \
	docker exec $$container_name bash -c "cd $$internal_path && composer config --global github-protocols https && composer update" && \
	docker exec $$container_name rm -f ~/.composer/auth.json && \
	docker cp $$container_name:$$internal_path/composer.lock $$local_path/composer.lock && \
	echo "Successfully updated composer.lock for $*"

composer-update-framework: ## Update composer dependencies for all framework components
	@echo "Updating composer dependencies for all framework components..."
	@for component in $(FRAMEWORK_COMPONENTS); do \
		echo "Updating framework-$$component..." && \
		$(MAKE) composer-update-framework-$$component || exit 1; \
	done
	@echo "All framework components have been updated"

composer-update-all: ## Update composer dependencies for all services and framework components
	@echo "Updating all composer dependencies..."
	@for service in $(SERVICES) app.c-link; do \
		$(MAKE) composer-update-$$service || exit 1; \
	done
	@$(MAKE) composer-update-framework
	@echo "All services and framework components have been updated"

list-composer-services: ## List all available services and components that can be updated
	@echo "Available services:"
	@for service in $(SERVICES) app.c-link; do \
		echo "  - $$service"; \
	done
	@echo "\nFramework components (use: make composer-update-framework-<component>):"
	@for component in $(FRAMEWORK_COMPONENTS); do \
		echo "  - framework-$$component"; \
	done

#########################################################################################
# INITIAL COMMAND
update_hosts: ## Update hosts file initially
	@echo "Updating hosts file, might require sudo password"
	bash docker_configuration/local_scripts/update_hosts.sh

initial_set_up: update_hosts docker_restart db_account_reset db_project_reset db_document_reset setup_pre_commit ## Initial set up of the project

# FIXTURES MIGRATIONS
# Run a single fixture: make fixture environment=development service=project_service file=boq_setup
# Run all fixtures: make fixture environment=development service=project_service
fixture:
	@if [ -z "$(environment)" ]; then \
        echo "Error: Please provide an environment for the migration."; \
        exit 1; \
    fi
	@if [ -z "$(service)" ]; then \
        echo "Error: Please provide the desired service."; \
        exit 1; \
    fi
    ifeq ($(strip $(file)),)
	docker exec -t ${service} php fixtures.php ${environment} ${file}
    else
	docker exec -t ${service} php fixtures.php ${environment}
    endif


#########################################################################################
# STAGING RELATED
#########################################################################################
# Service pull and restart
deployed_services_restart: docker_full_cleanup
	docker compose -f docker_configuration/docker-compose-production-services.yml pull && \
	docker compose -f docker_configuration/docker-compose-production-services.yml down --remove-orphans && \
	docker compose -f docker_configuration/docker-compose-production-services.yml up --force-recreate -d --remove-orphans
	$(MAKE) db_migrate_all

#########################################################################################
# TESTING
#########################################################################################
COMPOSE_CMD = docker compose -f docker_configuration/docker-compose.yml
gh_action_migration_test:
	$(COMPOSE_CMD) build \
		--build-arg REGISTRY=$$REGISTRY \
		--build-arg GITHUB_TOKEN=$$GITHUB_TOKEN \
		account_service project_service document_service db && \
	$(COMPOSE_CMD) up -d account_service project_service document_service db && \
	docker logs db && \
	SKIP_CONFIRMATION=true $(MAKE) db_reset_all


sync_coverage_threshold:
	cp tests/CoverageThreshold.php account_service/tests/CoverageThreshold.shared.php
	cp tests/CoverageThreshold.php project_service/tests/CoverageThreshold.shared.php
	cp tests/CoverageThreshold.php document_service/tests/CoverageThreshold.shared.php

account_service_unittests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} account_service
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm -e COVERAGE_MINIMUM=${COVERAGE_MINIMUM} account_service composer test:unit

account_service_integrationtests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} account_service db
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm account_service composer test:integration

project_service_unittests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} project_service
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm -e COVERAGE_MINIMUM=${COVERAGE_MINIMUM} project_service composer test:unit

project_service_integrationtests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} project_service db
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm project_service composer test:integration

document_service_unittests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} document_service
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm -e COVERAGE_MINIMUM=${COVERAGE_MINIMUM} document_service composer test:unit

document_service_integrationtests: sync_coverage_threshold
	docker compose -f docker_configuration/docker-compose.testing.yml build --build-arg REGISTRY=${ECR_REGISTRY} document_service db
	docker compose -f docker_configuration/docker-compose.testing.yml run --rm document_service composer test:integration

#########################################################################################
# PLAYWRIGHT/PERCY TESTING
#########################################################################################
PLAYWRIGHT_VENV := .playwright_venv
PLAYWRIGHT_PYTHON := $(PLAYWRIGHT_VENV)/bin/python
PLAYWRIGHT_PIP := $(PLAYWRIGHT_VENV)/bin/pip
ifeq ($(OS), Darwin)
  PERCY_TOKEN := $(shell [ -f playwright-tests/.env ] && grep -E '^PERCY_TOKEN=' playwright-tests/.env | head -n1 | cut -d= -f2-)
else ifeq ($(OS), Linux)
  PERCY_TOKEN := $(shell [ -f playwright-tests/.env ] && grep -oP 'PERCY_TOKEN=\K.*' playwright-tests/.env)
endif

playwright_setup: $(PLAYWRIGHT_VENV)
	$(PLAYWRIGHT_PIP) install -r playwright-tests/requirements.txt
	$(PLAYWRIGHT_PIP) install playwright
	$(PLAYWRIGHT_PYTHON) -m playwright install
	$(PLAYWRIGHT_PYTHON) -m playwright install-deps
	cd playwright-tests && pnpm install

$(PLAYWRIGHT_VENV):
	python3 -m venv $(PLAYWRIGHT_VENV)

playwright_run:
	. $(PLAYWRIGHT_VENV)/bin/activate && cd playwright-tests && pytest --headed

playwright_run_headless:
	. $(PLAYWRIGHT_VENV)/bin/activate && cd playwright-tests && pytest

playwright_debug:
	. $(PLAYWRIGHT_VENV)/bin/activate && cd playwright-tests && PWDEBUG=1 pytest --headed

playwright_debug_test:
	. $(PLAYWRIGHT_VENV)/bin/activate && cd playwright-tests && PWDEBUG=1 pytest --headed $(TEST_FILE)

playwright_clean:
	rm -rf $(PLAYWRIGHT_VENV)
	find playwright-tests -type d -name "__pycache__" -exec rm -rf {} +
	find playwright-tests -type f -name "*.pyc" -delete

percy_run:
	. $(PLAYWRIGHT_VENV)/bin/activate && cd playwright-tests &&  \
	export PERCY_TOKEN=$(PERCY_TOKEN) &&  \
	pnpm percy exec -- pytest

#########################################################################################
# HELPERS
#########################################################################################
copy_envs:
	sh copy_envs.sh
	zip -r my_envs.zip my_envs
	rm -rf my_envs
	echo "my_envs.zip created"

setup_pre_commit:
ifeq ($(OS), Darwin)
	@echo "Detected macOS. Installing pre-commit via brew..."
	@if ! command -v brew >/dev/null 2>&1; then \
		echo "Homebrew not found. Please install Homebrew manually: https://brew.sh"; \
		exit 1; \
	fi
	brew install pre-commit
else ifeq ($(OS), Linux)
	@echo "Detected Linux. Installing pre-commit via apt-get..."
	sudo apt-get update && sudo apt-get install -y pre-commit
else
	@echo "Unsupported OS. Please install pre-commit manually."
	@exit 1
endif
	pre-commit install
	cp scripts/check-composer.sh .git/hooks/
	chmod +x .git/hooks/check-composer.sh

#########################################################################################
# AI / QSAI CONNECTOR
#########################################################################################

ai_setup_qsai: ## Guide + wire framework to QS AI (requires qsai repo running make dev_up)
	@printf "$(BOLD)$(BLUE)Step 0$(RESET): ensure nexus docker is running...\n"
	@$(MAKE) docker_up
	@prompt=$$(printf "%b" "$(BOLD)$(BLUE)Step 1$(RESET): Enable AI feature for ALL accounts? [Y/n]: "); \
	read -r -p "$$prompt" confirm; \
	confirm=$${confirm:-yes}; \
	if printf "%s" "$$confirm" | grep -qi '^y'; then \
	    printf "$(YELLOW)Running AI feature SQL on DB...$(RESET)\n"; \
	    docker exec -i db mysql -uroot -ppassword account_service -e "\
	    INSERT INTO feature (parent_id, name) SELECT NULL, 'AI' WHERE NOT EXISTS (SELECT 1 FROM feature WHERE name='AI'); \
	    INSERT INTO account_features (account_id) \
	        SELECT a.id FROM account a LEFT JOIN account_features af ON af.account_id=a.id WHERE af.id IS NULL; \
	    INSERT INTO account_features_mapping (account_features_id, feature_id) \
	        SELECT af.id, f.id FROM account_features af \
	        CROSS JOIN (SELECT id FROM feature WHERE name='AI' LIMIT 1) f \
	        LEFT JOIN account_features_mapping m ON m.account_features_id=af.id AND m.feature_id=f.id \
	        WHERE m.id IS NULL;"; \
	else \
	    printf "$(YELLOW)Skipped enabling AI feature for all accounts (continuing setup).$(RESET)\n"; \
	fi
	@prompt=$$(printf "%b" "$(BOLD)$(BLUE)Step 2$(RESET): Backfill document owners for Tender Insights now? (ensures enquiry documents are accessible) [Y/n]: "); \
	read -r -p "$$prompt" confirm; \
	confirm=$${confirm:-yes}; \
	if printf "%s" "$$confirm" | grep -qi '^y'; then \
	    printf "$(YELLOW)Running subcontractor document owner mapping script...$(RESET)\n"; \
	    docker exec -t framework php /var/www/html/framework/cli.php prosper subcontractor_document_owner_mapping:owner_mapping; \
	    printf "$(GREEN)✔ Document owner backfill completed.$(RESET)\n"; \
	else \
	    printf "$(YELLOW)Skipped backfill; Tender Insights may return 403 until owner mappings are added.$(RESET)\n"; \
	fi
	@printf "\n$(BOLD)$(BLUE)Step 3$(RESET): In the qsai repo run 'make dev_up' (if never set up, read qsai/ONBOARDING.md).\n"
	@read -p "Press Enter once qsai is up..." _;
	@printf "\n$(BOLD)$(BLUE)Step 4$(RESET): Checking containers for qsai...\n"
	@{ TMP=$$(mktemp /tmp/qsai_ps_XXXXXX); \
	   docker ps --filter "name=qsai" --format '{{.Names}} {{.Status}}' | tee $$TMP; \
	   if ! grep -q "qsai-router" $$TMP || \
	      ! grep -q "qsai-api" $$TMP || \
	      ! grep -q "qsai-worker" $$TMP || \
	      ! grep -q "qsai-db" $$TMP || \
	      ! grep -q "qsai-rabbitmq" $$TMP || \
	      ! grep -q "qsai-minio" $$TMP ; then \
	        printf "$(RED)✖ QS AI stack not fully running (router/api/worker/db/rabbitmq/minio expected).$(RESET)\n"; \
	        printf "Run 'make dev_up' in qsai repo and retry.\n"; \
	        rm -f $$TMP; \
	        exit 1; \
	   fi; \
	   rm -f $$TMP; \
	 }
	@printf "$(GREEN)✔ QS AI containers detected.$(RESET)\n\n"
	@printf "$(BOLD)$(BLUE)Step 3b$(RESET): Ensure framework/.env has PROQUO_SERVICE_URL=http://qsai-router:80 ...\n"
	@if [ ! -f framework/.env ]; then \
	    printf "$(RED)✖ framework/.env not found$(RESET)\n"; \
	    exit 1; \
	elif ! grep -q '^PROQUO_SERVICE_URL=http://qsai-router:80' framework/.env; then \
	    printf "$(YELLOW)⚠ PROQUO_SERVICE_URL not set to http://qsai-router:80 in framework/.env$(RESET)\n"; \
	    printf "Current value: "; grep -n '^PROQUO_SERVICE_URL' framework/.env || true; \
	    printf "Update framework/.env, then rerun this target if you change it.\n\n"; \
	else \
	    printf "$(GREEN)✔ PROQUO_SERVICE_URL is correctly set.$(RESET)\n\n"; \
	fi
	@printf "$(BOLD)$(BLUE)Step 5$(RESET): Connecting networks (alias qsai-router)...\n"
	docker network connect --alias qsai-router docker_configuration_default $$(docker ps --filter "name=qsai-router" --format "{{.Names}}" | head -n1) || true
	@printf "\n$(BOLD)$(BLUE)Step 6$(RESET): Verifying health from framework -> qsai...\n"
	docker exec framework sh -c "curl -s http://qsai-router:80/api/health" | grep -q '\"Healthy\"' && \
	  printf "$(GREEN)✔ QS AI reachable: {\"status\":\"Healthy\"}$(RESET)\n" || \
	  (printf "$(RED)✖ Health check failed; inspect dns/connectivity.$(RESET)\n" && exit 1)
