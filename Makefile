.PHONY: test

install:
	npx lerna exec npm install

test-unit:
	yarn run test-unit
