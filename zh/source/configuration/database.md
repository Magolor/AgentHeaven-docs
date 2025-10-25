# 数据库配置

AgentHeaven 提供了一个全面且灵活的数据库配置系统，允许你轻松管理和切换不同的数据库后端、提供商和配置。本指南涵盖数据库配置的所有方面，从基本设置到高级自定义。

## 1. 配置结构

AgentHeaven 使用 [SQLAlchemy](https://www.sqlalchemy.org/) 作为通用数据库接口。AgentHeaven 中的数据库配置故意设计得小巧且分层，这样你可以分离关注点并在不更改代码的情况下交换实现。配置由三个协作部分组成：

- **提供商 (Provider)**：包含连接参数、身份验证和提供商特定设置（数据库、主机、端口、凭据）。提供商告诉系统如何连接到特定的数据库服务。
- **数据库 (Database)**：确定在提供商内连接到哪个数据库的特定数据库名称或文件路径。
- **后端配置 (Backend Configuration)**：额外的 SQLAlchemy 引擎参数，如连接池、超时和自动创建设置。

在运行时，这些层级在级联中解析（显式覆盖 → 提供商 → 默认值）以产生最终的 SQLAlchemy URL 和引擎配置。这使得在保持代码简单的同时，轻松交换数据库后端、更改连接参数并为不同环境维护单独配置变得容易。

<br/>

## 2. 提供商配置

AgentHeaven 中的数据库提供商遵循 [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) 格式，并在运行时自动编译为连接 URL。理解这种格式是配置任何数据库后端的关键。

所有数据库连接都使用标准的 [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) 格式：
```
<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
```

AgentHeaven 自动从你的提供商配置构建这些 URL。以下是每个组件的映射方式：

- **dialect**：数据库类型（例如 `postgresql`、`mysql`、`sqlite`）。
- **driver**：Python 驱动程序库（例如 `psycopg2`、`pymysql`）。
- **username**：数据库用户名。
- **password**：数据库密码。
- **host**：数据库服务器主机名或 IP。
- **port**：数据库服务器端口。
- **database**：数据库名称或文件路径（这通常在应用程序代码中动态指定）。

所有其他参数都成为 SQLAlchemy `create_engine` 参数。

默认配置示例：
```yaml
db:
    # SQLAlchemy 兼容格式：
    #   <dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
    default_provider: sqlite
    providers:
        sqlite:
            dialect: sqlite
            database: ":memory:"
        duckdb:
            dialect: duckdb
            database: ":memory:"
        pg:
            dialect: postgresql
            driver: psycopg2
            host: "localhost"
            port: 5432
            username: "${whoami}"
        mysql:
            dialect: mysql
            driver: pymysql
            host: "localhost"
            port: 3306
            username: "root"
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中配置的更多信息，请参见：
> - [核心配置](../configuration/core.md) - 核心配置概念
> - [LLM 配置](../configuration/llm.md) - 具体的 LLM 配置选项
> - [向量数据库配置](./vdb.md) - 向量数据库连接和存储配置
> - [配置管理](../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

<br/>
