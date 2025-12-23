# LLM 会话

AgentHeaven 提供了交互式聊天会话功能，让您可以与 LLM 进行持续的多轮对话。

## 1. LLM 配置系统

### 1.1. 预置配置 (Preset)

与推理命令一致，会话支持通过 `--preset` 指定模型预置：

```bash
ahvn session --preset gpt4
```

<br/>

### 1.2. 服务商 (Provider)

通过 `--provider` 指定服务商：

```bash
ahvn session --provider openrouter
```

<br/>

### 1.3. 模型 (Model)

通过 `--model` 指定模型名称：

```bash
ahvn session --model gpt-4
```

<br/>

### 1.4. 配置参数

会话支持与 `ahvn chat` 相同的参数，包括 `--system`、`-i` 文件输入、`--no-cache`、`--no-stream` 等：

```bash
ahvn session --preset gpt4 --system "You are a helpful coding assistant" -i project.md -i requirements.txt --no-cache --no-stream
```

<br/>

## 2. 基本用法

### 2.1. 启动会话

启动一个基本的交互式会话：

```bash
ahvn session
```

<br/>

### 2.2. 带初始提示的会话

可以在启动会话时提供初始消息：

```bash
ahvn session "Hello, let's start our conversation"
```

<br/>

### 2.3. 临时修改配置

在启动时临时修改参数：

```bash
ahvn session --preset coding-assistant --verbose
```

<br/>

## 3. 输出模式

### 3.1. 流式输出与整体输出

- **流式输出**（默认）：实时显示助手回复
- **整体输出**：禁用流式后，完整显示回复

```bash
ahvn session --stream
ahvn session --no-stream
```

<br/>

## 4. 会话界面增强

### 4.1. Prompt Toolkit 集成

AgentHeaven 使用 `prompt_toolkit` 提供增强的交互体验：命令历史、自动补全、多行输入、鼠标支持等。

```bash
pip install prompt_toolkit
```

未安装时自动回退为标准输入。

<br/>

### 4.2. 快捷键

- **Ctrl+C** 或 **Ctrl+D**：退出会话
- **上/下箭头键**：浏览历史
- **Enter**：发送消息

<br/>

## 5. 会话命令

### 5.1. 退出命令

```
/exit  /quit  /bye  /e  /q  /b
```

<br/>

### 5.2. 帮助命令

```
/help  /h  /?  /commands
```

<br/>

### 5.3. 保存会话

```
/save              # 保存到 session.json（默认）
/save my_chat.json # 保存到指定文件
/s my_chat.json    # 简写
```

<br/>

### 5.4. 加载会话

```
/load              # 从 session.json 加载（默认）
/load my_chat.json # 从指定文件加载
/l my_chat.json    # 简写
```

<br/>

## 6. 缓存系统

### 6.1. 启用/禁用缓存

AgentHeaven 默认启用响应缓存以提高性能：

```bash
# 启用缓存（默认）
ahvn session --cache

# 禁用缓存
ahvn session --no-cache
```

缓存基于消息内容与参数共同的哈希值，完全相同的整段对话会返回缓存的结果。

注意CLI推理缓存与CLI会话缓存独立，CLI会话缓存位于`~/.ahvn/cache/session_cli/`。

<br/>

### 6.2. 缓存清理

使用全局命令清理缓存：

```bash
ahvn clean           # 清理所有缓存
ahvn clean --dry-run # 预览将要清理的内容
```

<br/>

## 7. 输入文件与系统提示词

### 7.1. 使用输入文件

可以将文件内容作为**初始**对话的一部分。注意，当只输入文件，不输入prompt时，默认会等待用户输入。

```bash
ahvn session -i README.md -i src/main.py
```

仅支持纯文本文件（.txt, .md, .py, .json 等），不支持文件夹与其他文件格式。

<br/>

### 7.2. 设置系统提示词

使用系统提示词定义助手的行为。注意，当只输入系统提示词，不输入prompt时，默认会等待用户输入。

```bash
ahvn session --system "You are a Python expert"
```

<br/>

## 8. 复杂示例

### 8.1. 长期会话与文件输入

```bash
ahvn session \
  --system "You are a project consultant" \
  -i README.md \
  -i src/main.py \
  -i docs/design.md \
  --preset gpt4
```

<br/>

### 8.2. 会话文件格式

保存的会话文件为 JSON 格式，结构如下：

```json
[
    {
        "role": "system",
        "content": "You are a helpful assistant"
    },
    {
        "role": "user", 
        "content": "Hello!"
    },
    {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
    }
]
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven LLM 的更多信息，请参见：
> - [LLM 配置](../configuration/llm.md) - LLM 特定配置选项
> - [LLM](../python-guide/llm.md) - Python LLM 集成综合指南
> - [LLM 推理](./llm-inference.md) - 命令行 LLM 推理工具

> **提示：** 有关 AgentHeaven CLI 使用的更多信息，请参见：
> - [提示词管理](./prompt-management.md) - 命令行提示词创建与本地化
> - [知识管理](./knowledge-management.md) - 命令行知识库管理
> - [仓库管理](./repo-management.md) - 命令行项目初始化、配置和管理

<br/>
