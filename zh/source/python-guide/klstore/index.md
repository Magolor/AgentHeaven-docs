# KLStore

AgentHeaven 通过 KLStore 实现提供了灵活的知识存储系统。这些存储系统通过针对不同用例和性能要求优化的各种存储后端,实现对知识对象(BaseUKF)的高效持久化和管理。

<br/>

## 快速导航

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🏗️ BaseKLStore
:link: base
:link-type: doc

定义所有 KLStore 实现通用接口的抽象基类,具有标准化的知识管理操作。
:::

:::{grid-item-card} 💾 CacheKLStore
:link: cache
:link-type: doc

使用 BaseCache 后端的高性能内存知识存储,用于快速读写操作。
:::

:::{grid-item-card} 🗄️ DatabaseKLStore
:link: database
:link-type: doc

使用 ORM 实体的持久化数据库后端存储,用于可靠、可扩展的知识持久化。
:::

:::{grid-item-card} 🔮 VectorKLStore
:link: vector
:link-type: doc

基于向量数据库的存储,为通过向量引擎进行高级相似性搜索和检索做好准备。
:::

:::{grid-item-card} 🔄 CascadeKLStore
:link: cascade
:link-type: doc

通过有序 KLStore 级联的多层存储系统,用于分层数据管理。
:::

::::

<br/>

## 目录

```{toctree}
:maxdepth: 2

base
cache
database
vector
cascade
```

<br/>
