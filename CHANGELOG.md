# Change Log

All notable changes to the "wangyige" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.0]
 - 升级：webview引用js、css文件打包逻辑修改，在开发环境下实时合并；生产环境预发布时需要执行pre命令将js、css文件合并压缩，生产环境中可以直接引用。（但是css的图标引用还需要在版本更新后进行更新）
 - 优化：按钮文本取消换行，添加title用于显示具体内容；显示当前保存背景数

## [0.0.7] - 2023-5-23

- 优化：删除图片同时删除随机切换数据列表内的对应数据
- 优化：选中一张图片后显示全选和取消选中的操作按钮

## [0.0.6] - 2023-5-21

- 优化：webview页面图片加载优化

## [0.0.5] - 2023-5-21

- bug修复：透明度修改失败修复

## [0.0.4] - 2023-5-20

- bug修复：切换图片后通过修改引用路径后缀清除缓存

## [0.0.3] - 2023-5-20

- bug修复：图片储存路径不存在时自动创建对应文件夹

## [0.0.2] - 2023-5-20

- bug修复：webview页面未显示，相关文件未进行打包修复

## [0.0.1] - 2023-5-20

- 发布：添加背景图功能实现
> end
- Initial release

[0.0.7]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.7
[0.0.6]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.6
[0.0.5]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.5
[0.0.4]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.4
[0.0.3]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.3
[0.0.2]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.2
[0.0.1]: https://github.com/wangyige0701/vscodeCustomExtension/releases/tag/v0.0.1