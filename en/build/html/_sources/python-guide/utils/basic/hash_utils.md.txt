# Hashing Utilities

The `hash_utils.py` module provides consistent hashing functionality for various data types. This guide will walk you through using the hashing utilities for generating deterministic hashes across different object types in AgentHeaven.

## 1. Basic Usage

`hash_utils` provides three main functions: `md5hash` for generating hashes, `fmt_hash` for formatting hash IDs, and `fmt_short_hash` for creating short formatted hash strings. The module handles various data types including functions, JSON-serializable objects, and complex data structures.

The easiest way to start using the hashing utilities:

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_hash, fmt_short_hash

# Generate a simple hash
hash_value = md5hash("hello world")
print(f"Hash: {hash_value}")
# Hash: 302871542308501324754052582614191981548

# Format the hash as a zero-padded string
formatted_hash = fmt_hash(hash_value)
print(f"Formatted: {formatted_hash}")
# Formatted: 0302871542308501324754052582614191981548

# Format the hash as a short string
short_hash = fmt_short_hash(hash_value)
print(f"Short: {short_hash}")
# Short: 91981548
```

<br/>

## 2. Determinism in Hashing

The `md5hash` function produces deterministic hashes by:

1. **Serializing objects** consistently using JSON with sorted keys (by default)
2. **Handling functions** by their fully-qualified names
3. **Using fallback methods** `repr()` for non-JSON-serializable objects
4. **Supporting salt** for additional security & namespace isolation

This ensures the same object always produces the same hash value, making it ideal for caching, deduplication, and identification purposes.

<br/>

## 3. Working with `md5hash`

### 3.1. Basic Hash

Generate hashes for various data types:

```python
from ahvn.utils.basic.hash_utils import md5hash

# Hash strings and numbers
text_hash = md5hash("sample text")
num_hash = md5hash(42)
bool_hash = md5hash(True)

# Hash lists and dictionaries
list_hash = md5hash([1, 2, 3, "four"])
dict_hash = md5hash({"name": "Alice", "age": 30})
```

<br/>

### 3.2. Using Salt

```python
from ahvn.utils.basic.hash_utils import md5hash

# Hash with a simple salt
salted_hash = md5hash("user_data", salt="my_secret_salt")

# Hash with complex salt
complex_salt = {"user_id": 123, "timestamp": "2023-01-01"}
secure_hash = md5hash("sensitive_data", salt=complex_salt)

# Use custom separator
custom_sep_hash = md5hash("data", salt="salt", sep="::")
```

<br/>

### 3.3. Hashing Objects and Functions

The module handles callable objects and complex data structures:

```python
from ahvn.utils.basic.hash_utils import md5hash

import math

# Hash functions by their qualified name
func_hash = md5hash(math.sqrt)
# Results in hash of "math.sqrt"

# Hash custom functions
def my_function():
    return "hello"

custom_func_hash = md5hash(my_function)
# Results in hash of "__main__.my_function"

# Hash complex nested objects
complex_obj = {
    "data": [1, 2, 3],
    "config": {"enabled": True, "threshold": 0.5},
    "processor": math.sqrt
}
complex_hash = md5hash(complex_obj)
```

<br/>

## 4. Working with `fmt_hash`

Convert hash integers to consistent string representations (40 characters long) by padding with leading zeros:

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_hash

# Generate hash and format it
data = "sample data"
hash_int = md5hash(data)
formatted = fmt_hash(hash_int)

print(f"Original hash: {hash_int}")
# If the original hash is 292938572720352166694795036283416897576
print(f"Formatted hash: {formatted}")
# Output: Formatted hash: 0292938572720352166694795036283416897576
```

<br/>

## 5. Working with `fmt_short_hash`

Convert hash integers to short string representations with customizable length:

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_short_hash

# Generate hash and format it as short string
data = "sample data"
hash_int = md5hash(data)
short_formatted = fmt_short_hash(hash_int)

print(f"Original hash: {hash_int}")
# If the original hash is 292938572720352166694795036283416897576
print(f"Short formatted hash: {short_formatted}")
# Output: Short formatted hash: 16897576

# Use custom length
custom_length_formatted = fmt_short_hash(hash_int, length=12)
print(f"Custom length (12): {custom_length_formatted}")
# Output: Custom length (12): 283416897576

# Handle string inputs
string_input = "abcdef1234567890"
string_result = fmt_short_hash(string_input, length=8)
print(f"String input result: {string_result}")
# Output: String input result: 34567890
```

<br/>

## Further Exploration

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Serialization Utilities](./serialize_utils.md) - Utilities for serializing and deserializing data (json, yaml, pkl, txt, etc.)
> - [Configuration Management](./config_utils.md) - Utilities for managing configurations in Python
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
