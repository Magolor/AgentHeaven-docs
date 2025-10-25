# CacheKLStore

CacheKLStore is a lightweight [BaseKLStore](./base.md) implementation backed by AgentHeaven's [Cache](../cache.md) system. It provides flexible storage for knowledge objects with your choice of cache backend—from ultra-fast in-memory storage to persistent disk or database backends.

## 1. Introduction

### 1.1. Multiple Backend Options

CacheKLStore's key advantage is lightweight and backend flexibility. By wrapping any `BaseCache` implementation, you can choose the storage backend that best fits your needs:

- **InMemCache**: Ultra-fast, volatile storage (perfect for development and testing)
- **DiskCache**: Fast, persistent file-based storage (recommended for production)
- **DatabaseCache**: Scalable SQL-backed storage (SQLite, PostgreSQL, MySQL)
- **JsonCache**: Human-readable JSON files (great for debugging)

Simply swap the cache backend—no changes to your KLStore code.

<br/>

### 1.2. Simple Architecture

Under the hood, CacheKLStore:
- **Wraps** any `BaseCache` backend
- **Serializes** BaseUKF objects to dictionaries using `to_dict()` / `from_dict()`
- **Keys** entries as `func="kl_store"` with `kid=<ukf_id>`
- **Filters** cache entries to iterate only over knowledge objects

<br/>

## 2. Quick Start

### 2.1. Basic Usage

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import InMemCache, DiskCache
from ahvn.ukf import BaseUKF

# In-memory storage (fastest, volatile)
cache = InMemCache()
store = CacheKLStore(cache=cache, name="memory_store")

# Or persistent disk storage
cache = DiskCache("/tmp/knowledge_cache")
store = CacheKLStore(cache=cache, name="disk_store")

# Create and store a knowledge object
kl = BaseUKF(name="Python Tutorial", type="documentation", content="Learn Python")
store.upsert(kl)

# Retrieve it
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

All standard [BaseKLStore](./base.md) operations work seamlessly: `insert()`, `upsert()`, `get()`, `remove()`, `batch_*()`, iteration, etc.

<br/>

### 2.2. Initialization Parameters

- **`cache`** (required): A `BaseCache` instance — determines storage backend
- **`name`** (optional): Name of the KLStore instance (default: "default")
- **`condition`** (optional): Filter function to conditionally store objects

<br/>

## 3. Cache Backends

### 3.1. InMemCache — Development & Testing

```python
from ahvn.cache import InMemCache

cache = InMemCache()
store = CacheKLStore(cache=cache)
# Fastest access, but data lost on restart
```

<br/>

### 3.2. DiskCache — Recommended for Production

```python
from ahvn.cache import DiskCache

cache = DiskCache(
    directory="/var/cache/knowledge",
    size_limit=32 * 1024**3  # 32GB
)
store = CacheKLStore(cache=cache)
# Fast, persistent, production-ready
```

<br/>

### 3.3. DatabaseCache — Scalable Storage

```python
from ahvn.cache import DatabaseCache

# SQLite (simple file-based)
cache = DatabaseCache(provider="sqlite", database="cache.db")
store = CacheKLStore(cache=cache)

# PostgreSQL (multi-user)
cache = DatabaseCache(provider="pg", database="mydb", host="localhost")
store = CacheKLStore(cache=cache)
```

<br/>

### 3.4. JsonCache — Debugging

```python
from ahvn.cache import JsonCache

cache = JsonCache(directory="/tmp/knowledge_json")
store = CacheKLStore(cache=cache)
# Each entry saved as human-readable JSON file
```

<br/>

## 4. Cache-Specific Features

CacheKLStore provides additional operations specific to cache backends:

### 4.1. Flush and Close

```python
# Flush pending writes to storage (backend-dependent)
store.flush()

# Close cache and release resources
store.close()
```

<br/>

### 4.2. Clear All Data

```python
# Remove all knowledge objects
store.clear()
```

<br/>

### 4.3. Direct Cache Access

```python
# Access underlying cache for advanced operations
cache = store.cache

# Check total cache size (includes non-kl_store entries)
print(f"Total cache entries: {len(cache)}")
```

<br/>

## 5. Complete Example

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import DiskCache
from ahvn.ukf import BaseUKF

# Initialize with persistent disk cache
cache = DiskCache("/var/cache/tutorials")
store = CacheKLStore(
    cache=cache,
    name="tutorial_store",
    condition=lambda kl: kl.type in ["tutorial", "documentation"]
)

# Create knowledge objects
tutorials = [
    BaseUKF(name="Python Basics", type="tutorial", 
            content="Intro to Python", metadata={"level": "beginner"}),
    BaseUKF(name="Advanced Python", type="tutorial",
            content="Python internals", metadata={"level": "advanced"}),
    BaseUKF(name="Source Code", type="source_code", 
            content="def hello(): pass")  # Filtered out by condition
]

# Batch insert (source_code filtered out)
store.batch_upsert(tutorials)

# Query
print(f"Cached: {len(store)} tutorials")  # 2 (source_code excluded)
for tut in store:
    print(f"- {tut.name} ({tut.metadata.get('level')})")

# Update
tutorial = store.get(tutorials[0].id)
store.upsert(tutorial.clone(content=tutorial.content+" - Now with examples!"))

# Clean up
store.flush()  # Ensure persistence
store.close()
```

<br/>

## Further Exploration

> **Tip:** For the interface and common operations, see:
> - [BaseKLStore](./base.md) - Abstract base class defining the KLStore interface and shared functionality

> **Tip:** For cache backend details and configuration, see:
> - [Cache System](../cache.md) - All cache backends, configuration options, and advanced features

> **Tip:** For other KLStore implementations, see:
> - [DatabaseKLStore](./database.md) - Persistent relational database storage with ORM and SQL query support
> - [VectorKLStore](./vector.md) - Vector database storage for semantic similarity search
> - [CascadeKLStore](./cascade.md) - Multi-tier storage routing based on custom criteria

> **Tip:** For knowledge retrieval beyond simple ID lookups, see:
> - [KLEngine](../klengine/index.md) - Search engine implementations built on top of KLStores

<br/>
