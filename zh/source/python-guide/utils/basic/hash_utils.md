# 哈希工具

`hash_utils.py` 模块为各种数据类型提供一致的哈希功能。本指南将引导您使用哈希实用工具，在 AgentHeaven 中为不同的对象类型生成确定性哈希。

## 1. 基本使用

`hash_utils` 提供了三个主要函数：`md5hash` 用于生成哈希，`fmt_hash` 用于格式化哈希 ID，以及 `fmt_short_hash` 用于创建简短的格式化哈希字符串。该模块处理各种数据类型，包括函数、可 JSON 序列化的对象和复杂的数据结构。

开始使用哈希实用工具的最简单方法：

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_hash, fmt_short_hash

# 生成一个简单的哈希
hash_value = md5hash("hello world")
print(f"Hash: {hash_value}")
# Hash: 302871542308501324754052582614191981548

# 将哈希格式化为零填充的字符串
formatted_hash = fmt_hash(hash_value)
print(f"Formatted: {formatted_hash}")
# Formatted: 0302871542308501324754052582614191981548

# 将哈希格式化为短字符串
short_hash = fmt_short_hash(hash_value)
print(f"Short: {short_hash}")
# Short: 91981548
```

<br/>

## 2. 哈希的确定性

`md5hash` 函数通过以下方式产生确定性哈希：

1. **序列化对象**：默认使用 JSON 和排序后的键来保持一致性
2. **处理函数**：通过其完全限定名称
3. **使用备用方法**：对非 JSON 可序列化的对象使用 `repr()`
4. **支持盐值**：用于增强安全性并隔离命名空间

这确保了同一对象总是产生相同的哈希值，使其成为缓存、去重和识别等用途的理想选择。

<br/>

## 3. 使用 `md5hash`

### 3.1. 基本哈希

为各种数据类型生成哈希：

```python
from ahvn.utils.basic.hash_utils import md5hash

# 哈希字符串和数字
text_hash = md5hash("sample text")
num_hash = md5hash(42)
bool_hash = md5hash(True)

# 哈希列表和字典
list_hash = md5hash([1, 2, 3, "four"])
dict_hash = md5hash({"name": "Alice", "age": 30})
```

<br/>

### 3.2. 使用盐值

```python
from ahvn.utils.basic.hash_utils import md5hash

# 使用简单的盐值进行哈希
salted_hash = md5hash("user_data", salt="my_secret_salt")

# 使用复杂的盐值
complex_salt = {"user_id": 123, "timestamp": "2023-01-01"}
secure_hash = md5hash("sensitive_data", salt=complex_salt)

# 使用自定义分隔符
custom_sep_hash = md5hash("data", salt="salt", sep="::")
```

<br/>

### 3.3. 哈希对象和函数

该模块处理可调用对象和复杂数据结构：

```python
from ahvn.utils.basic.hash_utils import md5hash

import math

# 通过其限定名哈希函数
func_hash = md5hash(math.sqrt)
# 结果为 "math.sqrt" 的哈希

# 哈希自定义函数
def my_function():
    return "hello"

custom_func_hash = md5hash(my_function)
# 结果为 "__main__.my_function" 的哈希

# 哈希复杂的嵌套对象
complex_obj = {
    "data": [1, 2, 3],
    "config": {"enabled": True, "threshold": 0.5},
    "processor": math.sqrt
}
complex_hash = md5hash(complex_obj)
```

<br/>

## 4. 使用 `fmt_hash`

通过补充前缀0，将哈希整数转换为一致的字符串表示（长度为 40 个字符）：

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_hash

# 生成哈希并格式化
data = "sample data"
hash_int = md5hash(data)
formatted = fmt_hash(hash_int)

print(f"原始哈希: {hash_int}")
# 如果原始哈希是 292938572720352166694795036283416897576
print(f"格式化哈希: {formatted}")
# 输出: 格式化哈希: 0292938572720352166694795036283416897576
```

<br/>

## 5. 使用 `fmt_short_hash`

将哈希整数转换为具有可自定义长度的短字符串表示：

```python
from ahvn.utils.basic.hash_utils import md5hash, fmt_short_hash

# 生成哈希并将其格式化为短字符串
data = "sample data"
hash_int = md5hash(data)
short_formatted = fmt_short_hash(hash_int)

print(f"原始哈希: {hash_int}")
# 如果原始哈希是 292938572720352166694795036283416897576
print(f"简短哈希: {short_formatted}")
# 输出: 简短哈希: 16897576

# 使用自定义长度
custom_length_formatted = fmt_short_hash(hash_int, length=12)
print(f"自定义长度 (12): {custom_length_formatted}")
# 输出: 自定义长度 (12): 283416897576

# 处理字符串输入
string_input = "abcdef1234567890"
string_result = fmt_short_hash(string_input, length=8)
print(f"字符串输入结果: {string_result}")
# 输出: 字符串输入结果: 34567890
```

<br/>

## 拓展阅读

> **提示：** 关于 AgentHeaven 中实用工具的更多信息，请参阅：
> - [序列化工具](./serialize_utils.md) - 用于序列化和反序列化数据（json、yaml、pkl、txt 等）的实用工具
> - [配置管理](./config_utils.md) - 用于在 Python 中管理配置的实用工具
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
