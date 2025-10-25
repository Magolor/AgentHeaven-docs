# Vector Database Configuration

AgentHeaven supports multiple vector database backends for storing and querying high-dimensional vector embeddings. This configuration allows you to switch between different providers and customize their settings.

<br/>

## 1. Config Structure

The `vdb` section in your configuration file (`config.yaml`) manages vector database settings. Here is a typical structure:

```yaml
vdb:
    # Supports Simple, Lance, ChromaDB, Milvus, and PGVector
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

- `default_provider`: The default vector database to use (e.g., `lancedb`).
- `default_embedder`: The default embedding model to use.
- `providers`: A dictionary of available vector database configurations.

<br/>

## 2. Provider Configuration

AgentHeaven currently supports the following vector database backends:

### 2.1. Simple Vector Store

- `backend`: `simple`

This provider uses `llama_index.core.vector_stores.SimpleVectorStore`, which is a basic, in-memory vector store. It is useful for testing and development scenarios where data persistence is not required. It does not require any additional configuration parameters.

<br/>

### 2.2. LanceDB

- `backend`: `lancedb`
- `uri`: Path to the LanceDB database directory.
- `collection`: Default collection name.
- `refine_factor`: A parameter for refining search results.

<br/>

### 2.3. ChromaDB

ChromaDB can be run in two modes:

- **Ephemeral (`chromalite`)**:
    - `backend`: `chroma`
    - `mode`: `ephemeral`
    - An in-memory instance that does not persist data.

- **Persistent (`chroma`)**:
    - `backend`: `chroma`
    - `mode`: `persistent`
    - `path`: Filesystem path to store the database.

<br/>

### 2.4. Milvus

Milvus can be run in two modes:

- **Lite (`milvuslite`)**:
    - `backend`: `milvus`
    - `uri`: Path to the local Milvus Lite database file.

- **Standalone/Clustered (`milvus`)**:
    - `backend`: `milvus`
    - `host`: Hostname or IP address of the Milvus server.
    - `port`: Port number for the Milvus server.

<br/>

### 2.5. PGVector

- `backend`: `pgvector`
- `dialect`: `postgresql`
- `host`, `port`, `username`: Connection details for your PostgreSQL server.
- `collection`: The table name used for storing vectors.

<br/>

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Core Configuration](../configuration/core.md) - Core configuration concepts
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options
> - [Database Configuration](./database.md) - Relational Database connection and storage configuration
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

<br/>
