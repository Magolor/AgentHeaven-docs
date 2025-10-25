# Vector Database Utilities

This guide shows how to work with vector databases in AgentHeaven using the unified VectorDatabase interface with LlamaIndex backend and YAML configuration support.

## 1. Vector Database Architecture

AgentHeaven provides a universal vector database connector built on [LlamaIndex](https://www.llamaindex.ai/) that offers a clean, intuitive interface for storing and querying high-dimensional vector embeddings across different providers. The VectorDatabase class uses YAML configuration for connection management and supports multiple vector database backends.

**Currently supported backends:**
- SimpleVectorStore (in-memory)
- LanceDB
- ChromaDB
- Milvus
- PGVector (PostgreSQL with pgvector extension)

### 1.1. What is LlamaIndex?

[LlamaIndex](https://www.llamaindex.ai/) is a data framework for LLM applications that provides a unified interface for working with various vector stores, document loaders, and retrieval systems. AgentHeaven leverages LlamaIndex's `VectorStore` abstraction to provide consistent vector database operations across different backends.

<br/>

### 1.2. LlamaIndex Nodes

In LlamaIndex, data is stored as **`Node`** objects, specifically **`TextNode`** instances for text-based vector data. Each `TextNode` contains:

- **`text`**: The actual text content
- **`embedding`**: The vector representation (list of floats)
- **`metadata`**: Additional structured data (dictionary of scalar values)
- **`id_`**: Unique identifier for the node

AgentHeaven's `VectorDatabase` class automatically converts between dictionary records and `TextNode` objects, providing a more intuitive interface while maintaining full compatibility with LlamaIndex's ecosystem.

```python
# LlamaIndex TextNode structure (you don't need to create these manually)
from llama_index.core.schema import TextNode

node = TextNode(
    text="Vector databases enable semantic search",
    embedding=[0.1, 0.2, 0.3, ...],  # High-dimensional vector
    metadata={"category": "definition", "priority": 8},
    id_="unique_node_id"
)
```

Similar to `Database`, the `VectorDatabase` should be used as instances, which, in normal circumstances store only the config/parameters to connect to a vector database, and not the connection itself.

<br/>

### 1.3. Creating a VectorDatabase Instance

To create a VectorDatabase instance, provide the `provider` name defined in your YAML config along with any connection parameters, or manually specify all connection parameters directly. You also need to provide **encoder** and **embedder** functions to convert objects to text and text to vectors.

```python
from ahvn.utils.vdb import VectorDatabase
from ahvn.llm import LLM

# Create embedder for generating vectors
embedder = LLM(preset="embedder")

# Create VectorDatabase instances using YAML configuration
vdb = VectorDatabase(
    provider="lancedb",
    collection="my_collection",
    embedder=embedder,
    connect=True
)
```

> **Tip:** AgentHeaven resolves these provider entries at runtime through `resolve_vdb_config` with defaults from the YAML config. For detailed configuration options, see the [Vector Database Configuration](../../configuration/vdb.md) guide.

<br/>

## 2. Encoder and Embedder

The `VectorDatabase` class uses two key components for data processing:

### 2.1. Encoder

The **encoder** converts arbitrary objects to text strings. By default, it uses `str()` conversion, but you can provide custom encoders:

```python
# Default encoder (uses str())
vdb = VectorDatabase(provider="lancedb", embedder=embedder)

# Custom encoder for Knowledge objects
def knowledge_encoder(obj):
    if hasattr(obj, 'content'):
        return f"{obj.name}: {obj.content}"
    return str(obj)

vdb = VectorDatabase(
    provider="lancedb",
    encoder=knowledge_encoder,
    embedder=embedder
)
```

<br/>

### 2.2. Embedder

The **embedder** converts text strings to vector embeddings. You can use:

- **LLM instance** (recommended): Uses the configured embedding model
- **Callable function**: Custom embedding function
- **String preset**: Automatically creates an LLM with that preset

```python
from ahvn.llm import LLM

# Option 1: LLM instance (recommended)
embedder = LLM(preset="embedder")
vdb = VectorDatabase(provider="lancedb", embedder=embedder)

# Option 2: String preset (creates LLM automatically)
vdb = VectorDatabase(provider="lancedb", embedder="embedder")

# Option 3: Custom function
def custom_embedder(text):
    # Your custom embedding logic
    return [0.1, 0.2, 0.3, ...]  # Return vector

vdb = VectorDatabase(provider="lancedb", embedder=custom_embedder)
```

<br/>

### 2.3. Separate K and Q Encoders/Embedders

For advanced use cases, you can specify different encoders/embedders for **knowledge** (stored data) and **queries** (search queries):

```python
# Separate encoders for knowledge and queries
k_encoder = lambda obj: f"KNOWLEDGE: {str(obj)}"
q_encoder = lambda obj: f"QUERY: {str(obj)}"

# Separate embedders for knowledge and queries
k_embedder = LLM(preset="embedder")
q_embedder = LLM(preset="embedder_query")

vdb = VectorDatabase(
    provider="lancedb",
    encoder=(k_encoder, q_encoder),
    embedder=(k_embedder, q_embedder)
)
```

The dimensions of knowledge and query embedders are automatically detected and stored as `vdb.k_dim` and `vdb.q_dim`.

<br/>

## 3. Vector Database Connection

### 3.1. Basic Connection

Use `connect()` to establish a connection, and use `close()` to terminate it.

```python
from ahvn.utils.vdb import VectorDatabase
from ahvn.llm import LLM

# Initialize with immediate connection
vdb = VectorDatabase(
    provider="lancedb",
    collection="test_collection",
    embedder=LLM(preset="embedder"),
    connect=True
)

# Or connect later
vdb = VectorDatabase(provider="lancedb", embedder="embedder")
vdb.connect()

# Close connection
vdb.close()
```

During connection, use `vdb.vdb` as a property to access the underlying LlamaIndex `VectorStore` instance.

<br/>

## 4. Data Operations

### 4.1. Insert Records

Insert individual records as dictionaries containing `text`, `vector`, and optional metadata fields:

```python
# Insert a single record
record = {
    "id": "doc_1",
    "text": "Vector databases enable semantic search",
    "vector": [0.1, 0.2, 0.3, ...],  # Must match embedder dimensions
    "category": "definition",
    "priority": 8
}

vdb.insert(record)
```

> **Note:** The `vector` field should contain the embedding vector. You can generate it using `vdb.k_encode_embed()` or your embedder directly.

<br/>

### 4.2. Batch Insert

Insert multiple records efficiently:

```python
records = [
    {
        "id": f"doc_{i}",
        "text": f"Document content {i}",
        "vector": [float(i) * 0.1] * 128,
        "index": i
    }
    for i in range(100)
]

vdb.batch_insert(records)
```

<br/>

### 4.3. Delete Records

Delete records by their ID:

```python
# Delete a single record
vdb.delete("doc_1")
```

> **Note:** Some backends may have limitations on delete operations. Check the backend-specific documentation for details.

<br/>

### 4.4. Clear All Records

Remove all records from the collection:

```python
# Clear all records (keeps collection structure)
vdb.clear()
```

> **Warning:** This operation cannot be undone. Use with caution.

<br/>

### 4.5. Flush Operations

Explicitly flush pending operations to the vector database:

```python
# Flush pending operations (backend-specific)
vdb.flush()
```

> **Note:** Not all backends require explicit flushing. This is mainly relevant for Milvus.

<br/>

## 5. Encoding and Embedding

### 5.1. Knowledge Encoding and Embedding

Use `k_encode_embed()` to convert objects to text and generate embeddings:

```python
from ahvn.ukf.templates.basic import KnowledgeUKFT

# Create a knowledge object
knowledge = KnowledgeUKFT(
    name="Vector Search",
    content="Vector databases enable semantic search using embeddings",
    tags={"[topic:vdb]", "[type:definition]"}
)

# Encode and embed in one step
text, vector = vdb.k_encode_embed(knowledge)

# Insert the record
record = {
    "id": str(knowledge.id),
    "text": text,
    "vector": vector,
    "name": knowledge.name,
    "priority": knowledge.priority
}
vdb.insert(record)
```

<br/>

### 5.2. Query Encoding and Embedding

Use `q_encode_embed()` to prepare queries:

```python
# Encode and embed a query
query_text, query_vector = vdb.q_encode_embed("What is semantic search?")

# Use for searching
query = vdb.search(embedding=query_vector, topk=5)
```

<br/>

### 5.3. Separate Encoding and Embedding

For more control, use `k_encode()`/`q_encode()` and `k_embed()`/`q_embed()` separately:

```python
# Separate encoding and embedding for knowledge
obj = {"name": "Test", "content": "Test content"}
encoded_text = vdb.k_encode(obj)
embedding = vdb.k_embed(encoded_text)

# Separate encoding and embedding for queries
query_text = vdb.q_encode("search query")
query_embedding = vdb.q_embed(query_text)
```

<br/>

## 6. Vector Search

### 6.1. Search with Embedding

Search using a pre-computed embedding vector:

```python
# Generate query embedding
query_text, query_vector = vdb.q_encode_embed("machine learning concepts")

# Create search query
query = vdb.search(embedding=query_vector, topk=5)

# Execute search using the underlying VectorStore
results = vdb.vdb.query(query)

# Access results
for node_id, score in zip(results.ids, results.similarities):
    print(f"ID: {node_id}, Score: {score}")
```

<br/>

### 6.2. Search with Query Object

Search using a query object directly:

```python
# Search with query object (automatically generates embedding)
query = vdb.search(query="What is deep learning?", topk=10)

# Execute search
results = vdb.vdb.query(query)
```

<br/>

### 6.3. Search with Filters

Apply metadata filters to narrow search results:

```python
from ahvn.utils.vdb.filter import Filter, FilterOperator

# Create filters
filters = Filter.AND(
    Filter.EQ("category", "ml"),
    Filter.GTE("priority", 5)
)

# Search with filters
query = vdb.search(
    query="machine learning",
    topk=5,
    filters=filters
)

results = vdb.vdb.query(query)
```

> **Tip:** For detailed information about filter operations, see the source code in `src/ahvn/utils/vdb/filter.py`.

<br/>

### 6.4. Search Parameters

The `search()` method accepts several parameters:

- **`query`**: Query object or text (auto-encoded and embedded)
- **`embedding`**: Pre-computed query embedding vector
- **`topk`**: Number of top results to return (default: 5)
- **`filters`**: Metadata filters to apply
- **`*args, **kwargs`**: Additional backend-specific parameters

```python
# Search with various parameters
query = vdb.search(
    query="semantic search",
    topk=10,
    filters=None
)
```

> **Note:** Either `query` or `embedding` must be provided, but not both.

<br/>

## 7. Type Adapters for UKF

AgentHeaven provides type adapters for converting between UKF (Unified Knowledge Format) types and vector database field types. These adapters are defined in `ahvn.utils.vdb.types`.

### 7.1. Built-in Type Adapters

- **`VdbIdType`**: For UKF ID fields (converts to string format)
- **`VdbTextType`**: For general text fields
- **`VdbIntegerType`**: For integer values
- **`VdbBooleanType`**: For boolean flags
- **`VdbTimestampType`**: For timezone-aware timestamps
- **`VdbJsonType`**: For JSON-serializable data
- **`VdbVectorType`**: For vector embeddings
- **`VdbTagsType`**: For tag sets
- **`VdbSynonymsType`**: For synonym lists
- **`VdbRelatedType`**: For related entity references
- **`VdbAuthsType`**: For author/creator lists

<br/>

### 7.2. Type Conversion

Type adapters handle conversion between UKF and VDB formats:

```python
from ahvn.utils.vdb.types import VdbIdType, VdbTextType, VdbJsonType

# ID conversion
id_type = VdbIdType()
vdb_id = id_type.from_ukf(123456789)  # Converts to hash string
ukf_id = id_type.to_ukf(vdb_id)  # Converts back to integer

# JSON conversion
json_type = VdbJsonType()
vdb_json = json_type.from_ukf({"key": "value"})  # Converts to JSON string
ukf_json = json_type.to_ukf(vdb_json)  # Converts back to dict
```

> **Tip:** For more details about UKF data types and adapters, see [UKF Data Types](../ukf/data-types.md).

<br/>

## Further Exploration

> **Tip:** For more information about vector database configuration in AgentHeaven, see:
> - [Vector Database Configuration](../../configuration/vdb.md) - Vector database connection and storage configuration

> **Tip:** For related functionality, see:
> - [UKF Data Types](../ukf/data-types.md) - Data type mappings between UKF, Pydantic, and various databases
> - [Database Utilities](./db.md) - Relational database operations and utilities
> - [VectorKLStore](../klstore/vector.md) - KLStore backed by vector databases
> - [VectorKLEngine](../klengine/vector.md) - Knowledge retrieval engine using vector similarity search

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
