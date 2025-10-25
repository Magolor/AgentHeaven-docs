# 模板处理

`jinja_utils.py` 模块为在 AgentHeaven 中使用 Jinja 模板和通过 Babel 进行国际化 (i18n) 提供了全面的实用工具。本指南将逐步介绍如何使用模板系统、Babel 集成和环境管理。

## 1. 入门指南

### 1.1. 模板结构

AgentHeaven 中的每个模板目录都遵循一致的结构，支持模板、自定义过滤器和国际化：

```
template_directory/
├── *.jinja                 # Jinja 模板文件
├── filters/                # 自定义 Jinja 过滤器
│   └── *.py                # Python 过滤器模块
└── locale/                 # Babel 国际化
    ├── babel.cfg           # Babel 配置
    ├── messages.pot        # 可移植对象模板
    └── zh/LC_MESSAGES/     # 特定语言翻译
        ├── messages.po     # 翻译文件
        └── messages.mo     # 编译后的翻译
```

每个模板目录的三个主要组件：

- **模板 (`.jinja` 文件)**：包含带有 Jinja 语法和可翻译字符串的模板内容
- **过滤器 (`filters/` 目录)**：扩展 Jinja 过滤功能的自定义 Python 函数  
- **本地化 (`locale/` 目录)**：用于多语言支持的 Babel 国际化文件

<br/>

### 1.2. 基本用法

`jinja_utils` 为模板管理提供了三个主要函数：

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env, babel_init, babel_compile

# 使用默认设置加载 Jinja 环境
env = load_jinja_env()

# 从经验目录渲染模板
template = env.get_template("experience/default_instance.jinja")
result = template.render(inputs={"query": "test"}, output="response")
print(result)
```

<br/>

## 2. Jinja 环境

### 2.1. 什么是 Jinja？

[Jinja](https://jinja.palletsprojects.com/en/stable/) 是一个快速、表达性强、可扩展的 Python 模板引擎。模板中的特殊占位符允许您编写类似于 Python 语法的代码。然后将数据传递给模板以呈现最终文档。它广泛用于生成 HTML、配置文件，以及随着大语言模型的兴起，也用于生成提示模板。

例如，您可以创建如下模板：

```jinja
你好，{{ name }}！欢迎来到我们的平台。
```

然后用 Python 渲染它：

```python
from jinja2 import Template

template = Template("你好，{{ name }}！欢迎来到我们的平台。")
output = template.render(name="Alex")
print(output)  # 输出: 你好，Alex！欢迎来到我们的平台。
```

这种逻辑与表示的分离使得创建动态内容变得容易。

<br/>

### 2.2. 加载环境

`load_jinja_env` 函数创建配置的 Jinja 环境，具有自动本地化和过滤器加载功能：

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# 从默认扫描路径加载（在 prompts.scan 中配置）
env = load_jinja_env()

# 从单个目录加载
env = load_jinja_env("path/to/templates")

# 使用选择加载器从多个目录加载
env = load_jinja_env(["templates/en", "templates/es"])

# 使用前缀加载器进行命名空间分离
env = load_jinja_env({
    "experience": "src/ahvn/resources/prompts/experience",
    "autocode": "src/ahvn/resources/prompts/autocode"
})

# 使用特定语言加载
env_zh = load_jinja_env(lang="zh")
```

<br/>

### 2.3. 内置模板

AgentHeaven 在 `src/ahvn/resources/prompts/` 目录中组织内置模板，包含多个模板文件夹，每个文件夹遵循单个模板文件夹结构：

```
src/ahvn/resources/prompts/
├── experience/          # 经验模板
│   ├── default_instance.jinja
│   ├── correct_instance.jinja
│   ├── filters/         # 自定义 Jinja 过滤器
│   │   └── value_repr.py
│   └── locale/          # Babel 本地化文件
│       ├── babel.cfg
│       ├── messages.pot
│       └── zh/LC_MESSAGES/
│           ├── messages.po
│           └── messages.mo
├── autocode/           # 自动代码模板
│   └── default.jinja
├── autofunc/           # 自动函数模板
│   └── default.jinja
├── toolspec/           # 工具规范模板
│   └── default.jinja
└── po_translate/       # 翻译模板
    └── default.jinja
```

### 2.4. 模板路径扫描

除了内置模板外，用户还可以在 `prompts.scan` 配置中添加自己的模板。

当在 `load_jinja_env` 中未指定路径时，系统会扫描在 `prompts.scan` 中配置的目录：

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env
from ahvn.utils.basic.config_utils import HEAVEN_CM

# 检查当前扫描配置
scan_paths = HEAVEN_CM.get("prompts.scan", ["$ prompts/"])
print(f"扫描路径: {scan_paths}")

# 使用自动扫描加载
env = load_jinja_env()

# 通过目录前缀访问模板
template = env.get_template("experience/default_instance")
```

扫描器会自动：
- 使用 AgentHeaven 的路径解析扩展路径
- 为找到的每个子目录创建前缀加载器
- 从每个目录加载过滤器和翻译

<br/>

### 2.5. 自定义过滤器

自定义 Jinja 过滤器会自动从每个模板目录的 `filters/` 目录加载：

```python
# 创建自定义过滤器: my_filters/value_format.py
def value_format(value, precision=2):
    """用指定精度格式化数值。"""
    if isinstance(value, (int, float)):
        return f"{value:.{precision}f}"
    return str(value)

# 过滤器在模板中自动可用
env = load_jinja_env("path/to/templates")
template = env.get_template("my_template.jinja")

# 模板用法: {{ price | value_format(3) }}
result = template.render(price=123.456789)
```

<br/>

## 3. Babel 本地化

### 3.1. 什么是 Babel？

[Babel](https://babel.pocoo.org/en/latest/) 是一个 Python 库，用于协助应用程序的国际化 (i18n) 和本地化 (l10n)。它通过提供工具来提取可翻译文本、创建翻译目录并将其编译以在运行时使用，从而帮助您管理项目的翻译。

例如，您可以在 Python 代码中标记一个字符串以进行翻译：

```python
from babel.support import Translations

# 假设翻译已加载
translations = Translations.load('locale', ['en_US', 'de_DE'])
_ = translations.gettext

print(_('Hello, world!'))
```

当应用程序在德语环境中运行时，如果翻译可用，它可能会打印 `"Hallo, Welt!"` 而不是 `"Hello, world!"`。在 AgentHeaven 中，Babel 与 Jinja 集成以无缝处理模板翻译。

<br/>

### 3.2. Jinja 和 Babel 如何协同工作

AgentHeaven 结合了 Jinja2 和 Babel，为提示词创建了一个强大的国际化 (i18n) 工作流。这使您可以编写单个提示词模板并以多种语言呈现它。以下是它们如何交互的：

1.  **标记可翻译文本**：在您的 `.jinja` 模板中，将任何需要翻译的文本包裹在 `{% trans %}...{% endtrans %}` 标签中。
2.  **提取**：`babel` 命令行工具（或 `babel_init` 函数）会扫描您的模板，找到这些 `trans` 块，并将文本提取到一个 `.pot`（可移植对象模板）文件中。该文件是所有可翻译字符串的主列表。
3.  **翻译**：从 `.pot` 文件中，为每个目标语言（例如，中文为 `zh`）创建特定语言的 `.po`（可移植对象）文件。然后，翻译人员在这些文件中为每个字符串填写相应的翻译。此步骤可以手动完成，也可以使用 `ahvn babel translate` 命令自动完成。
4.  **编译**：完成的 `.po` 文件使用 `babel_compile` 函数编译成二进制的 `.mo`（机器对象）文件。这些文件经过优化，可在运行时快速查找。
5.  **渲染**：当您使用特定语言（例如 `lang="zh"`）加载 Jinja 环境时，它会自动查找并使用相应的 `.mo` 文件。当它在渲染过程中遇到 `{% trans %}` 块时，它会用翻译版本替换原始文本。

这整个过程实现了提示词逻辑与翻译的清晰分离，使得管理和扩展多语言智能体应用变得容易。

<br/>

### 3.3. 初始化

`babel_init` 函数设置国际化基础设施：

```python
from ahvn.utils.basic.jinja_utils import babel_init

# 为模板目录初始化 Babel
babel_init("src/ahvn/resources/prompts/experience")

# 使用特定语言初始化
babel_init(
    "src/ahvn/resources/prompts/experience",
    langs=["zh", "es", "fr"],
    main="en"
)

# 使用覆盖初始化（清除现有翻译）
babel_init(
    "src/ahvn/resources/prompts/experience",
    langs=["zh"],
    overwrite=True
)
```

这会创建：
- `locale/babel.cfg`: Babel 配置文件
- `locale/messages.pot`: 带有可提取字符串的可移植对象模板
- `locale/zh/LC_MESSAGES/messages.po`: 中文翻译文件

然后推荐的方法是手动编辑 `.po` 文件以添加每种语言的翻译。

> **开发中：** 添加通过机器翻译服务进行自动翻译的支持。

<br/>

### 3.4. 编译翻译

`babel_compile` 函数将 `.po` 文件编译成二进制 `.mo` 文件：

```python
from ahvn.utils.basic.jinja_utils import babel_compile

# 编译所有可用语言
babel_compile("src/ahvn/resources/prompts/experience")

# 编译特定语言
babel_compile(
    "src/ahvn/resources/prompts/experience",
    langs=["zh", "es"]
)

# 使用自动检测可用语言进行编译
babel_compile("src/ahvn/resources/prompts/experience")
```

编译后的 `.mo` 文件可以被 Babel 在加载环境时识别。

加载环境时，指定要使用的语言：

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

env = load_jinja_env(lang="zh")
```

<br/>

### 3.5. 可翻译模板

模板使用 Jinja 的 i18n 扩展来处理可翻译内容：

```jinja
{# experience/default_instance.jinja -#}
{% trans %}Inputs:{% endtrans %}
{% for key, value in inputs.items() -%}
- {{ key }}: {{ value | value_repr }}
{% endfor -%}

{% trans %}Output:{% endtrans %}
- {{ output | value_repr(-1) }}

{% if expected is defined -%}
{% trans %}Expected:{% endtrans %}
- {{ expected | value_repr(-1) }}
{% endif -%}
```

翻译工作流：
1. 创建带有 `{% trans %}...{% endtrans %}` 块的模板
2. 运行 `babel_init()` 将字符串提取到 `.pot` 文件
3. 在 `.po` 文件中翻译字符串
4. 运行 `babel_compile()` 编译为 `.mo` 文件
5. 使用特定语言加载环境

<br/>

## 4. 高级功能

### 4.1. 多语言模板渲染

以不同语言渲染模板：

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# 为不同语言加载环境
env_en = load_jinja_env(lang="en")
env_zh = load_jinja_env(lang="zh")

# 以不同语言渲染相同模板
template_en = env_en.get_template("experience/default_instance")
template_zh = env_zh.get_template("experience/default_instance")

result_en = template_en.render(inputs={"test": "data"}, output="result")
result_zh = template_zh.render(inputs={"test": "数据"}, output="结果")
```

<br/>

### 4.2. 配置集成

该模块与 AgentHeaven 的配置系统集成：

```python
from ahvn.utils.basic.config_utils import HEAVEN_CM
from ahvn.utils.basic.jinja_utils import load_jinja_env

# 配置国际化设置
HEAVEN_CM.set("prompts.main", "en")        # 源语言
HEAVEN_CM.set("prompts.lang", "zh")        # 目标语言
HEAVEN_CM.set("prompts.langs", ["zh", "es"]) # 可用语言
HEAVEN_CM.set("prompts.scan", ["& prompts/"]) # 模板扫描路径

# 使用配置默认值加载
env = load_jinja_env()  # 自动使用中文语言
```

<br/>

### 4.3. 与 UKF 集成

> **开发中：** 添加对 UKF（统一知识格式）集成的支持。

<br/>

## 5. 最佳实践

### 5.1. 示例：经验格式化

`experience/default_instance.jinja` 模板演示了高级功能。

#### 5.1.1. Jinja 模板

```jinja
{#-
必需:
    inputs (Dict[str, Any]): 输入变量及其值的字典。
    output (Any): 输出值。
可选:
    expected (Any): 预期输出值。如果未提供则省略。
    cutoff (int): 显示输入值的最大长度，默认为 256（字符）。
    hints (List[str]): 提示或附加信息列表。如果未提供则省略。
过滤器:
    value_repr(cutoff:int=256): 格式化值表示的过滤器，必要时进行截断。
-#}
{% trans %}Inputs:{% endtrans %}
{% for key, value in inputs.items() -%}
- {{ key }}: {{ value | value_repr(cutoff|default(256)) }}
{% endfor -%}
{% trans %}Output:{% endtrans %}
- {{ output | value_repr(-1) }}
{% if expected is defined -%}
{% trans %}Expected:{% endtrans %}
- {{ expected | value_repr(-1) }}
{% endif -%}
{% if hints is defined and hints|length > 0 -%}
{% trans %}Hints:{% endtrans %}
{% for hint in hints -%}
- {{ hint }}
{% endfor -%}
{% endif -%}
```

#### 5.1.2. 自定义过滤器

`filters/value_repr.py` 中的 `value_repr` 过滤器：

```python
CUTOFF_LENGTH_DEFAULT = 256

def value_repr(value, cutoff=CUTOFF_LENGTH_DEFAULT):
    """\
    返回值的字符串表示，截断到指定长度。

    参数:
        value: 要表示的值。
        cutoff: 字符串表示的最大长度。
            如果 cutoff 为负，则不应用截断。

    返回:
        值的字符串表示，必要时进行截断。
    """
    s = repr(value)
    return s if len(s) <= cutoff or cutoff < 0 else s[: cutoff - 3] + "..."
```

<br/>

#### 5.1.3. 用法

AgentHeaven 中的模板已经翻译成英文和中文，因此我们可以直接加载它们而无需国际化初始化。

> **开发中：** 添加更多语言的内置模板翻译。

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# 步骤 2: 加载环境
env = load_jinja_env(lang="en")

# 步骤 3: 使用示例数据渲染
data = {
    "inputs": {
        "query": "What is the capital of France?",
        "context": "Geography question"
    },
    "output": "The capital of France is Paris.",
    "expected": "Paris",
    "cutoff": 50,
    "hints": ["Consider European geography", "Capital cities"]
}

template = env.get_template("experience/default_instance")
result = template.render(**data)
print(result)
```

输出：
```
Inputs:
- query: 'What is the capital of France?'
- context: 'Geography question'
Output:
- 'The capital of France is Paris.'
Expected:
- 'Paris'
Hints:
- Consider European geography
- Capital cities
```

<br/>

### 5.2. 模板组织

有效组织模板：

```python
# 良好：按功能逻辑分离
template_paths = {
    "experience": "prompts/experience",
    "tools": "prompts/toolspec",
    "generation": "prompts/autocode"
}
env = load_jinja_env(template_paths)

# 良好：一致的命名约定
template = env.get_template("experience/user_interaction")
```

<br/>

### 5.3. 国际化策略

规划多语言：

```python
# 配置支持的语言
HEAVEN_CM.set("prompts.langs", ["en", "zh", "es", "fr"])

# 在模板中使用可翻译字符串
# 良好: {% trans %}Hello World{% endtrans %}
# 不良: Hello World

# 为翻译者提供上下文
# {# 上下文: 用户问候消息 #}
# {% trans %}Welcome to AgentHeaven!{% endtrans %}
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中提示词使用的更多信息，请参见：
> - [提示管理](../../../cli-guide/prompt-management.md) - CLI 中的提示词创建和本地化

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
