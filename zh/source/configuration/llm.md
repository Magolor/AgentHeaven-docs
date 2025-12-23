# LLM 配置

AgentHeaven 提供了一个全面且灵活的 LLM 配置系统，允许你轻松管理和切换不同的语言模型、提供商和配置。本指南涵盖 LLM 配置的所有方面，从基本设置到高级自定义。

## 1. 配置结构

AgentHeaven 使用 [LiteLLM](https://www.litellm.ai/) 作为通用提供商。AgentHeaven 中的 LLM 配置故意设计得小巧且分层，这样你可以分离关注点并在不更改代码的情况下交换实现。配置由五个协作部分组成：

- **预设 (Preset)**：你在代码中选择的命名（例如 `chat` 或 `reason`）。预设选择模型，可能固定提供商，并提供调优的默认参数（温度、系统提示等）。
- **提供商 (Provider)**：包含传输、身份验证和提供商级模型参数（API 密钥、API 基础、后端提示）。提供商告诉系统如何与特定服务通信。
- **模型 (Model)**：定义别名和提供商特定标识符的规范模型块。模型将逻辑名称（例如 `dsv3`）映射到每个提供商使用的实际模型字符串（例如 `deepseek-chat`）。
- **后端 (Backend)**：litellm 后端前缀（例如 `openai`、`hosted_vllm`、`ollama`），可能被前置到提供商特定的模型标识符以选择正确的客户端实现。
- **实例 (Instance)**：具有固定参数和可选名称的特定类型 LLM。建议为每个逻辑智能体创建一个 `LLM` 实例以保持清晰。

在运行时，这些层级在级联中解析（显式覆盖 → 预设 → 模型 → 提供商）以产生最终请求配置。这使得在保持代码简单的同时，轻松交换提供商、调整默认参数、更改 YAML 预设变得容易。

<br/>

## 2. 快速 LLM 设置

系统的默认 LLM 配置使用 [OpenRouter](https://openrouter.ai/) 和 [Ollama](https://ollama.com/) 提供所有 LLM 服务。由于默认配置中定义了预设，你只需要更改 OpenRouter API 密钥。

```bash
ahvn setup --reset
ahvn config set --global llm.providers.openrouter.api_key "<OPENROUTER_API_KEY>"
```

或者，由于 `<>` 将被 AgentHeaven 解析为环境变量，你可以避免在配置中使用实际的 API 密钥：

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

现在，AgentHeaven 应该能够与 OpenRouter 提供商开箱即用。默认情况下，系统使用 `sys` 预设（配置为 `llm.default_preset: sys`），在当前版本中默认为 `gemini-flash` 模型（别名为 `google/gemini-2.5-flash-preview-09-2025`）。

<br/>

## 3. 预设配置

预设是包含完整模型配置信息的预定义模型配置，例如选定的模型、提供商、默认参数、网络代理等。它们为不同用例的不同 LLM 配置提供了便捷的管理方式。

如果你想使用其他模型服务作为默认模型，你需要修改提供商和 `sys` 预设。例如，要将系统默认模型设置为 [DeepSeek-V3.2-Exp](https://deepseek.ai/) 并将其提供商设置为官方 [DeepSeek API](https://platform.deepseek.com/)：
```bash
ahvn config set --global llm.providers.deepseek.api_key "<DEEPSEEK_API_KEY>"

ahvn config set --global llm.presets.sys.provider deepseek
ahvn config set --global llm.presets.sys.model DeepSeek-V3.2-Exp
```

你也可以添加自己的预设，例如，创建一个 `lover` 预设：
```bash
ahvn config set --global llm.providers.openai.api_key "<OPENAI_API_KEY>"

ahvn config set --global llm.presets.lover.provider openai
ahvn config set --global llm.presets.lover.model gpt-4o
ahvn config set --global llm.presets.lover.temperature 1.2
```

<br/>

## 4. 提供商配置

提供商包含传输、身份验证和提供商级模型参数（API 密钥、API 基础、后端提示）。提供商告诉系统如何与特定服务通信。

提供商的必需字段是 `"backend"`，用于将自定义提供商连接到 [LiteLLM 支持的提供商](https://docs.litellm.ai/docs/providers)。

为方便起见，这里是一些常见的 LiteLLM 支持的提供商及其对应的后端名称：
- **OpenRouter**：`"openrouter"`。
- **OpenAI**：`""`。
- **OpenAI 兼容的第三方提供商**：`"openai"`。
- **Gemini**：`"gemini"`。
- **Anthropic**：`""`。
- **DeepSeek**：`"deepseek"`。
- **xAI**：`"xai"`。
- **Moonshot**：`"moonshot"`。
- **Ollama**：`"ollama"`。
- **LM Studio**：`"lm_studio"`。
- **VLLM**：`"hosted_vllm"`。

<br/>

## 5. 模型配置

模型定义具有别名和提供商特定标识符的规范模型块。它们将逻辑名称映射到每个提供商使用的实际模型字符串。

AgentHeaven 通过配置 `llm.models.<standard_name>.aliases` 支持模型别名，允许用户为模型名称创建便捷的快捷方式。

你可以设置 `llm.handle_model_mismatch` 配置选项来控制 AgentHeaven 如何处理模型名称不匹配：

- **ignore**：忽略缺失的模型名称并继续使用指定的模型（默认；允许使用未在配置中定义的模型）
- **warn**：如果找不到模型名称则发出警告，推荐类似模型，但不替换模型；继续使用指定的模型
- **exit**：如果找不到模型名称则发出错误并退出程序
- **raise**：直接抛出异常并终止执行

示例：

```bash
ahvn config set --global llm.handle_model_mismatch warn
```

<br/>

## 6. 缓存配置

AgentHeaven 为 LLM 响应提供了一个缓存层，以提高性能并降低成本。默认情况下，缓存是启用的，并使用基于[diskcache](https://grantjenks.com/docs/diskcache/)的缓存。

你可以通过在 YAML 配置文件中为任何 LLM 预设添加一个 `cache` 键来控制此行为。
- 要为特定预设禁用缓存，请设置 `cache: false`。
- 要为缓存指定自定义目录，只需提供一个路径字符串，例如：`cache: "path/to/your/cache/"`。
- 要使用自定义的 `Cache` 类型或配置，你需要在 Python 代码中创建 `LLM` 实例时手动传递 `Cache` 对象给参数`cache`。

这使你可以直接从配置中轻松管理不同用例的缓存策略。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven LLM 的更多信息，请参见：
> - [LLM](../python-guide/llm.md) - Python LLM 集成综合指南
> - [LLM 推理](../cli-guide/llm-inference.md) - 命令行 LLM 推理工具
> - [LLM 会话](../cli-guide/llm-session.md) - 命令行 LLM 交互式会话

> **提示：** 有关 AgentHeaven 中配置的更多信息，请参见：
> - [核心配置](./core.md) - 核心配置概念
> - [数据库配置](./database.md) - 关系数据库连接和存储配置
> - [向量数据库配置](./vdb.md) - 向量数据库连接和存储配置
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

<br/>
