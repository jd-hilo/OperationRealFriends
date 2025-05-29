const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname, { isCSSEnabled: true });

defaultConfig.transformer.minifierPath = 'metro-minify-terser';
defaultConfig.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    passes: 4,
    pure_funcs: ['console.debug'],
  },
  mangle: {
    toplevel: true,
  },
};

defaultConfig.resolver.assetExts.push("cjs");

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx', 'mjs', 'css'],
    blacklistRE: /#current-cloud-backend\/.*/,
  },
};