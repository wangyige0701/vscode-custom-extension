# 定制vscode扩展

为自己定制的vscode扩展，记录并实现一些想法，丰富vscode的使用体验。

## 功能

- 自定义vscode软件背景图


## 1. 自定义背景图
<p align="center">
    <img width="400" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/background-main.png" />
</p>

> 灵感来源于另一个设置背景图的扩展([background-cover](https://github.com/AShujiao/vscode-background-cover))  

<br/>  

### 背景图目录
- [使用介绍](#使用介绍)
- [实现思路](#实现思路)
- [体验问题](#体验问题)
- [webview页面开发经验](#webview页面开发经验)
<br/>

### 使用介绍
  - **上传图片：**
    1. 安装完扩展后，侧栏会出现此图标：
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/side-bar.png" />
    </p>
    2. 点击图标，会进入操作页面，选择背景图片有两种方式：本地图片和网络图片：
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/local.png" alt="本地图片/local" />
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/network.png" alt="网络图片/network" />
    </p>
    3. 本地图片直接从文件夹选择，网络图片需要在输入框内输入图片地址。图片保存成功后会在下方的列表中显示：
    <p align="center">
      <img height="300" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/display-in-list.png" />
    </p>
  <br/>

  - **设置背景：**
    点击图片列表的任意图片，弹框选择确认就成功设置背景，设置完成后需要重启软件才能看到背景图应用。
  <br/>

  - **删除图片：**
    点击图片右上角的删除按钮就可以删除此图片。如果删除了当前设置的背景图，背景样式不会因此消失，仍可以正常显示，直到下一次切换背景。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/delete-image.png" />
    </p>
  <br/>

  - **多选操作：**
    1. 点击图片左上角的按钮可以选中一张图片：
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/select-image.png" />
    </p>
    2. 在选中一张图片后可以进行全选或者取消选中的操作：
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/select-all.png" />
    </p>
    3. 对于选中的图片可以进行一下两种操作 

      - 同时删除，可以同时删除所有勾选的图片
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/delect-selected.png" />
    </p>

      - 随机切换选中图片，在选中的图片中进行背景图随机切换（详情可见下一条随即切换的描述）
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/random-selected.png" />
    </p>
  <br/>

  - **随机切换：**
    除了可以设置某张图片为背景，还可以设置多张图片在每次打开软件时切换背景。方式有两种：
    1. 随机切换所有图片。在不选中任意图片时，点击`随机切换（全部）`按钮可以切换所有图片中的任意一张。设置此状态后新添加的图片也会被加入切换列表。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/random-all.png" />
    </p>
    <br/>

    2. 随机切换选中图片。选中一张以上图片后，点击`随即切换（选中）`按钮，可以切换选中图片的任意一张，新上传的图片不会进入切换列表。但是如果删除了某一张图片，则此图片会被移除切换列表。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/random-selected.png" />
    </p>
  <br/>

  - **清除配置：**
    点击顶部`清除背景图配置`按钮可以关闭背景图，被修改的css文件会复原，本地保存的图片文件仍会存在。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/clear.png" />
    </p>
  <br/>

  - **切换储存路径：**
    图片列表中的数据默认保存于扩展根目录下，即vscode插件目录里对应的扩展文件夹中。如果需要切换保存文件夹或者希望导入已有的图片文件夹，可以点击顶部`选择图片储存路径`按钮进行路径切换。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/path-modify.png" />
    </p>
    当修改了默认路径后会出现`重置图片储存路径`按钮，可以将储存路径重置回默认路径。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/path-default.png" />
    </p>
  <br/>

  - **设置不透明度：**
    修改不透明度输入框可以通过输入0.1~1的任意数字，回车或者点击确认按钮完成设置，默认不透明度是0.3。
    <p align="center">
      <img width="200" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/opacity.png" />
    </p>
<br/>

### 实现思路
  - 选择背景图后会将对应bese64数据单独存放于默认或者指定文件夹中，文件名为根据当前时间戳生成的哈希码。 
  <br/>

  - 网络图片通过axios api进行下载，下载完成后同样会将文件base64输入存入指定路径下，并生成一个文件名。
  <br/>

  - 每新增一张图片，就会将对应哈希码放入缓存数组内，后续新增、删除、修改操作都需要操作或者利用此数组。
  <br/>

  - 设置背景图需要操作vscode的样式源文件，在vscode node执行环境(module指向的对象)路径下的`vs/workbench`目录内，需要修改的有两个文件。
    1. vscode的样式文件，需要在文件顶部插入一条css的导入语句`@import url("css url")`用来导入设置背景的样式文件。
    <br/>

    2. 设置具体背景样式的css文件，此文件是有程序自己创建，设置背景的样式、动画和背景图base64数据（设置背景不会引用外部图片的路径，而是直接将图片的base64数据赋值给`background-image`属性）。
    <br/>

    3. （css文件缓存更新） 开发中，发现更换背景图后背景有时没有更新，这是因为css文件会被缓存。源文件导入外部背景文件后会将此文件缓存，如果没有进行任何操作，下次打开软件时只会加载缓存文件的背景图。因此对源文件导入css的路径添加了一个`?time stamp`，在路径后接上一个时间戳，只要有另外的的修改就会更新时间戳从而重新加载文件。
    <p align="center">
      <img width="400" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/css-import.png" />
    </p>
  <br/>

  - 侧栏webview操作页面加载顺序：插件激活后，注册webview页面；webview页面开始加载，加载完成后发送通信请求图片数据；接收到图片信息后先进行图片加载渲染，加载完成后以队列形式执行其余加载透明度、加载当前背景图等方法。
  <br/>

  - 设置背景不透明度，思路同样来自background-cover，因为背景设置是通过修改body的背景属性，而body又被一个div（即实际工作台容器）定位遮盖，所以要想背景被看见，需要让div变得透明，设置body或者工作台div的opacity属性都可以。目前背景图不透明度选择的范围是<font color="red">0.1~1</font>，要想背景图越透明，上层div容器就越不透明，因此给body设置<font color="red">0.9~0.5</font>的透明度，图片的0.1对应body的0.9，以此类推。
<br/>

### 体验问题
  - 官方不建议对vscode的源码进行补丁行为（[具体可以点此查看](https://code.visualstudio.com/docs/supporting/faq#_installation-appears-to-be-corrupt-unsupported)），因此当修改背景图导致css文件被修改后，会被后台检测到，从而弹出一个警告（如下）。解决方法可以通过点击弹框右上角的设置按钮选择‘不再弹出’，当然这样操作如果有预期之外的文件修改同样不能发现。（[似乎可行的方法，有待尝试](https://github.com/lehni/vscode-fix-checksums/blob/master/extension.js)）
  <p align="center">
    <img width="400" src="https://raw.githubusercontent.com/wangyige0701/vscode-custom-extension/master/resources/docs/background/file-modify-warnign.png" />
  </p>
  <br/>

  - 背景图的显示是通过设置body背景样式，而图片的透明状态是通过修改工作台div的不透明度，所以会存在工作台的所有元素都会变得透明这个问题，无论是图片还是代码都会比深色背景看起来更费劲，如果不喜欢这种体验则最好不要进行背景图的设置。~~目前的想法是可以对工作台div容器的before伪元素进行背景设置，保持容器不透明度不变，后续尝试能否优化。~~<font color="red">经过测试，工作台div容器对伪元素设置背景图防止子元素透明方法不成立：由于子元素层级过多且不同地方设有背景色，会导致工作台的祖先div即类名为window的div容器即使设置了背景图也会被子元素的背景色遮盖，必须给body设置opacity全局透明才能显示背景图。</font>
  <br/>

### webview页面开发经验
  - 开发webview页面需要通过实现`WebviewViewProvider`内的`resolveWebviewView`方法，将html文本赋值给webview的html属性，为了实现普通的html开发体验，我使用node编写了一个脚本，每次编译时会将指定webview开发目录下的文件进行遍历，提取html文件获取文本内容，根据脚本符#js、#css获取设置引用js、css文件的位置，并根据根目录生成正确的引用路径进行脚本符替换。
  <br/>
  
  - 而在测试中发现css、js文件只能引用一个路径，所以为了进行文件的拆分开发，同样使用脚本将js、css目录下的文件分别遍历，获取文本内容进行排序合并，并写入于html同级目录下创建的index.css、index.css文件中。至此，可以像普通的html项目一样使用html、css、js进行开发。
  > 当前版本使用此方法进行webview开发仍有优化点，因为设计过程中未进行考虑，所以目前只能在生产环境中进行实时文件合并，虽然加上了对生产环境进行版本校验，但更新版本后的合并操作仍然属于不必要的开销。<br/>
  > 目前的想法是，后续版本新增一个打包命令，文件合并完成后再将所有文件推送上传，这就需要将判断方法改为：
    > 1、如果是开发环境，直接调用合并方法；
    > 2、如果是生产环境，打包前先调用合并方法进行合并，而后再打包推送；
    > 3、合并方法内的版本校验可以删除，同时修改注册webview方法内的调用顺序；
    > 4、尝试对js和css文件进行简单压缩。

  > <font color="red">以上已于0.1.0版本中完成优化，在预发布时进行压缩打包，生产环境不会对js、css文件再次进行合并操作，节省开销；css文件因为要更新图标引用路径，所以会在版本更新时进行一次文件操作。</font>
