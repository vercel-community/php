/* global beforeAll, expect, it, jest */
const fs = require('fs');
const path = require('path');

const {
  packAndDeploy,
  testDeployment,
} = require('../lib/deployment/test-deployment.js');

jest.setTimeout(4 * 60 * 1000);
const buildUtilsUrl = '@canary';
let builderUrl;

beforeAll(async () => {
  const builderPath = path.resolve(__dirname, '..', '..');
  console.log('builderPath', builderPath);
  builderUrl = await packAndDeploy(builderPath);
  console.log('builderUrl', builderUrl);
});

const fixturesPath = path.resolve(__dirname, '..', 'fixtures');

// Test single fixture of all fixtures
if (process.env.FIXTURE) {
  testFixture(process.env.FIXTURE);
} else {
  // eslint-disable-next-line no-restricted-syntax
  for (const fixture of fs.readdirSync(fixturesPath)) {
    testFixture(fixture);
  }
}

function testFixture(fixture) {
  // eslint-disable-next-line no-loop-func
  it(`should build ${fixture}`, async () => {
    await expect(
      testDeployment(
        { builderUrl, buildUtilsUrl },
        path.join(fixturesPath, fixture),
      ),
    ).resolves.toBeDefined();
  });
}
