# VectorKLEngine

VectorKLEngine is a vector database-backed [BaseKLEngine](./base.md) implementation that enables semantic similarity search over knowledge objects using vector embeddings combined with metadata filtering. It leverages LlamaIndex's unified vector store abstraction to provide flexible, high-performance semantic retrieval through `Filter` operators—a powerful system for combining vector similarity with structured metadata constraints.

## 1. Introduction

### 1.1. What is Semantic Vector Search?

**Semantic vector search** is a retrieval technique that finds documents or knowledge objects based on meaning similarity rather than exact keyword matching. It works by:
- Converting text into high-dimensional vectors (embeddings) that capture semantic meaning
- Measuring similarity between query and document vectors using distance metrics (cosine, L2, etc.)
- Returning the most similar results ranked by relevance score

**VectorKLEngine** brings this capability to knowledge retrieval by:
- **Input**: Natural language query text + optional metadata filters
- **Indexed Data**: Knowledge objects converted to vector embeddings (via [VectorKLStore](../klstore/vector.md))
- **Output**: Top-K most semantically similar knowledge objects with relevance scores
- **Performance**: Leverages specialized vector database indexes (IVF, HNSW, etc.) for fast approximate nearest neighbor search

Unlike faceted search (exact attribute matching) or pattern matching (string searching), vector search excels at **finding conceptually related content** even when exact terms don't match.

<br/>

### 1.2. When to Use VectorKLEngine

**Ideal Use Cases:**
- **Semantic Similarity Search**: Find documents related to a concept without exact keyword matches (e.g., "machine learning" finds "neural networks", "deep learning")
- **Question Answering**: Retrieve relevant context passages for questions
- **Recommendation Systems**: Find similar items based on content semantics
- **Hybrid Search**: Combine vector similarity with metadata filtering (e.g., "recent papers about transformers")
- **Cross-Lingual Search**: Find documents in different languages with multilingual embeddings
- **Multi-Modal Retrieval**: Search across text, images, audio with appropriate embedding models

**Not Suitable For:**
- **Exact Attribute Matching**: Use [FacetKLEngine](./facet.md) for precise filtering by type, status, dates, etc.
- **Entity Recognition**: Use [DAACKLEngine](./daac.md) for finding known entity strings in text
- **Deterministic Filtering**: Vector search is approximate and may miss exact matches
- **Low-Latency Requirements**: Vector search is slower than database index lookups

<br/>

### 1.3. Key Features

- **Semantic Similarity**: Find conceptually related content using neural embedding models
- **Metadata Filtering**: Combine vector similarity with structured filters through `Filter` operators
- **Multiple Vector Backends**: Supports LanceDB, ChromaDB, Milvus, SimpleVectorStore through LlamaIndex
- **Flexible Encoding**: Custom encoder functions to extract searchable text from knowledge objects
- **Configurable Embedders**: Use any embedding model (OpenAI, local models, custom)
- **Two Operating Modes**:
  - **In-Place Mode** (`inplace=True`): Directly query the attached VectorKLStore with zero overhead
  - **Non-In-Place Mode** (`inplace=False`): Create an optimized copy with schema subsetting
- **Relevance Scoring**: Returns similarity scores for ranking and thresholding
- **Top-K Retrieval**: Efficiently retrieve only the most relevant results

<br/>

## 2. Understanding Filter Operators

The `Filter` class provides a fluent API for building metadata filter expressions that work with LlamaIndex's `MetadataFilters`. These filters constrain vector search results to match specific metadata criteria. The API is very similar to `Facet` operators used in [FacetKLEngine](./facet.md), but generates LlamaIndex filter objects instead of SQL.

### 2.1. Comparison Operators

These operators compare metadata field values against constants:

**Equality and Inequality:**
```python
from ahvn.utils.vdb.filter import Filter

# Exact match (field == value)
Filter.expr(type="tutorial")
# Generated: {"FIELD:type": {"==": "tutorial"}}
# LlamaIndex: ExactMatchFilter(key="type", value="tutorial")

# Not equal (field != value) - use NOT wrapper
Filter.expr(status=Filter.NOT("archived"))
# Generated: {"FIELD:status": {"NOT": {"==": "archived"}}}
# LlamaIndex: MetadataFilters(filters=[MetadataFilter(key="status", value="archived", operator="!=")], condition="not")
```

**Numeric Comparisons:**
```python
# Less than
Filter.expr(priority=Filter.LT(5))
# Generated: {"FIELD:priority": {"<": 5}}
# LlamaIndex: MetadataFilter(key="priority", value=5, operator="<")

# Less than or equal
Filter.expr(priority=Filter.LTE(10))
# Generated: {"FIELD:priority": {"<=": 10}}

# Greater than
Filter.expr(score=Filter.GT(80))
# Generated: {"FIELD:score": {">": 80}}

# Greater than or equal
Filter.expr(score=Filter.GTE(90))
# Generated: {"FIELD:score": {">=": 90}}
```

**DateTime Comparisons:**
```python
import datetime

# Filter by date range
Filter.expr(created_at=Filter.GTE(datetime.datetime(2024, 1, 1)))
# Generated: {"FIELD:created_at": {">=": datetime.datetime(2024, 1, 1)}}

Filter.expr(updated_at=Filter.LTE(datetime.datetime(2024, 12, 31)))
# Generated: {"FIELD:updated_at": {"<=": datetime.datetime(2024, 12, 31)}}
```

<br/>

### 2.2. Pattern Matching Operators

Text pattern matching operators (mapped to LlamaIndex text matching):

**Case-Sensitive Pattern Matching (LIKE → text_match):**
```python
# Wildcard matching
Filter.expr(name=Filter.LIKE("%Python%"))  # Contains "Python"
# Generated: {"FIELD:name": {"LIKE": "%Python%"}}
# LlamaIndex: MetadataFilter(key="name", value="%Python%", operator="text_match")

Filter.expr(name=Filter.LIKE("Python%"))   # Starts with "Python"
Filter.expr(name=Filter.LIKE("%Tutorial"))  # Ends with "Tutorial"
```

**Case-Insensitive Pattern Matching (ILIKE → text_match_insensitive):**
```python
# Case-insensitive search
Filter.expr(description=Filter.ILIKE("%python%"))  # Matches "Python", "PYTHON", "python"
# Generated: {"FIELD:description": {"ILIKE": "%python%"}}
# LlamaIndex: MetadataFilter(key="description", value="%python%", operator="text_match_insensitive")
```

**Note:** Pattern matching behavior depends on the vector database backend. Some backends may not support text matching operators.

<br/>

### 2.3. Range Operators

Filter values within numeric or datetime ranges:

**BETWEEN Operator:**
```python
# Inclusive range [min, max]
Filter.expr(score=Filter.BETWEEN(0, 100))
# Generated: {"FIELD:score": {"AND": [{">=": 0}, {"<=": 100}]}}
# LlamaIndex: MetadataFilters with two filters (>= and <=) combined with AND

# Open-ended ranges with None
Filter.expr(price=Filter.BETWEEN(100, None))  # >= 100 (no upper limit)
# Generated: {"FIELD:price": {"AND": [{">=": 100}, {"<=": inf}]}}

Filter.expr(age=Filter.BETWEEN(None, 65))     # <= 65 (no lower limit)
# Generated: {"FIELD:age": {"AND": [{">=": -inf}, {"<=": 65}]}}
```

**Tuple Shorthand:**
```python
# Tuples automatically convert to BETWEEN
Filter.expr(priority=(1, 10))
# Equivalent to: Filter.expr(priority=Filter.BETWEEN(1, 10))
# Generated: {"FIELD:priority": {"AND": [{">=": 1}, {"<=": 10}]}}
```

<br/>

### 2.4. Logical Operators

Combine multiple conditions with boolean logic:

**AND Operator (Logical Conjunction):**
```python
# All conditions must be true
Filter.expr(score=Filter.AND([Filter.GTE(80), Filter.LTE(100)]))
# Generated: {"FIELD:score": {"AND": [{">=": 80}, {"<=": 100}]}}
# LlamaIndex: MetadataFilters(filters=[...], condition="and")
```

**OR Operator (Logical Disjunction):**
```python
# At least one condition must be true
Filter.expr(status=Filter.OR(["active", "pending", "reviewing"]))
# Generated: {"FIELD:status": {"OR": [{"IN": ["active", "pending", "reviewing"]}]}}
# LlamaIndex: MetadataFilters(filters=[ExactMatchFilter(...), ...], condition="or")

# Mix operators in OR
Filter.expr(priority=Filter.OR([Filter.GTE(8), Filter.LIKE("urgent%")]))
# Generated: {"FIELD:priority": {"OR": [{">=": 8}, {"LIKE": "urgent%"}]}}
```

**NOT Operator (Logical Negation):**
```python
# Negate any condition
Filter.expr(status=Filter.NOT("deleted"))
# Generated: {"FIELD:status": {"NOT": {"==": "deleted"}}}
# LlamaIndex: MetadataFilters(filters=[...], condition="not")

Filter.expr(name=Filter.NOT(Filter.LIKE("%deprecated%")))
# Generated: {"FIELD:name": {"NOT": {"LIKE": "%deprecated%"}}}
```

**IN Operator (Membership Test):**
```python
# Alias for OR with simple values
Filter.expr(category=Filter.IN(["tutorial", "guide", "reference"]))
# Equivalent to: Filter.expr(category=Filter.OR([...]))
# Generated: {"FIELD:category": {"OR": [{"IN": ["tutorial", "guide", "reference"]}]}}
# LlamaIndex: MetadataFilters with multiple ExactMatchFilter combined with OR

# Lists automatically convert to OR/IN
Filter.expr(status=["active", "pending"])
# Generated: {"FIELD:status": {"OR": [{"IN": ["active", "pending"]}]}}
```

<br/>

### 2.5. Multiple Field Expressions

Combine filters on multiple fields (implicit AND):

```python
# Multiple fields create AND structure
Filter.expr(
    type="documentation",
    priority=Filter.GTE(5),
    status=Filter.OR(["active", "reviewing"]),
    name=Filter.LIKE("%Tutorial%")
)
# Generated: {
#   "AND": [
#     {"FIELD:type": {"==": "documentation"}},
#     {"FIELD:priority": {">=": 5}},
#     {"FIELD:status": {"OR": [{"IN": ["active", "reviewing"]}]}},
#     {"FIELD:name": {"LIKE": "%Tutorial%"}}
#   ]
# }
# LlamaIndex: MetadataFilters(filters=[...], condition="and")
```

<br/>

### 2.6. Complex Nested Expressions

Build arbitrarily complex filter trees:

```python
# Sophisticated multi-level filtering
Filter.expr(
    # Pattern matching
    name=Filter.LIKE("%agent%"),
    
    # Multiple status options
    status=Filter.OR(["active", "pending", "reviewing"]),
    
    # Score range with explicit AND
    score=Filter.AND([Filter.GTE(80), Filter.LTE(100)]),
    
    # Date range
    created_at=Filter.GTE(datetime.datetime(2024, 1, 1)),
    
    # Negation
    description=Filter.NOT(Filter.LIKE("%deprecated%"))
)
# All conditions combined with AND logic
# LlamaIndex: Complex nested MetadataFilters structure
```

<br/>

### 2.7. Key Differences from Facet Operators

While `Filter` and `Facet` have very similar APIs, there are important differences:

| Feature | Facet (FacetKLEngine) | Filter (VectorKLEngine) |
|---------|----------------------|-------------------------|
| Target System | SQL databases (SQLAlchemy) | Vector databases (LlamaIndex) |
| Output Format | SQLAlchemy `ClauseElement` | LlamaIndex `MetadataFilters` |
| NF Operator | Dimension table queries | Not supported* |
| Backend Support | PostgreSQL, MySQL, SQLite, DuckDB | LanceDB, ChromaDB, Milvus, etc. |
| Primary Use | Structured filtering | Metadata filtering + vector similarity |

**Note:** The NF operator is not supported in `Filter` because vector databases don't have the same dimension table concept as relational databases. Complex nested metadata should be flattened into top-level fields for vector storage.

<br/>

## 3. Quick Start

### 3.1. Basic Usage with In-Place Mode

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# Create embedder
embedder = LLM(preset="embedder")  # Uses default embedding model

# Create vector storage
store = VectorKLStore(
    provider="lancedb",
    uri="./knowledge_vectors",
    collection="documents",
    encoder=lambda kl: kl.content,  # Extract text for embedding
    embedder=embedder
)

# Populate with knowledge objects
kls = [
    BaseUKF(
        name="Python Tutorial", 
        type="tutorial", 
        priority=5,
        content="Learn Python programming from basics to advanced concepts",
        tags={"programming", "python", "beginner"}
    ),
    BaseUKF(
        name="Machine Learning Guide",
        type="guide",
        priority=8,
        content="Introduction to machine learning algorithms and neural networks",
        tags={"ai", "machine-learning", "tutorial"}
    ),
    BaseUKF(
        name="SQL Database Design",
        type="tutorial",
        priority=7,
        content="Database design principles and SQL query optimization",
        tags={"database", "sql", "advanced"}
    ),
]
store.batch_upsert(kls)
store.flush()

# Create VectorKLEngine in in-place mode (directly queries store)
engine = VectorKLEngine(storage=store, inplace=True)

# Semantic search without filters
results = engine.search(
    query="How do I learn programming?",
    topk=2,
    include=["id", "kl", "score"]
)
print(f"Found {len(results)} results")
for result in results:
    print(f"- {result['kl'].name} (score: {result['score']:.3f})")

# Semantic search WITH metadata filters
results = engine.search(
    mode="vector",
    query="neural network architectures",
    topk=5,
    include=["id", "kl", "score"],
    type="guide",  # Only guides
    priority=Filter.GTE(7)  # High priority only
)
for result in results:
    kl = result['kl']
    print(f"- {kl.name} (priority: {kl.priority}, score: {result['score']:.3f})")
```

<br/>

### 3.2. Initialization Parameters

**Required Parameters:**
- **`storage`** (`VectorKLStore`): The vector-backed KLStore to query. Must be a VectorKLStore instance.

**Mode Parameters:**
- **`inplace`** (`bool`, default: `True`): Operating mode
  - `True`: Query directly on storage vector database (zero overhead, no copying)
  - `False`: Create separate index collection with schema subsetting

**Schema Parameters (for `inplace=False` only):**
- **`include`** (`List[str]`, optional): List of BaseUKF field names to include in index. If None, includes all fields.
- **`exclude`** (`List[str]`, optional): List of BaseUKF field names to exclude from index. Applied after `include`.

**Filter Parameters:**
- **`filters`** (`Dict[str, Any]`, optional): Global filters applied to all searches. Uses same format as search filters.

**Common Parameters:**
- **`name`** (`str`, optional): Engine instance name. Defaults to `"{storage.name}_vec_idx"`.
- **`condition`** (`Callable`, optional): Filter function for conditional indexing. Only UKFs satisfying the condition are indexed.

**Vector Database Parameters (for `inplace=False` only):**
- **`provider`** (`str`, optional): Vector database provider ("lancedb", "chroma", "chromalite", "milvuslite"). Uses config default if omitted.
- **`collection`** (`str`, optional): Collection/table name in vector database. Defaults to engine name.
- **`encoder`** (`Callable` or `Tuple[Callable, Callable]`, optional): Text extraction function(s). Can be single function or (key_encoder, query_encoder) tuple.
- **`embedder`** (`Callable` or `LLM`, optional): Embedding function or LLM instance to generate vectors.
- Additional kwargs: Connection parameters specific to the vector database provider (uri, path, mode, etc.)

<br/>

## 4. Operating Modes

VectorKLEngine supports two distinct operating modes with different performance characteristics:

### 4.1. In-Place Mode (`inplace=True`)

**How It Works:**
- Engine directly queries the attached VectorKLStore without creating any additional structures
- All operations (search, get) are routed to the storage backend
- Zero setup time, zero storage overhead
- Modifications to storage are immediately visible in search results

**Characteristics:**
- **Setup Time**: Instant (no indexing required)
- **Storage Overhead**: None (uses existing store)
- **Query Performance**: Depends on storage vector index
- **Synchronization**: Always up-to-date (no sync needed)
- **Schema**: All metadata fields from storage are queryable

**When to Use:**
- Development and prototyping (fastest setup)
- Small to medium datasets (< 100K objects)
- Dynamic data (frequent inserts/updates)
- When storage has appropriate vector indexes
- When all metadata fields are needed for filtering

**Example:**
```python
store = VectorKLStore(provider="lancedb", uri="./vectors", embedder=embedder)
engine = VectorKLEngine(storage=store, inplace=True)

# Immediately ready to query (no indexing phase)
results = engine.search(query="machine learning", topk=5)
```

**Note:** In in-place mode, `upsert()`, `insert()`, `remove()`, `clear()` operations are no-ops since the engine doesn't maintain separate state.

<br/>

### 4.2. Non-In-Place Mode (`inplace=False`)

**How It Works:**
- Engine creates a separate index collection with schema subsetting
- Only specified metadata fields (`include` parameter) are copied to index
- Requires explicit synchronization with storage when data changes
- Optimized queries on subset of metadata fields

**Characteristics:**
- **Setup Time**: Requires initial sync (copies data and embeddings to index)
- **Storage Overhead**: Duplicate data (index collection)
- **Query Performance**: Faster on subset schemas (fewer fields = better indexes)
- **Synchronization**: Manual `sync()` required after storage changes
- **Schema**: Only included metadata fields are queryable

**When to Use:**
- Large datasets (> 100K objects) where schema subsetting improves performance
- Static or slowly changing data (infrequent updates)
- When only a subset of metadata is needed for filtering
- To reduce index size and improve query speed
- Different embedding models for search vs storage

**Example:**
```python
store = VectorKLStore(provider="lancedb", uri="./vectors", embedder=embedder)

# Create separate index with subset of metadata
engine = VectorKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority"],  # Only these metadata fields
    provider="chromalite",  # Can use different backend
    collection="search_index"
)

# Initial synchronization (copies data and generates embeddings)
engine.sync()

# Query on subset schema
results = engine.search(query="transformers", topk=5, priority=Filter.GTE(7))

# After storage changes, resync
store.upsert(new_kl)
engine.sync()  # Update index
```

<br/>

### 4.3. Mode Comparison

| Feature | In-Place Mode | Non-In-Place Mode |
|---------|--------------|-------------------|
| Setup Time | Instant | Requires sync |
| Storage Overhead | None | Duplicate vectors & metadata |
| Query Speed | Depends on storage | Optimized for subset |
| Synchronization | Automatic | Manual sync required |
| Schema Flexibility | All metadata fields | Subset only |
| Backend Choice | Same as storage | Can differ from storage |
| Best For | Development, dynamic data | Production, static data |

<br/>

## 5. Search Operations

### 5.1. Vector Similarity Search (Default)

The primary search method using semantic similarity with optional metadata filtering:

```python
results = engine.search(
    query="transformer architectures for NLP",  # Natural language query
    topk=10,                                    # Number of results to return
    include=["id", "kl", "score"],             # Fields to include in results
    # Optional metadata filters (same syntax as Filter.expr)
    type="research_paper",
    priority=Filter.GTE(7),
    status=Filter.OR(["published", "peer_reviewed"])
)
```

**Search Parameters:**
- **`query`** (`str`, required): Natural language query text to search for. Will be encoded and embedded.
- **`topk`** (`int`, default: `10`): Number of top results to return, ranked by similarity score.
- **`include`** (`Iterable[str]`, optional): Fields to include in results
  - `"id"`: Knowledge object ID (int)
  - `"kl"`: Full BaseUKF object (retrieved if recoverable)
  - `"score"`: Similarity score (float, higher = more similar)
  - `"filter"`: The applied metadata filters (for debugging)
  - `"query"`: The VectorStoreQuery object (for debugging)
  - Default: `["id", "kl", "score"]`
- **`**kwargs`**: Metadata filter conditions using Filter operators or simple values

**Return Value:**
```python
List[Dict[str, Any]]  # Each dict contains requested fields from `include`
```

<br/>

### 5.2. Result Structures

**Minimal Results (IDs and scores):**
```python
results = engine.search(query="deep learning", topk=5, include=["id", "score"])
# [
#   {"id": 123, "score": 0.89},
#   {"id": 456, "score": 0.85},
#   {"id": 789, "score": 0.82}
# ]
```

**Full Results (with knowledge objects):**
```python
results = engine.search(query="neural networks", topk=5, include=["id", "kl", "score"])
# [
#   {"id": 123, "kl": <BaseUKF object>, "score": 0.89},
#   {"id": 456, "kl": <BaseUKF object>, "score": 0.85}
# ]
```

**Debug Results (with filter and query objects):**
```python
results = engine.search(
    query="transformers", 
    topk=5, 
    include=["id", "score", "filter", "query"],
    type="paper"
)
# [
#   {
#     "id": 123, 
#     "score": 0.89,
#     "filter": <MetadataFilters object>,
#     "query": <VectorStoreQuery object>
#   },
#   ...
# ]
```

<br/>

### 5.3. Hybrid Search: Semantic + Metadata Filtering

Combine vector similarity with structured metadata constraints:

```python
# Find semantically similar papers with specific metadata
results = engine.search(
    mode="vector",
    query="attention mechanisms in transformers",
    topk=10,
    include=["id", "kl", "score"],
    # Metadata filters
    type="research_paper",
    year=Filter.GTE(2020),  # Recent papers only
    venue=Filter.OR(["NeurIPS", "ICLR", "ICML"]),  # Top conferences
    citations=Filter.GTE(100)  # Highly cited
)

for result in results:
    kl = result["kl"]
    print(f"{kl.name} ({kl.year}) - Score: {result['score']:.3f}, Citations: {kl.citations}")
```

<br/>

### 5.4. Global Filters

Apply persistent filters across all searches:

```python
# Create engine with global filters
engine = VectorKLEngine(
    storage=store,
    inplace=True,
    filters={
        "type": "tutorial",                          # Only index tutorials
        "status": "published",                       # Only published content
        "language": Filter.OR(["en", "zh"])         # English or Chinese only
    }
)

# All searches automatically include global filters
results = engine.search(
    query="python programming basics",
    topk=5,
    priority=Filter.GTE(7)  # Additional filter on top of global filters
)
# Results will be: tutorials AND published AND (en OR zh) AND priority >= 7
```

<br/>

### 5.5. Similarity Score Thresholding

Filter results by minimum similarity score:

```python
# Get all results
results = engine.search(query="machine learning", topk=20, include=["id", "kl", "score"])

# Filter by score threshold
high_quality = [r for r in results if r["score"] >= 0.8]
medium_quality = [r for r in results if 0.6 <= r["score"] < 0.8]
low_quality = [r for r in results if r["score"] < 0.6]

print(f"High quality matches: {len(high_quality)}")
print(f"Medium quality matches: {len(medium_quality)}")
print(f"Low quality matches: {len(low_quality)}")
```

<br/>

## 6. Complete Examples

### 6.1. Research Paper Semantic Search

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF
import datetime

# Setup storage and engine
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./research_papers",
    collection="papers",
    encoder=lambda kl: f"{kl.name}. {kl.content}",
    embedder=embedder
)

engine = VectorKLEngine(storage=store, inplace=True)

# Create research papers
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        content="We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
        year=2017,
        venue="NeurIPS",
        citations=50000,
        authors=["Vaswani et al."]
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        content="We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers.",
        year=2018,
        venue="NAACL",
        citations=30000,
        authors=["Devlin et al."]
    ),
    BaseUKF(
        name="ResNet: Deep Residual Learning for Image Recognition",
        type="research_paper",
        content="We present a residual learning framework to ease the training of very deep networks.",
        year=2015,
        venue="CVPR",
        citations=40000,
        authors=["He et al."]
    ),
]
store.batch_upsert(papers)
store.flush()

# Query 1: Semantic search for transformer-related papers
results = engine.search(
    query="transformer architectures for natural language processing",
    topk=5,
    include=["id", "kl", "score"]
)
print("=== Transformer Papers ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} (score: {result['score']:.3f})")

# Query 2: Recent high-impact papers
results = engine.search(
    query="deep learning breakthroughs",
    topk=5,
    include=["id", "kl", "score"],
    year=Filter.GTE(2017),
    citations=Filter.GTE(20000)
)
print("\n=== Recent High-Impact Papers ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} ({kl.year}): {kl.citations} citations")

# Query 3: Papers from specific venues
results = engine.search(
    query="attention mechanisms neural networks",
    topk=3,
    include=["id", "kl", "score"],
    venue=Filter.OR(["NeurIPS", "ICLR", "NAACL"])
)
print("\n=== Papers from Top Venues ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} at {kl.venue}")
```

<br/>

### 6.2. Documentation Search with Metadata Filtering

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# Setup
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="chromalite",
    collection="docs",
    encoder=lambda kl: kl.content,
    embedder=embedder
)
engine = VectorKLEngine(storage=store, inplace=True)

# Create documentation
docs = [
    BaseUKF(
        name="Python Lists Tutorial",
        type="tutorial",
        difficulty="beginner",
        language="python",
        content="Learn how to use lists in Python: creating, indexing, slicing, and common operations.",
        tags={"data-structures", "basics"}
    ),
    BaseUKF(
        name="Advanced Dictionary Techniques",
        type="guide",
        difficulty="advanced",
        language="python",
        content="Deep dive into Python dictionaries: comprehensions, defaultdict, OrderedDict, and performance optimization.",
        tags={"data-structures", "optimization"}
    ),
    BaseUKF(
        name="JavaScript Promises",
        type="tutorial",
        difficulty="intermediate",
        language="javascript",
        content="Understanding asynchronous programming with Promises: then, catch, async/await patterns.",
        tags={"async", "modern-js"}
    ),
    BaseUKF(
        name="Python Async/Await Guide",
        type="guide",
        difficulty="advanced",
        language="python",
        content="Master asynchronous programming in Python using asyncio, async/await syntax, and coroutines.",
        tags={"async", "concurrency"}
    ),
]
store.batch_upsert(docs)
store.flush()

# Query 1: Beginner-friendly Python tutorials
results = engine.search(
    query="how to get started with Python programming",
    topk=3,
    include=["id", "kl", "score"],
    language="python",
    difficulty="beginner"
)
print("=== Beginner Python Tutorials ===")
for result in results:
    print(f"- {result['kl'].name} (score: {result['score']:.3f})")

# Query 2: Asynchronous programming in any language
results = engine.search(
    query="asynchronous programming patterns",
    topk=5,
    include=["id", "kl", "score"]
)
print("\n=== Async Programming Resources ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name} ({kl.language}, {kl.difficulty})")

# Query 3: Advanced Python content only
results = engine.search(
    query="data structures and algorithms",
    topk=3,
    include=["id", "kl", "score"],
    language="python",
    difficulty=Filter.OR(["intermediate", "advanced"])
)
print("\n=== Advanced Python Content ===")
for result in results:
    print(f"- {result['kl'].name}")
```

<br/>

### 6.3. E-commerce Product Recommendations

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# Setup
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./products",
    collection="catalog",
    encoder=lambda kl: f"{kl.name}. {kl.content}",
    embedder=embedder
)
engine = VectorKLEngine(storage=store, inplace=True)

# Create products
products = [
    BaseUKF(
        name="Laptop Pro 15",
        type="electronics",
        category="laptop",
        brand="TechCorp",
        price=1299.99,
        rating=4.5,
        in_stock=True,
        content="High-performance laptop with 15-inch display, 16GB RAM, 512GB SSD, perfect for programming and content creation"
    ),
    BaseUKF(
        name="Wireless Mechanical Keyboard",
        type="electronics",
        category="accessory",
        brand="KeyMaster",
        price=129.99,
        rating=4.7,
        in_stock=True,
        content="Premium wireless mechanical keyboard with RGB lighting, perfect for programmers and gamers"
    ),
    BaseUKF(
        name="USB-C Hub 7-in-1",
        type="electronics",
        category="accessory",
        brand="ConnectAll",
        price=49.99,
        rating=4.3,
        in_stock=True,
        content="Versatile USB-C hub with HDMI, USB 3.0, SD card reader, and ethernet port for laptops"
    ),
    BaseUKF(
        name="Ergonomic Office Chair",
        type="furniture",
        category="chair",
        brand="ComfortSeating",
        price=399.99,
        rating=4.6,
        in_stock=False,
        content="Premium ergonomic chair with lumbar support, adjustable armrests, ideal for long programming sessions"
    ),
]
store.batch_upsert(products)
store.flush()

# Query 1: Find products for a programmer's setup
results = engine.search(
    query="best equipment for software developers",
    topk=5,
    include=["id", "kl", "score"],
    in_stock=True  # Only in-stock items
)
print("=== Developer Setup Recommendations ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: ${kl.price} (rating: {kl.rating}, score: {result['score']:.3f})")

# Query 2: Budget-friendly accessories
results = engine.search(
    query="affordable laptop accessories",
    topk=3,
    include=["id", "kl", "score"],
    category="accessory",
    price=Filter.LTE(150.00),
    rating=Filter.GTE(4.0)
)
print("\n=== Budget Accessories ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: ${kl.price}")

# Query 3: Premium electronics
results = engine.search(
    query="high quality professional equipment",
    topk=3,
    include=["id", "kl", "score"],
    type="electronics",
    price=Filter.GTE(1000.00),
    in_stock=True
)
print("\n=== Premium Electronics ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name} by {kl.brand}: ${kl.price}")
```

<br/>

### 6.4. Non-In-Place Mode with Different Backends

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM

# Storage with LanceDB
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./primary_store",
    collection="documents",
    encoder=lambda kl: kl.content,
    embedder=embedder
)

# Populate storage
# ... (add documents to store)

# Create search index with ChromaDB (different backend)
engine = VectorKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # Subset of metadata
    provider="chromalite",  # Different from storage provider
    collection="search_index",
    encoder=lambda kl: kl.content,  # Can use different encoding
    embedder=embedder  # Can use different embedding model
)

# Initial sync
print("Building search index...")
engine.sync()
print(f"Indexed {len(engine)} documents")

# Fast hybrid search on optimized index
results = engine.search(
    query="machine learning fundamentals",
    topk=10,
    include=["id", "score"],  # Minimal includes for speed
    type="tutorial",
    priority=Filter.GTE(7)
)
print(f"Found {len(results)} matching documents")

# Close resources
engine.close()
store.close()
```

<br/>

## Further Exploration

> **Tip:** For the base interface and common operations, see:
> - [BaseKLEngine](./base.md) - Abstract base class defining the KLEngine interface and shared functionality
> - [KLEngine Overview](./index.md) - Introduction to query engines and retrieval strategies

> **Tip:** For other search methodologies, see:
> - [FacetKLEngine](./facet.md) - Structured filtering and faceted search using SQL predicates
> - [DAACKLEngine](./daac.md) - Multi-pattern string matching for entity recognition

> **Tip:** For vector database integration, see:
> - [VectorKLStore](../klstore/vector.md) - Vector database storage for knowledge objects with embeddings
> - [Vector Database Utilities](../utils/vdb.md) - LlamaIndex-based vector database wrapper with encoder/embedder pipeline
> - [Vector Database Configuration](../../configuration/vdb.md) - YAML configuration for vector database providers

> **Tip:** For embedding and encoding, see:
> - [LLM](../llm.md) - Language models for embedding generation

<br/>
