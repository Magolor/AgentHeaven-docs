# CascadeKLStore

CascadeKLStore is a composite [BaseKLStore](./base.md) implementation that orchestrates multiple KLStore backends in a prioritized cascade. It provides unified read access across heterogeneous storage tiers while maintaining independent write control, enabling sophisticated multi-tier storage architectures.

## 1. Introduction

### 1.1. What is CascadeKLStore?

**CascadeKLStore** is fundamentally different from other KLStore implementations—it's a **composite store** that wraps and coordinates multiple KLStore backends rather than managing storage directly. Think of it as a storage orchestrator:

- **Multi-Tier Architecture**: Combines multiple KLStores (e.g., fast cache + persistent database + vector store) into a unified interface
- **Priority-Based Reads**: Queries cascade through stores in order, returning from the first match (like a cache hierarchy)
- **Transparent Retrieval**: Applications see one logical store regardless of physical distribution
- **Independent Writes**: Each backend store is managed independently—no automatic data movement

CascadeKLStore is **NOT** a router that decides where to store data. Instead, you explicitly manage which knowledge objects go into which stores, and CascadeKLStore provides unified read access across them all.

<br/>

### 1.2. Why Use CascadeKLStore?

This composite design enables powerful storage patterns:

**Performance Tiering**: Place frequently accessed knowledge in fast storage (InMemCache) with fallback to slower persistent storage (DatabaseKLStore), automatically querying the fastest available source first.

**Backend Diversity**: Combine different storage types for different purposes—e.g., VectorKLStore for semantic search + DatabaseKLStore for structured queries + CacheKLStore for hot data—while presenting a single interface to KLEngines.

**Incremental Migration**: Gradually migrate between storage backends by adding new stores to the cascade while maintaining backward compatibility with existing data.

**Development/Production Parity**: Use in-memory stores for testing with fallback to production databases, ensuring tests use the same code paths as production.

<br/>

### 1.3. Key Design Principles

**Read-Through Cascade**: Queries try each store in order until found—fast stores first, slow stores last.

**Independent Write Management**: You explicitly control which store receives which data—no automatic synchronization or data movement.

**Deduplication**: Iteration returns unique knowledge objects (by ID) even if duplicated across stores.

**Transparent Operations**: Most operations (get, exists, iterate, remove) work seamlessly across all stores.

<br/>

## 2. Quick Start

### 2.1. Basic Usage

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache
from ahvn.ukf import BaseUKF

# Create tier 1: Fast in-memory cache
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache, name="hot_tier")

# Create tier 2: Persistent database
cold_store = DatabaseKLStore(database="knowledge.db", provider="sqlite", name="cold_tier")

# Combine into cascade (priority order: hot -> cold)
cascade = CascadeKLStore(stores=[hot_store, cold_store], name="cascade_store")

# Write directly to specific stores
kl_hot = BaseUKF(name="Recent Article", type="article", content="Latest news")
kl_cold = BaseUKF(name="Archive Document", type="document", content="Historical data")

hot_store.upsert(kl_hot)    # Write to hot tier
cold_store.upsert(kl_hot)   # Write to cold tier
cold_store.upsert(kl_cold)  # Write to cold tier

# Read from cascade (automatically finds in appropriate tier)
retrieved_hot = cascade.get(kl_hot.id)   # Found in hot_store (fast)
retrieved_cold = cascade.get(kl_cold.id) # Found in cold_store (fallback)

print(f"Retrieved: {retrieved_hot.name}")  # Works transparently
print(f"Retrieved: {retrieved_cold.name}")

# Check existence across all tiers
exists = kl_hot.id in cascade  # True (found in hot_store)

# Iterate over all unique knowledge objects
for kl in cascade:
    print(f"- {kl.name}")  # Returns both kl_hot and kl_cold
```

<br/>

### 2.2. Initialization Parameters

- **`stores`** (required): Ordered list of `BaseKLStore` instances—defines priority (first = highest)
- **`name`** (optional): Name of the cascade instance (default: "default")
- **`condition`** (optional): Filter function applied to iteration/removal operations (not used for reads)

<br/>

## 3. Core Operations

### 3.1. Read Operations (Cascade Behavior)

Read operations **cascade through stores in priority order**, returning the first match:

```python
cascade = CascadeKLStore(stores=[fast_store, medium_store, slow_store])

# get() - Returns from first store that has it
kl = cascade.get(123)
# 1. Checks fast_store first
# 2. If not found, checks medium_store
# 3. If not found, checks slow_store
# 4. Returns default if nowhere

# exists() / __contains__() - Returns True if in ANY store
if 123 in cascade:
    print("Found in at least one store")

# Efficient: stops at first match, doesn't search all stores
```

**Performance Tip**: Place fastest/most-likely/most-wanted stores first in the list for optimal read performance.

<br/>

### 3.2. Write Operations (Explicit Management)

**CascadeKLStore does NOT support direct upsert/insert** — you must write to specific stores:

```python
cascade = CascadeKLStore(stores=[hot_store, cold_store])

# ❌ This raises NotImplementedError
# cascade.upsert(kl)  # Error: "Upsert operation is not allowed"

# ✅ Instead, write to specific stores
hot_store.upsert(kl_new)    # Write to hot tier
cold_store.upsert(kl_new)   # Write to cold tier
cold_store.upsert(kl_arch)  # Write to cold tier

# Common pattern: Write to first store (hot tier)
cascade.stores[0].upsert(kl_recent)
```

**Why no automatic writes?** You control the storage strategy — whether based on recency, importance, size, or any other criteria. The cascade doesn't make assumptions.

It is recommended that lower-priority stores (e.g., cold storage) also receive writes for redundancy or backup, depending on your application's needs. However, note that is not necessarily required, as CascadeKLStore may not necessarily be used for fallback purposes.

> **Tip:** To enable smart auto-write strategies, you need a component much more powerful than CascadeKLStore. See [KLBase](../klbase.md) for more information.

<br/>

### 3.3. Remove Operations (All Stores)

Remove operations execute on **all stores** that contain the key:

```python
cascade = CascadeKLStore(stores=[store1, store2, store3])

# Remove from all stores
cascade.remove(123)
# Internally:
# - Checks if 123 in store1 → removes if found
# - Checks if 123 in store2 → removes if found
# - Checks if 123 in store3 → removes if found

# Batch remove
cascade.batch_remove([123, 456, 789])  # Removes from all stores
```

<br/>

### 3.4. Iteration (Deduplicated)

Iteration returns **unique knowledge objects** across all stores:

```python
# Suppose:
# - store1 has [kl_1, kl_2]
# - store2 has [kl_2, kl_3]  # kl_2 duplicated

cascade = CascadeKLStore(stores=[store1, store2])

for kl in cascade:
    print(kl.id)
# Output: 1, 2, 3  (kl_2 returned only once)

# Count unique objects
count = len(cascade)  # 3 (not 4)
```

Again, it is NOT required for lower-priority stores to contain all data in the higher-priority stores, a union is performed during iteration.

**Deduplication**: First occurrence (by ID) wins — duplicates in later stores are skipped.

<br/>

### 3.5. Clear and Close

```python
# Clear all stores
cascade.clear()  # Removes all data from all stores

# Flush all stores (ensure persistence)
cascade.flush()

# Close all stores (release resources)
cascade.close()
```

<br/>

## 4. Usage Patterns

### 4.1. Hot/Cold Storage Architecture

Classic caching pattern with fast hot storage and slower cold storage:

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache, DiskCache

# Hot tier: Fast in-memory cache (limited capacity)
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache)

# Cold tier: Persistent database (unlimited capacity)
cold_store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# Cascade: hot first, cold second
cascade = CascadeKLStore(stores=[hot_store, cold_store])

# Write strategy: New data goes to hot tier
def add_knowledge(kl):
    hot_store.upsert(kl)      # Write to hot
    cold_store.upsert(kl)     # Backup to cold (optional)

# Reads automatically use fastest available
kl = cascade.get(123)  # Fast if in hot_store, slower if only in cold_store
```

<br/>

### 4.2. Multi-Backend KLEngine

Use CascadeKLStore to provide a single storage interface for KLEngines querying multiple backends:

```python
from ahvn.klstore import CascadeKLStore, VectorKLStore, DatabaseKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.llm import LLM

# Different storage backends for different data
vector_store = VectorKLStore(collection="vectors", provider="lancedb", embedder=LLM(preset="embedder"))
db_store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# Cascade: vector first (for semantic search), database second (for older data)
cascade = CascadeKLStore(stores=[vector_store, db_store])

# KLEngine queries both stores transparently
engine = VectorKLEngine(storage=cascade, inplace=False)
results = engine.search("machine learning tutorials", top_k=10)
# Searches data from both vector_store and db_store
```

<br/>

### 4.3. Development/Production Parity

Use in-memory stores for testing with production database fallback:

```python
import os
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache

def create_store():
    stores = []
    
    if os.getenv("TESTING"):
        # Testing: Add in-memory store first
        test_cache = InMemCache()
        test_store = CacheKLStore(cache=test_cache)
        stores.append(test_store)
    
    # Always add production database
    prod_store = DatabaseKLStore(database="production.db", provider="pg")
    stores.append(prod_store)
    
    return CascadeKLStore(stores=stores)

# In tests: reads from test_store if present, falls back to prod_store
# In production: reads directly from prod_store
cascade = create_store()
```

<br/>

### 4.4. Incremental Migration

Migrate between storage backends without downtime:

```python
from ahvn.klstore import CascadeKLStore, DatabaseKLStore

# Old backend (legacy)
old_store = DatabaseKLStore(database="old_db.db", provider="sqlite")

# New backend (modern, faster)
new_store = DatabaseKLStore(database="new_db", provider="pg", host="localhost")

# Cascade: new first, old second
cascade = CascadeKLStore(stores=[new_store, old_store])

# Gradually migrate data
for kl in old_store:
    new_store.upsert(kl)           # Copy to new store
    # old_store.remove(kl.id)      # Optionally remove from old

# Application reads from cascade (new first, old fallback)
# Once migration complete, remove old_store from cascade
```

<br/>

## 5. Advanced Patterns

### 5.5. Conditional Filtering Across Tiers

Apply conditions to control which objects are visible through the cascade:

```python
cascade = CascadeKLStore(
    stores=[store1, store2, store3],
    condition=lambda kl: kl.metadata.get("status") == "published"
)

# Only published knowledge objects visible in iteration
for kl in cascade:
    assert kl.metadata["status"] == "published"

# Note: get() and exists() ignore condition (read all data)
# Condition only applies to iteration and removal
```

<br/>

### 5.6. Dynamic Store Management

Modify the cascade at runtime:

```python
cascade = CascadeKLStore(stores=[store1, store2])

# Add a new tier dynamically
new_store = VectorKLStore(collection="new", provider="lancedb", embedder=embedder)
cascade.stores.insert(0, new_store)  # Insert at highest priority

# Remove a tier
cascade.stores.remove(store2)

# Reorder priorities
cascade.stores = [new_store, store1, store2]  # new_store now highest priority
```

<br/>

### 5.7. Per-Store Access Patterns

Access individual stores for fine-grained control:

```python
cascade = CascadeKLStore(stores=[hot_store, warm_store, cold_store])

# Check which tier contains data
for i, store in enumerate(cascade.stores):
    if kl.id in store:
        print(f"Found in tier {i}: {store.name}")

# Get from specific tier
kl_from_cold = cascade.stores[2].get(kl.id)

# Move data between tiers
if kl.id in cold_store and kl.metadata.get("my_custom_hotness_metric") > 100:
    hot_store.upsert(cold_store.get(kl.id))  # Promote to hot tier
```

<br/>

## 6. Limitations and Considerations

### 6.1. No Automatic Synchronization

CascadeKLStore does **NOT**:
- ❌ Automatically promote hot data to faster stores
- ❌ Automatically demote cold data to slower stores
- ❌ Synchronize data across stores
- ❌ Validate consistency between stores

You must implement these strategies yourself if needed.

<br/>

### 6.2. Write Management Responsibility

You are responsible for:
- Deciding which store(s) to write to
- Handling data replication (if desired)
- Managing capacity limits (if any)
- Implementing eviction policies

<br/>

### 6.3. Duplicate Data Handling

If the same knowledge object exists in multiple stores:
- **Reads**: Return from first store (highest priority)
- **Iteration**: Return only once (deduplication by ID)
- **Updates**: Must update all copies manually
- **Removes**: Remove from all stores

<br/>

### 6.4. Performance Considerations

- **Read Latency**: Worst case is sum of all store latencies (if object in last store)
- **Iteration Cost**: Iterates through ALL stores (can be slow if many stores)
- **No Query Optimization**: Doesn't optimize queries across stores—use KLEngines for that

<br/>

## 7. Complete Example

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore, VectorKLStore
from ahvn.cache import InMemCache, DiskCache
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF, ptags

# Initialize embedder for vector store
embedder = LLM(preset="embedder")

# Tier 1: Ultra-fast in-memory cache for hot data (recent 1000 articles)
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache, name="hot_tier")

# Tier 2: Fast disk cache for warm data (recent 10000 articles)
warm_cache = DiskCache("/var/cache/knowledge_warm", size_limit=1024**3)
warm_store = CacheKLStore(cache=warm_cache, name="warm_tier")

# Tier 3: Database for structured metadata queries
db_store = DatabaseKLStore(database="knowledge.db", provider="sqlite", name="db_tier")

# Tier 4: Vector store for semantic search (all articles)
vector_store = VectorKLStore(
    collection="all_articles",
    provider="lancedb",
    uri="./data/vectors",
    embedder=embedder,
    name="vector_tier"
)

# Create cascade (priority order: hot -> warm -> db -> vector)
cascade = CascadeKLStore(
    stores=[hot_store, warm_store, db_store, vector_store],
    name="article_cascade"
)

# Simulate article publishing workflow
articles = [
    BaseUKF(
        name="Breaking News: AI Breakthrough",
        type="news_article",
        content="Major advancement in artificial intelligence...",
        tags=ptags(CATEGORY="technology", IMPORTANCE="high", RECENCY="today")
    ),
    BaseUKF(
        name="Python Tutorial",
        type="tutorial",
        content="Learn Python programming step by step...",
        tags=ptags(CATEGORY="programming", IMPORTANCE="medium", RECENCY="this_week")
    ),
    BaseUKF(
        name="Historical Analysis of WWI",
        type="research_article",
        content="Comprehensive study of World War I causes...",
        tags=ptags(CATEGORY="history", IMPORTANCE="low", RECENCY="old")
    )
]

# Write strategy: tier based on recency and importance
def publish_article(article):
    # All articles go to vector store for semantic search
    vector_store.upsert(article)
    
    # All articles go to database for structured queries
    db_store.upsert(article)
    
    # Recent + important articles go to warm cache
    if article.tags.get("RECENCY") in ["today", "this_week"]:
        warm_store.upsert(article)
    
    # Breaking news goes to hot cache
    if article.tags.get("IMPORTANCE") == "high":
        hot_store.upsert(article)

# Publish articles
for article in articles:
    publish_article(article)

# Query through cascade
print(f"Total unique articles: {len(cascade)}")  # 3

# Read performance varies by tier
news = cascade.get(articles[0].id)  # Fast (in hot_store)
tutorial = cascade.get(articles[1].id)  # Medium (in warm_store)
history = cascade.get(articles[2].id)  # Slower (in db_store or vector_store)

print(f"Breaking news: {news.name} (high priority)")
print(f"Tutorial: {tutorial.name} (medium priority)")
print(f"Historical: {history.name} (low priority)")

# Check tier distribution
print("\nTier distribution:")
print(f"- Hot tier: {len(hot_store)} articles")
print(f"- Warm tier: {len(warm_store)} articles")
print(f"- Database tier: {len(db_store)} articles")
print(f"- Vector tier: {len(vector_store)} articles")

# Iterate over all unique articles
print("\nAll articles:")
for article in cascade:
    print(f"- {article.name} ({article.type})")

# Promote an article to hot tier based on access pattern
if tutorial.tags.get("IMPORTANCE") == "medium":
    hot_store.upsert(tutorial)  # Manually promote
    print(f"\nPromoted '{tutorial.name}' to hot tier")

# Remove an article from all tiers
cascade.remove(history.id)
print(f"\nRemoved '{history.name}' from all tiers")
print(f"Remaining articles: {len(cascade)}")

# Clean up
cascade.flush()   # Ensure all tiers persisted
cascade.close()   # Close all connections
```

<br/>

## 8. Further Exploration

> **Tip:** For the interface and common operations, see:
> - [BaseKLStore](./base.md) - Abstract base class defining the KLStore interface and shared functionality

> **Tip:** For individual KLStore implementations to use in cascades, see:
> - [CacheKLStore](./cache.md) - Lightweight cache-backed storage with multiple backend options
> - [DatabaseKLStore](./database.md) - Persistent relational database storage with ORM support
> - [VectorKLStore](./vector.md) - Vector database storage for semantic similarity search

> **Tip:** For knowledge retrieval across cascade stores, see:
> - [KLEngine](../klengine/index.md) - Search engine implementations built on top of KLStores
> - [VectorKLEngine](../klengine/vector.md) - Semantic search across multiple storage tiers
> - [DAACKLEngine](../klengine/daac.md) - Dense and accurate retrieval with cascade support

<br/>
