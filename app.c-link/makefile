#!make

test_docker:
	docker-compose -f docker-compose-test.yml run --build test

prettify-check_docker:
	docker-compose -f docker-compose-test.yml run --rm --remove-orphans --build test composer prettify-check
