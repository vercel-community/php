module.exports = {
  rootDir: ".",
  verbose: true,
  testEnvironment: "node",
  testMatch: [
    "**/packages/*/test/spec/**/*.js",
  ],
  testPathIgnorePatterns: [
    "/build/",
    "/docs/",
    "/errors/",
    "/examples/",
    "/node_modules/",
  ]
}
