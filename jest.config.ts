module.exports = {
  roots: ["<rootDir>/tests"],
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "./src/controllers/*",
    "!./src/*",
    "!./node_modules"
  ],
  verbose: true,
  coverageThreshold: {
    "./src/controllers": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testTimeout: 30000,
};