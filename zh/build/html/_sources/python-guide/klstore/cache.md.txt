# CacheKLStore

CacheKLStore 是一个轻量级的 [BaseKLStore](./base.md) 实现,由 AgentHeaven 的 [Cache](../cache.md) 系统支持。它为知识对象提供灵活的存储,你可以选择缓存后端 — 从超快的内存存储到持久化的磁盘或数据库后端。

## 1. 简介

### 1.1. 多种后端选项

CacheKLStore 的关键优势是轻量级和后端灵活性。通过包装任何 `BaseCache` 实现,你可以选择最适合你需求的存储后端:

- **InMemCache**: 超快、易失性存储(适合开发和测试)
- **DiskCache**: 快速、持久化的文件存储(推荐用于生产)
- **DatabaseCache**: 可扩展的 SQL 存储(SQLite、PostgreSQL、MySQL)
- **JsonCache**: 人类可读的 JSON 文件(适合调试)

只需切换缓存后端 — 无需更改你的 KLStore 代码。

<br/>

### 1.2. 简单架构

在底层,CacheKLStore:
- **包装**任何 `BaseCache` 后端
- **序列化** BaseUKF 对象为字典,使用 `to_dict()` / `from_dict()`
- **键**条目为 `func="kl_store"` 和 `kid=<ukf_id>`
- **过滤**缓存条目以仅迭代知识对象

<br/>

## 2. 快速开始

### 2.1. 基本用法

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import InMemCache, DiskCache
from ahvn.ukf import BaseUKF

# 内存存储(最快,易失性)
cache = InMemCache()
store = CacheKLStore(cache=cache, name="memory_store")

# 或持久化磁盘存储
cache = DiskCache("/tmp/knowledge_cache")
store = CacheKLStore(cache=cache, name="disk_store")

# 创建并存储知识对象
kl = BaseUKF(name="Python Tutorial", type="documentation", content="Learn Python")
store.upsert(kl)

# 检索它
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

所有标准 [BaseKLStore](./base.md) 操作都能无缝工作:`insert()`、`upsert()`、`get()`、`remove()`、`batch_*()`、迭代等。

<br/>

### 2.2. 初始化参数

- **`cache`**(必需):一个 `BaseCache` 实例 — 决定存储后端
- **`name`**(可选):KLStore 实例的名称(默认:"default")
- **`condition`**(可选):过滤函数,用于有条件地存储对象

<br/>

## 3. 缓存后端

### 3.1. InMemCache — 开发与测试

```python
from ahvn.cache import InMemCache

cache = InMemCache()
store = CacheKLStore(cache=cache)
# 最快的访问,但重启后数据丢失
```

<br/>

### 3.2. DiskCache — 推荐用于生产

```python
from ahvn.cache import DiskCache

cache = DiskCache(
    directory="/var/cache/knowledge",
    size_limit=32 * 1024**3  # 32GB
)
store = CacheKLStore(cache=cache)
# 快速、持久化、生产就绪
```

<br/>

### 3.3. DatabaseCache — 可扩展存储

```python
from ahvn.cache import DatabaseCache

# SQLite(简单的文件存储)
cache = DatabaseCache(provider="sqlite", database="cache.db")
store = CacheKLStore(cache=cache)

# PostgreSQL(多用户)
cache = DatabaseCache(provider="pg", database="mydb", host="localhost")
store = CacheKLStore(cache=cache)
```

<br/>

### 3.4. JsonCache — 调试

```python
from ahvn.cache import JsonCache

cache = JsonCache(directory="/tmp/knowledge_json")
store = CacheKLStore(cache=cache)
# 每个条目保存为人类可读的 JSON 文件
```

<br/>

## 4. 缓存特定功能

CacheKLStore 提供了特定于缓存后端的额外操作:

### 4.1. 刷新和关闭

```python
# 将待写入数据刷新到存储(取决于后端)
store.flush()

# 关闭缓存并释放资源
store.close()
```

<br/>

### 4.2. 清除所有数据

```python
# 删除所有知识对象
store.clear()
```

<br/>

### 4.3. 直接访问缓存

```python
# 访问底层缓存以进行高级操作
cache = store.cache

# 检查缓存总大小(包括非 kl_store 条目)
print(f"Total cache entries: {len(cache)}")
```

<br/>

## 5. 完整示例

```python
from ahvn.klstore import CacheKLStore
from ahvn.cache import DiskCache
from ahvn.ukf import BaseUKF

# 使用持久化磁盘缓存初始化
cache = DiskCache("/var/cache/tutorials")
store = CacheKLStore(
    cache=cache,
    name="tutorial_store",
    condition=lambda kl: kl.type in ["tutorial", "documentation"]
)

# 创建知识对象
tutorials = [
    BaseUKF(name="Python Basics", type="tutorial", 
            content="Intro to Python", metadata={"level": "beginner"}),
    BaseUKF(name="Advanced Python", type="tutorial",
            content="Python internals", metadata={"level": "advanced"}),
    BaseUKF(name="Source Code", type="source_code", 
            content="def hello(): pass")  # 被条件过滤掉
]

# 批量插入(source_code 被过滤掉)
store.batch_upsert(tutorials)

# 查询
print(f"Cached: {len(store)} tutorials")  # 2(source_code 被排除)
for tut in store:
    print(f"- {tut.name} ({tut.metadata.get('level')})")

# 更新
tutorial = store.get(tutorials[0].id)
store.upsert(tutorial.clone(content=tutorial.content+" - Now with examples!"))

# 清理
store.flush()  # 确保持久化
store.close()
```

<br/>

## 拓展阅读

> **提示:** 查看接口和通用操作:
> - [BaseKLStore](./base.md) - 定义 KLStore 接口和共享功能的抽象基类

> **提示:** 查看缓存后端详情和配置:
> - [Cache System](../cache.md) - 所有缓存后端、配置选项和高级功能

> **提示:** 查看其他 KLStore 实现:
> - [DatabaseKLStore](./database.md) - 支持 ORM 和 SQL 查询的持久化关系数据库存储
> - [VectorKLStore](./vector.md) - 用于语义相似性搜索的向量数据库存储
> - [CascadeKLStore](./cascade.md) - 基于自定义标准的多层存储路由

> **提示:** 对于超越简单 ID 查找的知识检索:
> - [KLEngine](../klengine/index.md) - 构建在 KLStore 之上的查询引擎

<br/>
