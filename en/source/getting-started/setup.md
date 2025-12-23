# Setup

After installing AgentHeaven, you need to perform some basic configuration before you can start using it.

## 1. Quick Setup

This is a quick setup that enables you to start using AgentHeaven with minimal configuration (about LLMs).

> For comprehensive configuration options, see the [Configuration](../configuration/index.md) section.

The system's default LLM configuration uses [OpenRouter](https://openrouter.ai/) and [Ollama](https://ollama.com/) to provide all LLM services. As there are presets defined in the default config, all you need to change is the openrouter api key.
```bash
ahvn setup --reset
ahvn config set --global llm.providers.openrouter.api_key "<OPENROUTER_API_KEY>"
```

Or, as `<>` will be parsed by AgentHeaven as environment variables, you can avoid using the actual API key in the config, instead:

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

Now, AgentHeaven should be able to run out-of-the-box with the OpenRouter provider. By default it uses the `sys` preset as the main LLM (in current version defaults to `google/gemini-2.5-flash-preview`).

If you want to use other model services as the default model, you need to modify the provider and the `sys` preset. For example, to set the system default model to [DeepSeek-V3.2-Exp](https://deepseek.ai/) and set its provider to official [DeepSeek API](https://platform.deepseek.com/):
```bash
ahvn config set --global llm.providers.deepseek.api_key "<DEEPSEEK_API_KEY>"

ahvn config set --global llm.presets.sys.provider deepseek
ahvn config set --global llm.presets.sys.model DeepSeek-V3.2-Exp
```

You can also add your own presets, for example, to create a `lover` preset:
```bash
ahvn config set --global llm.providers.openai.api_key "<OPENAI_API_KEY>"

ahvn config set --global llm.presets.lover.provider openai
ahvn config set --global llm.presets.lover.model gpt-4o
ahvn config set --global llm.presets.lover.temperature 1.2
```

<br/>

## 2. Configuration

AgentHeaven uses a layered configuration system. Similar to GitHub/Conda, AgentHeaven has three layers of configuration files: Local Config >> Global Config >> System Default Config.

Specifically, in a repository, AgentHeaven's configuration system follows a hierarchical precedence order:

1. **Local Config** (`$ROOT/.ahvn/config.yaml`) - Highest priority
2. **Global Config** (`~/.ahvn/config.yaml`) - Medium priority  
3. **System Default Config** - Lowest priority (fallback)

The local config file usually only contains incremental options that differ from the global config file. When there is a conflict, the local config takes precedence. All config files are in YAML format, supporting dictionary/list structures, and can be converted to/from JSON or Python dict.

When AgentHeaven reads configuration, it merges these layers with local settings overriding global settings, which in turn override system defaults.

Upon first installation or reset, use the `ahvn setup --reset/-r` command to **OVERWRITE** global configuration with the system default configuration. This creates the global config file at `~/.ahvn/config.yaml`.
```bash
ahvn setup -r
```

Usually, use the `ahvn config set` (or `unset`) command to modify the configuration:

```bash
ahvn config set [--global/-g] <key_path> <value>
```

> For a complete understanding of the configuration system, please refer to the [Configuration](../configuration/index.md) section.

<br/>

## 3. Basic Configuration Commands

### 3.1. View Configuration

```bash
ahvn config show [--system/-s]
```

<br/>

### 3.2. Initialize Global Configuration

```bash
ahvn setup [--reset/-r]
```

<br/>

### 3.3. Set Configuration Values

```bash
ahvn config set [--global/-g] <key_path> <value>
```

<br/>

## 4. Advanced Setup

> For detailed configuration of specific components, please refer to the [Configuration](../configuration/index.md) section.

<br/>

## 5. Security Considerations

Note that information such as `api_key` is stored in plain text in the configuration file, which may pose security risks, especially when using `git` for project development.

We recommend that all projects using AgentHeaven add `.ahvn/` to `.gitignore` first (even if not for security reasons, the `.ahvn` directory may contain a large amount of knowledge and model files, which should also be ignored when uploading to GitHub).

For enhanced security, use environment variables for sensitive information. Configurations using angle brackets `<>` are treated as placeholders and will be replaced by system environment variables with the same name by default. For example:

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

<br/>

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Configuration](../configuration/index.md) - Comprehensive configuration guide
> - [Core Configuration](../configuration/core.md) - Core configuration concepts
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options

> **Tip:** For more information about getting started with AgentHeaven, see:
> - [5min Quick Start](./5min-quickstart.md) - Fast path to installation and basic usage
> - [60min Tutorial](./60min-tutorial.md) - Comprehensive step-by-step tutorial

<br/>
