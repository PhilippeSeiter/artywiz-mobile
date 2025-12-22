module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,  // Fix for import.meta support
        },
      ],
    ],
    plugins: [
      'react-native-worklets/plugin',
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
