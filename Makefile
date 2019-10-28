.PHONY: install build test-unit

install:
	npx lerna exec npm install

build:
	npx lerna exec npm run build

test-unit:
	npm run test-unit
