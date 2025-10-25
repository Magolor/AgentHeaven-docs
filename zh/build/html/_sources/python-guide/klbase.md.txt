# KLBase

**KLBase** 是 AgentHeaven 知识管理系统的中心编排层。它提供了统一的接口,用于跨多个存储后端(知识存储)和搜索引擎(知识引擎)管理知识条目(UKF 对象)。通过组合不同的存储和引擎实现,KLBase 能够根据特定应用需求实现灵活、高效的知识检索和操作。

<br/>

## 1. 核心概念

**KLBase** 协调三个主要组件:

- **UKF (Universal Knowledge Framework,统一知识格式)**: 表示知识条目的数据模型(参见 [UKF 指南](./ukf/index.md))
- **KLStore (知识存储)**: 持久化 UKF 对象的存储后端(例如数据库、缓存、文件系统)
- **KLEngine (知识引擎)**: 索引和查询 UKF 对象的搜索和检索引擎(例如分面检索、自动补全、向量搜索)

KLBase 作为 **编排层**,负责:
1. 将 CRUD 操作路由到适当的存储后端
2. 维护多个存储和引擎之间的一致性
3. 提供跨不同引擎类型的统一搜索接口
4. 通过 `@reg_toolspec` 装饰器暴露工具规范,以便智能体集成

<br/>

## 2. 基本架构

**KLBase** 维护两个主要集合,它们协同工作以提供全面的知识管理能力:

**存储层** (`storages: Dict[str, BaseKLStore]`):
- 一个命名存储后端的字典,用于持久化 UKF 对象
- 每个存储提供对知识条目的 CRUD 操作(创建、读取、更新、删除)
- 可用的存储实现:
  - **CacheKLStore**: 内存或基于文件的缓存,用于快速临时存储
  - **DatabaseKLStore**: 关系数据库后端(PostgreSQL、MySQL、SQLite),用于持久化存储
  - **VectorDBKLStore**: 专门的向量数据库存储,用于基于嵌入的操作
  - **CascadeKLStore**: 分层存储链,按顺序查询多个后端

**引擎层** (`engines: Dict[str, BaseKLEngine]`):
- 一个命名搜索和检索引擎的字典,用于索引和查询 UKF 对象
- 每个引擎提供针对不同查询模式优化的专门搜索能力
- 可用的引擎实现:
  - **FacetKLEngine**: 支持复杂过滤和聚合的多维分面检索
  - **DAACKLEngine**: 动态自动补全引擎,用于基于前缀和模糊匹配
  - **VectorKLEngine**: 使用向量嵌入的语义相似性搜索

**编排模型:**
KLBase 通过将数据操作路由到适当的后端来协调这些层。当插入或更新 UKF 对象时,KLBase 将更改传播到所有指定的存储和引擎以维护一致性。当进行搜索时,KLBase 将查询委托给适当的引擎,并从关联的存储后端检索完整对象。

<br/>

## 3. 类定义

### 3.1. 构造函数

```python
class KLBase(ToolRegistry):
    def __init__(
        self,
        storages: Optional[Union[List[BaseKLStore], Dict[str, BaseKLStore]]] = None,
        engines: Optional[Union[List[BaseKLEngine], Dict[str, BaseKLEngine]]] = None,
        name: Optional[str] = None,
        *args,
        **kwargs,
    ):
```

**参数:**

- **storages** (`Optional[Union[List[BaseKLStore], Dict[str, BaseKLStore]]]`): 
  - 用于持久化 UKF 对象的存储后端
  - 可以作为列表(按 `storage.name` 索引)或字典(自定义键)提供
  - 如果为 None,则默认为空字典
  
- **engines** (`Optional[Union[List[BaseKLEngine], Dict[str, BaseKLEngine]]]`): 
  - 用于查询 UKF 对象的搜索/检索引擎
  - 可以作为列表(按 `engine.name` 索引)或字典(自定义键)提供
  - 如果为 None,则默认为空字典
  
- **name** (`Optional[str]`): 
  - 此 KLBase 实例的标识符
  - 如果为 None,则默认为 "default"

<br/>

### 3.2. 存储管理

#### 3.2.1. 添加存储

```python
def add_storage(self, storage: BaseKLStore, name: Optional[str] = None):
```

注册新的存储后端。

**参数:**
- **storage** (`BaseKLStore`): 要添加的存储实例
- **name** (`Optional[str]`): 注册键(默认为 `storage.name`)

#### 3.2.2. 移除存储

```python
def del_storage(self, name: str):
```

注销并移除存储后端。

**参数:**
- **name** (`str`): 要移除的存储的注册键

<br/>

### 3.3. 引擎管理

#### 3.3.1. 添加引擎

```python
def add_engine(self, engine: BaseKLEngine, name: Optional[str] = None):
```

注册新的搜索/检索引擎。

**参数:**
- **engine** (`BaseKLEngine`): 要添加的引擎实例
- **name** (`Optional[str]`): 注册键(默认为 `engine.name`)

#### 3.3.2. 移除引擎

```python
def del_engine(self, name: str):
```

注销并移除引擎。

**参数:**
- **name** (`str`): 要移除的引擎的注册键

<br/>

## 4. 数据操作

所有数据操作都支持通过 `storages` 和 `engines` 参数进行选择性的存储/引擎目标设定。如果未指定,操作将应用于 **所有** 已注册的存储/引擎。

### 4.1. 插入/更新插入操作

#### 4.1.1. 单个更新插入

```python
def upsert(self, kl: BaseUKF, storages: List[str] = None, engines: List[str] = None):
```

跨指定的存储和引擎插入或更新单个 UKF 对象。

**参数:**
- **kl** (`BaseUKF`): 要更新插入的知识条目
- **storages** (`List[str]`, 可选): 目标存储名称(默认为全部)
- **engines** (`List[str]`, 可选): 目标引擎名称(默认为全部)

#### 4.1.2. 单个插入

```python
def insert(self, kl: BaseUKF, storages: List[str] = None, engines: List[str] = None):
```

插入新的 UKF 对象(如果已存在,可能会引发错误,取决于后端)。

**参数:** 与 `upsert` 相同

#### 4.1.3. 批量更新插入

```python
def batch_upsert(self, kls: List[BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

批量更新插入多个 UKF 对象(比单个更新插入更高效)。

**参数:**
- **kls** (`List[BaseUKF]`): 要更新插入的知识条目列表
- **storages/engines**: 与单个更新插入相同

#### 4.1.4. 批量插入

```python
def batch_insert(self, kls: List[BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

批量插入多个 UKF 对象。

**参数:** 与 `batch_upsert` 相同

<br/>

#### 4.1.5. 选择性同步

控制哪些存储/引擎接收更新:

```python
# 仅更新数据库存储
klbase.upsert(kl, storages=["db_store"], engines=[])

# 仅更新搜索引擎
klbase.upsert(kl, storages=[], engines=["facet_engine", "vec_engine"])

# 更新所有(默认)
klbase.upsert(kl)
```

<br/>

### 4.2. 移除操作

#### 4.2.1. 单个移除

```python
def remove(self, key: Union[int, str, BaseUKF], storages: List[str] = None, engines: List[str] = None):
```

通过键移除单个 UKF 对象。

**参数:**
- **key** (`Union[int, str, BaseUKF]`): 要移除的 ID、名称或 UKF 实例
- **storages/engines**: 目标后端(默认为全部)

#### 4.2.2. 批量移除

```python
def batch_remove(self, keys: List[Union[int, str, BaseUKF]], storages: List[str] = None, engines: List[str] = None):
```

批量移除多个 UKF 对象。

**参数:**
- **keys** (`List[Union[int, str, BaseUKF]]`): 要移除的标识符列表
- **storages/engines**: 目标后端(默认为全部)

#### 4.2.3. 清除所有

```python
def clear(self, storages: List[str] = None, engines: List[str] = None):
```

从指定的存储和引擎中移除所有 UKF 对象。

**参数:**
- **storages/engines**: 要清除的目标后端(默认为全部)

<br/>

### 4.3. 搜索操作

```python
def search(self, engine: str, *args, **kwargs) -> Iterable[Dict[str, Any]]:
```

使用指定引擎执行搜索查询。

**参数:**
- **engine** (`str`): 要使用的引擎名称
- ***args, **kwargs**: 引擎特定的搜索参数

**返回:**
- `Iterable[Dict[str, Any]]`: 搜索结果的字典列表

**标准结果键**(取决于引擎):
- `"id"` (`int`): UKF 对象标识符
- `"kl"` (`BaseUKF`): 实际的 UKF 实例(如果引擎可恢复)
- 附加键因引擎类型而异(例如,向量搜索的 `"score"`,自动补全的 `"rank"`)

**示例:**
```python
# 分面检索
results = klbase.search(engine='facet_engine', mode='facet', tags=Facet.NF(slot="TOPIC", value="math"))

# 向量搜索
results = klbase.search(engine='vec_engine', query="fibonacci sequence", topk=5)

# 自动补全
results = klbase.search(engine='ac_engine', query="Fibo", topk=10)
```

<br/>

### 4.4. 列出搜索方法

```python
def list_search(self) -> List[Tuple[str, Optional[str]]]:
```

枚举已注册引擎中所有可用的搜索方法。

**返回:**
- `List[Tuple[str, Optional[str]]]`: (引擎名称, 搜索模式) 对的列表
  - `engine_name`: 引擎的名称
  - `search_mode`: 引擎的搜索模式(可选,如果引擎只有一种模式则为 None)

**示例:**
```python
search_methods = klbase.list_search()
# [('facet_engine', 'facet'), ('ac_engine1', None), ('vec_engine', 'vector')]
```

<br/>

## 5. 创建自定义 KLBase 应用

创建基于 KLBase 的应用的典型工作流程:

### 5.1. 继承 KLBase

```python
from ahvn.klbase import KLBase
from ahvn.klstore import DatabaseKLStore, CacheKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine, VectorKLEngine
from ahvn.tool.mixin import reg_toolspec

class MyKLBase(KLBase):
    def __init__(self, name: str, path: Optional[str] = None):
        super().__init__(name=name)
        self.path = path or f"./.ahvn/{self.name}/"
        
        # 配置存储和引擎(见下文)
```

<br/>

### 5.2. 配置存储和引擎

在 `__init__` 方法中,设置你的存储和引擎组合:

```python
# 示例: 多个存储后端
self.add_storage(
    CacheKLStore(name="cache_store", cache=JsonCache(path=f"{self.path}/cache"))
)
self.add_storage(
    DatabaseKLStore(name="db_store", provider="pg", database="my_db")
)

# 示例: 分面检索引擎
self.add_engine(
    FacetKLEngine(
        name="facet_engine",
        storage=self.storages["db_store"],
        inplace=True,  # 使用存储的原生查询能力
    )
)

# 示例: 知识条目的自动补全引擎
self.add_engine(
    DAACKLEngine(
        name="ac_by_name",
        storage=self.storages["db_store"],
        path=f"{self.path}/ac_index",
        encoder=lambda kl: [kl.name or "", kl.content or ""],
        condition=lambda kl: kl.type == "knowledge",
    )
)

# 示例: 经验条目的向量搜索引擎
self.add_engine(
    VectorKLEngine(
        name="vec_engine",
        provider="pgvector",
        collection="vec_collection",
        storage=self.storages["db_store"],
        encoder=(
            lambda kl: f"{kl.name} | {kl.content}",
            lambda query: query
        ),
        embedder="embedder",  # 引用已配置的嵌入器
        condition=lambda kl: kl.type == "experience",
    )
)
```

**关键考虑因素:**

- **存储选择**: 根据持久化需求选择(缓存用于临时,数据库用于长期)
- **引擎-存储配对**: 引擎通常引用存储后端进行数据检索
- **原地 vs. 外部索引**: 
  - `inplace=True`: 使用存储的原生查询(例如 SQL WHERE 子句)
  - `inplace=False`: 维护单独的索引结构
- **条件索引**: 使用 `condition` lambda 选择性地索引 UKF 对象(例如按类型)

<br/>

### 5.3. 定义工具规范

使用 `@reg_toolspec()` 装饰器将方法暴露为智能体可调用的工具:

```python
from typing import Dict, Any
from ahvn.utils.db.facet import Facet

class MyKLBase(KLBase):
    # ... __init__ 配置 ...
    
    @reg_toolspec()
    def facet_search(
        self, 
        facets: Dict[str, Any], 
        topk: int = 20, 
        offset: int = 0
    ) -> Dict[str, Any]:
        """在 KLBase 上执行分面检索。
        
        Args:
            facets (Dict[str, Any]): 分面条件的字典。
                每个分面是一个键值对,其中键是分面名称,
                值是期望的值或条件。
                对于复杂条件,使用 Facet.NF、Facet.LIKE、Facet.OR 等。
                示例:
                    {
                        "tags": Facet.NF(slot="TOPIC", value=Facet.LIKE("math%")),
                        "priority": Facet.OR([42, 7]),
                        "type": "knowledge"
                    }
                支持的字段: id、name、type、content、tags、synonyms、priority
            topk (int, 可选): 最大结果数。默认为 20。
            offset (int, 可选): 要跳过的初始结果数。默认为 0。
            
        Returns:
            Dict[str, Any]: 包含以下键的字典:
                - "cnt" (int): 匹配项的总数
                - "kls" (List[BaseUKF]): 前 k 个匹配的知识条目
        """
        ids = self.engines['facet_engine'].search(
            mode='facet', include=['id'], **facets
        )
        return {
            "cnt": len(ids),
            "kls": [
                self.engines['facet_engine'].storage.get(id=id_) 
                for id_ in ids[offset:offset+topk]
            ]
        }
    
    @reg_toolspec()
    def vector_search(
        self, 
        query: str, 
        topk: int = 5
    ) -> List[Dict[str, Any]]:
        """执行语义向量搜索。
        
        Args:
            query (str): 自然语言搜索查询
            topk (int, 可选): 要返回的结果数。默认为 5。
            
        Returns:
            List[Dict[str, Any]]: 包含以下键的搜索结果:
                - "id" (int): UKF 对象 ID
                - "kl" (BaseUKF): 知识条目
                - "score" (float): 相似度分数
        """
        return self.search(
            engine='vec_engine',
            query=query,
            include=["id", "kl", "score"],
            topk=topk
        )
```

**工具定义的最佳实践:**

1. **全面的文档字符串**: 包含详细描述、参数类型和示例(由 `@reg_toolspec` 自动解析)
2. **合理的默认值**: 为可选参数提供默认值
3. **结构化返回**: 返回字典或结构化对象,便于智能体解析
4. **错误处理**: 考虑在 try-except 中包装引擎调用以优雅地处理失败
5. **参数验证**: 在传递给底层引擎之前验证输入

<br/>

### 5.4. 导出工具供智能体使用

```python
# 实例化你的 KLBase
klbase = MyKLBase(name="my_app_kb")

# 将所有 @reg_toolspec 工具导出为 ToolSpec 对象
tools = klbase.to_toolspecs()

# 列出可用工具
tool_names = klbase.list_toolspecs()
print(tool_names)  # ['facet_search', 'vector_search']

# 直接使用工具
result = tools['facet_search'](facets={"type": "knowledge"}, topk=10)

# 或与智能体框架集成
# (例如,将工具传递给 LLM 函数调用、MCP 服务器等)
```

<br/>

## 6. 完整示例

下面是一个演示 KLBase 使用的完整示例(来自 `db_demo.py`):

```python
from ahvn.ukf import Knowledge, Experience, ptags
from ahvn.cache import InMemCache, JsonCache
from ahvn.klstore import DatabaseKLStore, CacheKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine, VectorKLEngine
from ahvn.klbase import KLBase
from ahvn.tool.mixin import reg_toolspec
from ahvn.utils.db.facet import Facet

class MyKLBase(KLBase):
    def __init__(self, name: str, path: Optional[str] = None):
        super().__init__(name=name)
        self.path = path or f"./.ahvn/{self.name}/"
        
        # 存储 1: JSON 缓存,用于快速本地访问
        self.add_storage(
            CacheKLStore(
                name="store1",
                cache=JsonCache(path=f"{self.path}/store1")
            )
        )
        
        # 存储 2: PostgreSQL 数据库,用于持久化存储
        self.add_storage(
            DatabaseKLStore(
                name="store2",
                provider="pg",
                database="store2"
            )
        )
        
        # 引擎 1: 数据库上的分面检索
        self.add_engine(
            FacetKLEngine(
                name="facet_engine",
                storage=self.storages["store2"],
                inplace=True,
            )
        )
        
        # 引擎 2: 按名称和内容自动补全
        self.add_engine(
            DAACKLEngine(
                name="ac_engine1",
                storage=self.storages["store2"],
                path=f"{self.path}/ac_index_by_name_content",
                encoder=lambda kl: [kl.name or "", kl.content or ""],
                condition=lambda kl: kl.type == "knowledge",
            )
        )
        
        # 引擎 3: 按同义词自动补全
        self.add_engine(
            DAACKLEngine(
                name="ac_engine2",
                storage=self.storages["store2"],
                path=f"{self.path}/ac_index_by_synonyms",
                encoder=lambda kl: [syn or "" for syn in kl.synonyms],
                condition=lambda kl: kl.type == "knowledge",
            )
        )
        
        # 引擎 4: 经验的向量搜索
        self.add_engine(
            VectorKLEngine(
                name="vec_engine",
                provider="pgvector",
                collection="vec_store2",
                storage=self.storages["store2"],
                inplace=False,
                include=["id"],
                encoder=(
                    lambda kl: f"{kl.name or ''} | {kl.content or ''}",
                    lambda query: query
                ),
                embedder="embedder",
                condition=lambda kl: kl.type == "experience",
            )
        )
    
    @reg_toolspec()
    def facet_search(
        self,
        facets: Dict[str, Any],
        topk: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """在 KLBase 上执行分面检索。"""
        ids = self.engines['facet_engine'].search(
            mode='facet', include=['id'], **facets
        )
        return {
            "cnt": len(ids),
            "kls": [
                self.engines['facet_engine'].storage.get(id=id_)
                for id_ in ids[offset:offset+topk]
            ]
        }

# 使用示例
if __name__ == "__main__":
    klbase = MyKLBase(name="my_klbase")
    klbase.clear()
    
    # 1. 创建并插入知识条目
    kl1 = Knowledge(
        name="Fibonacci Sequence",
        type="knowledge",
        content="The Fibonacci sequence is a series of numbers...",
        tags=ptags(TOPIC="math", ENTITY="object"),
        synonyms=["Fibonacci numbers", "Fibonacci series"],
    )
    klbase.batch_upsert([kl1])
    
    # 2. 从函数缓存生成经验
    cache = InMemCache()
    
    @cache.memoize()
    def fibonacci(n: int) -> int:
        if n <= 1:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)
    
    fibonacci(100)
    
    exps = [
        Experience.from_cache_entry(
            entry,
            tags=ptags(
                TOPIC="math",
                NUMBER=[str(entry.inputs['n']), str(entry.output)]
            ),
            synonyms=[f"fibonacci({entry.inputs['n']})", f"{entry.output}"]
        )
        for entry in cache
    ]
    klbase.batch_upsert(exps)
    
    # 3. 使用不同引擎进行搜索
    # 分面检索
    for kl in klbase.search(
        engine='facet_engine',
        mode='facet',
        tags=Facet.NF(slot="TOPIC", value=Facet.LIKE("math%"))
    ):
        print(kl)
    
    # 自动补全搜索
    for kl in klbase.search(engine='ac_engine1', query="Fibonacci"):
        print(kl)
    
    # 向量搜索
    for kl in klbase.search(
        engine='vec_engine',
        query="fibonacci 63",
        include=["id", "kl", "score"],
        topk=3
    ):
        print(kl)
```

<br/>

## 拓展阅读

> **提示:** 要更深入地了解 KLBase 组件,请参阅:
> - [UKF](./ukf/index.md) - 知识条目的数据模型
> - [KLStore](./klstore/index.md) - 知识对象的存储层
> - [KLEngine](./klengine/index.md) - 构建在知识存储之上的搜索引擎实现
> - [工具规范](./toolspec/index.md) - 智能体集成详情

<br/>
