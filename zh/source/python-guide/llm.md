# LLM

本指南展示如何在 AgentHeaven 中通过 LiteLLM 集成调用支持的大型语言模型 (LLM)。

## 1. LLM 实例

在 AgentHeaven 中，LLM 以 `LLM` 对象实例表示，它们是轻量级的包装器，主要保存无状态的模型配置/参数，而不是持久化的客户端连接。实际的请求逻辑在每次调用时使用这些配置并临时创建流或客户端。因此，你可以为不同用途轻松创建多个具名实例，并在逻辑和物理上将它们分离。该设计避免将单一全局 LLM 用于所有任务，同时允许在提供者侧或通过共享的 `Cache` 进行全局优化。这将 LLM 的逻辑角色与具体后端或提供者解耦，从而可以灵活地组合不同模型与提供者。

```python
from ahvn.llm import LLM
# 为不同用途创建不同的 LLM 实例
chat_llm = LLM(preset="chat")  # 用于聊天
reason_llm = LLM(preset="reason")  # 用于推理
embedder = LLM(preset="embedder")  # 用于生成嵌入向量
```

<br/>

## 2. LLM 推理

### 2.1. 一次性回答

```python
from ahvn.llm import LLM
print(LLM(preset="reason").oracle("用一句话解释什么是单子？"))
```

<br/>

### 2.2. 流式输出（增量打印）

```python
llm = LLM(preset="reason")
for token in llm.stream("给我三个创意的创业想法"):
	print(token, end="")
```

需要 CLI 吗？请参见 `cli-guide/llm-inference.md`（例如 `ahvn chat --preset reason "..."`）。

<br/>

### 2.3. 嵌入向量

```python
embedder = LLM(preset="embedder")

# 单个输入返回单个嵌入向量
single = embedder.embed("一个单独的句子")  # 返回 [0.1, 0.2, ...]

# 批量输入返回嵌入向量列表
batch = embedder.embed(["第一个", "第二个"])  # 返回 [[0.1, 0.2, ...], [0.3, 0.4, ...]]
```

`embed` 方法总是返回 `List[List[float]]` - 一个嵌入向量的列表。当您传递单个字符串时，它仍然返回包含一个向量的列表。批量中的空字符串会自动分配一个固定的占位符嵌入。

**嵌入维度：**

您可以使用 `dim` 属性访问嵌入维度：

```python
embedder = LLM(preset="embedder")
print(embedder.dim)  # 例如，768 或 1536，取决于模型
```

**注意：** `dim` 属性在首次访问时通过进行测试嵌入调用来延迟计算，然后缓存以提高效率。

<br/>

### 2.4. 高级用法

#### 2.4.1. 参数覆盖
```python
llm = LLM(preset="reason", temperature=0.7)
llm.oracle("默认温度是 0.7")
llm.oracle("但这里我把它冻结", temperature=0.0)
```

<br/>

#### 2.4.2. 工具使用（函数调用）

通过 `tools` 传递 JSON-schema 风格的工具规格；通过包含 `tool_calls` 检查工具调用：

```python
tools = [
	{
		"type": "function",
		"function": {
			"name": "get_weather",
			"description": "返回城市的温度（摄氏度）",
			"parameters": {
				"type": "object",
				"properties": {"city": {"type": "string"}},
				"required": ["city"],
			},
		},
	}
]
llm = LLM(preset="chat")
result = llm.oracle("巴黎的天气怎么样？", tools=tools, include=["tool_calls", "text"], reduce=False)
```

如果你将工具调用参数作为字典提供，它们会自动进行 JSON 字符串化。

<br/>

## 3. 消息（输入格式）

我们推荐使用 OpenAI 风格的消息（角色/内容字典列表）：

```python
msgs = [
	{"role": "system", "content": "你很简洁。"},
	{"role": "user", "content": "列出两个 HTTP 动词。"}
]
LLM(preset="chat").oracle(msgs)
```

尽管如此，也支持多种输入形式的便捷使用：

- 单个字符串：作为单个用户消息处理。示例：
```python
LLM(preset="chat").oracle("你好")
# -> [{"role": "user", "content": "你好"}]
```

- 字符串列表：每个字符串按顺序成为用户消息。

- 字典（OpenAI 风格）：必须包含"role"字段（例如，"system"、"user"、"assistant"）。字典按提供的方式使用，并在内部进行深度复制。

- `litellm.Message` 实例：在标准化之前通过其 `json()` 方法自动转换为字典。

- 混合列表：支持上述任意组合（字符串 + 字典 + `litellm.Message`），并标准化为最终的角色/内容字典列表。

行为注意事项和边缘情况：

- 如果项目具有不支持的类型，会引发 TypeError。
- 如果字典消息缺少"role"字段，会引发 ValueError。
- 工具调用参数：如果消息字典包含 `tool_calls` 条目，每个 `tool_call["function"]["arguments"]` 值在不是字符串时会自动进行 JSON 序列化（字符串化）。这确保函数调用负载作为字符串传输到期望序列化参数的后端。

显示工具调用序列化的简短示例：

```python
msg = {
	"role": "user",
	"content": "获取天气",
	"tool_calls": [
		{
			"function": {
				"name": "get_weather",
				"arguments": {"city": "巴黎"}
			}
		}
	]
}
# 在格式化期间，`arguments` 字典将转换为 JSON 字符串 '{"city":"巴黎"}'。
```

该库旨在在输入形式上保持宽松，同时产生大多数后端期望的规范 OpenAI 风格消息列表。

<br/>

## Further Exploration

> **提示：** 有关 AgentHeaven LLM 的更多信息，请参见：
> - [LLM 配置](../configuration/llm.md) - 具体的 LLM 配置选项
> - [LLM 推理](../cli-guide/llm-inference.md) - 命令行 LLM 推理工具
> - [LLM 会话](../cli-guide/llm-session.md) - 命令行 LLM 交互式会话

> **提示：** 有关 AgentHeaven 中 LLM 使用的缓存的更多信息，请参见：
> - [缓存](./cache.md) - 缓存系统实现和使用

<br/>
