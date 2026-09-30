const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const helpers = require('./helpers');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// Add ESLint Plugin import
const ESLintPlugin = require('eslint-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PUBLIC = {
  development: '/',
  staging: '/staging-v2/',
  uat: '/uat-v2/',
  production: '/production/',
  demo: '/demo-v2/',
  local: '/local-v2/',
  beta: '/beta/',
};

module.exports = (env, argv) => {
  const { mode } = argv;
  const { analyzer, pathS3 } = env;

  // Check command arguments for searching to another config.json file
  const { configFile } = env;
  let configJson = {};
  const confFileName = `./${configFile || 'config.json'}`;
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    configJson = require(confFileName);
  } catch (e) {
    const title = '[ERROR]: found problem with config.json file';
    helpers.printError(title, e);
    return;
  }
  const bundleUrl =
    configJson.ENV === 'development'
      ? 'http://app.c-link.local'
      : 'https://clink-react.s3.eu-west-2.amazonaws.com';
  // ANZ config
  const publicPath = `${bundleUrl}${pathS3 || PUBLIC[configJson.ENV]}`;

  const appsV2 = Object.values(configJson.BASE_DIRS.V2);
  const plugins = [
    ...appsV2.map((app) => {
      return new HtmlWebPackPlugin({
        template: `./src/index.html`,
        filename: `./${app}/index.html`,
        chunks: [app],
        favicon: './src/v2/assets/favicon.ico',
      });
    }),
  ];
  plugins.push(
    new MiniCssExtractPlugin({
      filename: '[name]/style.css',
      ignoreOrder: true, // Add this to ignore order warnings
    }),
  );
  const configEnvObj = {};
  Object.entries(configJson).forEach(
    // eslint-disable-next-line no-return-assign
    ([key, value]) => (configEnvObj[key] = JSON.stringify(value)),
  );
  const configEnv = new webpack.DefinePlugin(configEnvObj);
  plugins.push(configEnv);
  const bufferPlugin = new webpack.ProvidePlugin({
    process: 'process/browser',
    Buffer: ['buffer', 'Buffer'],
  });
  plugins.push(bufferPlugin);
  if (analyzer) {
    plugins.push(new BundleAnalyzerPlugin());
  }
  // if (mode !== 'production') {
  //   plugins.push(
  //     new ESLintPlugin({
  //       extensions: ['js', 'jsx'],
  //       exclude: ['node_modules', '**/*.scss', '**/*.css'],
  //       fix: true,
  //       configType: 'eslintrc',
  //       emitWarning: true, // Show warnings
  //       emitError: true, // Show errors
  //       failOnError: false, // Don't fail the build on errors
  //       failOnWarning: false, // Don't fail the build on warnings
  //       lintDirtyModulesOnly: true, //  Only lint changed files.
  //       context: path.resolve(__dirname, 'src'), // Set the context to src directory
  //       cache: true,
  //       cacheLocation: path.resolve(__dirname, '.cache/eslint-webpack-plugin'),
  //       threads: true,
  //     }),
  //   );
  // }

  const entryPoints = {};
  appsV2.forEach((app) => {
    entryPoints[app] = `./src/v2/apps/${app}/index.jsx`;
  });
  // Remove warning for crypto lib showed after installing react-pdf
  const fallback = {
    crypto: false,
  };
  const optimization = {
    minimize: configJson.ENV !== 'development', // Ensure minimization is enabled
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: mode === 'production', // Optionally drop console logs in production
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    runtimeChunk: 'single', // Extracts runtime code into a single chunk
    splitChunks: {
      chunks: 'all', // Apply optimization to all types of chunks (initial, async)
      cacheGroups: {
        // Vendor chunk: for modules from node_modules
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors', // Static name for the vendor chunk
          chunks: 'all',
          priority: -10, // Higher priority to group vendor modules together
        },
        // Common application chunk: for modules from your src directory shared across entry points
        commonApp: {
          test: /[\\/]src[\\/]/, // Target modules from the src directory
          name: 'common-app', // Static name for the common application code chunk
          minChunks: 2, // Module must be shared in at least 2 entry chunks to be included
          priority: -20, // Lower priority than vendors
          reuseExistingChunk: true, // If a chunk with this module already exists, reuse it
        },
      },
    },
  };

  const use = [
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true, // Enable Babel's internal cache
      },
    },
    // {
    //   loader: 'cache-loader',
    //   options: {
    //     cacheDirectory: path.resolve(__dirname, '.cache/babel-loader'),
    //   },
    // },
    // {
    //   loader: 'thread-loader',
    //   options: {
    //     workers: require('os').cpus().length - 1, // Leave 1 core free for other tasks
    //   },
    // },
    // 'babel-loader',
  ];
  const smp = new SpeedMeasurePlugin();

  // eslint-disable-next-line consistent-return
  return smp.wrap({
    cache: {
      type: 'filesystem', // Stores cache on disk
      buildDependencies: {
        config: [__filename], // Invalidate cache if config changes
      },
    },
    entry: entryPoints,
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name]/bundle.js', // For entry chunks
      chunkFilename: 'chunks/[name].bundle.js', // For non-entry chunks (vendors, common, runtime)
      assetModuleFilename: 'public/[hash][ext][query]',
      publicPath,
    },
    optimization,
    resolve: {
      extensions: ['.js', '.jsx', '.mjs'],
      modules: [path.join(__dirname, 'src'), 'node_modules'],
      alias: {
        react: path.join(__dirname, 'node_modules', 'react'),
        'popper.js': path.join(
          __dirname,
          'node_modules',
          'popper.js/dist/esm/popper.js',
        ),
        process: 'process/browser',
        'process/browser': path.resolve(
          __dirname,
          'node_modules/process/browser.js',
        ),
        'process/browser.js': path.resolve(
          __dirname,
          'node_modules/process/browser.js',
        ),
        stream: 'stream-browserify',
        zlib: 'browserify-zlib',
        apps: path.resolve(__dirname, 'src/v2/apps'),
        assets: path.resolve(__dirname, 'src/v2/assets'),
        helpers: path.resolve(__dirname, 'src/v2/helpers'),
        hooks: path.resolve(__dirname, 'src/v2/hooks'),
        services: path.resolve(__dirname, 'src/v2/services'),
        store: path.resolve(__dirname, 'src/v2/store'),
        constants: path.resolve(__dirname, 'src/v2/constants'),
        'component-lib': path.resolve(__dirname, 'src/component-lib'),
        'clink-components': path.resolve(__dirname, 'src/clink-components.js'),
        v1: path.resolve(__dirname, 'src/v1'),
        v2: path.resolve(__dirname, 'src/v2'),
      },
      fallback,
    },
    plugins,
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*', // Or specify the exact origin
      },
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: configJson.PORT,
      hot: true,
      historyApiFallback: true,
      client: {
        logging: 'warn',
      },
      allowedHosts: [
        '.react_service.local', // Allow any subdomain of react_service.local, etc
        '.react_service_v2.local',
        './react_service_v2.local:3002/',
        '.app.c-link.local',
        'localhost',
        '.admin.local',
        '.app.prosper.local',
      ],
    },
    devtool:
      configJson.ENV === 'development'
        ? 'cheap-module-source-map'
        : 'source-map', // Or 'hidden-source-map' in production
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          resolve: {
            extensions: ['.js', '.jsx'],
          },
          use,
        },
        {
          test: /\.(scss)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false,
              },
            },
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    watchOptions: configJson.WATCH_OPTIONS,
  });
};
