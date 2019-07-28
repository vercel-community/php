publish:
	cd src && npm publish --access public --tag latest

publish-canary:
	cd src && npm version prerelease
	cd src && npm publish --access public --tag canary

test:
	cd src && yarn test
