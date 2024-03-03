# Figma 图片下载器

这个npm包旨在帮助开发者从Figma设计文件中下载图片。它支持通过Figma API下载特定类型节点的图片，并允许用户通过命令行参数、配置文件或`package.json`中的配置来指定下载选项。

## 功能特点

- 支持多种节点类型的图片下载
- 支持命令行参数、`figma.config.js`配置文件和`package.json`配置
- 灵活的配置优先级，以适应不同的工作流程

## 安装

使用npm安装：

```bash
npm install @xinliang/figma -D
```

`@xinliang/figma` 将提供一个 `figma` 命令用来下载图片



## 使用方法

### 通过命令行

由于命令行中的特殊字符可能导致解析错误，建议将命令添加到`package.json`的`scripts`字段中，如下所示：

1. 在项目的`package.json`文件中，添加一个脚本命令：


```json

"scripts": {
    "download-figma-images": "figma --url=\"https://www.figma.com/file/示例文件ID/示例页面名称?type=design&node-id=示例节点ID&mode=design\" -t \"你的Figma访问令牌\""
}
```


请将`示例文件ID`、`示例页面名称`、`示例节点ID`和`你的Figma访问令牌`替换为实际的值。

2. 通过运行以下命令来执行脚本：

使用npm：

```bash
npm run download-figma-images
```


### 可用选项

- `-u, --url <url>`: Figma文件的URL（必需）
- `-t, --accessToken <accessToken>`: Figma访问令牌（必需）
- `-p, --imageSavePath [imageSavePath]`: 图片保存路径，默认为`./figma/images`
- `-n, --nodeTypes [nodeTypes]`: 要下载的节点类型，多个类型用逗号分隔，默认为`FRAME`
- `-s, --scale [scale]`: 图片缩放比例，介于0.01和4之间，默认为2
- `-f, --format [format]`: 图片输出格式，可以是`jpg`、`png`、`svg`或`pdf`，默认为`png`

### 配置文件

您可以在项目根目录下创建一个`figma.config.js`文件，以JavaScript对象的形式指定配置选项。例如：

```javascript
    module.exports = {
        url: "Figma文件URL",
        accessToken: "Figma访问令牌",
        imageSavePath: "./path/to/save/images",
        nodeTypes: "FRAME,COMPONENT",
        scale: 1,
        format: "png"
    };
```


此外，您也可以在`package.json`中添加一个`figma`节点来指定配置：

```json
// package.json
{
    "figma": {
        "url": "Figma文件URL",
        "accessToken": "Figma访问令牌",
        ...
    }
}
```