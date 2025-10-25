# AgentHeaven

[![English](https://img.shields.io/badge/Language-English-blue.svg)](https://magolor.github.io/AgentHeaven-docs/en/)
[![简体中文](https://img.shields.io/badge/语言-简体中文-blue.svg)](https://magolor.github.io/AgentHeaven-docs/zh/)

![PyPI](https://img.shields.io/pypi/v/agent-heaven)
![License](https://img.shields.io/github/license/Magolor/AgentHeaven)
![Python Version](https://img.shields.io/pypi/pyversions/agent-heaven)

> **不要问你的智能体能为你做什么，要问你能为你的智能体做什么。**

AgentHeaven **不是** 又一个智能体框架；它是一种为 AI 时代设计的知识管理方法。

AgentHeaven 的目的是在智能体工作**之前**提供一切所需，使智能体能够在一个友好且富有上下文的环境中工作，即为智能体打造一个“天堂”。

它让你能够为任何数据应用构建一个智能体式的终身学习系统，把 AI 智能体视作有能力的人类，并视为我们的用户。

📖 [English Documentation](https://magolor.github.io/AgentHeaven-docs/en/)
📖 [中文文档](https://magolor.github.io/AgentHeaven-docs/zh/)
📖 [文档 GitHub](https://github.com/Magolor/AgentHeaven-docs)

<br/>

## 主要特性

- **📚 知识管理**：将文档、数据库和用户查询中的领域知识转化为统一知识格式（UKF），并高效自动管理。
- **🗄️ 数据库集成**：高度抽象集成 SQL 数据库（通过 [SQLAlchemy](https://www.sqlalchemy.org/)）、向量数据库（通过 [LlamaIndex](https://www.llamaindex.ai/)）及其他存储与检索后端。
- **🦙 LLM 集成**：多种语言模型统一接口（通过 [LiteLLM](https://www.litellm.ai/)），支持可配置预设和模块化缓存。
- **🚀 Imitation is All You Need**：一个基于模仿，创建并通过弱监督持续优化领域智能体的智能体构建方法。
- **⚡ 智能体助力智能体**：用智能体帮助优化智能体，开启智能体系统指数级成长。
- **👤 Human-In-The-Loop 人机交互**：通过自然语言指令轻松参与智能体训练过程。
- **🌏 本土化**：基于 [Jinja](https://jinja.palletsprojects.com/en/stable/) + [Babel](https://babel.pocoo.org/en/latest/) 的提示词管理，支持智能体翻译和提示词生成。
- **🛠 实用工具**：丰富的 Python 辅助函数集合，加速开发流程。
- **🖥 CLI & GUI 工具**：集成命令行和图形界面，适合开发者和低代码用户。
- **🍀 MCP 兼容**：基于 [FastMCP 2.0](https://gofastmcp.com/getting-started/welcome/) 的中心化设计，支持各种工具使用和函数调用接口。

<br/>

## 快速导航

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 📚 简介
:link: introduction/index
:link-type: doc

了解 AgentHeaven、核心概念和 UKF 定义。
:::

:::{grid-item-card} 🚀 快速开始
:link: getting-started/index
:link-type: doc

安装指南和初始设置。
:::

:::{grid-item-card} ⚙️ 配置
:link: configuration/index
:link-type: doc

完整配置参考和设置选项。
:::

:::{grid-item-card} 🐍 主指南（Python）
:link: python-guide/index
:link-type: doc

完整的 Python 文档和使用示例。
:::

:::{grid-item-card} 🖥 CLI 使用指南
:link: cli-guide/index
:link-type: doc

命令行界面，支持仓库管理、LLM 和知识库。
:::

:::{grid-item-card} 🎨 GUI 使用指南
:link: gui-guide/index
:link-type: doc

图形界面和桌面应用使用。
:::

:::{grid-item-card} 🧩 示例应用
:link: example-applications/index
:link-type: doc

真实应用和示例。
:::

:::{grid-item-card} 🗺️ 开发规划
:link: roadmap
:link-type: doc

项目路线图和未来计划。
:::

:::{grid-item-card} 🤝 贡献
:link: contribution/index
:link-type: doc

贡献指南。
:::

:::{grid-item-card} 🔧 API 参考
:link: api_index
:link-type: doc

完整 API 文档。
:::

:::{grid-item-card} 💬 社区
:link: community/index
:link-type: doc

社区资源和故障排查。
:::

:::{grid-item-card} 📖 引用
:link: citation
:link-type: doc

学术引用 AgentHeaven 方法。
:::

:::{grid-item-card} ⚖️ 许可协议
:link: license
:link-type: doc

许可信息和使用条款。
:::

::::

<br/>

## 内容

```{toctree}
:maxdepth: 2

introduction/index
getting-started/index
configuration/index
python-guide/index
cli-guide/index
gui-guide/index
example-applications/index
roadmap
contribution/index
api_index
community/index
citation
license
```

<br/>
