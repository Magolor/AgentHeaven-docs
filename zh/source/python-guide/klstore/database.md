# DatabaseKLStore

DatabaseKLStore 是一个持久化的 [BaseKLStore](./base.md) 实现,通过 SQLAlchemy ORM 由 SQL 数据库支持。它为知识对象提供符合 ACID 的、可扩展的存储,支持 PostgreSQL、MySQL、SQLite 和 DuckDB。

## 1. 简介

### 1.1. 基于 ORM 的持久化 vs 基于缓存

虽然你可以使用 `CacheKLStore` 配合 `DatabaseCache` 后端进行简单的键值存储,但 **DatabaseKLStore** 提供了真正的关系数据库功能:

**DatabaseKLStore 优势:**
- **结构化模式**: 使用适当的 ORM 实体和外键关系自动创建表
- **维度表**: 复杂的 UKF 字段(元数据、内容数组)存储在具有引用完整性的单独维度表中
- **优化的批量操作**: 使用 SQLAlchemy 的 `bulk_insert_mappings` 进行高效批处理
- **查询就绪**: 为高级 SQL 查询准备数据(与 KLEngine 如 `FacetKLEngine` 一起使用时)

**何时改用 CacheKLStore 配合 DatabaseCache:**
- 无模式要求的简单键值存储(例如,存储非 UKF 对象,或仅用于临时使用而无需检索的 UKF 存储)
- 与其他组件共享缓存基础设施(例如,主要存储 CacheEntry)
- 使用轻量级依赖的最小设置(例如,测试和开发)

<br/>

### 1.2. 多表架构

DatabaseKLStore 使用 ORM 适配器将 BaseUKF 对象映射到关系模式:
- **主表**: 核心 UKF 属性(id、name、type、version 等)
- **维度表**: 复杂字段,带有到主表的外键
- **自动映射**: 由 `ORMUKFAdapter` 处理双向转换

<br/>

## 2. 快速开始

### 2.1. 基本用法

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF

# SQLite(文件存储,最简单)
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")

# PostgreSQL(生产就绪)
store = DatabaseKLStore(
    database="mydb",
    provider="pg",
    host="localhost",
    name="knowledge_store"
)

# 创建并存储知识对象
kl = BaseUKF(name="Python Tutorial", type="documentation", content="Learn Python")
store.upsert(kl)

# 检索它
retrieved = store.get(kl.id)
print(f"Retrieved: {retrieved.name}")
```

所有标准 [BaseKLStore](./base.md) 操作都能无缝工作:`insert()`、`upsert()`、`get()`、`remove()`、`batch_*()`、迭代等。

**自动模式:** 表在首次使用时自动创建 — 无需手动设置模式。

<br/>

### 2.2. 初始化参数

- **`database`**(必需):数据库名称或路径(用于 SQLite/DuckDB)
- **`provider`**(可选):数据库提供商("sqlite"、"pg"、"mysql"、"duckdb");如果省略则使用配置默认值
- **`name`**(可选):KLStore 实例名称(默认:数据库名称)
- **`condition`**(可选):过滤函数,用于有条件地存储对象
- **其他 kwargs**: 连接参数(host、port、username、password 等)

<br/>

## 3. 数据库后端

### 3.1. SQLite — 开发与嵌入式

```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
# 文件存储,零配置,适合原型开发
```

<br/>

### 3.2. PostgreSQL — 生产

```python
store = DatabaseKLStore(
    database="knowledge_db",
    provider="pg",
    host="localhost",
    port=5432,
    username="user",
    password="pass"
)
# 生产就绪,并发访问,高级功能
```

<br/>

### 3.3. DuckDB — 分析

```python
store = DatabaseKLStore(database="knowledge.duckdb", provider="duckdb")
# 文件存储,针对分析查询优化,快速聚合
```

<br/>

### 3.4. MySQL — 通用

```python
store = DatabaseKLStore(
    database="knowledge_db",
    provider="mysql",
    host="localhost"
)
# 成熟的生态系统,广泛支持
```

<br/>

## 4. 数据库特定功能

### 4.1. 自动事务

所有操作都包装在事务中,具有自动提交/回滚:

```python
# 自动事务管理
try:
    store.upsert(kl1)
    store.batch_insert([kl2, kl3])
    # 成功时自动提交
except Exception as e:
    # 失败时自动回滚
    print(f"Transaction rolled back: {e}")
```

<br/>

### 4.2. 模式自动创建

表在首次使用时自动创建:

```python
store = DatabaseKLStore(database="knowledge.db", provider="sqlite")
# 创建主表 + 维度表,带有适当的外键
```

<br/>

### 4.3. 清除和关闭

```python
# 删除所有知识对象
store.clear()

# 关闭数据库连接
store.close()
```

<br/>

## 5. 完整示例

```python
from ahvn.klstore import DatabaseKLStore
from ahvn.ukf import BaseUKF

# 使用 PostgreSQL 初始化
store = DatabaseKLStore(
    database="knowledge_db",
    provider="pg",
    host="localhost",
    name="research_papers",
    condition=lambda kl: kl.type == "research_paper"
)

# 创建知识对象
papers = [
    BaseUKF(
        name="Neural Networks Intro",
        type="research_paper",
        content="Deep learning fundamentals...",
        metadata={"year": 2024, "citations": 150}
    ),
    BaseUKF(
        name="Transformer Architecture",
        type="research_paper",
        content="Attention is all you need...",
        metadata={"year": 2017, "citations": 50000}
    ),
    BaseUKF(
        name="Random Blog Post",
        type="blog_post",  # 被条件过滤掉
        content="Some content..."
    )
]

# 批量插入(blog_post 被过滤掉)
store.batch_upsert(papers)

# 查询
print(f"Total papers: {len(store)}")  # 2
for paper in store:
    print(f"- {paper.name} ({paper.metadata.get('year')})")

# 更新
paper = store.get(papers[0].id)
store.upsert(paper.clone(metadata={**paper.metadata, "citations": 200}))

# 清理
store.close()
```

<br/>

## 拓展阅读

> **提示:** 查看接口和通用操作:
> - [BaseKLStore](./base.md) - 定义 KLStore 接口和共享功能的抽象基类

> **提示:** 查看数据库实用工具和配置:
> - [Database Utilities](../utils/db.md) - 数据库连接、查询执行和实用工具
> - [Database Configuration](../../configuration/database.md) - 数据库提供商的 YAML 配置

> **提示:** 查看其他 KLStore 实现:
> - [CacheKLStore](./cache.md) - 具有多种后端选项的轻量级缓存存储
> - [VectorKLStore](./vector.md) - 用于语义相似性搜索的向量数据库存储
> - [CascadeKLStore](./cascade.md) - 基于自定义标准的多层存储路由

> **提示:** 对于使用 SQL 查询的知识检索:
> - [FacetKLEngine](../klengine/facet.md) - 关系数据库上的分面检索和过滤
> - [KLEngine](../klengine/index.md) - 构建在 KLStore 之上的查询引擎

<br/>
