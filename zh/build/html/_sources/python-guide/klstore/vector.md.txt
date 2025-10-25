# VectorKLStore

VectorKLStore 是一个基于向量数据库的 [BaseKLStore](./base.md) 实现,构建在 AgentHeaven 的 [VectorDatabase](../utils/vdb.md) 封装之上,该封装基于 LlamaIndex。它为知识对象提供语义存储,具有自动嵌入生成功能,并支持多种向量数据库后端。

## 1. 简介

### 1.1. 用于语义搜索的向量存储

VectorKLStore 桥接了简单的基于 ID 的存储与语义相似性搜索:

**VectorKLStore 的角色:**
- **基于 ID 的访问**: 标准 BaseKLStore CRUD 操作(通过 ID 获取、插入、更新、删除)
- **自动嵌入**: 使用可配置的编码器/嵌入器将 UKF 对象转换为向量
- **多种后端**: 通过 LlamaIndex 支持 LanceDB、ChromaDB、Milvus、PGVector
- **引擎就绪**: 为 [VectorKLEngine](../klengine/vector.md) 语义搜索准备数据

**为什么仅 VectorKLStore 不足以进行搜索:**
VectorKLStore 仅实现 BaseKLStore 接口(基于 ID 的操作)。对于语义相似性查询、过滤和排名,你需要一个构建在此存储之上的 [VectorKLEngine](../klengine/vector.md)。

<br/>

### 1.2. LlamaIndex 集成

VectorKLStore 使用 LlamaIndex 的统一向量存储抽象:
- **TextNode 存储**: UKF 对象转换为 LlamaIndex `TextNode` 格式
- **VdbUKFAdapter**: BaseUKF 和 TextNode 之间的双向映射,带有元数据
- **编码器/嵌入器流水线**: 可自定义的文本提取和嵌入生成
- **后端抽象**: 相同的代码可在 SimpleVectorStore、LanceDB、ChromaDB、Milvus、PGVector 上工作

<br/>

## 2. 快速开始

### 2.1. 基本用法

```python
from ahvn.klstore import VectorKLStore
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF

# 创建嵌入器以生成向量
embedder = LLM(preset="embedder")

# LanceDB(文件存储,最简单)
store = VectorKLStore(
    collection="knowledge_base",
    provider="lancedb",
    uri="./data/lancedb",
    embedder=embedder
)

# 或 ChromaDB(生产就绪)
store = VectorKLStore(
    collection="knowledge_base",
    provider="chroma",
    mode="persistent",
    path="./data/chroma",
    embedder=embedder
)

# 创建并存储知识对象
kl = BaseUKF(
    name="Python Tutorial",
    type="documentation",
    content="Learn Python programming from scratch"
)
store.upsert(kl)

# 通过 ID 检索(不是通过语义搜索 - 使用 VectorKLEngine 进行语义搜索)
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

所有标准 [BaseKLStore](./base.md) 操作都能工作:`insert()`、`upsert()`、`get()`、`remove()`、`batch_*()`、迭代等。

<br/>

### 2.2. 初始化参数

- **`collection`**(必需):向量数据库中的集合/表名称
- **`provider`**(可选):向量数据库提供商("lancedb"、"chroma"、"milvus"、"pgvector");如果省略则使用配置默认值
- **`name`**(可选):KLStore 实例名称(默认:集合名称)
- **`encoder`**(可选):将对象转换为文本的函数;默认为 `str()`
- **`embedder`**(必需):LLM 实例或将文本转换为向量的函数
- **`condition`**(可选):过滤函数,用于有条件地存储对象
- **其他 kwargs**: 后端特定的连接参数(uri、path、mode、host 等)

<br/>

## 3. 向量数据库后端

### 3.1. LanceDB — 推荐用于生产

```python
store = VectorKLStore(
    collection="knowledge",
    provider="lancedb",
    uri="./data/lancedb",  # 文件路径
    embedder=embedder
)
# 快速、文件存储、适合分析和生产
```

<br/>

### 3.2. ChromaDB — 开发与测试

```python
# 持久化模式(文件存储)
store = VectorKLStore(
    collection="knowledge",
    provider="chroma",
    mode="persistent",
    path="./data/chroma",
    embedder=embedder
)

# 临时模式(内存,用于测试)
store = VectorKLStore(
    collection="knowledge",
    provider="chroma",
    mode="ephemeral",
    embedder=embedder
)
```

<br/>

### 3.3. Milvus — 大规模生产

```python
# MilvusLite(文件存储,无需服务器)
store = VectorKLStore(
    collection="knowledge",
    provider="milvus",
    uri="./data/milvus.db",
    embedder=embedder
)

# Milvus Server(分布式、高性能)
store = VectorKLStore(
    collection="knowledge",
    provider="milvus",
    host="localhost",
    port=19530,
    embedder=embedder
)
```

<br/>

### 3.4. PGVector — PostgreSQL 集成

```python
store = VectorKLStore(
    collection="knowledge",
    provider="pgvector",
    database="mydb",
    host="localhost",
    port=5432,
    username="user",
    password="pass",
    embedder=embedder
)
# 利用 PostgreSQL 的 pgvector 扩展
```

<br/>

## 4. 编码器和嵌入器配置

VectorKLStore 需要 **encoder**(对象 → 文本)和 **embedder**(文本 → 向量)函数:

### 4.1. 默认编码器

默认情况下,使用 `str()` 转换:

```python
store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    embedder=embedder
)
# 编码器: kl → str(kl) → "BaseUKF(name='...', ...)"
```

<br/>

### 4.2. 自定义编码器

提供自定义函数从 UKF 对象中提取文本:

```python
def knowledge_encoder(kl):
    """从 UKF 中提取有意义的文本以进行嵌入。"""
    parts = [kl.name, kl.type]
    if kl.content:
        parts.append(kl.content)
    if kl.synonyms:
        parts.extend(kl.synonyms)
    return " | ".join(parts)

store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    encoder=knowledge_encoder,
    embedder=embedder
)
```

<br/>

### 4.3. 嵌入器选项

使用 LLM 实例、可调用对象或预设字符串:

```python
from ahvn.llm import LLM

# 选项 1: LLM 实例(推荐)
embedder = LLM(preset="embedder")
store = VectorKLStore(provider="lancedb", embedder=embedder)

# 选项 2: 预设字符串(自动创建 LLM)
store = VectorKLStore(provider="lancedb", embedder="embedder")

# 选项 3: 自定义函数
def my_embedder(text: str) -> list[float]:
    # 你的嵌入逻辑
    return [0.1, 0.2, 0.3, ...]  # 128 维或更高

store = VectorKLStore(provider="lancedb", embedder=my_embedder)
```

<br/>

### 4.4. 分离的 K 和 Q 编码器/嵌入器

对于高级用例(例如,非对称搜索),为知识(存储数据)和查询指定不同的编码器/嵌入器:

```python
# 存储与查询的不同文本提取
k_encoder = lambda kl: f"{kl.name}: {kl.content}"
q_encoder = lambda query: f"SEARCH: {query}"

# 存储与查询的不同嵌入模型
k_embedder = LLM(preset="embedder")
q_embedder = LLM(preset="embedder_query")

store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    encoder=(k_encoder, q_encoder),
    embedder=(k_embedder, q_embedder)
)
```

<br/>

## 5. VectorKLStore 特定功能

### 5.1. 自动模式初始化

VectorKLStore 在初始化时自动创建一个虚拟记录以建立模式:

```python
store = VectorKLStore(collection="docs", provider="lancedb", embedder=embedder)
# 内部:
# 1. 创建虚拟 UKF 以推断模式
# 2. 插入并立即删除它
# 3. 模式现已为所有未来插入建立
```

<br/>

### 5.2. VdbUKFAdapter 集成

适配器处理 BaseUKF 和 LlamaIndex TextNode 之间的双向转换:

```python
# 由 VectorKLStore 内部使用
# UKF → TextNode(带嵌入)
node = adapter.from_ukf(kl=knowledge_obj, key=encoded_text, embedding=vector)

# TextNode → UKF(检索)
kl = adapter.to_ukf(entity=text_node)
```

你可以使用 `include`/`exclude` 控制存储哪些 UKF 字段:

```python
store = VectorKLStore(
    collection="docs",
    provider="lancedb",
    embedder=embedder,
    include=["name", "type", "content", "tags"],  # 只存储这些字段
    exclude=["related"]  # 排除此字段
)
```

<br/>

### 5.3. 关闭连接

```python
# 关闭向量数据库连接
store.close()
```

<br/>

## 6. 完整示例

```python
from ahvn.klstore import VectorKLStore
from ahvn.llm import LLM
from ahvn.ukf import BaseUKF, ptags

# 初始化嵌入器
embedder = LLM(preset="embedder")

# 自定义编码器以提取有意义的文本
def encode_knowledge(kl):
    text = f"{kl.name} ({kl.type})"
    if kl.content:
        text += f": {kl.content}"
    return text

# 使用 LanceDB 创建 VectorKLStore
store = VectorKLStore(
    collection="research_papers",
    provider="lancedb",
    uri="./data/vectors",
    encoder=encode_knowledge,
    embedder=embedder,
    name="research_store",
    condition=lambda kl: kl.type in ["research_paper", "review_paper"]
)

# 创建知识对象
papers = [
    BaseUKF(
        name="Attention Is All You Need",
        type="research_paper",
        content="Transformer architecture for sequence modeling",
        tags=ptags(FIELD="deep_learning", TOPIC="transformers", YEAR="2017")
    ),
    BaseUKF(
        name="BERT: Pre-training of Deep Bidirectional Transformers",
        type="research_paper",
        content="Bidirectional encoder representations from transformers",
        tags=ptags(FIELD="nlp", TOPIC="pre_training", YEAR="2018")
    ),
    BaseUKF(
        name="Random Blog Post",
        type="blog_post",  # 被条件过滤掉
        content="Some content..."
    )
]

# 批量插入(blog_post 被条件过滤掉)
store.batch_upsert(papers)

# 标准 KLStore 操作(基于 ID,不是语义搜索)
print(f"Total papers: {len(store)}")  # 2

# 通过 ID 获取
paper = store.get(papers[0].id)
print(f"Retrieved: {paper.name}")

# 更新
paper = paper.clone(content=paper.content + " with multi-head attention")
store.upsert(paper)

# 迭代
for paper in store:
    print(f"- {paper.name} ({paper.tags.get('YEAR')})")

# 删除
store.remove(papers[1].id)

# 对于语义搜索,改用 VectorKLEngine:
# from ahvn.klengine import VectorKLEngine
# engine = VectorKLEngine(storage=store, inplace=True)
# results = engine.search("transformer architectures", top_k=5)

# 清理
store.close()
```

<br/>

## 7. 限制以及何时使用 VectorKLEngine

### 7.1. VectorKLStore 不提供什么

VectorKLStore 仅实现 **BaseKLStore 接口**(基于 ID 的 CRUD)。它**不**支持:

- ❌ 语义相似性搜索
- ❌ 向量相似性查询
- ❌ 按相关性的 Top-K 检索
- ❌ 按元数据 + 向量相似性过滤
- ❌ 排名和评分

<br/>

### 7.2. 使用 VectorKLEngine 进行搜索

对于语义查询,使用 [VectorKLEngine](../klengine/vector.md) 包装 VectorKLStore:

```python
from ahvn.klengine import VectorKLEngine

# 原地引擎(直接在向量数据库中搜索)
engine = VectorKLEngine(storage=store, inplace=True)

# 语义搜索
results = engine.search(
    query="transformer architectures for NLP",
    top_k=5,
    filters={"FIELD": "deep_learning"}
)

for kl, score in results:
    print(f"{kl.name} (score: {score:.3f})")
```

<br/>

## 拓展阅读

> **提示:** 查看接口和通用操作:
> - [BaseKLStore](./base.md) - 定义 KLStore 接口和共享功能的抽象基类

> **提示:** 查看向量数据库配置和实用工具:
> - [Vector Database Utilities](../utils/vdb.md) - 基于 LlamaIndex 的向量数据库封装,带有编码器/嵌入器流水线
> - [Vector Database Configuration](../../configuration/vdb.md) - 向量数据库提供商的 YAML 配置

> **提示:** 查看其他 KLStore 实现:
> - [CacheKLStore](./cache.md) - 具有多种后端选项的轻量级缓存存储
> - [DatabaseKLStore](./database.md) - 支持 ORM 的持久化关系数据库存储
> - [CascadeKLStore](./cascade.md) - 基于自定义标准的多层存储路由

> **提示:** 对于语义搜索和检索:
> - [VectorKLEngine](../klengine/vector.md) - 构建在 VectorKLStore 之上的语义相似性搜索引擎
> - [KLEngine](../klengine/index.md) - 构建在 KLStore 之上的查询引擎

<br/>
