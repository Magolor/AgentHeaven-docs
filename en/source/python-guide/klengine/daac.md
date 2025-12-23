# DAACKLEngine

DAACKLEngine is a high-performance [BaseKLEngine](./base.md) implementation that uses the Double-Array Aho-Corasick (DAAC) Automaton for efficient multi-pattern string matching. It excels at finding all occurrences of known entity strings within text queries, with a time complexity linear to the query only, regardless of the number of patterns, making it ideal for entity recognition, named entity linking, and keyword-based knowledge retrieval.

## 1. Introduction

### 1.1. What is DAAC String Search?

**DAACKLEngine** leverages the Aho-Corasick automaton — a powerful data structure that can search for multiple patterns simultaneously in linear time.

- **Input**: A text query (e.g., "I'm learning Python and JavaScript for web development")
- **Indexed Patterns**: Known entity strings extracted from your knowledge objects (e.g., "Python", "JavaScript", "web development")
- **Output**: All matching knowledge objects with their positions in the query text
- **Speed**: Searches thousands of patterns in a single pass, regardless of pattern count

The "Double-Array" implementation provides memory-efficient storage and fast state transitions, making it suitable for large-scale knowledge bases with tens of thousands of entities.

<br/>

### 1.2. When to Use DAACKLEngine

**Ideal Use Cases:**
- **Entity Recognition**: Identify all known entities (people, places, organizations, technical terms) mentioned in text
- **Keyword-Based Retrieval**: Find knowledge objects by exact or normalized string matching
- **Multi-Language Support**: Works with any character set through custom normalization
- **Alias Resolution**: Handle multiple synonyms and variations of entity names

**Not Suitable For:**
- **Semantic Search**: Use [VectorKLEngine](./vector.md) for meaning-based similarity
- **Structured Filtering**: Use [FacetKLEngine](./facet.md) for metadata-based queries
- **Fuzzy Matching**: DAAC performs exact pattern matching (after normalization)

<br/>

### 1.3. Key Features

- **Multi-Pattern Search**: Search for thousands of patterns simultaneously in O(n+m+z) time, where n is query length, m is total pattern length, and z is number of matches
- **Flexible String Encoding**: Extract searchable strings from knowledge objects using custom encoder functions
- **Text Normalization**: Apply custom normalization (lowercase, accent removal, etc.) for robust matching
- **Conflict Resolution**: Handle overlapping matches with multiple strategies (overlap, longest, longest_distinct)
- **Whole Word Matching**: Optionally match only complete words, not substrings
- **Persistent Storage**: Save and load automaton state to disk for fast initialization
- **Lazy Deletion**: Efficient batch removal with deferred automaton rebuilding
- **Inverse Mode**: Build automaton on reversed strings for optimized suffix matching

<br/>

## 2. Quick Start

### 2.1. Basic Usage

```python
from ahvn.klengine import DAACKLEngine
from ahvn.klstore import CacheKLStore
from ahvn.cache import InMemCache
from ahvn.ukf import BaseUKF

# Create storage and populate with knowledge objects
cache = InMemCache()
store = CacheKLStore(cache=cache)

languages = [
    BaseUKF(name="Python", type="language", 
            synonyms=["python", "py", "python3"]),
    BaseUKF(name="JavaScript", type="language",
            synonyms=["javascript", "js", "ECMAScript"]),
    BaseUKF(name="Java", type="language",
            synonyms=["java", "JDK"]),
]
store.batch_upsert(languages)

# Create DAAC engine with synonym-based encoder
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac_index",
    encoder=lambda kl: list(kl.synonyms),  # Use synonyms as searchable strings
    normalizer=True,  # Enable default normalization (lowercase + trim)
)

# Index knowledge objects
for kl in store:
    engine.upsert(kl)
engine.flush()  # Build the automaton

# Search for entities in text
query = "I'm learning Python and JavaScript for web development"
results = engine.search(query=query, include=["id", "kl", "matches"])

for result in results:
    kl = result["kl"]
    matches = result["matches"]  # List of (start, end) positions
    print(f"Found '{kl.name}' at positions: {matches}")
# Output:
# Found 'Python' at positions: [(14, 20)]
# Found 'JavaScript' at positions: [(25, 35)]
```

<br/>

### 2.2. Initialization Parameters

- **`storage`** (required): A `BaseKLStore` instance for retrieving full knowledge objects
- **`path`** (required): Local directory path to store automaton files (synonyms.json, ac.pkl, metadata.json)
- **`encoder`** (required): Function to extract searchable strings from BaseUKF objects
  - Signature: `Callable[[BaseUKF], List[str]]`
  - Example: `lambda kl: list(kl.synonyms)` to use all synonyms
  - Example: `lambda kl: [kl.name] + list(kl.synonyms)` to include name and synonyms
- **`min_length`** (optional): Minimum string length to index (default: 2). Shorter strings are ignored.
- **`inverse`** (optional): Build automaton on reversed strings for suffix matching optimization (default: True)
- **`normalizer`** (optional): Text normalization function (default: None)
  - `True`: Use default normalizer (lowercase + whitespace trimming)
  - `False` or `None`: No normalization
  - `Callable[[str], str]`: Custom normalization function
- **`name`** (optional): Name of the KLEngine instance (default: "{storage.name}_daac_idx")
- **`condition`** (optional): Filter function to conditionally index objects (default: None)

<br/>

## 3. Search Operations

### 3.1. Default Search

The primary search method matches patterns within the query string:

```python
results = engine.search(
    query="Python is great for data science and machine learning",
    include=["id", "kl", "matches"]
)
```

**Search Parameters:**
- **`query`** (str): The text to search within
- **`conflict`** (str): Strategy for handling overlapping matches (see section 3.2)
- **`whole_word`** (bool): Only match complete words (default: False)
- **`include`** (Iterable[str]): Fields to include in results
  - `"id"`: Knowledge object ID (int)
  - `"kl"`: Full BaseUKF object (retrieved from storage)
  - `"query"`: The normalized query string used for matching
  - `"matches"`: List of (start, end) tuples indicating match positions

<br/>

### 3.2. Conflict Resolution Strategies

When multiple patterns overlap in the query text, use the `conflict` parameter to control which matches are returned:

```python
# Example query with overlapping matches
# Query: "pneumonoultramicroscopicsilicovolcanoconiosis"
# Patterns: "pneu", "monoultra", "ultra", "micro", "microscopic", "ultramicroscopic", "volcano" (1), "volcano" (2)

# Strategy 1: Return all matches (including overlaps)
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="overlap")
# Returns: "pneu", "monoultra", "ultra", "micro", "microscopic", "ultramicroscopic", "volcano" (1), "volcano" (2)

# Strategy 2: Keep only the longest match per position
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="longest")
# Returns: "pneu", "monoultra", "microscopic", "volcano" (could be either 1 or 2)

# Strategy 3: Allow distinct entities to match to the same word segment, but not crossing
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="longest_distinct")
# Returns: "pneu", "monoultra", "microscopic", "volcano" (1), "volcano" (2)
```

**Conflict Strategies:**
- **`"overlap"`**: Return all matches, including overlapping ones (default)
- **`"longest"`**: Keep only the longest match for any overlapping set
- **`"longest_distinct"`**: Allow distinct entities to match to the same word segment, but not crossing

<br/>

### 3.3. Whole Word Matching

Restrict matches to complete words (bounded by delimiters):

```python
# Without whole_word: matches "java" in "javascript"
results = engine.search(query="I love javascript", whole_word=False)
# May return: Java object (if "java" is indexed)

# With whole_word: only matches standalone "java"
results = engine.search(query="I love javascript", whole_word=True)
# Returns: nothing (no standalone "java")

results = engine.search(query="I love Java programming", whole_word=True)
# Returns: Java object (standalone match)
```

<br/>

### 3.4. Flexible Result Inclusion

Control which fields appear in search results:

```python
# Minimal: IDs only (fastest)
results = engine.search(query="Python", include=["id"])
# [{"id": 123}]

# With knowledge objects
results = engine.search(query="Python", include=["id", "kl"])
# [{"id": 123, "kl": <BaseUKF object>}]

# With match positions
results = engine.search(query="Python and Java", include=["id", "matches"])
# [{"id": 123, "matches": [(0, 6)]}, {"id": 456, "matches": [(11, 15)]}]

# Full details
results = engine.search(query="Python", include=["id", "kl", "query", "matches"])
# [{"id": 123, "kl": <BaseUKF>, "query": "python", "matches": [(0, 6)]}]
```

<br/>

## 4. Index Maintenance

### 4.1. Inserting and Updating

It is worth addressing that DAAC does not support online updates with query. It is required to rebuild the entire automaton after insertions or updates. Use `flush()` to rebuild the automaton after making changes.

```python
# Insert or update a single knowledge object
kl = BaseUKF(name="TypeScript", type="language", synonyms=["typescript", "ts"])
store.upsert(kl)  # Add to storage
engine.upsert(kl)  # Index in DAAC engine
engine.flush()    # Rebuild automaton

# Batch insert (more efficient)
new_kls = [kl1, kl2, kl3]
store.batch_upsert(new_kls)
engine.batch_upsert(new_kls)
engine.flush()
```

**Note:** Changes are persisted to disk automatically via `save()` after each upsert. Call `flush()` to rebuild the automaton and apply lazy deletions.

<br/>

### 4.2. Removing Knowledge Objects

DAACKLEngine uses **lazy deletion** for efficiency, that is, the string is not immediately removed from the automaton upon calling `remove()`. Instead, it is marked for deletion and the actual removal occurs when `flush()` is called to rebuild the automaton. This allows immediate query with removals without waiting for a full rebuild.

```python
# Remove a single object (lazy deletion)
engine.remove(kl_id)
# Marked for deletion, but automaton not yet rebuilt

# Batch remove (lazy)
engine.batch_remove([id1, id2, id3])

# Apply deletions and rebuild automaton
engine.flush()
```

<br/>

### 4.3. Clearing the Index

```python
# Remove all knowledge objects from the engine
engine.clear()
# Automaton is reset and saved to disk
```

<br/>

## 5. Text Normalization

### 5.1. Default Normalization

The default normalizer includes tokenization, stop word removal, lemmatization, and lowercasing.

```python
# Enable default normalization (lowercase + trim)
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=True  # Case-insensitive matching
)

# Matches "PYTHON", "Python", "python" all as the same pattern, "programming" -> "program", etc.
results = engine.search(query="I love PYTHON programming")
```

<br/>

### 5.2. Custom Normalization

```python
import unicodedata

def custom_normalizer(text: str) -> str:
    """Remove accents and convert to lowercase."""
    # Decompose accented characters
    nfd = unicodedata.normalize('NFD', text)
    # Remove accent marks
    without_accents = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    return without_accents.lower().strip()

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=custom_normalizer
)

# Now "café", "cafe", "CAFÉ" all match the same pattern
```

<br/>

### 5.3. No Normalization

```python
# Exact, case-sensitive matching
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=None  # or False
)

# "Python" != "python" (different patterns)
```

<br/>

## 6. Encoder Functions

Notice that unlike the encoder used in VectorKLEngine, which typically converts knowledge object content into a single text, here the encoder function converts each knowledge object into a **list** of strings that represent the patterns to be indexed in the DAAC automaton. This allows for flexible extraction of multiple searchable strings per knowledge object, such as synonyms, aliases, or keywords.

### 6.1. Using Synonyms (Recommended)

```python
# Use all synonyms as searchable strings
encoder = lambda kl: list(kl.synonyms)

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=encoder
)

# Knowledge object with synonyms
kl = BaseUKF(
    name="Python",
    type="language",
    synonyms=["python", "py", "python3", "Python3"]
)
engine.upsert(kl)

# All synonyms will match this knowledge object
```

<br/>

### 6.2. Combining Name and Synonyms

```python
# Include both name and synonyms
encoder = lambda kl: [kl.name] + list(kl.synonyms or [])

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=encoder
)
```

<br/>

### 6.3. Custom Extraction Logic

```python
# Extract strings from metadata or content
def custom_encoder(kl: BaseUKF) -> List[str]:
    strings = [kl.name]
    
    # Add synonyms
    if kl.synonyms:
        strings.extend(kl.synonyms)
    
    # Add metadata keywords
    if kl.metadata and "keywords" in kl.metadata:
        strings.extend(kl.metadata["keywords"])
    
    # Filter out short strings
    return [s for s in strings if len(s) >= 3]

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=custom_encoder
)
```

<br/>

## 7. Persistence and State Management

### 7.1. Automatic Persistence

```python
# State is automatically saved after each upsert/remove
engine.upsert(kl)  # Saved to disk immediately
engine.remove(kl_id)  # Saved to disk immediately

# Files created in the specified path:
# - synonyms.json: Mapping of normalized strings to knowledge IDs
# - ac.pkl: Pickled Aho-Corasick automaton
# - metadata.json: min_length, inverse flag, and kl_synonyms mapping
```

<br/>

### 7.2. Loading Existing Index

```python
# Engine automatically loads existing index on initialization
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",  # Existing index directory
    encoder=lambda kl: list(kl.synonyms)
)
# If files exist, index is loaded; otherwise, a new index is created
```

<br/>

### 7.3. Manual Save and Load

```python
# Manually save to a specific path
engine.save(path="/backup/daac_index")

# Manually load from a specific path
engine.load(path="/backup/daac_index")
```

<br/>

### 7.4. Flushing and Closing

```python
# Flush: Apply lazy deletions and rebuild automaton
engine.flush()

# Close: Save state and clear in-memory structures
engine.close()
```

<br/>

## 8. Advanced Features

### 8.1. Inverse Mode (Suffix Matching Optimization)

DAACKLEngine defaults to `inverse=True`, which builds the automaton on reversed strings:

```python
# Default: Automaton built on reversed strings
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    inverse=True  # Default
)

# This optimizes suffix matching patterns
# Query "learning machine" with pattern "machine" reversed as "enihcam"
# Matches are automatically re-mapped to original positions
```

Due to linguistic patterns, suffix matching is often more efficient and often "more correct" when resolving ambiguities. Such behavior is especially beneficial for languages including Chinese.

<br/>

### 8.2. Minimum Length Filtering

```python
# Only index strings with 3+ characters
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    min_length=3
)

# Short strings like "py", "js" are ignored
# Reduces automaton size and avoids over-matching
```

<br/>

### 8.3. Conditional Indexing

```python
# Only index knowledge objects of specific types
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    condition=lambda kl: kl.type in ["language", "framework"]
)

# Knowledge objects of other types are ignored
```

<br/>

### 8.4. Synchronization with Storage

```python
# After external changes to storage, sync the engine
store.batch_upsert([kl1, kl2, kl3])  # Modified outside engine

# Re-index all objects from storage
engine.sync()
```

<br/>

## 9. Complete Example

```python
from ahvn.klengine import DAACKLEngine
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF
import tempfile

# Create database storage
store = DatabaseKLStore(provider="sqlite", database=":memory:")

# Populate with technical entities
entities = [
    BaseUKF(
        name="Python",
        type="programming_language",
        content="High-level programming language",
        synonyms=["python", "py", "python3"],
        metadata={"paradigm": "multi-paradigm"}
    ),
    BaseUKF(
        name="Machine Learning",
        type="field",
        content="Subset of artificial intelligence",
        synonyms=["machine learning", "ml", "ML"],
        metadata={"domain": "ai"}
    ),
    BaseUKF(
        name="Neural Network",
        type="algorithm",
        content="Computing systems inspired by biological neural networks",
        synonyms=["neural network", "neural net", "nn"],
        metadata={"category": "deep_learning"}
    ),
    BaseUKF(
        name="Natural Language Processing",
        type="field",
        content="Interaction between computers and human language",
        synonyms=["nlp", "NLP", "natural language processing"],
        metadata={"domain": "ai"}
    ),
]
store.batch_upsert(entities)

# Create DAAC engine with synonym-based indexing
with tempfile.TemporaryDirectory() as tmpdir:
    engine = DAACKLEngine(
        storage=store,
        path=tmpdir,
        encoder=lambda kl: list(kl.synonyms),  # Use all synonyms
        min_length=2,
        normalizer=True,  # Case-insensitive
        condition=lambda kl: kl.type in ["programming_language", "field", "algorithm"]
    )
    
    # Index all entities
    for entity in store:
        engine.upsert(entity)
    engine.flush()
    
    print(f"Indexed {len(engine)} entities")
    
    # Search example
    query = "I'm using Python for NLP and machine learning with neural networks"
    results = engine.search(
        query=query,
        conflict="longest_distinct",
        whole_word=True,
        include=["id", "kl", "matches"]
    )
    
    print(f"\nFound {len(results)} entities in query:")
    for result in results:
        kl = result["kl"]
        matches = result["matches"]
        print(f"- {kl.name} ({kl.type})")
        for start, end in matches:
            matched_text = query[start:end]
            print(f"  → '{matched_text}' at position {start}-{end}")
    
    # Output:
    # Indexed 4 entities
    #
    # Found 4 entities in query:
    # - Python (programming_language)
    #   → 'Python' at position 11-17
    # - Natural Language Processing (field)
    #   → 'NLP' at position 22-25
    # - Machine Learning (field)
    #   → 'machine learning' at position 30-46
    # - Neural Network (algorithm)
    #   → 'neural networks' at position 52-67
    
    # Clean up
    engine.close()
```

<br/>

## Further Exploration

> **Tip:** For the base interface and common functionality, see:
> - [BaseKLEngine](./base.md) - Abstract base class defining the KLEngine interface and shared functionality

> **Tip:** For complementary search engines, see:
> - [FacetKLEngine](./facet.md) - Structured search with ORM-like filtering and SQL queries
> - [VectorKLEngine](./vector.md) - Vector similarity search for semantic retrieval

> **Tip:** For storage backends that work with DAACKLEngine, see:
> - [KLStore](../klstore/index.md) - Storage layer for knowledge objects
> - [CacheKLStore](../klstore/cache.md) - In-memory or disk-based storage
> - [DatabaseKLStore](../klstore/database.md) - Persistent relational storage

> **Tip:** For knowledge object fundamentals, see:
> - [BaseUKF](../ukf/ukf-v1.0.md) - Universal Knowledge Format with synonyms support
> - [UKF Data Types](../ukf/data-types.md) - Data type mappings for UKF fields

<br/>
