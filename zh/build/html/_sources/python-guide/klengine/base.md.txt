# BaseKLEngine

BaseKLEngine 是定义 AgentHeaven 中所有 KLEngine 实现通用接口的抽象基类。它提供了一种标准化的方式来索引、搜索和检索知识对象(BaseUKF 实例),支持不同的搜索方法,同时确保一致的行为和功能。

## 1. 理解 KLEngine

### 1.1. 什么是 KLEngine?

**KLEngine** 是 AgentHeaven 的知识对象查询和检索层。可以将其视为一个专门的搜索系统,其中:
- **输入**是带有搜索参数的查询(过滤条件、关键词、嵌入向量等)
- **输出**是匹配的知识对象列表及其元数据
- **操作**主要集中在搜索上,同时支持索引和维护

KLEngine **有意**设计为专注于**搜索和检索** — 虽然它支持索引操作(插入、更新、删除)来维护搜索索引,但其核心目的是提供各种查询和检索知识对象的方法。

<br/>

### 1.2. 为什么将存储与搜索分离?

这种关注点分离带来了几个好处:

**搜索方法的灵活性**:你可以根据准确性、速度或复杂性等需求,轻松地在不同的搜索方法(向量相似度、分面检索、模式匹配)之间切换或组合,而无需更改存储后端。

**存储独立性**:KLEngine 可以在有或没有附加 KLStore 的情况下工作。当附加时,它们按需从存储中检索完整的知识对象。当分离时,它们仍然可以提供带有 ID 或缓存元数据的搜索结果。这种灵活性支持各种架构模式。

**原地 vs. 独立模式**:一些引擎在原地操作,直接查询存储后端(例如 `FacetKLEngine` 配合 `DatabaseKLStore`),而其他引擎维护自己的搜索索引(例如 `DAACKLEngine`)。这种设计可以适应轻量级和专用的搜索策略。

**多模态检索**:模块化设计支持在同一知识库上组合多个搜索引擎 — 使用向量搜索进行语义查询,使用分面检索进行结构化过滤,使用模式匹配进行实体识别 — 所有这些都协同工作以提供全面的检索能力。

<br/>

## 2. 共享功能

所有 KLEngine 实现都从 `BaseKLEngine` 继承以下通用能力:

### 2.1. 核心操作

- **搜索操作**: 执行查询以检索匹配的知识对象
- **索引维护**: 在搜索索引中插入、更新和删除知识对象
- **存储附加**: 可选地附加到 KLStore 以检索完整的知识对象
- **灵活检索**: 通过 ID 从引擎或附加的存储中获取知识对象

<br/>

### 2.2. 批量操作

- **批量插入**: 高效地将多个知识对象插入到搜索索引中
- **批量更新插入**: 在一次操作中插入或更新多个知识对象
- **批量删除**: 同时从搜索索引中删除多个知识对象

<br/>

### 2.3. 多种搜索模式

KLEngine 通过路由机制支持多种搜索方法:
- **默认搜索**: 不使用模式参数调用 `search()` 来调用 `_search()`
- **命名搜索**: 使用 `search(mode="xxx")` 来调用 `_search_xxx()`
- **搜索发现**: 使用 `list_search()` 来发现可用的搜索模式

<br/>

### 2.4. 灵活的键处理

BaseKLEngine 接受三种类型的键用于所有操作:
- `int`: 直接数字 ID
- `str`: 数字 ID 的字符串表示(自动转换)
- `BaseUKF`: 知识对象实例(自动提取 ID)

<br/>

### 2.5. 条件索引

所有 KLEngine 实现都支持可选的条件过滤:
```python
# 只索引满足特定条件的知识对象
engine = MyKLEngine(condition=lambda kl: kl.category == "important")
```

<br/>

### 2.6. 原地 vs. 独立模式

KLEngine 可以在两种模式下操作:
- **独立模式** (`inplace=False`): 引擎维护自己独立于存储的搜索索引
- **原地模式** (`inplace=True`): 引擎直接在附加的存储后端上操作,而不维护单独的索引

<br/>

## 3. 核心接口方法

BaseKLEngine 定义了所有实现必须提供的基本接口:

### 3.1. 必需的抽象方法

- `_search(include, *args, **kwargs)`: 执行默认的搜索操作。返回包含搜索结果的字典列表,键限制为 `include`。按照惯例,使用 `"id"` 表示 `BaseUKF.id`,使用 `"kl"` 表示 `BaseUKF` 实例本身。

- `_upsert(kl)`: 在搜索索引中插入或更新知识对象。

- `_remove(key)`: 通过 ID 从搜索索引中删除知识对象。如果不适用于该引擎类型,可以用空函数或抛出异常来覆盖。

- `_clear()`: 清除搜索索引中的所有知识对象。

<br/>

### 3.2. 可选方法

- `_get(key, default)`: 从引擎的内部缓存或索引中检索知识对象。虽然不是必需的,但如果知识对象应该在没有附加 KLStore 的情况下通过 `search()` 返回,不实现此方法可能会导致意外行为。

- `_post_search(results, include, *args, **kwargs)`: 后处理搜索结果。默认情况下,返回未更改的结果。覆盖此方法以添加排序、过滤或增强。

- `_search_xxx(include, *args, **kwargs)`: 用于不同搜索模式的命名搜索方法。例如,`_search_vector()` 用于向量相似度搜索,`_search_facet()` 用于分面过滤。

<br/>

### 3.3. 可选的优化方法

- `_batch_upsert(kls)`, `_batch_insert(kls)`, `_batch_remove(keys)`: 优化的批量操作。默认实现遍历单个操作。对于大型数据集,覆盖此方法以获得更好的性能。

- `close()`: 可选方法,用于关闭任何打开的连接或资源。默认为无操作。

- `flush()`: 可选方法,用于将任何缓冲的数据刷新到持久存储。默认为无操作。

- `sync()`: 通过清除并重新索引所有知识对象来同步引擎与其附加的 KLStore。当存储已从外部修改时很有用。

<br/>

## 4. 使用模式

### 4.1. 基本操作

```python
class MyKLEngine(BaseKLEngine):
    # 在此处实现必需的方法
    pass

# 创建带有可选存储附加的引擎
store = MyKLStore("my_store")
engine = MyKLEngine(storage=store, name="my_engine")

# 将知识对象插入到索引中
engine.insert(knowledge_object)
engine.upsert(knowledge_object)  # 插入或更新

# 搜索知识对象
results = engine.search(query="example", include=["id", "kl"])
for result in results:
    kl_id = result["id"]
    kl_obj = result["kl"]
    
# 检索特定的知识对象
kl = engine.get(123)  # 从引擎缓存或附加的存储中

# 从索引中删除知识对象
engine.remove(123)
del engine[123]
```

<br/>

### 4.2. 批量操作

```python
# 批量插入(仅当不存在时)
engine.batch_insert([kl1, kl2, kl3])

# 批量更新插入(插入或更新)
engine.batch_upsert([kl1, kl2, kl3])

# 批量删除
engine.batch_remove([123, 456, 789])
```

<br/>

### 4.3. 多种搜索模式

```python
# 发现可用的搜索模式
modes = engine.list_search()  # 返回 [None, 'vector', 'facet', ...]

# 使用默认搜索
results = engine.search(query="example")

# 使用命名搜索模式
results = engine.search(query="example", mode="vector")
results = engine.search(filters={"category": "science"}, mode="facet")
```

<br/>

### 4.4. 存储附加

```python
# 创建没有存储的引擎
engine = MyKLEngine(name="my_engine")

# 稍后附加存储
store = MyKLStore("my_store")
engine.attach(store)

# 搜索返回 ID,检索使用附加的存储
results = engine.search(query="example", include=["id", "kl"])

# 分离存储
engine.detach()

# 同步引擎与存储
engine.sync()  # 从存储重新索引所有对象
```

<br/>

### 4.5. 灵活的结果包含

```python
# 控制在搜索结果中包含哪些字段
results = engine.search(
    query="example",
    include=["id", "kl", "score", "metadata"]
)

# 最小结果(仅 ID)
results = engine.search(query="example", include=["id"])

# 完整的知识对象
results = engine.search(query="example", include=["id", "kl"])
```

<br/>

## 5. 实现指南

创建自定义 KLEngine 实现时:

### 5.1. 扩展 BaseKLEngine

```python
from ahvn.klengine.base import BaseKLEngine
from ahvn.ukf.base import BaseUKF
from typing import Any, Dict, List, Optional, Iterable

class MyKLEngine(BaseKLEngine):
    def __init__(
        self,
        storage=None,
        inplace=False,
        name=None,
        condition=None,
        **kwargs
    ):
        super().__init__(storage, inplace, name, condition, **kwargs)
        # 初始化你的搜索索引
        self._index = {}  # 示例:简单的字典索引
    
    # 实现必需的抽象方法
    def _search(
        self,
        include: Optional[Iterable[str]] = None,
        query: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """你的搜索实现"""
        results = []
        # 执行搜索逻辑
        for kl_id, metadata in self._index.items():
            if self._matches(metadata, query):
                results.append({"id": kl_id, "score": 1.0})
        return results
    
    def _upsert(self, kl: BaseUKF):
        """更新搜索索引"""
        self._index[kl.id] = self._extract_metadata(kl)
    
    def _remove(self, key: int):
        """从搜索索引中删除"""
        self._index.pop(key, None)
    
    def _clear(self):
        """清除搜索索引"""
        self._index.clear()
```

<br/>

### 5.2. 添加命名搜索模式

```python
class MyKLEngine(BaseKLEngine):
    # ...(前面的代码)
    
    def _search_exact(
        self,
        include: Optional[Iterable[str]] = None,
        keyword: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """精确关键词匹配搜索模式"""
        results = []
        for kl_id, metadata in self._index.items():
            if keyword in metadata.get("content", ""):
                results.append({"id": kl_id, "score": 1.0})
        return results
    
    def _search_fuzzy(
        self,
        include: Optional[Iterable[str]] = None,
        keyword: str = "",
        threshold: float = 0.8,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """模糊匹配搜索模式"""
        results = []
        # 模糊匹配逻辑
        return results
```

<br/>

### 5.3. 性能优化

覆盖优化方法以获得更好的性能:

```python
def _batch_upsert(self, kls: Iterable[BaseUKF]):
    """优化的批量索引"""
    # 如果你的后端支持批量操作,使用它们
    for kl in kls:
        self._index[kl.id] = self._extract_metadata(kl)
    self._rebuild_secondary_indexes()  # 示例:重建一次

def _post_search(
    self,
    results: List[Dict[str, Any]],
    include: Optional[Iterable[str]] = None,
    **kwargs
) -> List[Dict[str, Any]]:
    """后处理搜索结果"""
    # 添加重新排序、去重或增强
    results = sorted(results, key=lambda r: r.get("score", 0), reverse=True)
    return results[:kwargs.get("limit", 100)]
```

<br/>

### 5.4. 原地引擎实现

```python
from ahvn.klstore.database import DatabaseKLStore

class MyInPlaceKLEngine(BaseKLEngine):
    inplace = True  # 标记为原地引擎
    
    def __init__(self, storage: DatabaseKLStore, **kwargs):
        # 原地引擎需要存储后端
        if storage is None:
            raise ValueError("In-place engines require a storage backend")
        super().__init__(storage=storage, inplace=True, **kwargs)
    
    def _search(
        self,
        include: Optional[Iterable[str]] = None,
        filters: Dict[str, Any] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """直接在存储后端上搜索"""
        # 直接查询数据库
        query = self.storage.session.query(self.storage.entity)
        
        # 应用过滤条件
        if filters:
            for key, value in filters.items():
                query = query.filter(getattr(self.storage.entity, key) == value)
        
        # 执行并返回结果
        results = []
        for entity in query.all():
            results.append({"id": entity.id})
        return results
    
    def _upsert(self, kl: BaseUKF):
        """原地引擎无操作"""
        pass  # 存储处理持久化
    
    def _remove(self, key: int):
        """原地引擎无操作"""
        pass  # 存储处理删除
    
    def _clear(self):
        """原地引擎无操作"""
        pass  # 存储处理清除
```

<br/>

## 6. 拓展阅读

> **提示:** 对于具体的 KLEngine 实现,请参阅:
> - [FacetKLEngine](./facet.md) - 结构化搜索,支持类 ORM 的过滤和 SQL 查询
> - [DAACKLEngine](./daac.md) - 使用 Aho-Corasick 自动机的高性能字符串匹配
> - [VectorKLEngine](./vector.md) - 用于语义检索的向量相似度搜索

> **提示:** 对于与 KLEngine 配合使用的存储后端,请参阅:
> - [KLStore](../klstore/index.md) - 知识对象的存储层
> - [CacheKLStore](../klstore/cache.md) - 用于快速访问的内存存储
> - [DatabaseKLStore](../klstore/database.md) - 持久化关系存储
> - [VectorKLStore](../klstore/vector.md) - 向量数据库存储

> **提示:** 对于知识对象基础,请参阅:
> - [BaseUKF](../ukf/ukf-v1.0.md) - 用于表示知识对象的统一知识格式
> - [UKF 数据类型](../ukf/data-types.md) - UKF、Pydantic 和数据库之间的数据类型映射

<br/>
