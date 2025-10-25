# Serialization Utilities

The `serialize_utils.py` module provides comprehensive serialization and deserialization utilities for various data formats including text, JSON, JSON Lines, YAML, pickle, and binary data. This guide will walk you through using the serialization utilities with proper encoding handling and function serialization in AgentHeaven.

## 1. Basic Usage

`serialize_utils` provides functions for reading and writing various data formats with consistent encoding handling and automatic path resolution. The module supports txt, JSON, JSONL, YAML, pickle, and binary formats.

The easiest way to start using the serialization utilities:

```python
from ahvn.utils.basic.serialize_utils import (
    load_txt, save_txt,
    load_yaml, save_yaml,
    load_json, save_json,
    load_pkl, save_pkl,
    load_hex, save_hex,
    load_b64, save_b64,
    load_json, save_json,
    load_jsonl, save_jsonl,
    serialize_func, deserialize_func,
    serialize_path, deserialize_path,
)

# Load JSON data
config = load_json("config.json")
print(f"Config: {config}")

# Save JSON data
save_json({"debug": True, "port": 8080}, "settings.json")
```

<br/>

## 2. Encoding Handling

The most important motivation for using AgentHeaven serialization utils instead of the built-in `json.dump` or other similar functions is that the former automatically handles encoding using the configuration-defined encoding (defaults to UTF-8). This is particularly useful when dealing with non-ASCII characters in your data.

Combining with the `ConfigManager` in `config_utils` (See [Configuration Management](./config_utils.md)), you can easily manage the encoding configuration in your application. For example:

```python
from ahvn.utils.basic.config_utils import ConfigManager
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

config = ConfigManager()
config.set("encoding", "utf-8", level='global')
```

Then all string-based serialization functions (`load_txt`, `save_txt`, `load_yaml`, `save_yaml`) will automatically use this encoding as their default encoding:

```python
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

# Text with proper encoding handling
text = load_txt("data.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt", encoding="utf-8")

# Text with default encoding
text = load_txt("data.txt")
save_txt("Hello 世界", "output.txt") # Since the encoding is utf-8 by default, it is equivalent to save_txt("Hello 世界", "output.txt", encoding="utf-8")
```

In conclusion, it is recommended to use AgentHeaven serialization utilities for all your serialization needs to ensure consistent encoding handling across your application.

<br/>

## 3. Text File Operations

The module provides robust functions for handling plain text files, ensuring consistent encoding and providing convenient iteration and appending capabilities.

### 3.1. Reading and Writing Text Files

Use `load_txt` to read an entire text file into a string and `save_txt` to write a string to a file.

```python
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

# Text with proper encoding handling
text = load_txt("data.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt", encoding="utf-8")

# Text with default encoding
text = load_txt("data.txt")
# Since the encoding is utf-8 by default, it is equivalent to save_txt("Hello 世界", "output.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt")
```

<br/>

### 3.2. Iterating and Appending

For large files, `iter_txt` reads a file line by line, which is highly memory-efficient. `append_txt` allows you to add content to the end of an existing file without overwriting it.

```python
from ahvn.utils.basic.serialize_utils import iter_txt, append_txt

# Iterate over a large text file
for line in iter_txt("large_log.txt"):
    print(line)

# Append a new line to a file
append_txt("New log entry.", "log.txt")
```

<br/>

## 4. Function Serialization

Function is a special object in Python, it is not JSON-serializable. So we need a special way to serialize it.

### 4.1. Cloud Pickle

The module provides advanced function serialization using `cloudpickle` for binary serialization and `dill` for source code extraction. The benefit of preferring `cloudpickle` for binary serialization over `dill` is that it is more reliable across distributed systems, allowing serialized functions to be deserialized in different environments and still work as expected.

```python
from ahvn.utils.basic.serialize_utils import serialize_func, deserialize_func

def my_function(x: int, y: int = 10) -> int:
    """Add two numbers with a default value."""
    return x + y

# Serialize function to descriptor
func_descriptor = serialize_func(my_function)
print(f"Serialized function: {func_descriptor['name']}")

# Deserialize function from descriptor
restored_func = deserialize_func(func_descriptor)
result = restored_func(5, 3)
print(f"Result: {result}")  # Output: 8
```

<br/>

### 4.2. Function Descriptor Structure

The serialized function descriptor contains most of the attributes of [Python Callable types](https://docs.python.org/3/reference/datamodel.html#callable-types) compatible with Python 3.8:

```python
{
    # Built-in attributes
    "name": "my_function",
    "qualname": "my_function", 
    "doc": "Add two numbers with a default value.",
    "module": "__main__",
    "defaults": (10,),
    "kwdefaults": None,
    "annotations": {"x": "<class 'int'>", "y": "<class 'int'>", "return": "<class 'int'>"},
    "code": "def my_function(x: int, y: int = 10) -> int:\n    return x + y\n",
    "dict": {},  # Stringified function.__dict__, excluding __source__
    
    # Extra attributes
    "stream": False,
    "hex_dumps": "800495...<hex_string>..."
}
```

> **Note:** Functions can have a custom `__source__` attribute. If present, it will be used as the source code instead of extracting it via `dill`. The `dict` field contains the function's `__dict__` with all values converted to strings. The `__source__` key is excluded from `dict` to avoid duplication since it's stored in the `code` field.

<br/>

### 4.3. Deserialization Methods

Control deserialization preference:

```python
from ahvn.utils.basic.serialize_utils import deserialize_func

# Prefer source code deserialization (requires dependencies)
func = deserialize_func(func_descriptor, prefer="code")

# Prefer cloudpickle deserialization (default, more reliable)
func = deserialize_func(func_descriptor, prefer="hex_dumps")
```

When selecting code-based deserialization, the function is recompiled from the stored source code via `exec`, which could be less reliable if the source code depends on external context or imports.

When selecting hex-based deserialization, the function is restored using `cloudpickle` from the hexadecimal string representation. This could require more dependencies and environment consistency, but is generally more robust across different systems.

> **Important:** Lambda functions automatically enforce the `hex_dumps` deserialization method regardless of the `prefer` parameter, as source code extraction for lambda functions is problematic. A warning will be logged if you attempt to use `prefer="code"` for lambda functions.

<br/>

## 5. JSON Lines (JSONL) Format

JSON Lines is a convenient format for storing structured data that may be processed one record at a time. Each line is a valid JSON value.

### 5.1. Loading and Iterating over JSONL Files

The module offers two ways to read JSONL files: loading the entire file into memory or iterating over it line by line.

- **`load_jsonl`**: Reads all lines from a JSONL file and returns them as a list of Python objects. This is convenient for smaller files but can consume significant memory for large datasets.
- **`iter_jsonl`**: Returns a generator that yields one JSON object at a time. This approach is highly memory-efficient and recommended for processing large files.

```python
from ahvn.utils.basic.serialize_utils import load_jsonl, iter_jsonl

# Load an entire JSONL file into a list
data = load_jsonl("data.jsonl")
print(f"Loaded {len(data)} records")

# Iterate over a large JSONL file to save memory
for item in iter_jsonl("large_data.jsonl"):
    process(item)
```

<br/>

### 5.2. Saving JSONL Files

```python
from ahvn.utils.basic.serialize_utils import save_jsonl, append_jsonl

# Save list to JSONL
records = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
save_jsonl(records, "output.jsonl")

# Save with specific encoding
save_jsonl(records, "output.jsonl", encoding="utf-8")

# Append single dict to JSONL
append_jsonl({"id": 3, "name": "Charlie"}, "output.jsonl")

# Append multiple records at once
append_jsonl([{"id": 4, "name": "David"}, {"id": 5, "name": "Eve"}], "output.jsonl")
```

<br/>

## 6. Binary Serialization

### 6.1. Pickle Format

For Python-specific object serialization, use pickle functions:

```python
from ahvn.utils.basic.serialize_utils import load_pkl, save_pkl

# Save complex Python object
data = {"nested": {"structures": [1, 2, 3]}, "objects": set([4, 5, 6])}
save_pkl(data, "data.pkl")

# Load Python object
obj = load_pkl("data.pkl")
print(f"Loaded: {obj}")
```

<br/>

### 6.2. Hexadecimal Format

For binary data stored as hexadecimal strings:

```python
from ahvn.utils.basic.serialize_utils import load_hex, save_hex

# Save data from hex string to binary file
hex_string = "48656c6c6f"  # "Hello" in hex
save_hex(hex_string, "data.hex")

# Load binary file as hex string
hex_str = load_hex("data.hex")
print(f"Hex: {hex_str}")  # Output: 48656c6c6f
```

<br/>

### 6.3. Base64 Format

Base64 is another common format for encoding binary data into text.

```python
from ahvn.utils.basic.serialize_utils import load_b64, save_b64

# Encode a file's content into a Base64 string
save_b64(b"Hello World", "data.b64")

# Load a Base64-encoded file
b64_content = load_b64("data.b64")
print(f"Base64: {b64_content}")
```

<br/>

## 7. Path Serialization

The `serialize_path` and `deserialize_path` functions allow you to capture an entire directory structure, including its files and subdirectories, into a single dictionary. This is useful for packaging and transferring file hierarchies.

```python
from ahvn.utils.basic.serialize_utils import serialize_path, deserialize_path

# Create a dummy directory structure
# /tmp/data/
# ├── file1.txt (content: "hello")
# └── subdir/
#     └── file2.txt (content: "world")

# Serialize the directory
serialized_data = serialize_path("/tmp/data/")

# `serialized_data` will look like this:
# {
#     "subdir": None,
#     "file1.txt": "aGVsbG8=",  # Base64 for "hello"
#     "subdir/file2.txt": "d29ybGQ=" # Base64 for "world"
# }

# Deserialize to restore the directory structure
deserialize_path(serialized_data, "/tmp/restored_data/")
```

<br/>

## Further Exploration

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
