# KLEngine

AgentHeaven provides a flexible knowledge indexing and search system through KLEngine implementations. These engines enable efficient searching and retrieval of knowledge objects (BaseUKF) with various search methodologies optimized for different use cases.

<br/>

## Quick Navigation

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🏗️ BaseKLEngine
:link: base
:link-type: doc

Abstract base class defining the common interface for all KLEngine implementations with standardized search and indexing operations.
:::

:::{grid-item-card} 🗄️ FacetKLEngine
:link: facet
:link-type: doc

Structured search engine providing ORM-like filtering, SQL queries, and LLM-powered natural language search capabilities.
:::

:::{grid-item-card} 🌳 DAACKLEngine
:link: daac
:link-type: doc

High-performance string search engine using Aho-Corasick automaton for efficient multi-pattern matching and entity recognition.
:::

:::{grid-item-card} 🔮 VectorKLEngine
:link: vector
:link-type: doc

Planned hybrid vector similarity search engine for semantic and embedding-based queries.
:::

::::

<br/>

## Contents

```{toctree}
:maxdepth: 2

base
facet
daac
vector
```

<br/>
