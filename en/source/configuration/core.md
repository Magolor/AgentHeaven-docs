# Core Configuration

AgentHeaven uses a comprehensive configuration system to manage settings across different components and environments. This document covers the core configuration concepts, file structure, and management commands.

## 1. Config Structure

AgentHeaven uses a layered configuration system. Similar to GitHub/Conda, AgentHeaven has three layers of configuration files: Local Config >> Global Config >> System Default Config.

Specifically, in a repository, AgentHeaven's configuration system follows a hierarchical precedence order:

1. **Local Config** (`$ROOT/.ahvn/config.yaml`) - Highest priority
2. **Global Config** (`~/.ahvn/config.yaml`) - Medium priority  
3. **System Default Config** - Lowest priority (fallback)

The local config file usually only contains incremental options that differ from the global config file. When there is a conflict, the local config takes precedence. All config files are in YAML format, supporting dictionary/list structures, and can be converted to/from JSON or Python dict.

When AgentHeaven reads configuration, it merges these layers with local settings overriding global settings, which in turn override system defaults.

Upon first installation or reset, use the `ahvn setup --reset/-r` command to **OVERWRITE** global configuration with the system default configuration. This creates the global config file at `~/.ahvn/config.yaml`.
```bash
ahvn setup --reset
```

Usually, use the `ahvn config set` (or `unset`) command to modify the configuration:

```bash
ahvn config set [--global/-g] <key_path> <value>
```

<br/>

## 2. Default Config Structure

The system default config file is located within the `ahvn` package. You can use the `show -s` command to show it, or use the `open -s` command to open it (not recommended, users should not modify the system default config):

```bash
ahvn config show [--system/-s]
```

You will see the configuration in the following structure, including settings for the entire AgentHeaven, as well as for LLM, relational databases, vector databases, and other components:

```yaml
# src/ahvn/resources/configs/default_config.yaml
core:
    env: dev
    debug: false
    encoding: utf-8
    ...
user:
    ...
prompts:
    ...
llm:
    # LiteLLM compatible format:
    #   <provider>/<model_identifier>
    default_args:
        ...
    default_preset: sys
    presets:
        sys:
            ...
        ...
    default_model: gemini-2.5-flash
    models:
        ...
    default_provider: openrouter
    providers:
        ...
    ...
db:
    # SQLAlchemy compatible format:
    #   <dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
    default_provider: sqlite
    providers:
        ...
vdb:
    # Currently only supports ChromaDB and Milvus
    default_provider: chroma
    providers:
        ...
```

<br/>

## 3. Config File Management

### 3.1. Creating Config Files

Use `ahvn setup` to initialize the global configuration. You can use `-r` to force reset.

```bash
ahvn setup [--reset/-r]
```

The initial global configuration is copied from the system default configuration. After initialization, you can use `show -g` to view the global configuration, or use the `open -g` command to open it.

```bash
ahvn config show [--global/-g]
```

<br/>

### 3.2. Viewing Config

To view different configuration layers:

```bash
# View current effective configuration (merged from all layers)
ahvn config show

# View global configuration only
ahvn config show --global

# View system default configuration
ahvn config show --system
```

<br/>

### 3.3. Modifying Config

Usually, use the `ahvn config set` command to modify the configuration:

```bash
ahvn config set [--global/-g] <key_path> <value>
```

Here, `<key_path>` is a dictionary key path joined by `.`, (keys cannot contain spaces, and `.` in keys should be escaped with `\.`). For arrays, you can use `<arr>[<idx>]` format: when `<idx>` is 0, it accesses the first element; when `<idx>` is -1, it accesses the last element; when `<idx>` equals the array length, it appends a new element at the end.

**Examples:**
```bash
# Set a simple string value
ahvn config set --global llm.default_model gemini-flash

# Set a numeric value
ahvn config set core.debug true

# Set an array element
ahvn config set prompts.langs[0] en

# Append to an array
ahvn config set prompts.langs[2] fr  # Appends if index equals array length
```

Similarly, use the `unset` command to delete a configuration:

```bash
ahvn config unset [--global/-g] <key_path>
```

**Batch Modifications with JSON:**

When modifying multiple configurations, executing commands sequentially can be slow due to CLI startup overhead. For bulk modifications, use JSON format instead:

```bash
# Set multiple values at once using JSON
ahvn config set --global --json llm.presets.lover '{"provider":"openai","model":"gpt-4o","temperature":1.2}'

# Set an array
ahvn config set --global --json prompts.langs '["en","zh","fr"]'
```

The `--json/-j` flag tells the command to parse the value as JSON, allowing you to set complex nested structures in a single operation.

<br/>

### 3.4. Editing Config Files

For more complex modifications, you can directly edit configuration files in your default editor:

```bash
# Edit local configuration (current repository)
ahvn config edit

# Edit global configuration
ahvn config edit --global

# Edit system default configuration (not recommended for users)
ahvn config edit --system
```

This opens the corresponding YAML configuration file in your system's default editor (determined by the `EDITOR` environment variable, falling back to common editors like `nano`, `vim`, or `notepad`).

<br/>

### 3.5. Opening Config Files

To open configuration files in your file explorer or default application:

```bash
# Open local configuration directory
ahvn config open

# Open global configuration directory
ahvn config open --global

# Open system default configuration directory
ahvn config open --system
```

<br/>

## 4. Advanced Configs

### 4.1. Prompt and Internationalization (i18n) Config

AgentHeaven supports a powerful prompt management system with built-in templates and internationalization (i18n) capabilities.

- **Built-in Prompts**: AgentHeaven includes a variety of pre-built prompt templates for common tasks. These are located in the `src/ahvn/resources/prompts` directory and are automatically available for use. The built-in prompt categories include:
    - `autocode`: Prompts for code generation.
    - `autofunc`: Prompts for generating function calls from natural language.
    - `autoi18n`: Prompts for automatic translation.
    - `autotask`: Prompts for task decomposition and planning.
    - `db`: Prompts related to database interactions (e.g., NL2SQL).
    - `experience`: Prompts for autonomous experience collection and learning.
    - `toolspec`: Prompts for generating tool specifications.

- **Prompt Language Selection**: The `prompts` section in the configuration controls available languages and the default language used for prompt templates. For example:

```yaml
prompts:
    langs: [en, zh]
    main: en            # default language for prompt templates (source)
    lang: zh            # user-preferred language (target, can differ from `main`)
    scan:
        - "& prompts/"
        - "~/.ahvn/prompts/"
```

Set these values globally with the CLI, e.g.:

```bash
ahvn config set --global prompts.main en
ahvn config set --global prompts.langs '["en","zh"]'
```

- **Prompt files and discovery**: `prompts.scan` lists folders that AgentHeaven scans for template files. You can place jinja template folders with i18n under the scan paths (e.g., `~/.ahvn/prompts/my_awesome_prompt/`), and then the prompt can be directly used by `load_jinja_env().get_template("my_awesome_prompt/<prompt_entry_point>.jinja")`, with the default language obtained from `prompts.lang`.

- **Encoding and special characters**: the `core.encoding` setting controls how all files are read and written by AgentHeaven. Default is `utf-8`. When encountering issues with special characters during i18n, consider adjusting the local config's encoding settings or the template files themselves.

> **Tip**: If you embed placeholders or special characters in templates for prompting to LLMs, verify they render correctly in the target LLM provider. Most providers expect UTF-8 input.

<br/>

### 4.2. Proxy Config

If you are in a special network environment, you can configure `http_proxy` and `https_proxy` in each component (core, LLM, remote connections, relational databases).

For example:

```yaml
llm:
    default_args:
        http_proxy: "<HTTP_PROXY>"
        https_proxy: "<HTTPS_PROXY>"
```

This specifies the default network proxy for LLMs.

<br/>

### 4.3. Environment Variables and Commands

Configurations using angle brackets `<>` are treated as placeholders and will be replaced by system environment variables with the same name by default. For example:

```yaml
llm:
    providers:
        openrouter:
            api_key: "<OPENROUTER_API_KEY>"
```

This allows you to keep sensitive information like API keys out of configuration files by setting them as environment variables:

```bash
export OPENROUTER_API_KEY="your_actual_api_key_here"
```

Furthermore, `${}` wrapped contents will be replaced by the output of the corresponding shell command. For example:

```yaml
db:
    pg:
        dialect: postgresql
        driver: psycopg2
        host: "localhost"
        port: 5432
        username: "${whoami}"
```

The user name will be dynamically set to the output of the `whoami` command when the configuration is loaded.

This can be used for protecting sensitive information by not hardcoding it into the configuration files. For example, information such as `api_key` is stored in plain text in the configuration file, which may pose security risks, especially when using `git` for project development.

Therefore, we recommend that all projects using AgentHeaven add `.ahvn/` to `.gitignore` first (even if not for security reasons, the `.ahvn` directory may contain a large amount of knowledge and model files, which should also be ignored when uploading to GitHub), and then set configs using `<>` or `${}` instead of hardcoding sensitive information in the local configuration files.

<br/>

### 4.4. UKF Config

The `ukf` section in the configuration defines parameters for the Unified Knowledge Framework, which standardizes data representation.

```yaml
ukf:
    version: "1.0.0"
    text:
        id: 63
        short: 255
        medium: 2047
        long: 65535
```

- `version`: The version of the UKF specification being used.
- `text`: Defines maximum length constraints for different text fields.
    - `id`: Maximum length for identifiers.
    - `short`: Maximum length for short text fields.
    - `medium`: Maximum length for medium-length text fields.
    - `long`: Maximum length for long text fields.

<br/>

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [LLM Configuration](./llm.md) - Specific LLM configuration options
> - [Database Configuration](./database.md) - Relational Database connection and storage configuration
> - [Vector Database Configuration](./vdb.md) - Vector Database connection and storage configuration
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

<br/>
