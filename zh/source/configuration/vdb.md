# 向量数据库配置

AgentHeaven 支持多种向量数据库后端，用于存储和查询高维向量嵌入。该配置允许您在不同的提供商之间切换并自定义其设置。

<br/>

## 1. 配置结构

您配置文件 (`config.yaml`) 中的 `vdb` 部分管理向量数据库设置。这是一个典型的结构：

```yaml
vdb:
    # 支持 Simple、Lance、ChromaDB、Milvus 和 PGVector
    default_provider: lancedb
    default_embedder: embedder
    providers:
        simple:
            backend: simple
        lancedb:
            backend: lancedb
            uri: "./.ahvn/lancedb/"
            collection: "default"
            refine_factor: 10
        chromalite:
            backend: chroma
            mode: "ephemeral"
            collection: "default"
        chroma:
            backend: chroma
            mode: "persistent"
            path: "./.ahvn/chromadb/"
            collection: "default"
        milvuslite:
            backend: milvus
            uri: "./.ahvn/milvus.db"
            collection: "default"
        milvus:
            backend: milvus
            host: "localhost"
            port: 19530
            collection: "default"
        pgvector:
            backend: pgvector
            dialect: postgresql
            host: "localhost"
            port: 5432
            username: "${whoami}"
            collection: "default"
```

- `default_provider`: 要使用的默认向量数据库（例如 `lancedb`）。
- `default_embedder`: 要使用的默认嵌入模型。
- `providers`: 可用向量数据库配置的字典。

<br/>

## 2. 提供商配置

AgentHeaven 目前支持以下向量数据库后端：

### 2.1. 简单向量存储

- `backend`: `simple`

该提供商使用 `llama_index.core.vector_stores.SimpleVectorStore`，这是一个基本的内存向量存储。它对于不需要数据持久性的测试和开发场景非常有用。它不需要任何额外的配置参数。

<br/>

### 2.2. LanceDB

- `backend`: `lancedb`
- `uri`: LanceDB 数据库目录的路径。
- `collection`: 默认集合名称。
- `refine_factor`: 用于优化搜索结果的参数。

<br/>

### 2.3. ChromaDB

ChromaDB 可以在两种模式下运行：

- **临时 (`chromalite`)**:
    - `backend`: `chroma`
    - `mode`: `ephemeral`
    - 一个不持久化数据的内存实例。

- **持久化 (`chroma`)**:
    - `backend`: `chroma`
    - `mode`: `persistent`
    - `path`: 用于存储数据库的文件系统路径。

<br/>

### 2.4. Milvus

Milvus 可以在两种模式下运行：

- **Lite (`milvuslite`)**:
    - `backend`: `milvus`
    - `uri`: 本地 Milvus Lite 数据库文件的路径。

- **独立/集群 (`milvus`)**:
    - `backend`: `milvus`
    - `host`: Milvus 服务器的主机名或 IP 地址。
    - `port`: Milvus 服务器的端口号。

<br/>

### 2.5. PGVector

- `backend`: `pgvector`
- `dialect`: `postgresql`
- `host`, `port`, `username`: PostgreSQL 服务器的连接详细信息。
- `collection`: 用于存储向量的表名。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中配置的更多信息，请参见：
> - [核心配置](../configuration/core.md) - 核心配置概念
> - [LLM 配置](../configuration/llm.md) - 具体的 LLM 配置选项
> - [数据库配置](./database.md) - 关系数据库连接和存储配置
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

<br/>
