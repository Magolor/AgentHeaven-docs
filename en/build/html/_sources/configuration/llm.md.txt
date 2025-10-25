# LLM Configuration

AgentHeaven provides a comprehensive and flexible LLM configuration system that allows you to easily manage and switch between different language models, providers, and configurations. This guide covers all aspects of LLM configuration, from basic setup to advanced customization.

## 1. Config Structure

AgentHeaven uses [LiteLLM](https://www.litellm.ai/) as a universal provider. LLM configuration in AgentHeaven is intentionally small and layered so you can separate concerns and swap implementations without changing code. The configuration is composed from five cooperating pieces:

- **Preset**: A name you pick in code (for example `chat` or `reason`). A preset selects a model, may pin a provider, and supplies tuned default arguments (temperature, system prompts, etc.).
- **Provider**: Contains transport, authentication, and provider-level model args (api key, api_base, backend hint). The provider tells the system how to talk to a specific service.
- **Model**: A canonical model block that defines aliases and provider-specific identifiers. Models map a logical name (e.g., `dsv3`) to the actual model string (e.g., `deepseek-chat`) used by each provider.
- **Backend**: The litellm backend prefix (for example `openai`, `hosted_vllm`, `ollama`) that may be prepended to a provider-specific model identifier to select the correct client implementation.
- **Instance**: A specific type of LLM with fixed arguments and optional name. It is recommended to create an `LLM` instance per logical agent for clarity.

At runtime these layers are resolved in a cascade (explicit overrides → preset → model → provider) to produce the final request config. This makes it easy to swap providers, tweak default args, changing YAML presets while keeping code simple.

<br/>

## 2. Quick LLM Setup

The system's default LLM configuration uses [OpenRouter](https://openrouter.ai/) and [Ollama](https://ollama.com/) to provide all LLM services. As there are presets defined in the default config, all you need to change is the OpenRouter API key.

```bash
ahvn setup --reset
ahvn config set --global llm.providers.openrouter.api_key "<OPENROUTER_API_KEY>"
```

Or, as `<>` will be parsed by AgentHeaven as environment variables, you can avoid using the actual API key in the config:

```bash
export OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
```

Now, AgentHeaven should be able to run out-of-the-box with the OpenRouter provider. By default, the system uses the `sys` preset (configured as `llm.default_preset: sys`), which in the current version defaults to the `gemini-flash` model (aliased to `google/gemini-2.5-flash-preview-09-2025`).

<br/>

## 3. Preset Configuration

Presets are predefined model configurations that contain complete model configuration information, such as the selected model, provider, default parameters, network proxy, etc. They provide a convenient way to manage different LLM configurations for different use cases.

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

## 4. Provider Configuration

Providers contain transport, authentication, and provider-level model arguments (API key, API base, backend hint). The provider tells the system how to talk to a specific service.

A required field for providers is `"backend"`, which is used to connect a custom provider to [LiteLLM-supported Providers](https://docs.litellm.ai/docs/providers).

For convenience, here are some common LiteLLM-supported providers with their corresponding backend names:
- **OpenRouter**: `"openrouter"`.
- **OpenAI**: `""`.
- **OpenAI-compatible 3rd-party providers**: `"openai"`.
- **Gemini**: `"gemini"`.
- **Anthropic**: `""`.
- **DeepSeek**: `"deepseek"`.
- **xAI**: `"xai"`.
- **Moonshot**: `"moonshot"`.
- **Ollama**: `"ollama"`.
- **LM Studio**: `"lm_studio"`.
- **VLLM**: `"hosted_vllm"`.

<br/>

## 5. Model Configuration

Models define canonical model blocks with aliases and provider-specific identifiers. They map logical names to actual model strings used by each provider.

AgentHeaven supports model aliasing via the configuration `llm.models.<standard_name>.aliases`, allowing users to create convenient shortcuts for model names.

You can set the `llm.handle_model_mismatch` configuration option to control how AgentHeaven handles model name mismatches:

- **ignore**: Ignore missing model names and continue with the specified model (default; allows using a model without defining it in the configuration)
- **warn**: Issue a warning if the model name is not found, recommend similar models, but do not replace the model; continue with the specified model
- **exit**: Issue an error if the model name is not found and exit the program
- **raise**: Directly raise an exception and terminate execution

Example:

```bash
ahvn config set --global llm.handle_model_mismatch warn
```

<br/>

## 6. Caching Configuration

AgentHeaven includes a caching layer for LLM responses to improve performance and reduce costs. By default, caching is enabled and uses a [diskcache](https://grantjenks.com/docs/diskcache/)-based cache.

You can control this behavior for any LLM preset by adding a `cache` key in your YAML configuration file.
- To disable caching for a specific preset, set `cache: false`.
- To specify a custom directory for the cache, simply provide a path string, for example: `cache: "path/to/your/cache/"`.
- To use custom `Cache` types or configurations, you need to manually pass the `Cache` object to the `cache` argument when creating the `LLM` instance in your Python code.

This allows you to easily manage caching strategies for different use cases directly from your configuration.

<br/>

## Further Exploration

> **Tip:** For more information about LLMs in AgentHeaven, see:
> - [LLM](../python-guide/llm.md) - Comprehensive guide to LLM integration in Python
> - [LLM Inference](../cli-guide/llm-inference.md) - LLM inference tools in CLI
> - [LLM Session](../cli-guide/llm-session.md) - LLM interactive sessions in CLI

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Core Configuration](./core.md) - Core configuration concepts
> - [Database Configuration](./database.md) - Relational Database connection and storage configuration
> - [Vector Database Configuration](./vdb.md) - Vector Database connection and storage configuration
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

<br/>
