# 序列化工具

`serialize_utils.py` 模块为多种数据格式提供全面的序列化与反序列化工具，包括文本、JSON、JSON Lines、YAML、pickle 和二进制数据。本文将演示在 AgentHeaven 中如何使用这些工具，重点覆盖编码处理与函数序列化。

## 1. 基本用法

`serialize_utils` 提供读取与写入多种数据格式的函数，具备一致的编码处理与自动路径解析。该模块支持 txt、JSON、JSONL、YAML、pickle 与二进制格式。

开始使用序列化工具的最简单方式：

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

# 加载 JSON 数据
config = load_json("config.json")
print(f"Config: {config}")

# 保存 JSON 数据
save_json({"debug": True, "port": 8080}, "settings.json")
```

<br/>

## 2. 编码处理

相较直接使用内置的 `json.dump` 或类似函数，AgentHeaven 的序列化工具会依据配置中的编码（默认为 UTF-8）自动处理编码问题。这在处理包含非 ASCII 字符的数据时尤为实用。

结合 `config_utils` 中的 `ConfigManager`（参见[配置管理](./config_utils.md)），可以轻松在应用中管理编码设置。例如：

```python
from ahvn.utils.basic.config_utils import ConfigManager
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

config = ConfigManager()
config.set("encoding", "utf-8", level='global')
```

之后，所有基于字符串的序列化函数（`load_txt`、`save_txt`、`load_yaml`、`save_yaml`）都会自动以该编码作为默认值：

```python
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

# 使用正确的编码处理文本
text = load_txt("data.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt", encoding="utf-8")

# 使用默认编码的文本
text = load_txt("data.txt")
save_txt("Hello 世界", "output.txt") # 由于默认编码为 utf-8，因此等价于 save_txt("Hello 世界", "output.txt", encoding="utf-8")
```

总之，推荐在应用中统一使用 AgentHeaven 的序列化工具来满足序列化需求，以确保编码处理的一致性。

<br/>

## 3. 文本文件操作

该模块提供了用于处理纯文本文件的稳健函数，保证一致的编码，并提供便捷的逐行迭代与追加能力。

### 3.1. 读取与写入文本文件

使用 `load_txt` 将整个文本文件读入字符串，使用 `save_txt` 将字符串写入文件。

```python
from ahvn.utils.basic.serialize_utils import load_txt, save_txt

# 使用正确的编码处理文本
text = load_txt("data.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt", encoding="utf-8")

# 使用默认编码的文本
text = load_txt("data.txt")
# 由于默认编码为 utf-8，因此等价于 save_txt("Hello 世界", "output.txt", encoding="utf-8")
save_txt("Hello 世界", "output.txt")
```

<br/>

### 3.2. 迭代与追加

对于大文件，`iter_txt` 可逐行读取文件，极大节省内存。`append_txt` 可在不覆盖的情况下向已有文件末尾追加内容。

```python
from ahvn.utils.basic.serialize_utils import iter_txt, append_txt

# 迭代读取大型文本文件
for line in iter_txt("large_log.txt"):
    print(line)

# 追加一行到文件末尾
append_txt("New log entry.", "log.txt")
```

<br/>

## 4. 函数序列化

函数在 Python 中是特殊对象，无法直接进行 JSON 序列化，因此需要专门的序列化方式。

### 4.1. Cloud Pickle

该模块使用 `cloudpickle` 进行二进制序列化，并使用 `dill` 提取源代码。优先选择 `cloudpickle` 的好处在于它更适合分布式环境，可在不同环境中反序列化并保持可用。

```python
from ahvn.utils.basic.serialize_utils import serialize_func, deserialize_func

def my_function(x: int, y: int = 10) -> int:
    """Add two numbers with a default value."""
    return x + y

# 序列化函数到描述符
func_descriptor = serialize_func(my_function)
print(f"Serialized function: {func_descriptor['name']}")

# 从描述符反序列化函数
restored_func = deserialize_func(func_descriptor)
result = restored_func(5, 3)
print(f"Result: {result}")  # 输出: 8
```

<br/>

### 4.2. 函数描述符结构

序列化后的函数描述符包含与 Python 3.8 兼容的 [Python Callable types](https://docs.python.org/3/reference/datamodel.html#callable-types) 的大多数属性：

```python
{
    # 内置属性
    "name": "my_function",
    "qualname": "my_function", 
    "doc": "Add two numbers with a default value.",
    "module": "__main__",
    "defaults": (10,),
    "kwdefaults": None,
    "annotations": {"x": "<class 'int'>", "y": "<class 'int'>", "return": "<class 'int'>"},
    "code": "def my_function(x: int, y: int = 10) -> int:\n    return x + y\n",
    "dict": {},  # 将 function.__dict__ 转换为字符串（不含 __source__）
    
    # 额外属性
    "stream": False,
    "hex_dumps": "800495...<hex_string>..."
}
```

> 注意：函数可以自定义 `__source__` 属性。如果存在，将优先使用该属性中的源码，而不是通过 `dill` 提取。`dict` 字段包含函数的 `__dict__`，其中所有值均转换为字符串；为避免重复，`__source__` 键会从 `dict` 中排除，因为其内容已存放在 `code` 字段中。

<br/>

### 4.3. 反序列化方法

控制反序列化偏好：

```python
from ahvn.utils.basic.serialize_utils import deserialize_func

# 偏好基于源码的反序列化（需要依赖）
func = deserialize_func(func_descriptor, prefer="code")

# 偏好 cloudpickle 反序列化（默认，更可靠）
func = deserialize_func(func_descriptor, prefer="hex_dumps")
```

当选择基于源码的反序列化时，函数会通过 `exec` 从存储的源码重新编译；若源码依赖外部上下文或导入，可靠性可能较低。

当选择基于十六进制转储的反序列化时，函数会使用 `cloudpickle` 从十六进制字符串表示恢复。此方式可能需要更多依赖与环境一致性，但通常对跨系统场景更稳健。

> 重要：对于 lambda 函数，无论 `prefer` 参数为何，都会强制使用 `hex_dumps` 方法，因为对 lambda 进行源码提取存在问题。如果尝试使用 `prefer="code"`，会记录警告。

<br/>

## 5. JSON Lines (JSONL) 格式

JSON Lines 是一种便于逐条处理结构化数据的格式，每一行都是一个有效的 JSON 值。

### 5.1. 加载与迭代读取 JSONL 文件

模块提供两种方式读取 JSONL 文件：一次性加载到内存或逐行迭代。

- `load_jsonl`：读取整个 JSONL 文件并返回 Python 对象列表。适合小文件，但对大数据集可能占用较多内存。
- `iter_jsonl`：返回一个生成器，每次产生一个 JSON 对象。该方式极其节省内存，推荐用于处理大文件。

```python
from ahvn.utils.basic.serialize_utils import load_jsonl, iter_jsonl

# 将整个 JSONL 文件加载为列表
data = load_jsonl("data.jsonl")
print(f"Loaded {len(data)} records")

# 迭代处理大型 JSONL 文件以节省内存
for item in iter_jsonl("large_data.jsonl"):
    process(item)
```

<br/>

### 5.2. 保存 JSONL 文件

```python
from ahvn.utils.basic.serialize_utils import save_jsonl, append_jsonl

# 将列表保存为 JSONL
records = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
save_jsonl(records, "output.jsonl")

# 使用特定编码保存
save_jsonl(records, "output.jsonl", encoding="utf-8")

# 追加单条记录到 JSONL
append_jsonl({"id": 3, "name": "Charlie"}, "output.jsonl")

# 一次性追加多条记录
append_jsonl([{"id": 4, "name": "David"}, {"id": 5, "name": "Eve"}], "output.jsonl")
```

<br/>

## 6. 二进制序列化

### 6.1. Pickle 格式

针对 Python 特定对象的序列化，可使用 pickle 函数：

```python
from ahvn.utils.basic.serialize_utils import load_pkl, save_pkl

# 保存复杂的 Python 对象
data = {"nested": {"structures": [1, 2, 3]}, "objects": set([4, 5, 6])}
save_pkl(data, "data.pkl")

# 加载 Python 对象
obj = load_pkl("data.pkl")
print(f"Loaded: {obj}")
```

<br/>

### 6.2. 十六进制格式

针对以十六进制字符串存储的二进制数据：

```python
from ahvn.utils.basic.serialize_utils import load_hex, save_hex

# 将十六进制字符串保存为二进制文件
hex_string = "48656c6c6f"  # "Hello" in hex
save_hex(hex_string, "data.hex")

# 以十六进制字符串读取二进制文件
hex_str = load_hex("data.hex")
print(f"Hex: {hex_str}")  # 输出: 48656c6c6f
```

<br/>

### 6.3. Base64 格式

Base64 是将二进制数据编码为文本的常见格式。

```python
from ahvn.utils.basic.serialize_utils import load_b64, save_b64

# 将文件内容编码为 Base64 字符串
save_b64(b"Hello World", "data.b64")

# 读取 Base64 编码的文件
b64_content = load_b64("data.b64")
print(f"Base64: {b64_content}")
```

<br/>

## 7. 路径序列化

`serialize_path` 与 `deserialize_path` 可将包含文件与子目录的整个目录结构捕获为一个字典，便于打包与传输文件层级。

```python
from ahvn.utils.basic.serialize_utils import serialize_path, deserialize_path

# 创建一个示例目录结构
# /tmp/data/
# ├── file1.txt (content: "hello")
# └── subdir/
#     └── file2.txt (content: "world")

# 序列化该目录
serialized_data = serialize_path("/tmp/data/")

# `serialized_data` 的结构如下：
# {
#     "subdir": None,
#     "file1.txt": "aGVsbG8=",  # "hello" 的 Base64 表示
#     "subdir/file2.txt": "d29ybGQ=" # Base64 for "world"
# }

# 反序列化以恢复目录结构
deserialize_path(serialized_data, "/tmp/restored_data/")
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
