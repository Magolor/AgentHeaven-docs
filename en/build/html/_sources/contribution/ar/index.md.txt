# Allocated Requirements (AR)

This section breaks down the requirements from the [SRS](../srs.md) and assigns them to the components within the AgentHeaven architecture.

## Quick Navigation

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 📋 BaseUKF
:link: base_ukf
:link-type: doc

Core knowledge representation format and UKF-related requirements.
:::

:::{grid-item-card} 💾 Cache
:link: cache
:link-type: doc

Monitoring, temporary storage, and cache-related requirements.
:::

:::{grid-item-card} 🦙 LLM
:link: llm
:link-type: doc

Language model interface and inference-related requirements.
:::

:::{grid-item-card} ✍️ Prompts
:link: prompts
:link-type: doc

Prompt templates and prompt-management requirements.
:::

::::

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🗄️ Database
:link: database
:link-type: doc

Database interaction and persistence requirements.
:::

:::{grid-item-card} 🗃️ KLStore
:link: klstore
:link-type: doc

Knowledge storage and persistence requirements.
:::

:::{grid-item-card} 🔎 KLEngine
:link: klengine
:link-type: doc

Knowledge retrieval, indexing, and search requirements.
:::

:::{grid-item-card} 📚 KLBase
:link: klbase
:link-type: doc

Core integration and knowledge base management requirements.
:::

::::

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🤖 Agent
:link: agent
:link-type: doc

Agent orchestration, lifecycle, and execution requirements.
:::

:::{grid-item-card} 🧾 SIE
:link: sie
:link-type: doc

Structured Information Extraction and data extraction requirements.
:::

:::{grid-item-card} 💻 CLI
:link: cli
:link-type: doc

Command line interface-related requirements and tooling.
:::

::::

<br/>

## Contents

```{toctree}
:maxdepth: 2

base_ukf
cache
llm
prompts
database
klstore
klengine
klbase
agent
sie
cli
```

<br/>

## Further Exploration

> **Tip:** See these related pages for context and developer guidance:
> - [Contribution Overview](../overview.md) - Overall contribution guidelines
> - [SRS Document](../srs.md) - Software Requirements Specification
> - [Contribution for Developers](../for_developers.md) - Developer contribution guide

> **Tip:** Developer resources:
> - [Main Guide (Python)](../../python-guide/index.md) - Python development guide
> - [Configuration](../../configuration/index.md) - Comprehensive configuration guide
> - [Getting Started](../../getting-started/index.md) - Getting started with AgentHeaven

<br/>
