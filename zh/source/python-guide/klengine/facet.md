# FacetKLEngine

FacetKLEngine 是一个基于数据库的 [BaseKLEngine](./base.md) 实现，通过 SQL 谓词对知识对象进行结构化过滤和分面检索。它利用关系数据库的能力，通过 `Facet` 运算符这一强大的抽象，提供高效灵活的查询能力，便于构建复杂的过滤条件。

## 1. 介绍

### 1.1. 什么是分面检索？

**分面检索**是一种查询技术，允许用户沿多个独立的维度（分面）对数据集进行过滤。每个分面代表一个可过滤的类别或连续属性，这些属性可以被组合、叠加和细化，以缩小检索结果。

**FacetKLEngine** 将这种方法引入知识检索：
- **输入**：以 `Facet` 运算符表达的过滤条件（等值、比较、模式、逻辑组合）
- **索引数据**：存储在关系数据库表中的知识对象（通过 [DatabaseKLStore](../klstore/database.md)）
- **输出**：满足所有指定过滤条件的知识对象
- **性能**：利用数据库索引和查询优化实现快速过滤

与语义检索（向量相似度）或模式匹配（DAAC）不同，分面检索擅长基于已知属性和关系的**精确结构化过滤**。

<br/>

### 1.2. 何时使用 FacetKLEngine

**理想使用场景：**
- **结构化数据过滤**：按类型、类别、状态、时间戳、优先级或自定义元数据字段查询知识对象
- **多条件检索**：组合多个过滤条件（AND/OR/NOT 逻辑）以细化结果
- **区间查询**：对数值或日期时间字段进行范围过滤
- **模式匹配**：使用 SQL LIKE/ILIKE 进行文本模式匹配
- **维度过滤**：跨维度表查询（例如，通过外键存储在独立表中的标签、元数据）
- **数据库原生操作**：利用现有数据库基础设施、索引和查询优化

**不适用场景：**
- **语义检索**：使用 [VectorKLEngine](./vector.md) 进行基于含义的相似度查询
- **实体识别**：使用 [DAACKLEngine](./daac.md) 在文本中查找已知实体字符串
- **全文搜索**：使用专门的全文搜索引擎进行文档内容匹配
- **模糊匹配**：FacetKLEngine 执行精确匹配（在 SQL 模式运算符之后）

<br/>

### 1.3. 关键特性

- **丰富的过滤运算符**：全面的运算符集，包括比较（LT、LTE、GT、GTE）、模式匹配（LIKE、ILIKE）、逻辑运算符（AND、OR、NOT）、区间查询（BETWEEN）和列表成员（IN）
- **维度表支持**：使用 NF（规范化形式）运算符跨维度表查询复杂关系
- **两种运行模式**：
  - **原地模式**（`inplace=True`）：直接查询连接的 DatabaseKLStore，零开销
  - **非原地模式**（`inplace=False`）：创建带模式子集的优化副本，加速查询
- **全局分面**：跨所有检索应用持久化过滤条件
- **SQL 集成**：直接访问生成的 SQL 以便调试和优化
- **类型安全**：自动验证过滤字段是否存在于数据库模式中
- **数据库无关**：通过 SQLAlchemy 支持 PostgreSQL、MySQL、SQLite、DuckDB

<br/>

## 2. 理解 Facet 运算符

`Facet` 类提供了一个流式 API 来构建过滤表达式，这些表达式会转换为 SQL WHERE 子句。所有运算符都是可组合的，可以任意嵌套。

### 2.1. 比较运算符

这些运算符将字段值与常量进行比较：

**等值和不等值：**
```python
from ahvn.utils.db.facet import Facet

# 精确匹配（field == value）
Facet.expr(type="documentation")
# 生成：{"FIELD:type": {"==": "documentation"}}

# 不等于（field != value）——使用 NOT 包装
Facet.expr(status=Facet.NOT("deleted"))
# 生成：{"FIELD:status": {"NOT": {"==": "deleted"}}}
```

**数值比较：**
```python
# 小于
Facet.expr(priority=Facet.LT(5))
# 生成：{"FIELD:priority": {"<": 5}}

# 小于或等于
Facet.expr(priority=Facet.LTE(10))
# 生成：{"FIELD:priority": {"<=": 10}}

# 大于
Facet.expr(score=Facet.GT(80))
# 生成：{"FIELD:score": {">": 80}}

# 大于或等于
Facet.expr(score=Facet.GTE(90))
# 生成：{"FIELD:score": {">=": 90}}
```

**日期时间比较：**
```python
import datetime

# 按日期范围过滤
Facet.expr(created_at=Facet.GTE(datetime.datetime(2024, 1, 1)))
# 生成：{"FIELD:created_at": {">=": datetime.datetime(2024, 1, 1)}}

Facet.expr(updated_at=Facet.LTE(datetime.datetime(2024, 12, 31)))
# 生成：{"FIELD:updated_at": {"<=": datetime.datetime(2024, 12, 31)}}
```

<br/>

### 2.2. 模式匹配运算符

SQL LIKE 运算符用于文本模式匹配：

**区分大小写的模式匹配（LIKE）：**
```python
# 通配符匹配
Facet.expr(name=Facet.LIKE("%Python%"))  # 包含 "Python"
# 生成：{"FIELD:name": {"LIKE": "%Python%"}}

Facet.expr(name=Facet.LIKE("Python%"))   # 以 "Python" 开头
Facet.expr(name=Facet.LIKE("%Tutorial"))  # 以 "Tutorial" 结尾
```

**不区分大小写的模式匹配（ILIKE）：**
```python
# 不区分大小写搜索
Facet.expr(description=Facet.ILIKE("%python%"))  # 匹配 "Python"、"PYTHON"、"python"
# 生成：{"FIELD:description": {"ILIKE": "%python%"}}
```

<br/>

### 2.3. 区间运算符

对数值或日期时间范围内的值进行过滤：

**BETWEEN 运算符：**
```python
# 闭区间 [min, max]
Facet.expr(score=Facet.BETWEEN(0, 100))
# 生成：{"FIELD:score": {"AND": [{">=": 0}, {"<=": 100}]}}

# 使用 None 表示开区间
Facet.expr(price=Facet.BETWEEN(100, None))  # >= 100（无上界）
# 生成：{"FIELD:price": {"AND": [{">=": 100}, {"<=": inf}]}}

Facet.expr(age=Facet.BETWEEN(None, 65))     # <= 65（无下界）
# 生成：{"FIELD:age": {"AND": [{">=": -inf}, {"<=": 65}]}}
```

**元组简写：**
```python
# 元组自动转换为 BETWEEN
Facet.expr(priority=(1, 10))
# 等价于：Facet.expr(priority=Facet.BETWEEN(1, 10))
# 生成：{"FIELD:priority": {"AND": [{">=": 1}, {"<=": 10}]}}
```

<br/>

### 2.4. 逻辑运算符

使用布尔逻辑组合多个条件：

**AND 运算符（逻辑合取）：**
```python
# 所有条件必须为真
Facet.expr(score=Facet.AND([Facet.GTE(80), Facet.LTE(100)]))
# 生成：{"FIELD:score": {"AND": [{">=": 80}, {"<=": 100}]}}
# SQL：score >= 80 AND score <= 100
```

**OR 运算符（逻辑析取）：**
```python
# 至少一个条件必须为真
Facet.expr(status=Facet.OR(["active", "pending", "reviewing"]))
# 生成：{"FIELD:status": {"OR": [{"IN": ["active", "pending", "reviewing"]}]}}
# SQL：status IN ('active', 'pending', 'reviewing')

# 在 OR 中混合运算符
Facet.expr(priority=Facet.OR([Facet.GTE(8), Facet.LIKE("urgent%")]))
# 生成：{"FIELD:priority": {"OR": [{">=": 8}, {"LIKE": "urgent%"}]}}
# SQL：priority >= 8 OR priority LIKE 'urgent%'
```

**NOT 运算符（逻辑否定）：**
```python
# 否定任意条件
Facet.expr(status=Facet.NOT("archived"))
# 生成：{"FIELD:status": {"NOT": {"==": "archived"}}}
# SQL：status != 'archived'

Facet.expr(name=Facet.NOT(Facet.LIKE("%deprecated%")))
# 生成：{"FIELD:name": {"NOT": {"LIKE": "%deprecated%"}}}
# SQL：name NOT LIKE '%deprecated%'
```

**IN 运算符（成员测试）：**
```python
# OR 的简单值别名
Facet.expr(category=Facet.IN(["tutorial", "guide", "reference"]))
# 等价于：Facet.expr(category=Facet.OR([...]))
# 生成：{"FIELD:category": {"OR": [{"IN": ["tutorial", "guide", "reference"]}]}}

# 列表自动转换为 OR/IN
Facet.expr(status=["active", "pending"])
# 生成：{"FIELD:status": {"OR": [{"IN": ["active", "pending"]}]}}
```

<br/>

### 2.5. 维度表运算符（NF）

**NF（规范化形式）**运算符用于跨维度表进行查询——这些维度表是通过外键链接的独立表，用于存储复杂的 UKF 字段，如标签、元数据或数组。

**理解维度表：**

当 `BaseUKF` 包含 `DatabaseNfType` 类型的字段（例如 `tags`、`metadata`、`content_resources`）时，DatabaseKLStore 会将它们存储在独立的维度表中：
- **主表**：`ukf_main`（id、name、type、version、timestamp 等）
- **维度表**：`ukf_tags`、`ukf_metadata` 等（ukf_id、slot、value）

**NF 运算符语法：**
```python
# 按槽和值查询维度表
Facet.expr(tags=Facet.NF(slot="category", value="tutorial"))
# 生成：{"FIELD:tags": {"NF": {"slot": "category", "value": "tutorial"}}}
# SQL：EXISTS (SELECT DISTINCT ukf_tags.id FROM ukf_tags 
#             WHERE ukf_main.id = ukf_tags.ukf_id 
#             AND ukf_tags.slot = 'category' AND ukf_tags.value = 'tutorial')

# 带运算符的查询
Facet.expr(metadata=Facet.NF(slot="category", value="math", operator="ANY_IF_EXISTS"))
# 一个槽可以有多个值；如果该槽至少存在一个值，则只要有任意一个值满足条件即匹配
# 支持的运算符：
# - EXACT
# - NONE_OF
# - ANY_OF
# - ANY_IF_EXISTS
# - ONE_OF
# - MANY_OF
# - ALL_OF
# - ALL_IN
# - HAS_NONE（一元，仅检查槽）
# - HAS_ANY（一元，仅检查槽）
# - HAS_ONE（一元，仅检查槽）
# - HAS_MANY（一元，仅检查槽）
```

**多维度过滤器：**
```python
# 同一维度中的多个槽值对（AND 逻辑）
Facet.expr(tags=Facet.NF(slot="category", value="tutorial"), language="python")
# 两个条件都必须在 tags 维度表中存在
```

**真实示例：**
```python
# 查找带特定标签的知识对象
engine.search(
    mode="facet",
    include=["id", "kl"],
    tags=Facet.NF(slot="project", value="AgentHeaven"),
    metadata=Facet.NF(slot="status", value="published")
)
# 返回满足以下条件的 UKF：
# - 标签条目中存在 slot="project" 和 value="AgentHeaven"
# - 元数据条目中存在 slot="status" 和 value="published"
```

<br/>

### 2.6. 多字段表达式

组合多个字段的过滤器（隐式 AND）：

```python
# 多个字段构成 AND 结构
Facet.expr(
    type="documentation",
    priority=Facet.GTE(5),
    status=Facet.OR(["active", "reviewing"]),
    name=Facet.LIKE("%Tutorial%")
)
# 生成：{
#   "AND": [
#     {"FIELD:type": {"==": "documentation"}},
#     {"FIELD:priority": {">=": 5}},
#     {"FIELD:status": {"OR": [{"IN": ["active", "reviewing"]}]}},
#     {"FIELD:name": {"LIKE": "%Tutorial%"}}
#   ]
# }
# SQL：type = 'documentation' 
#      AND priority >= 5 
#      AND status IN ('active', 'reviewing')
#      AND name LIKE '%Tutorial%'
```

<br/>

### 2.7. 复杂嵌套表达式

构建任意复杂的过滤树：

```python
# 复杂的的多层过滤
Facet.expr(
    # 模式匹配
    name=Facet.LIKE("%agent%"),
    
    # 多个状态选项
    status=Facet.OR(["active", "pending", "reviewing"]),
    
    # 带显式 AND 的分数范围
    score=Facet.AND([Facet.GTE(80), Facet.LTE(100)]),
    
    # 日期范围
    created_at=Facet.GTE(datetime.datetime(2024, 1, 1)),
    
    # 维度表过滤器
    tags=Facet.NF(slot="priority", value="high"),
    
    # 否定
    description=Facet.NOT(Facet.LIKE("%deprecated%"))
)
# 所有条件通过 AND 逻辑组合
```

<br/>

## 3. 快速入门

请注意，FacetKLEngine 中的分面仅用于过滤已定义的 UKF 属性（例如，name、type、tags、priority）。存储在非结构化格式（例如 JSON blob）中的自定义字段无法直接查询。

对于所有与 NF（规范化形式）字段相关的查询（即 `set` 字段，如 `tags`、`related`、`auth` 和 `synonyms`），必须使用 `Facet.NF`。


### 3.1. 原地模式的基本用法

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF

# 创建数据库存储
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# 填充知识对象
kls = [
    BaseUKF(name="Python Tutorial", type="tutorial", priority=5, 
            tags={"[category:programming]", "[language:python]"}),
    BaseUKF(name="SQL Guide", type="guide", priority=8,
            tags={"[category:database]", "[language:sql]"}),
    BaseUKF(name="Machine Learning Intro", type="tutorial", priority=7,
            tags={"[category:ai]", "[language:python]"}),
]
store.batch_upsert(kls)

# 在原地模式下创建 FacetKLEngine（直接查询存储）
engine = FacetKLEngine(storage=store, inplace=True)

# 按精确字段匹配搜索
results = engine.search(mode="facet", include=["id", "kl"], type="tutorial")
print(f"找到 {len(results)} 个教程")

# 使用比较运算符搜索
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(7))
for result in results:
    print(f"- {result['kl'].name} (priority: {result['kl'].priority})")

# 使用维度表过滤器搜索（NF 运算符）
results = engine.search(mode="facet", include=["id", "kl"],
                       tags=Facet.NF(slot="language", value="python"))
print(f"找到 {len(results)} 个 Python 相关条目")

# 组合多个过滤器（AND 逻辑）
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="tutorial",
    priority=Facet.GTE(5),
    tags=Facet.NF(slot="category", value="programming")
)
```

<br/>

### 3.2. 初始化参数

**必需参数：**
- **`storage`** (`DatabaseKLStore`)：要查询的数据库支持的 KLStore。必须是 DatabaseKLStore 实例。

**模式参数：**
- **`inplace`** (`bool`, 默认：`True`)：运行模式
  - `True`：直接在存储数据库上查询（零开销，无复制）
  - `False`：创建带模式子集的独立索引数据库

**模式参数（仅 `inplace=False`）：**
- **`include`** (`List[str]`, 可选)：要包含在索引中的 BaseUKF 字段名列表。如果为 None，则包含所有字段。
- **`exclude`** (`List[str]`, 可选)：要从索引中排除的 BaseUKF 字段名列表。在 `include` 之后应用。

**过滤参数：**
- **`facets`** (`Dict[str, Any]`, 可选)：应用于所有搜索的全局分面。使用与搜索过滤器相同的格式。

**通用参数：**
- **`name`** (`str`, 可选)：引擎实例名称。默认为 `"{storage.name}_facet_idx"`。
- **`condition`** (`Callable`, 可选)：用于条件索引的过滤函数。只有满足条件的 UKF 才会被索引。

**数据库参数（仅 `inplace=False`）：**
- **`database`** (`str`, 可选)：索引数据库名称或路径。如果省略，则使用配置默认值。
- **`provider`** (`str`, 可选)：数据库提供商（"sqlite"、"pg"、"mysql"、"duckdb"）。如果省略，则使用配置默认值。
- 附加 kwargs：连接参数（host、port、username、password 等）

<br/>

## 4. 运行模式

FacetKLEngine 支持两种不同的运行模式，具有不同的性能特点和使用场景：

### 4.1. 原地模式（`inplace=True`）

**工作原理：**
- 引擎直接查询连接的 DatabaseKLStore，不创建任何附加结构
- 所有操作（搜索、获取）都路由到存储后端
- 零设置时间，零存储开销
- 对存储的修改会立即在搜索结果中可见

**特点：**
- **设置时间**：即时（无需索引）
- **存储开销**：无（使用现有存储）
- **查询性能**：取决于存储数据库的索引
- **同步**：始终最新（无需同步）
- **模式**：存储中的所有字段都可查询

**使用时机：**
- 开发和原型设计（设置最快）
- 中小型数据集（< 100K 对象）
- 动态数据（频繁插入/更新）
- 当存储数据库具有适当的索引时
- 当需要所有 UKF 字段进行过滤时

**示例：**
```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# 立即可以查询（无索引阶段）
results = engine.search(mode="facet", include=["id", "kl"], type="tutorial")
```

**注意：**在原地模式下，`upsert()`、`insert()`、`remove()`、`clear()` 操作是无操作的，因为引擎不维护独立状态。

<br/>

### 4.2. 非原地模式（`inplace=False`）

**工作原理：**
- 引擎创建具有模式子集的独立索引数据库
- 只有指定的字段（`include` 参数）被复制到索引
- 数据更改后需要与存储进行显式同步
- 在字段子集上进行优化查询

**特点：**
- **设置时间**：需要初始同步（将数据复制到索引）
- **存储开销**：重复数据（索引数据库）
- **查询性能**：在子集模式上更快（字段更少 = 索引更好）
- **同步**：存储更改后需要手动 `sync()`
- **模式**：只有包含的字段可查询

**使用时机：**
- 大型数据集（> 100K 对象），其中模式子集可提高性能
- 静态或缓慢变化的数据（不频繁更新）
- 当查询只需要字段的子集时
- 减少索引大小并提高查询速度
- 当存储数据库缺少最佳索引时

**示例：**
```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# 创建具有字段子集的独立索引
engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # 仅这些字段
    database="knowledge_index.db"  # 索引的独立数据库
)

# 初始同步（复制数据）
engine.sync()

# 在子集模式上查询
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(5))

# 存储更改后，重新同步
store.upsert(new_kl)
engine.sync()  # 更新索引
```

**模式子集的好处：**
```python
# 完整模式：20 多个字段（name、type、version、content、description 等）
# 索引模式：5 个字段（id、name、type、priority、tags）
# 结果：索引小 4 倍，对索引字段的查询更快

engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # 最小模式
    exclude=["content", "description"]  # 排除大文本字段
)
```

<br/>

## 5. 搜索操作

### 5.1. 分面搜索（默认）

使用结构化过滤器的主要搜索方法：

```python
results = engine.search(
    mode="facet",           # 或省略（默认模式）
    include=["id", "kl"],   # 结果中要包含的字段
    type="tutorial",        # 字段过滤器
    priority=Facet.GTE(5),
    tags=Facet.NF(slot="category", value="programming"),
    topk=10,                # 限制结果数量（SQL LIMIT）
    offset=0                # 跳过结果数量（SQL OFFSET）
)
```

**搜索参数：**
- **`include`** (`Iterable[str]`, 可选)：结果中要包含的字段
  - `"id"`：知识对象 ID（int）
  - `"kl"`：完整的 BaseUKF 对象（如果可从存储中恢复）
  - `"filter"`：解析后的 Facet 过滤器（用于调试）
  - `"sql"`：生成的 SQL 语句（用于调试和优化）
  - 默认：`["id", "kl"]`

- **`topk`** (`int`, 可选)：要返回的最大结果数（SQL LIMIT）。如果为 None，则返回所有匹配的结果。

- **`offset`** (`int`, 可选)：要跳过的结果数（SQL OFFSET）。如果为 None，则从第一个结果开始。

- **`**kwargs`**：使用 Facet 运算符或简单值的过滤条件

**返回值：**
```python
List[Dict[str, Any]]  # 每个字典包含 `include` 中请求的字段
```

<br/>

### 5.2. 结果结构

**最小结果（仅 ID）：**
```python
results = engine.search(mode="facet", include=["id"], type="tutorial")
# [
#   {"id": 123},
#   {"id": 456},
#   {"id": 789}
# ]
```

**完整结果（带知识对象）：**
```python
results = engine.search(mode="facet", include=["id", "kl"], priority=Facet.GTE(5))
# [
#   {"id": 123, "kl": <BaseUKF object>},
#   {"id": 456, "kl": <BaseUKF object>}
# ]
```

**调试结果（带 SQL）：**
```python
results = engine.search(mode="facet", include=["id", "sql"], type="tutorial")
# [
#   {"id": 123, "sql": "SELECT ukf_main.id FROM ukf_main WHERE ukf_main.type = 'tutorial'"},
#   ...
# ]
```

<br/>

### 5.3. 全局分面

跨所有搜索应用持久化过滤器：

```python
# 创建带全局分面的引擎
engine = FacetKLEngine(
    storage=store,
    inplace=True,
    facets={
        "type": "tutorial",                              # 仅索引教程
        "tags": Facet.NF(slot="status", value="published")  # 仅已发布的
    }
)

# 所有搜索都会自动包含全局分面
results = engine.search(mode="facet", include=["id", "kl"], 
                       priority=Facet.GTE(7))
# SQL：WHERE type = 'tutorial' 
#      AND EXISTS (tags with status=published)
#      AND priority >= 7
```

<br/>

### 5.4. 分页

使用 `topk` 和 `offset` 实现分页结果：

```python
# 第 1 页：前 10 个结果
page1 = engine.search(mode="facet", include=["id", "kl"], 
                     type="tutorial", topk=10, offset=0)

# 第 2 页：接下来 10 个结果
page2 = engine.search(mode="facet", include=["id", "kl"],
                     type="tutorial", topk=10, offset=10)

# 第 3 页：再接下来 10 个结果
page3 = engine.search(mode="facet", include=["id", "kl"],
                     type="tutorial", topk=10, offset=20)
```

<br/>

### 5.5. SQL 调试

检查生成的 SQL 以进行优化：

```python
results = engine.search(
    mode="facet",
    include=["id", "sql"],
    type="tutorial",
    priority=Facet.BETWEEN(5, 10),
    tags=Facet.NF(slot="category", value="programming")
)

# 打印 SQL 语句
print(results[0]["sql"])
# 输出：
# SELECT ukf_main.id FROM ukf_main 
# WHERE ukf_main.type = 'tutorial' 
# AND ukf_main.priority >= 5 
# AND ukf_main.priority <= 10
# AND EXISTS (SELECT DISTINCT ukf_tags.id FROM ukf_tags 
#             WHERE ukf_main.id = ukf_tags.ukf_id 
#             AND ukf_tags.slot = 'category' 
#             AND ukf_tags.value = 'programming')
```

<br/>

## 6. 完整示例

### 6.1. 论文过滤

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF
import datetime

# 设置存储和引擎
store = DatabaseKLStore(database="papers.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# 创建研究论文
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        priority=10,
        timestamp=datetime.datetime(2017, 6, 12),
        tags={"[field:nlp]", "[venue:nips]", "[topic:transformers]"},
        metadata={"citations": 50000, "authors": 8}
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        priority=9,
        timestamp=datetime.datetime(2018, 10, 11),
        tags={"[field:nlp]", "[venue:naacl]", "[topic:language_models]"},
        metadata={"citations": 30000, "authors": 4}
    ),
    BaseUKF(
        name="ResNet: Deep Residual Learning",
        type="research_paper",
        priority=9,
        timestamp=datetime.datetime(2015, 12, 10),
        tags={"[field:cv]", "[venue:cvpr]", "[topic:architectures]"},
        metadata={"citations": 40000, "authors": 5}
    ),
]
store.batch_upsert(papers)

# 查询 1：高影响力的近期 NLP 论文
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    priority=Facet.GTE(9),
    timestamp=Facet.GTE(datetime.datetime(2017, 1, 1)),
    tags=Facet.NF(slot="field", value="nlp")
)
print(f"高影响力 NLP 论文：{len(results)}")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} ({kl.timestamp.year})")

# 查询 2：引用数在范围内的论文
# 注意：元数据过滤器需要使用维度表
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    tags=Facet.AND([
        Facet.NF(slot="field", value="nlp"),
        Facet.NF(slot="venue", value=Facet.OR(["nips", "naacl", "acl"]))
    ])
)

# 查询 3：非计算机视觉领域的论文
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="research_paper",
    tags=Facet.NOT(Facet.NF(slot="field", value="cv"))
)
print(f"非 CV 论文：{len(results)}")
```

<br/>

### 6.2. 电商产品过滤

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF

# 设置
store = DatabaseKLStore(database="products.db", provider="sqlite")
engine = FacetKLEngine(storage=store, inplace=True)

# 创建产品
products = [
    BaseUKF(
        name="Laptop Pro 15",
        type="electronics",
        priority=8,
        tags={"[category:laptop]", "[brand:TechCorp]", "[condition:new]"},
        metadata={"price": 1299.99, "stock": 45, "rating": 4.5}
    ),
    BaseUKF(
        name="Wireless Mouse",
        type="electronics",
        priority=5,
        tags={"[category:accessory]", "[brand:TechCorp]", "[condition:new]"},
        metadata={"price": 29.99, "stock": 200, "rating": 4.2}
    ),
    BaseUKF(
        name="Refurbished Laptop 13",
        type="electronics",
        priority=6,
        tags={"[category:laptop]", "[brand:BudgetTech]", "[condition:refurbished]"},
        metadata={"price": 499.99, "stock": 10, "rating": 3.8}
    ),
]
store.batch_upsert(products)

# 查询 1：有库存的笔记本电脑，按优先级排序
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="electronics",
    tags=Facet.AND([
        Facet.NF(slot="category", value="laptop"),
        Facet.NF(slot="condition", value="new")  # 仅限新产品
    ])
)
print(f"新款笔记本电脑：{len(results)}")

# 查询 2：特定品牌的产品
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    type="electronics",
    tags=Facet.NF(slot="brand", value="TechCorp")
)
print(f"TechCorp 产品：{len(results)}")

# 查询 3：产品名称中的模式搜索
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    name=Facet.LIKE("%Laptop%"),
    type="electronics"
)
print(f"笔记本电脑产品：{len(results)}")
for result in results:
    print(f"- {result['kl'].name}")
```

<br/>

### 6.3. 任务管理系统

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet
from ahvn.ukf import BaseUKF
import datetime

# 设置
store = DatabaseKLStore(database="tasks.db", provider="sqlite")
engine = FacetKLEngine(
    storage=store,
    inplace=True,
    facets={"type": "task"}  # 全局分面：仅任务
)

# 创建任务
tasks = [
    BaseUKF(
        name="Implement authentication",
        type="task",
        priority=10,
        timestamp=datetime.datetime(2024, 1, 15),
        tags={"[status:in_progress]", "[assignee:alice]", "[sprint:Q1]"},
        metadata={"estimate": 8, "actual": 6}
    ),
    BaseUKF(
        name="Write documentation",
        type="task",
        priority=5,
        timestamp=datetime.datetime(2024, 1, 20),
        tags={"[status:pending]", "[assignee:bob]", "[sprint:Q1]"},
        metadata={"estimate": 4, "actual": 0}
    ),
    BaseUKF(
        name="Fix critical bug",
        type="task",
        priority=10,
        timestamp=datetime.datetime(2024, 1, 10),
        tags={"[status:completed]", "[assignee:alice]", "[sprint:Q1]"},
        metadata={"estimate": 2, "actual": 3}
    ),
    BaseUKF(
        name="Design database schema",
        type="task",
        priority=8,
        timestamp=datetime.datetime(2024, 1, 5),
        tags={"[status:completed]", "[assignee:charlie]", "[sprint:Q1]"},
        metadata={"estimate": 5, "actual": 5}
    ),
]
store.batch_upsert(tasks)

# 查询 1：高优先级的活动任务
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    priority=Facet.GTE(8),
    tags=Facet.NF(slot="status", value=Facet.OR(["pending", "in_progress"]))
)
print(f"高优先级活动任务：{len(results)}")

# 查询 2：Alice 已完成的任务
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    tags=Facet.AND([
        Facet.NF(slot="assignee", value="alice"),
        Facet.NF(slot="status", value="completed")
    ])
)
print(f"Alice 已完成的任务：{len(results)}")

# 查询 3：1 月份创建的任务
results = engine.search(
    mode="facet",
    include=["id", "kl"],
    timestamp=Facet.BETWEEN(
        datetime.datetime(2024, 1, 1),
        datetime.datetime(2024, 1, 31, 23, 59, 59)
    )
)
print(f"1 月份任务：{len(results)}")

# 查询 4：逾期任务（实际 > 预估）——需要复杂逻辑
# 首先获取所有任务，然后在 Python 中过滤
# （或通过 _search_sql 使用原始 SQL 进行复杂计算）
results = engine.search(mode="facet", include=["id", "kl"])
overdue = [r for r in results if r["kl"].metadata.get("actual", 0) > r["kl"].metadata.get("estimate", 0)]
print(f"逾期任务：{len(overdue)}")
```

<br/>

### 6.4. 非原地模式与模式子集

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine
from ahvn.utils.db.facet import Facet

# 具有许多字段的大型存储
store = DatabaseKLStore(database="large_store.db", provider="sqlite")

# 创建具有字段子集的优化索引
engine = FacetKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "timestamp", "tags"],
    exclude=["content", "description"],  # 排除大文本字段
    database="optimized_index.db"
)

# 初始同步（将数据复制到索引）
print("正在同步索引...")
engine.sync()
print(f"已索引 {len(engine)} 个对象")

# 在索引字段上进行快速查询
results = engine.search(
    mode="facet",
    include=["id"],  # 仅 ID（如果 kl 不可恢复）
    priority=Facet.GTE(7),
    tags=Facet.NF(slot="category", value="important")
)
print(f"找到 {len(results)} 个高优先级项目")

# 存储更改后，重新同步
new_kl = BaseUKF(name="New Item", type="document", priority=9)
store.upsert(new_kl)
engine.sync()  # 更新索引

# 关闭引擎
engine.close()
```

<br/>

## 拓展阅读

> **提示：** 有关基本接口和通用操作，请参阅：
> - [BaseKLEngine](./base.md) - 定义 KLEngine 接口和共享功能的抽象基类
> - [KLEngine 概览](./index.md) - 查询引擎和检索策略简介

> **提示：** 有关其他搜索方法，请参阅：
> - [VectorKLEngine](./vector.md) - 使用向量嵌入进行语义相似度搜索
> - [DAACKLEngine](./daac.md) - 用于实体识别的多模式字符串匹配

> **提示：** 有关数据库集成，请参阅：
> - [DatabaseKLStore](../klstore/database.md) - 基于 ORM 的知识对象持久化存储
> - [数据库实用工具](../utils/db.md) - 数据库连接、查询执行和实用工具
> - [数据库配置](../../configuration/database.md) - 数据库提供商的 YAML 配置

> **提示：** 有关高级查询模式，请参阅：
> - [Facet 运算符参考](../utils/db.md#facet-operators) - 所有 Facet 运算符的完整参考
> - [SQL 查询优化](../utils/db.md#query-optimization) - 数据库查询的性能调优

<br/>
