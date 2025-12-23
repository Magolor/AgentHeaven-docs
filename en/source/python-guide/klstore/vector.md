# VectorKLStore

VectorKLStore is a vector database-backed [BaseKLStore](./base.md) implementation built on AgentHeaven's [VectorDatabase](../utils/vdb.md) wrapper around LlamaIndex. It provides semantic storage for knowledge objects with automatic embedding generation and support for multiple vector database backends.

## 1. Introduction

### 1.1. Vector Storage for Semantic Search

VectorKLStore bridges simple ID-based storage with semantic similarity search:

**VectorKLStore's role:**
- **ID-Based Access**: Standard BaseKLStore CRUD operations (get by ID, insert, update, remove)
- **Automatic Embedding**: Converts UKF objects to vectors using configurable encoder/embedder
- **Multiple Backends**: Supports LanceDB, ChromaDB, Milvus, PGVector via LlamaIndex
- **Engine-Ready**: Prepares data for [VectorKLEngine](../klengine/vector.md) semantic search

**Why VectorKLStore alone isn't enough for search:**
VectorKLStore implements only the BaseKLStore interface (ID-based operations). For semantic similarity queries, filtering, and ranking, you need a [VectorKLEngine](../klengine/vector.md) built on top of this store.

<br/>

### 1.2. LlamaIndex Integration

VectorKLStore uses LlamaIndex's unified vector store abstraction:
- **TextNode Storage**: UKF objects converted to LlamaIndex `TextNode` format
- **VdbUKFAdapter**: Bidirectional mapping between BaseUKF and TextNode with metadata
- **Encoder/Embedder Pipeline**: Customizable text extraction and embedding generation
- **Backend Abstraction**: Same code works across SimpleVectorStore, LanceDB, ChromaDB, Milvus, PGVector

<br/>

## 2. Quick Start

### 2.1. Basic Usage

```python
from ahvn.klstore import VectorKLStore
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# Create embedder for generating vectors
embedder = LLM(preset="embedder")

# LanceDB (file-based, simplest)
store = VectorKLStore(
    collection="knowledge_base",
    provider="lancedb",
    uri="./data/lancedb",
    embedder=embedder
)

# Or ChromaDB (production-ready)
store = VectorKLStore(
    collection="knowledge_base",
    provider="chroma",
    mode="persistent",
    path="./data/chroma",
    embedder=embedder
)

# Create and store a knowledge object
kl = BaseUKF(
    name="Python Tutorial",
    type="documentation",
    content="Learn Python programming from scratch"
)
store.upsert(kl)

# Retrieve by ID (not by semantic search - use VectorKLEngine for that)
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

All standard [BaseKLStore](./base.md) operations work: `insert()`, `upsert()`, `get()`, `remove()`, `batch_*()`, iteration, etc.

<br/>

### 2.2. Initialization Parameters

- **`collection`** (required): Collection/table name in the vector database
- **`provider`** (optional): Vector database provider ("lancedb", "chroma", "milvus", "pgvector"); uses config default if omitted
- **`name`** (optional): KLStore instance name (default: collection name)
- **`encoder`** (optional): Function(s) to convert objects to text; defaults to `str()`
- **`embedder`** (required): LLM instance or function(s) to convert text to vectors
- **`condition`** (optional): Filter function to conditionally store objects
- **Additional kwargs**: Backend-specific connection parameters (uri, path, mode, host, etc.)

<br/>

## 3. Vector Database Backends

### 3.1. LanceDB — Recommended for Production

```python
store = VectorKLStore(
    collection="knowledge",
    provider="lancedb",
    uri="./data/lancedb",  # File path
    embedder=embedder
)
# Fast, file-based, great for analytics and production
```

<br/>

### 3.2. ChromaDB — Development & Testing

```python
# Persistent mode (file-based)
store = VectorKLStore(
    collection="knowledge",
    provider="chroma",
    mode="persistent",
    path="./data/chroma",
    embedder=embedder
)

# Ephemeral mode (in-memory, for testing)
store = VectorKLStore(
    collection="knowledge",
    provider="chroma",
    mode="ephemeral",
    embedder=embedder
)
```

<br/>

### 3.3. Milvus — Large-Scale Production

```python
# MilvusLite (file-based, no server required)
store = VectorKLStore(
    collection="knowledge",
    provider="milvus",
    uri="./data/milvus.db",
    embedder=embedder
)

# Milvus Server (distributed, high performance)
store = VectorKLStore(
    collection="knowledge",
    provider="milvus",
    host="localhost",
    port=19530,
    embedder=embedder
)
```

<br/>

### 3.4. PGVector — PostgreSQL Integration

```python
store = VectorKLStore(
    collection="knowledge",
    provider="pgvector",
    database="mydb",
    host="localhost",
    port=5432,
    username="user",
    password="pass",
    embedder=embedder
)
# Leverages PostgreSQL's pgvector extension
```

<br/>

## 4. Encoder and Embedder Configuration

VectorKLStore requires **encoder** (object → text) and **embedder** (text → vector) functions:

### 4.1. Default Encoder

By default, uses `str()` conversion:

```python
store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    embedder=embedder
)
# Encoder: kl → str(kl) → "BaseUKF(name='...', ...)"
```

<br/>

### 4.2. Custom Encoder

Provide a custom function to extract text from UKF objects:

```python
def knowledge_encoder(kl):
    """Extract meaningful text from UKF for embedding."""
    parts = [kl.name, kl.type]
    if kl.content:
        parts.append(kl.content)
    if kl.synonyms:
        parts.extend(kl.synonyms)
    return " | ".join(parts)

store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    encoder=knowledge_encoder,
    embedder=embedder
)
```

<br/>

### 4.3. Embedder Options

Use an LLM instance, callable, or preset string:

```python
from ahvn.llm import LLM

# Option 1: LLM instance (recommended)
embedder = LLM(preset="embedder")
store = VectorKLStore(provider="lancedb", embedder=embedder)

# Option 2: Preset string (creates LLM automatically)
store = VectorKLStore(provider="lancedb", embedder="embedder")

# Option 3: Custom function
def my_embedder(text: str) -> list[float]:
    # Your embedding logic
    return [0.1, 0.2, 0.3, ...]  # 128-dim or higher

store = VectorKLStore(provider="lancedb", embedder=my_embedder)
```

<br/>

### 4.4. Separate K and Q Encoders/Embedders

For advanced use cases (e.g., asymmetric search), specify different encoders/embedders for knowledge (stored data) and queries:

```python
# Different text extraction for storage vs queries
k_encoder = lambda kl: f"{kl.name}: {kl.content}"
q_encoder = lambda query: f"SEARCH: {query}"

# Different embedding models for storage vs queries
k_embedder = LLM(preset="embedder")
q_embedder = LLM(preset="embedder_query")

store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    encoder=(k_encoder, q_encoder),
    embedder=(k_embedder, q_embedder)
)
```

<br/>

## 5. VectorKLStore-Specific Features

### 5.1. Automatic Schema Initialization

VectorKLStore automatically creates a dummy record on initialization to establish the schema:

```python
store = VectorKLStore(collection="docs", provider="lancedb", embedder=embedder)
# Internally:
# 1. Creates dummy UKF to infer schema
# 2. Inserts and immediately removes it
# 3. Schema now established for all future inserts
```

<br/>

### 5.2. VdbUKFAdapter Integration

The adapter handles bidirectional conversion between BaseUKF and LlamaIndex TextNode:

```python
# Internally used by VectorKLStore
# UKF → TextNode (with embedding)
node = adapter.from_ukf(kl=knowledge_obj, key=encoded_text, embedding=vector)

# TextNode → UKF (retrieval)
kl = adapter.to_ukf(entity=text_node)
```

You can control which UKF fields are stored using `include`/`exclude`:

```python
store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    embedder=embedder,
    include=["name", "type", "content", "tags"],  # Only store these fields
    exclude=["related"]  # Exclude this field
)
```

<br/>

### 5.3. Close Connection

```python
# Close vector database connection
store.close()
```

<br/>

## 6. Complete Example

```python
from ahvn.klstore import VectorKLStore
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF, ptags

# Initialize embedder
embedder = LLM(preset="embedder")

# Custom encoder to extract meaningful text
def encode_knowledge(kl):
    text = f"{kl.name} ({kl.type})"
    if kl.content:
        text += f": {kl.content}"
    return text

# Create VectorKLStore with LanceDB
store = VectorKLStore(
    collection="research_papers",
    provider="lancedb",
    uri="./data/vectors",
    encoder=encode_knowledge,
    embedder=embedder,
    name="research_store",
    condition=lambda kl: kl.type in ["research_paper", "review_paper"]
)

# Create knowledge objects
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        content="Transformer architecture for sequence modeling",
        tags=ptags(FIELD="deep_learning", TOPIC="transformers", YEAR="2017")
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        content="Bidirectional encoder representations from transformers",
        tags=ptags(FIELD="nlp", TOPIC="pre_training", YEAR="2018")
    ),
    BaseUKF(
        name="Random Blog Post",
        type="blog_post",  # Filtered out by condition
        content="Some content..."
    )
]

# Batch insert (blog_post filtered out by condition)
store.batch_upsert(papers)

# Standard KLStore operations (ID-based, not semantic search)
print(f"Total papers: {len(store)}")  # 2

# Get by ID
paper = store.get(papers[0].id)
print(f"Retrieved: {paper.name}")

# Update
paper = paper.clone(content=paper.content + " with multi-head attention")
store.upsert(paper)

# Iterate
for paper in store:
    print(f"- {paper.name} ({paper.tags.get('YEAR')})")

# Remove
store.remove(papers[1].id)

# For semantic search, use VectorKLEngine instead:
# from ahvn.klengine import VectorKLEngine
# engine = VectorKLEngine(storage=store, inplace=True)
# results = engine.search("transformer architectures", top_k=5)

# Clean up
store.close()
```

<br/>

## 7. Limitations and When to Use VectorKLEngine

### 7.1. What VectorKLStore Does NOT Provide

VectorKLStore implements only the **BaseKLStore interface** (ID-based CRUD). It does **NOT** support:

- ❌ Semantic similarity search
- ❌ Vector similarity queries
- ❌ Top-K retrieval by relevance
- ❌ Filtering by metadata + vector similarity
- ❌ Ranking and scoring

<br/>

### 7.2. Use VectorKLEngine for Search

For semantic queries, wrap VectorKLStore with [VectorKLEngine](../klengine/vector.md):

```python
from ahvn.klengine import VectorKLEngine

# In-place engine (search directly in the vector database)
engine = VectorKLEngine(storage=store, inplace=True)

# Semantic search
results = engine.search(
    query="transformer architectures for NLP",
    top_k=5,
    filters={"FIELD": "deep_learning"}
)

for kl, score in results:
    print(f"{kl.name} (score: {score:.3f})")
```

<br/>

## Further Exploration

> **Tip:** For the interface and common operations, see:
> - [BaseKLStore](./base.md) - Abstract base class defining the KLStore interface and shared functionality

> **Tip:** For vector database configuration and utilities, see:
> - [Vector Database Utilities](../utils/vdb.md) - LlamaIndex-based vector database wrapper with encoder/embedder pipeline
> - [Vector Database Configuration](../../configuration/vdb.md) - YAML configuration for vector database providers

> **Tip:** For other KLStore implementations, see:
> - [CacheKLStore](./cache.md) - Lightweight cache-backed storage with multiple backend options
> - [DatabaseKLStore](./database.md) - Persistent relational database storage with ORM support
> - [CascadeKLStore](./cascade.md) - Multi-tier storage routing based on custom criteria

> **Tip:** For semantic search and retrieval, see:
> - [VectorKLEngine](../klengine/vector.md) - Semantic similarity search engine built on VectorKLStore
> - [KLEngine](../klengine/index.md) - Search engine implementations built on top of KLStores

<br/>
