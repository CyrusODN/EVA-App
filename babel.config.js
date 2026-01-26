module.exports = {
  presets: ['module:@react-native/babel-preset', 'babel-preset-expo'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
    // Reanimated plugin must be listed last
    'react-native-reanimated/plugin',
  ],
};
