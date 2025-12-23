# 其他实用工具

`misc_utils.py` 模块提供了一系列不属于其他类别但在 AgentHeaven 代码库中常用的实用工具函数。这些工具包括数据处理、字符串操作和列表操作。

<br/>

## 1. 命令行工具

### 1.1. `cmd()` - 命令执行

`cmd()` 函数为运行系统命令提供统一接口：

```python
from ahvn.utils.basic.cmd_utils import cmd

# 运行简单命令
result = cmd("ls -la", include=["stdout", "returncode"])
print(f"输出: {result['stdout']}")
print(f"返回码: {result['returncode']}")

# 使用 sudo 运行
result = cmd("apt update", sudo=True, include=["stdout", "stderr"])

# 不等待运行
process = cmd("sleep 10", wait=False)
# 进程在后台运行...

# 运行并获取特定输出
stdout = cmd("echo hello", include="stdout")
print(f"标准输出: {stdout}")
```

### 1.2. 平台检测

该模块提供检测当前平台的功能：

```python
from ahvn.utils.basic.cmd_utils import is_macos, is_windows, is_linux

if is_macos():
    print("运行在 macOS 上")
elif is_windows():
    print("运行在 Windows 上")
elif is_linux():
    print("运行在 Linux 上")
```

### 1.3. `browse()` - 文件/文件夹浏览器

`browse()` 函数在系统默认应用程序中打开文件或文件夹：

```python
from ahvn.utils.basic.cmd_utils import browse

# 在默认文本编辑器中打开文件
browse("/path/to/file.txt")

# 在文件管理器中打开文件夹
browse("/path/to/folder")
```

<br/>

## 2. 网络实用工具

<br/>

### 2.1. `NetworkProxy` - 代理上下文管理器

`NetworkProxy` 类提供一个健壮的上下文管理器，用于临时设置代理相关的环境变量：

```python
from ahvn.utils.basic.request_utils import NetworkProxy

# 临时设置代理
with NetworkProxy(
    http_proxy="http://proxy.example.com:8080",
    https_proxy="https://proxy.example.com:8080",
    no_proxy="localhost,127.0.0.1"
):
    # 使用代理进行网络请求
    import requests
    response = requests.get("https://example.com")
    
# 代理设置会自动恢复

# 临时禁用代理（使用空字符串）
with NetworkProxy(http_proxy="", https_proxy=""):
    # 网络请求绕过代理
    response = requests.get("https://example.com")

# 保留现有设置（使用 None）
with NetworkProxy(http_proxy="http://new-proxy.com:8080"):
    # 仅更改 HTTP 代理，HTTPS 代理保持不变
    response = requests.get("https://example.com")
```

**主要特性：**
- 同时处理大写和小写的代理环境变量（`HTTP_PROXY`、`http_proxy` 等）
- 在退出上下文时正确恢复原始值（包括删除原本不存在的变量）
- 空字符串处理：移除代理变量而不是设置为空
- 支持 `NO_PROXY` 来绕过特定主机的代理
- `None` 值保留现有的环境设置

**参数：**
- `http_proxy` (Optional[str])：HTTP 代理 URL。如果为空字符串，将禁用 HTTP 代理。如果为 None，将保留现有设置。
- `https_proxy` (Optional[str])：HTTPS 代理 URL。如果为空字符串，将禁用 HTTPS 代理。如果为 None，将保留现有设置。
- `no_proxy` (Optional[str])：逗号分隔的主机列表，用于绕过代理。如果为空字符串，将禁用 no_proxy。如果为 None，将保留现有设置。
- `**kwargs`：用于未来扩展的额外关键字参数。

<br/>

### 2.2. `google_download()` - Google Drive 下载器

使用文件 ID 从 Google Drive 下载文件。文件必须是公开可访问的：

```python
from ahvn.utils.basic.request_utils import google_download

# 基本下载
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip"
)

if file_path:
    print(f"Downloaded to: {file_path}")
else:
    print("Download failed")

# 使用代理设置下载
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip",
    http_proxy="http://proxy.example.com:8080",
    https_proxy="https://proxy.example.com:8080"
)

# 传递额外参数给 gdown.download
file_path = google_download(
    file_id="1a2b3c4d5e6f7g8h9i",
    path="/path/to/save/file.zip",
    quiet=False,
    fuzzy=True
)
```

**参数：**
- `file_id` (str)：Google Drive 文件 ID（分享 URL 中 `id=` 后面的部分）。
- `path` (str)：保存下载文件的本地路径。如果父目录不存在，将自动创建。
- `http_proxy` (Optional[str])：HTTP 代理 URL。如果为空字符串，禁用 HTTP 代理。
- `https_proxy` (Optional[str])：HTTPS 代理 URL。如果为空字符串，禁用 HTTPS 代理。
- `*args`：传递给 `gdown.download` 的额外位置参数。
- `**kwargs`：传递给 `gdown.download` 的额外关键字参数。

**返回值：**
- str：下载文件的路径，如果下载失败则返回 None。

**依赖要求：**
- 需要安装 `gdown` 包：`pip install gdown`

**注意：** 该函数会自动创建父目录（如果不存在）。如果未安装 `gdown`，将记录错误并返回 `None`。

<br/>

## 3. 颜色实用工具

颜色工具提供为终端输出添加颜色的函数：

```python
from ahvn.utils.basic.color_utils import (
    color_red, color_green, color_yellow, color_blue,
    color_magenta, color_cyan, color_white, color_black,
    color_error, color_warning, color_success, color_info
)

# 为文本着色
print(color_red("错误消息"))
print(color_green("成功消息"))
print(color_yellow("警告消息"))
print(color_blue("信息消息"))

# 以颜色打印
from ahvn.utils.basic.color_utils import print_error, print_success, print_warning
print_error("这是一个错误")
print_success("这是一次成功")
print_warning("这是一个警告")
```

<br/>

## 4. 调试实用工具

### 4.1. 错误处理

调试工具提供更好的错误处理与调试能力：

```python
from ahvn.utils.basic.debug_utils import raise_mismatch, error_str

# 通过更友好的错误消息进行输入校验
try:
    raise_mismatch(["apple", "banana", "cherry"], "appel", name="fruit")
except ValueError as e:
    print(f"错误: {e}")
    # 输出: 不支持的 fruit 'appel'。您是指 'apple' 吗？

# 获取错误的字符串表示
try:
    1 / 0
except Exception as e:
    error_msg = error_str(e)
    print(f"错误: {error_msg}")
```

<br/>

### 4.2. 自定义异常

该模块提供自定义异常类：

```python
from ahvn.utils.basic.debug_utils import (
    LLMError, ToolError, DatabaseError, AutoFuncError, DependencyError
)

# 使用自定义异常
try:
    raise LLMError("LLM 请求失败")
except LLMError as e:
    print(f"LLM 错误: {e}")
```

<br/>

## 5. 文件实用工具

### 5.1. 文件操作

文件工具提供文件操作的高级函数：

```python
from ahvn.utils.basic.file_utils import (
    touch_file, touch_dir, exists_file, exists_dir,
    copy_file, copy_dir, delete_file, delete_dir
)

# 创建文件和目录
touch_file("/path/to/file.txt")
touch_dir("/path/to/directory")

# 检查是否存在
if exists_file("/path/to/file.txt"):
    print("文件存在")

if exists_dir("/path/to/directory"):
    print("目录存在")

# 复制操作
copy_file("/path/to/source.txt", "/path/to/dest.txt")
copy_dir("/path/to/source_dir", "/path/to/dest_dir")

# 删除操作
delete_file("/path/to/file.txt")
delete_dir("/path/to/directory")
```

<br/>

### 5.2. 文件列举

该模块提供用于列出文件与目录的函数：

```python
from ahvn.utils.basic.file_utils import list_files, list_dirs, list_paths

# 列出目录中的文件
files = list_files("/path/to/directory")
print(f"文件: {files}")

# 列出目录
dirs = list_dirs("/path/to/directory")
print(f"目录: {dirs}")

# 列出所有路径
paths = list_paths("/path/to/directory")
print(f"所有路径: {paths}")
```

<br/>

### 5.3. `folder_diagram()` - 目录树可视化

`folder_diagram()` 函数生成层次化的树形结构，展示文件和文件夹组织：

```python
from ahvn.utils.basic.file_utils import folder_diagram

# 基本用法 - 可视化目录
diagram = folder_diagram("/path/to/project")
print(diagram)
# 输出:
# project/
# ├── docs/
# │   └── api.md
# ├── src/
# │   └── utils.py
# ├── main.py
# └── README.md

# 使用注释 - 为文件添加描述
annotations = {
    "README.md": "项目文档",
    "src/utils.py": "实用函数",
    "main.py": "入口点"
}
diagram = folder_diagram("/path/to/project", annotations=annotations)
print(diagram)
# 输出:
# project/
# ├── docs/
# │   └── api.md
# ├── src/
# │   └── utils.py  # 实用函数
# ├── main.py  # 入口点
# └── README.md  # 项目文档

# 自定义根节点名称
diagram = folder_diagram("/path/to/project", name="MyProject")
print(diagram)
# 输出:
# MyProject/
# ├── ...

# 单个文件可视化
diagram = folder_diagram("/path/to/file.txt")
print(diagram)
# 输出: file.txt

# 单个文件使用自定义名称
diagram = folder_diagram("/path/to/file.txt", name="config")
print(diagram)
# 输出: config

# 限制每个目录的条目数（适用于大型目录）
diagram = folder_diagram("/path/to/large_project", limit=8)
# 每个目录最多显示 8 个条目（顶部 4 个，底部 4 个）
# 中间的条目会被折叠，显示 "... (omitting N files)" 消息
```

**参数：**
- `path` (str)：要构建树形结构的目录路径。也可以是单个文件路径。
- `annotations` (Optional[Dict[str, str]])：文件级注释，以注释形式显示。键可以是相对于根目录的相对路径，也可以只是文件名。
- `name` (Optional[str])：根节点的自定义标签。默认为 `path` 的基本名称。
- `limit` (int)：在折叠中间部分之前，每个目录要渲染的最大条目数。默认为 16。建议设置为偶数以实现平衡显示。

**返回值：**
- str：格式化的树形结构图，包含可选的注释。

**特性：**
- 在每一层中，目录先于文件列出
- 空目录仅显示带有尾部斜杠的目录名称
- 注释以 `#` 前缀的内联注释形式显示
- 可以使用 `limit` 参数折叠大型目录
- 为 LLM 理解资源结构优化的格式

**注意：** 此函数特别适用于：
- 记录项目结构
- 向 LLM 提供文件组织的上下文
- 生成目录层次结构的可视化表示
- 创建文件系统的可读快照

<br/>

## 6. 路径实用工具

路径工具提供路径处理相关函数：

```python
from ahvn.utils.basic.path_utils import (
    pj, get_file_ext, get_file_name, get_file_basename, get_file_dir
)

# 连接路径
path = pj("home", "user", "documents", "file.txt")
print(f"连接后的路径: {path}")

# 获取文件信息
file_path = "/path/to/file.txt"
print(f"扩展名: {get_file_ext(file_path)}")
print(f"名称: {get_file_name(file_path)}")
print(f"基本名: {get_file_basename(file_path)}")
print(f"目录: {get_file_dir(file_path)}")

# 操作文件名
print(f"无扩展名的名称: {get_file_name(file_path, ext=False)}")
print(f"替换扩展名后的名称: {get_file_name(file_path, ext='md')}")
```

<br/>

## 7. 日志实用工具

日志工具提供彩色日志记录器配置：

```python
from ahvn.utils.basic.log_utils import get_logger

# 获取彩色日志记录器
logger = get_logger(__name__)
logger.info("信息消息")
logger.warning("警告消息")
logger.error("错误消息")
logger.success("成功消息")  # 自定义级别
```

<br/>

## 8. 随机实用工具

随机工具提供稳定的随机数生成，不会干扰全局随机状态。

### 8.1. `stable_rnd()` - 稳定随机浮点数

生成 [0.0, 1.0) 范围内的随机浮点数，不影响全局随机状态：

```python
from ahvn.utils.basic.rnd_utils import stable_rnd

# 使用稳定种子生成随机浮点数
random_value = stable_rnd(seed=42)
print(f"随机值: {random_value}")

# 不使用种子（不稳定）
random_value = stable_rnd(seed=None)
```

<br/>

### 8.2. `stable_rndint()` - 稳定随机整数

在包含两端的范围内生成随机整数，且不影响全局随机状态：

```python
from ahvn.utils.basic.rnd_utils import stable_rndint

# 生成 1 到 100 之间的随机整数
random_int = stable_rndint(1, 100, seed=42)
print(f"随机整数: {random_int}")
```

<br/>

### 8.3. `stable_shuffle()` - 稳定打乱

对序列进行打乱，且不影响全局随机状态：

```python
from ahvn.utils.basic.rnd_utils import stable_shuffle

# 打乱列表
data = [1, 2, 3, 4, 5]
shuffled = stable_shuffle(data, seed=42)
print(f"打乱结果: {shuffled}")

# 原地打乱（针对可变序列）
stable_shuffle(data, inplace=True, seed=42)
print(f"原地打乱后: {data}")
```

<br/>

### 8.4. `stable_split()` - 稳定序列拆分

基于稳定的哈希选择将序列拆分为两部分：

```python
from ahvn.utils.basic.rnd_utils import stable_split

# 将序列拆分为 10% 和 90%
data = list(range(100))
smaller, larger = stable_split(data, r=0.10, seed=42)
print(f"较小组: {len(smaller)} 项")
print(f"较大组: {len(larger)} 项")
```

<br/>

### 8.5. `stable_sample()` - 稳定采样

以哈希值最小的 n 个元素进行无放回稳定采样：

```python
from ahvn.utils.basic.rnd_utils import stable_sample

# 从序列中采样 5 个元素
data = list(range(100))
sample = stable_sample(data, n=5, seed=42)
print(f"采样项: {sample}")
```

<br/>

### 8.6. `stable_rnd_vector()` - 稳定随机向量

在哈希得到的某一维上赋予较大权重以生成稳定随机向量：

```python
from ahvn.utils.basic.rnd_utils import stable_rnd_vector

# 生成稳定随机向量（默认 384 维）
vector = stable_rnd_vector(seed=42)
print(f"向量维度: {len(vector)}")
print(f"向量 L2 范数: {sum(x*x for x in vector)**0.5}")  # 应约为 ~1.0

# 指定自定义维度
vector = stable_rnd_vector(seed=123, dim=128)
print(f"自定义维度向量: {len(vector)}")

# 调整主维比例
vector = stable_rnd_vector(seed=42, dim=384, major_ratio=0.8)
print(f"更高主维比例的向量")
```

该函数适用于在测试中创建模拟的嵌入向量：既确定性又有差异性，且近似真实嵌入的行为。向量通过先 softmax 再 L2 归一化到单位长度。

<br/>

## 9. 类型实用工具

### 9.1. `autotype()` - 自动类型转换

`autotype()` 函数会自动将字符串转换为合适的类型：

```python
from ahvn.utils.basic.type_utils import autotype

# 整数转换
print(autotype("42"))        # -> 42
print(autotype("42.0"))      # -> 42.0

# 浮点数转换
print(autotype("3.14"))      # -> 3.14

# 布尔值转换
print(autotype("true"))      # -> True
print(autotype("false"))     # -> False
print(autotype("none"))      # -> None

# JSON 转换
print(autotype('{"key": "value"}'))  # -> {'key': 'value'}
print(autotype("[1, 2, 3]"))        # -> [1, 2, 3]

# 表达式求值
print(autotype("1 + 2"))      # -> 3

# 字符串保留
print(autotype("'42'"))       # -> 42
print(autotype("Hello"))      # -> Hello
```

**警告：** 此函数使用 `eval()` 进行表达式求值，如果输入不受控制会带来风险。请谨慎使用。

<br/>

### 9.2. `jsonschema_type()` - Python 类型到 JSON Schema 转换

`jsonschema_type()` 函数将 Python 类型注解的字符串转换为 JSON Schema 格式：

```python
from ahvn.utils.basic.type_utils import jsonschema_type

# 简单类型
print(jsonschema_type("int"))           # {'type': 'integer'}
print(jsonschema_type("str"))           # {'type': 'string'}
print(jsonschema_type("float"))         # {'type': 'number'}
print(jsonschema_type("bool"))          # {'type': 'boolean'}

# 复杂类型
print(jsonschema_type("List[str]"))     # {'items': {'type': 'string'}, 'type': 'array'}
print(jsonschema_type("Dict[str, int]"))  # {'type': 'object', 'x-original-generic': 'Dict[str, int]'}
print(jsonschema_type("Optional[str]")) # {'type': 'string'}

# 联合类型
print(jsonschema_type("Union[str, int]"))
# {'type': 'string', 'x-original-union': ['str', 'int']}

# 字面量类型
print(jsonschema_type("Literal['fast', 'slow']"))
# {'enum': ['fast', 'slow'], 'type': 'string'}

# 特殊格式
print(jsonschema_type("datetime"))
# {'format': 'date-time', 'type': 'string'}

# 未知类型默认视为字符串
print(jsonschema_type("CustomType"))
# {'type': 'string', 'x-original-type': 'CustomType'}
```

该函数有助于根据 Python 类型注解自动生成 JSON Schema，尤其适用于 API 文档与校验。

<br/>

### 9.3. `parse_function_signature()` - 提取函数签名

`parse_function_signature()` 函数从 Python 函数签名中提取全面的类型信息与元数据：

```python
from ahvn.utils.basic.type_utils import parse_function_signature

# 定义一个示例函数
def example_func(a: int, b: str = "default", c: float = None) -> bool:
    """Example function with typed parameters."""
    return True

# 解析签名
sig_info = parse_function_signature(example_func)

# 访问参数信息
print(sig_info['parameters']['a']['type_schema'])  # {'type': 'integer'}
print(sig_info['parameters']['a']['required'])     # True

print(sig_info['parameters']['b']['type_schema'])  # {'type': 'string'}
print(sig_info['parameters']['b']['default'])      # 'default'
print(sig_info['parameters']['b']['required'])     # False

print(sig_info['parameters']['c']['default'])      # None
print(sig_info['parameters']['c']['required'])     # False

# 检查返回类型
print(sig_info['return_type'])  # {'type': 'boolean'}

# 检查可变参数
print(sig_info['has_var_args'])    # False
print(sig_info['has_var_kwargs'])  # False

# 含 *args 与 **kwargs 的示例
def varargs_func(x: int, *args, **kwargs) -> None:
    pass

sig_info = parse_function_signature(varargs_func)
print(sig_info['has_var_args'])    # True
print(sig_info['has_var_kwargs'])  # True
```

该函数尤其适用于：
- 自动生成 API 文档
- 构建动态函数调用接口
- 为函数参数创建校验模式
- 为框架与工具进行函数元数据自省

**注意：** 该函数仅分析函数签名本身。若需包含描述的完整 docstring 解析，请使用“函数实用工具”章节中的 `parse_docstring()`。

<br/>

## 10. 函数实用工具

### 10.1. `code2func()` - 从代码提取函数

`code2func()` 函数从代码片段中提取可调用的函数：

```python
from ahvn.utils.basic.func_utils import code2func

# 从代码字符串中提取函数
code = """
def add(a: int, b: int) -> int:
    return a + b
"""

add_func = code2func(code)
result = add_func(2, 3)
print(result)  # 5

# 当存在多个函数时，指定函数名
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

### 10.2. `parse_docstring()` - 解析文档字符串

`parse_docstring()` 函数将函数的文档字符串解析为结构化元数据：

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

# 解析文档字符串
metadata = parse_docstring(example_func)

# 访问解析结果
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

### 10.3. `synthesize_docstring()` - 生成文档字符串

`synthesize_docstring()` 函数根据工具规范（ToolSpec）的属性生成文档字符串：

```python
from ahvn.utils.basic.func_utils import synthesize_docstring

# 定义输入与输出模式
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

# 生成文档字符串
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

### 10.4. `synthesize_def()` - 生成函数定义

`synthesize_def()` 函数基于模式元数据生成完整的 Python 函数定义：

```python
from ahvn.utils.basic.func_utils import synthesize_def

# 生成函数定义
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

### 10.5. `synthesize_signature()` - 生成函数调用签名

`synthesize_signature()` 函数根据给定的参数与默认值生成 Python 函数调用签名：

```python
from ahvn.utils.basic.func_utils import synthesize_signature

# 生成函数调用签名
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

## 11. 解析实用工具

### 11.1. `parse_keys()` - 解析键值对

`parse_keys()` 函数解析以键值对格式返回的 LLM 响应中的键：

```python
from ahvn.utils.basic.parser_utils import parse_keys

# 解析包含键值对的响应
response = """
name: John Doe
age: 30
city: New York
"""

# 解析为字典
result = parse_keys(response, keys=["name", "age", "height"], mode="dict")
print(result)
# {'name': 'John Doe', 'age': '30\ncity: New York', 'height': None}

# 解析为列表
result = parse_keys(response, keys=["name", "age", "height"], mode="list")
print(result)
# [{'key': 'name', 'value': 'John Doe'}, {'key': 'age', 'value': '30\ncity: New York'}]

# 解析所有键（keys=None）
result = parse_keys(response, mode="dict")
print(result)
# {'name': 'John Doe', 'age': '30', 'city': 'New York'}
```

<br/>

### 11.2. `parse_md()` - 解析类 Markdown 块

`parse_md()` 函数将类似 Markdown 的字符串解析为结构化块，包括类 XML 标签与围栏代码块：

``````python
from ahvn.utils.basic.parser_utils import parse_md

# 解析混合内容
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

# 解析为字典（扁平）
result = parse_md(response, mode="dict")
print(result)
# {'rating': '```json\n{"score": 5, "confidence": 0.95}\n```',
#  'sql': 'SELECT * FROM users WHERE age > 18;',
#  'text': 'Some textual output here.',
#  'think': 'Let me analyze this...'}

# 递归解析
result = parse_md(response, recurse=True, mode="dict")
print(result)
# {'rating.json': '{"score": 5, "confidence": 0.95}',
#  'sql': 'SELECT * FROM users WHERE age > 18;',
#  'text': 'Some textual output here.',
#  'think.text': 'Let me analyze this...'}

# 解析为列表
result = parse_md(response, mode="list")
print(result)
# [{'key': 'think', 'value': 'Let me analyze this...'},
#  {'key': 'text', 'value': 'Some textual output here.'},
#  {'key': 'sql', 'value': 'SELECT * FROM users WHERE age > 18;'},
#  {'key': 'rating', 'value': '```json\n{"score": 5, "confidence": 0.95}\n```'}]
``````

**特性：**
- 提取类 XML 标签：`<tag>...</tag>`
- 提取围栏代码块：` ```language\n...\n``` `（language 可选）
- 未提供语言时默认使用 "markdown"
- 支持对嵌套结构进行递归解析
- 以列表或字典形式返回结构化数据

<br/>

## 12. 其他杂项实用工具

### 12.1. `unique()` - 获取唯一元素

`unique()` 函数在保留顺序的前提下，从可迭代对象中返回唯一元素列表：

```python
from ahvn.utils.basic.misc_utils import unique

# 基本用法
data = [1, 2, 2, 3, 4, 4, 5]
result = unique(data)
print(result)  # [1, 2, 3, 4, 5]

# 使用自定义键函数
users = [
    {"name": "Alice", "age": 25},
    {"name": "Bob", "age": 30},
    {"name": "alice", "age": 28}
]
unique_users = unique(users, key=lambda x: x["name"].lower())
print(len(unique_users))  # 2 (Alice 和 Bob，不区分大小写)
```

<br/>

### 12.2. `lflat()` - 列表扁平化

`lflat()` 函数用于将嵌套可迭代对象扁平化（深度 2 层）：

```python
from ahvn.utils.basic.misc_utils import lflat

# 基本扁平化
nested = [[1, 2], [3, 4], [5, 6]]
flattened = lflat(nested)
print(flattened)  # [1, 2, 3, 4, 5, 6]

# 混合类型
mixed = [[1, "a"], [2, "b"], [3, "c"]]
flattened = lflat(mixed)
print(flattened)  # [1, "a", 2, "b", 3, "c"]
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 所有便捷的 Python 实用工具

<br/>
