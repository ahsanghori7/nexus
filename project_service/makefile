#!make

include .env
NETWORK = nexus_default
DB_PORT = 3306
DB_DIAGRAMS_FOLDER = db/schema_diagrams/
OUTPUT_DIR := $(CURDIR)/$(DB_DIAGRAMS_FOLDER)

db_diagram:
	docker run --network $(NETWORK) -v $(OUTPUT_DIR):/output/diagrams/ schemaspy/schemaspy -t mysql -host $(DB_HOST) -port $(DB_PORT) -db project_service -u $(DB_USER) -p $(DB_PASSWORD) -s project_service -hq -imageformat png ; \
	rm -rf $(OUTPUT_DIR)/tables

test_docker:
	docker-compose -f docker-compose-test.yml run --build test

prettify-check_docker:
	docker-compose -f docker-compose-test.yml run --build test composer prettify-check
