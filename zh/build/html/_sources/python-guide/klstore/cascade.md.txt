# CascadeKLStore

CascadeKLStore 是一个复合的 [BaseKLStore](./base.md) 实现,它在优先级级联中协调多个 KLStore 后端。它在保持独立写控制的同时,跨异构存储层提供统一的读访问,支持复杂的多层存储架构。

## 1. 简介

### 1.1. 什么是 CascadeKLStore?

**CascadeKLStore** 与其他 KLStore 实现根本不同 — 它是一个**复合存储**,包装并协调多个 KLStore 后端,而不是直接管理存储。可以将其视为存储编排器:

- **多层架构**: 将多个 KLStore(例如,快速缓存 + 持久化数据库 + 向量存储)组合成统一接口
- **基于优先级的读取**: 查询按顺序级联通过存储,从第一个匹配返回(类似缓存层次结构)
- **透明检索**: 应用程序看到一个逻辑存储,无论物理分布如何
- **独立写入**: 每个后端存储独立管理 — 无自动数据移动

CascadeKLStore **不是**决定数据存储位置的路由器。相反,你显式管理哪些知识对象进入哪些存储,CascadeKLStore 跨所有存储提供统一的读访问。

<br/>

### 1.2. 为什么使用 CascadeKLStore?

这种复合设计支持强大的存储模式:

**性能分层**: 将频繁访问的知识放在快速存储(InMemCache)中,后备使用较慢的持久化存储(DatabaseKLStore),自动优先查询最快的可用源。

**后端多样性**: 为不同目的组合不同的存储类型 — 例如,VectorKLStore 用于语义搜索 + DatabaseKLStore 用于结构化查询 + CacheKLStore 用于热数据 — 同时向 KLEngine 提供单一接口。

**增量迁移**: 通过向级联添加新存储逐步迁移存储后端,同时保持与现有数据的向后兼容性。

**开发/生产对等**: 使用内存存储进行测试,后备使用生产数据库,确保测试使用与生产相同的代码路径。

<br/>

### 1.3. 关键设计原则

**读穿透级联**: 查询按顺序尝试每个存储,直到找到 — 快速存储优先,慢速存储在后。

**独立写管理**: 你显式控制哪个存储接收哪些数据 — 无自动同步或数据移动。

**去重**: 迭代返回唯一的知识对象(按 ID),即使跨存储重复。

**透明操作**: 大多数操作(get、exists、iterate、remove)在所有存储中无缝工作。

<br/>

## 2. 快速开始

### 2.1. 基本用法

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache
from ahvn.ukf import BaseUKF

# 创建第 1 层:快速内存缓存
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache, name="hot_tier")

# 创建第 2 层:持久化数据库
cold_store = DatabaseKLStore(database="knowledge.db", provider="sqlite", name="cold_tier")

# 组合成级联(优先级顺序: hot -> cold)
cascade = CascadeKLStore(stores=[hot_store, cold_store], name="cascade_store")

# 直接写入特定存储
kl_hot = BaseUKF(name="Recent Article", type="article", content="Latest news")
kl_cold = BaseUKF(name="Archive Document", type="document", content="Historical data")

hot_store.upsert(kl_hot)    # 写入热层
cold_store.upsert(kl_hot)   # 写入冷层
cold_store.upsert(kl_cold)  # 写入冷层

# 从级联读取(自动在适当层找到)
retrieved_hot = cascade.get(kl_hot.id)   # 在 hot_store 中找到(快速)
retrieved_cold = cascade.get(kl_cold.id) # 在 cold_store 中找到(回退)

print(f"Retrieved: {retrieved_hot.name}")  # 透明工作
print(f"Retrieved: {retrieved_cold.name}")

# 检查跨所有层的存在性
exists = kl_hot.id in cascade  # True(在 hot_store 中找到)

# 迭代所有唯一的知识对象
for kl in cascade:
    print(f"- {kl.name}")  # 返回 kl_hot 和 kl_cold
```

<br/>

### 2.2. 初始化参数

- **`stores`**(必需):`BaseKLStore` 实例的有序列表 — 定义优先级(第一个 = 最高)
- **`name`**(可选):级联实例的名称(默认:"default")
- **`condition`**(可选):应用于迭代/删除操作的过滤函数(不用于读取)

<br/>

## 3. 核心操作

### 3.1. 读取操作(级联行为)

读取操作**按优先级顺序级联通过存储**,返回第一个匹配:

```python
cascade = CascadeKLStore(stores=[fast_store, medium_store, slow_store])

# get() - 从第一个拥有它的存储返回
kl = cascade.get(123)
# 1. 首先检查 fast_store
# 2. 如果未找到,检查 medium_store
# 3. 如果未找到,检查 slow_store
# 4. 如果都没有,返回默认值

# exists() / __contains__() - 如果在任何存储中返回 True
if 123 in cascade:
    print("Found in at least one store")

# 高效:在第一个匹配处停止,不搜索所有存储
```

**性能提示**: 将最快/最可能/最需要的存储放在列表前面以获得最佳读取性能。

<br/>

### 3.2. 写入操作(显式管理)

**CascadeKLStore 不支持直接 upsert/insert** — 你必须写入特定存储:

```python
cascade = CascadeKLStore(stores=[hot_store, cold_store])

# ❌ 这会引发 NotImplementedError
# cascade.upsert(kl)  # 错误:"Upsert operation is not allowed"

# ✅ 相反,写入特定存储
hot_store.upsert(kl_new)    # 写入热层
cold_store.upsert(kl_new)   # 写入冷层
cold_store.upsert(kl_arch)  # 写入冷层

# 常见模式:写入第一个存储(热层)
cascade.stores[0].upsert(kl_recent)
```

**为什么没有自动写入?** 你控制存储策略 — 无论是基于最近性、重要性、大小还是任何其他标准。级联不做假设。

建议较低优先级的存储(例如,冷存储)也接收写入以实现冗余或备份,具体取决于你的应用需求。但请注意,这不是必需的,因为 CascadeKLStore 不一定用于回退目的。

> **提示:** 要启用智能自动写策略,你需要比 CascadeKLStore 强大得多的组件。有关更多信息,请参阅 [KLBase](../klbase.md)。

<br/>

### 3.3. 删除操作(所有存储)

删除操作在**所有**包含键的存储上执行:

```python
cascade = CascadeKLStore(stores=[store1, store2, store3])

# 从所有存储中删除
cascade.remove(123)
# 内部:
# - 检查 123 是否在 store1 中 → 如果找到则删除
# - 检查 123 是否在 store2 中 → 如果找到则删除
# - 检查 123 是否在 store3 中 → 如果找到则删除

# 批量删除
cascade.batch_remove([123, 456, 789])  # 从所有存储中删除
```

<br/>

### 3.4. 迭代(去重)

迭代返回跨所有存储的**唯一知识对象**:

```python
# 假设:
# - store1 有 [kl_1, kl_2]
# - store2 有 [kl_2, kl_3]  # kl_2 重复

cascade = CascadeKLStore(stores=[store1, store2])

for kl in cascade:
    print(kl.id)
# 输出: 1, 2, 3(kl_2 只返回一次)

# 计数唯一对象
count = len(cascade)  # 3(不是 4)
```

同样,较低优先级的存储**不需要**包含较高优先级存储中的所有数据,迭代期间执行并集。

**去重**: 第一次出现(按 ID)获胜 — 后续存储中的重复被跳过。

<br/>

### 3.5. 清除和关闭

```python
# 清除所有存储
cascade.clear()  # 从所有存储中删除所有数据

# 刷新所有存储(确保持久化)
cascade.flush()

# 关闭所有存储(释放资源)
cascade.close()
```

<br/>

## 4. 使用模式

### 4.1. 热/冷存储架构

经典缓存模式,具有快速热存储和较慢的冷存储:

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache, DiskCache

# 热层:快速内存缓存(有限容量)
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache)

# 冷层:持久化数据库(无限容量)
cold_store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# 级联:热优先,冷其次
cascade = CascadeKLStore(stores=[hot_store, cold_store])

# 写策略:新数据进入热层
def add_knowledge(kl):
    hot_store.upsert(kl)      # 写入热层
    cold_store.upsert(kl)     # 备份到冷层(可选)

# 读取自动使用最快的可用
kl = cascade.get(123)  # 如果在 hot_store 中快速,如果只在 cold_store 中较慢
```

<br/>

### 4.2. 多后端 KLEngine

使用 CascadeKLStore 为查询多个后端的 KLEngine 提供单一存储接口:

```python
from ahvn.klstore import CascadeKLStore, VectorKLStore, DatabaseKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.llm import LLM

# 不同数据的不同存储后端
vector_store = VectorKLStore(collection="vectors", provider="lancedb", embedder=LLM(preset="embedder"))
db_store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# 级联:向量优先(用于语义搜索),数据库其次(用于旧数据)
cascade = CascadeKLStore(stores=[vector_store, db_store])

# KLEngine 透明地查询两个存储
engine = VectorKLEngine(storage=cascade, inplace=False)
results = engine.search("machine learning tutorials", top_k=10)
# 搜索来自 vector_store 和 db_store 的数据
```

<br/>

### 4.3. 开发/生产对等

使用内存存储进行测试,后备使用生产数据库:

```python
import os
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore
from ahvn.cache import InMemCache

def create_store():
    stores = []
    
    if os.getenv("TESTING"):
        # 测试:首先添加内存存储
        test_cache = InMemCache()
        test_store = CacheKLStore(cache=test_cache)
        stores.append(test_store)
    
    # 始终添加生产数据库
    prod_store = DatabaseKLStore(database="production.db", provider="pg")
    stores.append(prod_store)
    
    return CascadeKLStore(stores=stores)

# 在测试中:如果存在则从 test_store 读取,回退到 prod_store
# 在生产中:直接从 prod_store 读取
cascade = create_store()
```

<br/>

### 4.4. 增量迁移

在不停机的情况下在存储后端之间迁移:

```python
from ahvn.klstore import CascadeKLStore, DatabaseKLStore

# 旧后端(遗留)
old_store = DatabaseKLStore(database="old_db.db", provider="sqlite")

# 新后端(现代、更快)
new_store = DatabaseKLStore(database="new_db", provider="pg", host="localhost")

# 级联:新优先,旧其次
cascade = CascadeKLStore(stores=[new_store, old_store])

# 逐步迁移数据
for kl in old_store:
    new_store.upsert(kl)           # 复制到新存储
    # old_store.remove(kl.id)      # 可选:从旧存储中删除

# 应用程序从级联读取(新优先,旧回退)
# 迁移完成后,从级联中删除 old_store
```

<br/>

## 5. 高级模式

### 5.5. 跨层的条件过滤

应用条件来控制通过级联可见的对象:

```python
cascade = CascadeKLStore(
    stores=[store1, store2, store3],
    condition=lambda kl: kl.metadata.get("status") == "published"
)

# 迭代中只有已发布的知识对象可见
for kl in cascade:
    assert kl.metadata["status"] == "published"

# 注意:get() 和 exists() 忽略条件(读取所有数据)
# 条件仅适用于迭代和删除
```

<br/>

### 5.6. 动态存储管理

在运行时修改级联:

```python
cascade = CascadeKLStore(stores=[store1, store2])

# 动态添加新层
new_store = VectorKLStore(collection="new", provider="lancedb", embedder=embedder)
cascade.stores.insert(0, new_store)  # 插入到最高优先级

# 删除一层
cascade.stores.remove(store2)

# 重新排序优先级
cascade.stores = [new_store, store1, store2]  # new_store 现在是最高优先级
```

<br/>

### 5.7. 按存储访问模式

访问单个存储以进行细粒度控制:

```python
cascade = CascadeKLStore(stores=[hot_store, warm_store, cold_store])

# 检查哪一层包含数据
for i, store in enumerate(cascade.stores):
    if kl.id in store:
        print(f"Found in tier {i}: {store.name}")

# 从特定层获取
kl_from_cold = cascade.stores[2].get(kl.id)

# 在层之间移动数据
if kl.id in cold_store and kl.metadata.get("my_custom_hotness_metric") > 100:
    hot_store.upsert(cold_store.get(kl.id))  # 提升到热层
```

<br/>

## 6. 限制和注意事项

### 6.1. 无自动同步

CascadeKLStore **不会**:
- ❌ 自动将热数据提升到更快的存储
- ❌ 自动将冷数据降级到较慢的存储
- ❌ 跨存储同步数据
- ❌ 验证存储之间的一致性

如果需要,你必须自己实现这些策略。

<br/>

### 6.2. 写管理责任

你负责:
- 决定写入哪个存储
- 处理数据复制(如果需要)
- 管理容量限制(如果有)
- 实现驱逐策略

<br/>

### 6.3. 重复数据处理

如果相同的知识对象存在于多个存储中:
- **读取**: 从第一个存储返回(最高优先级)
- **迭代**: 只返回一次(按 ID 去重)
- **更新**: 必须手动更新所有副本
- **删除**: 从所有存储中删除

<br/>

### 6.4. 性能考虑

- **读取延迟**: 最坏情况是所有存储延迟之和(如果对象在最后一个存储中)
- **迭代成本**: 遍历所有存储(如果存储多可能很慢)
- **无查询优化**: 不跨存储优化查询 — 为此使用 KLEngine

<br/>

## 7. 完整示例

```python
from ahvn.klstore import CascadeKLStore, CacheKLStore, DatabaseKLStore, VectorKLStore
from ahvn.cache import InMemCache, DiskCache
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF, ptags

# 初始化向量存储的嵌入器
embedder = LLM(preset="embedder")

# 第 1 层:用于热数据的超快内存缓存(最近 1000 篇文章)
hot_cache = InMemCache()
hot_store = CacheKLStore(cache=hot_cache, name="hot_tier")

# 第 2 层:用于温数据的快速磁盘缓存(最近 10000 篇文章)
warm_cache = DiskCache("/var/cache/knowledge_warm", size_limit=1024**3)
warm_store = CacheKLStore(cache=warm_cache, name="warm_tier")

# 第 3 层:用于结构化元数据查询的数据库
db_store = DatabaseKLStore(database="knowledge.db", provider="sqlite", name="db_tier")

# 第 4 层:用于语义搜索的向量存储(所有文章)
vector_store = VectorKLStore(
    collection="all_articles",
    provider="lancedb",
    uri="./data/vectors",
    embedder=embedder,
    name="vector_tier"
)

# 创建级联(优先级顺序: hot -> warm -> db -> vector)
cascade = CascadeKLStore(
    stores=[hot_store, warm_store, db_store, vector_store],
    name="article_cascade"
)

# 模拟文章发布工作流
articles = [
    BaseUKF(
        name="Breaking News: AI Breakthrough",
        type="news_article",
        content="Major advancement in artificial intelligence...",
        tags=ptags(CATEGORY="technology", IMPORTANCE="high", RECENCY="today")
    ),
    BaseUKF(
        name="Python Tutorial",
        type="tutorial",
        content="Learn Python programming step by step...",
        tags=ptags(CATEGORY="programming", IMPORTANCE="medium", RECENCY="this_week")
    ),
    BaseUKF(
        name="Historical Analysis of WWI",
        type="research_article",
        content="Comprehensive study of World War I causes...",
        tags=ptags(CATEGORY="history", IMPORTANCE="low", RECENCY="old")
    )
]

# 写策略:基于最近性和重要性的层
def publish_article(article):
    # 所有文章进入向量存储以进行语义搜索
    vector_store.upsert(article)
    
    # 所有文章进入数据库以进行结构化查询
    db_store.upsert(article)
    
    # 最近 + 重要的文章进入温缓存
    if article.tags.get("RECENCY") in ["today", "this_week"]:
        warm_store.upsert(article)
    
    # 突发新闻进入热缓存
    if article.tags.get("IMPORTANCE") == "high":
        hot_store.upsert(article)

# 发布文章
for article in articles:
    publish_article(article)

# 通过级联查询
print(f"Total unique articles: {len(cascade)}")  # 3

# 读取性能因层而异
news = cascade.get(articles[0].id)  # 快速(在 hot_store 中)
tutorial = cascade.get(articles[1].id)  # 中等(在 warm_store 中)
history = cascade.get(articles[2].id)  # 较慢(在 db_store 或 vector_store 中)

print(f"Breaking news: {news.name} (high priority)")
print(f"Tutorial: {tutorial.name} (medium priority)")
print(f"Historical: {history.name} (low priority)")

# 检查层分布
print("\nTier distribution:")
print(f"- Hot tier: {len(hot_store)} articles")
print(f"- Warm tier: {len(warm_store)} articles")
print(f"- Database tier: {len(db_store)} articles")
print(f"- Vector tier: {len(vector_store)} articles")

# 迭代所有唯一文章
print("\nAll articles:")
for article in cascade:
    print(f"- {article.name} ({article.type})")

# 基于访问模式将文章提升到热层
if tutorial.tags.get("IMPORTANCE") == "medium":
    hot_store.upsert(tutorial)  # 手动提升
    print(f"\nPromoted '{tutorial.name}' to hot tier")

# 从所有层删除文章
cascade.remove(history.id)
print(f"\nRemoved '{history.name}' from all tiers")
print(f"Remaining articles: {len(cascade)}")

# 清理
cascade.flush()   # 确保所有层持久化
cascade.close()   # 关闭所有连接
```

<br/>

## 8. 拓展阅读

> **提示:** 查看接口和通用操作:
> - [BaseKLStore](./base.md) - 定义 KLStore 接口和共享功能的抽象基类

> **提示:** 查看在级联中使用的各个 KLStore 实现:
> - [CacheKLStore](./cache.md) - 具有多种后端选项的轻量级缓存存储
> - [DatabaseKLStore](./database.md) - 支持 ORM 的持久化关系数据库存储
> - [VectorKLStore](./vector.md) - 用于语义相似性搜索的向量数据库存储

> **提示:** 对于跨级联存储的知识检索:
> - [KLEngine](../klengine/index.md) - 构建在 KLStore 之上的查询引擎
> - [VectorKLEngine](../klengine/vector.md) - 跨多个存储层的语义搜索
> - [DAACKLEngine](../klengine/daac.md) - 支持级联的密集且准确的检索

<br/>
