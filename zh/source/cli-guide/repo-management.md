# 仓库管理

AgentHeaven 提供了强大的仓库管理功能，帮助您组织和管理AI智能体项目。每个仓库都包含项目的配置文件和本地设置。

## 1. 仓库目录结构

每个 AgentHeaven 仓库都包含一个 `.ahvn/` 目录，类似于 Git 的 `.git/` 目录：

```
your-project/
├── .ahvn/
│   └── config.yaml    # 本地配置文件
├── your_files.py
└── ...
```

<br/>

## 2. 初始化新仓库

### 2.1. 创建匿名仓库

在当前目录初始化一个新的 AgentHeaven 仓库：

```bash
ahvn repo init
```

这将在当前目录创建 `.ahvn/` 目录和配置文件，但不会在全局注册该仓库。

<br/>

### 2.2. 创建命名仓库

创建一个带名称的仓库，并自动注册到全局配置中：

```bash
ahvn repo init my-project
```

这不仅会初始化当前目录,还会将该仓库以 `my-project` 的名称注册到全局配置中,方便后续管理。

<br/>

### 2.3. 重置现有仓库

如果需要重置仓库配置到默认值，使用`--reset/-r`：

```bash
ahvn repo init --reset
# 或
ahvn repo init my-project --reset
```

<br/>

## 3. 缓存与清理

### 3.1. 清除缓存与临时文件

AgentHeaven 将缓存数据和临时文件存储在配置的目录中。您可以清理这些文件以释放磁盘空间或解决缓存损坏引起的问题：

```bash
ahvn clean
```

这将删除配置的 `cache_path` 和 `tmp_path` 目录中的所有缓存数据和临时文件。

<br/>

### 3.2. 预览清理（试运行）

要预览将要删除的内容而不实际删除，使用 `--dry-run/-n` 选项：

```bash
ahvn clean --dry-run
# 或
ahvn clean -n
```

<br/>

## 4. 全局仓库管理

### 4.1. 查看所有注册的仓库

列出所有在全局配置中注册的仓库，使用`list`或`ls`：

```bash
ahvn repo list
# 或
ahvn repo ls
```

输出示例：
```
Registered repos:
  ✓ my-project     /path/to/my-project
  ✗ old-project    /path/to/old-project  # 路径不存在
```

- ✓ 表示仓库路径存在且有效
- ✗ 表示仓库路径不存在或无效

<br/>

### 4.2. 查看仓库详细信息

查看特定仓库的详细信息，使用`info`：

```bash
ahvn repo info my-project
```

输出示例：
```
Repo: my-project
  Path: /path/to/my-project
  Exists: Yes
  Created: 2024-01-15 10:30:45
  Modified: 2024-01-20 14:22:33
```

<br/>

### 4.3. 重命名仓库

重命名一个已注册的仓库，使用`rename`或`rn`：

```bash
ahvn repo rename old-name new-name
# 或
ahvn repo rn old-name new-name
```

<br/>

### 4.4. 移除仓库

从全局配置中移除仓库注册（不会删除实际文件），使用`remove`或`rm`：

```bash
ahvn repo remove my-project
# 或
ahvn repo rm my-project
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven CLI 使用的更多信息，请参见：
> - [LLM 推理](./llm-inference.md) - 命令行 LLM 推理工具
> - [LLM 会话](./llm-session.md) - 命令行 LLM 交互式会话
> - [提示词管理](./prompt-management.md) - 命令行提示词创建与本地化
> - [知识管理](./knowledge-management.md) - 命令行知识库管理

<br/>
