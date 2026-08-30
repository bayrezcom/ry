/* eslint-env node */
// AsyncStorage has no native module under Jest; its bundled mock keeps an
// in-memory store so the history/settings tests exercise real persistence code.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
