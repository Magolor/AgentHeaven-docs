# LLM Inference

AgentHeaven provides powerful command-line LLM inference capabilities, supporting direct interaction with various language models.

## 1. LLM Configuration System

> **Tip:** For complete LLM configuration reference, see [LLM Configuration](../configuration/llm.md)

See also: [LLM Integration](../python-guide/llm.md)

### 1.1. Preset

AgentHeaven supports predefined model configurations, called presets. These presets contain complete model configuration information, such as the selected model, provider, default parameters, network proxy, etc.

You need to add presets in the configuration file first, then specify a preset in the CLI using `--preset/-p`:

```bash
# Use a specific preset
ahvn chat --preset reason "Hello, world!"
```

<br/>

### 1.2. Provider

You need to add providers in the configuration file first, then specify the LLM provider in the CLI using `--provider/-b`, such as OpenAI, Anthropic, local services, etc.:

```bash
# Specify provider
ahvn chat --provider openrouter "What is Python?"
```

A required field for providers is `"backend"`, which is used to connect a custom provider to the `litellm` interface. For example: VLLM corresponds to `"hosted_vllm"` in `litellm`; a general third-party relay or OpenAI-compatible provider can set `"backend"` to `openai`; Ollama's `"backend"` is `ollama`, and so on.

<br/>

### 1.3. Model

Use `--model/-m` to specify the model name:

```bash
# Specify a specific model
ahvn chat --model gpt-5 --provider openai "Explain machine learning"
```

<br/>

### 1.4. Model Aliases and Mismatch Handling

AgentHeaven supports model aliasing via the configuration `llm.model.<standard_name>.alias`, allowing users to...

At the same time, you can set the `handle_model_mismatch` method in the configuration to handle model name mismatches:
- ignore: Ignore missing model names and continue with the specified model (default; allows using a model without defining it)
- warn: Issue a warning if the model name is not found, recommend similar models, but do not replace the model; continue with the specified model
- exit: Issue an error if the model name is not found and exit
- raise: Directly raise an exception and terminate execution

<br/>

## 2. Simple Conversation

### 2.1. Basic Usage

The simplest way to chat:

```bash
ahvn chat "Hello, how are you?"
```

<br/>

### 2.2. Temporary Configuration Changes

Temporarily modify configuration for a single conversation:

```bash
# Temporarily change preset, provider, and model
ahvn chat -p reason-expert -b openai -m gpt-5 "What is the answer to life, the universe, and everything?"
```

<br/>

### 2.3. Show Detailed Information

Use the `-v` parameter to display detailed configuration and debug information:

```bash
ahvn chat -v "Hello!"
```

This will show the final parsed configuration fields for the request (fields like `api_key` will be encrypted; additional encrypted fields can be configured in `core.encrypt_keys`, by default only including `api_key`, `token`, `password` and `url`).

<br/>

## 3. Output Modes

### 3.1. Streaming Output vs. Full Output

**Streaming output** (default) - displays generated content in real time:
```bash
ahvn chat --stream "Tell me a story"
```

**Full output** - waits for completion and displays the result at once:
```bash
ahvn chat --no-stream "Quick calculation: 2+2"
```

Streaming output is suitable for long text generation, while full output is suitable for short answers or scenarios requiring a complete response.

<br/>

## 4. Caching System

### 4.1. Enable/Disable Cache

AgentHeaven enables response caching by default to improve performance:

```bash
# Enable cache (default)
ahvn chat --cache "Cached question"

# Disable cache
ahvn chat --no-cache "Fresh response needed"
```

Caching is based on the hash value of the message content and parameters; identical input returns cached results.

CLI inference cache is located at `~/.ahvn/cache/chat_cli/`.

<br/>

### 4.2. Cache Cleaning

Use the global command to clean the cache:

```bash
ahvn clean           # Clean all caches
ahvn clean --dry-run # Preview what will be cleaned
```

<br/>

## 5. Input Files and System Prompts

### 5.1. Using Input Files

You can use file content as part of the conversation:

```bash
# Single file
ahvn chat -i document.txt "Summarize the document above."

# Multiple files
ahvn chat -i file1.txt -i file2.txt "Compare these two files."
```

Only plain text files are supported (.txt, .md, .py, .json, etc.), folders and other file formats are not supported.

<br/>

### 5.2. Setting System Prompts

Use system prompts to define the assistant's behavior:

```bash
ahvn chat --system "You are a Python expert" "Write a program to compute fibonacci(63)."

# Combined with file input
ahvn chat -s "You are a code reviewer. The following is a python code:" -i main.py "Review and Summarize this code."
```

<br/>

### 5.3. Complex Example

A complex usage combining multiple parameters:

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

## 6. Embedding Calculation

AgentHeaven supports calculating text vectors using embedding models:

### 6.1. Text Embedding

Embed text directly:

```bash
ahvn embed "This is a sample text"
```

<br/>

### 6.2. File Embedding

Embed file content:

```bash
ahvn embed -i document.txt
```

<br/>

### 6.3. Embedding Configuration

Specify embedding model and configuration:

```bash
# Use a specific preset
ahvn embed --preset embedding-large "Text to embed"

# Specify model
ahvn embed --model text-embedding-ada-002 "Text to embed"

# Show detailed information
ahvn embed -v "Text to embed"
```

<br/>

### 6.4. Cache Embedding Results

Embedding calculation also supports caching:

```bash
# Enable cache (default)
ahvn embed --cache "Text to embed"

# Disable cache
ahvn embed --no-cache "Text to embed"
```

<br/>

## Further Exploration

> **Tip:** For more information about LLMs in AgentHeaven, see:
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options
> - [LLM](../python-guide/llm.md) - Comprehensive guide to LLM integration in Python
> - [LLM Session](./llm-session.md) - LLM interactive sessions in CLI

> **Tip:** For more information about CLI usage in AgentHeaven, see:
> - [Prompt Management](./prompt-management.md) - Prompt creation and localization in CLI
> - [Knowledge Management](./knowledge-management.md) - Knowledge base management in CLI
> - [Repo Management](./repo-management.md) - Project init, config, and management in CLI

<br/>
