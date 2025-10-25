# KLBase

**KLBase** is the central orchestration layer in AgentHeaven's knowledge management system. It provides a unified interface for managing knowledge items (UKF objects) across multiple storage backends (KLStore) and search engines (KLEngine). By combining different storage and engine implementations, KLBase enables flexible, efficient knowledge retrieval and manipulation tailored to specific application needs.

<br/>

## 1. Core Concepts

**KLBase** coordinates three main components:

- **UKF (Universal Knowledge Framework)**: The data model representing knowledge items (see [UKF Guide](./ukf/index.md))
- **KLStore**: Storage backends that persist UKF objects (e.g., database, cache, file system)
- **KLEngine**: Search and retrieval engines that index and query UKF objects (e.g., faceted search, autocomplete, vector search)

KLBase acts as the **orchestration layer** that:
1. Routes CRUD operations to appropriate storage backends
2. Maintains consistency across multiple storages and engines
3. Provides unified search interfaces across different engine types
4. Exposes tool specifications for agent integration via `@reg_toolspec` decorator

<br/>

## 2. Basic Architecture

**KLBase** maintains two primary collections that work together to provide comprehensive knowledge management capabilities:

**Storage Layer** (`storages: Dict[str, BaseKLStore]`):
- A dictionary of named storage backends that persist UKF objects
- Each storage provides CRUD operations (create, read, update, delete) for knowledge items
- Available storage implementations:
  - **CacheKLStore**: In-memory or file-based cache for fast temporary storage
  - **DatabaseKLStore**: Relational database backend (PostgreSQL, MySQL, SQLite) for persistent storage
  - **VectorDBKLStore**: Specialized vector database storage for embedding-based operations
  - **CascadeKLStore**: Hierarchical storage chain that queries multiple backends in sequence

**Engine Layer** (`engines: Dict[str, BaseKLEngine]`):
- A dictionary of named search and retrieval engines that index and query UKF objects
- Each engine provides specialized search capabilities optimized for different query patterns
- Available engine implementations:
  - **FacetKLEngine**: Multi-dimensional faceted search supporting complex filtering and aggregation
  - **DAACKLEngine**: Dynamic autocomplete engine for prefix-based and fuzzy matching
  - **VectorKLEngine**: Semantic similarity search using vector embeddings

**Orchestration Model:**
KLBase coordinates between these layers by routing data operations to the appropriate backends. When a UKF object is inserted or updated, KLBase propagates the changes to all specified storages and engines to maintain consistency. When searching, KLBase delegates queries to the appropriate engine and retrieves full objects from the associated storage backend.

<br/>

## 3. Class Definition

### 3.1. Constructor

```python
class KLBase(ToolRegistry):
    def __init__(
        self,
        storages: Optional[Union[List[BaseKLStore], Dict[str, BaseKLStore]]] = None,
        engines: Optional[Union[List[BaseKLEngine], Dict[str, BaseKLEngine]]] = None,
        name: Optional[str] = None,
        *args,
        **kwargs,
    ):
```

**Parameters:**

- **storages** (`Optional[Union[List[BaseKLStore], Dict[str, BaseKLStore]]]`): 
  - Storage backends for persisting UKF objects
  - Can be provided as a list (indexed by `storage.name`) or dict (custom keys)
  - Defaults to empty dict if None
  
- **engines** (`Optional[Union[List[BaseKLEngine], Dict[str, BaseKLEngine]]]`): 
  - Search/retrieval engines for querying UKF objects
  - Can be provided as a list (indexed by `engine.name`) or dict (custom keys)
  - Defaults to empty dict if None
  
- **name** (`Optional[str]`): 
  - Identifier for this KLBase instance
  - Defaults to "default" if None

<br/>

### 3.2. Storage Management

#### 3.2.1. Adding Storage

```python
def add_storage(self, storage: BaseKLStore, name: Optional[str] = None):
```

Registers a new storage backend.

**Parameters:**
- **storage** (`BaseKLStore`): The storage instance to add
- **name** (`Optional[str]`): Registration key (defaults to `storage.name`)

#### 3.2.2. Removing Storage

```python
def del_storage(self, name: str):
```

Unregisters and removes a storage backend.

**Parameters:**
- **name** (`str`): The registration key of the storage to remove

<br/>

### 3.3. Engine Management

#### 3.3.1. Adding Engine

```python
def add_engine(self, engine: BaseKLEngine, name: Optional[str] = None):
```

Registers a new search/retrieval engine.

**Parameters:**
- **engine** (`BaseKLEngine`): The engine instance to add
- **name** (`Optional[str]`): Registration key (defaults to `engine.name`)

#### 3.3.2. Removing Engine

```python
def del_engine(self, name: str):
```

Unregisters and removes an engine.

**Parameters:**
- **name** (`str`): The registration key of the engine to remove

<br/>

## 4. Data Operations

All data operations support selective storage/engine targeting via the `storages` and `engines` parameters. If not specified, operations apply to **all** registered storages/engines.

### 4.1. Insert/Upsert Operations

#### 4.1.1. Single Upsert

```python
def upsert(self, kl: BaseUKF, storages: List[str] = None, engines: List[str] = None):
```

Insert or update a single UKF object across specified storages and engines.

**Parameters:**
- **kl** (`BaseUKF`): The knowledge item to upsert
- **storages** (`List[str]`, optional): Target storage names (defaults to all)
- **engines** (`List[str]`, optional): Target engine names (defaults to all)

#### 4.1.2. Single Insert

```python
def insert(self, kl: BaseUKF, storages: List[str] = None, engines: List[str] = None):
```

Insert a new UKF object (may raise error if already exists, depending on backend).

**Parameters:** Same as `upsert`

#### 4.1.3. Batch Upsert

```python
def batch_upsert(self, kls: List[BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

Bulk upsert multiple UKF objects (more efficient than individual upserts).

**Parameters:**
- **kls** (`List[BaseUKF]`): List of knowledge items to upsert
- **storages/engines**: Same as single upsert

#### 4.1.4. Batch Insert

```python
def batch_insert(self, kls: List[BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

Bulk insert multiple UKF objects.

**Parameters:** Same as `batch_upsert`

<br/>

#### 4.1.5. Selective Synchronization

Control which storages/engines receive updates:

```python
# Only update database storage
klbase.upsert(kl, storages=["db_store"], engines=[])

# Only update search engines
klbase.upsert(kl, storages=[], engines=["facet_engine", "vec_engine"])

# Update everything (default)
klbase.upsert(kl)
```

<br/>

### 4.2. Remove Operations

#### 4.2.1. Single Remove

```python
def remove(self, key: Union[int, str, BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

Remove a single UKF object by key.

**Parameters:**
- **key** (`Union[int, str, BaseUKF]`): ID, name, or UKF instance to remove
- **storages/engines**: Target backends (defaults to all)

#### 4.2.2. Batch Remove

```python
def batch_remove(self, keys: List[Union[int, str, BaseUKF]], storages: List[str] = None, engines: List[str] = None):
```

Bulk remove multiple UKF objects.

**Parameters:**
- **keys** (`List[Union[int, str, BaseUKF]]`): List of identifiers to remove
- **storages/engines**: Target backends (defaults to all)

#### 4.2.3. Clear All

```python
def clear(self, storages: List[str] = None, engines: List[str] = None):
```

Remove all UKF objects from specified storages and engines.

**Parameters:**
- **storages/engines**: Target backends to clear (defaults to all)

<br/>

### 4.3. Search Operations

```python
def search(self, engine: str, *args, **kwargs) -> Iterable[Dict[str, Any]]:
```

Execute a search query using a specified engine.

**Parameters:**
- **engine** (`str`): Name of the engine to use
- ***args, **kwargs**: Engine-specific search parameters

**Returns:**
- `Iterable[Dict[str, Any]]`: List of search results as dictionaries

**Standard Result Keys** (engine-dependent):
- `"id"` (`int`): UKF object identifier
- `"kl"` (`BaseUKF`): The actual UKF instance (if engine is recoverable)
- Additional keys vary by engine type (e.g., `"score"` for vector search, `"rank"` for autocomplete)

**Example:**
```python
# Faceted search
results = klbase.search(engine='facet_engine', mode='facet', tags=Facet.NF(slot="TOPIC", value="math"))

# Vector search
results = klbase.search(engine='vec_engine', query="fibonacci sequence", topk=5)

# Autocomplete
results = klbase.search(engine='ac_engine', query="Fibo", topk=10)
```

<br/>

### 4.4. Listing Search Methods

```python
def list_search(self) -> List[Tuple[str, Optional[str]]]:
```

Enumerate all available search methods across registered engines.

**Returns:**
- `List[Tuple[str, Optional[str]]]`: List of (engine_name, search_mode) pairs
  - `engine_name`: Name of the engine
  - `search_mode`: Engine's search mode (optional, None if engine has only one mode)

**Example:**
```python
search_methods = klbase.list_search()
# [('facet_engine', 'facet'), ('ac_engine1', None), ('vec_engine', 'vector')]
```

<br/>

## 5. Creating Custom KLBase Applications

The typical workflow for creating a KLBase-powered application:

### 5.1. Inherit KLBase

```python
from ahvn.klbase import KLBase
from ahvn.klstore import DatabaseKLStore, CacheKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine, VectorKLEngine
from ahvn.tool.mixin import reg_toolspec

class MyKLBase(KLBase):
    def __init__(self, name: str, path: Optional[str] = None):
        super().__init__(name=name)
        self.path = path or f"./.ahvn/{self.name}/"
        
        # Configure storages and engines (see below)
```

<br/>

### 5.2. Configure Storages and Engines

In the `__init__` method, set up your storage and engine combinations:

```python
# Example: Multiple storage backends
self.add_storage(
    CacheKLStore(name="cache_store", cache=JsonCache(path=f"{self.path}/cache"))
)
self.add_storage(
    DatabaseKLStore(name="db_store", provider="pg", database="my_db")
)

# Example: Faceted search engine
self.add_engine(
    FacetKLEngine(
        name="facet_engine",
        storage=self.storages["db_store"],
        inplace=True,  # Use storage's native query capabilities
    )
)

# Example: Autocomplete engine for knowledge items
self.add_engine(
    DAACKLEngine(
        name="ac_by_name",
        storage=self.storages["db_store"],
        path=f"{self.path}/ac_index",
        encoder=lambda kl: [kl.name or "", kl.content or ""],
        condition=lambda kl: kl.type == "knowledge",
    )
)

# Example: Vector search engine for experience items
self.add_engine(
    VectorKLEngine(
        name="vec_engine",
        provider="pgvector",
        collection="vec_collection",
        storage=self.storages["db_store"],
        encoder=(
            lambda kl: f"{kl.name} | {kl.content}",
            lambda query: query
        ),
        embedder="embedder",  # References configured embedder
        condition=lambda kl: kl.type == "experience",
    )
)
```

**Key Considerations:**

- **Storage Selection**: Choose based on persistence needs (cache for temporary, database for long-term)
- **Engine-Storage Pairing**: Engines typically reference a storage backend for data retrieval
- **Inplace vs. External Indexing**: 
  - `inplace=True`: Use storage's native query (e.g., SQL WHERE clauses)
  - `inplace=False`: Maintain separate index structures
- **Conditional Indexing**: Use `condition` lambda to selectively index UKF objects (e.g., by type)

<br/>

### 5.3. Define Tool Specifications

Use the `@reg_toolspec()` decorator to expose methods as agent-callable tools:

```python
from typing import Dict, Any
from ahvn.utils.db.facet import Facet

class MyKLBase(KLBase):
    # ... __init__ configuration ...
    
    @reg_toolspec()
    def facet_search(
        self, 
        facets: Dict[str, Any], 
        topk: int = 20, 
        offset: int = 0
    ) -> Dict[str, Any]:
        """Perform a facet search on the KLBase.
        
        Args:
            facets (Dict[str, Any]): A dictionary of facet criteria.
                Each facet is a key-value pair where the key is the facet name
                and the value is the desired value or condition.
                For complex conditions, use Facet.NF, Facet.LIKE, Facet.OR, etc.
                Example:
                    {
                        "tags": Facet.NF(slot="TOPIC", value=Facet.LIKE("math%")),
                        "priority": Facet.OR([42, 7]),
                        "type": "knowledge"
                    }
                Supported fields: id, name, type, content, tags, synonyms, priority
            topk (int, optional): Maximum number of results. Defaults to 20.
            offset (int, optional): Number of initial results to skip. Defaults to 0.
            
        Returns:
            Dict[str, Any]: Dictionary with keys:
                - "cnt" (int): Total count of matching items
                - "kls" (List[BaseUKF]): Top-k matching knowledge items
        """
        ids = self.engines['facet_engine'].search(
            mode='facet', include=['id'], **facets
        )
        return {
            "cnt": len(ids),
            "kls": [
                self.engines['facet_engine'].storage.get(id=id_) 
                for id_ in ids[offset:offset+topk]
            ]
        }
    
    @reg_toolspec()
    def vector_search(
        self, 
        query: str, 
        topk: int = 5
    ) -> List[Dict[str, Any]]:
        """Perform semantic vector search.
        
        Args:
            query (str): Natural language search query
            topk (int, optional): Number of results to return. Defaults to 5.
            
        Returns:
            List[Dict[str, Any]]: Search results with keys:
                - "id" (int): UKF object ID
                - "kl" (BaseUKF): The knowledge item
                - "score" (float): Similarity score
        """
        return self.search(
            engine='vec_engine',
            query=query,
            include=["id", "kl", "score"],
            topk=topk
        )
```

**Best Practices for Tool Definitions:**

1. **Comprehensive Docstrings**: Include detailed descriptions, parameter types, and examples (automatically parsed by `@reg_toolspec`)
2. **Sensible Defaults**: Provide default values for optional parameters
3. **Structured Returns**: Return dictionaries or structured objects for easy agent parsing
4. **Error Handling**: Consider wrapping engine calls in try-except for graceful failure
5. **Parameter Validation**: Validate inputs before passing to underlying engines

<br/>

### 5.4. Export Tools for Agent Use

```python
# Instantiate your KLBase
klbase = MyKLBase(name="my_app_kb")

# Export all @reg_toolspec tools as ToolSpec objects
tools = klbase.to_toolspecs()

# List available tools
tool_names = klbase.list_toolspecs()
print(tool_names)  # ['facet_search', 'vector_search']

# Use tools directly
result = tools['facet_search'](facets={"type": "knowledge"}, topk=10)

# Or integrate with agent frameworks
# (e.g., pass tools to LLM function calling, MCP servers, etc.)
```

<br/>

## 6. Complete Example

Below is a complete example demonstrating KLBase usage (from `db_demo.py`):

```python
from ahvn.ukf import Knowledge, Experience, ptags
from ahvn.cache import InMemCache, JsonCache
from ahvn.klstore import DatabaseKLStore, CacheKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine, VectorKLEngine
from ahvn.klbase import KLBase
from ahvn.tool.mixin import reg_toolspec
from ahvn.utils.db.facet import Facet

class MyKLBase(KLBase):
    def __init__(self, name: str, path: Optional[str] = None):
        super().__init__(name=name)
        self.path = path or f"./.ahvn/{self.name}/"
        
        # Storage 1: JSON cache for fast local access
        self.add_storage(
            CacheKLStore(
                name="store1",
                cache=JsonCache(path=f"{self.path}/store1")
            )
        )
        
        # Storage 2: PostgreSQL database for persistent storage
        self.add_storage(
            DatabaseKLStore(
                name="store2",
                provider="pg",
                database="store2"
            )
        )
        
        # Engine 1: Faceted search on database
        self.add_engine(
            FacetKLEngine(
                name="facet_engine",
                storage=self.storages["store2"],
                inplace=True,
            )
        )
        
        # Engine 2: Autocomplete by name and content
        self.add_engine(
            DAACKLEngine(
                name="ac_engine1",
                storage=self.storages["store2"],
                path=f"{self.path}/ac_index_by_name_content",
                encoder=lambda kl: [kl.name or "", kl.content or ""],
                condition=lambda kl: kl.type == "knowledge",
            )
        )
        
        # Engine 3: Autocomplete by synonyms
        self.add_engine(
            DAACKLEngine(
                name="ac_engine2",
                storage=self.storages["store2"],
                path=f"{self.path}/ac_index_by_synonyms",
                encoder=lambda kl: [syn or "" for syn in kl.synonyms],
                condition=lambda kl: kl.type == "knowledge",
            )
        )
        
        # Engine 4: Vector search for experiences
        self.add_engine(
            VectorKLEngine(
                name="vec_engine",
                provider="pgvector",
                collection="vec_store2",
                storage=self.storages["store2"],
                inplace=False,
                include=["id"],
                encoder=(
                    lambda kl: f"{kl.name or ''} | {kl.content or ''}",
                    lambda query: query
                ),
                embedder="embedder",
                condition=lambda kl: kl.type == "experience",
            )
        )
    
    @reg_toolspec()
    def facet_search(
        self,
        facets: Dict[str, Any],
        topk: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Perform a facet search on the KLBase."""
        ids = self.engines['facet_engine'].search(
            mode='facet', include=['id'], **facets
        )
        return {
            "cnt": len(ids),
            "kls": [
                self.engines['facet_engine'].storage.get(id=id_)
                for id_ in ids[offset:offset+topk]
            ]
        }

# Usage example
if __name__ == "__main__":
    klbase = MyKLBase(name="my_klbase")
    klbase.clear()
    
    # 1. Create and insert knowledge items
    kl1 = Knowledge(
        name="Fibonacci Sequence",
        type="knowledge",
        content="The Fibonacci sequence is a series of numbers...",
        tags=ptags(TOPIC="math", ENTITY="object"),
        synonyms=["Fibonacci numbers", "Fibonacci series"],
    )
    klbase.batch_upsert([kl1])
    
    # 2. Generate experiences from function cache
    cache = InMemCache()
    
    @cache.memoize()
    def fibonacci(n: int) -> int:
        if n <= 1:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)
    
    fibonacci(100)
    
    exps = [
        Experience.from_cache_entry(
            entry,
            tags=ptags(
                TOPIC="math",
                NUMBER=[str(entry.inputs['n']), str(entry.output)]
            ),
            synonyms=[f"fibonacci({entry.inputs['n']})", f"{entry.output}"]
        )
        for entry in cache
    ]
    klbase.batch_upsert(exps)
    
    # 3. Search using different engines
    # Faceted search
    for kl in klbase.search(
        engine='facet_engine',
        mode='facet',
        tags=Facet.NF(slot="TOPIC", value=Facet.LIKE("math%"))
    ):
        print(kl)
    
    # Autocomplete search
    for kl in klbase.search(engine='ac_engine1', query="Fibonacci"):
        print(kl)
    
    # Vector search
    for kl in klbase.search(
        engine='vec_engine',
        query="fibonacci 63",
        include=["id", "kl", "score"],
        topk=3
    ):
        print(kl)
```

<br/>

## Further Exploration

> **Tip:** For deeper understanding of KLBase components, see:
> - [UKF](./ukf/index.md) - Data model for knowledge items
> - [KLStore](./klstore/index.md) - Storage layer for knowledge objects
> - [KLEngine](./klengine/index.md) - Search engine implementations built on top of KLStores
> - [Tool Specifications](./toolspec/index.md) - Agent integration details

<br/>
