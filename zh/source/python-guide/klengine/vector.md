# VectorKLEngine

VectorKLEngine 是一个由向量数据库支持的 [BaseKLEngine](./base.md) 实现，它通过结合元数据过滤的向量嵌入，实现了对知识对象的语义相似性搜索。它利用 LlamaIndex 的统一向量存储抽象，通过 `Filter` 运算符提供灵活、高性能的语义检索——这是一个将向量相似性与结构化元数据约束相结合的强大系统。

## 1. 简介

### 1.1. 什么是语义向量搜索？

**语义向量搜索**是一种检索技术，它根据意义的相似性而不是精确的关键词匹配来查找文档或知识对象。其工作原理如下：
- 将文本转换为捕捉语义的高维向量（嵌入）
- 使用距离度量（余弦、L2 等）测量查询和文档向量之间的相似性
- 返回按相关性分数排名的最相似结果

**VectorKLEngine** 通过以下方式将此功能引入知识检索：
- **输入**：自然语言查询文本 + 可选的元数据过滤条件
- **索引数据**：转换为向量嵌入的知识对象（通过 [VectorKLStore](../klstore/vector.md)）
- **输出**：带有相关性分数的 Top-K 最语义相似的知识对象
- **性能**：利用专门的向量数据库索引（IVF、HNSW 等）进行快速的近似最近邻搜索

与分面搜索（精确属性匹配）或模式匹配（字符串搜索）不同，向量搜索擅长**查找概念上相关的内容**，即使精确术语不匹配。

<br/>

### 1.2. 何时使用 VectorKLEngine

**理想用例：**
- **语义相似性搜索**：无需精确关键词匹配即可查找与某个概念相关的文档（例如，“机器学习”可以找到“神经网络”、“深度学习”）
- **问答系统**：为问题检索相关的上下文段落
- **推荐系统**：根据内容语义查找相似项目
- **混合搜索**：将向量相似性与元数据过滤相结合（例如，“关于 transformer 的近期论文”）
- **跨语言搜索**：使用多语言嵌入在不同语言的文档中进行搜索
- **多模态检索**：使用适当的嵌入模型跨文本、图像、音频进行搜索

**不适用场景：**
- **精确属性匹配**：使用 [FacetKLEngine](./facet.md) 按类型、状态、日期等进行精确过滤
- **实体识别**：使用 [DAACKLEngine](./daac.md) 在文本中查找已知的实体字符串
- **确定性过滤**：向量搜索是近似的，可能会错过精确匹配
- **低延迟要求**：向量搜索比数据库索引查找慢

<br/>

### 1.3. 关键特性

- **语义相似性**：使用神经嵌入模型查找概念上相关的内容
- **元数据过滤**：通过 `Filter` 运算符将向量相似性与结构化过滤条件相结合
- **多种向量后端**：通过 LlamaIndex 支持 LanceDB、ChromaDB、Milvus、SimpleVectorStore
- **灵活编码**：自定义编码器函数以从知识对象中提取可搜索的文本
- **可配置的嵌入器**：使用任何嵌入模型（OpenAI、本地模型、自定义模型）
- **两种操作模式**：
  - **原地模式** (`inplace=True`)：直接查询附加的 VectorKLStore，零开销
  - **非原地模式** (`inplace=False`)：创建一个带有模式子集的优化副本
- **相关性评分**：返回用于排名和阈值处理的相似性分数
- **Top-K 检索**：高效地仅检索最相关的结果

<br/>

## 2. 理解 Filter 运算符

`Filter` 类提供了一个流畅的 API，用于构建与 LlamaIndex 的 `MetadataFilters` 配合使用的元数据过滤表达式。这些过滤条件将向量搜索结果限制为匹配特定的元数据标准。该 API 与 [FacetKLEngine](./facet.md) 中使用的 `Facet` 运算符非常相似，但生成的是 LlamaIndex 过滤对象而不是 SQL。

### 2.1. 比较运算符

这些运算符将元数据字段值与常量进行比较：

**相等与不等：**
```python
from ahvn.utils.vdb.filter import Filter

# 精确匹配 (field == value)
Filter.expr(type="tutorial")
# 生成: {"FIELD:type": {"==": "tutorial"}}
# LlamaIndex: ExactMatchFilter(key="type", value="tutorial")

# 不等于 (field != value) - 使用 NOT 包装器
Filter.expr(status=Filter.NOT("archived"))
# 生成: {"FIELD:status": {"NOT": {"==": "archived"}}}
# LlamaIndex: MetadataFilters(filters=[MetadataFilter(key="status", value="archived", operator="!=")], condition="not")
```

**数值比较：**
```python
# 小于
Filter.expr(priority=Filter.LT(5))
# 生成: {"FIELD:priority": {"<": 5}}
# LlamaIndex: MetadataFilter(key="priority", value=5, operator="<")

# 小于或等于
Filter.expr(priority=Filter.LTE(10))
# 生成: {"FIELD:priority": {"<=": 10}}

# 大于
Filter.expr(score=Filter.GT(80))
# 生成: {"FIELD:score": {">": 80}}

# 大于或等于
Filter.expr(score=Filter.GTE(90))
# 生成: {"FIELD:score": {">=": 90}}
```

**日期时间比较：**
```python
import datetime

# 按日期范围过滤
Filter.expr(created_at=Filter.GTE(datetime.datetime(2024, 1, 1)))
# 生成: {"FIELD:created_at": {">=": datetime.datetime(2024, 1, 1)}}

Filter.expr(updated_at=Filter.LTE(datetime.datetime(2024, 12, 31)))
# 生成: {"FIELD:updated_at": {"<=": datetime.datetime(2024, 12, 31)}}
```

<br/>

### 2.2. 模式匹配运算符

文本模式匹配运算符（映射到 LlamaIndex 文本匹配）：

**区分大小写的模式匹配 (LIKE → text_match):**
```python
# 通配符匹配
Filter.expr(name=Filter.LIKE("%Python%"))  # 包含 "Python"
# 生成: {"FIELD:name": {"LIKE": "%Python%"}}
# LlamaIndex: MetadataFilter(key="name", value="%Python%", operator="text_match")

Filter.expr(name=Filter.LIKE("Python%"))   # 以 "Python" 开头
Filter.expr(name=Filter.LIKE("%Tutorial"))  # 以 "Tutorial" 结尾
```

**不区分大小写的模式匹配 (ILIKE → text_match_insensitive):**
```python
# 不区分大小写的搜索
Filter.expr(description=Filter.ILIKE("%python%"))  # 匹配 "Python", "PYTHON", "python"
# 生成: {"FIELD:description": {"ILIKE": "%python%"}}
# LlamaIndex: MetadataFilter(key="description", value="%python%", operator="text_match_insensitive")
```

**注意：** 模式匹配行为取决于向量数据库后端。某些后端可能不支持文本匹配运算符。

<br/>

### 2.3. 范围运算符

在数值或日期时间范围内过滤值：

**BETWEEN 运算符：**
```python
# 包含范围 [min, max]
Filter.expr(score=Filter.BETWEEN(0, 100))
# 生成: {"FIELD:score": {"AND": [{">=": 0}, {"<=": 100}]}}
# LlamaIndex: 带有两个过滤条件（>= 和 <=）并用 AND 组合的 MetadataFilters

# 使用 None 的开放式范围
Filter.expr(price=Filter.BETWEEN(100, None))  # >= 100 (无上限)
# 生成: {"FIELD:price": {"AND": [{">=": 100}, {"<=": inf}]}}

Filter.expr(age=Filter.BETWEEN(None, 65))     # <= 65 (无下限)
# 生成: {"FIELD:age": {"AND": [{">=": -inf}, {"<=": 65}]}}
```

**元组简写：**
```python
# 元组自动转换为 BETWEEN
Filter.expr(priority=(1, 10))
# 等效于: Filter.expr(priority=Filter.BETWEEN(1, 10))
# 生成: {"FIELD:priority": {"AND": [{">=": 1}, {"<=": 10}]}}
```

<br/>

### 2.4. 逻辑运算符

使用布尔逻辑组合多个条件：

**AND 运算符 (逻辑合取):**
```python
# 所有条件必须为真
Filter.expr(score=Filter.AND([Filter.GTE(80), Filter.LTE(100)]))
# 生成: {"FIELD:score": {"AND": [{">=": 80}, {"<=": 100}]}}
# LlamaIndex: MetadataFilters(filters=[...], condition="and")
```

**OR 运算符 (逻辑析取):**
```python
# 至少一个条件必须为真
Filter.expr(status=Filter.OR(["active", "pending", "reviewing"]))
# 生成: {"FIELD:status": {"OR": [{"IN": ["active", "pending", "reviewing"]}]}}
# LlamaIndex: MetadataFilters(filters=[ExactMatchFilter(...), ...], condition="or")

# 在 OR 中混合运算符
Filter.expr(priority=Filter.OR([Filter.GTE(8), Filter.LIKE("urgent%")]))
# 生成: {"FIELD:priority": {"OR": [{">=": 8}, {"LIKE": "urgent%"}]}}
```

**NOT 运算符 (逻辑非):**
```python
# 对任何条件取反
Filter.expr(status=Filter.NOT("deleted"))
# 生成: {"FIELD:status": {"NOT": {"==": "deleted"}}}
# LlamaIndex: MetadataFilters(filters=[...], condition="not")

Filter.expr(name=Filter.NOT(Filter.LIKE("%deprecated%")))
# 生成: {"FIELD:name": {"NOT": {"LIKE": "%deprecated%"}}}
```

**IN 运算符 (成员测试):**
```python
# 简单值的 OR 的别名
Filter.expr(category=Filter.IN(["tutorial", "guide", "reference"]))
# 等效于: Filter.expr(category=Filter.OR([...]))
# 生成: {"FIELD:category": {"OR": [{"IN": ["tutorial", "guide", "reference"]}]}}
# LlamaIndex: 多个 ExactMatchFilter 与 OR 组合的 MetadataFilters

# 列表自动转换为 OR/IN
Filter.expr(status=["active", "pending"])
# 生成: {"FIELD:status": {"OR": [{"IN": ["active", "pending"]}]}}
```

<br/>

### 2.5. 多字段表达式

组合多个字段上的过滤条件（隐式 AND）：

```python
# 多个字段创建 AND 结构
Filter.expr(
    type="documentation",
    priority=Filter.GTE(5),
    status=Filter.OR(["active", "reviewing"]),
    name=Filter.LIKE("%Tutorial%")
)
# 生成: {
#   "AND": [
#     {"FIELD:type": {"==": "documentation"}},
#     {"FIELD:priority": {">=": 5}},
#     {"FIELD:status": {"OR": [{"IN": ["active", "reviewing"]}]}},
#     {"FIELD:name": {"LIKE": "%Tutorial%"}}
#   ]
# }
# LlamaIndex: MetadataFilters(filters=[...], condition="and")
```

<br/>

### 2.6. 复杂嵌套表达式

构建任意复杂的过滤条件树：

```python
# 复杂的多级过滤
Filter.expr(
    # 模式匹配
    name=Filter.LIKE("%agent%"),
    
    # 多个状态选项
    status=Filter.OR(["active", "pending", "reviewing"]),
    
    # 带显式 AND 的分数范围
    score=Filter.AND([Filter.GTE(80), Filter.LTE(100)]),
    
    # 日期范围
    created_at=Filter.GTE(datetime.datetime(2024, 1, 1)),
    
    # 否定
    description=Filter.NOT(Filter.LIKE("%deprecated%"))
)
# 所有条件都用 AND 逻辑组合
# LlamaIndex: 复杂的嵌套 MetadataFilters 结构
```

<br/>

### 2.7. 与 Facet 运算符的主要区别

虽然 `Filter` 和 `Facet` 的 API 非常相似，但存在一些重要区别：

| 特性 | Facet (FacetKLEngine) | Filter (VectorKLEngine) |
|---|---|---|
| 目标系统 | SQL 数据库 (SQLAlchemy) | 向量数据库 (LlamaIndex) |
| 输出格式 | SQLAlchemy `ClauseElement` | LlamaIndex `MetadataFilters` |
| NF 运算符 | 维度表查询 | 不支持* |
| 后端支持 | PostgreSQL, MySQL, SQLite, DuckDB | LanceDB, ChromaDB, Milvus 等 |
| 主要用途 | 结构化过滤 | 元数据过滤 + 向量相似性 |

**注意：** `Filter` 不支持 NF 运算符，因为向量数据库没有与关系数据库相同的维度表概念。复杂的嵌套元数据应扁平化为顶级字段以进行向量存储。

<br/>

## 3. 快速入门

### 3.1. 原地模式的基本用法

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# 创建嵌入器
embedder = LLM(preset="embedder")  # 使用默认的嵌入模型

# 创建向量存储
store = VectorKLStore(
    provider="lancedb",
    uri="./knowledge_vectors",
    collection="documents",
    encoder=lambda kl: kl.content,  # 提取文本用于嵌入
    embedder=embedder
)

# 填充知识对象
kls = [
    BaseUKF(
        name="Python Tutorial", 
        type="tutorial", 
        priority=5,
        content="Learn Python programming from basics to advanced concepts",
        tags={"programming", "python", "beginner"}
    ),
    BaseUKF(
        name="Machine Learning Guide",
        type="guide",
        priority=8,
        content="Introduction to machine learning algorithms and neural networks",
        tags={"ai", "machine-learning", "tutorial"}
    ),
    BaseUKF(
        name="SQL Database Design",
        type="tutorial",
        priority=7,
        content="Database design principles and SQL query optimization",
        tags={"database", "sql", "advanced"}
    ),
]
store.batch_upsert(kls)
store.flush()

# 在原地模式下创建 VectorKLEngine (直接查询存储)
engine = VectorKLEngine(storage=store, inplace=True)

# 无过滤条件的语义搜索
results = engine.search(
    query="How do I learn programming?",
    topk=2,
    include=["id", "kl", "score"]
)
print(f"Found {len(results)} results")
for result in results:
    print(f"- {result['kl'].name} (score: {result['score']:.3f})")

# 带元数据过滤条件的语义搜索
results = engine.search(
    mode="vector",
    query="neural network architectures",
    topk=5,
    include=["id", "kl", "score"],
    type="guide",  # 仅指南
    priority=Filter.GTE(7)  # 仅高优先级
)
for result in results:
    kl = result['kl']
    print(f"- {kl.name} (优先级: {kl.priority}, 分数: {result['score']:.3f})")
```

<br/>

### 3.2. 初始化参数

**必需参数：**
- **`storage`** (`VectorKLStore`)：要查询的向量支持的 KLStore。必须是 VectorKLStore 实例。

**模式参数：**
- **`inplace`** (`bool`, 默认: `True`)：操作模式
  - `True`：直接在存储的向量数据库上查询（零开销，无复制）
  - `False`：使用模式子集创建单独的索引集合

**模式参数 (仅适用于 `inplace=False`)：**
- **`include`** (`List[str]`, 可选)：要包含在索引中的 BaseUKF 字段名称列表。如果为 None，则包含所有字段。
- **`exclude`** (`List[str]`, 可选)：要从索引中排除的 BaseUKF 字段名称列表。在 `include` 之后应用。

**过滤参数：**
- **`filters`** (`Dict[str, Any]`, 可选)：应用于所有搜索的全局过滤条件。使用与搜索过滤条件相同的格式。

**通用参数：**
- **`name`** (`str`, 可选)：引擎实例名称。默认为 `"{storage.name}_vec_idx"`。
- **`condition`** (`Callable`, 可选)：用于条件索引的过滤函数。只有满足条件的 UKF 才会被索引。

**向量数据库参数 (仅适用于 `inplace=False`)：**
- **`provider`** (`str`, 可选)：向量数据库提供商 ("lancedb", "chroma", "chromalite", "milvuslite")。如果省略，则使用配置默认值。
- **`collection`** (`str`, 可选)：向量数据库中的集合/表名称。默认为引擎名称。
- **`encoder`** (`Callable` 或 `Tuple[Callable, Callable]`, 可选)：文本提取函数。可以是单个函数或 (key_encoder, query_encoder) 元组。
- **`embedder`** (`Callable` 或 `LLM`, 可选)：用于生成向量的嵌入函数或 LLM 实例。
- 其他 kwargs：特定于向量数据库提供商的连接参数（uri、path、mode 等）。

<br/>

## 4. 操作模式

VectorKLEngine 支持两种具有不同性能特征的独特操作模式：

### 4.1. 原地模式 (`inplace=True`)

**工作原理：**
- 引擎直接查询附加的 VectorKLStore，不创建任何额外结构
- 所有操作（搜索、获取）都路由到存储后端
- 零设置时间，零存储开销
- 对存储的修改会立即在搜索结果中可见

**特性：**
- **设置时间**：即时（无需索引）
- **存储开销**：无（使用现有存储）
- **查询性能**：取决于存储的向量索引
- **同步**：始终保持最新（无需同步）
- **模式**：存储中的所有元数据字段都可查询

**何时使用：**
- 开发和原型设计（最快的设置）
- 中小型数据集（< 10 万个对象）
- 动态数据（频繁插入/更新）
- 当存储具有适当的向量索引时
- 当所有元数据字段都需要用于过滤时

**示例：**
```python
store = VectorKLStore(provider="lancedb", uri="./vectors", embedder=embedder)
engine = VectorKLEngine(storage=store, inplace=True)

# 立即可以查询 (无索引阶段)
results = engine.search(query="machine learning", topk=5)
```

**注意：** 在原地模式下，`upsert()`、`insert()`、`remove()`、`clear()` 操作是无操作的，因为引擎不维护单独的状态。

<br/>

### 4.2. 非原地模式 (`inplace=False`)

**工作原理：**
- 引擎创建一个带有模式子集的单独索引集合
- 只有指定的元数据字段（`include` 参数）被复制到索引中
- 数据更改时需要与存储进行显式同步
- 在元数据字段子集上进行优化查询

**特性：**
- **设置时间**：需要初始同步（将数据和嵌入复制到索引）
- **存储开销**：重复数据（索引集合）
- **查询性能**：在子集模式上更快（字段越少 = 索引越好）
- **同步**：存储更改后需要手动 `sync()`
- **模式**：只有包含的元数据字段可查询

**何时使用：**
- 大型数据集（> 10 万个对象），其中模式子集可提高性能
- 静态或缓慢变化的数据（不频繁更新）
- 当只需要元数据的子集进行过滤时
- 为减小索引大小并提高查询速度
- 搜索和存储使用不同的嵌入模型

**示例：**
```python
store = VectorKLStore(provider="lancedb", uri="./vectors", embedder=embedder)

# 创建带有元数据子集的单独索引
engine = VectorKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority"],  # 仅这些元数据字段
    provider="chromalite",  # 可以使用不同的后端
    collection="search_index"
)

# 初始同步 (复制数据并生成嵌入)
engine.sync()

# 在子集模式上查询
results = engine.search(query="transformers", topk=5, priority=Filter.GTE(7))

# 存储更改后，重新同步
store.upsert(new_kl)
engine.sync()  # 更新索引
```

<br/>

### 4.3. 模式比较

| 特性 | 原地模式 | 非原地模式 |
|---|---|---|
| 设置时间 | 即时 | 需要同步 |
| 存储开销 | 无 | 重复的向量和元数据 |
| 查询速度 | 取决于存储 | 为子集优化 |
| 同步 | 自动 | 需要手动同步 |
| 模式灵活性 | 所有元数据字段 | 仅子集 |
| 后端选择 | 与存储相同 | 可与存储不同 |
| 最适用于 | 开发、动态数据 | 生产、静态数据 |

<br/>

## 5. 搜索操作

### 5.1. 向量相似性搜索 (默认)

使用语义相似性和可选元数据过滤的主要搜索方法：

```python
results = engine.search(
    query="transformer architectures for NLP",  # 自然语言查询
    topk=10,
    include=["id", "kl", "score"],
    # 元数据过滤
    type="research_paper",
    priority=Filter.GTE(7),
    status=Filter.OR(["published", "peer_reviewed"])
)
```

**搜索参数：**
- **`query`** (`str`, 必需)：要搜索的自然语言查询文本。将被编码和嵌入。
- **`topk`** (`int`, 默认: `10`)：要返回的顶部结果数，按相似性分数排名。
- **`include`** (`Iterable[str]`, 可选)：结果中要包含的字段
  - `"id"`: 知识对象 ID (int)
  - `"kl"`: 知识对象本身 (BaseUKF)
  - `"score"`: 相似性分数 (float)
  - `"filter"`: 生成的 LlamaIndex 过滤对象 (用于调试)
  - `"query"`: 生成的 LlamaIndex 查询对象 (用于调试)
  - 默认: `["id", "kl", "score"]`
- **`**kwargs`**：使用 Filter 运算符或简单值的元数据过滤条件

**返回值：**
```python
List[Dict[str, Any]]  # 每个字典包含 `include` 中请求的字段
```

<br/>

### 5.2. 结果结构

**最小结果 (ID 和分数):**
```python
results = engine.search(query="deep learning", topk=5, include=["id", "score"])
# [
#   {"id": 123, "score": 0.89},
#   {"id": 456, "score": 0.85},
#   {"id": 789, "score": 0.82}
# ]
```

**完整结果 (带知识对象):**
```python
results = engine.search(query="neural networks", topk=5, include=["id", "kl", "score"])
# [
#   {"id": 123, "kl": <BaseUKF object>, "score": 0.89},
#   {"id": 456, "kl": <BaseUKF object>, "score": 0.85}
# ]
```

**调试结果 (带过滤和查询对象):**
```python
results = engine.search(
    query="transformers", 
    topk=1, 
    include=["id", "score", "filter", "query"],
    type="paper"
)
# [
#   {
#     "id": 123, 
#     "score": 0.89,
#     "filter": <MetadataFilters object>,
#     "query": <VectorStoreQuery object>
#   },
#   ...
# ]
```

<br/>

### 5.3. 混合搜索：语义 + 元数据过滤

将向量相似性与结构化元数据约束相结合：

```python
# 查找具有特定元数据的语义相似论文
results = engine.search(
    mode="vector",
    query="attention mechanisms in transformers",
    topk=10,
    include=["id", "kl", "score"],
    # 元数据过滤
    type="research_paper",
    year=Filter.GTE(2020),  # 仅近期论文
    venue=Filter.OR(["NeurIPS", "ICLR", "ICML"]),  # 顶级会议
    citations=Filter.GTE(100)  # 高引用
)

for result in results:
    kl = result["kl"]
    print(f"{kl.name} ({kl.year}) - Score: {result['score']:.3f}, Citations: {kl.citations}")
```

<br/>

### 5.4. 全局过滤条件

在所有搜索中应用持久的过滤条件：

```python
# 创建带有全局过滤条件的引擎
engine = VectorKLEngine(
    storage=store,
    inplace=True,
    filters={
        "type": "tutorial",                          # 仅索引教程
        "status": "published",                       # 仅已发布内容
        "language": Filter.OR(["en", "zh"])         # 仅英文或中文
    }
)

# 所有搜索都会自动包含全局过滤条件
results = engine.search(
    query="python programming basics",
    topk=5,
    priority=Filter.GTE(7)  # 在全局过滤条件之上的附加过滤条件
)
# 结果将是：tutorials AND published AND (en OR zh) AND priority >= 7
```

<br/>

### 5.5. 相似性分数阈值

按最小相似性分数过滤结果：

```python
# 获取所有结果
results = engine.search(query="machine learning", topk=20, include=["id", "kl", "score"])

# 按分数阈值过滤
high_quality = [r for r in results if r["score"] >= 0.8]
medium_quality = [r for r in results if 0.6 <= r["score"] < 0.8]
low_quality = [r for r in results if r["score"] < 0.6]

print(f"高质量匹配: {len(high_quality)}")
print(f"中等质量匹配: {len(medium_quality)}")
print(f"低质量匹配: {len(low_quality)}")
```

<br/>

## 6. 完整示例

### 6.1. 研究论文语义搜索

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF
import datetime

# 设置存储和引擎
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./research_papers",
    collection="papers",
    encoder=lambda kl: f"{kl.name}. {kl.content}",
    embedder=embedder
)

engine = VectorKLEngine(storage=store, inplace=True)

# 创建研究论文
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        content="We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
        year=2017,
        venue="NeurIPS",
        citations=50000,
        authors=["Vaswani et al."]
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        content="We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers.",
        year=2018,
        venue="NAACL",
        citations=30000,
        authors=["Devlin et al."]
    ),
    BaseUKF(
        name="ResNet: Deep Residual Learning for Image Recognition",
        type="research_paper",
        content="We present a residual learning framework to ease the training of very deep networks.",
        year=2015,
        venue="CVPR",
        citations=40000,
        authors=["He et al."]
    ),
]
store.batch_upsert(papers)
store.flush()

# 查询 1: 语义搜索与 transformer 相关的论文
results = engine.search(
    query="transformer architectures for natural language processing",
    topk=5,
    include=["id", "kl", "score"]
)
print("=== Transformer 论文 ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} (score: {result['score']:.3f})")

# 查询 2: 近期高影响力论文
results = engine.search(
    query="deep learning breakthroughs",
    topk=5,
    include=["id", "kl", "score"],
    year=Filter.GTE(2017),
    citations=Filter.GTE(20000)
)
print("\n=== 近期高影响力论文 ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} ({kl.year}): {kl.citations} 引用")

# 查询 3: 来自特定会议的论文
results = engine.search(
    query="attention mechanisms neural networks",
    topk=3,
    include=["id", "kl", "score"],
    venue=Filter.OR(["NeurIPS", "ICLR", "NAACL"])
)
print("\n=== 顶级会议论文 ===")
for result in results:
    kl = result["kl"]
    print(f"- {kl.name} at {kl.venue}")
```

<br/>

### 6.2. 带元数据过滤的文档搜索

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# 设置
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="chromalite",
    collection="docs",
    encoder=lambda kl: kl.content,
    embedder=embedder
)
engine = VectorKLEngine(storage=store, inplace=True)

# 创建文档
docs = [
    BaseUKF(
        name="Python Lists Tutorial",
        type="tutorial",
        difficulty="beginner",
        language="python",
        content="Learn how to use lists in Python: creating, indexing, slicing, and common operations.",
        tags={"data-structures", "basics"}
    ),
    BaseUKF(
        name="Advanced Dictionary Techniques",
        type="guide",
        difficulty="advanced",
        language="python",
        content="Deep dive into Python dictionaries: comprehensions, defaultdict, OrderedDict, and performance optimization.",
        tags={"data-structures", "optimization"}
    ),
    BaseUKF(
        name="JavaScript Promises",
        type="tutorial",
        difficulty="intermediate",
        language="javascript",
        content="Understanding asynchronous programming with Promises: then, catch, async/await patterns.",
        tags={"async", "modern-js"}
    ),
    BaseUKF(
        name="Python Async/Await Guide",
        type="guide",
        difficulty="advanced",
        language="python",
        content="Master asynchronous programming in Python using asyncio, async/await syntax, and coroutines.",
        tags={"async", "concurrency"}
    ),
]
store.batch_upsert(docs)
store.flush()

# 查询 1: 适合初学者的 Python 教程
results = engine.search(
    query="how to get started with Python programming",
    topk=3,
    include=["id", "kl", "score"],
    language="python",
    difficulty="beginner"
)
print("=== Beginner Python Tutorials ===")
for result in results:
    print(f"- {result['kl'].name} (score: {result['score']:.3f})")

# 查询 2: 任何语言的异步编程
results = engine.search(
    query="asynchronous programming patterns",
    topk=5,
    include=["id", "kl", "score"]
)
print("\n=== Async Programming Resources ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name} ({kl.language}, {kl.difficulty})")

# 查询 3: 仅限高级 Python 内容
results = engine.search(
    query="data structures and algorithms",
    topk=3,
    include=["id", "kl", "score"],
    language="python",
    difficulty=Filter.OR(["intermediate", "advanced"])
)
print("\n=== Advanced Python Content ===")
for result in results:
    print(f"- {result['kl'].name}")
```

<br/>

### 6.3. 电子商务产品推荐

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# 设置
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./products",
    collection="catalog",
    encoder=lambda kl: f"{kl.name}. {kl.content}",
    embedder=embedder
)
engine = VectorKLEngine(storage=store, inplace=True)

# 创建产品
products = [
    BaseUKF(
        name="Laptop Pro 15",
        type="electronics",
        category="laptop",
        brand="TechCorp",
        price=1299.99,
        rating=4.5,
        in_stock=True,
        content="High-performance laptop with 15-inch display, 16GB RAM, 512GB SSD, perfect for programming and content creation"
    ),
    BaseUKF(
        name="Wireless Mechanical Keyboard",
        type="electronics",
        category="accessory",
        brand="KeyMaster",
        price=129.99,
        rating=4.7,
        in_stock=True,
        content="Premium wireless mechanical keyboard with RGB lighting, perfect for programmers and gamers"
    ),
    BaseUKF(
        name="USB-C Hub 7-in-1",
        type="electronics",
        category="accessory",
        brand="ConnectAll",
        price=49.99,
        rating=4.3,
        in_stock=True,
        content="Versatile USB-C hub with HDMI, USB 3.0, SD card reader, and ethernet port for laptops"
    ),
    BaseUKF(
        name="Ergonomic Office Chair",
        type="furniture",
        category="chair",
        brand="ComfortSeating",
        price=399.99,
        rating=4.6,
        in_stock=False,
        content="Premium ergonomic chair with lumbar support, adjustable armrests, ideal for long programming sessions"
    ),
]
store.batch_upsert(products)
store.flush()

# 查询 1: 为程序员的配置寻找产品
results = engine.search(
    query="best equipment for software developers",
    topk=5,
    include=["id", "kl", "score"],
    in_stock=True  # 仅限有货商品
)
print("=== Developer Setup Recommendations ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: ${kl.price} (rating: {kl.rating}, score: {result['score']:.3f})")

# 查询 2: 经济实惠的配件
results = engine.search(
    query="affordable laptop accessories",
    topk=3,
    include=["id", "kl", "score"],
    category="accessory",
    price=Filter.LTE(150.00),
    rating=Filter.GTE(4.0)
)
print("\n=== Budget Accessories ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: ${kl.price}")

# 查询 3: 高端电子产品
results = engine.search(
    query="high quality professional equipment",
    topk=3,
    include=["id", "kl", "score"],
    type="electronics",
    price=Filter.GTE(1000.00),
    in_stock=True
)
print("\n=== Premium Electronics ===")
for result in results:
    kl = result['kl']
    print(f"- {kl.name} by {kl.brand}: ${kl.price}")
```

<br/>

### 6.4. 使用不同后端的非原地模式

```python
from ahvn.klstore import VectorKLStore
from ahvn.klengine import VectorKLEngine
from ahvn.utils.vdb.filter import Filter
from ahvn.llm import LLM

# 使用 LanceDB 的存储
embedder = LLM(preset="embedder")
store = VectorKLStore(
    provider="lancedb",
    uri="./primary_store",
    collection="documents",
    encoder=lambda kl: kl.content,
    embedder=embedder
)

# 填充存储
# ... (向存储中添加文档)

# 使用 ChromaDB 创建搜索索引 (不同的后端)
engine = VectorKLEngine(
    storage=store,
    inplace=False,
    include=["id", "name", "type", "priority", "tags"],  # 元数据子集
    provider="chromalite",  # 与存储提供商不同
    collection="search_index",
    encoder=lambda kl: kl.content,  # 可以使用不同的编码
    embedder=embedder  # 可以使用不同的嵌入模型
)

# 初始同步
print("Building search index...")
engine.sync()
print(f"Indexed {len(engine)} documents")

# 在优化的索引上进行快速混合搜索
results = engine.search(
    query="machine learning fundamentals",
    topk=10,
    include=["id", "score"],  # 为了速度使用最小的包含字段
    type="tutorial",
    priority=Filter.GTE(7)
)
print(f"Found {len(results)} matching documents")

# 关闭资源
engine.close()
store.close()
```

<br/>

## 进一步探索

> **提示：** 关于基础接口和通用操作，请参阅：
> - [BaseKLEngine](./base.md) - 定义 KLEngine 接口和共享功能的抽象基类
> - [KLEngine 概述](./index.md) - 查询引擎和检索策略简介

> **提示：** 关于其他搜索方法，请参阅：
> - [FacetKLEngine](./facet.md) - 使用 SQL 谓词的结构化过滤和分面搜索
> - [DAACKLEngine](./daac.md) - 用于实体识别的多模式字符串匹配

> **提示：** 关于向量数据库集成，请参阅：
> - [VectorKLStore](../klstore/vector.md) - 带嵌入的知识对象的向量数据库存储
> - [向量数据库工具](../utils/vdb.md) - 基于 LlamaIndex 的向量数据库包装器，带编码器/嵌入器流水线
> - [向量数据库配置](../../configuration/vdb.md) - 向量数据库提供商的 YAML 配置

> **提示：** 关于嵌入和编码，请参阅：
> - [LLM](../llm.md) - 用于嵌入生成的语言模型

<br/>
