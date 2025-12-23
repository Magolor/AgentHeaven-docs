# LLM Session

AgentHeaven provides an interactive chat session feature, allowing you to have continuous multi-turn conversations with LLMs.

<br/>

## 1. LLM Configuration System

See also: [LLM Integration](../python-guide/llm.md)

### 1.1. Preset

Consistent with the inference command, sessions support specifying model presets via `--preset`:

```bash
ahvn session --preset gpt4
```

<br/>

### 1.2. Provider

Specify the provider with `--provider`:

```bash
ahvn session --provider openrouter
```

<br/>

### 1.3. Model

Specify the model name with `--model`:

```bash
ahvn session --model gpt-4
```

<br/>

### 1.4. Configuration Parameters

Sessions support the same parameters as `ahvn chat`, including `--system`, `-i` for file input, `--no-cache`, `--no-stream`, etc.:

```bash
ahvn session --preset gpt4 --system "You are a helpful coding assistant" -i project.md -i requirements.txt --no-cache --no-stream
```

<br/>

## 2. Basic Usage

### 2.1. Start a Session

Start a basic interactive session:

```bash
ahvn session
```

<br/>

### 2.2. Session with Initial Prompt

You can provide an initial message when starting a session:

```bash
ahvn session "Hello, let's start our conversation"
```

<br/>

### 2.3. Temporarily Modify Configuration

Temporarily modify parameters at startup:

```bash
ahvn session --preset coding-assistant --verbose
```

<br/>

## 3. Output Modes

- **Streaming Output** (default): Displays assistant replies in real time
- **Full Output**: When streaming is disabled, displays the complete reply at once

```bash
ahvn session --stream
ahvn session --no-stream
```

<br/>

## 4. Enhanced Session Interface

### 4.1. Prompt Toolkit Integration

AgentHeaven uses `prompt_toolkit` to provide an enhanced interactive experience: command history, auto-completion, multi-line input, mouse support, etc.

```bash
pip install prompt_toolkit
```

If not installed, it automatically falls back to standard input.

<br/>

### 4.2. Shortcuts

- **Ctrl+C** or **Ctrl+D**: Exit session
- **Up/Down Arrow Keys**: Browse history
- **Enter**: Send message

<br/>

## 5. Session Commands

### 5.1. Exit Commands

```
/exit  /quit  /bye  /e  /q  /b
```

<br/>

### 5.2. Help Commands

```
/help  /h  /?  /commands
```

<br/>

### 5.3. Save Session

```
/save              # Save to session.json (default)
/save my_chat.json # Save to specified file
/s my_chat.json    # Shortcut
```

<br/>

### 5.4. Load Session

```
/load              # Load from session.json (default)
/load my_chat.json # Load from specified file
/l my_chat.json    # Shortcut
```

<br/>

## 6. Cache System

### 6.1. Enable/Disable Cache

AgentHeaven enables response caching by default to improve performance:

```bash
# Enable cache (default)
ahvn session --cache

# Disable cache
ahvn session --no-cache
```

Caching is based on a hash of the message content and parameters; only identical conversations will return cached results.

Note: CLI inference cache and CLI session cache are independent. CLI session cache is located at `~/.ahvn/cache/session_cli/`.

<br/>

### 6.2. Cache Cleaning

Use the global command to clean cache:

```bash
ahvn clean           # Clean all cache
ahvn clean --dry-run # Preview what will be cleaned
```

<br/>

## 7. Input Files and System Prompts

### 7.1. Using Input Files

You can include file content as part of the **initial** conversation. Note: If you only input files without a prompt, it will wait for user input by default.

```bash
ahvn session -i README.md -i src/main.py
```

Only plain text files are supported (.txt, .md, .py, .json, etc.); folders and other file formats are not supported.

<br/>

### 7.2. Setting System Prompts

Use a system prompt to define the assistant's behavior. Note: If you only input a system prompt without a prompt, it will wait for user input by default.

```bash
ahvn session --system "You are a Python expert"
```

<br/>

## 8. Complex Example

### 8.1. Long-term Session with File Input

```bash
ahvn session \
  --system "You are a project consultant" \
  -i README.md \
  -i src/main.py \
  -i docs/design.md \
  --preset gpt4
```

<br/>

### 8.2. Session File Format

Saved session files are in JSON format, structured as follows:
    "content": "..."

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

## Further Exploration

> **Tip:** For more information about LLMs in AgentHeaven, see:
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options
> - [LLM](../python-guide/llm.md) - Comprehensive guide to LLM integration in Python
> - [LLM Inference](./llm-inference.md) - LLM inference tools in CLI

> **Tip:** For more information about CLI usage in AgentHeaven, see:
> - [Prompt Management](./prompt-management.md) - Prompt creation and localization in CLI
> - [Knowledge Management](./knowledge-management.md) - Knowledge base management in CLI
> - [Repo Management](./repo-management.md) - Project init, config, and management in CLI

<br/>
