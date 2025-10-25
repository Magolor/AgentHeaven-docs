# Configuration Management

The `config_utils.py` module provides a comprehensive configuration management system that handles hierarchical configuration across multiple levels (system, global, and local). This guide will walk you through using the ConfigManager class and its utilities step by step.

## 1. Getting Started

### 1.1. Basic Usage

`config_utils` provides the `ConfigManager` which is a class that handles hierarchical configuration. The `ConfigManager` is not limited to the AgentHeaven package and, after inheritance, can be used for configuration management in any Python project.

Specifically, inside AgentHeaven, there is a single-instance `HEAVEN_CM = ConfigManager()` to manage the configuration for the entire package. The easiest way to start using the configuration system is through the global configuration manager instance:

```python
from ahvn.utils.basic.config_utils import HEAVEN_CM

# Get a configuration value with dot notation
db_host = HEAVEN_CM.get('core.debug', False)
print(f"Debug Mode: {'ON' if db_host else 'OFF'}")

# Set a configuration value
HEAVEN_CM.set('core.debug', True, level='global')
```

While `HEAVEN_CM` is convenient for most use cases, you can create a custom configuration manager `cm`:

```python
from ahvn.utils.basic.config_utils import ConfigManager

# Create a config manager for a specific package
cm = ConfigManager(name="ahvn", package="ahvn")

# Set the local working directory (affects local config location)
cm.set_cwd()
```

<br/>

### 1.2. Configuration Hierarchy

The `ConfigManager` uses a three-tier configuration system:

1. **System Configuration** (`src/ahvn/resources/configs/default_config.yaml`) - Default settings
2. **Global Configuration** (`~/.ahvn/config.yaml`) - Global settings applicable to all projects
3. **Local Configuration** (`$ROOT/.ahvn/config.yaml`) - Project-specific settings

Settings are merged with local values taking precedence over global values, which override system defaults.

<br/>

## 2. Working with `ConfigManager`

### 2.1. Initialization

For new projects or when you want to reset configuration:

```python
# Initialize local configuration (creates .ahvn/config.yaml)
success = cm.init(reset=False)
if success:
    print("Local configuration initialized")
else:
    print("Local configuration already exists")

# Setup global configuration (creates ~/.ahvn/config.yaml)
success = cm.setup(reset=False)
if success:
    print("Global configuration setup complete")
else:
    print("Global configuration already exists")
```

<br/>

### 2.2. Accessing Values

#### 2.2.1. Basic Access

```python
# Get values from different configuration levels
system_config = cm.get('core.debug', level='system')  # System default
global_config = cm.get('core.debug', level='global') # User global
local_config = cm.get('core.debug', level='local')   # Project local
merged_config = cm.get('core.debug')                 # Merged (local takes precedence)

# Get with default value
debug_mode = cm.get('core.debug', default=False)
```

#### 2.2.2. Nested Structures

The configuration system supports deep nesting and array access:

```python
# Access nested dictionaries
db_config = cm.get('database')
host = cm.get('database.host')
port = cm.get('database.port', 5432)

# Access array elements
models = cm.get('llm.models', [])
first_model = cm.get('llm.models[0]')
last_model = cm.get('llm.models[-1]')

# Create nested structures if they don't exist
cm.set('new_section.nested.deep.value', 42)
```

<br/>

### 2.3. Modifying Values

#### 2.3.1. Setting

```python
# Set values at different levels
cm.set('core.debug', True, level='local')    # Project-specific
cm.set('core.debug', False, level='global')  # Global default

# Set nested values
cm.set('database.connection.timeout', 30, level='local')

# Set array values
cm.set('llm.models[0]', 'gpt-4', level='local')
cm.set('llm.models[-1]', 'claude-3', level='local')  # Append to end
```

<br/>

#### 2.3.2. Unsetting

```python
# Remove configuration values
cm.unset('core.debug', level='local')
cm.unset('database.connection.timeout', level='global')

# Remove array elements
cm.unset('llm.models[0]', level='local')
```

<br/>

### 2.4. Configuration Files

#### 2.4.1. Loading and Saving

```python
# Load configuration from files
cm.load()

# Save specific levels
cm.save(level='local')    # Save only local config
cm.save(level='global')   # Save only global config
cm.save()                 # Save both local and global

# Force reload
cm.load()
```

<br/>

#### 2.4.2. Paths

```python
# Get paths to configuration files
local_path = cm.local_config_path      # $ROOT/.ahvn/config.yaml
global_path = cm.global_config_path    # ~/.ahvn/config.yaml
system_path = cm.system_config_path    # Package resource path

# Get path by level
config_path = cm.config_path(level='local')

# Get local directory
local_dir = cm.local_dir               # Directory containing local config
```

<br/>

## 3. Advanced Features

### 3.1. Resource Access

Access package resources consistently:

```python
# Get path to package resources
resource_path = cm.resource("configs", "default_config.yaml")
prompt_path = cm.resource("prompts", "system.jinja")

# Using the helper function
from ahvn.utils.basic.config_utils import ahvn_resource
config_path = ahvn_resource("configs", "default_config.yaml")
```

<br/>

### 3.2. Configuration Encryption

Protect sensitive configuration values:

```python
from ahvn.utils.basic.config_utils import encrypt_config

# Encrypt sensitive values in a config dictionary
llm_config = {
    'api_key': 'sk-123456789',
    'model': 'gpt-4',
    'timeout': 30
}

# Encrypt keys specified in global config (core.encrypt_keys)
encrypted_config = encrypt_config(llm_config)
print(encrypted_config)
# Output: {'api_key': '******', 'model': 'gpt-4', 'timeout': 30}

# Specify custom keys to encrypt
encrypted_config = encrypt_config(llm_config, encrypt_keys=['api_key', 'timeout'])
```

<br/>

### 3.3. Special Path Handling

Use the `hpj` ("Heaven Path Join") function for platform-agnostic AgentHeaven-related path handling with special expansions:

```python
from ahvn.utils.basic.config_utils import hpj

# Basic path joining
path = hpj("config", "files", "app.yaml")

# "~" expands to home directory / user directory
home_path = hpj("~", "app", "config")

# "&" expands to AgentHeaven resources directory
resource_path = hpj("&", "configs", "default.yaml")

# ">" expands to local repository root
repo_path = hpj(">", "data", "files")

# Get absolute path "/config/app.yaml"
abs_path = hpj("config", "app.yaml", abs=True)
```

<br/>

### 3.4. Dictionary Utilities

The module provides several utilities for working with nested dictionaries:

#### 3.4.1. Merging Dictionaries

```python
from ahvn.utils.basic.config_utils import dmerge

# Merge multiple dictionaries (later values override earlier ones)
config1 = {'database': {'host': 'localhost', 'port': 5432}}
config2 = {'database': {'port': 3306}, 'debug': True}

merged = dmerge([config1, config2])
# Result: {'database': {'host': 'localhost', 'port': 3306}, 'debug': True}
```

<br/>

#### 3.4.2. Dot Notation Access

```python
from ahvn.utils.basic.config_utils import dget, dset, dunset, dsetdef

# Get values using dot notation
config = {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
host = dget(config, 'database.host')
port = dget(config, 'database.ports[0]')

# Set values using dot notation
dset(config, 'database.timeout', 30)
dset(config, 'database.ports[2]', 27017)  # Add to array

# Unset values
dunset(config, 'database.timeout')
```

<br/>

#### 3.4.3. Setting Default Values

```python
# Set a value only if it does not already exist
dsetdef(config, 'database.host', '127.0.0.1') # This will not change the existing value
dsetdef(config, 'database.user', 'default_user') # This will set a new value
```

<br/>

#### 3.4.4. Flattening and Unflattening

```python
from ahvn.utils.basic.config_utils import dflat, dunflat

# Flatten nested dictionary
config = {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
flat_dict = dict(dflat(config))
# Result: {'database.host': 'localhost', 'database.ports[0]': 5432, 'database.ports[1]': 3306}

# Unflatten back to nested structure
nested = dunflat(flat_dict)
# Result: {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
```

<br/>

## 4. Best Practices

### 4.1. Environment-Specific Settings

Use different configuration levels for different environments:

```python
# User preferences (global)
cm.set('core.debug', True, level='global')

# Project-specific overrides (local)
cm.set('core.debug', False, level='local')
```

<br/>

### 4.2. Security Considerations

Never commit sensitive information:

```python
# Good: Use environment variables
cm.set('llm.api_key', '<OPENAI_API_KEY>', level='local')

# Good: Use command output
cm.set('database.username', '${whoami}', level='local')

# Bad: Hardcoded secrets
cm.set('llm.api_key', 'sk-123456789', level='local')
```

<br/>

### 4.3. Configuration Validation

Always provide defaults and handle missing values:

```python
# Good: With defaults
timeout = cm.get('database.timeout', default=30)
max_connections = cm.get('database.max_connections', default=10)

# Risky: Without defaults
timeout = cm.get('database.timeout')  # Could be None
```

<br/>

## 5. Integration with Other Components

### 5.1. LLM Configuration

The configuration system integrates seamlessly with LLM components:

```python
# Configure LLM settings
cm.set('llm.default_model', 'gpt-4', level='global')
cm.set('llm.default_provider', 'openai', level='global')
cm.set('llm.providers.openai.api_key', '<OPENAI_API_KEY>', level='local')

# Access LLM configuration
llm_config = cm.get('llm')
```

<br/>

### 5.2. Database Configuration

Configure database connections:

```python
# Set database configuration
cm.set('db.default_provider', 'postgresql', level='global')
cm.set('db.providers.postgresql.host', 'localhost', level='global')
cm.set('db.providers.postgresql.port', 5432, level='global')
cm.set('db.providers.postgresql.username', '${whoami}', level='local')
cm.set('db.providers.postgresql.password', '<DB_PASSWORD>', level='local')
```

<br/>

### 5.3. Vector Database Configuration

Configure vector database connections:

```python
# Set vector database configuration
cm.set('vdb.default_provider', 'milvus', level='global')
cm.set('vdb.providers.milvus.host', 'localhost', level='global')
cm.set('vdb.providers.milvus.port', 19530, level='global')
cm.set('vdb.providers.milvus.collection', 'my_default_milvus_collection', level='global')
```

<br/>

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Core Configuration](../../../configuration/core.md) - Core configuration concepts
> - [LLM Configuration](../../../configuration/llm.md) - Specific LLM configuration options
> - [Database Configuration](../../../configuration/database.md) - Relational Database connection and storage configuration
> - [Vector Database Configuration](../../../configuration/vdb.md) - Vector Database connection and storage configuration
> - [Configuration Management](../../../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
