# Database Configuration

AgentHeaven provides a comprehensive and flexible database configuration system that allows you to easily manage and switch between different database backends, providers, and configurations. This guide covers all aspects of database configuration, from basic setup to advanced customization.

## 1. Config Structure

AgentHeaven uses [SQLAlchemy](https://www.sqlalchemy.org/) as the universal database interface. Database configuration in AgentHeaven is intentionally small and layered so you can separate concerns and swap implementations without changing code. The configuration is composed from three cooperating pieces:

- **Provider**: Contains connection parameters, authentication, and provider-specific settings (database, host, port, credentials). The provider tells the system how to connect to a specific database service.
- **Database**: A specific database name or file path that determines which database to connect to within a provider.
- **Backend Configuration**: Additional SQLAlchemy engine parameters like connection pooling, timeouts, and auto-creation settings.

At runtime these layers are resolved in a cascade (explicit overrides → provider → defaults) to produce the final SQLAlchemy URL and engine configuration. This makes it easy to swap database backends, change connection parameters, and maintain separate configurations for different environments while keeping code simple.

<br/>

## 2. Provider Configuration

Database providers in AgentHeaven follow the [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) format and are automatically compiled into connection URLs at runtime. Understanding this format is key to configuring any database backend.

All database connections use the standard [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) format:
```
<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
```

AgentHeaven automatically builds these URLs from your provider configuration. Here's how each component maps:

- **dialect**: The database type (e.g., `postgresql`, `mysql`, `sqlite`).
- **driver**: The Python driver library (e.g., `psycopg2`, `pymysql`).
- **username**: Database username.
- **password**: Database password.
- **host**: Database server hostname or IP.
- **port**: Database server port.
- **database**: Database name or file path (this is often specified on-the-fly in application code).

All other parameters become SQLAlchemy `create_engine` parameters.

Default config example:
```yaml
db:
    # SQLAlchemy compatible format:
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

## Further Exploration

> **Tip:** For more information about configuration in AgentHeaven, see:
> - [Core Configuration](../configuration/core.md) - Core configuration concepts
> - [LLM Configuration](../configuration/llm.md) - Specific LLM configuration options
> - [Vector Database Configuration](./vdb.md) - Vector Database connection and storage configuration
> - [Configuration Management](../python-guide/utils/basic/config_utils.md) - Utilities for managing configurations in Python

<br/>
