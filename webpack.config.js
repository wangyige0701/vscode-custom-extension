/** @typedef {import("webpack").Configuration} WebpackConfig */

const path = require("path");
const tsconfigPathPlugin = require("tsconfig-paths-webpack-plugin");
const nodeExternal = require("webpack-node-externals");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin, WebpackError, IgnorePlugin } = require("webpack");

module.exports =
/**
 * @param {{ mode: 'development' | 'production' | 'none' | undefined }} argv
 */
function (env, argv) {
    const mode = argv.mode || 'none';

    return [
        getExtensionConfig(mode)
    ];
};

/**
 * @param {'development' | 'production' | 'none'} mode
 */
function getExtensionConfig (mode) {
    const packageJson = require('./package.json');
    const plugins = [
        new ForkTsCheckerPlugin({
            async: false,
            eslint: {
                enabled: true,
                files: 'src/**/*.ts',
                options: {
                    cache: true,
                    cacheLocation: path.join(__dirname, '.eslintcache', ''),
                    cacheStrategy: 'content',
					fix: mode !== 'production',
                    overrideConfigFile: path.join(__dirname, '.eslintrc.json')
                }
            },
            formatter: 'basic',
            typescript: {
                configFile: path.join(__dirname, 'tsconfig.json')
            }
        }),
        new DefinePlugin({
            IS_PRODUCTION: JSON.stringify(mode === 'production'),
            IS_DEVELOPMENT: JSON.stringify(mode === 'development'),
            "process.env.NODE_ENV": JSON.stringify(mode),
            NODE_ENV: JSON.stringify(mode),
            EXTENSION_VERSION: JSON.stringify(packageJson.version),
            PUBLISHER: JSON.stringify(packageJson.publisher),
            PACKAGE_NAME: JSON.stringify(packageJson.name),
        })
    ];

    if (mode === 'development') {
        plugins.push(
            new CircularDependencyPlugin({
                cwd: __dirname,
                exclude: /node_modules/,
                failOnError: false,
                onDetected: function({ module: _webpackModuleRecord, paths, compilation }) {
                    compilation.warnings.push(new WebpackError(`Circular dependency: ${paths.join(' -> ')}`));
                }
            })
        );
    }

    /** @type {WebpackConfig} */
    const config = {
        name: 'extension',
        entry: {
            extension: "./src/extension.ts"
        },
        target: "node",
        devtool: mode === 'production' ? false : 'source-map',
        output: {
            path: path.join(__dirname, 'dist'),
            filename: "extension.js",
            chunkFilename: "[name]-[chunkhash].js",
            libraryTarget: "commonjs2"
        },
        resolve: {
            extensions: [".ts", ".js", '.json'],
            alias: {
                "@": path.resolve(__dirname, "src"),
                "@app": path.resolve(__dirname, "src", "app"),
                "@background": path.resolve(__dirname, "src", "app", "background"),
                "@time": path.resolve(__dirname, "src", "app", "time")
            }
        },
        externals: {
            vscode: 'commonjs vscode',
            axios: 'commonjs axios',
            sharp: 'commonjs sharp'
        },
        module: {
            rules: [{
                include: path.join(__dirname, 'src'),
                exclude: /\.d\.ts$/,
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                        experimentalWatchApi: true,
                        transpileOnly: true,
                    }
                }
            }]
        },
        plugins: plugins
    };
    return config;
}
