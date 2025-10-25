# 数据库工具

本指南展示如何在 AgentHeaven 中使用基于 SQLAlchemy 后端和 YAML 配置支持的统一 Database 接口与数据库进行交互。

## 1. 数据库架构

AgentHeaven 提供了一个基于 [SQLAlchemy](https://www.sqlalchemy.org/) 的通用数据库连接器，为跨不同供应商的数据库操作提供了清晰直观的接口，并使用 [SQLGlot](https://sqlglot.com/) SQL 转译作为回退以提高健壮性。Database 类使用 YAML 配置进行连接管理，并支持多个数据库后端。

**当前已测试的后端：**
- PostgreSQL
- MySQL
- DuckDB
- SQLite

与 `LLM` 类似，`Database` 应作为实例使用，在正常情况下仅存储连接数据库的配置/参数，而不存储连接本身。

所有数据库连接使用标准的 [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) 格式：
```
<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
```

要创建 Database 实例，提供 YAML 配置中定义的 `provider` 名称以及任何连接参数（推荐），或手动直接指定所有连接参数。

```python
from ahvn.utils.db import Database

# 使用 YAML 配置创建数据库实例
db = Database(provider="sqlite", database=":memory:")
pg_db = Database(provider="pg", database="mydb") 
```

> **提示：** AgentHeaven 在运行时通过 `resolve_db_config` 解析这些提供商条目，默认值来自 YAML 配置。有关详细的配置选项，请参阅[数据库配置](../../configuration/database.md)指南。

<br/>

## 2. 数据库连接

### 2.1. 基本连接

使用 `connect()` 启动持久数据库连接，使用 `close()` 结束连接。

```python
from ahvn.utils.db import Database

# 初始化并立即连接
db = Database(provider="sqlite", database="test.db", connect=True)

# 或稍后连接
db = Database(provider="sqlite", database="test.db")
db.connect()

# 检查连接状态
if db.connected:
    print("数据库已连接")

# 关闭连接
db.close(commit=False)
```

注意关闭时的事务处理行为：默认 `commit=True`，因此事务默认会被提交。当设置 `commit=False` 时，事务将被回滚。

在连接期间，使用 `db.conn` 属性访问连接对象。

<br/>

### 2.2. 上下文管理器（推荐）

Database 类支持上下文管理器用法以实现自动事务处理：

```python
# 自动事务管理
db = Database(provider="sqlite", database="test.db")
with db:
    db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Alice"})
    db.execute("UPDATE users SET active = TRUE WHERE name = :name", params={"name": "Alice"})
    # 成功时自动提交，发生异常时自动回滚
```

退出上下文管理器时，成功时自动运行 `commit()`，发生异常时自动运行 `rollback()`。

<br/>

### 2.3. 手动事务控制
```python
db = Database(provider="sqlite", database="test.db")
try:
    db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Bob"}, autocommit=False)
    db.execute("UPDATE users SET active = TRUE WHERE name = :name", params={"name": "Bob"}, autocommit=False)
    db.commit()
except Exception:
    db.rollback()
finally:
    db.close()
```

<br/>

## 3. SQL 执行

### 3.1. 原始 SQL 执行
`execute` 方法处理带参数绑定的原始 SQL 查询：

```python
# 简单查询
result = db.execute("SELECT * FROM users")
rows = list(result.fetchall())

# 带命名参数的参数化查询
result = db.execute("SELECT * FROM users WHERE id = :id", params={"id": 1})

# 带参数的插入
db.execute("INSERT INTO users (name, email) VALUES (:name, :email)", 
          params={"name": "Alice", "email": "alice@example.com"}, 
          autocommit=True)

# 保留的转译标志 — 计划用于未来的跨方言支持
result = db.execute("SELECT * FROM users LIMIT 10", transpile="postgresql")
```

> **注意：** `transpile` 参数目前是保留的。运行时目前会忽略它，但保留此占位符以备即将推出的 SQL 方言转换功能。

<br/>

### 3.2. SQLAlchemy ORM 执行
对于 SQLAlchemy ORM 操作，使用 `orm_execute` 方法：

```python
from sqlalchemy import select, insert, update, delete
from sqlalchemy.sql import text

# Select 语句
stmt = select(users_table).where(users_table.c.id == 1)
result = db.orm_execute(stmt)

# Insert 语句
stmt = insert(users_table).values(name="Alice", email="alice@example.com")
db.orm_execute(stmt, autocommit=True)

# Update 语句
stmt = update(users_table).where(users_table.c.id == 1).values(name="Bob")
db.orm_execute(stmt, autocommit=True)

# Delete 语句
stmt = delete(users_table).where(users_table.c.id == 1)
db.orm_execute(stmt, autocommit=True)
```

<br/>

### 3.3. 自动提交

`execute` 和 `orm_execute` 方法接受 `autocommit` 标志。当 `autocommit=True` 时，AgentHeaven 执行语句并立即提交，同时保持连接打开以便后续工作。这对于不应依赖外部事务的一次性 DDL/DML 操作很方便。

具体来说，当设置 `autocommit=True` 时：
- 如果在上下文管理器外有活动连接且有待处理事务，该事务会首先被提交以确保干净的状态。
- 使用活动连接执行语句（如需要会打开连接）。
- 执行后立即提交语句。
- 连接保持打开状态并可供重用。
- 如果当前在上下文管理器内（同一个 db），尝试使用 autocommit 模式将引发 `DatabaseError`。

注意，当 SQL 在有事务的活动连接上失败时，整个事务将被回滚。因此，通常不建议将 autocommit 与任何活动事务一起使用。如果需要始终独立提交的操作，应在单独的 `Database` 实例上调用 `execute(..., autocommit=True)`（确保您的数据库后端支持并行）或在 `with db:` 块之外调用。

示例：
```python
# 一次性提交（在上下文管理器外安全，最好在任何事务外）
db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Alice"}, autocommit=True)

# 在上下文管理器内：不要使用 autocommit=True
with db:
    # 错误：这将引发 DatabaseError
    # db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Bob"}, autocommit=True)

    # 正确：使用 autocommit=False（默认）并让上下文管理器在退出时提交
    db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Bob"}, autocommit=False)
    # 无需调用 db.commit() - 上下文管理器会处理
```

<br/>


### 3.4. SQLResponse 类

`Database` 的 `execute` 函数默认为查询语句返回 `SQLResponse` 对象。`SQLResponse` 类是对 SQLAlchemy 的 `CursorResult` 的增强封装，提供了方便的数据访问方法。

#### 3.4.1. 基本用法

```python
result = db.execute("SELECT id, name, email FROM users")

# 访问结果属性
print(f"Columns: {result.columns}")
print(f"Row count: {result.row_count}")
print(f"Last row ID: {result.lastrowid}")

# 以字典生成器的形式获取数据
for row in result.fetchall():
    print(f"User: {row['name']} ({row['email']})")
```

<br/>

#### 3.4.2. 数据访问方法

```python
result = db.execute("SELECT id, name, email FROM users LIMIT 5")

# 基于索引的访问
first_row = result[0]           # 第一行作为字典
first_three = result[:3]        # 前 3 行作为列表
column_data = result[:, "name"] # 所有姓名作为列表
single_cell = result[0, "name"] # 第一个用户的姓名

# 转换为不同格式
dict_list = result.to_list(row_fmt="dict")   # 字典列表
tuple_list = result.to_list(row_fmt="tuple") # 元组列表

# 获取长度
total_rows = len(result)
```

<br/>

#### 3.4.3. 资源管理
```python
result = db.execute("SELECT * FROM large_table")
# ... 处理数据 ...
result.close()  # 显式关闭游标
```

<br/>

## 4. 实用工具

### 4.1. 实现

Database 类实现了双路径系统：

1. **主 SQLAlchemy 接口**：使用 SQLAlchemy 的反射和检查 API 进行数据库元数据操作。
2. **SQL 回退**：当 SQLAlchemy 操作失败或不受支持时，回退到原始 SQL 查询。首先尝试在 `resources` 中查找保证正确的内置 SQL，然后在缺少方言时尝试使用 SQLGlot。

这种方法优先使用 SQLAlchemy 提供的强大 ORM 方法，并通过内置 SQL 或 SQLGlot 转译确保跨不同数据库后端的最大兼容性。

以下是实用工具实现的伪代码：

```python
# 自动回退的伪代码示例
def db_tabs(self) -> List[str]:
    try:
        # 首先尝试 SQLAlchemy 检查
        inspector = inspect(self.engine)
        return inspector.get_table_names()
    except Exception:
        # 回退到原始 SQL
        result = self.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row["name"] for row in result.fetchall()]
```

### 4.2. 数据库检查

#### 4.2.1. 表信息
```python
# 获取所有表名
tables = db.db_tabs()
print(f"Tables: {tables}")

# 获取所有视图名
views = db.db_views()
print(f"Views: {views}")
```

<br/>

#### 4.2.2. 列信息
```python
# 获取表的列名
columns = db.tab_cols("users")
print(f"User columns: {columns}")

# 获取主键列
primary_keys = db.tab_pks("users")
print(f"Primary keys: {primary_keys}")

# 获取外键信息
foreign_keys = db.tab_fks("orders")
for fk in foreign_keys:
    print(f"FK: {fk['col_name']} -> {fk['tab_ref']}.{fk['col_ref']}")

# 获取列类型
column_type = db.col_type("users", "created_at")
print(f"created_at type: {column_type}")
```

<br/>

### 4.3. 数据分析

#### 4.3.1. 行计数
```python
# 获取表的总行数
count = db.row_count("users")
print(f"Total users: {count}")
```

<br/>

#### 4.3.2. 列值
```python
# 获取某列的不重复值
distinct_statuses = db.col_distincts("users", "status")
print(f"User statuses: {distinct_statuses}")

# 获取某列的所有值（包含重复）
all_names = db.col_enums("users", "name")
print(f"All user names: {all_names}")

# 获取非空值
active_emails = db.col_nonnulls("users", "email")
print(f"Active email addresses: {active_emails}")
```

<br/>

#### 4.3.3. 频率统计

```python
# 获取列值频率
status_frequencies = db.col_freqs("users", "status")
for freq in status_frequencies:
    print(f"{freq['value']}: {freq['count']} users")

# 获取出现频率最高的前 K 个值
top_domains = db.col_freqk("users", "email_domain", k=5)
for domain in top_domains:
    print(f"{domain['value']}: {domain['count']} users")
```

<br/>

### 4.4. 数据操作

注意，所有数据操作实用工具在运行前会提交任何待处理的事务，**仅当数据库当前不在上下文管理器内时**，确保 `with db:` 块保持对自己事务的完全控制。

#### 4.4.1. 清空表数据

```python
# 从表中删除所有行（保留结构）
db.clear_tab("temp_data")
print("All temp data cleared")
```

<br/>

#### 4.4.2. 删除对象

```python
# 完全删除表
db.drop_tab("old_table")

# 删除视图
db.drop_view("old_view")

# 清空所有表的所有数据
db.clear()
```

<br/>

#### 4.4.3. 重置

```python
# 删除整个数据库
db.drop()

# 重新初始化数据库
# 这通过删除数据库并启动新连接来实现
db.init(connect=True)
```

<br/>

## 5. 结果展示

AgentHeaven 使用 `prettytable` 包来可视化表格（供人类和 LLM 使用）。

### 5.1. 表格格式化

`table_display` 函数提供了查询结果的格式化输出：

```python
from ahvn.utils.db import table_display

# 显示查询结果
result = db.execute("SELECT id, name, email, created_at FROM users")
print(table_display(result, max_rows=10, style="MARKDOWN"))

# 使用自定义模式显示
data = [
    {"name": "Alice", "age": 30, "city": "New York"},
    {"name": "Bob", "age": 25, "city": "London"},
]
print(table_display(data, schema=["name", "age", "city"], style="SINGLE_BORDER"))
```

<br/>

### 5.2. 显示选项
```python
# 不同显示样式
styles = ["DEFAULT", "MARKDOWN", "PLAIN_COLUMNS", "MSWORD_FRIENDLY", 
          "ORGMODE", "SINGLE_BORDER", "DOUBLE_BORDER"]

for style in styles:
    print(f"\n{style} Style:")
    print(table_display(result, max_rows=5, style=style))
```

<br/>

## 6. UKF 类型适配器

AgentHeaven 使用强大的类型适配器系统来弥合抽象的**统一知识格式（UKF）**类型与不同数据库后端的具体数据类型之间的差距。这使开发者可以在整个应用程序中使用一致的 UKF 类型（例如 `UKFIdType`、`UKFJsonType`），而 AgentHeaven 会自动处理到特定数据库的适当 SQL 类型（例如 `VARCHAR`、`JSONB`、`TEXT`）的映射。

### 6.1. 架构

如[主架构指南](../../introduction/architecture.md)中所述，`BaseUKF` 模式中的每个字段都关联一个 **UKF 类型**。数据库实用工具利用一组自定义 SQLAlchemy `TypeDecorator` 类将这些 UKF 类型映射到后端特定的 SQL 类型。

例如，`DatabaseJsonType` 是一个自定义类型装饰器：
- 在 PostgreSQL 上映射到 `JSONB` 以获得原生 JSON 支持。
- 在 SQLite 和 MySQL 上映射到 `TEXT`，将数据存储为 JSON 字符串。

> **注意：** MySQL 和 Microsoft SQL 有 JSON 类型，但它们在 JSON 序列化期间不能忠实保留非常大的整数（例如 >53 位或 MySQL 的 64 位限制）。为了避免静默精度损失，我们在下面将它们视为基于字符串的 JSON。

此映射由 `Database` 类和 SQLAlchemy 透明处理，确保开发者可以编写可移植的代码，而无需担心后端特定的实现细节。

> **提示：** 有关内置类型适配器的更多详细信息，请参阅 [UKF 数据类型](../ukf/data-types.md)。

<br/>

### 6.2. 内置类型适配器

AgentHeaven 在 `ahvn.utils.db.types` 中提供了几个内置类型适配器：

- **`DatabaseIdType`**：表示 UKF ID，通常存储为 `VARCHAR`。
- **`DatabaseTextType`**：用于通用文本。
- **`DatabaseIntegerType`**：用于整数值。
- **`DatabaseBooleanType`**：用于布尔标志。
- **`DatabaseTimestampType`**：处理时区感知时间戳，在支持的地方（例如 PostgreSQL）存储为原生 `TIMESTAMP` 类型，或在其他地方（例如 SQLite）存储为 `BigInteger`（Unix 时间戳）。
- **`DatabaseJsonType`**：用于存储 JSON 数据的通用类型，具有原生 `JSON`/`JSONB` 或 `TEXT` 回退的自动适配。
- **`DatabaseVectorType`**：专门用于向量嵌入。在支持 `pgvector` 的后端（PostgreSQL）上使用原生数组类型，在其他后端上回退到 JSON 存储。

这些适配器在定义继承自 `ExportableEntity` 的 ORM 模型时使用，确保 UKF 数据在不同数据库系统中高效且正确地存储。

> **提示：** 有关内置类型适配器的更多详细信息，请参阅 [UKF 数据类型](../ukf/data-types.md)。

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中数据库配置的更多信息，请参见：
> - [数据库配置](../../configuration/database.md) - 关系数据库连接和存储配置

> **提示：** 相关功能参见：
> - [UKF 数据类型](../ukf/data-types.md) - UKF、Pydantic 和各种数据库之间的数据类型映射
> - [缓存](../cache.md) - 缓存系统实现和使用
> - [DatabaseKLStore](../klstore/database.md) - 由关系数据库支持的知识存储
> - [FacetKLEngine](../klengine/facet.md) - 在关系数据库上使用分面检索的知识检索引擎

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 所有便捷的 Python 实用工具

<br/>
