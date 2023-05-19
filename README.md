# Wang Yige 定制扩展

为自己定制的vscode扩展，记录并实现一些想法，丰富vscode的使用体验。

## 功能

- 自定义vscode软件背景图 [#](#自定义背景图- '自定义背景图详细介绍')


### 自定义背景图
<p align="center">
    <img src="https://raw.githubusercontent.com/wangyige0701/vscodeCustomExtension/master/resources/extension/background/background-main.png" />
</p>

> 灵感来源于另一个设置背景图的扩展（[background-cover](https://github.com/AShujiao/vscode-background-cover)）

工作流程
- 选择背景图，从本地选择或者网络下载图片，将图片转为base64的图片数据并保存于指定路径下。
- 储存背景图，图片的base64数据在保存时会生成一个哈希码，这个哈希码就是文件名，后面的设置删除等操作都依靠哈希码进行。
- 设置背景图，通过侧栏打开webview页面后会加载所有保存的背景图，点击后会将对应的哈希码通过通信传递给扩展进行设置。
  - 设置第一步通过哈希码查找文件，获取储存的base64数据。
  - 第二步对设置css样式的文件进行修改，一共有两处需要操作。第一个是vscode css样式的源文件，需要在首行添加(`@import url("")`)引入设置背景样式的css文件；设置背景图样式的文件由扩展进行创建，放置于源文件同一个目录下，其中设置了背景图的各个样式和相关动画，并保存有操作时间、版本等信息。
