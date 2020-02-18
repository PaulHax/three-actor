module.exports = {
  preset: "ts-jest",
  moduleDirectories: ["node_modules", "test/node_modules"], //"test/node_modules" so src/somecode.ts where to find peer depependancy three
  globals: {
    "ts-jest": {
      diagnostics: {
        ignoreCodes: [151001]
      }
    }
  }
};
