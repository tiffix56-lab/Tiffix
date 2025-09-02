// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = withNativeWind(
  {
    ...defaultConfig,
    transformer: {
      ...defaultConfig.transformer,
    },
    resolver: {
      ...defaultConfig.resolver,
    },
  },
  { input: './src/global.css' }
);
