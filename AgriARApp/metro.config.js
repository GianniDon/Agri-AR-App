const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts } = defaultConfig.resolver;

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    assetExts: [
      ...assetExts,
      'mtl',
      'obj',
      'jpg',
      'jpeg',
      'png',
      'mp4',
      'wav',
      'glb',
      'gltf',
      'hdr',
      'bin'
    ],
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      'js',
      'jsx',
      'json',
      'ts',
      'tsx'
    ]
  }
};