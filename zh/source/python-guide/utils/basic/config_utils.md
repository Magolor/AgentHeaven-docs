# 配置管理

`config_utils.py` 模块提供了一个全面的配置管理系统，处理跨多个层次（系统、全局和本地）的层次化配置。本指南将逐步介绍如何使用 ConfigManager 类及其工具。

## 1. 入门指南

### 1.1. 基本用法

`config_utils` 提供了 `ConfigManager` 类来处理层次化配置。`ConfigManager` 不仅限于 AgentHeaven 包，继承后也可以用于任何 Python 项目的配置管理。

具体来说，在 AgentHeaven 内部，有一个单例 `HEAVEN_CM = ConfigManager()` 来管理整个包的配置。开始使用配置系统最简单的方法是通过全局配置管理器实例：

```python
from ahvn.utils.basic.config_utils import HEAVEN_CM

# 使用点表示法获取配置值
db_host = HEAVEN_CM.get('core.debug', False)
print(f"调试模式: {'开启' if db_host else '关闭'}")

# 设置配置值
HEAVEN_CM.set('core.debug', True, level='global')
```

虽然 `HEAVEN_CM` 在大多数情况下都很方便，但您也可以创建自定义配置管理器 `cm`：

```python
from ahvn.utils.basic.config_utils import ConfigManager

# 为特定包创建配置管理器
cm = ConfigManager(name="ahvn", package="ahvn")

# 设置本地工作目录（影响本地配置位置）
cm.set_cwd()
```

<br/>

### 1.2. 配置层次结构

`ConfigManager` 使用三层配置系统：

1. **系统配置** (`src/ahvn/resources/configs/default_config.yaml`) - 默认设置
2. **全局配置** (`~/.ahvn/config.yaml`) - 适用于所有项目的全局设置
3. **本地配置** (`$ROOT/.ahvn/config.yaml`) - 项目特定设置

设置会合并，本地值优先于全局值，全局值覆盖系统默认值。

<br/>

## 2. 使用 `ConfigManager`

### 2.1. 初始化

对于新项目或想要重置配置时：

```python
# 初始化本地配置（创建 .ahvn/config.yaml）
success = cm.init(reset=False)
if success:
    print("本地配置已初始化")
else:
    print("本地配置已存在")

# 设置全局配置（创建 ~/.ahvn/config.yaml）
success = cm.setup(reset=False)
if success:
    print("全局配置设置完成")
else:
    print("全局配置已存在")
```

<br/>

### 2.2. 访问值

#### 2.2.1. 基本访问

```python
# 从不同配置级别获取值
system_config = cm.get('core.debug', level='system')  # 系统默认
global_config = cm.get('core.debug', level='global') # 用户全局
local_config = cm.get('core.debug', level='local')   # 项目本地
merged_config = cm.get('core.debug')                 # 合并（本地优先）

# 获取带默认值的配置
debug_mode = cm.get('core.debug', default=False)
```

#### 2.2.2. 嵌套结构

配置系统支持深度嵌套和数组访问：

```python
# 访问嵌套字典
db_config = cm.get('database')
host = cm.get('database.host')
port = cm.get('database.port', 5432)

# 访问数组元素
models = cm.get('llm.models', [])
first_model = cm.get('llm.models[0]')
last_model = cm.get('llm.models[-1]')

# 如果不存在则创建嵌套结构
cm.set('new_section.nested.deep.value', 42)
```

<br/>

### 2.3. 修改值

#### 2.3.1. 设置

```python
# 在不同级别设置值
cm.set('core.debug', True, level='local')    # 项目特定
cm.set('core.debug', False, level='global')  # 全局默认

# 设置嵌套值
cm.set('database.connection.timeout', 30, level='local')

# 设置数组值
cm.set('llm.models[0]', 'gpt-4', level='local')
cm.set('llm.models[-1]', 'claude-3', level='local')  # 追加到末尾
```

<br/>

#### 2.3.2. 取消设置

```python
# 删除配置值
cm.unset('core.debug', level='local')
cm.unset('database.connection.timeout', level='global')

# 删除数组元素
cm.unset('llm.models[0]', level='local')
```

<br/>

### 2.4. 配置文件

#### 2.4.1. 加载和保存

```python
# 从文件加载配置
cm.load()

# 保存特定级别
cm.save(level='local')    # 仅保存本地配置
cm.save(level='global')   # 仅保存全局配置
cm.save()                 # 保存本地和全局

# 强制重新加载
cm.load()
```

<br/>

#### 2.4.2. 路径

```python
# 获取配置文件路径
local_path = cm.local_config_path      # $ROOT/.ahvn/config.yaml
global_path = cm.global_config_path    # ~/.ahvn/config.yaml
system_path = cm.system_config_path    # 包资源路径

# 按级别获取路径
config_path = cm.config_path(level='local')

# 获取本地目录
local_dir = cm.local_dir               # 包含本地配置的目录
```

<br/>

## 3. 高级功能

### 3.1. 资源访问

一致地访问包资源：

```python
# 获取包资源路径
resource_path = cm.resource("configs", "default_config.yaml")
prompt_path = cm.resource("prompts", "system.jinja")

# 使用辅助函数
from ahvn.utils.basic.config_utils import ahvn_resource
config_path = ahvn_resource("configs", "default_config.yaml")
```

<br/>

### 3.2. 配置加密

保护敏感配置值：

```python
from ahvn.utils.basic.config_utils import encrypt_config

# 加密配置字典中的敏感值
llm_config = {
    'api_key': 'sk-123456789',
    'model': 'gpt-4',
    'timeout': 30
}

# 加密全局配置中指定的密钥 (core.encrypt_keys)
encrypted_config = encrypt_config(llm_config)
print(encrypted_config)
# 输出: {'api_key': '******', 'model': 'gpt-4', 'timeout': 30}

# 指定自定义密钥进行加密
encrypted_config = encrypt_config(llm_config, encrypt_keys=['api_key', 'timeout'])
```

<br/>

### 3.3. 特殊路径处理

使用 `hpj`（"Heaven Path Join"）函数进行平台无关的 AgentHeaven 相关路径处理，支持特殊扩展：

```python
from ahvn.utils.basic.config_utils import hpj

# 基本路径连接
path = hpj("config", "files", "app.yaml")

# 扩展主目录
home_path = hpj("~", "app", "config")

# 扩展到 AgentHeaven 资源目录
resource_path = hpj("&", "configs", "default.yaml")

# 扩展到本地仓库根目录
repo_path = hpj("&gt;", "data", "files")

# 获取绝对路径
abs_path = hpj("config", "app.yaml", abs=True)
```

<br/>

### 3.4. 字典工具

该模块提供了几个用于处理嵌套字典的工具：

#### 3.4.1. 合并字典

```python
from ahvn.utils.basic.config_utils import dmerge

# 合并多个字典（后面的值覆盖前面的值）
config1 = {'database': {'host': 'localhost', 'port': 5432}}
config2 = {'database': {'port': 3306}, 'debug': True}

merged = dmerge([config1, config2])
# 结果: {'database': {'host': 'localhost', 'port': 3306}, 'debug': True}
```

<br/>

#### 3.4.2. 点表示法访问

```python
from ahvn.utils.basic.config_utils import dget, dset, dunset, dsetdef

# 使用点表示法获取值
config = {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
host = dget(config, 'database.host')
port = dget(config, 'database.ports[0]')

# 使用点表示法设置值
dset(config, 'database.timeout', 30)
dset(config, 'database.ports[2]', 27017)  # 添加到数组

# 取消设置值
dunset(config, 'database.timeout')
```

<br/>

#### 3.4.3. 设置默认值

```python
# 仅当值不存在时才设置
dsetdef(config, 'database.host', '127.0.0.1') # 不会改变现有的值
dsetdef(config, 'database.user', 'default_user') # 将会设置一个新值
```

<br/>

#### 3.4.4. 扁平化和反扁平化

```python
from ahvn.utils.basic.config_utils import dflat, dunflat

# 扁平化嵌套字典
config = {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
flat_dict = dict(dflat(config))
# 结果: {'database.host': 'localhost', 'database.ports[0]': 5432, 'database.ports[1]': 3306}

# 反扁平化回嵌套结构
nested = dunflat(flat_dict)
# 结果: {'database': {'host': 'localhost', 'ports': [5432, 3306]}}
```

<br/>

## 4. 最佳实践

### 4.1. 环境特定设置

为不同环境使用不同的配置级别：

```python
# 用户偏好（全局）
cm.set('core.debug', True, level='global')

# 项目特定覆盖（本地）
cm.set('core.debug', False, level='local')
```

<br/>

### 4.2. 安全考虑

切勿提交敏感信息：

```python
# 良好：使用环境变量
cm.set('llm.api_key', '<OPENAI_API_KEY>', level='local')

# 良好：使用命令输出
cm.set('database.username', '${whoami}', level='local')

# 不良：硬编码密钥
cm.set('llm.api_key', 'sk-123456789', level='local')
```

<br/>

### 4.3. 配置验证

始终提供默认值并处理缺失值：

```python
# 良好：带默认值
timeout = cm.get('database.timeout', default=30)
max_connections = cm.get('database.max_connections', default=10)

# 风险：无默认值
timeout = cm.get('database.timeout')  # 可能为 None
```

<br/>

## 5. 与其他组件集成

### 5.1. LLM 配置

配置系统与 LLM 组件无缝集成：

```python
# 配置 LLM 设置
cm.set('llm.default_model', 'gpt-4', level='global')
cm.set('llm.default_provider', 'openai', level='global')
cm.set('llm.providers.openai.api_key', '<OPENAI_API_KEY>', level='local')

# 访问 LLM 配置
llm_config = cm.get('llm')
```

<br/>

### 5.2. 数据库配置

配置数据库连接：

```python
# 设置数据库配置
cm.set('db.default_provider', 'postgresql', level='global')
cm.set('db.providers.postgresql.host', 'localhost', level='global')
cm.set('db.providers.postgresql.port', 5432, level='global')
cm.set('db.providers.postgresql.username', '${whoami}', level='local')
cm.set('db.providers.postgresql.password', '<DB_PASSWORD>', level='local')
```

<br/>

### 5.3. 向量数据库配置

配置向量数据库连接：

```python
# 设置向量数据库配置
cm.set('vdb.default_provider', 'milvus', level='global')
cm.set('vdb.providers.milvus.host', 'localhost', level='global')
cm.set('vdb.providers.milvus.port', 19530, level='global')
cm.set('vdb.providers.milvus.collection', 'my_default_milvus_collection', level='global')
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中配置的更多信息，请参见：
> - [核心配置](../../../configuration/core.md) - 核心配置概念
> - [LLM 配置](../../../configuration/llm.md) - 具体的 LLM 配置选项
> - [数据库配置](../../../configuration/database.md) - 关系数据库连接和存储配置
> - [向量数据库配置](../../../configuration/vdb.md) - 向量数据库连接和存储配置
> - [配置管理](../../../python-guide/utils/basic/config_utils.md) - 用于在 Python 中管理配置的工具

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
