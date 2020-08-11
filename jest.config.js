module.exports = {
  rootDir: ".",
  verbose: true,
  testEnvironment: "node",
  testMatch: [
    "**/test/spec/**/*.js",
  ],
  testPathIgnorePatterns: [
    "/errors/",
    "/dist/",
    "/node_modules/",
  ],
  testTimeout: 10000
}
