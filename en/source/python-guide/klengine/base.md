# BaseKLEngine

BaseKLEngine is the abstract base class that defines the common interface for all KLEngine implementations in AgentHeaven. It provides a standardized way to index, search, and retrieve knowledge objects (BaseUKF instances) across different search methodologies while ensuring consistent behavior and functionality.

## 1. Understanding KLEngine

### 1.1. What is KLEngine?

**KLEngine** is AgentHeaven's query and retrieval layer for knowledge objects. Think of it as a specialized search system where:
- **Input** is a query with search parameters (filters, keywords, embeddings, etc.)
- **Output** is a list of matching knowledge objects with their metadata
- **Operations** are primarily search-focused, with support for indexing and maintenance

KLEngine focuses on **searching and retrieval** — while it supports indexing operations (insert, update, remove) for maintaining the search index, its core purpose is to provide various ways to query and retrieve knowledge objects. KLEngine is not required to store the entirety of knowledge objects; instead, it can work in conjunction with a KLStore that handles persistent storage. Most likely, the KLEngine will only contain knowledge ids, with index metadata or vector embeddings to facilitate efficient searching.

<br/>

### 1.2. Why Separate Storage from Searching?

This separation of concerns brings several benefits:

**Flexibility in Search Methodologies**: You can easily switch between or combine different search approaches (vector similarity, faceted search, pattern matching) based on your needs—accuracy, speed, or complexity—without changing your storage backend.

**Storage Independence**: KLEngines can work with or without attached KLStores. When attached, they retrieve full knowledge objects from storage on demand. When detached, they can still provide search results with IDs or cached metadata. This flexibility enables various architectural patterns.

**In-Place vs. Standalone Modes**: Some engines operate in-place, directly querying the storage backend (e.g., `FacetKLEngine` with `DatabaseKLStore`), while others maintain their own search indexes (e.g., `DAACKLEngine`). This design accommodates both lightweight and specialized search strategies.

**Multi-Modal Retrieval**: The modular design enables combining multiple search engines over the same knowledge base—using vector search for semantic queries, faceted search for structured filtering, and pattern matching for entity recognition—all working together to provide comprehensive retrieval capabilities.

<br/>

## 2. Shared Functionality

All KLEngine implementations inherit the following common capabilities from `BaseKLEngine`:

### 2.1. Core Operations

- **Search Operations**: Perform queries to retrieve matching knowledge objects
- **Index Maintenance**: Insert, update, and remove knowledge objects in the search index
- **Storage Attachment**: Optionally attach to a KLStore for retrieving full knowledge objects
- **Flexible Retrieval**: Get knowledge objects by their ID from engine or attached storage

<br/>

### 2.2. Batch Operations

- **Batch Insert**: Insert multiple knowledge objects efficiently into the search index
- **Batch Upsert**: Insert or update multiple knowledge objects in one operation
- **Batch Remove**: Remove multiple knowledge objects from the search index simultaneously

<br/>

### 2.3. Multiple Search Modes

KLEngines support multiple search methods through a routing mechanism:
- **Default Search**: Use `search()` without a mode parameter to invoke `_search()`
- **Named Search**: Use `search(mode="xxx")` to invoke `_search_xxx()`
- **Search Discovery**: Use `list_search()` to discover available search modes

<br/>

### 2.4. Flexible Key Handling

BaseKLEngine accepts three types of keys for all operations:
- `int`: Direct numeric ID
- `str`: String representation of numeric ID (automatically converted)
- `BaseUKF`: Knowledge object instance (ID extracted automatically)

<br/>

### 2.5. Conditional Indexing

All KLEngine implementations support optional condition filtering:
```python
# Only index knowledge objects that meet specific criteria
engine = MyKLEngine(condition=lambda kl: kl.category == "important")
```

<br/>

### 2.6. In-Place vs. Standalone Modes

KLEngines can operate in two modes:
- **Standalone Mode** (`inplace=False`): The engine maintains its own search index separate from storage
- **In-Place Mode** (`inplace=True`): The engine operates directly on the attached storage backend without maintaining a separate index

<br/>

## 3. Core Interface Methods

BaseKLEngine defines the essential interface that all implementations must provide:

### 3.1. Required Abstract Methods

- `_search(include, *args, **kwargs)`: Perform the default search operation. Returns a list of dictionaries containing search results with keys limited to `include`. Conventionally, use `"id"` for `BaseUKF.id` and `"kl"` for the `BaseUKF` instance itself.

- `_upsert(kl)`: Insert or update a knowledge object in the search index.

- `_remove(key)`: Remove a knowledge object from the search index by its ID. If not applicable for the engine type, override with an empty function or raise an exception.

- `_clear()`: Clear all knowledge objects from the search index.

<br/>

### 3.2. Optional Methods

- `_get(key, default)`: Retrieve a knowledge object from the engine's internal cache or index. Though not required, leaving this unimplemented may lead to unexpected behavior if knowledge objects should be returned by `search()` without an attached KLStore.

- `_post_search(results, include, *args, **kwargs)`: Postprocess search results. By default, returns results unchanged. Override to add ranking, filtering, or enrichment.

- `_search_xxx(include, *args, **kwargs)`: Named search methods for different search modes. For example, `_search_vector()` for vector similarity search, `_search_facet()` for faceted filtering.

<br/>

### 3.3. Optional Optimization Methods

- `_batch_upsert(kls)`, `_batch_insert(kls)`, `_batch_remove(keys)`: Optimized batch operations. The default implementations iterate through individual operations. Override for better performance with large datasets.

- `close()`: Optional method to close any open connections or resources. Default is a no-op.

- `flush()`: Optional method to flush any buffered data to persistent storage. Default is a no-op.

- `sync()`: Synchronize the engine with its attached KLStore by clearing and re-indexing all knowledge objects. Useful when the storage has been batch modified externally.

<br/>

## 4. Usage Patterns

### 4.1. Basic Operations

```python
class MyKLEngine(BaseKLEngine):
    # Implement required methods here
    pass

# Create engine with optional storage attachment
store = MyKLStore("my_store")
engine = MyKLEngine(storage=store, name="my_engine")

# Insert knowledge objects into the index
engine.insert(knowledge_object)
engine.upsert(knowledge_object)  # Insert or update

# Search for knowledge objects
results = engine.search(query="example", include=["id", "kl"])
for result in results:
    kl_id = result["id"]
    kl_obj = result["kl"]
    
# Retrieve specific knowledge object
kl = engine.get(123)  # From engine cache or attached storage

# Remove knowledge objects from index
engine.remove(123)
del engine[123]
```

<br/>

### 4.2. Batch Operations

```python
# Batch insert (only if not exists)
engine.batch_insert([kl1, kl2, kl3])

# Batch upsert (insert or update)
engine.batch_upsert([kl1, kl2, kl3])

# Batch remove
engine.batch_remove([123, 456, 789])
```

<br/>

### 4.3. Multiple Search Modes

```python
# Discover available search modes
modes = engine.list_search()  # Returns [None, 'vector', 'facet', ...]

# Use default search
results = engine.search(query="example")

# Use named search mode
results = engine.search(query="example", mode="vector")  # this requires a _search_vector implementation, typically by VectorKLEngine
results = engine.search(filters={"category": "science"}, mode="facet")  # this requires a _search_facet implementation, typically by FacetKLEngine
```

<br/>

### 4.4. Storage Attachment

```python
# Create engine without storage
engine = MyKLEngine(name="my_engine")

# Attach storage later
store = MyKLStore("my_store")
engine.attach(store)

# Search returns IDs, retrieval uses attached storage
results = engine.search(query="example", include=["id", "kl"])

# Synchronize engine with storage
engine.sync()  # Re-index all objects from storage

# Detach storage
engine.detach()
```

<br/>

### 4.5. Flexible Result Inclusion

```python
# Control what fields to include in search results
results = engine.search(
    query="example",
    include=["id", "kl", "score", "metadata"]
)

# Minimal results (IDs only)
results = engine.search(query="example", include=["id"])

# Full knowledge objects
results = engine.search(query="example", include=["id", "kl"])

# Full knowledge objects with search metadata
results = engine.search(query="example", include=["id", "kl", "score"])  # Typically from vector search
results = engine.search(query="example", include=["id", "kl", "matches"])  # Typically from string search
```

<br/>

## 5. Implementation Guide

When creating a custom KLEngine implementation:

### 5.1. Extend BaseKLEngine

```python
from ahvn.klengine.base import BaseKLEngine
from ahvn.ukf.base import BaseUKF
from typing import Any, Dict, List, Optional, Iterable

class MyKLEngine(BaseKLEngine):
    def __init__(
        self,
        storage=None,
        inplace=False,
        name=None,
        condition=None,
        **kwargs
    ):
        super().__init__(storage, inplace, name, condition, **kwargs)
        # Initialize your search index
        self._index = {}  # Example: simple dictionary index
    
    # Implement required abstract methods
    def _search(
        self,
        include: Optional[Iterable[str]] = None,
        query: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Your search implementation"""
        results = []
        # Perform search logic
        for kl_id, metadata in self._index.items():
            if self._matches(metadata, query):
                results.append({"id": kl_id, "score": 1.0})
        return results
    
    def _upsert(self, kl: BaseUKF):
        """Update search index"""
        self._index[kl.id] = self._extract_metadata(kl)
    
    def _remove(self, key: int):
        """Remove from search index"""
        self._index.pop(key, None)
    
    def _clear(self):
        """Clear search index"""
        self._index.clear()
```

<br/>

### 5.2. Add Named Search Modes

```python
class MyKLEngine(BaseKLEngine):
    # ... (previous code)
    
    def _search_exact(
        self,
        include: Optional[Iterable[str]] = None,
        keyword: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Exact keyword matching search mode"""
        results = []
        for kl_id, metadata in self._index.items():
            if keyword in metadata.get("content", ""):
                results.append({"id": kl_id, "score": 1.0})
        return results
    
    def _search_fuzzy(
        self,
        include: Optional[Iterable[str]] = None,
        keyword: str = "",
        threshold: float = 0.8,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Fuzzy matching search mode"""
        results = []
        # Fuzzy matching logic
        return results
```

<br/>

### 5.3. Performance Optimization

Override optimization methods for better performance:

```python
def _batch_upsert(self, kls: Iterable[BaseUKF]):
    """Optimized batch indexing"""
    # Use bulk operations if your backend supports them
    for kl in kls:
        self._index[kl.id] = self._extract_metadata(kl)
    self._rebuild_secondary_indexes()  # Example: rebuild once

def _post_search(
    self,
    results: List[Dict[str, Any]],
    include: Optional[Iterable[str]] = None,
    **kwargs
) -> List[Dict[str, Any]]:
    """Post-process search results"""
    # Add re-ranking, deduplication, or enrichment
    results = sorted(results, key=lambda r: r.get("score", 0), reverse=True)
    return results[:kwargs.get("limit", 100)]
```

<br/>

### 5.4. In-Place Engine Implementation

```python
from ahvn.klstore.database import DatabaseKLStore

class MyInPlaceKLEngine(BaseKLEngine):
    inplace = True  # Mark as in-place engine
    
    def __init__(self, storage: DatabaseKLStore, **kwargs):
        # In-place engines require a storage backend
        if storage is None:
            raise ValueError("In-place engines require a storage backend")
        super().__init__(storage=storage, inplace=True, **kwargs)
    
    def _search(
        self,
        include: Optional[Iterable[str]] = None,
        filters: Dict[str, Any] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search directly on storage backend"""
        # Query the database directly
        query = self.storage.session.query(self.storage.entity)
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                query = query.filter(getattr(self.storage.entity, key) == value)
        
        # Execute and return results
        results = []
        for entity in query.all():
            results.append({"id": entity.id})
        return results
    
    def _upsert(self, kl: BaseUKF):
        """No-op for in-place engines"""
        pass  # Storage handles persistence
    
    def _remove(self, key: int):
        """No-op for in-place engines"""
        pass  # Storage handles removal
    
    def _clear(self):
        """No-op for in-place engines"""
        pass  # Storage handles clearing
```

<br/>

## 6. Further Exploration

> **Tip:** For concrete KLEngine implementations, see:
> - [FacetKLEngine](./facet.md) - Structured search with ORM-like filtering and SQL queries
> - [DAACKLEngine](./daac.md) - High-performance string matching using Aho-Corasick automaton
> - [VectorKLEngine](./vector.md) - Vector similarity search for semantic retrieval

> **Tip:** For storage backends that work with KLEngines, see:
> - [KLStore](../klstore/index.md) - Storage layer for knowledge objects
> - [CacheKLStore](../klstore/cache.md) - In-memory storage for fast access
> - [DatabaseKLStore](../klstore/database.md) - Persistent relational storage
> - [VectorKLStore](../klstore/vector.md) - Vector database storage

> **Tip:** For knowledge object fundamentals, see:
> - [BaseUKF](../ukf/ukf-v1.0.md) - Universal Knowledge Format for representing knowledge objects
> - [UKF Data Types](../ukf/data-types.md) - Data type mappings between UKF, Pydantic, and databases

<br/>
