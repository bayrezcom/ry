module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets powers Reanimated 4. The plugin must stay last.
    plugins: ['react-native-worklets/plugin'],
  };
};
