module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Optional: if you have a specific directory for tests
  roots: ["<rootDir>/tests"],
  // Optional: if you want Jest to handle TypeScript paths
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
  },
  // Optional: collect coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  // Optional: setupFiles if you have specific things to set up
  setupFiles: ["dotenv/config"],
};
