.PHONY: test

publish:
	rm -rf ./dist
	npm publish --access public --tag latest

publish-canary:
	rm -rf ./dist
	npm publish --access public --tag canary

test:
	yarn test
