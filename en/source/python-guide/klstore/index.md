# KLStore

AgentHeaven provides a flexible knowledge storage system through KLStore implementations. These stores enable efficient persistence and management of knowledge objects (BaseUKF) with various storage backends optimized for different use cases and performance requirements.

<br/>

## Quick Navigation

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🏗️ BaseKLStore
:link: base
:link-type: doc

Abstract base class defining the common interface for all KLStore implementations with standardized knowledge management operations.
:::

:::{grid-item-card} 💾 CacheKLStore
:link: cache
:link-type: doc

High-performance in-memory knowledge storage using BaseCache backends for fast read/write operations.
:::

:::{grid-item-card} 🗄️ DatabaseKLStore
:link: database
:link-type: doc

Persistent database-backed storage using ORM entities for reliable, scalable knowledge persistence.
:::

:::{grid-item-card} 🔮 VectorKLStore
:link: vector
:link-type: doc

Vector database-backed storage, preparing for advanced similarity search and retrieval through vector engine.
:::

:::{grid-item-card} 🔄 CascadeKLStore
:link: cascade
:link-type: doc

Multi-tier storage system that cascades through ordered KLStores for hierarchical data management.
:::

::::

<br/>

## Contents

```{toctree}
:maxdepth: 2

base
cache
database
vector
cascade
```

<br/>
