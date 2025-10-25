# DatabaseKLStore

DatabaseKLStore is a persistent [BaseKLStore](./base.md) implementation backed by SQL databases through SQLAlchemy ORM. It provides ACID-compliant, scalable storage for knowledge objects with support for PostgreSQL, MySQL, SQLite, and DuckDB.

## 1. Introduction

### 1.1. ORM-Based Persistence vs Cache-Based

While you can use a `CacheKLStore` with `DatabaseCache` backend for simple key-value storage, **DatabaseKLStore** offers true relational database features:

**DatabaseKLStore advantages:**
- **Structured Schema**: Automatic table creation with proper ORM entities and foreign key relationships
- **Dimension Tables**: Complex UKF fields (metadata, content arrays) stored in separate dimension tables with referential integrity
- **Optimized Bulk Operations**: Uses SQLAlchemy's `bulk_insert_mappings` for efficient batch processing
- **Query-Ready**: Prepares data for advanced SQL queries (when used with KLEngines like `FacetKLEngine`)

**When to use CacheKLStore with DatabaseCache instead:**
- Simple key-value storage without schema requirements (e.g., storing non UKF objects, or storing UKF only for temporary use with no retrieval needs)
- Shared cache infrastructure with other components (e.g., mainly storing CacheEntry)
- Minimal setup with lightweight dependencies (e.g., testing and development)

<br/>

### 1.2. Multi-Table Architecture

DatabaseKLStore uses an ORM adapter to map BaseUKF objects to a relational schema:
- **Main Table**: Core UKF attributes (id, name, type, version, etc.)
- **Dimension Tables**: Complex fields with foreign keys to main table
- **Automatic Mapping**: Bidirectional conversion handled by `ORMUKFAdapter`

<br/>

## 2. Quick Start

### 2.1. Basic Usage

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF

# SQLite (file-based, simplest)
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# PostgreSQL (production-ready)
store = DatabaseKLStore(
    database="mydb",
    provider="pg",
    host="localhost",
    name="knowledge_store"
)

# Create and store a knowledge object
kl = BaseUKF(name="Python Tutorial", type="documentation", content="Learn Python")
store.upsert(kl)

# Retrieve it
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

All standard [BaseKLStore](./base.md) operations work seamlessly: `insert()`, `upsert()`, `get()`, `remove()`, `batch_*()`, iteration, etc.

**Auto-schema:** Tables are created automatically on first use—no manual schema setup required.

<br/>

### 2.2. Initialization Parameters

- **`database`** (required): Database name or path (for SQLite/DuckDB)
- **`provider`** (optional): Database provider ("sqlite", "pg", "mysql", "duckdb"); uses config default if omitted
- **`name`** (optional): KLStore instance name (default: database name)
- **`condition`** (optional): Filter function to conditionally store objects
- **Additional kwargs**: Connection parameters (host, port, username, password, etc.)

<br/>

## 3. Database Backends

### 3.1. SQLite — Development & Embedded

```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
# File-based, zero-config, perfect for prototyping
```

<br/>

### 3.2. PostgreSQL — Production

```python
store = DatabaseKLStore(
    database="knowledge_db",
    provider="pg",
    host="localhost",
    port=5432,
    username="user",
    password="pass"
)
# Production-ready, concurrent access, advanced features
```

<br/>

### 3.3. DuckDB — Analytics

```python
store = DatabaseKLStore(database="knowledge.duckdb", provider="duckdb")
# File-based, optimized for analytical queries, fast aggregations
```

<br/>

### 3.4. MySQL — General Purpose

```python
store = DatabaseKLStore(
    database="knowledge_db",
    provider="mysql",
    host="localhost"
)
# Mature ecosystem, widely supported
```

<br/>

## 4. Database-Specific Features

### 4.1. Automatic Transactions

All operations are wrapped in transactions with automatic commit/rollback:

```python
# Automatic transaction management
try:
    store.upsert(kl1)
    store.batch_insert([kl2, kl3])
    # Auto-commits on success
except Exception as e:
    # Auto-rollback on failure
    print(f"Transaction rolled back: {e}")
```

<br/>

### 4.2. Schema Auto-Creation

Tables are created automatically on first use:

```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
# Creates main table + dimension tables with proper foreign keys
```

<br/>

### 4.3. Clear and Close

```python
# Remove all knowledge objects
store.clear()

# Close database connection
store.close()
```

<br/>

## 5. Complete Example

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF

# Initialize with PostgreSQL
store = DatabaseKLStore(
    database="knowledge_db",
    provider="pg",
    host="localhost",
    name="research_papers",
    condition=lambda kl: kl.type == "research_paper"
)

# Create knowledge objects
papers = [
    BaseUKF(
        name="Neural Networks Intro",
        type="research_paper",
        content="Deep learning fundamentals...",
        metadata={"year": 2024, "citations": 150}
    ),
    BaseUKF(
        name="Transformer Architecture",
        type="research_paper",
        content="Attention is all you need...",
        metadata={"year": 2017, "citations": 50000}
    ),
    BaseUKF(
        name="Random Blog Post",
        type="blog_post",  # Filtered out by condition
        content="Some content..."
    )
]

# Batch insert (blog_post filtered out)
store.batch_upsert(papers)

# Query
print(f"Total papers: {len(store)}")  # 2
for paper in store:
    print(f"- {paper.name} ({paper.metadata.get('year')})")

# Update
paper = store.get(papers[0].id)
store.upsert(paper.clone(metadata={**paper.metadata, "citations": 200}))

# Clean up
store.close()
```

<br/>

## Further Exploration

> **Tip:** For the interface and common operations, see:
> - [BaseKLStore](./base.md) - Abstract base class defining the KLStore interface and shared functionality

> **Tip:** For database utilities and configuration, see:
> - [Database Utilities](../utils/db.md) - Database connection, query execution, and utilities
> - [Database Configuration](../../configuration/database.md) - YAML configuration for database providers

> **Tip:** For other KLStore implementations, see:
> - [CacheKLStore](./cache.md) - Lightweight cache-backed storage with multiple backend options
> - [VectorKLStore](./vector.md) - Vector database storage for semantic similarity search
> - [CascadeKLStore](./cascade.md) - Multi-tier storage routing based on custom criteria

> **Tip:** For knowledge retrieval with SQL queries, see:
> - [FacetKLEngine](../klengine/facet.md) - Faceted search and filtering over relational databases
> - [KLEngine](../klengine/index.md) - Search engine implementations built on top of KLStores

<br/>
