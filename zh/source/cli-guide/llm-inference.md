# LLM 推理

AgentHeaven 提供了强大的命令行 LLM 推理功能，支持直接与各种语言模型进行交互。

## 1. LLM 配置系统

> 如需完整的 LLM 配置参考，请参见 [LLM 配置](../configuration/llm.md)

另请参见：[LLM](../python-guide/llm.md)

### 1.1. 预置配置 (Preset)

AgentHeaven 支持预定义的模型配置，称为 preset。这些预置包含了模型的完整配置信息，例如选用的模型、服务商、默认参数、网络代理等。

需要首先在配置文件中添加预置，然后在CLI中使用`--preset/-p`指定一个预置：

```bash
# 使用特定预置
ahvn chat --preset reason "Hello, world!"
```

<br/>

### 1.2. 服务商 (Provider)

需要首先在配置文件中添加服务商，然后再CLI中使用`--provider/-b`指定 LLM 服务提供商，如 OpenAI、Anthropic、本地服务等：

```bash
# 指定服务商
ahvn chat --provider openrouter "What is Python?"
```

服务商一个不可或缺的字段是`"backend"`，用于对接一个自定义的服务商与`litellm`接口。例如：VLLM在`litellm`中对应的`"backend"`是`hosted_vllm`；一个通用第三方中转站、兼容OpenAI格式的服务商可以将`"backend"`设置为`openai`；Ollama的`"backend"`是`ollama`，等等。

<br/>

### 1.3. 模型 (Model)

使用`--model/-m`指定要使用的模型名称：

```bash
# 指定具体模型
ahvn chat --model gpt-5 --provider openai "Explain machine learning"
```

<br/>

### 1.4. 模型别名和不匹配处理

AgentHeaven 支持模型别名功能，通过配置`llm.model.<standard_name>.alias`使用户可以...

同时，在配置中可以设置 `handle_model_mismatch` 方法来处理模型名称不匹配的情况：
- ignore: 忽略没找到的模型名，继续执行这一模型（默认，可以实现在不定义模型前提下，使用这一模型）
- warn: 发出警告，提示用户模型名未找到，并推荐与该模型名相似的模型，但不会替换模型，继续执行这一模型
- exit: 发出错误，提示用户模型名未找到，并退出
- raise: 直接抛出异常，终止执行

<br/>

## 2. 简单对话

### 2.1. 基本用法

最简单的对话方式：

```bash
ahvn chat "Hello, how are you?"
```

<br/>

### 2.2. 临时修改配置

在单次对话中临时修改配置：

```bash
# 临时修改预置、服务商和模型
ahvn chat -p reason-expert -b openai -m gpt-5 "What is the answer to life, the universe, and everything?"
```

<br/>

### 2.3. 显示详细信息

使用 `-v` 参数显示详细的配置和调试信息：

```bash
ahvn chat -v "Hello!"
```

这会显示最终请求传入的、经过解析的配置字段（`api_key`等字段会被加密，额外的加密字段需要在`core.encrypt_keys`中配置，默认仅包含`api_key`, `token`, `password`与`url`）。

<br/>

## 3. 输出模式

### 3.1. 流式输出与整体输出

**流式输出**（默认）- 实时显示生成的内容：
```bash
ahvn chat --stream "Tell me a story"
```

**整体输出** - 等待完成后一次性显示：
```bash
ahvn chat --no-stream "Quick calculation: 2+2"
```

流式输出适合长文本生成，整体输出适合短回答或需要完整响应的场景。

<br/>

## 4. 缓存系统

### 4.1. 启用/禁用缓存

AgentHeaven 默认启用响应缓存以提高性能：

```bash
# 启用缓存（默认）
ahvn chat --cache "Cached question"

# 禁用缓存
ahvn chat --no-cache "Fresh response needed"
```

缓存基于消息内容与参数共同的哈希值，完全相同的输入会返回缓存的结果。

CLI推理缓存位于`~/.ahvn/cache/chat_cli/`。

<br/>

### 4.2. 缓存清理

使用全局命令清理缓存：

```bash
ahvn clean           # 清理所有缓存
ahvn clean --dry-run # 预览将要清理的内容
```

<br/>

## 5. 输入文件与系统提示词

### 5.1. 使用输入文件

可以将文件内容作为对话的一部分：

```bash
# 单个文件
ahvn chat -i document.txt "Summarize the document above."

# 多个文件
ahvn chat -i file1.txt -i file2.txt "Compare these two files."
```

仅支持纯文本文件（.txt, .md, .py, .json 等），不支持文件夹与其他文件格式。

<br/>

### 5.2. 设置系统提示词

使用系统提示词定义助手的行为：

```bash
ahvn chat --system "You are a Python expert" "Write a program to compute fibonacci(63)."

# 结合文件输入
ahvn chat -s "You are a code reviewer. The following is a python code:" -i main.py "Review and Summarize this code."
```

<br/>

### 5.3. 复杂示例

结合多种参数的复杂用法：

```bash
ahvn chat \
  --preset gpt4 \
  --system "You are a technical writer" \
  -i requirements.txt \
  -i README.md \
  --cache \
  --stream \
  -v \
  "Write installation instructions based on these files"
```

<br/>

## 6. 嵌入计算

AgentHeaven 支持使用嵌入模型计算文本向量：

### 6.1. 文本嵌入

直接嵌入文本：

```bash
ahvn embed "This is a sample text"
```

<br/>

### 6.2. 文件嵌入

嵌入文件内容：

```bash
ahvn embed -i document.txt
```

<br/>

### 6.3. 嵌入配置

指定嵌入模型和配置：

```bash
# 使用特定预置
ahvn embed --preset embedding-large "Text to embed"

# 指定模型
ahvn embed --model text-embedding-ada-002 "Text to embed"

# 显示详细信息
ahvn embed -v "Text to embed"
```

<br/>

### 6.4. 缓存嵌入结果

嵌入计算也支持缓存：

```bash
# 启用缓存（默认）
ahvn embed --cache "Text to embed"

# 禁用缓存
ahvn embed --no-cache "Text to embed"
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven LLM 的更多信息，请参见：
> - [LLM 配置](../configuration/llm.md) - LLM 特定配置选项
> - [LLM](../python-guide/llm.md) - Python LLM 集成综合指南
> - [LLM 会话](./llm-session.md) - 命令行 LLM 交互式会话

> **提示：** 有关 AgentHeaven CLI 使用的更多信息，请参见：
> - [提示词管理](./prompt-management.md) - 命令行提示词创建与本地化
> - [知识管理](./knowledge-management.md) - 命令行知识库管理
> - [仓库管理](./repo-management.md) - 命令行项目初始化、配置和管理

<br/>
