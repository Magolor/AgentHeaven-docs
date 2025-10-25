# Miscellaneous Utilities

The `misc_utils.py` module provides a collection of miscellaneous utility functions that don't fit into other categories but are commonly used throughout the AgentHeaven codebase. These utilities include data processing, string manipulation, and list operations.

<br/>

## 1. Command-Line Utilities

### 1.1. `cmd()` - Command Execution

The `cmd()` function provides a unified interface for running system commands:

```python
from ahvn.utils.basic.cmd_utils import cmd

# Run a simple command
result = cmd("ls -la", include=["stdout", "returncode"])
print(f"Output: {result['stdout']}")
print(f"Return code: {result['returncode']}")

# Run with sudo
result = cmd("apt update", sudo=True, include=["stdout", "stderr"])

# Run without waiting
process = cmd("sleep 10", wait=False)
# Process runs in background...

# Run with specific outputs
stdout = cmd("echo hello", include="stdout")
print(f"Stdout: {stdout}")
```

### 1.2. Platform Detection

The module provides functions to detect the current platform:

```python
from ahvn.utils.basic.cmd_utils import is_macos, is_windows, is_linux

if is_macos():
    print("Running on macOS")
elif is_windows():
    print("Running on Windows")
elif is_linux():
    print("Running on Linux")
```

### 1.3. `browse()` - File/Folder Browser

The `browse()` function opens files or folders in the system's default application:

```python
from ahvn.utils.basic.cmd_utils import browse

# Open a file in the default text editor
browse("/path/to/file.txt")

# Open a folder in the file explorer
browse("/path/to/folder")
```

<br/>

## 2. Network Utilities

<br/>

### 2.1. `NetworkProxy` - Proxy Context Manager

The `NetworkProxy` class provides a robust context manager for temporarily setting proxy environment variables:

```python
from ahvn.utils.basic.request_utils import NetworkProxy

# Temporarily set proxy settings
with NetworkProxy(
    http_proxy="http://proxy.example.com:8080",
    https_proxy="https://proxy.example.com:8080",
    no_proxy="localhost,127.0.0.1"
):
    # Make network requests with proxy
    import requests
    response = requests.get("https://example.com")
    
# Proxy settings are automatically restored

# Disable proxy temporarily (use empty string)
with NetworkProxy(http_proxy="", https_proxy=""):
    # Network requests bypass proxy
    response = requests.get("https://example.com")

# Preserve existing settings (use None)
with NetworkProxy(http_proxy="http://new-proxy.com:8080"):
    # Only HTTP proxy is changed, HTTPS proxy preserved
    response = requests.get("https://example.com")
```

**Key Features:**
- Handles both uppercase and lowercase proxy environment variables (`HTTP_PROXY`, `http_proxy`, etc.)
- Properly restores original values on context exit (including deletion when they didn't exist)
- Empty string handling: removes proxy variables instead of setting to empty
- `NO_PROXY` support for bypassing proxy for specific hosts
- `None` values preserve existing environment settings

**Parameters:**
- `http_proxy` (Optional[str]): HTTP proxy URL. If empty string, HTTP proxy will be disabled. If None, existing setting will be preserved.
- `https_proxy` (Optional[str]): HTTPS proxy URL. If empty string, HTTPS proxy will be disabled. If None, existing setting will be preserved.
- `no_proxy` (Optional[str]): Comma-separated list of hosts to bypass proxy for. If empty string, no_proxy will be disabled. If None, existing setting will be preserved.
- `**kwargs`: Additional keyword arguments for future extensions.

<br/>

### 2.2. `google_download()` - Google Drive Downloader

Download files from Google Drive using file IDs. The file must be publicly accessible:

```python
from ahvn.utils.basic.request_utils import google_download

# Basic download
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip"
)

if file_path:
    print(f"Downloaded to: {file_path}")
else:
    print("Download failed")

# Download with proxy settings
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip",
    http_proxy="http://proxy.example.com:8080",
    https_proxy="https://proxy.example.com:8080"
)

# Pass additional arguments to gdown.download
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip",
    quiet=False,
    fuzzy=True
)
```

**Parameters:**
- `file_id` (str): The Google Drive file ID (the part after `id=` in the sharing URL).
- `path` (str): The local path to save the downloaded file. Parent directory will be created if it doesn't exist.
- `http_proxy` (Optional[str]): HTTP proxy URL. If empty string, disables HTTP proxy.
- `https_proxy` (Optional[str]): HTTPS proxy URL. If empty string, disables HTTPS proxy.
- `*args`: Additional positional arguments to pass to `gdown.download`.
- `**kwargs`: Additional keyword arguments to pass to `gdown.download`.

**Returns:**
- str: The path to the downloaded file, or None if download failed.

**Requirements:**
- Requires `gdown` package: `pip install gdown`

**Note:** The function automatically creates parent directories if they don't exist. If `gdown` is not installed, an error will be logged and `None` will be returned.

<br/>

## 3. Color Utilities

The color utilities provide functions to add color to terminal output:

```python
from ahvn.utils.basic.color_utils import (
    color_red, color_green, color_yellow, color_blue,
    color_magenta, color_cyan, color_white, color_black,
    color_error, color_warning, color_success, color_info
)

# Colorize text
print(color_red("Error message"))
print(color_green("Success message"))
print(color_yellow("Warning message"))
print(color_blue("Info message"))

# Print with color
from ahvn.utils.basic.color_utils import print_error, print_success, print_warning
print_error("This is an error")
print_success("This is a success")
print_warning("This is a warning")
```

<br/>

## 4. Debug Utilities

### 4.1. Error Handling

The debug utilities provide functions for better error handling and debugging:

```python
from ahvn.utils.basic.debug_utils import raise_mismatch, error_str

# Validate input with helpful error messages
try:
    raise_mismatch(["apple", "banana", "cherry"], "appel", name="fruit")
except ValueError as e:
    print(f"Error: {e}")
    # Output: Unsupported fruit 'appel'. Did you mean 'apple'?

# Get error string representation
try:
    1 / 0
except Exception as e:
    error_msg = error_str(e)
    print(f"Error: {error_msg}")
```

<br/>

### 4.2. Custom Exceptions

The module provides custom exception classes:

```python
from ahvn.utils.basic.debug_utils import (
    LLMError, ToolError, DatabaseError, AutoFuncError, DependencyError
)

# Use custom exceptions
try:
    raise LLMError("LLM request failed")
except LLMError as e:
    print(f"LLM Error: {e}")
```

<br/>

## 5. File Utilities

### 5.1. File Operations

The file utilities provide high-level functions for file operations:

```python
from ahvn.utils.basic.file_utils import (
    touch_file, touch_dir, exists_file, exists_dir,
    copy_file, copy_dir, delete_file, delete_dir
)

# Create files and directories
touch_file("/path/to/file.txt")
touch_dir("/path/to/directory")

# Check existence
if exists_file("/path/to/file.txt"):
    print("File exists")

if exists_dir("/path/to/directory"):
    print("Directory exists")

# Copy operations
copy_file("/path/to/source.txt", "/path/to/dest.txt")
copy_dir("/path/to/source_dir", "/path/to/dest_dir")

# Delete operations
delete_file("/path/to/file.txt")
delete_dir("/path/to/directory")
```

<br/>

### 5.2. File Listing

The module provides functions for listing files and directories:

```python
from ahvn.utils.basic.file_utils import list_files, list_dirs, list_paths

# List files in directory
files = list_files("/path/to/directory")
print(f"Files: {files}")

# List directories
dirs = list_dirs("/path/to/directory")
print(f"Directories: {dirs}")

# List all paths
paths = list_paths("/path/to/directory")
print(f"All paths: {paths}")
```

<br/>

### 5.3. `folder_diagram()` - Directory Tree Visualization

The `folder_diagram()` function generates a hierarchical tree structure showing the file and folder organization:

```python
from ahvn.utils.basic.file_utils import folder_diagram

# Basic usage - visualize a directory
diagram = folder_diagram("/path/to/project")
print(diagram)
# Output:
# project/
# ├── docs/
# │   └── api.md
# ├── src/
# │   └── utils.py
# ├── main.py
# └── README.md

# With annotations - add descriptions to files
annotations = {
    "README.md": "Project documentation",
    "src/utils.py": "Utility functions",
    "main.py": "Entry point"
}
diagram = folder_diagram("/path/to/project", annotations=annotations)
print(diagram)
# Output:
# project/
# ├── docs/
# │   └── api.md
# ├── src/
# │   └── utils.py  # Utility functions
# ├── main.py  # Entry point
# └── README.md  # Project documentation

# Custom root name
diagram = folder_diagram("/path/to/project", name="MyProject")
print(diagram)
# Output:
# MyProject/
# ├── ...

# Single file visualization
diagram = folder_diagram("/path/to/file.txt")
print(diagram)
# Output: file.txt

# Single file with custom name
diagram = folder_diagram("/path/to/file.txt", name="config")
print(diagram)
# Output: config

# Limit entries per directory (useful for large directories)
diagram = folder_diagram("/path/to/large_project", limit=8)
# Shows at most 8 entries per directory (4 at top, 4 at bottom)
# Middle entries are collapsed with "... (omitting N files)" message
```

**Parameters:**
- `path` (str): Directory path to build tree from. Can also be a single file path.
- `annotations` (Optional[Dict[str, str]]): File-level annotations to display as comments. Keys can be relative paths from the root or just filenames.
- `name` (Optional[str]): Custom label for the root node. Defaults to the basename of `path`.
- `limit` (int): Maximum number of entries to render per directory before collapsing the middle section. Defaults to 16. It's recommended to set this to an even number for balanced display.

**Returns:**
- str: Formatted tree structure diagram with optional annotations.

**Features:**
- Directories are listed before files at each level
- Empty directories show just the directory name with a trailing slash
- Annotations are displayed as inline comments with `#` prefix
- Large directories can be collapsed using the `limit` parameter
- Optimized format for LLM understanding of resource structure

**Note:** This function is particularly useful for:
- Documenting project structure
- Providing context to LLMs about file organization
- Generating visual representations of directory hierarchies
- Creating readable snapshots of file systems

<br/>

## 6. Path Utilities

The path utilities provide functions for path manipulation:

```python
from ahvn.utils.basic.path_utils import (
    pj, get_file_ext, get_file_name, get_file_basename, get_file_dir
)

# Join paths
path = pj("home", "user", "documents", "file.txt")
print(f"Joined path: {path}")

# Get file information
file_path = "/path/to/file.txt"
print(f"Extension: {get_file_ext(file_path)}")
print(f"Name: {get_file_name(file_path)}")
print(f"Base name: {get_file_basename(file_path)}")
print(f"Directory: {get_file_dir(file_path)}")

# Manipulate file names
print(f"Name without extension: {get_file_name(file_path, ext=False)}")
print(f"Name with new extension: {get_file_name(file_path, ext='md')}")
```

<br/>

## 7. Logging Utilities

The logging utilities provide a colored logger configuration:

```python
from ahvn.utils.basic.log_utils import get_logger

# Get a colored logger
logger = get_logger(__name__)
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.success("Success message")  # Custom level
```

<br/>

## 8. Random Utilities

The random utilities provide stable random number generation that doesn't interfere with the global random state.

### 8.1. `stable_rnd()` - Stable Random Float

Generate a random float in [0.0, 1.0) without affecting the global random state:

```python
from ahvn.utils.basic.rnd_utils import stable_rnd

# Generate a random float with stable seed
random_value = stable_rnd(seed=42)
print(f"Random value: {random_value}")

# Generate without seed (unstable)
random_value = stable_rnd(seed=None)
```

<br/>

### 8.2. `stable_rndint()` - Stable Random Integer

Generate a random integer between min and max (inclusive) without affecting the global random state:

```python
from ahvn.utils.basic.rnd_utils import stable_rndint

# Generate a random integer between 1 and 100
random_int = stable_rndint(1, 100, seed=42)
print(f"Random integer: {random_int}")
```

<br/>

### 8.3. `stable_shuffle()` - Stable Shuffling

Shuffle a sequence without affecting the global random state:

```python
from ahvn.utils.basic.rnd_utils import stable_shuffle

# Shuffle a list
data = [1, 2, 3, 4, 5]
shuffled = stable_shuffle(data, seed=42)
print(f"Shuffled: {shuffled}")

# Shuffle in place (for mutable sequences)
stable_shuffle(data, inplace=True, seed=42)
print(f"Shuffled in place: {data}")
```

<br/>

### 8.4. `stable_split()` - Stable Sequence Splitting

Split a sequence into two parts based on a stable hash-based selection:

```python
from ahvn.utils.basic.rnd_utils import stable_split

# Split a sequence into 10% and 90%
data = list(range(100))
smaller, larger = stable_split(data, r=0.10, seed=42)
print(f"Smaller group: {len(smaller)} items")
print(f"Larger group: {len(larger)} items")
```

<br/>

### 8.5. `stable_sample()` - Stable Sampling

Sample n elements without replacement in a stable manner using min n of hash values:

```python
from ahvn.utils.basic.rnd_utils import stable_sample

# Sample 5 elements from a sequence
data = list(range(100))
sample = stable_sample(data, n=5, seed=42)
print(f"Sampled items: {sample}")
```

<br/>

### 8.6. `stable_rnd_vector()` - Stable Random Vector

Generate a stable random vector with a major value on a hashed dimension:

```python
from ahvn.utils.basic.rnd_utils import stable_rnd_vector

# Generate a stable random vector (default 384 dimensions)
vector = stable_rnd_vector(seed=42)
print(f"Vector dimension: {len(vector)}")
print(f"Vector L2 norm: {sum(x*x for x in vector)**0.5}")  # Should be ~1.0

# Generate with custom dimensions
vector = stable_rnd_vector(seed=123, dim=128)
print(f"Custom dimension vector: {len(vector)}")

# Adjust major dimension ratio
vector = stable_rnd_vector(seed=42, dim=384, major_ratio=0.8)
print(f"Vector with higher major ratio")
```

This function is useful for creating mock embeddings in tests where you need deterministic but varied vectors that approximate the behavior of real embeddings. The vector is normalized via softmax followed by L2 normalization to unit length.

<br/>

## 9. Type Utilities

### 9.1. `autotype()` - Automatic Type Conversion

The `autotype()` function automatically converts strings to their appropriate types:

```python
from ahvn.utils.basic.type_utils import autotype

# Integer conversion
print(autotype("42"))        # -> 42
print(autotype("42.0"))      # -> 42.0

# Float conversion
print(autotype("3.14"))      # -> 3.14

# Boolean conversion
print(autotype("true"))      # -> True
print(autotype("false"))     # -> False
print(autotype("none"))      # -> None

# JSON conversion
print(autotype('{"key": "value"}'))  # -> {'key': 'value'}
print(autotype("[1, 2, 3]"))        # -> [1, 2, 3]

# Expression evaluation
print(autotype("1 + 2"))      # -> 3

# String preservation
print(autotype("'42'"))       # -> 42
print(autotype("Hello"))      # -> Hello
```

**Warning:** This function uses `eval()` for expression evaluation, which can be dangerous if the input is not controlled. Use with caution.

<br/>

### 9.2. `jsonschema_type()` - Python Type to JSON Schema Conversion

The `jsonschema_type()` function converts Python type annotation strings to JSON schema format:

```python
from ahvn.utils.basic.type_utils import jsonschema_type

# Simple types
print(jsonschema_type("int"))           # {'type': 'integer'}
print(jsonschema_type("str"))           # {'type': 'string'}
print(jsonschema_type("float"))         # {'type': 'number'}
print(jsonschema_type("bool"))          # {'type': 'boolean'}

# Complex types
print(jsonschema_type("List[str]"))     # {'items': {'type': 'string'}, 'type': 'array'}
print(jsonschema_type("Dict[str, int]"))  # {'type': 'object', 'x-original-generic': 'Dict[str, int]'}
print(jsonschema_type("Optional[str]")) # {'type': 'string'}

# Union types
print(jsonschema_type("Union[str, int]"))
# {'type': 'string', 'x-original-union': ['str', 'int']}

# Literal types
print(jsonschema_type("Literal['fast', 'slow']"))
# {'enum': ['fast', 'slow'], 'type': 'string'}

# Special formats
print(jsonschema_type("datetime"))
# {'format': 'date-time', 'type': 'string'}

# Unknown types default to string
print(jsonschema_type("CustomType"))
# {'type': 'string', 'x-original-type': 'CustomType'}
```

This function is useful for automatically generating JSON schemas from Python type annotations, particularly for API documentation and validation.

<br/>

### 9.3. `parse_function_signature()` - Function Signature Extraction

The `parse_function_signature()` function extracts comprehensive type information and metadata from a Python function's signature:

```python
from ahvn.utils.basic.type_utils import parse_function_signature

# Define a sample function
def example_func(a: int, b: str = "default", c: float = None) -> bool:
    """Example function with typed parameters."""
    return True

# Parse the signature
sig_info = parse_function_signature(example_func)

# Access parameter information
print(sig_info['parameters']['a']['type_schema'])  # {'type': 'integer'}
print(sig_info['parameters']['a']['required'])     # True

print(sig_info['parameters']['b']['type_schema'])  # {'type': 'string'}
print(sig_info['parameters']['b']['default'])      # 'default'
print(sig_info['parameters']['b']['required'])     # False

print(sig_info['parameters']['c']['default'])      # None
print(sig_info['parameters']['c']['required'])     # False

# Check return type
print(sig_info['return_type'])  # {'type': 'boolean'}

# Check for variadic arguments
print(sig_info['has_var_args'])    # False
print(sig_info['has_var_kwargs'])  # False

# Example with *args and **kwargs
def varargs_func(x: int, *args, **kwargs) -> None:
    pass

sig_info = parse_function_signature(varargs_func)
print(sig_info['has_var_args'])    # True
print(sig_info['has_var_kwargs'])  # True
```

This function is particularly useful for:
- Automatically generating API documentation
- Building dynamic function call interfaces
- Creating validation schemas for function arguments
- Introspecting function metadata for frameworks and tools

**Note:** This only analyzes the function signature. For full docstring parsing including descriptions, use `parse_docstring()` from the Function Utilities section.

<br/>

## 10. Function Utilities

### 10.1. `code2func()` - Extract Function from Code

The `code2func()` function extracts a callable function from a code snippet:

```python
from ahvn.utils.basic.func_utils import code2func

# Extract function from code string
code = """
def add(a: int, b: int) -> int:
    return a + b
"""

add_func = code2func(code)
result = add_func(2, 3)
print(result)  # 5

# Specify function name when multiple functions exist
code = """
def add(a: int, b: int) -> int:
    return a + b

def multiply(a: int, b: int) -> int:
    return a * b
"""

add_func = code2func(code, func_name="add")
multiply_func = code2func(code, func_name="multiply")
```

<br/>

### 10.2. `parse_docstring()` - Docstring Parsing

The `parse_docstring()` function parses a function's docstring into structured metadata:

```python
from ahvn.utils.basic.func_utils import parse_docstring

def example_func(a: int, b: str = "default") -> bool:
    """Example function with documentation.
    
    This function demonstrates docstring parsing.
    
    Args:
        a (int): First parameter.
        b (str, optional): Second parameter. Defaults to "default".
    
    Returns:
        bool: True if successful.
    
    Raises:
        ValueError: If a is negative.
    
    Examples:
        >>> example_func(5)
        True
    """
    return True

# Parse the docstring
metadata = parse_docstring(example_func)

# Access parsed information
print(metadata['description'])
# Example function with documentation.
#
# This function demonstrates docstring parsing.
print(metadata['args'])
# {'properties': {'a': {'description': 'First parameter.', 'type': 'integer'},
#                 'b': {'default': 'default',
#                       'description': 'Second parameter. Defaults to "default".',
#                       'type': 'string'}},
#  'required': ['a'],
#  'type': 'object'}
print(metadata['returns'])
# {'properties': {'result': {'description': 'True if successful.',
#                            'type': 'boolean'}},
#  'type': 'object'}
print(metadata['raises'])
# [{'description': 'If a is negative.', 'type': 'ValueError'}]
print(metadata['examples'])
# [{'description': '>>> example_func(5)\nTrue', 'snippet': None}]
```

<br/>

### 10.3. `synthesize_docstring()` - Generate Docstring

The `synthesize_docstring()` function generates a docstring from tool specification attributes:

```python
from ahvn.utils.basic.func_utils import synthesize_docstring

# Define input and output schemas
input_schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "User name"},
        "age": {"type": "integer", "description": "User age"}
    },
    "required": ["name"]
}

output_schema = {
    "type": "object",
    "properties": {
        "result": {"type": "string", "description": "Greeting message"}
    }
}

# Generate docstring
docstring = synthesize_docstring(
    description="Greet a user by name and optionally age.",
    input_schema=input_schema,
    output_schema=output_schema,
    style="google"
)

print(docstring)
# Greet a user by name and optionally age.
#
# Args:
#     name (str): User name
#     age (int): User age Optional.
#
# Returns:
#     str: Greeting message
```

<br/>

### 10.4. `synthesize_def()` - Generate Function Definition

The `synthesize_def()` function generates a complete Python function definition from schema metadata:

```python
from ahvn.utils.basic.func_utils import synthesize_def

# Generate function definition
func_def = synthesize_def(
    name="greet_user",
    input_schema={
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer", "default": 18}
        },
        "required": ["name"]
    },
    output_schema={
        "type": "object",
        "properties": {
            "result": {"type": "string"}
        }
    },
    docstring="Greet a user.",
    code="return f'Hello, {name}!'"
)

print(func_def)
# def greet_user(name: str, age: int = 18) -> str:
#     """\
#     Greet a user.
#     """
#     return f'Hello, {name}!'
```

<br/>

### 10.5. `synthesize_signature()` - Generate Function Call Signature

The `synthesize_signature()` function generates a Python function call signature with provided arguments and default values:

```python
from ahvn.utils.basic.func_utils import synthesize_signature

# Generate function call signature
signature = synthesize_signature(
    name="greet_user",
    input_schema={
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer", "default": 18}
        },
        "required": ["name"]
    },
    arguments={"name": "Alice"}
)

print(signature)  # greet_user(name='Alice', age=18)
```

<br/>

## 11. Parser Utilities

### 11.1. `parse_keys()` - Parse Key-Value Pairs

The `parse_keys()` function parses keys from an LLM response formatted as key-value pairs:

```python
from ahvn.utils.basic.parser_utils import parse_keys

# Parse response with key-value pairs
response = """
name: John Doe
age: 30
city: New York
"""

# Parse as dictionary
result = parse_keys(response, keys=["name", "age", "height"], mode="dict")
print(result)
# {'name': 'John Doe', 'age': '30\ncity: New York', 'height': None}

# Parse as list
result = parse_keys(response, keys=["name", "age", "height"], mode="list")
print(result)
# [{'key': 'name', 'value': 'John Doe'}, {'key': 'age', 'value': '30\ncity: New York'}]

# Parse all keys (keys=None)
result = parse_keys(response, mode="dict")
print(result)
# {'name': 'John Doe', 'age': '30', 'city': 'New York'}
```

<br/>

### 11.2. `parse_md()` - Parse Markdown-like Blocks

The `parse_md()` function parses markdown-like strings into structured blocks, including XML-like tags and fenced code blocks:

``````python
from ahvn.utils.basic.parser_utils import parse_md

# Parse mixed content
response = """
<think>Let me analyze this...</think>
Some textual output here.
```sql
SELECT * FROM users WHERE age > 18;
```
<rating>
```json
{"score": 5, "confidence": 0.95}
```
</rating>
"""

# Parse as dictionary (flat)
result = parse_md(response, mode="dict")
print(result)
# {'rating': '```json\n{"score": 5, "confidence": 0.95}\n```',
#  'sql': 'SELECT * FROM users WHERE age > 18;',
#  'text': 'Some textual output here.',
#  'think': 'Let me analyze this...'}

# Parse recursively
result = parse_md(response, recurse=True, mode="dict")
print(result)
# {'rating.json': '{"score": 5, "confidence": 0.95}',
#  'sql': 'SELECT * FROM users WHERE age > 18;',
#  'text': 'Some textual output here.',
#  'think.text': 'Let me analyze this...'}

# Parse as list
result = parse_md(response, mode="list")
print(result)
# [{'key': 'think', 'value': 'Let me analyze this...'},
#  {'key': 'text', 'value': 'Some textual output here.'},
#  {'key': 'sql', 'value': 'SELECT * FROM users WHERE age > 18;'},
#  {'key': 'rating', 'value': '```json\n{"score": 5, "confidence": 0.95}\n```'}]
``````

**Features:**
- Extracts XML-like tags: `<tag>...</tag>`
- Extracts fenced code blocks: ` ```language\n...\n``` ` (language is optional)
- Missing language defaults to "markdown"
- Supports recursive parsing for nested structures
- Returns structured data as list or dictionary

<br/>

## 12. Miscellaneous Utilities

### 12.1. `unique()` - Get Unique Elements

The `unique()` function returns a list of unique elements from an iterable while preserving order:

```python
from ahvn.utils.basic.misc_utils import unique

# Basic usage
data = [1, 2, 2, 3, 4, 4, 5]
result = unique(data)
print(result)  # [1, 2, 3, 4, 5]

# With custom key function
users = [
    {"name": "Alice", "age": 25},
    {"name": "Bob", "age": 30},
    {"name": "alice", "age": 28}
]
unique_users = unique(users, key=lambda x: x["name"].lower())
print(len(unique_users))  # 2 (Alice and Bob, case-insensitive)
```

<br/>

### 12.2. `lflat()` - List Flattening

The `lflat()` function flattens nested iterables (2 levels deep):

```python
from ahvn.utils.basic.misc_utils import lflat

# Basic flattening
nested = [[1, 2], [3, 4], [5, 6]]
flattened = lflat(nested)
print(flattened)  # [1, 2, 3, 4, 5, 6]

# Mixed types
mixed = [[1, "a"], [2, "b"], [3, "c"]]
flattened = lflat(mixed)
print(flattened)  # [1, "a", 2, "b", 3, "c"]
```

<br/>

## Further Exploration

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
