# 安装指南

## 1. 系统要求

- 操作系统：跨平台支持
    - 已在 Windows 11、macOS Sequoia 上测试
- Python：3.10 或更高版本
    - 已在 Python 3.10、3.11、3.12、3.13 上测试
- 硬件：无特定要求；可在标准消费级硬件上运行
    - 不过，某些可选依赖项，特别是 LLM 服务包，可能有自己的硬件要求或可能导致性能问题（例如，`ollama`）
- 推荐软件（可选）：
    - [Git](https://git-scm.com/) 用于版本控制功能
    - [Ollama](https://ollama.com/) 用于支持本地大模型服务（含embedding功能）
    - [Docker](https://www.docker.com/) 用于自托管数据库与沙盒

<br/>

## 2. 包管理器安装

AgentHeaven 支持多种包管理器以便灵活安装。请选择最适合您工作流的方式：

可选依赖：
- `exp`：实验性功能与集成（包括数据库集成、向量引擎等），推荐安装。
- `gui`：用于智能体管理和监控的图形界面工具。
- `dev`：开发工具，包括文档生成、代码格式化、测试等。

<br/>

### 2.1. 快速安装

> *注意：当前 AgentHeaven 尚未在发布仓库发布，请从源码安装。*

AgentHeaven 有多种安装方式。你可以选择只使用一种适合你的方法。

最小安装（仅核心组件，不包含可选依赖）：

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

完整安装（包含所有可选依赖）：

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

### 2.2. 从源码安装

最小安装（仅核心组件，不包含可选依赖）：

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

完整安装（包含所有可选依赖）：

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

## 3. 验证安装 & 初始设置

安装后，验证 AgentHeaven 是否正常工作：

```bash
# 检查 ahvn 命令是否可用
ahvn --version

# 初始化 AgentHeaven（创建配置文件）
ahvn setup --reset
```

<br/>

## 4. 文档

对于Windows PC上的开发者，需要安装[make](https://www.cygwin.com/)（帮助文档生成）。

<br/>

## 拓展阅读

> **提示：** 有关配置在 AgentHeaven 中的更多信息，请参见：
> - [配置](../configuration/index.md) - 全面配置指南
> - [核心配置](../configuration/core.md) - 核心配置概念
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

> **提示：** 有关 AgentHeaven 的更多入门信息，请参见：
> - [5 分钟快速开始](./5min-quickstart.md) - 快速安装与基本使用路径
> - [60 分钟教程](./60min-tutorial.md) - 全面逐步教程

<br/>
