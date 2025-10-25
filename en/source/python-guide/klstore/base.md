# BaseKLStore

BaseKLStore is the abstract base class that defines the common interface for all KLStore implementations in AgentHeaven. It provides a standardized way to store, retrieve, and manage knowledge objects (BaseUKF instances) across different storage backends while ensuring consistent behavior and functionality.

## 1. Understanding KLStore

### 1.1. What is KLStore?

**KLStore** is AgentHeaven's storage layer for knowledge objects. Think of it as a specialized key-value store where:
- **Keys** are unique numeric IDs (integers)
- **Values** are knowledge objects (BaseUKF instances)
- **Operations** are simple CRUD (Create, Read, Update, Delete) operations

KLStore is **INTENTIONALLY** designed **NOT** to support querying, filtering, or searching — these advanced operations are handled by **KLEngines**, which build on top of KLStores.

<br/>

### 1.2. Why Separate Storage from Querying?

This separation of concerns brings several benefits:

**Flexibility in Storage Backends**: You can easily switch between different storage backends (in-memory, disk, database, vector database) based on your needs—performance, persistence, scalability, or cost—without changing your query logic.

**Multiple Query Perspectives**: Multiple KLEngines can share the same KLStore, each providing different query capabilities (e.g., vector similarity, faceted search, full-text search) over the same knowledge base. This eliminates data duplication while enabling multi-perspective knowledge retrieval.

**Loose Coupling**: While some inplace KLEngines work best with specific KLStores (e.g., an in-place `VectorKLEngine` requires a `VectorKLStore` with the same vector backend), many non-inplace KLEngines can work with any KLStore. This loose coupling makes the system modular and extensible.

**Advanced Routing**: The modular design enables advanced patterns like [CascadeKLStore](./cascade.md), which routes knowledge objects to different storage backends based on criteria like freshness, importance, access patterns — keeping hot data in fast storage and cold data in cheaper, slower storage, or any other user-defined routing logic.

<br/>

## 2. Shared Functionality

All KLStore implementations inherit the following common capabilities from `BaseKLStore`:

### 2.1 Key Operations

- **Storage CRUD**: Insert, update, and remove knowledge objects using unique identifiers
- **Retrieval**: Get knowledge objects by their ID with flexible key handling (int, str, or BaseUKF)
- **Existence Checking**: Verify if knowledge objects exist in the store
- **Iteration**: Iterate through all stored knowledge objects

<br/>

### 2.2 Batch Operations

- **Batch Insert**: Insert multiple knowledge objects efficiently
- **Batch Upsert**: Insert or update multiple knowledge objects in one operation
- **Batch Remove**: Remove multiple knowledge objects simultaneously

<br/>

### 2.3 Flexible Key Handling

BaseKLStore accepts three types of keys for all operations:
- `int`: Direct numeric ID
- `str`: String representation of numeric ID (automatically converted)
- `BaseUKF`: Knowledge object instance (ID extracted automatically)

<br/>

### 2.4 Conditional Storage

All KLStore implementations support optional condition filtering:
```python
# Only store knowledge objects that meet specific criteria
store = MyKLStore(condition=lambda kl: kl.category == "important")
```

<br/>

## 3. Core Interface Methods

BaseKLStore defines the essential interface that all implementations must provide:

### 3.1 Required Abstract Methods

- `_get(key, default)`: Retrieve a knowledge object by its ID. Returns `default` (Ellipsis by default) if not found.

- `_upsert(kl)`: Insert or update a knowledge object in the store.

- `_remove(key)`: Remove a knowledge object from the store by its ID.

- `_itervalues()`: Return an iterator over all knowledge objects in the store.

- `_clear()`: Remove all knowledge objects from the store.

<br/>

### 3.2 Optional Optimization Methods

- `_has(key)`: Check if a knowledge object exists for the given key. The default implementation uses `_get`. Override for performance optimization.

- `__len__()`: Return the number of knowledge objects in the store. The default implementation iterates through all objects. Override for performance optimization.

- `_insert(kl)`: Insert a knowledge object only if it does not already exist. The default implementation uses `_has` and `_upsert`. Override for better performance.

- `_batch_upsert(kls)`, `_batch_insert(kls)`, `_batch_remove(keys)`: Optimized batch operations. The default implementations iterate through individual operations. Override for better performance with large datasets.

- `close()`: Optional method to close any open connections or resources. Default is a no-op.

- `flush()`: Optional method to flush any buffered data to persistent storage (e.g., in-memory to disk). Default is a no-op.

<br/>

## 4. Usage Patterns

### 4.1 Basic Operations

```python
class MyKLStore(BaseKLStore):
    # Implement required methods here
    pass

# All KLStore implementations support these operations
store = MyKLStore("my_store")

# Insert knowledge objects
store.insert(knowledge_object)
store.upsert(knowledge_object)  # Insert or update

# Retrieve knowledge objects
kl = store.get(123)                    # By ID
kl = store.get("123")                  # By string ID  
kl = store.get(knowledge_object)       # By BaseUKF instance

# Check existence
exists = 123 in store
exists = store.exists(123)

# Remove knowledge objects
del store[123]
store.remove(123)
```

<br/>

### 4.2 Batch Operations

```python
# Batch insert (only if not exists)
store.batch_insert([kl1, kl2, kl3])

# Batch upsert (insert or update)
store.batch_upsert([kl1, kl2, kl3])

# Batch remove
store.batch_remove([123, 456, 789])
```

<br/>

### 4.3 Iteration and Counting

```python
# Iterate through all knowledge objects
for kl in store:
    print(kl.id, kl.content)

# Count knowledge objects
count = len(store)
```

<br/>

## 5. Implementation Guide

When creating a custom KLStore implementation:

### 5.1 Extend BaseKLStore

```python
from ahvn.klstore.base import BaseKLStore
from ahvn.ukf.base import BaseUKF

class MyKLStore(BaseKLStore):
    def __init__(self, name=None, condition=None, **kwargs):
        super().__init__(name, condition, **kwargs)
        # Initialize your storage backend
    
    # Implement required abstract methods
    def _get(self, key: int, default: Any = ...) -> BaseUKF:
        # Your implementation
        pass
    
    def _upsert(self, kl: BaseUKF):
        # Your implementation
        pass
    
    def _remove(self, key: int):
        # Your implementation
        pass
    
    def _itervalues(self) -> Generator[BaseUKF, None, None]:
        # Your implementation
        pass
    
    def _clear(self):
        # Your implementation
        pass
```

<br/>

### 5.2. Performance Optimization

Override optimization methods for better performance:

```python
def __len__(self) -> int:
    # Return count without iterating through all objects
    return self._backend.count()

def _has(self, key: int) -> bool:
    # Efficient existence check
    return self._backend.contains(key)

def _batch_upsert(self, kls: Iterable[BaseUKF]):
    # Use backend's batch operation if available
    self._backend.batch_upsert(kls)
```

<br/>

## 6. Further Exploration

> **Tip:** For concrete KLStore implementations, see:
> - [CacheKLStore](./cache.md) - High-performance in-memory or disk-backed storage using cache backends
> - [DatabaseKLStore](./database.md) - Persistent relational database storage with ORM support
> - [VectorKLStore](./vector.md) - Vector database storage for similarity-based retrieval
> - [CascadeKLStore](./cascade.md) - Multi-tier storage routing based on custom criteria

> **Tip:** For knowledge query and retrieval capabilities, see:
> - [KLEngine](../klengine/index.md) - Search engine implementations built on top of KLStores
> - [DAACKLEngine](../klengine/daac.md) - Dense and accurate knowledge retrieval engine
> - [VectorKLEngine](../klengine/vector.md) - Vector similarity search engine
> - [FacetKLEngine](../klengine/facet.md) - Faceted search over relational databases

> **Tip:** For knowledge object fundamentals, see:
> - [BaseUKF](../ukf/ukf-v1.0.md) - Universal Knowledge Format for representing knowledge objects
> - [UKF Data Types](../ukf/data-types.md) - Data type mappings between UKF, Pydantic, and various databases

<br/>
