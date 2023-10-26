/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */
/** @typedef {import('rollup').ResolveIdResult} RollupResolveIdResult */
/** @typedef {import('@rollup/plugin-commonjs').RollupCommonJSOptions} CommonJsOptions */
/** @typedef {import('@rollup/plugin-terser').Options} TerserOptions */

const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');

// 文件打包配置函数
const bundle = require("./rollup-plugin/bundle");
// 移除路径
const removeDist = require("./rollup-plugin/remove-dist");
// 复制文件
const copyFiles = require("./rollup-plugin/copy-files");
// 主文件下json导入路径调整
const mainJsonRequireChange = require("./rollup-plugin/main-json-path");
// 主文件下外部模块导入禁止
const mainModuleRequirePathChange = require("./rollup-plugin/main-module-import");
// sharp模块下node二进制文件导入路径调整
const sharpNodeRequireChange = require("./rollup-plugin/sharp-module");
// 外部模块导入的json文件路径调整
const { externalJsonFilePathChange, pacakgeJsonRelativePathChange } = require("./rollup-plugin/external/json-import");
// bin.js首行代码删除
const lineCodeRemove = require("./rollup-plugin/external/install-bin-code");
// 警告处理函数
const warnHandle = require("./rollup-plugin/warn-handle");

const rootPath = process.cwd();

/** @type {RollupPlugin} */
const resolvePlugin = resolve({ preferBuiltins: true });
/** json文件导入插件 @type {RollupPlugin} */
const jsonPlugin = json({ preferConst: true });
/** 压缩插件配置 @type {TerserOptions} */
const terserOptions = { maxWorkers: 4 };
/** 压缩插件 @type {RollupPlugin} */
const terserPlugin = terser(terserOptions);

module.exports = [
    bundle({
        input: 'src/extension.ts',
        output: {
            file: 'dist/extension.js',
            format: 'cjs'
        },
        external: ["vscode"],
    }, [
        removeDist(rootPath, 'dist'),
        typescript({
            tsconfig: './tsconfig.json',
            compilerOptions: {
                module: "ESNext",
                moduleResolution: "Node",
                sourceMap: false
            }
        }),
        resolvePlugin,
        jsonPlugin,
        commonjs(),
        terserPlugin,
        mainJsonRequireChange(rootPath, 'dist', 'extension.js'),
        mainModuleRequirePathChange(rootPath, [
            "axios", 
            "sharp",
            "../../time/openAlarmClockPanel"
        ], [
            "./library/axios", 
            "./library/sharp", 
            "./library/openAlarmClockPanel"
        ])
    ]),
    bundle({
        input: 'src/uninstall.ts',
        output: {
            file: 'dist/uninstall.js',
            format: 'cjs'
        }
    }, [
        typescript({
            tsconfig: './tsconfig.uninstall.json'
        }),
        resolvePlugin,
        jsonPlugin,
        commonjs(),
        terserPlugin
    ]),
    bundle({
        input: 'src/library/external/axios.ts',
        output: {
            file: 'dist/library/axios.js',
            format: 'cjs',
            exports: "default"
        }
    }, [
        resolvePlugin,
        jsonPlugin,
        commonjs(),
        terserPlugin,
        externalJsonFilePathChange(rootPath)
    ]),
    // 打包sharp模块文件
    bundle({
        input: 'src/library/external/sharp.ts',
        output: {
            file: 'dist/library/sharp.js',
            format: 'cjs',
            exports: "default"
        }
    }, [
        resolvePlugin,
        jsonPlugin,
        commonjs({
            dynamicRequireTargets: '!node_modules/sharp/build/Release/*.node',
            ignoreDynamicRequires: true
        }),
        terserPlugin,
        sharpNodeRequireChange(),
        externalJsonFilePathChange(rootPath)
    ]),
    // 打包sharp依赖的use-libvips模块
    bundle({
        input: 'src/library/external/build/use-libvips.ts',
        output: {
            file: 'dist/library/install/use-libvips.js',
            format: 'cjs'
        },
        onwarn: warnHandle('CIRCULAR_DEPENDENCY')
    }, [
        resolvePlugin,
        jsonPlugin,
        commonjs(),
        terserPlugin,
        externalJsonFilePathChange(rootPath, "..", 'libvips.js')
    ]),
    bundle({
        input: 'src/library/external/build/copy.ts',
        output: {
            file: 'dist/library/install/copy.js',
            format: 'cjs'
        }
    }, [
        resolvePlugin,
        jsonPlugin,
        commonjs(),
        terserPlugin,
        externalJsonFilePathChange(rootPath, "..")
    ]),
    bundle({
        input: 'src/library/external/build/bin.ts',
        output: {
            file: 'dist/library/install/bin.js',
            format: 'cjs'
        },
        onwarn: warnHandle('CIRCULAR_DEPENDENCY')
    }, [
        resolvePlugin,
        jsonPlugin,
        commonjs({
            dynadynamicRequireTargets: ['!node_modules/prebuild-install/package.json', '!node_modules/napi-build-utils/pacakge.json'],
            ignoreDynamicRequires: true
        }),
        terserPlugin,
        externalJsonFilePathChange(rootPath, "..", ["bin.js"]),
        pacakgeJsonRelativePathChange(rootPath, "..", ["bin.js", "napi-build-utils/index.js"]),
        lineCodeRemove()
    ]),
    // 打包闹钟面板引用方法文件
    bundle({
        input: 'src/library/external/openAlarmClockPanel.ts',
        output: {
            file: 'dist/library/openAlarmClockPanel.js',
            format: 'cjs',
            exports: "default"
        },
        external: ["vscode"]
    }, [
        typescript({
            tsconfig: './tsconfig.json',
            compilerOptions: {
                module: "ESNext",
                moduleResolution: "Node",
                sourceMap: false
            }
        }),
        resolvePlugin,
        terserPlugin,
        commonjs()
    ])
];