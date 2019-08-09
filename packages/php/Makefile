publish:
	rm -rf ./dist
	npm publish --access public --tag latest

publish-canary:
	rm -rf ./dist
	npm version --no-git-tag-version prerelease
	npm publish --access public --tag canary

publish-experimental:
	rm -rf ./dist
	npm version --no-git-tag-version prerelease
	npm publish --access public --tag experimental

test:
	yarn test
