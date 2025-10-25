# 向量数据库工具

本指南展示如何在 AgentHeaven 中使用基于 LlamaIndex 后端和 YAML 配置支持的统一 VectorDatabase 接口处理向量数据库。

## 1. 向量数据库架构

AgentHeaven 提供了一个基于 [LlamaIndex](https://www.llamaindex.ai/) 的通用向量数据库连接器，为跨不同提供商存储和查询高维向量嵌入提供了清晰直观的接口。VectorDatabase 类使用 YAML 配置进行连接管理，并支持多个向量数据库后端。

**当前支持的后端：**
- SimpleVectorStore（内存）
- LanceDB
- ChromaDB
- Milvus
- PGVector（PostgreSQL with pgvector 扩展）

### 1.1. 什么是 LlamaIndex？

[LlamaIndex](https://www.llamaindex.ai/) 是一个用于 LLM 应用的数据框架，为各种向量存储、文档加载器和检索系统提供统一接口。AgentHeaven 利用 LlamaIndex 的 `VectorStore` 抽象，在不同后端之间提供一致的向量数据库操作。

<br/>

### 1.2. LlamaIndex Nodes

在 LlamaIndex 中，数据以 **`Node`** 对象的形式存储，特别是用于基于文本的向量数据的 **`TextNode`** 实例。每个 `TextNode` 包含：

- **`text`**：实际的文本内容
- **`embedding`**：向量表示（浮点数列表）
- **`metadata`**：额外的结构化数据（标量值字典）
- **`id_`**：节点的唯一标识符

AgentHeaven 的 `VectorDatabase` 类自动在字典记录和 `TextNode` 对象之间进行转换，提供更直观的接口，同时保持与 LlamaIndex 生态系统的完全兼容性。

```python
# LlamaIndex TextNode 结构（您无需手动创建这些）
from llama_index.core.schema import TextNode

node = TextNode(
    text="向量数据库支持语义搜索",
    embedding=[0.1, 0.2, 0.3, ...],  # 高维向量
    metadata={"category": "definition", "priority": 8},
    id_="unique_node_id"
)
```

与 `Database` 类似，`VectorDatabase` 应作为实例使用，在正常情况下仅存储连接向量数据库的配置/参数，而不存储连接本身。

<br/>

### 1.3. 创建 VectorDatabase 实例

要创建 VectorDatabase 实例，提供 YAML 配置中定义的 `provider` 名称以及任何连接参数，或手动直接指定所有连接参数。您还需要提供 **encoder** 和 **embedder** 函数来将对象转换为文本，将文本转换为向量。

```python
from ahvn.utils.vdb import VectorDatabase
from ahvn.llm import LLM

# 创建用于生成向量的 embedder
embedder = LLM(preset="embedder")

# 使用 YAML 配置创建 VectorDatabase 实例
vdb = VectorDatabase(
    provider="lancedb",
    collection="my_collection",
    embedder=embedder,
    connect=True
)
```

> **提示：** AgentHeaven 在运行时通过 `resolve_vdb_config` 解析这些提供商条目，默认值来自 YAML 配置。有关详细的配置选项，请参阅[向量数据库配置](../../configuration/vdb.md)指南。

<br/>

## 2. Encoder 和 Embedder

`VectorDatabase` 类使用两个关键组件进行数据处理：

### 2.1. Encoder

**encoder** 将任意对象转换为文本字符串。默认情况下，它使用 `str()` 转换，但您可以提供自定义编码器：

```python
# 默认编码器（使用 str()）
vdb = VectorDatabase(provider="lancedb", embedder=embedder)

# KnowledgeUKFT 对象的自定义编码器
def knowledge_encoder(obj):
    if hasattr(obj, 'content'):
        return f"{obj.name}: {obj.content}"
    return str(obj)

vdb = VectorDatabase(
    provider="lancedb",
    encoder=knowledge_encoder,
    embedder=embedder
)
```

<br/>

### 2.2. Embedder

**embedder** 将文本字符串转换为向量嵌入。您可以使用：

- **LLM 实例**（推荐）：使用配置的嵌入模型
- **可调用函数**：自定义嵌入函数
- **字符串预设**：自动创建具有该预设的 LLM

```python
from ahvn.llm import LLM

# 选项 1：LLM 实例（推荐）
embedder = LLM(preset="embedder")
vdb = VectorDatabase(provider="lancedb", embedder=embedder)

# 选项 2：字符串预设（自动创建 LLM）
vdb = VectorDatabase(provider="lancedb", embedder="embedder")

# 选项 3：自定义函数
def custom_embedder(text):
    # 您的自定义嵌入逻辑
    return [0.1, 0.2, 0.3, ...]  # 返回向量

vdb = VectorDatabase(provider="lancedb", embedder=custom_embedder)
```

<br/>

### 2.3. 分离的 K 和 Q Encoder/Embedder

对于高级用例，您可以为**知识**（存储的数据）和**查询**（搜索查询）指定不同的编码器/嵌入器：

```python
# 知识和查询的分离编码器
k_encoder = lambda obj: f"KNOWLEDGE: {str(obj)}"
q_encoder = lambda obj: f"QUERY: {str(obj)}"

# 知识和查询的分离嵌入器
k_embedder = LLM(preset="embedder")
q_embedder = LLM(preset="embedder_query")

vdb = VectorDatabase(
    provider="lancedb",
    encoder=(k_encoder, q_encoder),
    embedder=(k_embedder, q_embedder)
)
```

知识和查询嵌入器的维度会自动检测并存储为 `vdb.k_dim` 和 `vdb.q_dim`。

<br/>

## 3. 向量数据库连接

### 3.1. 基本连接

使用 `connect()` 建立连接，使用 `close()` 终止连接。

```python
from ahvn.utils.vdb import VectorDatabase
from ahvn.llm import LLM

# 初始化并立即连接
vdb = VectorDatabase(
    provider="lancedb",
    collection="test_collection",
    embedder=LLM(preset="embedder"),
    connect=True
)

# 或稍后连接
vdb = VectorDatabase(provider="lancedb", embedder="embedder")
vdb.connect()

# 关闭连接
vdb.close()
```

在连接期间，使用 `vdb.vdb` 属性访问底层的 LlamaIndex `VectorStore` 实例。

<br/>

## 4. 数据操作

### 4.1. 插入记录

将单个记录作为包含 `text`、`vector` 和可选元数据字段的字典插入：

```python
# 插入单个记录
record = {
    "id": "doc_1",
    "text": "向量数据库支持语义搜索",
    "vector": [0.1, 0.2, 0.3, ...],  # 必须匹配嵌入器维度
    "category": "definition",
    "priority": 8
}

vdb.insert(record)
```

> **注意：** `vector` 字段应包含嵌入向量。您可以使用 `vdb.k_encode_embed()` 或直接使用您的嵌入器生成它。

<br/>

### 4.2. 批量插入

高效地插入多个记录：

```python
records = [
    {
        "id": f"doc_{i}",
        "text": f"文档内容 {i}",
        "vector": [float(i) * 0.1] * 128,
        "index": i
    }
    for i in range(100)
]

vdb.batch_insert(records)
```

<br/>

### 4.3. 删除记录

通过 ID 删除记录：

```python
# 删除单个记录
vdb.delete("doc_1")
```

> **注意：** 某些后端可能对删除操作有限制。有关详细信息，请查看特定后端的文档。

<br/>

### 4.4. 清空所有记录

从集合中删除所有记录：

```python
# 清空所有记录（保留集合结构）
vdb.clear()
```

> **警告：** 此操作无法撤消。请谨慎使用。

<br/>

### 4.5. 刷新操作

显式刷新待处理操作到向量数据库：

```python
# 刷新待处理操作（特定于后端）
vdb.flush()
```

> **注意：** 并非所有后端都需要显式刷新。这主要与 Milvus 相关。

<br/>

## 5. 编码和嵌入

### 5.1. 知识编码和嵌入

使用 `k_encode_embed()` 将对象转换为文本并生成嵌入：

```python
from ahvn.ukf.templates.basic import KnowledgeUKFT

# 创建知识对象
knowledge = KnowledgeUKFT(
    name="向量搜索",
    content="向量数据库使用嵌入实现语义搜索",
    tags={"[topic:vdb]", "[type:definition]"}
)

# 一步完成编码和嵌入
text, vector = vdb.k_encode_embed(knowledge)

# 插入记录
record = {
    "id": str(knowledge.id),
    "text": text,
    "vector": vector,
    "name": knowledge.name,
    "priority": knowledge.priority
}
vdb.insert(record)
```

<br/>

### 5.2. 查询编码和嵌入

使用 `q_encode_embed()` 准备查询：

```python
# 编码和嵌入查询
query_text, query_vector = vdb.q_encode_embed("什么是语义搜索？")

# 用于搜索
query = vdb.search(embedding=query_vector, topk=5)
```

<br/>

### 5.3. 分离的编码和嵌入

为了更精细的控制，单独使用 `k_encode()`/`q_encode()` 和 `k_embed()`/`q_embed()`：

```python
# 知识的分离编码和嵌入
obj = {"name": "Test", "content": "Test content"}
encoded_text = vdb.k_encode(obj)
embedding = vdb.k_embed(encoded_text)

# 查询的分离编码和嵌入
query_text = vdb.q_encode("search query")
query_embedding = vdb.q_embed(query_text)
```

<br/>

## 6. 向量搜索

### 6.1. 使用嵌入搜索

使用预计算的嵌入向量进行搜索：

```python
# 生成查询嵌入
query_text, query_vector = vdb.q_encode_embed("机器学习概念")

# 创建搜索查询
query = vdb.search(embedding=query_vector, topk=5)

# 使用底层 VectorStore 执行搜索
results = vdb.vdb.query(query)

# 访问结果
for node_id, score in zip(results.ids, results.similarities):
    print(f"ID: {node_id}, Score: {score}")
```

<br/>

### 6.2. 使用查询对象搜索

直接使用查询对象进行搜索：

```python
# 使用查询对象搜索（自动生成嵌入）
query = vdb.search(query="什么是深度学习？", topk=10)

# 执行搜索
results = vdb.vdb.query(query)
```

<br/>

### 6.3. 使用过滤器搜索

应用元数据过滤器缩小搜索结果范围：

```python
from ahvn.utils.vdb.filter import Filter, FilterOperator

# 创建过滤器
filters = Filter.AND(
    Filter.EQ("category", "ml"),
    Filter.GTE("priority", 5)
)

# 使用过滤器搜索
query = vdb.search(
    query="机器学习",
    topk=5,
    filters=filters
)

results = vdb.vdb.query(query)
```

> **提示：** 有关过滤器操作的详细信息，请参阅 `src/ahvn/utils/vdb/filter.py` 中的源代码。

<br/>

### 6.4. 搜索参数

`search()` 方法接受多个参数：

- **`query`**：查询对象或文本（自动编码和嵌入）
- **`embedding`**：预计算的查询嵌入向量
- **`topk`**：返回的顶部结果数量（默认：5）
- **`filters`**：要应用的元数据过滤器
- **`*args, **kwargs`**：额外的特定于后端的参数

```python
# 使用各种参数搜索
query = vdb.search(
    query="语义搜索",
    topk=10,
    filters=None
)
```

> **注意：** 必须提供 `query` 或 `embedding`，但不能同时提供。

<br/>

## 7. UKF 的类型适配器

AgentHeaven 提供类型适配器，用于在 UKF（统一知识格式）类型和向量数据库字段类型之间进行转换。这些适配器在 `ahvn.utils.vdb.types` 中定义。

### 7.1. 内置类型适配器

- **`VdbIdType`**：用于 UKF ID 字段（转换为字符串格式）
- **`VdbTextType`**：用于一般文本字段
- **`VdbIntegerType`**：用于整数值
- **`VdbBooleanType`**：用于布尔标志
- **`VdbTimestampType`**：用于时区感知的时间戳
- **`VdbJsonType`**：用于 JSON 可序列化数据
- **`VdbVectorType`**：用于向量嵌入
- **`VdbTagsType`**：用于标签集
- **`VdbSynonymsType`**：用于同义词列表
- **`VdbRelatedType`**：用于相关实体引用
- **`VdbAuthsType`**：用于作者/创建者列表

<br/>

### 7.2. 类型转换

类型适配器处理 UKF 和 VDB 格式之间的转换：

```python
from ahvn.utils.vdb.types import VdbIdType, VdbTextType, VdbJsonType

# ID 转换
id_type = VdbIdType()
vdb_id = id_type.from_ukf(123456789)  # 转换为哈希字符串
ukf_id = id_type.to_ukf(vdb_id)  # 转换回整数

# JSON 转换
json_type = VdbJsonType()
vdb_json = json_type.from_ukf({"key": "value"})  # 转换为 JSON 字符串
ukf_json = json_type.to_ukf(vdb_json)  # 转换回字典
```

> **提示：** 有关 UKF 数据类型和适配器的更多详细信息，请参阅 [UKF 数据类型](../ukf/data-types.md)。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中向量数据库配置的更多信息，请参阅：
> - [向量数据库配置](../../configuration/vdb.md) - 向量数据库连接和存储配置

> **提示：** 有关相关功能，请参阅：
> - [UKF 数据类型](../ukf/data-types.md) - UKF 与向量数据库之间的数据类型映射
> - [数据库工具](./db.md) - 关系数据库操作和工具
> - [VectorKLStore](../klstore/vector.md) - 由向量数据库支持的知识存储
> - [VectorKLEngine](../klengine/vector.md) - 使用向量相似度搜索的知识检索引擎

> **提示：** 有关 AgentHeaven 中更多工具的信息，请参阅：
> - [实用工具](../index.md) - 所有用于便利的 Python 实用工具

<br/>
