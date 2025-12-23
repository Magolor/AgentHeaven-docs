# 设置

安装 AgentHeaven 后，你需要进行一些基本配置才能开始使用。

## 1. 快速设置

这是一个快速设置，让你能够以最少配置开始使用 AgentHeaven（关于 LLM）。

> 如需全面的配置选项，请参见 [配置](../configuration/index.md) 章节。

系统的默认 LLM 配置使用 [OpenRouter](https://openrouter.ai/) 和 [Ollama](https://ollama.com/) 提供所有 LLM 服务。由于默认配置中定义了预设，你只需要更改 openrouter 的 api key。
```bash
ahvn setup --reset
ahvn config set --global llm.providers.openrouter.api_key "<OPENROUTER_API_KEY>"
```

或者，由于 `<>` 会被 AgentHeaven 解析为环境变量，你可以避免在配置中写入实际的 API 密钥，改为：

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

现在，AgentHeaven 应该可以在 OpenRouter 提供商下开箱即用。默认情况下它使用 `sys` 预设作为主 LLM（当前版本默认是 `google/gemini-2.5-flash-preview`）。

如果你想将其他模型服务作为默认模型，你需要修改提供商与 `sys` 预设。例如，将系统默认模型设置为 [DeepSeek-V3.2-Exp](https://deepseek.ai/)，并把其提供商设为官方 [DeepSeek API](https://platform.deepseek.com/)：
```bash
ahvn config set --global llm.providers.deepseek.api_key "<DEEPSEEK_API_KEY>"

ahvn config set --global llm.presets.sys.provider deepseek
ahvn config set --global llm.presets.sys.model DeepSeek-V3.2-Exp
```

你也可以添加自己的预设，例如创建一个 `lover` 预设：
```bash
ahvn config set --global llm.providers.openai.api_key "<OPENAI_API_KEY>"

ahvn config set --global llm.presets.lover.provider openai
ahvn config set --global llm.presets.lover.model gpt-4o
ahvn config set --global llm.presets.lover.temperature 1.2
```

<br/>

## 2. 配置

AgentHeaven 使用分层配置系统。类似 GitHub/Conda，AgentHeaven 有三层配置文件：本地配置 >> 全局配置 >> 系统默认配置。

具体而言，在一个仓库中，AgentHeaven 的配置遵循如下优先级顺序：

1. 本地配置（`$ROOT/.ahvn/config.yaml`）- 最高优先级
2. 全局配置（`~/.ahvn/config.yaml`）- 中等优先级  
3. 系统默认配置 - 最低优先级（兜底）

本地配置文件通常只包含与全局配置文件不同的增量选项。出现冲突时，本地配置优先生效。所有配置文件均为 YAML 格式，支持字典/列表结构，并可与 JSON 或 Python dict 互相转换。

当 AgentHeaven 读取配置时，会合并这些层级：本地设置覆盖全局设置，而全局设置又覆盖系统默认。

在首次安装或重置时，使用 `ahvn setup --reset/-r` 命令将全局配置 **覆盖** 为系统默认配置。此操作会在 `~/.ahvn/config.yaml` 创建全局配置文件。
```bash
ahvn setup -r
```

通常使用 `ahvn config set`（或 `unset`）命令修改配置：

```bash
ahvn config set [--global/-g] <key_path> <value>
```

> 若要全面了解配置系统，请参见 [配置](../configuration/index.md) 章节。

<br/>

## 3. 基本配置命令

### 3.1. 查看配置

```bash
ahvn config show [--system/-s]
```

<br/>

### 3.2. 初始化全局配置

```bash
ahvn setup [--reset/-r]
```

<br/>

### 3.3. 设置配置值

```bash
ahvn config set [--global/-g] <key_path> <value>
```

<br/>

## 4. 高级设置

> 关于各组件的详细配置，请参见 [配置](../configuration/index.md) 章节。

<br/>

## 5. 安全注意事项

注意，诸如 `api_key` 等信息会以明文形式存放在配置文件中，这可能带来安全风险，尤其是在使用 `git` 进行项目开发时。

我们建议所有使用 AgentHeaven 的项目先把 `.ahvn/` 加入 `.gitignore`（即便不考虑安全，`.ahvn` 目录也可能包含大量知识与模型文件，上传到 GitHub 时也应忽略）。

为增强安全性，对敏感信息使用环境变量。使用尖括号 `<>` 的配置会被视为占位符，默认替换为同名的系统环境变量。例如：

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

<br/>

## 拓展阅读

> **提示：** 有关配置在 AgentHeaven 中的更多信息，请参见：
> - [配置](../configuration/index.md) - 全面配置指南
> - [核心配置](../configuration/core.md) - 核心配置概念
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具
> - [LLM 配置](../configuration/llm.md) - 具体 LLM 配置选项

> **提示：** 有关 AgentHeaven 的更多入门信息，请参见：
> - [5 分钟快速开始](./5min-quickstart.md) - 快速安装与基本使用路径
> - [60 分钟教程](./60min-tutorial.md) - 全面逐步教程

<br/>
