# Database Utilities

This guide shows how to interact with databases in AgentHeaven using the unified Database interface with SQLAlchemy backend and YAML configuration support.

## 1. Database Architecture

AgentHeaven provides a universal database connector built on [SQLAlchemy](https://www.sqlalchemy.org/) that offers a clean, intuitive interface for database operations across different providers, and uses fallback to SQL queries with [SQLGlot](https://sqlglot.com/) SQL transpilation for robustness. The Database class uses YAML configuration for connection management and supports multiple database backends.

**Currently tested backends:**
- PostgreSQL
- MySQL
- DuckDB
- SQLite

Similar to `LLM`, the `Database` should be used as instances, which, in normal circumstances store only the config/parameters to connect to a database, and not the connection itself.

All database connections use the standard [SQLAlchemy URLs](https://docs.sqlalchemy.org/en/20/core/engines.html) format:
```
<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
```

To create a Database instance, provide the `provider` name defined in your YAML config along with any connection parameters (recommended), or manually specify all connection parameters directly.

```python
from ahvn.utils.db import Database

# Create database instances using YAML configuration
db = Database(provider="sqlite", database=":memory:")
pg_db = Database(provider="pg", database="mydb") 
```

> **Tip:** AgentHeaven resolves these provider entries at runtime through `resolve_db_config` with defaults from the YAML config. For detailed configuration options, see the [Database Configuration](../../configuration/database.md) guide.

<br/>

## 2. Database Connection

### 2.1. Basic Connection

Use `connect()` to start a persistent database connection, and use `close()` to end it.

```python
from ahvn.utils.db import Database

# Initialize with immediate connection
db = Database(provider="sqlite", database="test.db", connect=True)

# Or connect later
db = Database(provider="sqlite", database="test.db")
db.connect()

# Check connection status
if db.connected:
    print("Database is connected")

# Close connection
db.close(commit=False)
```

Notice the transaction handling behavior during close: by default, `commit=True`, so transactions will be committed by default. When setting `commit=False`, transactions will be rolled back instead.

During connection, use `db.conn` as a property to access the connection object.

<br/>

### 2.2. Context Manager (Recommended)

The Database class supports context manager usage for automatic transaction handling:

```python
# Automatic transaction management
db = Database(provider="sqlite", database="test.db")
with db:
    db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Alice"})
    db.execute("UPDATE users SET active = TRUE WHERE name = :name", params={"name": "Alice"})
    # Automatically commits on success, rolls back on exception
```

It automatically runs `commit()` on success, and `rollback()` on exception when exiting the context manager.

<br/>

### 2.3. Manual Transaction Control
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

## 3. SQL Execution

### 3.1. Raw SQL Execution
The `execute` method handles raw SQL queries with parameter binding:

```python
# Simple query
result = db.execute("SELECT * FROM users")
rows = list(result.fetchall())

# Parameterized query with named parameters
result = db.execute("SELECT * FROM users WHERE id = :id", params={"id": 1})

# Insert with parameters
db.execute("INSERT INTO users (name, email) VALUES (:name, :email)", 
          params={"name": "Alice", "email": "alice@example.com"}, 
          autocommit=True)

# Reserved transpilation flag — planned for future cross-dialect support
result = db.execute("SELECT * FROM users LIMIT 10", transpile="postgresql")
```

> **Note:** The `transpile` argument is currently reserved. The runtime ignores it today but keeps the placeholder for upcoming SQL dialect conversions.

<br/>

### 3.2. SQLAlchemy ORM Execution
For SQLAlchemy ORM operations, use the `orm_execute` method:

```python
from sqlalchemy import select, insert, update, delete
from sqlalchemy.sql import text

# Select statement
stmt = select(users_table).where(users_table.c.id == 1)
result = db.orm_execute(stmt)

# Insert statement
stmt = insert(users_table).values(name="Alice", email="alice@example.com")
db.orm_execute(stmt, autocommit=True)

# Update statement
stmt = update(users_table).where(users_table.c.id == 1).values(name="Bob")
db.orm_execute(stmt, autocommit=True)

# Delete statement
stmt = delete(users_table).where(users_table.c.id == 1)
db.orm_execute(stmt, autocommit=True)
```

<br/>

### 3.3. Auto-Commit

The `execute` and `orm_execute` methods accept an `autocommit` flag. When `autocommit=True`, AgentHeaven executes the statement and commits it immediately while keeping the connection open for subsequent work. This is convenient for one-off DDL/DML operations that should not depend on an outer transaction.

Specifically, when setting `autocommit=True`:
- If there is an active connection with a pending transaction outside a context manager, that transaction is committed first to ensure a clean state.
- The statement is executed using the active connection (opening one if needed).
- The statement is committed immediately after execution.
- The connection remains open and ready for reuse.
- If currently inside a context manager (of the same db), attempting to use autocommit mode will raise a `DatabaseError`.

Notice that when the SQL fails on an active connection with a transaction, the entire transaction will be rolled back. Therefore, it is generally not recommended to use autocommit together with any active transaction. If you need an operation that always commits independently, call `execute(..., autocommit=True)` on a separate `Database` instance (make sure your database backend supports parallelism) or outside of `with db:` blocks.

Examples:
```python
# One-off commit (safe outside a context manager, and preferably outside any transactions)
db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Alice"}, autocommit=True)

# Inside a context manager: do NOT use autocommit=True
with db:
    # WRONG: this will raise DatabaseError
    # db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Bob"}, autocommit=True)

    # Correct: use autocommit=False (default) and let context manager commit on exit
    db.execute("INSERT INTO users (name) VALUES (:name)", params={"name": "Bob"}, autocommit=False)
    # No need to call db.commit() - the context manager handles it
```

<br/>


### 3.4. SQLResponse Class

The `Database`'s `execute` functions by default return a `SQLResponse` object for query statements. The `SQLResponse` class is an enhanced wrapper around SQLAlchemy's `CursorResult` that provides convenient data access methods. 

#### 3.4.1. Basic Usage

```python
result = db.execute("SELECT id, name, email FROM users")

# Access result properties
print(f"Columns: {result.columns}")
print(f"Row count: {result.row_count}")
print(f"Last row ID: {result.lastrowid}")

# Fetch data as generator of dictionaries
for row in result.fetchall():
    print(f"User: {row['name']} ({row['email']})")
```

<br/>

#### 3.4.2. Data Access Methods

```python
result = db.execute("SELECT id, name, email FROM users LIMIT 5")

# Index-based access
first_row = result[0]           # First row as dict
first_three = result[:3]        # First 3 rows as list
column_data = result[:, "name"] # All names as list
single_cell = result[0, "name"] # First user's name

# Convert to different formats
dict_list = result.to_list(row_fmt="dict")   # List of dictionaries
tuple_list = result.to_list(row_fmt="tuple") # List of tuples

# Get length
total_rows = len(result)
```

<br/>

#### 3.4.3. Resource Management
```python
result = db.execute("SELECT * FROM large_table")
# ... process data ...
result.close()  # Explicitly close the cursor
```

<br/>

## 4. Utilities

### 4.1. Implementation

The Database class implements a dual-approach system:

1. **Primary SQLAlchemy Interface**: Uses SQLAlchemy's reflection and inspection APIs for database metadata operations.
2. **SQL Fallback**: Falls back to raw SQL queries when SQLAlchemy operations fail or are not supported. It first attempts to find built-in SQLs in `resources` that is guaranteed to be correct, then attempts to use SQLGlot upon missing dialects.

This approach prioritizes the robust ORM approach provided by SQLAlchemy, and ensures maximum compatibility across different database backends through built-in SQLs or SQLGlot transpilation.

Here is the pseudo code of the implementaiton of utilities:

```python
# Pseudo-code example of automatic fallback in action
def db_tabs(self) -> List[str]:
    try:
        # Try SQLAlchemy inspection first
        inspector = inspect(self.engine)
        return inspector.get_table_names()
    except Exception:
        # Fall back to raw SQL
        result = self.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row["name"] for row in result.fetchall()]
```

### 4.2. Database Inspection

#### 4.2.1. Table Information
```python
# Get all table names
tables = db.db_tabs()
print(f"Tables: {tables}")

# Get all view names  
views = db.db_views()
print(f"Views: {views}")
```

<br/>

#### 4.2.2. Column Information
```python
# Get column names for a table
columns = db.tab_cols("users")
print(f"User columns: {columns}")

# Get primary key columns
primary_keys = db.tab_pks("users")
print(f"Primary keys: {primary_keys}")

# Get foreign key information
foreign_keys = db.tab_fks("orders")
for fk in foreign_keys:
    print(f"FK: {fk['col_name']} -> {fk['tab_ref']}.{fk['col_ref']}")

# Get column type
column_type = db.col_type("users", "created_at")
print(f"created_at type: {column_type}")
```

<br/>

### 4.3. Data Analysis

#### 4.3.1. Row Counting
```python
# Get total row count for a table
count = db.row_count("users")
print(f"Total users: {count}")
```

<br/>

#### 4.3.2. Column Values
```python
# Get distinct values in a column
distinct_statuses = db.col_distincts("users", "status")
print(f"User statuses: {distinct_statuses}")

# Get all values (including duplicates)
all_names = db.col_enums("users", "name")
print(f"All user names: {all_names}")

# Get non-null values only
active_emails = db.col_nonnulls("users", "email")
print(f"Active email addresses: {active_emails}")
```

<br/>

#### 4.3.3. Frequencies

```python
# Get value frequencies for a column
status_frequencies = db.col_freqs("users", "status")
for freq in status_frequencies:
    print(f"{freq['value']}: {freq['count']} users")

# Get top K most frequent values
top_domains = db.col_freqk("users", "email_domain", k=5)
for domain in top_domains:
    print(f"{domain['value']}: {domain['count']} users")
```

<br/>

### 4.4. Data Manipulation

Notice that all data manipulation utilities commit any pending transaction before they run **only when the database is not currently inside a context manager**, ensuring `with db:` blocks keep full control of their own transactions.

#### 4.4.1. Clear Table Data

```python
# Remove all rows from a table (keeps structure)
db.clear_tab("temp_data")
print("All temp data cleared")
```

<br/>

#### 4.4.2. Drop Objects

```python
# Drop a table completely
db.drop_tab("old_table")

# Drop a view
db.drop_view("old_view")

# Clear all data from all tables
db.clear()
```

<br/>

#### 4.4.3. Reset

```python
# Drop the entire database
db.drop()

# Reinitialize the database
# This is achieved by dropping the database and starting a new connection
db.init(connect=True)
```

<br/>

## 5. Result Display

AgentHeaven uses the `prettytable` package to visualize tables (for both humans and LLMs).

### 5.1. Table Formatting

The `table_display` function provides formatted output for query results:

```python
from ahvn.utils.db import table_display

# Display query results
result = db.execute("SELECT id, name, email, created_at FROM users")
print(table_display(result, max_rows=10, style="MARKDOWN"))

# Display with custom schema
data = [
    {"name": "Alice", "age": 30, "city": "New York"},
    {"name": "Bob", "age": 25, "city": "London"},
]
print(table_display(data, schema=["name", "age", "city"], style="SINGLE_BORDER"))
```

<br/>

### 5.2. Display Options
```python
# Various display styles
styles = ["DEFAULT", "MARKDOWN", "PLAIN_COLUMNS", "MSWORD_FRIENDLY", 
          "ORGMODE", "SINGLE_BORDER", "DOUBLE_BORDER"]

for style in styles:
    print(f"\n{style} Style:")
    print(table_display(result, max_rows=5, style=style))
```

<br/>

## 6. Type Adapters for UKF

AgentHeaven uses a powerful type adapter system to bridge the gap between the abstract **Unified Knowledge Format (UKF)** types and the concrete data types of different database backends. This allows developers to work with consistent UKF types (e.g., `UKFIdType`, `UKFJsonType`) across their application, while AgentHeaven automatically handles the mapping to appropriate SQL types (e.g., `VARCHAR`, `JSONB`, `TEXT`) for the specific database in use.

### 6.1. Architecture

As explained in the [main architecture guide](../../introduction/architecture.md), every field in a `BaseUKF` schema is associated with a **UKF Type**. The database utility leverages a set of custom SQLAlchemy `TypeDecorator` classes to map these UKF types to backend-specific SQL types.

For example, `DatabaseJsonType` is a custom type decorator that:
- Maps to `JSONB` on PostgreSQL for native JSON support.
- Maps to `TEXT` on SQLite and MySQL, storing the data as a JSON string.

> **Note:** MySQL and Microsoft SQL have JSON types, but they do not faithfully preserve very large integers during JSON serialization (e.g. >53 bits or MySQL's 64-bit limits). To avoid silent precision loss we treat them as string-backed JSON below.

This mapping is handled transparently by the `Database` class and SQLAlchemy, ensuring that developers can write portable code without worrying about backend-specific implementation details.

> **Tip:** For more details about built-in type adapters, see [UKF Data Types](../ukf/data-types.md).

<br/>

### 6.2. Built-in Type Adapters

AgentHeaven provides several built-in type adapters in `ahvn.utils.db.types`:

- **`DatabaseIdType`**: Represents a UKF ID, typically stored as a `VARCHAR`.
- **`DatabaseTextType`**: For general-purpose text.
- **`DatabaseIntegerType`**: For integer values.
- **`DatabaseBooleanType`**: For boolean flags.
- **`DatabaseTimestampType`**: Handles timezone-aware timestamps, storing them as native `TIMESTAMP` types where supported (e.g., PostgreSQL) or as `BigInteger` (Unix timestamp) for others (e.g., SQLite).
- **`DatabaseJsonType`**: A versatile type for storing JSON data, with automatic adaptation for native `JSON`/`JSONB` or `TEXT` fallback.
- **`DatabaseVectorType`**: Specifically for vector embeddings. It uses native array types on backends with `pgvector` support (PostgreSQL) and falls back to JSON storage on others.

These adapters are used when defining ORM models that inherit from `ExportableEntity`, ensuring that UKF data is stored efficiently and correctly across different database systems.

> **Tip:** For more details about built-in type adapters, see [UKF Data Types](../ukf/data-types.md).

<br/>

## Further Exploration

> **Tip:** For more information about database configuration in AgentHeaven, see:
> - [Database Configuration](../../configuration/database.md) - Relational Database connection and storage configuration

> **Tip:** For related functionality, see:
> - [UKF Data Types](../ukf/data-types.md) - Data type mappings between UKF, Pydantic, and various databases
> - [Cache](../cache.md) - Cache system implementation and usage
> - [DatabaseKLStore](../klstore/database.md) - KLStore backed by relational databases
> - [FacetKLEngine](../klengine/facet.md) - Knowledge retrieval engine using faceted search on relational databases

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
