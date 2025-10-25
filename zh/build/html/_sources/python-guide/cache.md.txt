# 缓存

AgentHeaven 提供了灵活的缓存系统，支持多种后端选项。本指南介绍如何有效使用缓存系统进行性能优化。

<br/>

## 1. 基础缓存示例
该示例展示了如何缓存递归斐波那契函数。首次调用会计算值并存储在缓存中，后续调用会立即从缓存中获取结果。

```python
from ahvn.cache import InMemCache

cache = InMemCache()

@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n-2) + fibonacci(n-1)

# 第一次调用计算，第二次使用缓存
print(fibonacci(30))  # 计算 - 需要等待
print(fibonacci(30))  # 缓存 - 立即返回结果
```

<br/>

## 2. 异步支持示例
演示异步函数的缓存。适用于 API 调用、数据库查询或任何可从缓存中受益的异步操作。

```python
import asyncio
from ahvn.cache import InMemCache

cache = InMemCache()

@cache.memoize()
async def async_operation(x):
    await asyncio.sleep(1)  # 模拟异步工作，如 API 调用
    return x * 2

# 使用
result = await async_operation(5)  # 耗时 1 秒（首次调用）
result = await async_operation(5)  # 缓存立即返回（第二次调用）
```

<br/>

## 3. 缓存后端

### 3.1. 内存缓存（最快）
基于字典的简单缓存，存储在 RAM 中。适用于开发和不需要持久化的临时缓存。

```python
from ahvn.cache import InMemCache

cache = InMemCache()
```
- **优点**: 速度最快，无 I/O 开销
- **缺点**: 易失（重启后丢失），受内存限制
- **用例**: 开发、临时缓存

<br/>

### 3.2. diskcache（带压缩的本地数据库）
使用 `diskcache` 库的文件系统持久存储。适用于需要跨会话缓存的生产工作负载。

```python
from ahvn.cache import DiskCache

cache = DiskCache("/tmp/cache_dir", size_limit=32*1024*1024*1024)  # 32GB
```
- **优点**: 持久化、大容量、线程安全
- **缺点**: 比内存慢
- **用例**: 生产工作负载、跨会话缓存

<br/>

### 3.3. 数据库缓存（可扩展）
SQL 数据库支持的缓存，支持 SQLite、PostgreSQL 和 MySQL。适用于多用户应用和可扩展部署。

```python
from ahvn.cache import DatabaseCache

# SQLite - 轻量级基于文件的数据库
sqlite_cache = DatabaseCache(provider="sqlite", database="cache.db")

# PostgreSQL - 企业级数据库解决方案
pg_cache = DatabaseCache(
    provider="postgresql",
    database="mydb",
)
```
- **优点**: 可扩展、可查询、并发访问
- **缺点**: 数据库开销
- **用例**: 多用户应用、大数据集

<br/>

### 3.4. JSON 缓存（可调试）
每个缓存项存储为单独的 JSON 文件。在开发期间调试和检查非常有用。

```python
from ahvn.cache import JsonCache

cache = JsonCache("/tmp/json_cache")
```
- **优点**: 人类可读、易于调试
- **缺点**: 较慢、文件系统开销
- **用例**: 开发、调试、检查

<br/>

### 3.5. 无缓存（开发）
始终未命中缓存，强制重新计算。适用于测试和调试缓存行为，不影响性能。

```python
from ahvn.cache import NoCache

cache = NoCache()
```
- **优点**: 无缓存，始终重新计算
- **缺点**: 无性能优势
- **用例**: 测试、调试缓存问题

<br/>

### 3.6. 回调缓存（事件驱动）
事件驱动的缓存，在缓存操作时不存储数据而是触发回调。非常适合监控、日志记录或通过回调和 feed 函数实现自定义缓存行为。

```python
from ahvn.cache import CallbackCache

# 定义缓存设置事件的回调
def log_cache_set(key, value):
    print(f"缓存设置: {key} = {value}")

def monitor_memory(key, value):
    # 自定义内存监控逻辑
    print(f"设置 {key} 后的内存使用情况")

# 定义缓存获取事件的 feed 函数
def fast_computation(func, **kwargs):
    """为特定输入提供快速替代方案"""
    if kwargs.get('x', 0) < 100:
        return kwargs['x'] * 2  # 快速计算
    return ...  # 让原函数处理

def database_lookup(func, **kwargs):
    """检查外部数据库中的缓存结果"""
    # 自定义数据库查找逻辑
    return ...  # 继续下一个 feed 或原函数

# 创建带有回调和 feed 的 CallbackCache
cache = CallbackCache(
    callbacks=[log_cache_set, monitor_memory],
    feeds=[fast_computation, database_lookup]
)

@cache.memoize()
def expensive_function(x):
    print(f"为 {x} 计算")
    return x * x + complex_calculation(x)

# 使用示例
result = expensive_function(5)   # 使用 fast_computation feed
result = expensive_function(200) # 回退到 expensive_function
```

<br/>

#### 3.6.1. 回调函数
回调在缓存设置操作时触发，接收缓存键和值：

```python
def my_callback(key: int, value: dict):
    """
    处理缓存设置事件。
    
    参数:
        key: 缓存键（整数哈希）
        value: 包含 func、inputs、output 和 metadata 的缓存项
    """
    print(f"函数: {value['func']}")
    print(f"输入: {value['inputs']}")
    print(f"输出: {value['output']}")
    # 自定义逻辑：写入日志、更新指标等

# 多个回调按顺序执行
cache = CallbackCache(callbacks=[callback1, callback2, callback3])
```

**回调 API**: 每个回调必须接受 `(key: int, value: dict)` 参数，其中 `value` 包含：
- `func`: 函数名或可调用对象
- `inputs`: 函数字参数字典
- `output`: 函数返回值
- `metadata`: 额外缓存元数据

<br/>

#### 3.6.2. Feed 函数
Feed 在缓存获取操作时提供替代计算或数据源，按顺序处理直到某个返回非 Ellipsis 值：

```python
def custom_feed(func, **kwargs):
    """
    提供替代计算或数据查找。
    
    参数:
        func: 原始函数（可调用对象或字符串名称）
        **kwargs: 调用者提供的函数字参数
    
    返回:
        Any: 返回计算值，或 ... 继续下一个 feed
    """
    # 示例：为特定输入使用预计算结果
    if func.__name__ == 'fibonacci' and kwargs['n'] <= 10:
        return [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55][kwargs['n']]
    
    # 示例：数据库查找
    if kwargs.get('user_id'):
        cached = database.get_user_cache(kwargs['user_id'])
        if cached:
            return cached
    
    return ...  # 继续下一个 feed 或原始函数

# Feed 函数按顺序处理
cache = CallbackCache(feeds=[fast_lookup, database_check, expensive_computation])
```

**Feed API**: 每个 feed 函数必须接受 `(func, **kwargs)` 并返回：
- **实际值**: 停止 feed 处理并返回此值
- **Ellipsis (`...`)**: 继续下一个 feed 或原始函数

<br/>

#### 3.6.3. 错误处理
回调和 feed 都包含内置错误处理：

```python
def failing_callback(key, value):
    raise ValueError("回调错误！")

def failing_feed(func, **kwargs):
    raise RuntimeError("Feed 错误！")

# 错误被记录并跳过，处理继续
cache = CallbackCache(
    callbacks=[failing_callback, working_callback],
    feeds=[failing_feed, working_feed]
)
```

- **回调错误**: 被记录、跳过，其他回调继续
- **Feed 错误**: 被记录、跳过，调用下一个 feed 或原始函数
- **不中断**: 尽管有个别失败，系统保持稳定

- **优点**: 事件驱动、高度可定制、零存储开销
- **缺点**: 无实际缓存，需要自定义实现存储
- **用例**: 监控、日志记录、自定义缓存层、A/B 测试

<br/>

## 4. CacheEntry 类型

`CacheEntry` 类是 AgentHeaven 缓存系统中使用的基本数据结构。它封装了缓存函数调用的所有信息，包括函数名、输入参数、输出值、预期值和可选元数据。

<br/>

### 4.1. 基本结构

`CacheEntry` 包含以下字段：

```python
from ahvn.cache import CacheEntry

# 直接实例化（很少需要 - 通常由缓存后端创建）
entry = CacheEntry(
    func="my_function",           # 函数名（字符串）
    inputs={"x": 5, "y": 10},    # 输入参数作为字典
    output=50,                    # 实际输出值
    expected=...,                 # 预期输出（... 表示未设置）
    metadata={"timestamp": "..."}  # 可选元数据
)

# 访问缓存键和值
print(entry.key)    # 输入 + 函数名的 MD5 哈希
print(entry.value)  # 如果设置了预期则返回预期，否则返回输出
```

<br/>

### 4.2. 创建 CacheEntry 对象

#### 4.2.1. 从函数参数创建
使用 `from_args()` 从函数参数创建 `CacheEntry`：

```python
from ahvn.cache import CacheEntry

def my_function(x, y, z=10):
    return x + y + z

# 从函数和参数创建条目
entry = CacheEntry.from_args(
    func=my_function,      # 传递可调用对象或字符串名称
    output=25,             # 函数的输出
    x=5,                   # 函数参数作为 kwargs
    y=10,
    z=10,
    exclude=["z"]          # 可选排除某些参数从键中
)

print(entry.func)      # "my_function"
print(entry.inputs)    # {"x": 5, "y": 10} (z 被排除)
print(entry.output)    # 25
```

<br/>

#### 4.2.2. 从字典创建
从字典表示创建 `CacheEntry`：

```python
from ahvn.cache import CacheEntry

# 从字典反序列化
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

### 4.3. 使用 CacheEntry

#### 4.3.1. 转换为字典
将 `CacheEntry` 序列化为字典：

```python
entry = CacheEntry.from_args(func="add", output=15, x=5, y=10)
data = entry.to_dict()

# 返回: {
#     "func": "add",
#     "inputs": {"x": 5, "y": 10},
#     "output": 15,
#     "metadata": {}
# }
```

<br/>

#### 4.3.2. 克隆并更新
创建带有更新的 `CacheEntry` 副本：

```python
original = CacheEntry.from_args(func="compute", output=100, n=10)

# 克隆并更新
modified = original.clone(
    output=200,              # 更新输出
    metadata={"v": 2}        # 更新元数据
)

print(original.output)  # 100 (未更改)
print(modified.output)  # 200 (新值)
```

<br/>

#### 4.3.3. 注解
用预期输出和元数据注解 `CacheEntry`：

```python
# 从实际计算创建条目
entry = CacheEntry.from_args(
    func="fibonacci",
    output=55,
    n=10
)

# 用预期输出注解（用于验证/测试）
annotated = entry.annotate(
    expected=55,                          # 设置预期输出
    metadata={"source": "ground_truth"}   # 添加元数据
)

print(annotated.expected)   # 55
print(annotated.annotated)  # True (有预期值)
print(entry.annotated)      # False (原始未更改)

# 如果省略预期，则使用输出作为预期
auto_annotated = entry.annotate()
print(auto_annotated.expected)  # 55 (从输出复制)
```

<br/>

### 4.4. 属性

#### 4.4.1. 缓存键
`key` 属性返回标识缓存条目的唯一整数哈希：

```python
entry = CacheEntry.from_args(func="add", output=15, x=5, y=10)
print(entry.key)  # 整数 MD5 哈希

# 相同输入 = 相同键（kwargs 的顺序无关）
entry2 = CacheEntry.from_args(func="add", output=15, y=10, x=5)
print(entry.key == entry2.key)  # True
```

<br/>

#### 4.4.2. 值
`value` 属性返回预期输出（如果设置），否则返回实际输出：

```python
entry = CacheEntry.from_args(func="compute", output=100, n=10)
print(entry.value)  # 100 (未设置预期，返回输出)

annotated = entry.annotate(expected=99)
print(annotated.value)  # 99 (返回预期，不是输出)
```

<br/>

#### 4.4.3. 注解状态
检查 `CacheEntry` 是否已用预期值注解：

```python
entry = CacheEntry.from_args(func="test", output=42, x=1)
print(entry.annotated)  # False

annotated = entry.annotate(expected=42)
print(annotated.annotated)  # True
```

<br/>

### 4.5. 用例

#### 4.5.1. 缓存检查
访问存储的缓存条目用于调试或分析：

```python
from ahvn.cache import DiskCache

cache = DiskCache("/tmp/my_cache")

@cache.memoize()
def compute(x, y):
    return x * y + x + y

# 计算并缓存
result = compute(5, 10)

# 手动检索和检查缓存条目
# （实现取决于缓存后端）
# 大多数后端在内部存储 CacheEntry 对象
```

<br/>

#### 4.5.2. 自定义缓存后端
实现自定义缓存后端时使用 `CacheEntry` 进行序列化：

```python
from ahvn.cache import BaseCache, CacheEntry

class MyCustomCache(BaseCache):
    def __init__(self):
        self.store = {}
    
    def set(self, key: int, value: Dict[str, Any]):
        # 将字典转换为 CacheEntry 以进行验证
        entry = CacheEntry.from_dict(value)
        # 存储序列化形式
        self.store[key] = entry.to_dict()
    
    def get(self, key: int) -> Optional[Dict[str, Any]]:
        return self.store.get(key)
```

<br/>

#### 4.5.3. 测试和验证
使用 `CacheEntry` 注解进行测试驱动缓存：

```python
from ahvn.cache import CacheEntry, InMemCache

# 为测试创建预期结果
expected_entries = [
    CacheEntry.from_args(func="add", expected=15, x=5, y=10),
    CacheEntry.from_args(func="add", expected=25, x=10, y=15),
]

# 根据预期验证缓存结果
cache = InMemCache()

@cache.memoize()
def add(x, y):
    return x + y

for entry in expected_entries:
    actual = add(**entry.inputs)
    assert actual == entry.expected, f"不匹配: {actual} != {entry.expected}"
```

<br/>

## 5. 高级用法

### 5.1. 生成器缓存
缓存整个生成器输出，适用于流数据处理或昂贵的数据转换。

```python
@cache.memoize()
def data_stream(n):
    """缓存整个生成器输出"""
    for i in range(n):
        yield expensive_computation(i)

# 使用 - 首次运行后整个流被缓存
for item in data_stream(1000):
    process(item)
```

注意，只有在生成器完全完成时才会缓存生成器输出。如果迭代被以下情况中断：`break` 语句、异常、错误、提前终止或部分消费。部分输出将**不会**被缓存。只有在整个生成器成功完成后才会创建缓存项。

```python
# 示例：部分消费不会缓存
for item in data_stream(1000):
    if item > 100:  # 提前终止
        break      # 生成器输出**不**被缓存
    process(item)

# 示例：异常不会缓存
try:
    for item in data_stream(1000):
        if item == 500:
            raise ValueError("处理错误")
        process(item)
except ValueError:
    pass  # 由于异常，生成器输出**不**被缓存

# 示例：完整完成会缓存
for item in data_stream(1000):
    process(item)  # 整个生成器完成 - 成功缓存
```

<br/>

### 5.2. 批量记忆化
通过缓存批量操作高效处理多个输入，减少批量计算的开销。

```python
@cache.batch_memoize()
def process_batch(items):
    """缓存批量操作"""
    return [expensive_operation(item) for item in items]

# 使用
results = process_batch([1, 2, 3, 4, 5])  # 计算 - 需要时间
results = process_batch([1, 2, 3, 4, 5])  # 缓存 - 立即返回结果
```

<br/>

### 5.3. 参数排除
从缓存键中排除特定参数，适用于调试标志、时间戳或其他非功能性参数。

```python
@cache.memoize(exclude=["debug"])
def compute_with_debug(x, debug=False):
    """调试参数从缓存键中排除"""
    if debug:
        print(f"为 {x} 计算")
    return x * x

# 尽管调试值不同，这些使用相同的缓存项
result1 = compute_with_debug(5, debug=True)
result2 = compute_with_debug(5, debug=False)
```

<br/>

### 5.4. 手动缓存操作
直接控制缓存项以实现自定义缓存策略、手动失效或高级元数据管理。

```python
from ahvn.cache.base import CacheEntry

# 创建自定义缓存项
entry = CacheEntry(
    func="my_function",
    inputs={"x": 5},
    output=25,
    metadata={"version": "1.0", "timestamp": "2024-01-01"}
)

# 手动存储用于自定义缓存
cache.set(entry)

# 手动检索用于检查
result = cache.get("my_function", {"x": 5})

# 清除特定项用于有针对性的失效
cache.remove("my_function", {"x": 5})

# 清除整个缓存用于完全重置
cache.clear()
```

<br/>

### 5.5. 缓存注解
为缓存项添加元数据和注解，增强调试、监控和缓存管理能力。

```python
@cache.memoize(annotation={"purpose": "user_profile", "team": "backend"})
def get_user_profile(user_id: int) -> dict:
    """用团队注解缓存用户配置用于监控"""
    return database.fetch_user(user_id)

@cache.memoize(annotation={"priority": "high", "ttl": "1h"})
def get_realtime_data(sensor_id: str) -> dict:
    """高优先级传感器数据，1小时 TTL"""
    return api.fetch_sensor_data(sensor_id)

# 在缓存检查期间访问注解
for entry in cache:
    if entry.metadata.get("annotation", {}).get("team") == "backend":
        print(f"后端缓存: {entry.func} 与 {entry.inputs}")
```

注解作为元数据与缓存项一起存储，可用于：
- **过滤**: 按注解选择性失效或检查缓存项
- **监控**: 按目的或团队跟踪缓存使用模式
- **TTL 管理**: 用基于注解的过期覆盖默认 TTL
- **调试**: 按功能目的识别缓存项

```python
# 按注解过滤缓存项
backend_entries = [
    entry for entry in cache 
    if entry.metadata.get("annotation", {}).get("team") == "backend"
]

# 清除特定注解的缓存项
for entry in cache:
    if entry.metadata.get("annotation", {}).get("purpose") == "user_profile":
        cache.remove(entry.func, entry.inputs)
```

<br/>

### 5.6. 缓存检查
浏览和分析缓存内容用于调试、监控或缓存管理目的。

```python
# 遍历所有缓存项
for entry in cache:
    print(f"函数: {entry.func}")
    print(f"输入: {entry.inputs}")
    print(f"输出: {entry.output}")
    print(f"元数据: {entry.metadata}")
    print("---")
```

<br/>

## 6. 集成示例

### 6.1. LLM 集成
缓存 LLM 响应以避免冗余 API 调用并降低成本。非常适合常见问题或重复提示。

```python
from ahvn.llm import LLM
from ahvn.cache import DiskCache

# 用持久存储跨会话缓存 LLM 响应
cache = DiskCache("/tmp/llm_cache")
llm = LLM(preset="chat", cache=cache)

# 首次调用 - 计算，进行 API 调用
response1 = llm.oracle("What is Python?")

# 第二次调用 - 来自缓存，立即响应
response2 = llm.oracle("What is Python?")  # 立即 - 无 API 调用
```

<br/>

### 6.2. KLStore 集成
使用任何缓存后端高效缓存知识对象，为知识库操作提供快速检索。

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import DatabaseCache

# 用数据库后端缓存 KLStore 操作
cache = DatabaseCache(provider="sqlite", database="kl_cache.db")
kl_store = CacheKLStore(cache=cache)

# 用自动缓存存储 KL 对象
kl_store.store(kl_object)

# 用缓存查找检索
retrieved = kl_store.retrieve(kl_id)  # 如果可用则快速缓存命中
```

<br/>

## 拓展阅读

> **提示：** 相关功能参见：
> - [CacheKLStore](./klstore/cache.md) - 由简单缓存支持的 KLStore

<br/>
