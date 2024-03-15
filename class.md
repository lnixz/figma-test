```mermaid
classDiagram
    class CommandLineInterface {
        +parseOptions()
        +validateRequiredOptions()
    }
    class ConfigFile {
        +readPackageJson()
        +readFigmaConfigJs()
        +mergeConfigurations()
    }
    class FigmaAPI {
        +fetchFileInfo()
        +exportImages()
    }
    class FileSystem {
        +ensureDirectoryExists()
        +saveImageToFile()
    }
    class Utility {
        +getFileIdByURL()
        +filterNodesByType()
    }

    CommandLineInterface --> ConfigFile : 读取配置
    CommandLineInterface --> Utility : 解析Figma文件URL
    CommandLineInterface --> FigmaAPI : 传递API调用选项
    FigmaAPI --> FileSystem : 保存导出的图片
    ConfigFile --> CommandLineInterface : 合并命令行选项与文件配置
    Utility --> FigmaAPI : 过滤导出的节点
    FigmaAPI --> Utility : 使用工具函数进行数据操作

    class Application {
        +start()
    }
    Application --> CommandLineInterface : 启动命令行解析
    Application --> ConfigFile : 启动配置读取
    Application --> FigmaAPI : 启动API调用
    Application --> FileSystem : 启动文件保存操作
    Application --> Utility : 使用工具函数

```

这个Mermaid图展示了Figma图片下载工具的主要组件和它们之间的关系。以下是各组件的简要说明：

- CommandLineInterface：负责解析命令行参数，验证必要的选项。
- ConfigFile：从package.json和figma.config.js读取配置，合并配置项。
- FigmaAPI：调用Figma API获取文件信息和导出图片。
- FileSystem：确保目录存在，将导出的图片保存到文件。
- Utility：提供辅助功能，如通过URL解析文件ID，根据类型过滤节点。
- Application：应用程序的入口点，负责启动和协调上述组件的交互。

这个设计图全面展现了工具的设计思路，包括组件的职责和它们之间的交互方式，有助于理解整个应用程序的工作流程和架构设计。

```mermaid
flowchart TD
    A[开始] --> B{解析命令行参数}
    B --> C{读取配置文件}
    C --> D{合并配置}
    D --> E{验证必要参数}
    E -->|缺少参数| F[结束并报错]
    E -->|参数完整| G[解析Figma文件和页面ID]
    G --> H{调用Figma API获取文件信息}
    H --> I{过滤节点}
    I --> J{导出图片}
    J --> K{保存图片到本地}
    K --> L[结束]

    style A fill:#f98,stroke:#333,stroke-width:4px
    style L fill:#f98,stroke:#333,stroke-width:4px
```

这个Mermaid流程图展示了Figma图片下载工具的工作流程，从开始到结束，每一步骤都清晰地标识了其功能和作用，以及它们之间的逻辑关系。流程图比类图更直观地展示了程序的执行流程，有助于理解整个应用程序的操作逻辑和步骤顺序。