# Change Log

All notable changes to the "wangyige" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## 0.7.0 - 2023-10-30
 - 新增：添加时间显示，添加闹钟功能

## 0.6.8 ~ 0.6.15 - 2023-9-21
 - 修复：图片压缩导致的运行错误bug修复完成
 - 优化：调整扩展依赖下载方法，减小包体积

## 0.6.0 - 2023-9-9  >>>>  注：直至v0.6.8版本bug修复
 - 新增：对图片进行压缩操作，加快侧栏图片列表加载速度

## 0.5.4 - 2023-9-8
 - 修复：侧栏图片列表全选状态下懒加载的图片未选中修复

## [0.5.3] - 2023-9-7
 - 优化：侧栏列表图片加载、删除动画优化

## [0.5.2] - 2023-9-6
 - 优化：背景图切换、清除交互优化
 - 新增：添加卸载扩展时清除背景图配置功能
 - 测试：修改背景图后更新校验和，需要测试能否满足避免警告弹出

## 0.5.1 - 2023-9-2
 - 修复：多选图片上传时缓存数组数据不正确bug修复
 - 优化：侧栏图片列表懒加载判断优化

## [0.5.0] - 2023-8-25
 - 优化：选择图片添加多选
 - 修复：随机图配置关闭后重启软件背景图修改bug修复

## [0.4.7] - 2023-8-18
 - 优化：图片列表删除多张图片时，添加列表滚动效果

## 0.4.4 - 2023-8-13
 - 优化：图片列表动画优化

## 0.4.3 - 2023-8-13
 - 调整：图标替换，状态栏文字修改

## 0.4.2 - 2023-8-11
 - 修复：图片列表删除图片错误修复

## 0.4.1 - 2023-8-10
 - 优化：版本更新后拷贝背景图资源

## [0.4.0] - 2023-8-9
 - 优化：修改工作区储存数据格式，切换文件储存路径后可以保存所有路径下的文件排序
 - 优化：图片列表加载后自动滚动到当前设置的背景图位置

## [0.3.0] - 2023-8-8
 - 优化：侧栏图片列表加载优化，使用懒加载题升加载速度，文档中的图片路径使用blob路径
 - 调整：切换文件储存路径时重置配置项中的储存列表

## 0.2.5 - 2023-8-4
 - 修复：生产环境对package.json文件的引用路径错误修改
 - 调整：输出目录改为dist

## [0.2.4] - 2023-8-4
 - 修复：打包格式改为commonJs
 - 优化：删除生产环境部分不需要的打包文件

## [0.2.1] - 2023-8-4
 - 升级：使用rollup辅助压缩生产环境项目
 - 优化：修改当前所有循环引用

## [0.1.1] - 2023-7-10
 - 优化：大图查看添加缩放和拖拽功能
 - 修复：大图查看webview页面在关闭后，再次打开失败bug修复

## [0.1.0] - 2023-7-10
 - 升级：webview引用js、css文件打包逻辑修改，在开发环境下实时合并；生产环境预发布时需要执行pre命令将js、css文件合并压缩，生产环境中可以直接引用（但是css的图标引用还需要在版本更新后进行更新）
 - 新增：webview查看大图功能
 - 优化：按钮文本取消换行，添加title用于显示具体内容；显示当前保存背景数

## [0.0.7] - 2023-5-23

- 优化：删除图片同时删除随机切换数据列表内的对应数据
- 优化：选中一张图片后显示全选和取消选中的操作按钮

## [0.0.6] - 2023-5-21

- 优化：webview页面图片加载优化

## [0.0.5] - 2023-5-21

- 修复：透明度修改失败修复

## [0.0.4] - 2023-5-20

- 修复：切换图片后通过修改引用路径后缀清除缓存

## [0.0.3] - 2023-5-20

- 修复：图片储存路径不存在时自动创建对应文件夹

## [0.0.2] - 2023-5-20

- 修复：webview页面未显示，相关文件未进行打包修复

## [0.0.1] - 2023-5-20

- 发布：添加背景图功能实现
> end
- Initial release

[0.5.3]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.5.3
[0.5.2]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.5.2
[0.5.0]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.5.0
[0.4.7]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.4.7
[0.4.0]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.4.0
[0.3.0]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.3.0
[0.2.4]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.2.4
[0.2.1]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.2.1
[0.1.1]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.1.1
[0.1.0]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.1.0
[0.0.7]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.7
[0.0.6]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.6
[0.0.5]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.5
[0.0.4]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.4
[0.0.3]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.3
[0.0.2]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.2
[0.0.1]: https://github.com/wangyige0701/vscode-custom-extension/releases/tag/v0.0.1