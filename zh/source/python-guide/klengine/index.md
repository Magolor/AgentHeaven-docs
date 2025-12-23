# KLEngine

AgentHeaven 通过 KLEngine 实现提供了灵活的知识索引和搜索系统。这些引擎能够通过针对不同用例优化的各种搜索方法，实现对知识对象（BaseUKF）的高效搜索和检索。

<br/>

## 快速导航

::::{grid} 1 2 2 4
:gutter: 4

:::{grid-item-card} 🏗️ BaseKLEngine
:link: base
:link-type: doc

定义所有 KLEngine 实现通用接口的抽象基类,提供标准化的搜索和索引操作。
:::

:::{grid-item-card} 🗄️ FacetKLEngine
:link: facet
:link-type: doc

结构化搜索引擎,提供类 ORM 的过滤、SQL 查询和 LLM 驱动的自然语言搜索功能。
:::

:::{grid-item-card} 🌳 DAACKLEngine
:link: daac
:link-type: doc

使用 Aho-Corasick 自动机的高性能字符串搜索引擎,用于高效的多模式匹配和实体识别。
:::

:::{grid-item-card} 🔮 VectorKLEngine
:link: vector
:link-type: doc

计划中的混合向量相似度搜索引擎,用于语义和嵌入式查询。
:::

::::

<br/>

## 目录

```{toctree}
:maxdepth: 2

base
facet
daac
vector
```

<br/>