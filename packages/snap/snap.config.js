module.exports = {
  bundler: 'webpack',
  input: 'src/index.ts',
  output: {
    filename: 'bundle.js',
    path: 'dist',
  },
  server: {
    port: 8080,
  },
  manifest: {
    path: 'snap.manifest.json',
  },
  features: {
    images: true,
  },
  environment: {
    SNAP_ENV: process.env.SNAP_ENV,
    PUBLIC_KEY: process.env.PUBLIC_KEY,
  },
  polyfills: {
    buffer: true,
    crypto: true,
    path: true,
  },
};
