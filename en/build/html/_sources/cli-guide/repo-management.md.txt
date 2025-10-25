# Repo Management

AgentHeaven provides powerful repository management features to help you organize and manage AI agent projects. Each repository contains the project's configuration files and local settings.

## 1. Repository Directory Structure

Each AgentHeaven repository contains a `.ahvn/` directory, similar to Git's `.git/` directory:

```
your-project/
├── .ahvn/
│   └── config.yaml    # Local configuration file
├── your_files.py
└── ...
```

<br/>

## 2. Initialize a New Repository

### 2.1. Create an Anonymous Repository

Initialize a new AgentHeaven repository in the current directory:

```bash
ahvn repo init
```

This will create a `.ahvn/` directory and configuration file in the current directory, but will not register the repository globally.

<br/>

### 2.2. Create a Named Repository

Create a repository with a name and automatically register it in the global configuration:

```bash
ahvn repo init my-project
```

This not only initializes the current directory, but also registers the repository with the name `my-project` in the global configuration for easier management.

<br/>

### 2.3. Reset an Existing Repository

If you need to reset the repository configuration to default values, use `--reset/-r`:

```bash
ahvn repo init --reset
# or
ahvn repo init my-project --reset
```

<br/>

## 3. Cache and Cleanup

### 3.1. Clear Cache and Temporary Files

AgentHeaven stores cached data and temporary files in configured directories. You can clean these to free up disk space or resolve issues caused by corrupted cache:

```bash
ahvn clean
```

This will remove all cached data and temporary files from the configured `cache_path` and `tmp_path` directories.

<br/>

### 3.2. Preview Cleanup (Dry Run)

To preview what would be deleted without actually deleting anything, use the `--dry-run/-n` option:

```bash
ahvn clean --dry-run
# or
ahvn clean -n
```

<br/>

## 4. Global Repo Management

### 4.1. View All Registered Repositories

List all repositories registered in the global configuration using `list` or `ls`:

```bash
ahvn repo list
# or
ahvn repo ls
```

Example output:
```
Registered repos:
  ✓ my-project     /path/to/my-project
  ✗ old-project    /path/to/old-project  # Path does not exist
```

- ✓ indicates the repository path exists and is valid
- ✗ indicates the repository path does not exist or is invalid

<br/>

### 4.2. View Repository Details

View details of a specific repository using `info`:

```bash
ahvn repo info my-project
```

Example output:
```
Repo: my-project
  Path: /path/to/my-project
  Exists: Yes
  Created: 2024-01-15 10:30:45
  Modified: 2024-01-20 14:22:33
```

<br/>

### 4.3. Rename a Repository

Rename a registered repository using `rename` or `rn`:

```bash
ahvn repo rename old-name new-name
# or
ahvn repo rn old-name new-name
```

<br/>

### 4.4. Remove a Repository

Remove a repository registration from the global configuration (does not delete actual files) using `remove` or `rm`:

```bash
ahvn repo remove my-project
# or
ahvn repo rm my-project
```

<br/>

## Further Exploration

> **Tip:** For more information about CLI usage in AgentHeaven, see:
> - [LLM Inference](./llm-inference.md) - LLM inference tools in CLI
> - [LLM Session](./llm-session.md) - LLM interactive sessions in CLI
> - [Prompt Management](./prompt-management.md) - Prompt creation and localization in CLI
> - [Knowledge Management](./knowledge-management.md) - Knowledge base management in CLI

<br/>
