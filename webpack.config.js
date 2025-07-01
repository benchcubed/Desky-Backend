const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  context: path.resolve(__dirname),
  entry: {
    register: './src/handlers/auth/register.ts',
    login: './src/handlers/auth/login.ts',
    'verifyEmail': './src/handlers/auth/verifyEmail.ts',
    'createOffice': './src/handlers/office/createOffice.ts',
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js',
  },
};
