# BaseKLStore

BaseKLStore 是定义 AgentHeaven 中所有 KLStore 实现通用接口的抽象基类。它提供了一种标准化的方式来存储、检索和管理知识对象(BaseUKF 实例),支持不同的存储后端,同时确保一致的行为和功能。

## 1. 理解 KLStore

### 1.1. 什么是 KLStore?

**KLStore** 是 AgentHeaven 的知识对象存储层。可以将其视为一个专门的键值存储,其中:
- **键**是唯一的数字 ID(整数)
- **值**是知识对象(BaseUKF 实例)
- **操作**是简单的 CRUD(创建、读取、更新、删除)操作

KLStore **有意**设计为**不**支持查询、过滤或搜索 — 这些高级操作由**KLEngine**处理,KLEngine 构建在 KLStore 之上。

<br/>

### 1.2. 为什么将存储与查询分离?

这种关注点分离带来了几个好处:

**存储后端的灵活性**:你可以根据性能、持久化、可扩展性或成本等需求,轻松地在不同的存储后端(内存、磁盘、数据库、向量数据库)之间切换,而无需更改查询逻辑。

**多视角查询**:多个 KLEngine 可以共享同一个 KLStore,每个引擎在同一个知识库上提供不同的查询能力(例如向量相似度、分面检索、全文检索)。这消除了数据重复,同时实现了多视角的知识检索。

**松耦合**:虽然某些原地 KLEngine 与特定 KLStore 配合效果最佳(例如,原地 `VectorKLEngine` 需要使用相同向量后端的 `VectorKLStore`),但许多非原地 KLEngine 可以与任何 KLStore 配合使用。这种松耦合使系统模块化且可扩展。

**高级路由**：模块化设计支持高级模式,如 [CascadeKLStore](./cascade.md),它根据新鲜度、重要性、访问模式等标准将知识对象路由到不同的存储后端 — 将热数据保存在快速存储中,将冷数据保存在更便宜、更慢的存储中,或任何其他用户自定义的路由逻辑。

<br/>

## 2. 共享功能

所有 KLStore 实现都从 `BaseKLStore` 继承以下通用能力:

### 2.1 关键操作

- **存储 CRUD**: 使用唯一标识符插入、更新和删除知识对象
- **检索**: 通过 ID 获取知识对象,支持灵活的键处理(int、str 或 BaseUKF)
- **存在性检查**: 验证知识对象是否存在于存储中
- **迭代**: 遍历所有存储的知识对象

<br/>

### 2.2 批量操作

- **批量插入**: 高效地插入多个知识对象
- **批量更新插入**: 在一次操作中插入或更新多个知识对象
- **批量删除**: 同时删除多个知识对象

<br/>

### 2.3 灵活的键处理

BaseKLStore 接受三种类型的键用于所有操作:
- `int`: 直接的数字 ID
- `str`: 数字 ID 的字符串表示(自动转换)
- `BaseUKF`: Knowledge 对象实例(自动提取 ID)

<br/>

### 2.4 条件存储

所有 KLStore 实现都支持可选的条件过滤:
```python
# 只存储符合特定条件的知识对象
store = MyKLStore(condition=lambda kl: kl.category == "important")
```

<br/>

## 3. 核心接口方法

BaseKLStore 定义了所有实现必须提供的基本接口:

### 3.1 必需的抽象方法

- `_get(key, default)`: 通过 ID 检索知识对象。如果未找到则返回 `default`(默认为 Ellipsis)。

- `_upsert(kl)`: 在存储中插入或更新知识对象。

- `_remove(key)`: 通过 ID 从存储中删除知识对象。

- `_itervalues()`: 返回存储中所有知识对象的迭代器。

- `_clear()`: 从存储中删除所有知识对象。

<br/>

### 3.2 可选的优化方法

- `_has(key)`: 检查给定键的知识对象是否存在。默认实现使用 `_get`。重写此方法以优化性能。

- `__len__()`: 返回存储中知识对象的数量。默认实现会遍历所有对象。重写此方法以优化性能。

- `_insert(kl)`: 仅当知识对象不存在时插入。默认实现使用 `_has` 和 `_upsert`。重写以获得更好的性能。

- `_batch_upsert(kls)`, `_batch_insert(kls)`, `_batch_remove(keys)`: 优化的批量操作。默认实现会遍历各个操作。重写以提高大数据集的性能。

- `close()`: 可选方法,用于关闭任何打开的连接或资源。默认为空操作。

- `flush()`: 可选方法,用于将任何缓冲数据刷新到持久化存储(例如,从内存到磁盘)。默认为空操作。

<br/>

## 4. 使用模式

### 4.1 基本操作

```python
class MyKLStore(BaseKLStore):
    # 在这里实现必需的方法
    pass

# 所有 KLStore 实现都支持这些操作
store = MyKLStore("my_store")

# 插入知识对象
store.insert(knowledge_object)
store.upsert(knowledge_object)  # 插入或更新

# 检索知识对象
kl = store.get(123)                    # 通过 ID
kl = store.get("123")                  # 通过字符串 ID  
kl = store.get(knowledge_object)       # 通过 BaseUKF 实例

# 检查存在性
exists = 123 in store
exists = store.exists(123)

# 删除知识对象
del store[123]
store.remove(123)
```

<br/>

### 4.2 批量操作

```python
# 批量插入(仅当不存在时)
store.batch_insert([kl1, kl2, kl3])

# 批量更新插入(插入或更新)
store.batch_upsert([kl1, kl2, kl3])

# 批量删除
store.batch_remove([123, 456, 789])
```

<br/>

### 4.3 迭代和计数

```python
# 遍历所有知识对象
for kl in store:
    print(kl.id, kl.content)

# 统计知识对象数量
count = len(store)
```

<br/>

## 5. 实现指南

创建自定义 KLStore 实现时:

### 5.1 扩展 BaseKLStore

```python
from ahvn.klstore.base import BaseKLStore
from ahvn.ukf.base import BaseUKF

class MyKLStore(BaseKLStore):
    def __init__(self, name=None, condition=None, **kwargs):
        super().__init__(name, condition, **kwargs)
        # 初始化你的存储后端
    
    # 实现必需的抽象方法
    def _get(self, key: int, default: Any = ...) -> BaseUKF:
        # 你的实现
        pass
    
    def _upsert(self, kl: BaseUKF):
        # 你的实现
        pass
    
    def _remove(self, key: int):
        # 你的实现
        pass
    
    def _itervalues(self) -> Generator[BaseUKF, None, None]:
        # 你的实现
        pass
    
    def _clear(self):
        # 你的实现
        pass
```

<br/>

### 5.2. 性能优化

重写优化方法以提高性能:

```python
def __len__(self) -> int:
    # 返回计数而不遍历所有对象
    return self._backend.count()

def _has(self, key: int) -> bool:
    # 高效的存在性检查
    return self._backend.contains(key)

def _batch_upsert(self, kls: Iterable[BaseUKF]):
    # 如果后端支持,使用批量操作
    self._backend.batch_upsert(kls)
```

<br/>

## 6. 拓展阅读

> **提示:** 查看具体的 KLStore 实现:
> - [CacheKLStore](./cache.md) - 使用缓存后端的高性能内存或磁盘存储
> - [DatabaseKLStore](./database.md) - 支持 ORM 的持久化关系数据库存储
> - [VectorKLStore](./vector.md) - 用于基于相似度检索的向量数据库存储
> - [CascadeKLStore](./cascade.md) - 基于自定义标准的多层存储路由

> **提示:** 查看知识查询和检索能力:
> - [KLEngine](../klengine/index.md) - 构建在 KLStore 之上的查询引擎
> - [DAACKLEngine](../klengine/daac.md) - 密集且准确的知识检索引擎
> - [VectorKLEngine](../klengine/vector.md) - 向量相似度检索引擎
> - [FacetKLEngine](../klengine/facet.md) - 关系数据库上的分面检索

> **提示:** 查看知识对象基础知识:
> - [BaseUKF](../ukf/ukf-v1.0.md) - 用于表示知识对象的统一知识格式
> - [UKF 数据类型](../ukf/data-types.md) - UKF、Pydantic 和各种数据库之间的数据类型映射

<br/>
