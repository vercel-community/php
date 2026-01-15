.PHONY: install build test publish canary

install:
	npm install

build:
	npm run build

build-watch:
	npm run watch

test:
	npm run test

test-watch:
	npm run test-watch

publish:
	rm -rf ./dist
	npm publish --access public --tag 0.3-latest

canary:
	rm -rf ./dist
	npm publish --access public --tag canary
