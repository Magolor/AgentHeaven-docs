# FacetKLEngine

FacetKLEngine is a database-backed [BaseKLEngine](./base.md) implementation that enables structured filtering and faceted search over knowledge objects using SQL predicates. It leverages relational database capabilities to provide efficient, flexible querying through `Facet` operators—a powerful abstraction for building complex filter conditions.

## 1. Introduction

### 1.1. What is Faceted Search?

**Faceted search** is a query technique that allows users to filter datasets along multiple independent dimensions (facets). Each facet represents a categorical or continuous attribute that can be filtered, combined, and refined to narrow down search results.

**FacetKLEngine** brings this approach to knowledge retrieval by:
- **Input**: Filter conditions expressed as `Facet` operators (equality, comparisons, patterns, logical combinations)
- **Indexed Data**: Knowledge objects stored in relational database tables (via [DatabaseKLStore](../klstore/database.md))
- **Output**: Knowledge objects matching all specified filter criteria
- **Performance**: Leverages database indexes and query optimization for fast filtering

Unlike semantic search (vector similarity) or pattern matching (DAAC), faceted search excels at **precise, structured filtering** based on known attributes and relationships.

<br/>

### 1.2. When to Use FacetKLEngine

**Ideal Use Cases:**
- **Structured Data Filtering**: Query knowledge objects by type, category, status, timestamps, priority, or custom metadata fields
- **Multi-Criteria Search**: Combine multiple filter conditions (AND/OR/NOT logic) to refine results
- **Range Queries**: Filter numeric or datetime fields within specific ranges
- **Pattern Matching**: Use SQL LIKE/ILIKE for text pattern matching
- **Dimensional Filtering**: Query across dimension tables (e.g., tags, metadata stored in separate tables with foreign keys)
- **Database-Native Operations**: Leverage existing database infrastructure, indexes, and query optimization

**Not Suitable For:**
- **Semantic Search**: Use [VectorKLEngine](./vector.md) for meaning-based similarity queries
- **Entity Recognition**: Use [DAACKLEngine](./daac.md) for finding known entity strings in text
- **Full-Text Search**: Use dedicated full-text search engines for document content matching
- **Fuzzy Matching**: FacetKLEngine performs exact matching (after SQL pattern operators)

<br/>

### 1.3. Key Features

- **Rich Filter Operators**: Comprehensive set of operators including comparison (LT, LTE, GT, GTE), pattern matching (LIKE, ILIKE), logical operators (AND, OR, NOT), range queries (BETWEEN), and list membership (IN)
- **Dimension Table Support**: Query across dimension tables using the NF (Normalized Form) operator for complex relationships
- **Two Operating Modes**: 
  - **In-Place Mode** (`inplace=True`): Directly query the attached DatabaseKLStore with zero overhead
  - **Non-In-Place Mode** (`inplace=False`): Create an optimized copy with schema subsetting for faster queries
- **Global Facets**: Apply persistent filter conditions across all searches
- **SQL Integration**: Direct access to generated SQL for debugging and optimization
- **Type Safety**: Automatic validation of filter fields against database schema
- **Database Agnostic**: Works with PostgreSQL, MySQL, SQLite, DuckDB through SQLAlchemy

<br/>

## 2. Understanding Facet Operators

The `Facet` class provides a fluent API for building filter expressions that translate to SQL WHERE clauses. All operators are composable and can be nested arbitrarily.

### 2.1. Comparison Operators

These operators compare field values against constants:

**Equality and Inequality:**
```python
from ahvn.utils.db.facet import Facet

# Exact match (field == value)
Facet.expr(type="documentation")
# Generated: {"FIELD:type": {"==": "documentation"}}

# Not equal (field != value) - use NOT wrapper
Facet.expr(status=Facet.NOT("deleted"))
# Generated: {"FIELD:status": {"NOT": {"==": "deleted"}}}
```

**Numeric Comparisons:**
```python
# Less than
Facet.expr(priority=Facet.LT(5))
# Generated: {"FIELD:priority": {"<": 5}}

# Less than or equal
Facet.expr(priority=Facet.LTE(10))
# Generated: {"FIELD:priority": {"<=": 10}}

# Greater than
Facet.expr(score=Facet.GT(80))
# Generated: {"FIELD:score": {">": 80}}

# Greater than or equal
Facet.expr(score=Facet.GTE(90))
# Generated: {"FIELD:score": {">=": 90}}
```

**DateTime Comparisons:**
```python
import datetime

# Filter by date range
Facet.expr(created_at=Facet.GTE(datetime.datetime(2024, 1, 1)))
# Generated: {"FIELD:created_at": {">=": datetime.datetime(2024, 1, 1)}}

Facet.expr(updated_at=Facet.LTE(datetime.datetime(2024, 12, 31)))
# Generated: {"FIELD:updated_at": {"<=": datetime.datetime(2024, 12, 31)}}
```

<br/>

### 2.2. Pattern Matching Operators

SQL LIKE operators for text pattern matching:

**Case-Sensitive Pattern Matching (LIKE):**
```python
# Wildcard matching
Facet.expr(name=Facet.LIKE("%Python%"))  # Contains "Python"
# Generated: {"FIELD:name": {"LIKE": "%Python%"}}

Facet.expr(name=Facet.LIKE("Python%"))   # Starts with "Python"
Facet.expr(name=Facet.LIKE("%Tutorial"))  # Ends with "Tutorial"
```

**Case-Insensitive Pattern Matching (ILIKE):**
```python
# Case-insensitive search
Facet.expr(description=Facet.ILIKE("%python%"))  # Matches "Python", "PYTHON", "python"
# Generated: {"FIELD:description": {"ILIKE": "%python%"}}
```

<br/>

### 2.3. Range Operators

Filter values within numeric or datetime ranges:

**BETWEEN Operator:**
```python
# Inclusive range [min, max]
Facet.expr(score=Facet.BETWEEN(0, 100))
# Generated: {"FIELD:score": {"AND": [{">=": 0}, {"<=": 100}]}}

# Open-ended ranges with None
Facet.expr(price=Facet.BETWEEN(100, None))  # >= 100 (no upper limit)
# Generated: {"FIELD:price": {"AND": [{">=": 100}, {"<=": inf}]}}

Facet.expr(age=Facet.BETWEEN(None, 65))     # <= 65 (no lower limit)
# Generated: {"FIELD:age": {"AND": [{">=": -inf}, {"<=": 65}]}}
```

**Tuple Shorthand:**
```python
# Tuples automatically convert to BETWEEN
Facet.expr(priority=(1, 10))
# Equivalent to: Facet.expr(priority=Facet.BETWEEN(1, 10))
# Generated: {"FIELD:priority": {"AND": [{">=": 1}, {"<=": 10}]}}
```

<br/>

### 2.4. Logical Operators

Combine multiple conditions with boolean logic:

**AND Operator (Logical Conjunction):**
```python
# All conditions must be true
Facet.expr(score=Facet.AND([Facet.GTE(80), Facet.LTE(100)]))
# Generated: {"FIELD:score": {"AND": [{">=": 80}, {"<=": 100}]}}
# SQL: score >= 80 AND score <= 100
```

**OR Operator (Logical Disjunction):**
```python
# At least one condition must be true
Facet.expr(status=Facet.OR(["active", "pending", "reviewing"]))
# Generated: {"FIELD:status": {"OR": [{"IN": ["active", "pending", "reviewing"]}]}}
# SQL: status IN ('active', 'pending', 'reviewing')

# Mix operators in OR
Facet.expr(priority=Facet.OR([Facet.GTE(8), Facet.LIKE("urgent%")]))
# Generated: {"FIELD:priority": {"OR": [{">=": 8}, {"LIKE": "urgent%"}]}}
# SQL: priority >= 8 OR priority LIKE 'urgent%'
```

**NOT Operator (Logical Negation):**
```python
# Negate any condition
Facet.expr(status=Facet.NOT("archived"))
# Generated: {"FIELD:status": {"NOT": {"==": "archived"}}}
# SQL: status != 'archived'

Facet.expr(name=Facet.NOT(Facet.LIKE("%deprecated%")))
# Generated: {"FIELD:name": {"NOT": {"LIKE": "%deprecated%"}}}
# SQL: name NOT LIKE '%deprecated%'
```

**IN Operator (Membership Test):**
```python
# Alias for OR with simple values
Facet.expr(category=Facet.IN(["tutorial", "guide", "reference"]))
# Equivalent to: Facet.expr(category=Facet.OR([...]))
# Generated: {"FIELD:category": {"OR": [{"IN": ["tutorial", "guide", "reference"]}]}}

# Lists automatically convert to OR/IN
Facet.expr(status=["active", "pending"])
# Generated: {"FIELD:status": {"OR": [{"IN": ["active", "pending"]}]}}
```

<br/>

### 2.5. Dimension Table Operator (NF)

The **NF (Normalized Form)** operator queries across dimension tables—separate tables linked by foreign keys that store complex UKF fields like tags, metadata, or arrays.

**Understanding Dimension Tables:**

When a `BaseUKF` has fields of type `DatabaseNfType` (e.g., `tags`, `metadata`, `content_resources`), DatabaseKLStore stores them in separate dimension tables:
- **Main Table**: `ukf_main` (id, name, type, version, timestamp, etc.)
- **Dimension Tables**: `ukf_tags`, `ukf_metadata`, etc. (ukf_id, slot, value)

**NF Operator Syntax:**
```python
# Query dimension table by slot and value
Facet.expr(tags=Facet.NF(slot="category", value="tutorial"))
# Generated: {"FIELD:tags": {"NF": {"slot": "category", "value": "tutorial"}}}
# SQL: EXISTS (SELECT DISTINCT ukf_tags.id FROM ukf_tags 
#             WHERE ukf_main.id = ukf_tags.ukf_id 
#             AND ukf_tags.slot = 'category' AND ukf_tags.value = 'tutorial')

# Query with operator
Facet.expr(metadata=Facet.NF(slot="category", value="math", operator="ANY_IF_EXISTS"))
# A slot can have multiple values; matches if any value satisfies the condition if only at least one value exists for the slot
# Supported operators:
# - EXACT
# - NONE_OF
# - ANY_OF
# - ANY_IF_EXISTS
# - ONE_OF
# - MANY_OF
# - ALL_OF
# - ALL_IN
# - HAS_NONE (Unary, check the slot only)
# - HAS_ANY (Unary, check the slot only)
# - HAS_ONE (Unary, check the slot only)
# - HAS_MANY (Unary, check the slot only)
```

**Multiple Dimension Filters:**
```python
# Multiple slot-value pairs in same dimension (AND logic)
Facet.expr(tags=Facet.NF(slot="category", value="tutorial"), language="python")
# Both conditions must exist in the tags dimension table
```

**Real-World Example:**
```python
# Find knowledge objects with specific tags
engine.search(
    mode="facet",
    include=["id", "kl"],
    tags=Facet.NF(slot="project", value="AgentHeaven"),
    metadata=Facet.NF(slot="status", value="published")
)
# Returns UKFs that have:
# - A tag entry with slot="project" and value="AgentHeaven"
# - A metadata entry with slot="status" and value="published"
```

<br/>

### 2.6. Multiple Field Expressions

Combine filters on multiple fields (implicit AND):

```python
# Multiple fields create AND structure
Facet.expr(
    type="documentation",
    priority=Facet.GTE(5),
    status=Facet.OR(["active", "reviewing"]),
    name=Facet.LIKE("%Tutorial%")
)
# Generated: {
#   "AND": [
#     {"FIELD:type": {"==": "documentation"}},
#     {"FIELD:priority": {">=": 5}},
#     {"FIELD:status": {"OR": [{"IN": ["active", "reviewing"]}]}},
#     {"FIELD:name": {"LIKE": "%Tutorial%"}}
#   ]
# }
# SQL: type = 'documentation' 
#      AND priority >= 5 
#      AND status IN ('active', 'reviewing')
#      AND name LIKE '%Tutorial%'
```

<br/>

### 2.7. Complex Nested Expressions

Build arbitrarily complex filter trees:

```python
# Sophisticated multi-level filtering
Facet.expr(
    # Pattern matching
    name=Facet.LIKE("%agent%"),
    
    # Multiple status options
    status=Facet.OR(["active", "pending", "reviewing"]),
    
    # Score range with explicit AND
    score=Facet.AND([Facet.GTE(80), Facet.LTE(100)]),
    
    # Date range
    created_at=Facet.GTE(datetime.datetime(2024, 1, 1)),
    
    # Dimension table filter
    tags=Facet.NF(slot="priority", value="high"),
    
    # Negation
    description=Facet.NOT(Facet.LIKE("%deprecated%"))
)
# All conditions combined with AND logic
```

<br/>

## 3. Quick Start

Notice that Facets in FacetKLEngine are only filtering the defined UKF attributes (e.g., name, type, tags, priority). Custom fields stored in unstructured formats (e.g., JSON blobs) are not directly queryable.

For all queries related to NF (Normalized Form) fields (i.e., `set` fields like `tags`, `related`, `auth` and `synonyms`), `Facet.NF` is required.


### 3.1. Basic Usage with In-Place Mode

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF

# Create database storage
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# Populate with knowledge objects
kls = [
    BaseUKF(name="Python Tutorial", type="tutorial", priority=5, 
            tags={"[category:programming]", "[language:python]"}),
    BaseUKF(name="SQL Guide", type="guide", priority=8,
            tags={"[category:database]", "[language:sql]"}),
    BaseUKF(name="Machine Learning Intro", type="tutorial", priority=7,
            tags={"[category:ai]", "[language:python]"}),
]
store.batch_upsert(kls)

# Create FacetKLEngine in in-place mode (directly queries store)
engine = FacetKLEngine(storage=store, inplace=True)

# Search by exact field match
results = engine.search(mode="facet", include=["id", "kl"], type="tutorial")
print(f"Found {len(results)} tutorials")

# Search with comparison operators
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(7))
for result in results:
    print(f"- {result['kl'].name} (priority: {result['kl'].priority})")

# Search with dimension table filter (NF operator)
results = engine.search(mode="facet", include=["id", "kl"],
                       tags=Facet.NF(slot="language", value="python"))
print(f"Found {len(results)} Python-related items")

# Combine multiple filters (AND logic)
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="tutorial",
    priority=Facet.GTE(5),
    tags=Facet.NF(slot="category", value="programming")
)
```

<br/>

### 3.2. Initialization Parameters

**Required Parameters:**
- **`storage`** (`DatabaseKLStore`): The database-backed KLStore to query. Must be a DatabaseKLStore instance.

**Mode Parameters:**
- **`inplace`** (`bool`, default: `True`): Operating mode
  - `True`: Query directly on storage database (zero overhead, no copying)
  - `False`: Create separate index database with schema subsetting

**Schema Parameters (for `inplace=False` only):**
- **`include`** (`List[str]`, optional): List of BaseUKF field names to include in index. If None, includes all fields.
- **`exclude`** (`List[str]`, optional): List of BaseUKF field names to exclude from index. Applied after `include`.

**Filter Parameters:**
- **`facets`** (`Dict[str, Any]`, optional): Global facets applied to all searches. Uses same format as search filters.

**Common Parameters:**
- **`name`** (`str`, optional): Engine instance name. Defaults to `"{storage.name}_facet_idx"`.
- **`condition`** (`Callable`, optional): Filter function for conditional indexing. Only UKFs satisfying the condition are indexed.

**Database Parameters (for `inplace=False` only):**
- **`database`** (`str`, optional): Index database name or path. Uses config default if omitted.
- **`provider`** (`str`, optional): Database provider ("sqlite", "pg", "mysql", "duckdb"). Uses config default if omitted.
- Additional kwargs: Connection parameters (host, port, username, password, etc.)

<br/>

## 4. Operating Modes

FacetKLEngine supports two distinct operating modes with different performance characteristics and use cases:

### 4.1. In-Place Mode (`inplace=True`)

**How It Works:**
- Engine directly queries the attached DatabaseKLStore without creating any additional structures
- All operations (search, get) are routed to the storage backend
- Zero setup time, zero storage overhead
- Modifications to storage are immediately visible in search results

**Characteristics:**
- **Setup Time**: Instant (no indexing required)
- **Storage Overhead**: None (uses existing store)
- **Query Performance**: Depends on storage database indexes
- **Synchronization**: Always up-to-date (no sync needed)
- **Schema**: All fields from storage are queryable

**When to Use:**
- Development and prototyping (fastest setup)
- Small to medium datasets (< 100K objects)
- Dynamic data (frequent inserts/updates)
- When storage database has appropriate indexes
- When all UKF fields are needed for filtering

**Example:**
```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# Immediately ready to query (no indexing phase)
results = engine.search(mode="facet", include=["id", "kl"], type="tutorial")
```

**Note:** In in-place mode, `upsert()`, `insert()`, `remove()`, `clear()` operations are no-ops (do nothing) since the engine doesn't maintain separate state.

<br/>

### 4.2. Non-In-Place Mode (`inplace=False`)

**How It Works:**
- Engine creates a separate index database with schema subsetting
- Only specified fields (`include` parameter) are copied to index
- Requires explicit synchronization with storage when data changes
- Optimized queries on subset of fields

**Characteristics:**
- **Setup Time**: Requires initial sync (copies data to index)
- **Storage Overhead**: Duplicate data (index database)
- **Query Performance**: Faster on subset schemas (fewer fields = better indexes)
- **Synchronization**: Manual `sync()` required after storage changes
- **Schema**: Only included fields are queryable

**When to Use:**
- Large datasets (> 100K objects) where schema subsetting improves performance
- Static or slowly changing data (infrequent updates)
- When only a subset of fields is needed for queries
- To reduce index size and improve query speed
- When storage database lacks optimal indexes

**Example:**
```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# Create separate index with subset of fields
engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # Only these fields
    database="knowledge_index.db"  # Separate database for index
)

# Initial synchronization (copies data)
engine.sync()

# Query on subset schema
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(5))

# After storage changes, resync
store.upsert(new_kl)
engine.sync()  # Update index
```

**Schema Subsetting Benefits:**
```python
# Full schema: 20+ fields (name, type, version, content, description, etc.)
# Index schema: 5 fields (id, name, type, priority, tags)
# Result: 4x smaller index, faster queries on indexed fields

engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # Minimal schema
    exclude=["content", "description"]  # Exclude large text fields
)
```

<br/>

## 5. Search Operations

### 5.1. Faceted Search (Default)

The primary search method using structured filters:

```python
results = engine.search(
    mode="facet",           # Or omit (default mode)
    include=["id", "kl"],   # Fields to include in results
    type="tutorial",        # Field filters
    priority=Facet.GTE(5),
    tags=Facet.NF(slot="category", value="programming"),
    topk=10,                # Limit results (SQL LIMIT)
    offset=0                # Skip results (SQL OFFSET)
)
```

**Search Parameters:**
- **`include`** (`Iterable[str]`, optional): Fields to include in results
  - `"id"`: Knowledge object ID (int)
  - `"kl"`: Full BaseUKF object (retrieved from storage if recoverable)
  - `"filter"`: The parsed Facet filter (for debugging)
  - `"sql"`: Generated SQL statement (for debugging and optimization)
  - Default: `["id", "kl"]`

- **`topk`** (`int`, optional): Maximum number of results to return (SQL LIMIT). If None, returns all matching results.

- **`offset`** (`int`, optional): Number of results to skip (SQL OFFSET). If None, starts from first result.

- **`**kwargs`**: Filter conditions using Facet operators or simple values

**Return Value:**
```python
List[Dict[str, Any]]  # Each dict contains requested fields from `include`
```

<br/>

### 5.2. Result Structures

**Minimal Results (IDs only):**
```python
results = engine.search(mode="facet", include=["id"], type="tutorial")
# [
#   {"id": 123},
#   {"id": 456},
#   {"id": 789}
# ]
```

**Full Results (with knowledge objects):**
```python
results = engine.search(mode="facet", include=["id", "kl"], priority=Facet.GTE(5))
# [
#   {"id": 123, "kl": <BaseUKF object>},
#   {"id": 456, "kl": <BaseUKF object>}
# ]
```

**Debug Results (with SQL):**
```python
results = engine.search(mode="facet", include=["id", "sql"], type="tutorial")
# [
#   {"id": 123, "sql": "SELECT ukf_main.id FROM ukf_main WHERE ukf_main.type = 'tutorial'"},
#   ...
# ]
```

<br/>

### 5.3. Global Facets

Apply persistent filters across all searches:

```python
# Create engine with global facets
engine = FacetKLEngine(
    storage=store,
    inplace=True,
    facets={
        "type": "tutorial",                              # Only index tutorials
        "tags": Facet.NF(slot="status", value="published")  # Only published
    }
)

# All searches automatically include global facets
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(7))
# SQL: WHERE type = 'tutorial' 
#      AND EXISTS (tags with status=published)
#      AND priority >= 7
```

<br/>

### 5.4. Pagination

Use `topk` and `offset` for paginated results:

```python
# Page 1: First 10 results
page1 = engine.search(mode="facet", include=["id", "kl"], 
                     type="tutorial", topk=10, offset=0)

# Page 2: Next 10 results
page2 = engine.search(mode="facet", include=["id", "kl"],
                     type="tutorial", topk=10, offset=10)

# Page 3: Next 10 results
page3 = engine.search(mode="facet", include=["id", "kl"],
                     type="tutorial", topk=10, offset=20)
```

<br/>

### 5.5. SQL Debugging

Inspect generated SQL for optimization:

```python
results = engine.search(
    mode="facet",
    include=["id", "sql"],
    type="tutorial",
    priority=Facet.BETWEEN(5, 10),
    tags=Facet.NF(slot="category", value="programming")
)

# Print SQL statement
print(results[0]["sql"])
# Output: 
# SELECT ukf_main.id FROM ukf_main 
# WHERE ukf_main.type = 'tutorial' 
# AND ukf_main.priority >= 5 
# AND ukf_main.priority <= 10
# AND EXISTS (SELECT DISTINCT ukf_tags.id FROM ukf_tags 
#             WHERE ukf_main.id = ukf_tags.ukf_id 
#             AND ukf_tags.slot = 'category' 
#             AND ukf_tags.value = 'programming')
```

<br/>

## 6. Complete Examples

### 6.1. Research Paper Filtering

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF
import datetime

# Setup storage and engine
store = DatabaseKLStore(database="papers.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# Create research papers
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        priority=10,
        timestamp=datetime.datetime(2017, 6, 12),
        tags={"[field:nlp]", "[venue:nips]", "[topic:transformers]"},
        metadata={"citations": 50000, "authors": 8}
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        priority=9,
        timestamp=datetime.datetime(2018, 10, 11),
        tags={"[field:nlp]", "[venue:naacl]", "[topic:language_models]"},
        metadata={"citations": 30000, "authors": 4}
    ),
    BaseUKF(
        name="ResNet: Deep Residual Learning",
        type="research_paper",
        priority=9,
        timestamp=datetime.datetime(2015, 12, 10),
        tags={"[field:cv]", "[venue:cvpr]", "[topic:architectures]"},
        metadata={"citations": 40000, "authors": 5}
    ),
]
store.batch_upsert(papers)

# Query 1: High-impact recent NLP papers
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    priority=Facet.GTE(9),
    timestamp=Facet.GTE(datetime.datetime(2017, 1, 1)),
    tags=Facet.NF(slot="field", value="nlp")
)
print(f"High-impact NLP papers: {len(results)}")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} ({kl.timestamp.year})")

# Query 2: Papers with citation count in range
# Note: metadata filters require using dimension tables
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    tags=Facet.AND([
        Facet.NF(slot="field", value="nlp"),
        Facet.NF(slot="venue", value=Facet.OR(["nips", "naacl", "acl"]))
    ])
)

# Query 3: Papers NOT about computer vision
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    tags=Facet.NOT(Facet.NF(slot="field", value="cv"))
)
print(f"Non-CV papers: {len(results)}")
```

<br/>

### 6.2. E-commerce Product Filtering

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF

# Setup
store = DatabaseKLStore(database="products.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# Create products
products = [
    BaseUKF(
        name="Laptop Pro 15",
        type="electronics",
        priority=8,
        tags={"[category:laptop]", "[brand:TechCorp]", "[condition:new]"},
        metadata={"price": 1299.99, "stock": 45, "rating": 4.5}
    ),
    BaseUKF(
        name="Wireless Mouse",
        type="electronics",
        priority=5,
        tags={"[category:accessory]", "[brand:TechCorp]", "[condition:new]"},
        metadata={"price": 29.99, "stock": 200, "rating": 4.2}
    ),
    BaseUKF(
        name="Refurbished Laptop 13",
        type="electronics",
        priority=6,
        tags={"[category:laptop]", "[brand:BudgetTech]", "[condition:refurbished]"},
        metadata={"price": 499.99, "stock": 10, "rating": 3.8}
    ),
]
store.batch_upsert(products)

# Query 1: Laptops in stock, sorted by priority
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="electronics",
    tags=Facet.AND([
        Facet.NF(slot="category", value="laptop"),
        Facet.NF(slot="condition", value="new")  # Only new products
    ])
)
print(f"New laptops: {len(results)}")

# Query 2: Products by specific brand
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="electronics",
    tags=Facet.NF(slot="brand", value="TechCorp")
)
print(f"TechCorp products: {len(results)}")

# Query 3: Pattern search in product names
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    name=Facet.LIKE("%Laptop%"),
    type="electronics"
)
print(f"Laptop products: {len(results)}")
for result in results:
    print(f"- {result['kl'].name}")
```

<br/>

### 6.3. Task Management System

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF
import datetime

# Setup
store = DatabaseKLStore(database="tasks.db", provider="sqlite")
engine = FacetKLEngine(
    storage=store,
    inplace=True,
    facets={"type": "task"}  # Global facet: only tasks
)

# Create tasks
tasks = [
    BaseUKF(
        name="Implement authentication",
        type="task",
        priority=10,
        timestamp=datetime.datetime(2024, 1, 15),
        tags={"[status:in_progress]", "[assignee:alice]", "[sprint:Q1]"},
        metadata={"estimate": 8, "actual": 6}
    ),
    BaseUKF(
        name="Write documentation",
        type="task",
        priority=5,
        timestamp=datetime.datetime(2024, 1, 20),
        tags={"[status:pending]", "[assignee:bob]", "[sprint:Q1]"},
        metadata={"estimate": 4, "actual": 0}
    ),
    BaseUKF(
        name="Fix critical bug",
        type="task",
        priority=10,
        timestamp=datetime.datetime(2024, 1, 10),
        tags={"[status:completed]", "[assignee:alice]", "[sprint:Q1]"},
        metadata={"estimate": 2, "actual": 3}
    ),
    BaseUKF(
        name="Design database schema",
        type="task",
        priority=8,
        timestamp=datetime.datetime(2024, 1, 5),
        tags={"[status:completed]", "[assignee:charlie]", "[sprint:Q1]"},
        metadata={"estimate": 5, "actual": 5}
    ),
]
store.batch_upsert(tasks)

# Query 1: High-priority active tasks
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    priority=Facet.GTE(8),
    tags=Facet.NF(slot="status", value=Facet.OR(["pending", "in_progress"]))
)
print(f"High-priority active tasks: {len(results)}")

# Query 2: Alice's completed tasks
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    tags=Facet.AND([
        Facet.NF(slot="assignee", value="alice"),
        Facet.NF(slot="status", value="completed")
    ])
)
print(f"Alice's completed tasks: {len(results)}")

# Query 3: Tasks created in January
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    timestamp=Facet.BETWEEN(
        datetime.datetime(2024, 1, 1),
        datetime.datetime(2024, 1, 31, 23, 59, 59)
    )
)
print(f"January tasks: {len(results)}")

# Query 4: Overdue tasks (actual > estimate) - requires complex logic
# First get all tasks, then filter in Python
# (or use raw SQL through _search_sql for complex calculations)
results = engine.search(mode="facet", include=["id", "kl"])
overdue = [r for r in results if r["kl"].metadata.get("actual", 0) > r["kl"].metadata.get("estimate", 0)]
print(f"Overdue tasks: {len(overdue)}")
```

<br/>

### 6.4. Non-In-Place Mode with Schema Subsetting

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet

# Large storage with many fields
store = DatabaseKLStore(database="large_store.db", provider="sqlite")

# Create optimized index with subset of fields
engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "timestamp", "tags"],
    exclude=["content", "description"],  # Exclude large text fields
    database="optimized_index.db"
)

# Initial sync (copy data to index)
print("Syncing index...")
engine.sync()
print(f"Indexed {len(engine)} objects")

# Fast queries on indexed fields
results = engine.search(
    mode="facet",
    include=["id"],  # Only IDs (kl not available if not recoverable)
    priority=Facet.GTE(7),
    tags=Facet.NF(slot="category", value="important")
)
print(f"Found {len(results)} high-priority items")

# After storage changes, resync
new_kl = BaseUKF(name="New Item", type="document", priority=9)
store.upsert(new_kl)
engine.sync()  # Update index

# Close engine
engine.close()
```

<br/>

## Further Exploration

> **Tip:** For the base interface and common operations, see:
> - [BaseKLEngine](./base.md) - Abstract base class defining the KLEngine interface and shared functionality
> - [KLEngine Overview](./index.md) - Introduction to query engines and retrieval strategies

> **Tip:** For other search methodologies, see:
> - [VectorKLEngine](./vector.md) - Semantic similarity search using vector embeddings
> - [DAACKLEngine](./daac.md) - Multi-pattern string matching for entity recognition

> **Tip:** For database integration, see:
> - [DatabaseKLStore](../klstore/database.md) - ORM-based persistent storage for knowledge objects
> - [Database Utilities](../utils/db.md) - Database connection, query execution, and utilities
> - [Database Configuration](../../configuration/database.md) - YAML configuration for database providers

> **Tip:** For advanced query patterns, see:
> - [Facet Operators Reference](../utils/db.md#facet-operators) - Complete reference for all Facet operators
> - [SQL Query Optimization](../utils/db.md#query-optimization) - Performance tuning for database queries

<br/>
