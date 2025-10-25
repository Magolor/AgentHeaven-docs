# LLM

This guide shows how to call supported Large Language Models (LLMs) in AgentHeaven with a LiteLLM integration.

## 1. LLM Instances

In AgentHeaven, LLMs are used as instances (the `LLM` objects), which are lightweight wrappers that primarily store the stateless model configuration/parameters rather than client connections. The actual request logic uses the configured parameters each call (and creates streams or clients transiently). Therefore you can create many named instances cheaply and keep them both logically and physically separated by purpose. This design avoids using a single global LLM for all tasks, meanwhile you can perform global optimizations like caching on the provider side or using a shared `Cache`. This decouples the logical roles of LLMs from the API backends or providers, allowing flexible combinations of different models and providers.

```python
from ahvn.llm import LLM
# Create different LLM instances for different purposes
chat_llm = LLM(preset="chat")  # for chat
reason_llm = LLM(preset="reason")  # for reasoning
embedder = LLM(preset="embedder")  # for embeddings
```

<br/>

## 2. LLM inference

### 2.1. One-off answer

```python
from ahvn.llm import LLM
print(LLM(preset="reason").oracle("What is a monad in one sentence?"))
```

<br/>

### 2.2. Streaming (incremental printing)

```python
llm = LLM(preset="reason")
for token in llm.stream("Give me three creative startup ideas"):
	print(token, end="")
```

Need CLI instead? See `cli-guide/llm-inference.md` (e.g. `ahvn chat --preset reason "..."`).

<br/>

### 2.3. Embeddings

```python
embedder = LLM(preset="embedder")

# Single input returns a single embedding vector
single = embedder.embed("A single sentence")  # returns [0.1, 0.2, ...]

# Batch input returns a list of embedding vectors
batch = embedder.embed(["First", "Second"])  # returns [[0.1, 0.2, ...], [0.3, 0.4, ...]]
```

The `embed` method always returns `List[List[float]]` - a list of embedding vectors. When you pass a single string, it still returns a list containing one vector. Empty strings in a batch are automatically assigned a fixed placeholder embedding.

**Embedding Dimension:**

You can access the embedding dimension using the `dim` property:

```python
embedder = LLM(preset="embedder")
print(embedder.dim)  # e.g., 768 or 1536 depending on the model
```

**Note:** The `dim` property is computed lazily on first access by making a test embedding call, then cached for efficiency.

<br/>

### 2.4. Advanced Usage

#### 2.4.1. Overrides
```python
llm = LLM(preset="reason", temperature=0.7)
llm.oracle("Default temperature is 0.7")
llm.oracle("But here I freeze it", temperature=0.0)
```

<br/>

#### 2.4.2. Tool Use (Function Calling)

Pass JSON-schema style tool specs via `tools`; inspect tool calls by including `tool_calls`:

```python
tools = [
	{
		"type": "function",
		"function": {
			"name": "get_weather",
			"description": "Return temperature (C) for a city",
			"parameters": {
				"type": "object",
				"properties": {"city": {"type": "string"}},
				"required": ["city"],
			},
		},
	}
]
llm = LLM(preset="chat")
result = llm.oracle("What's the weather in Paris?", tools=tools, include=["tool_calls", "text"], reduce=False)
```

Tool call arguments are automatically JSON‑stringified if you provided them as dicts.

<br/>

## 3. Messages (Input Formats)

We recommend using OpenAI-style messages (a list of role/content dicts):

```python
msgs = [
	{"role": "system", "content": "You are concise."},
	{"role": "user", "content": "List two HTTP verbs."}
]
LLM(preset="chat").oracle(msgs)
```

Nevertheless, convenient use of multiple input forms are supported:

- Single string: treated as a single user message. Example:
```python
LLM(preset="chat").oracle("Hello")
# -> [{"role": "user", "content": "Hello"}]
```

- List of strings: each string becomes a user message in order.

- Dicts (OpenAI-style): must include a "role" field (for example, "system", "user", "assistant"). Dicts are used as provided and are deep-copied internally.

- `litellm.Message` instances: automatically converted to dict via their `json()` method before normalization.

- Mixed lists: any combination of the above (strings + dicts + `litellm.Message`) is supported and normalized into a final list of role/content dicts.

Behavior notes and edge cases:

- If an item has an unsupported type, a TypeError is raised.
- If a dict message lacks a "role" field, a ValueError is raised.
- Tool call arguments: if a message dict contains a `tool_calls` entry, each `tool_call["function"]["arguments"]` value will be JSON-serialized (stringified) automatically when it is not already a string. This ensures function-calling payloads are transmitted as strings to backends that expect serialized arguments.

Short example showing tool-call serialization:

```python
msg = {
	"role": "user",
	"content": "Get weather",
	"tool_calls": [
		{
			"function": {
				"name": "get_weather",
				"arguments": {"city": "Paris"}
			}
		}
	]
}
# The `arguments` dict will be converted to the JSON string '{"city":"Paris"}' during formatting.
```

The library aims to be permissive in input forms while producing the canonical OpenAI-style message list that most backends expect.

<br/>

## Further Exploration

> **Tip:** For more information about LLMs in AgentHeaven, see:
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options
> - [LLM Inference](../cli-guide/llm-inference.md) - LLM inference tools in CLI
> - [LLM Session](../cli-guide/llm-session.md) - LLM interactive sessions in CLI

> **Tip:** For more information about Cache used with LLMs in AgentHeaven, see:
> - [Cache](./cache.md) - Cache system implementation and usage

<br/>
