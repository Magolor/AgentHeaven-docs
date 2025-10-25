
# Guide for Developers

This comprehensive guide provides instructions on how to set up your development environment, understand the project structure, and contribute code to AgentHeaven effectively.

## 1. Quick Setup

### 1.1. Prerequisites

- Python 3.8 or higher
- [Git](https://git-scm.com/) for version control
- [Conda](https://docs.conda.io/en/latest/miniconda.html) (recommended for environment management)

<br/>

### 1.2. Installation for Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Magolor/AgentHeaven.git
   cd AgentHeaven
   ```

2. **Choose your preferred package manager and installation method:**
   ```bash
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

3. **Initialize AgentHeaven environment:**
   ```bash
   bash scripts/setup.bash
   ```

   It is recommended to customize this script to setup your environment as needed (e.g., LLM providers, presets, database connections).

<br/>

## 2. Development Scripts

The `scripts/` directory contains essential tools for development workflow:

### 2.1. `scripts/setup.bash`
**Purpose**: Complete development environment setup with grouped operations.

**Usage**:
```bash
bash scripts/setup.bash
```

**What it does**:
- Initializes AgentHeaven environment (`ahvn setup -r`)
- Configures LLM providers (example with DeepSeek)
- Sets system preset models
- Initializes repository structure

<br/>

### 2.2. `scripts/docs.bash`
**Purpose**: Build and serve comprehensive project documentation.

**Usage**:
```bash
bash scripts/docs.bash [OPTIONS] [LANGUAGES]

# Examples
bash scripts/docs.bash                    # Build both en/zh, serve both
bash scripts/docs.bash en                 # Build only English
bash scripts/docs.bash en zh -s           # Build both and serve
bash scripts/docs.bash --no-serve zh      # Build Chinese without serving
bash scripts/docs.bash --validate         # Build with validation checks
```

**Options**:
- `-ns, --no-serve`: Don't start local doc servers after building
- `-s, --serve`: Explicitly start servers (default behavior)
- `-nb, --no-build, --serve-only`: Serve without rebuilding
- `--validate`: Run additional validation checks (for CI)
- `en`: Build English documentation (served on `http://localhost:8000/`)
- `zh`: Build Chinese documentation (served on `http://localhost:8001/`)

<br/>

### 2.3. `scripts/flake.bash`
**Purpose**: Code quality and formatting management.

**Usage**:
```bash
bash scripts/flake.bash [OPTIONS]

# Examples
bash scripts/flake.bash           # Run Flake8 linting only
bash scripts/flake.bash -b        # Format code with Black
bash scripts/flake.bash -c        # Check formatting without changes
bash scripts/flake.bash -a        # Run both Black and Flake8
bash scripts/flake.bash -b -f     # Format with Black then run Flake8
```

**Options**:
- `-b, --black`: Run Black code formatter
- `-c, --check`: Run Black in check mode (don't modify files)
- `-f, --flake`: Run Flake8 linter (default)
- `-a, --all`: Run both Black formatter and Flake8 linter

**Configuration**:
- Line length: 120 characters
- Flake8 ignores: `F401,F403,F405,E203,E402,E501,W503,E701`
- Targets: `src/ tests/ scripts/ tutorials/ demos/`

<br/>

### 2.4. `scripts/test.bash`
**Purpose**: Run comprehensive test suite.

**Usage**:
```bash
bash scripts/test.bash
```

**What it does**:
- Creates pytest cache directory
- Runs pytest with custom temp directory
- Cleans up cache after testing

<br/>

### 2.5. `scripts/push.bash`
**Purpose**: Complete pre-push workflow with quality checks.

**Usage**:
```bash
bash scripts/push.bash
```

**Automated workflow**:
1. Format code with Black and run Flake8
2. Run full pytest suite
3. Build documentation for both languages
4. Git add all changes
5. Commit with version number from `src/ahvn/version.py`
6. Push to origin master

<br/>

### 2.6. `scripts/clear.bash`
**Purpose**: Clear git history (use with extreme caution).

**Usage**:
```bash
bash scripts/clear.bash
```

**What it does**:
- Creates orphan branch with current code
- Removes all git history
- Commits with version number
- Force pushes to master

**⚠️ Warning**: This permanently destroys all git history!

<br/>

### 2.7. `scripts/spinner.bash`
**Purpose**: Utility script providing visual feedback for long-running operations.

**Features**:
- Animated spinner for terminal operations
- Success/failure status reporting
- Color-coded output
- Used by `setup.bash` for better UX

<br/>

### 2.8. `scripts/logo.py`
**Purpose**: Generate AgentHeaven logo.

**Usage**:
```bash
python scripts/logo.py
```

<br/>

### 2.9. `scripts/cc.bash`
**Purpose**: Configure AI coding assistants and development environment.

**Usage**:
```bash
bash scripts/cc.bash
```

**What it does**:
- Copies GitHub Copilot instructions to AI-specific files (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`)
- Creates task management directories (`__tasks__/`)
- Initializes todo and activities tracking files
- Clears existing AI provider environment variables
- Sets up environment variables for multiple AI providers:
  - **Claude Code**: Compatible with GLM, Kimi, DeepSeek, and other providers
  - **Qwen Code**: Configured with ModelScope API endpoint
- Launches Claude coding assistant

**Configuration**:
- Update `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` with your provider details
- Qwen uses ModelScope inference API by default
- Environment variables are reset before configuration to avoid conflicts

<br/>

### 2.10. `scripts/sync_req.bash`
**Purpose**: Synchronize requirements files from pip to conda.

**Usage**:
```bash
bash scripts/sync_req.bash
```

<br/>

## Further Exploration

> **Tip:** For more information about contributing to AgentHeaven, see:
> - [Contribution Overview](./overview.md) - High-level contribution guidelines and ways to get started
> - [Feature Workflow](./feature_workflow.md) - Step-by-step guide for adding new features to AgentHeaven
> - [Simple SRS](./srs.md) - High-level software requirements for the project
> - [Allocated Requirements (AR)](./ar/index.md) - Detailed component requirements allocation and specifications

> **Tip:** For more information about AgentHeaven development and usage, see:
> - [Getting Started](../getting-started/index.md) - Quick setup and basic usage guide
> - [Main Guide (Python)](../python-guide/index.md) - Comprehensive Python development guide
> - [Configuration Guide](../configuration/index.md) - Configuration system setup and management
> - [CLI Guide](../cli-guide/index.md) - Command-line interface development and usage

<br/>
