# Installation Guide

## 1. System Requirements

- Operating System: Platform-independent
    - Tested on Windows 11, macOS Sequoia
- Python: 3.10 or higher
    - Tested on Python 3.10, 3.11, 3.12, 3.13
- Hardware: No specific requirements; runs on standard consumer hardware
    - Though, certain optional dependencies, especially LLM serving packages, may have their own hardware requirements or could result in performance issues (e.g., `ollama`)
- Recommended Software (Optional):
    - [Git](https://git-scm.com/) for version control functionality
    - [Ollama](https://ollama.com/) to support local large model services (with embedding features)
    - [Docker](https://www.docker.com/) for self-hosting databases and sandboxes

<br/>

## 2. Package Manager Installation

AgentHeaven supports multiple package managers for flexible installation. Choose the one that best fits your workflow:

Optional Dependencies:
- `exp`: experimental features and integrations, including database integration, vector engines, etc. Recommended.
- `gui`: GUI tools for agent management and monitoring.
- `dev`: development tools including docs generation, code formatting, testing, etc.

<br/>

### 2.1. Quick Install

> *Note: Currently AgentHeaven is not released, please install from source.*

There are multiple ways to install AgentHeaven. You can choose only one method that suits your preferred.

Minimal installation (core only, no optional dependencies):

```bash
# pip
pip install agent-heaven

# uv
uv pip install agent-heaven

# poetry
poetry add agent-heaven

# conda
conda install -c conda-forge agent-heaven
```

Full installation (with all optional dependencies):

```bash
# pip
pip install "agent-heaven[exp,gui,dev]"

# uv
uv pip install "agent-heaven[exp,gui,dev]"

# poetry
poetry add agent-heaven --extras "exp gui dev"

# conda
conda install -c conda-forge agent-heaven[exp,gui,dev]
```

<br/>

### 2.2. Install From Source

Minimal installation (core only, no optional dependencies):

```bash
git clone https://github.com/Magolor/AgentHeaven.git
cd AgentHeaven

# pip
pip install -e "."

# uv
uv pip install -e "."

# poetry
poetry install

# conda
conda env create -f environment.yml
conda activate ahvn
```

Full installation (with all optional dependencies):

```bash
git clone https://github.com/Magolor/AgentHeaven.git
cd AgentHeaven

# pip
pip install -e ".[dev,exp,gui]"

# uv
uv pip install -e ".[dev,exp,gui]"

# poetry
poetry install --extras "dev exp gui"

# conda
conda env create -f environment-full.yml -n ahvn
conda activate ahvn
```

<br/>

## 3. Verification & Initial Setup

After installation, verify that AgentHeaven is working correctly:

```bash
# Check if ahvn command is available
ahvn --version

# Initialize AgentHeaven (creates config files)
ahvn setup --reset
```

<br/>

## 4. Documentation

For developers on Windows PCs, [make](https://www.cygwin.com/) needs to be installed (for documentation generation).

<br/>

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Configuration](../configuration/index.md) - Comprehensive configuration guide
> - [Core Configuration](../configuration/core.md) - Core configuration concepts
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

> **Tip:** For more information about getting started with AgentHeaven, see:
> - [5min Quick Start](./5min-quickstart.md) - Fast path to installation and basic usage
> - [60min Tutorial](./60min-tutorial.md) - Comprehensive step-by-step tutorial

<br/>
