# DAACKLEngine

DAACKLEngine 是一个高性能的 [BaseKLEngine](./base.md) 实现，利用双数组 Aho-Corasick（DAAC）自动机进行高效的多模式字符串匹配。它能够找到文本查询中所有已知实体字符串的出现位置，时间复杂度仅与查询长度线性相关，与模式数量无关，非常适合实体识别、命名实体链接和基于关键词的知识检索。

## 1. 简介

### 1.1. 什么是 DAAC 字符串搜索？

**DAACKLEngine** 基于 Aho-Corasick 自动机——这是一种能够在线性时间内同时搜索多个模式的强大数据结构。

- **输入**：文本查询（例如 "I'm learning Python and JavaScript for web development"）
- **已索引模式**：从知识对象中提取的已知实体字符串（例如 "Python"、"JavaScript"、"web development"）
- **输出**：所有匹配的知识对象及其在查询文本中的位置
- **速度**：一次遍历即可搜索数千模式，与模式数量无关

"双数组"实现提供了内存高效的存储和快速的状态转移，适合包含数万实体的大规模知识库。

<br/>

### 1.2. 何时使用 DAACKLEngine

**适用场景：**
- **实体识别**：识别文本中提及的所有已知实体（人物、地点、组织、技术术语）
- **基于关键词的检索**：通过精确或归一化字符串匹配查找知识对象
- **多语言支持**：通过自定义归一化支持任意字符集
- **别名解析**：处理实体名称的多种同义词和变体

**不适用的场景：**
- **语义搜索**：请使用 [VectorKLEngine](./vector.md) 进行基于语义的相似度搜索
- **结构化过滤**：请使用 [FacetKLEngine](./facet.md) 进行基于元数据的查询
- **模糊匹配**：DAAC 执行精确模式匹配（归一化后）

<br/>

### 1.3. 关键特性

- **多模式搜索**：在 O(n+m+z) 时间内同时搜索数千模式，其中 n 为查询长度，m 为模式总长度，z 为匹配数量
- **灵活的字符串编码**：使用自定义编码器函数从知识对象提取可搜索字符串
- **文本归一化**：应用自定义归一化（小写、重音去除等）以实现稳健匹配
- **冲突解决**：使用多种策略处理重叠匹配（overlap、longest、longest_distinct）
- **整词匹配**：可选择仅匹配完整单词，而非子字符串
- **持久化存储**：将自动机状态保存并加载到磁盘，实现快速初始化
- **延迟删除**：高效的批量删除，延迟自动机重建
- **逆序模式**：在反向字符串上构建自动机以优化后缀匹配

<br/>

## 2. 快速上手

### 2.1. 基本用法

```python
from ahvn.klengine import DAACKLEngine
from ahvn.klstore import CacheKLStore
from ahvn.cache import InMemCache
from ahvn.ukf import BaseUKF

# 创建存储并填充知识对象
cache = InMemCache()
store = CacheKLStore(cache=cache)

languages = [
    BaseUKF(name="Python", type="language", 
            synonyms=["python", "py", "python3"]),
    BaseUKF(name="JavaScript", type="language",
            synonyms=["javascript", "js", "ECMAScript"]),
    BaseUKF(name="Java", type="language",
            synonyms=["java", "JDK"]),
]
store.batch_upsert(languages)

# 创建使用基于同义词的编码器的 DAAC 引擎
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac_index",
    encoder=lambda kl: list(kl.synonyms),  # 使用同义词作为可搜索字符串
    normalizer=True,  # 启用默认归一化（小写 + 去除空白）
)

# 索引知识对象
for kl in store:
    engine.upsert(kl)
engine.flush()  # 构建自动机

# 在文本中搜索实体
query = "I'm learning Python and JavaScript for web development"
results = engine.search(query=query, include=["id", "kl", "matches"])

for result in results:
    kl = result["kl"]
    matches = result["matches"]  # (start, end) 位置列表
    print(f"Found '{kl.name}' at positions: {matches}")
# 输出：
# Found 'Python' at positions: [(14, 20)]
# Found 'JavaScript' at positions: [(25, 35)]
```

<br/>

### 2.2. 初始化参数

- **`storage`**（必填）：用于检索完整知识对象的 `BaseKLStore` 实例
- **`path`**（必填）：存储自动机文件（synonyms.json、ac.pkl、metadata.json）的本地目录路径
- **`encoder`**（必填）：从 BaseUKF 对象提取可搜索字符串的函数
  - 签名：`Callable[[BaseUKF], List[str]]`
  - 示例：`lambda kl: list(kl.synonyms)` 使用所有同义词
  - 示例：`lambda kl: [kl.name] + list(kl.synonyms)` 同时包含名称和同义词
- **`min_length`**（可选）：索引的最小字符串长度（默认：2）。更短的字符串将被忽略。
- **`inverse`**（可选）：在反向字符串上构建自动机以优化后缀匹配（默认：True）
- **`normalizer`**（可选）：文本归一化函数（默认：None）
  - `True`：使用默认归一化器（小写 + 去除空白）
  - `False` 或 `None`：不进行归一化
  - `Callable[[str], str]`：自定义归一化函数
- **`name`**（可选）：KLEngine 实例的名称（默认："{storage.name}_daac_idx"）
- **`condition`**（可选）：条件性索引对象的过滤函数（默认：None）

<br/>

## 3. 搜索操作

### 3.1. 默认搜索

主要的搜索方法在查询字符串中匹配模式：

```python
results = engine.search(
    query="Python is great for data science and machine learning",
    include=["id", "kl", "matches"]
)
```

**搜索参数：**
- **`query`**（str）：要搜索的文本
- **`conflict`**（str）：处理重叠匹配的策略（见 3.2 节）
- **`whole_word`**（bool）：仅匹配完整单词（默认：False）
- **`include`**（Iterable[str]）：结果中包含的字段
  - `"id"`：知识对象 ID（int）
  - `"kl"`：完整的 BaseUKF 对象（从存储中检索）
  - `"query"`：用于匹配的归一化查询字符串
  - `"matches"`：表示匹配位置的 (start, end) 元组列表

<br/>

### 3.2. 冲突解决策略

当多个模式在查询中重叠时，可通过 `conflict` 参数控制返回结果：

```python
# 重叠匹配示例
# 查询："pneumonoultramicroscopicsilicovolcanoconiosis"
# 模式："pneu"、"monoultra"、"ultra"、"micro"、"microscopic"、"ultramicroscopic"、"volcano"（1）、"volcano"（2）

# 策略 1：返回所有匹配（包括重叠）
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="overlap")
# 返回："pneu"、"monoultra"、"ultra"、"micro"、"microscopic"、"ultramicroscopic"、"volcano"（1）、"volcano"（2）

# 策略 2：每个位置仅保留最长匹配
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="longest")
# 返回："pneu"、"monoultra"、"microscopic"、"volcano"（可能是 1 或 2）

# 策略 3：允许不同实体匹配同一词段，但不交叉
results = engine.search(query="pneumonoultramicroscopicsilicovolcanoconiosis", conflict="longest_distinct")
# 返回："pneu"、"monoultra"、"microscopic"、"volcano"（1）、"volcano"（2）
```

**冲突策略：**
- **`"overlap"`**：返回所有匹配，包括重叠的（默认）
- **`"longest"`**：对于任何重叠集合，仅保留最长的匹配
- **`"longest_distinct"`**：允许不同实体匹配同一词段，但不交叉

<br/>

### 3.3. 整词匹配

将匹配限制为完整单词（由分隔符界定）：

```python
# 不使用 whole_word：在 "javascript" 中匹配 "java"
results = engine.search(query="I love javascript", whole_word=False)
# 可能返回：Java 对象（如果索引了 "java"）

# 使用 whole_word：仅匹配独立的 "java"
results = engine.search(query="I love javascript", whole_word=True)
# 返回：无（没有独立的 "java"）

results = engine.search(query="I love Java programming", whole_word=True)
# 返回：Java 对象（独立匹配）
```

<br/>

### 3.4. 灵活的结果包含

控制搜索结果中出现的字段：

```python
# 最简：仅 ID（最快）
results = engine.search(query="Python", include=["id"])
# [{"id": 123}]

# 包含知识对象
results = engine.search(query="Python", include=["id", "kl"])
# [{"id": 123, "kl": <BaseUKF object>}]

# 包含匹配位置
results = engine.search(query="Python and Java", include=["id", "matches"])
# [{"id": 123, "matches": [(0, 6)]}, {"id": 456, "matches": [(11, 15)]}]

# 完整详情
results = engine.search(query="Python", include=["id", "kl", "query", "matches"])
# [{"id": 123, "kl": <BaseUKF>, "query": "python", "matches": [(0, 6)]}]
```

<br/>

## 4. 索引维护

### 4.1. 插入和更新

需要注意的是，DAAC 不支持在线更新查询。在插入或更新后需要重建整个自动机。使用 `flush()` 在进行更改后重建自动机。

```python
# 插入或更新单个知识对象
kl = BaseUKF(name="TypeScript", type="language", synonyms=["typescript", "ts"])
store.upsert(kl)  # 添加到存储
engine.upsert(kl)  # 在 DAAC 引擎中索引
engine.flush()    # 重建自动机

# 批量插入（更高效）
new_kls = [kl1, kl2, kl3]
store.batch_upsert(new_kls)
engine.batch_upsert(new_kls)
engine.flush()
```

**注意：** 每次 upsert 后，更改会通过 `save()` 自动持久化到磁盘。调用 `flush()` 以重建自动机并应用延迟删除。

<br/>

### 4.2. 移除知识对象

DAACKLEngine 使用**延迟删除**以提高效率，即调用 `remove()` 时字符串不会立即从自动机中移除。而是被标记为删除，实际移除发生在调用 `flush()` 重建自动机时。这允许在无需等待完整重建的情况下立即进行带有移除的查询。

```python
# 移除单个对象（延迟删除）
engine.remove(kl_id)
# 标记为删除，但自动机尚未重建

# 批量移除（延迟）
engine.batch_remove([id1, id2, id3])

# 应用删除并重建自动机
engine.flush()
```

<br/>

### 4.3. 清空索引

```python
# 从引擎中移除所有知识对象
engine.clear()
# 自动机被重置并保存到磁盘
```

<br/>

## 5. 文本归一化

### 5.1. 默认归一化

默认归一化器包括分词、停用词移除、词形还原和小写化。

```python
# 启用默认归一化（小写 + 去除空白）
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=True  # 大小写不敏感匹配
)

# 将 "PYTHON"、"Python"、"python" 都匹配为同一模式，"programming" -> "program" 等
results = engine.search(query="I love PYTHON programming")
```

<br/>

### 5.2. 自定义归一化

```python
import unicodedata

def custom_normalizer(text: str) -> str:
    """移除重音并转换为小写。"""
    # 分解带重音的字符
    nfd = unicodedata.normalize('NFD', text)
    # 移除重音标记
    without_accents = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    return without_accents.lower().strip()

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=custom_normalizer
)

# 现在 "café"、"cafe"、"CAFÉ" 都匹配同一模式
```

<br/>

### 5.3. 无归一化

```python
# 精确、区分大小写的匹配
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    normalizer=None  # 或 False
)

# "Python" != "python"（不同的模式）
```

<br/>

## 6. 编码器函数

注意，与 VectorKLEngine 中使用的编码器不同（后者通常将知识对象内容转换为单个文本），这里的编码器函数将每个知识对象转换为代表要在 DAAC 自动机中索引的模式的**字符串列表**。这允许灵活提取每个知识对象的多个可搜索字符串，如同义词、别名或关键词。

### 6.1. 使用同义词（推荐）

```python
# 使用所有同义词作为可搜索字符串
encoder = lambda kl: list(kl.synonyms)

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=encoder
)

# 带有同义词的知识对象
kl = BaseUKF(
    name="Python",
    type="language",
    synonyms=["python", "py", "python3", "Python3"]
)
engine.upsert(kl)

# 所有同义词都将匹配此知识对象
```

<br/>

### 6.2. 组合名称和同义词

```python
# 同时包含名称和同义词
encoder = lambda kl: [kl.name] + list(kl.synonyms or [])

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=encoder
)
```

<br/>

### 6.3. 自定义提取逻辑

```python
# 从元数据或内容提取字符串
def custom_encoder(kl: BaseUKF) -> List[str]:
    strings = [kl.name]
    
    # 添加同义词
    if kl.synonyms:
        strings.extend(kl.synonyms)
    
    # 添加元数据关键词
    if kl.metadata and "keywords" in kl.metadata:
        strings.extend(kl.metadata["keywords"])
    
    # 过滤掉短字符串
    return [s for s in strings if len(s) >= 3]

engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=custom_encoder
)
```

<br/>

## 7. 持久化和状态管理

### 7.1. 自动持久化

```python
# 每次 upsert/remove 后状态自动保存
engine.upsert(kl)  # 立即保存到磁盘
engine.remove(kl_id)  # 立即保存到磁盘

# 在指定路径下创建的文件：
# - synonyms.json：归一化字符串到知识 ID 的映射
# - ac.pkl：序列化的 Aho-Corasick 自动机
# - metadata.json：min_length、inverse 标志和 kl_synonyms 映射
```

<br/>

### 7.2. 加载现有索引

```python
# 初始化时引擎自动加载现有索引
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",  # 现有索引目录
    encoder=lambda kl: list(kl.synonyms)
)
# 如果文件存在，则加载索引；否则创建新索引
```

<br/>

### 7.3. 手动保存和加载

```python
# 手动保存到特定路径
engine.save(path="/backup/daac_index")

# 手动从特定路径加载
engine.load(path="/backup/daac_index")
```

<br/>

### 7.4. 刷新和关闭

```python
# flush：应用延迟删除并重建自动机
engine.flush()

# close：保存状态并清除内存结构
engine.close()
```

<br/>

## 8. 高级特性

### 8.1. 逆序模式（后缀匹配优化）

DAACKLEngine 默认为 `inverse=True`，在反向字符串上构建自动机：

```python
# 默认：在反向字符串上构建自动机
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    inverse=True  # 默认
)

# 这优化了后缀匹配模式
# 查询 "learning machine"，模式 "machine" 反转为 "enihcam"
# 匹配自动重新映射到原始位置
```

由于语言模式的特点，后缀匹配通常更高效，在解决歧义时也往往"更正确"。这种行为对包括中文在内的语言特别有益。

<br/>

### 8.2. 最小长度过滤

```python
# 仅索引 3+ 字符的字符串
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    min_length=3
)

# 像 "py"、"js" 这样的短字符串会被忽略
# 减少自动机大小并避免过度匹配
```

<br/>

### 8.3. 条件索引

```python
# 仅索引特定类型的知识对象
engine = DAACKLEngine(
    storage=store,
    path="/tmp/daac",
    encoder=lambda kl: list(kl.synonyms),
    condition=lambda kl: kl.type in ["language", "framework"]
)

# 其他类型的知识对象被忽略
```

<br/>

### 8.4. 与存储同步

```python
# 在存储外部更改后，同步引擎
store.batch_upsert([kl1, kl2, kl3])  # 在引擎外修改

# 从存储重新索引所有对象
engine.sync()
```

<br/>

## 9. 完整示例

```python
from ahvn.klengine import DAACKLEngine
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF
import tempfile

# 创建数据库存储
store = DatabaseKLStore(provider="sqlite", database=":memory:")

# 填充技术领域实体
entities = [
    BaseUKF(
        name="Python",
        type="programming_language",
        content="High-level programming language",
        synonyms=["python", "py", "python3"],
        metadata={"paradigm": "multi-paradigm"}
    ),
    BaseUKF(
        name="Machine Learning",
        type="field",
        content="Subset of artificial intelligence",
        synonyms=["machine learning", "ml", "ML"],
        metadata={"domain": "ai"}
    ),
    BaseUKF(
        name="Neural Network",
        type="algorithm",
        content="Computing systems inspired by biological neural networks",
        synonyms=["neural network", "neural net", "nn"],
        metadata={"category": "deep_learning"}
    ),
    BaseUKF(
        name="Natural Language Processing",
        type="field",
        content="Interaction between computers and human language",
        synonyms=["nlp", "NLP", "natural language processing"],
        metadata={"domain": "ai"}
    ),
]
store.batch_upsert(entities)

# 使用基于同义词索引创建 DAAC 引擎
with tempfile.TemporaryDirectory() as tmpdir:
    engine = DAACKLEngine(
        storage=store,
        path=tmpdir,
        encoder=lambda kl: list(kl.synonyms),  # 使用所有同义词
        min_length=2,
        normalizer=True,  # 大小写不敏感
        condition=lambda kl: kl.type in ["programming_language", "field", "algorithm"]
    )
    
    # 索引所有实体
    for entity in store:
        engine.upsert(entity)
    engine.flush()
    
    print(f"Indexed {len(engine)} entities")
    
    # 搜索示例
    query = "I'm using Python for NLP and machine learning with neural networks"
    results = engine.search(
        query=query,
        conflict="longest_distinct",
        whole_word=True,
        include=["id", "kl", "matches"]
    )
    
    print(f"\nFound {len(results)} entities in query:")
    for result in results:
        kl = result["kl"]
        matches = result["matches"]
        print(f"- {kl.name} ({kl.type})")
        for start, end in matches:
            matched_text = query[start:end]
            print(f"  → '{matched_text}' at position {start}-{end}")
    
    # 输出：
    # Indexed 4 entities
    #
    # Found 4 entities in query:
    # - Python (programming_language)
    #   → 'Python' at position 11-17
    # - Natural Language Processing (field)
    #   → 'NLP' at position 22-25
    # - Machine Learning (field)
    #   → 'machine learning' at position 30-46
    # - Neural Network (algorithm)
    #   → 'neural networks' at position 52-67
    
    # 清理
    engine.close()
```

<br/>

## 拓展阅读

> **提示：** 有关基本接口和通用功能，请参阅：
> - [BaseKLEngine](./base.md) - 定义 KLEngine 接口和共享功能的抽象基类

> **提示：** 有关互补的搜索引擎，请参阅：
> - [FacetKLEngine](./facet.md) - 使用类 ORM 过滤和 SQL 查询的结构化搜索
> - [VectorKLEngine](./vector.md) - 用于语义检索的向量相似度搜索

> **提示：** 有关与 DAACKLEngine 配合使用的存储后端，请参阅：
> - [KLStore](../klstore/index.md) - 知识对象的存储层
> - [CacheKLStore](../klstore/cache.md) - 基于内存或磁盘的存储
> - [DatabaseKLStore](../klstore/database.md) - 持久化关系型存储

> **提示：** 有关知识对象基础知识，请参阅：
> - [BaseUKF](../ukf/ukf-v1.0.md) - 支持同义词的统一知识格式
> - [UKF 数据类型](../ukf/data-types.md) - UKF 字段的数据类型映射

<br/>
