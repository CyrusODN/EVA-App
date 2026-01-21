module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    [
      'babel-preset-expo',
      {
        // Disable JSX runtime to avoid conflicts with React Native preset
        jsxRuntime: 'classic',
        // Use lazy imports for better performance
        lazyImports: true,
      },
    ],
  ],
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
