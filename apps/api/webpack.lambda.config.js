const { composePlugins, withNx } = require('@nx/webpack');
const webpack = require('webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Bundle all node_modules for Lambda (no externals)
  // Only keep Node.js built-ins as external
  config.externals = [];
  config.externalsPresets = { node: true };

  // Ignore optional NestJS packages not installed
  config.plugins = [
    ...(config.plugins || []),
    new webpack.IgnorePlugin({
      checkResource(resource) {
        const lazyImports = [
          '@nestjs/websockets',
          '@nestjs/websockets/socket-module',
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/platform-fastify',
          'class-transformer/storage',
        ];
        return lazyImports.includes(resource);
      },
    }),
  ];

  return config;
});
