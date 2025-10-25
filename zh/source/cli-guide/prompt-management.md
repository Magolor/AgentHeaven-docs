# 提示词管理

AgentHeaven 结合使用 [Jinja2](https://jinja.palletsprojects.com/en/3.1.x/) 模板和 [Babel](https://babel.pocoo.org/en/latest/)，以实现强大而灵活的提示词管理。这种方法允许您将提示词结构与内容分离，从而可以轻松地管理、版本化和本地化不同语言的提示词。

有关底层实用工具的详细指南，请参见 [Jinja 实用工具](../python-guide/utils/basic/jinja_utils.md)。

<br/>

## 1. Jinja 和 Babel 如何协同工作

AgentHeaven 结合了 Jinja2 和 Babel，为提示词创建了一个强大的国际化 (i18n) 工作流。这使您可以编写单个提示词模板并以多种语言呈现它。以下是它们的交互方式：

1.  **标记可翻译文本**：在您的 `.jinja` 模板中，将任何需要翻译的文本包裹在 `{% trans %}...{% endtrans %}` 标签中。
2.  **提取**：`babel` 命令行工具（或 `babel_init` 函数）会扫描您的模板，找到这些 `trans` 块，并将文本提取到一个 `.pot`（Portable Object Template）文件中。该文件是所有可翻译字符串的主列表。
3.  **翻译**：从 `.pot` 文件中，为每种目标语言（例如，中文为 `zh`）创建特定语言的 `.po`（Portable Object）文件。然后，翻译人员在这些文件中为每个字符串填写相应的翻译。此步骤可以手动完成，也可以使用 `ahvn babel translate` 命令自动完成。
4.  **编译**：完成的 `.po` 文件使用 `babel_compile` 函数编译成二进制的 `.mo`（Machine Object）文件。这些文件经过优化，可在运行时快速查找。
5.  **渲染**：当您加载具有特定语言（例如 `lang="zh"`）的 Jinja 环境时，它会自动查找并使用相应的 `.mo` 文件。当它在渲染过程中遇到 `{% trans %}` 块时，它会将原始文本替换为翻译版本。

这整个过程实现了提示词逻辑与翻译的清晰分离，从而可以轻松管理和扩展多语言智能体应用。

> 有关使用 Jinja2 进行模板化的更多详细信息，请参见[模板处理](../python-guide/utils/basic/jinja_utils.md)文档。

<br/>

## 2. 模板结构

AgentHeaven 中的每个模板目录都遵循一致的结构，支持模板、自定义过滤器和 i18n：

```
template_directory/
├── *.jinja                 # Jinja 模板文件
├── filters/                # 自定义 Jinja 过滤器
│   └── *.py                # Python 过滤器模块
└── locale/                 # Babel i18n
    ├── babel.cfg           # Babel 配置
    ├── messages.pot        # 可移植对象模板
    └── zh/LC_MESSAGES/     # 特定语言的翻译
        ├── messages.po     # 翻译文件
        └── messages.mo     # 编译后的翻译
```

> 有关创建和使用自定义 Jinja 过滤器的更多详细信息，请参见[模板处理](../python-guide/utils/basic/jinja_utils.md)文档。

<br/>

## 3. Babel CLI 命令

`ahvn babel` 命令组提供了管理本地化工作流的工具。

<br/>

### 3.1. `ahvn babel init`

此命令初始化 Babel 的目录结构和配置。

**用法：**
```bash
ahvn babel init [PATH] [OPTIONS]
```

**参数：**
- `PATH`：要初始化的目录。默认为当前目录。

**选项：**
- `-l, --langs`：指定目标语言（例如 `-l en -l zh`）。
- `-m, --main`：主要（源）语言。
- `-o, --overwrite`：覆盖现有的翻译文件。
- `-e, --encoding`：Babel 配置文件的编码。

<br/>

### 3.2. `ahvn babel translate`

使用大型语言模型 (LLM) 自动将 `.po` 文件从源语言翻译成目标语言。

**用法：**
```bash
ahvn babel translate [PATH] [OPTIONS]
```

**参数：**
- `PATH`：包含 `.po` 文件的目录。默认为当前目录。

**选项：**
- `-s, --src-lang`：翻译的源语言。
- `-t, --tgt-lang`：翻译的目标语言。
- `-o, --overwrite`：覆盖 `.po` 文件中的现有翻译。
- `-b, --batch-size`：单个批次中要处理的条目数。
- `-h, --hint`：向 LLM 提供翻译提示。
- `-p, --llm-preset`：用于翻译的 LLM 预设（例如 `translator`）。

<br/>

### 3.3. `ahvn babel compile`

将 `.po` 翻译文件编译成 `.mo` 文件，这些文件是应用程序在运行时使用的二进制文件。

**用法：**
```bash
ahvn babel compile [PATH] [OPTIONS]
```

**参数：**
- `PATH`：包含 `.po` 文件的目录。默认为当前目录。

**选项：**
- `-l, --langs`：指定要编译的语言。
- `-m, --main`：主要（源）语言。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 提示词的更多信息，请参见：
> - [模板处理](../python-guide/utils/basic/jinja_utils.md) - Python Jinja + Babel 模板化实用工具

> **提示：** 有关 AgentHeaven CLI 使用的更多信息，请参见：
> - [LLM 推理](./llm-inference.md) - 命令行 LLM 推理工具
> - [LLM 会话](./llm-session.md) - 命令行 LLM 交互式会话
> - [知识管理](./knowledge-management.md) - 命令行知识库管理
> - [仓库管理](./repo-management.md) - 命令行项目初始化、配置和管理

<br/>
