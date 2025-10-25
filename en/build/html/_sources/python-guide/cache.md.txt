# Cache

AgentHeaven provides a flexible caching system with multiple backend options. This guide covers how to use the cache system effectively for performance optimization.

<br/>

## 1. Basic Caching Example
This example shows how to cache a recursive Fibonacci function. The first call computes the value and stores it in cache, while subsequent calls retrieve the cached result instantly.

```python
from ahvn.cache import InMemCache

cache = InMemCache()

@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n-2) + fibonacci(n-1)

# First call computes, second uses cache
print(fibonacci(30))  # Computed - takes time
print(fibonacci(30))  # Cached - instant result
```

<br/>

## 2. Async Support Example
Demonstrates caching for async functions. Useful for API calls, database queries, or any async operations that benefit from caching.

```python
import asyncio
from ahvn.cache import InMemCache

cache = InMemCache()

@cache.memoize()
async def async_operation(x):
    await asyncio.sleep(1)  # Simulate async work like API call
    return x * 2

# Usage
result = await async_operation(5)  # Takes 1 second (first call)
result = await async_operation(5)  # Instant from cache (second call)
```

<br/>

## 3. Cache Backends

### 3.1. In-Memory Cache (Fastest)
Simple dictionary-based cache stored in RAM. Ideal for development and temporary caching where persistence isn't required.

```python
from ahvn.cache import InMemCache

cache = InMemCache()
```
- **Pros**: Fastest, no I/O overhead
- **Cons**: Volatile (lost on restart), memory-limited
- **Use case**: Development, temporary caching

<br/>

### 3.2. diskcache (Compressed Local Database)
Uses the `diskcache` library for filesystem-based persistent storage. Great for production workloads that need cross-session caching.

```python
from ahvn.cache import DiskCache

cache = DiskCache("/tmp/cache_dir", size_limit=32*1024*1024*1024)  # 32GB
```
- **Pros**: Persistent, large capacity, thread-safe
- **Cons**: Slower than memory
- **Use case**: Production workloads, cross-session caching

<br/>

### 3.3. Database Cache (Scalable)
SQL database-backed cache supporting SQLite, PostgreSQL, and MySQL. Perfect for multi-user applications and scalable deployments.

```python
from ahvn.cache import DatabaseCache

# SQLite - lightweight file-based database
sqlite_cache = DatabaseCache(provider="sqlite", database="cache.db")

# PostgreSQL - enterprise database solution
pg_cache = DatabaseCache(
    provider="postgresql",
    database="mydb",
)
```
- **Pros**: Scalable, queryable, concurrent access
- **Cons**: Database overhead
- **Use case**: Multi-user applications, large datasets

<br/>

### 3.4. JSON Cache (Debuggable)
Stores each cache entry as a separate JSON file. Excellent for debugging and inspection during development.

```python
from ahvn.cache import JsonCache

cache = JsonCache("/tmp/json_cache")
```
- **Pros**: Human-readable, easy to debug
- **Cons**: Slower, file system overhead
- **Use case**: Development, debugging, inspection

<br/>

### 3.5. No Cache (Development)
Always misses cache, forcing fresh computation. Useful for testing and debugging cache behavior without performance impact.

```python
from ahvn.cache import NoCache

cache = NoCache()
```
- **Pros**: No caching, always computes fresh
- **Cons**: No performance benefit
- **Use case**: Testing, debugging cache issues

<br/>

### 3.6. Callback Cache (Event-Driven)
Event-driven cache that triggers callbacks on cache operations without storing data. Perfect for monitoring, logging, or implementing custom cache behaviors through callbacks and feed functions.

```python
from ahvn.cache import CallbackCache

# Define callbacks for cache set events
def log_cache_set(key, value):
    print(f"Cache set: {key} = {value}")

def monitor_memory(key, value):
    # Custom memory monitoring logic
    print(f"Memory usage after setting {key}")

# Define feed functions for cache get events
def fast_computation(func, **kwargs):
    """Provide fast alternative for specific inputs"""
    if kwargs.get('x', 0) < 100:
        return kwargs['x'] * 2  # Fast computation
    return ...  # Let original function handle

def database_lookup(func, **kwargs):
    """Check external database for cached results"""
    # Custom database lookup logic
    return ...  # Continue to next feed or original function

# Create CallbackCache with callbacks and feeds
cache = CallbackCache(
    callbacks=[log_cache_set, monitor_memory],
    feeds=[fast_computation, database_lookup]
)

@cache.memoize()
def expensive_function(x):
    print(f"Computing for {x}")
    return x * x + complex_calculation(x)

# Usage example
result = expensive_function(5)   # Uses fast_computation feed
result = expensive_function(200) # Falls back to expensive_function
```

<br/>

#### 3.6.1. Callback Functions
Callbacks are triggered on cache set operations and receive the cache key and value:

```python
def my_callback(key: int, value: dict):
    """
    Handle cache set events.
    
    Args:
        key: The cache key (integer hash)
        value: Cache entry containing func, inputs, output, and metadata
    """
    print(f"Function: {value['func']}")
    print(f"Inputs: {value['inputs']}")
    print(f"Output: {value['output']}")
    # Custom logic: log to file, update metrics, etc.

# Multiple callbacks are executed in order
cache = CallbackCache(callbacks=[callback1, callback2, callback3])
```

**Callback API**: Each callback must accept `(key: int, value: dict)` parameters where `value` contains:
- `func`: Function name or callable
- `inputs`: Dictionary of function arguments
- `output`: Function return value
- `metadata`: Additional cache metadata

<br/>

#### 3.6.2. Feed Functions
Feeds provide alternative computation or data sources on cache get operations, processed in order until one returns a non-Ellipsis value:

```python
def custom_feed(func, **kwargs):
    """
    Provide alternative computation or data lookup.
    
    Args:
        func: The original function (callable or string name)
        **kwargs: Function arguments provided by caller
    
    Returns:
        Any: Return computed value, or ... to continue to next feed
    """
    # Example: Use pre-computed results for specific inputs
    if func.__name__ == 'fibonacci' and kwargs['n'] <= 10:
        return [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55][kwargs['n']]
    
    # Example: Database lookup
    if kwargs.get('user_id'):
        cached = database.get_user_cache(kwargs['user_id'])
        if cached:
            return cached
    
    return ...  # Continue to next feed or original function

# Feed functions are processed sequentially
cache = CallbackCache(feeds=[fast_lookup, database_check, expensive_computation])
```

**Feed API**: Each feed function must accept `(func, **kwargs)` and return either:
- **Actual value**: Stops feed processing and returns this value
- **Ellipsis (`...`)**: Continues to next feed or original function

<br/>

#### 3.6.3. Error Handling
Both callbacks and feeds include built-in error handling:

```python
def failing_callback(key, value):
    raise ValueError("Callback error!")

def failing_feed(func, **kwargs):
    raise RuntimeError("Feed error!")

# Errors are logged and skipped, processing continues
cache = CallbackCache(
    callbacks=[failing_callback, working_callback],
    feeds=[failing_feed, working_feed]
)
```

- **Callback errors**: Logged, skipped, other callbacks continue
- **Feed errors**: Logged, skipped, next feed or original function called
- **No interruption**: System remains stable despite individual failures

- **Pros**: Event-driven, highly customizable, zero storage overhead
- **Cons**: No actual caching, requires custom implementation for storage
- **Use case**: Monitoring, logging, custom caching layers, A/B testing

<br/>

## 4. CacheEntry Type

The `CacheEntry` class is the fundamental data structure used throughout AgentHeaven's caching system. It encapsulates all information about a cached function call, including the function name, input arguments, output value, expected value, and optional metadata.

<br/>

### 4.1. Basic Structure

A `CacheEntry` contains the following fields:

```python
from ahvn.cache import CacheEntry

# Direct instantiation (rarely needed - typically created by cache backends)
entry = CacheEntry(
    func="my_function",           # Function name (string)
    inputs={"x": 5, "y": 10},    # Input arguments as dict
    output=50,                    # Actual output value
    expected=...,                 # Expected output (... means not set)
    metadata={"timestamp": "..."}  # Optional metadata
)

# Access cache key and value
print(entry.key)    # MD5 hash of inputs + function name
print(entry.value)  # Returns expected if set, otherwise output
```

<br/>

### 4.2. Creating CacheEntry Objects

#### 4.2.1. From Function Arguments
Create a `CacheEntry` from function arguments using `from_args()`:

```python
from ahvn.cache import CacheEntry

def my_function(x, y, z=10):
    return x + y + z

# Create entry from function and arguments
entry = CacheEntry.from_args(
    func=my_function,      # Pass callable or string name
    output=25,             # Function's output
    x=5,                   # Function arguments as kwargs
    y=10,
    z=10,
    exclude=["z"]          # Optionally exclude certain args from key
)

print(entry.func)      # "my_function"
print(entry.inputs)    # {"x": 5, "y": 10} (z excluded)
print(entry.output)    # 25
```

<br/>

#### 4.2.2. From Dictionary
Create a `CacheEntry` from a dictionary representation:

```python
from ahvn.cache import CacheEntry

# Deserialize from dictionary
data = {
    "func": "compute",
    "inputs": {"n": 100},
    "output": 5050,
    "expected": 5050,
    "metadata": {"cached_at": "2025-10-21"}
}

entry = CacheEntry.from_dict(data)
print(entry.func)      # "compute"
print(entry.inputs)    # {"n": 100}
```

<br/>

### 4.3. Working with CacheEntry

#### 4.3.1. Converting to Dictionary
Serialize a `CacheEntry` to a dictionary:

```python
entry = CacheEntry.from_args(func="add", output=15, x=5, y=10)
data = entry.to_dict()

# Returns: {
#     "func": "add",
#     "inputs": {"x": 5, "y": 10},
#     "output": 15,
#     "metadata": {}
# }
```

<br/>

#### 4.3.2. Cloning with Updates
Create a modified copy of a `CacheEntry`:

```python
original = CacheEntry.from_args(func="compute", output=100, n=10)

# Clone with updates
modified = original.clone(
    output=200,              # Update output
    metadata={"v": 2}        # Update metadata
)

print(original.output)  # 100 (unchanged)
print(modified.output)  # 200 (new value)
```

<br/>

#### 4.3.3. Annotation
Annotate a `CacheEntry` with expected output and metadata:

```python
# Create entry from actual computation
entry = CacheEntry.from_args(
    func="fibonacci",
    output=55,
    n=10
)

# Annotate with expected output (for validation/testing)
annotated = entry.annotate(
    expected=55,                          # Set expected output
    metadata={"source": "ground_truth"}   # Add metadata
)

print(annotated.expected)   # 55
print(annotated.annotated)  # True (has expected value)
print(entry.annotated)      # False (original unchanged)

# If expected is omitted, uses output as expected
auto_annotated = entry.annotate()
print(auto_annotated.expected)  # 55 (copied from output)
```

<br/>

### 4.4. Properties

#### 4.4.1. Cache Key
The `key` property returns a unique integer hash identifying the cache entry:

```python
entry = CacheEntry.from_args(func="add", output=15, x=5, y=10)
print(entry.key)  # Integer MD5 hash of inputs + function name

# Same inputs = same key (order-independent for kwargs)
entry2 = CacheEntry.from_args(func="add", output=15, y=10, x=5)
print(entry.key == entry2.key)  # True
```

<br/>

#### 4.4.2. Value
The `value` property returns the expected output if set, otherwise the actual output:

```python
entry = CacheEntry.from_args(func="compute", output=100, n=10)
print(entry.value)  # 100 (no expected set, returns output)

annotated = entry.annotate(expected=99)
print(annotated.value)  # 99 (returns expected, not output)
```

<br/>

#### 4.4.3. Annotated Status
Check if a `CacheEntry` has been annotated with an expected value:

```python
entry = CacheEntry.from_args(func="test", output=42, x=1)
print(entry.annotated)  # False

annotated = entry.annotate(expected=42)
print(annotated.annotated)  # True
```

<br/>

### 4.5. Use Cases

#### 4.5.1. Cache Inspection
Access stored cache entries for debugging or analysis:

```python
from ahvn.cache import DiskCache

cache = DiskCache("/tmp/my_cache")

@cache.memoize()
def compute(x, y):
    return x * y + x + y

# Compute and cache
result = compute(5, 10)

# Manually retrieve and inspect cache entry
# (Implementation depends on cache backend)
# Most backends store CacheEntry objects internally
```

<br/>

#### 4.5.2. Custom Cache Backends
When implementing custom cache backends, use `CacheEntry` for serialization:

```python
from ahvn.cache import BaseCache, CacheEntry

class MyCustomCache(BaseCache):
    def __init__(self):
        self.store = {}
    
    def set(self, key: int, value: Dict[str, Any]):
        # Convert dict to CacheEntry for validation
        entry = CacheEntry.from_dict(value)
        # Store serialized form
        self.store[key] = entry.to_dict()
    
    def get(self, key: int) -> Optional[Dict[str, Any]]:
        return self.store.get(key)
```

<br/>

#### 4.5.3. Testing and Validation
Use `CacheEntry` annotations for test-driven caching:

```python
from ahvn.cache import CacheEntry, InMemCache

# Create expected results for testing
expected_entries = [
    CacheEntry.from_args(func="add", expected=15, x=5, y=10),
    CacheEntry.from_args(func="add", expected=25, x=10, y=15),
]

# Validate cached results against expectations
cache = InMemCache()

@cache.memoize()
def add(x, y):
    return x + y

for entry in expected_entries:
    actual = add(**entry.inputs)
    assert actual == entry.expected, f"Mismatch: {actual} != {entry.expected}"
```

<br/>

## 5. Advanced Usage

### 5.1. Generator Caching
Cache entire generator outputs, useful for streaming data processing or expensive data transformations.

```python
@cache.memoize()
def data_stream(n):
    """Cache entire generator output"""
    for i in range(n):
        yield expensive_computation(i)

# Usage - entire stream cached after first run
for item in data_stream(1000):
    process(item)
```

Notice that Generator output is only cached when the generator completes fully. If the iteration is interrupted by: `break` statements, exceptions, errors, early termination or partial consumption. The partial output will **not** be cached. The cache entry is created only after successful completion of the entire generator.

```python
# Example: Partial consumption won't cache
for item in data_stream(1000):
    if item > 100:  # Early termination
        break      # Generator output NOT cached
    process(item)

# Example: Exception won't cache
try:
    for item in data_stream(1000):
        if item == 500:
            raise ValueError("Processing error")
        process(item)
except ValueError:
    pass  # Generator output NOT cached due to exception

# Example: Full completion will cache
for item in data_stream(1000):
    process(item)  # Entire generator completes - cached successfully
```

<br/>

### 5.2. Batch Memoization
Process multiple inputs efficiently by caching batch operations, reducing overhead for bulk computations.

```python
@cache.batch_memoize()
def process_batch(items):
    """Cache batch operations"""
    return [expensive_operation(item) for item in items]

# Usage
results = process_batch([1, 2, 3, 4, 5])  # Computed - takes time
results = process_batch([1, 2, 3, 4, 5])  # Cached - instant result
```

<br/>

### 5.3. Parameter Exclusion
Exclude specific parameters from cache keys, useful for debug flags, timestamps, or other non-functional parameters.

```python
@cache.memoize(exclude=["debug"])
def compute_with_debug(x, debug=False):
    """Debug parameter excluded from cache key"""
    if debug:
        print(f"Computing for {x}")
    return x * x

# These use same cache entry despite different debug values
cache_result1 = compute_with_debug(5, debug=True)
cache_result2 = compute_with_debug(5, debug=False)
```

<br/>

### 5.4. Manual Cache Operations
Direct control over cache entries for custom caching strategies, manual invalidation, or advanced metadata management.

```python
from ahvn.cache.base import CacheEntry

# Create custom cache entry
entry = CacheEntry(
    func="my_function",
    inputs={"x": 5},
    output=25,
    metadata={"version": "1.0", "timestamp": "2024-01-01"}
)

# Store manually for custom caching
cache.set(entry)

# Retrieve manually for inspection
result = cache.get("my_function", {"x": 5})

# Clear specific entry for targeted invalidation
cache.remove("my_function", {"x": 5})

# Clear entire cache for complete reset
cache.clear()
```

<br/>

### 5.5. Cache Annotation
Add metadata and annotations to cache entries for enhanced debugging, monitoring, and cache management capabilities.

```python
@cache.memoize(annotation={"purpose": "user_profile", "team": "backend"})
def get_user_profile(user_id: int) -> dict:
    """Cache user profiles with team annotation for monitoring"""
    return database.fetch_user(user_id)

@cache.memoize(annotation={"priority": "high", "ttl": "1h"})
def get_realtime_data(sensor_id: str) -> dict:
    """High-priority sensor data with 1-hour TTL"""
    return api.fetch_sensor_data(sensor_id)

# Access annotations during cache inspection
for entry in cache:
    if entry.metadata.get("annotation", {}).get("team") == "backend":
        print(f"Backend cached: {entry.func} with {entry.inputs}")
```

Annotations are stored as metadata alongside cache entries and can be used for:
- **Filtering**: Selectively invalidate or inspect cache entries by annotation
- **Monitoring**: Track cache usage patterns by purpose or team
- **TTL Management**: Override default TTL with annotation-based expiration
- **Debugging**: Identify cache entries by functional purpose

```python
# Filter cache entries by annotation
backend_entries = [
    entry for entry in cache 
    if entry.metadata.get("annotation", {}).get("team") == "backend"
]

# Clear specific annotated cache entries
for entry in cache:
    if entry.metadata.get("annotation", {}).get("purpose") == "user_profile":
        cache.remove(entry.func, entry.inputs)
```

<br/>

### 5.6. Cache Inspection
Browse and analyze cache contents for debugging, monitoring, or cache management purposes.

```python
# Iterate over all cache entries
for entry in cache:
    print(f"Function: {entry.func}")
    print(f"Inputs: {entry.inputs}")
    print(f"Output: {entry.output}")
    print(f"Metadata: {entry.metadata}")
    print("---")
```

<br/>

## 6. Integration Examples

### 6.1. LLM Integration
Cache LLM responses to avoid redundant API calls and reduce costs. Perfect for frequently asked questions or repeated prompts.

```python
from ahvn.llm import LLM
from ahvn.cache import DiskCache

# Cache LLM responses for persistent storage across sessions
cache = DiskCache("/tmp/llm_cache")
llm = LLM(preset="chat", cache=cache)

# First call - computed, makes API call
response1 = llm.oracle("What is Python?")

# Second call - from cache, instant response
response2 = llm.oracle("What is Python?")  # Instant - no API call
```

<br/>

### 6.2. KLStore Integration
Efficiently cache knowledge objects using any cache backend, providing fast retrieval for knowledge base operations.

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import DatabaseCache

# Cache KLStore operations with database backend
cache = DatabaseCache(provider="sqlite", database="kl_cache.db")
kl_store = CacheKLStore(cache=cache)

# Store KL objects with automatic caching
kl_store.store(kl_object)

# Retrieve with cache lookup
retrieved = kl_store.retrieve(kl_id)  # Fast cache hit if available
```

<br/>

## Further Exploration

> **Tip:** For related functionality, see:
> - [CacheKLStore](./klstore/cache.md) - KLStore backed by simple Cache

<br/>
