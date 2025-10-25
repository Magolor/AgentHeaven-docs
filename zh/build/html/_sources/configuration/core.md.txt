# 核心配置

AgentHeaven 使用一个综合性的配置系统来管理不同组件和环境的设置。本文档涵盖了核心配置概念、文件结构和管理命令。

## 1. 配置结构

AgentHeaven 使用分层配置系统。与 GitHub/Conda 类似，AgentHeaven 具有三层配置文件：本地配置 >> 全局配置 >> 系统默认配置。

具体来说，在一个仓库中，AgentHeaven 的配置系统遵循分层优先级顺序：

1. **本地配置** (`$ROOT/.ahvn/config.yaml`) - 最高优先级
2. **全局配置** (`~/.ahvn/config.yaml`) - 中等优先级
3. **系统默认配置** - 最低优先级（后备）

本地配置文件通常只包含与全局配置文件不同的增量选项。当存在冲突时，本地配置优先。所有配置文件均为 YAML 格式，支持字典/列表结构，并可与 JSON 或 Python 字典相互转换。

当 AgentHeaven 读取配置时，它会合并这些层级，本地设置会覆盖全局设置，而全局设置又会覆盖系统默认值。

在首次安装或重置时，使用 `ahvn setup --reset/-r` 命令将全局配置 **覆盖** 为系统默认配置。此操作会在 `~/.ahvn/config.yaml` 创建全局配置文件。
```bash
ahvn setup --reset
```

通常，使用 `ahvn config set` (或 `unset`) 命令来修改配置：

```bash
ahvn config set [--global/-g] <key_path> <value>
```

<br/>

## 2. 默认配置结构

系统默认配置文件位于 `ahvn` 包内。你可以使用 `show -s` 命令来显示它，或者使用 `open -s` 命令来打开它（不推荐，用户不应修改系统默认配置）：

```bash
ahvn config show [--system/-s]
```

你将看到以下结构的配置，包括整个 AgentHeaven 的设置，以及 LLM、关系数据库、向量数据库和其他组件的设置：

```yaml
# src/ahvn/resources/configs/default_config.yaml
core:
    env: dev
    debug: false
    encoding: utf-8
    ...
user:
    ...
prompts:
    ...
llm:
    # LiteLLM 兼容格式：
    #   <provider>/<model_identifier>
    default_args:
        ...
    default_preset: sys
    presets:
        sys:
            ...
        ...
    default_model: gemini-2.5-flash
    models:
        ...
    default_provider: openrouter
    providers:
        ...
    ...
db:
    # SQLAlchemy 兼容格式：
    #   <dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
    default_provider: sqlite
    providers:
        ...
vdb:
    # 目前仅支持 ChromaDB 和 Milvus
    default_provider: chroma
    providers:
        ...
```

<br/>

## 3. 配置文件管理

### 3.1. 创建配置文件

使用 `ahvn setup` 初始化全局配置。你可以使用 `-r` 强制重置。

```bash
ahvn setup [--reset/-r]
```

初始全局配置是从系统默认配置复制而来的。初始化后，你可以使用 `show -g` 查看全局配置，或使用 `open -g` 命令打开它。

```bash
ahvn config show [--global/-g]
```

<br/>

### 3.2. 查看配置

要查看不同的配置层级：

```bash
# 查看当前有效配置（从所有层级合并）
ahvn config show

# 仅查看全局配置
ahvn config show --global

# 查看系统默认配置
ahvn config show --system
```

<br/>

### 3.3. 修改配置

通常，使用 `ahvn config set` 命令来修改配置：

```bash
ahvn config set [--global/-g] <key_path> <value>
```

在这里，`<key_path>` 是一个用 `.` 连接的字典键路径（键不能包含空格，键中的 `.` 应使用 `\.` 转义）。对于数组，你可以使用 `<arr>[<idx>]` 格式：当 `<idx>` 为 0 时，访问第一个元素；当 `<idx>` 为 -1 时，访问最后一个元素；当 `<idx>` 等于数组长度时，它会在末尾追加一个新元素。

**示例：**
```bash
# 设置一个简单的字符串值
ahvn config set --global llm.default_model gemini-flash

# 设置一个数值
ahvn config set core.debug true

# 设置数组元素
ahvn config set prompts.langs[0] en

# 追加到数组
ahvn config set prompts.langs[2] fr  # 当索引等于数组长度时追加
```

类似地，使用 `unset` 命令来删除一个配置：

```bash
ahvn config unset [--global/-g] <key_path>
```

**使用 JSON 批量修改：**

当修改多个配置时，连续执行命令可能会因为 CLI 启动开销而变慢。对于批量修改，请改用 JSON 格式：

```bash
# 使用 JSON 一次设置多个值
ahvn config set --global --json llm.presets.lover '{"provider":"openai","model":"gpt-4o","temperature":1.2}'

# 设置数组
ahvn config set --global --json prompts.langs '["en","zh","fr"]'
```

`--json/-j` 标志告诉命令将值解析为 JSON，允许您在单个操作中设置复杂的嵌套结构。

<br/>

### 3.4. 编辑配置文件

对于更复杂的修改，您可以在默认编辑器中直接编辑配置文件：

```bash
# 编辑本地配置（当前仓库）
ahvn config edit

# 编辑全局配置
ahvn config edit --global

# 编辑系统默认配置（不推荐用户使用）
ahvn config edit --system
```

这会在系统的默认编辑器中打开相应的 YAML 配置文件（由 `EDITOR` 环境变量确定，回退到常见的编辑器如 `nano`、`vim` 或 `notepad`）。

<br/>

### 3.5. 打开配置文件

要在文件浏览器或默认应用程序中打开配置文件：

```bash
# 打开本地配置目录
ahvn config open

# 打开全局配置目录
ahvn config open --global

# 打开系统默认配置目录
ahvn config open --system
```

<br/>

## 4. 高级配置

### 4.1. 提示词与本土化 (i18n) 配置

AgentHeaven 支持强大的提示词管理系统，内置了模板和国际化 (i18n) 功能。

- **内置提示词**: AgentHeaven 包含了多种用于常见任务的预置提示词模板。这些模板位于 `src/ahvn/resources/prompts` 目录中，可自动使用。内置的提示词类别包括：
    - `autocode`: 用于代码生成的提示词。
    - `autofunc`: 用于从自然语言生成函数调用的提示词。
    - `autoi18n`: 用于自动翻译的提示词。
    - `autotask`: 用于任务分解和规划的提示词。
    - `db`: 与数据库交互相关的提示词 (例如 NL2SQL)。
    - `experience`: 用于自主经验收集和学习的提示词。
    - `toolspec`: 用于生成工具规范的提示词。

- **提示词语言选择**：配置中的 `prompts` 部分控制可用语言和用于内置提示模板的默认语言。例如：

```yaml
prompts:
    langs: [en, zh]
    main: en            # 提示模板的默认语言（源）
    lang: zh            # 用户首选语言（目标，可与 `main` 不同）
    scan:
        - "& prompts/"
        - "~/.ahvn/prompts/"
```

使用 CLI 全局设置这些值，例如：

```bash
ahvn config set --global prompts.main en
ahvn config set --global prompts.langs '["en","zh"]'
```

- **提示文件和发现**：`prompts.scan` 列出了 AgentHeaven 扫描模板文件的文件夹。你可以将带有 i18n 的 jinja 模板文件夹放在扫描路径下（例如 `~/.ahvn/prompts/my_awesome_prompt/`），然后该提示可以通过 `load_jinja_env().get_template("my_awesome_prompt/<prompt_entry_point>.jinja")` 直接使用，默认语言从 `prompts.lang` 获取。

- **编码和特殊字符**：`core.encoding` 设置控制 AgentHeaven 读取和写入所有文件的方式。默认为 `utf-8`。在 i18n 期间遇到特殊字符问题时，请考虑调整本地配置的编码设置或模板文件本身。

> **提示**：如果你在模板中为提示 LLM 嵌入占位符或特殊字符，请验证它们在目标 LLM 提供商中是否能正确渲染。大多数提供商期望使用 UTF-8 输入。

<br/>

### 4.2. 代理配置

如果你处于特殊的网络环境中，可以在每个组件（核心、LLM、远程连接、关系数据库）中配置 `http_proxy` 和 `https_proxy`。

例如：

```yaml
llm:
    default_args:
        http_proxy: "<HTTP_PROXY>"
        https_proxy: "<HTTPS_PROXY>"
```

这指定了 LLM 的默认网络代理。

<br/>

### 4.3. 环境变量和命令

使用尖括号 `<>` 的配置被视为占位符，默认情况下将被同名的系统环境变量替换。例如：

```yaml
llm:
    providers:
        openrouter:
            api_key: "<OPENROUTER_API_KEY>"
```

这允许你通过将 API 密钥等敏感信息设置为环境变量，从而避免将它们保存在配置文件中：

```bash
export OPENROUTER_API_KEY="your_actual_api_key_here"
```

此外，`${}` 包装的内容将被相应 shell 命令的输出替换。例如：

```yaml
db:
    pg:
        dialect: postgresql
        driver: psycopg2
        host: "localhost"
        port: 5432
        username: "${whoami}"
```

当加载配置时，用户名将被动态设置为 `whoami` 命令的输出。

这可以用于保护敏感信息，避免将其硬编码到配置文件中。例如，像 `api_key` 这样的信息以纯文本形式存储在配置文件中，这可能会带来安全风险，尤其是在使用 `git` 进行项目开发时。

因此，我们建议所有使用 AgentHeaven 的项目首先将 `.ahvn/` 添加到 `.gitignore` 中（即使不是出于安全原因，`.ahvn` 目录也可能包含大量的知识和模型文件，上传到 GitHub 时也应忽略），然后使用 `<>` 或 `${}` 设置配置，而不是在本地配置文件中硬编码敏感信息。

<br/>

### 4.4. UKF 配置

配置中的 `ukf` 部分定义了统一知识框架（Unified Knowledge Framework）的参数，该框架用于规范数据表示。

```yaml
ukf:
    version: "1.0.0"
    text:
        id: 63
        short: 255
        medium: 2047
        long: 65535
```

- `version`：正在使用的 UKF 规范的版本。
- `text`：为不同文本字段定义最大长度约束。
    - `id`：标识符的最大长度。
    - `short`：短文本字段的最大长度。
    - `medium`：中等长度文本字段的最大长度。
    - `long`：长文本字段的最大长度。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中配置的更多信息，请参见：
> - [LLM 配置](./llm.md) - 具体的 LLM 配置选项
> - [数据库配置](./database.md) - 关系数据库连接和存储配置
> - [向量数据库配置](./vdb.md) - 向量数据库连接和存储配置
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

<br/>
