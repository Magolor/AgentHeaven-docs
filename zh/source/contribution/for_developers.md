# 开发者指南

本指南提供了如何设置开发环境、理解项目结构以及为AgentHeaven有效贡献代码的详细说明。

## 1. 快速设置

### 1.1. 前置要求

- Python 3.8 或更高版本
- [Git](https://git-scm.com/) 用于版本控制
- [Conda](https://docs.conda.io/en/latest/miniconda.html)（推荐用于环境管理）

<br/>

### 1.2. 开发环境安装

1. **克隆仓库：**
   ```bash
   git clone https://github.com/Magolor/AgentHeaven.git
   cd AgentHeaven
   ```

2. **选择您偏好的包管理器和安装方法：**
   ```bash
   # pip
   pip install -e ".[dev,exp,gui]"

   # uv
   uv pip install -e ".[dev,exp,gui]"

   # poetry
   poetry install --extras "dev exp gui"

   # conda
   conda env create -f environment-full.yml -n ahvn
   conda activate ahvn
   ```

4. **初始化AgentHeaven环境：**
   ```bash
   bash scripts/setup.bash
   ```

    建议根据需要自定义此脚本以设置您的环境（例如，LLM提供商、预设、数据库连接）。

<br/>

## 2. 开发脚本

`scripts/` 目录包含开发工作流的基本工具：

### 2.1. `scripts/setup.bash`
**用途**：通过分组操作完成开发环境设置。

**使用方法**：
```bash
bash scripts/setup.bash
```

**功能**：
- 初始化AgentHeaven环境（`ahvn setup -r`）
- 配置LLM提供商（以DeepSeek为例）
- 设置系统预设模型
- 初始化仓库结构

<br/>

### 2.2. `scripts/docs.bash`
**用途**：构建和提供全面的项目文档。

**使用方法**：
```bash
bash scripts/docs.bash [选项] [语言]

# 示例
bash scripts/docs.bash                    # 构建中英文，提供两种语言
bash scripts/docs.bash en                 # 仅构建英文
bash scripts/docs.bash en zh -s           # 构建两种语言并提供服务
bash scripts/docs.bash --no-serve zh      # 构建中文但不提供服务
bash scripts/docs.bash --validate         # 构建时进行验证检查
```

**选项**：
- `-ns, --no-serve`：构建后不启动本地文档服务器
- `-s, --serve`：明确启动服务器（默认行为）
- `-nb, --no-build, --serve-only`：仅提供服务，不重新构建
- `--validate`：运行额外的验证检查（用于CI）
- `en`：构建英文文档（服务于 `http://localhost:8000/`）
- `zh`：构建中文文档（服务于 `http://localhost:8001/`）

<br/>

### 2.3. `scripts/flake.bash`
**用途**：代码质量和格式化管理。

**使用方法**：
```bash
bash scripts/flake.bash [选项]

# 示例
bash scripts/flake.bash           # 仅运行Flake8检查
bash scripts/flake.bash -b        # 使用Black格式化代码
bash scripts/flake.bash -c        # 检查格式化但不修改
bash scripts/flake.bash -a        # 同时运行Black和Flake8
bash scripts/flake.bash -b -f     # 先用Black格式化然后运行Flake8
```

**选项**：
- `-b, --black`：运行Black代码格式化器
- `-c, --check`：以检查模式运行Black（不修改文件）
- `-f, --flake`：运行Flake8检查器（默认）
- `-a, --all`：同时运行Black格式化器和Flake8检查器

**配置**：
- 行长度：120字符
- Flake8忽略：`F401,F403,F405,E203,E402,E501,W503,E701`
- 目标：`src/ tests/ scripts/ tutorials/ demos/`

<br/>

### 2.4. `scripts/test.bash`
**用途**：运行全面的测试套件。

**使用方法**：
```bash
bash scripts/test.bash
```

**功能**：
- 创建pytest缓存目录
- 使用自定义临时目录运行pytest
- 测试后清理缓存

<br/>

### 2.5. `scripts/push.bash`
**用途**：完整的推送前工作流与质量检查。

**使用方法**：
```bash
bash scripts/push.bash
```

**自动化工作流**：
1. 使用Black格式化代码并运行Flake8
2. 运行完整的pytest测试套件
3. 构建两种语言的文档
4. Git添加所有变更
5. 使用来自`src/ahvn/version.py`的版本号提交
6. 推送到origin master

<br/>

### 2.6. `scripts/clear.bash`
**用途**：清除git历史（使用时需极度谨慎）。

**使用方法**：
```bash
bash scripts/clear.bash
```

**功能**：
- 使用当前代码创建孤立分支
- 移除所有git历史
- 使用版本号提交
- 强制推送到master

**⚠️ 警告**：这将永久销毁所有git历史！

<br/>

### 2.7. `scripts/spinner.bash`
**用途**：为长时间运行的操作提供视觉反馈的工具脚本。

**功能**：
- 终端操作的动画旋转器
- 成功/失败状态报告
- 颜色编码输出
- 被`setup.bash`使用以提供更好的用户体验

<br/>

### 2.8. `scripts/logo.py`
**用途**：生成AgentHeaven标志。

**使用方法**：
```bash
python scripts/logo.py
```

<br/>

### 2.9. `scripts/cc.bash`
**用途**：配置AI编码助手和开发环境。

**使用方法**：
```bash
bash scripts/cc.bash
```

**功能**：
- 将GitHub Copilot说明复制到AI特定文件（`CLAUDE.md`、`GEMINI.md`、`QWEN.md`）
- 创建任务管理目录（`__tasks__/`）
- 初始化待办事项和活动跟踪文件
- 清除现有的AI提供商环境变量
- 为多个AI提供商设置环境变量：
  - **Claude Code**：兼容GLM、Kimi、DeepSeek和其他提供商
  - **Qwen Code**：配置ModelScope API端点
- 启动Claude编码助手

**配置**：
- 使用您的提供商详细信息更新`ANTHROPIC_BASE_URL`和`ANTHROPIC_API_KEY`
- Qwen默认使用ModelScope推理API
- 环境变量在配置前重置以避免冲突

### 2.10. `scripts/sync_req.bash`
**用途**：将pip的需求文件同步到conda。

**使用方法**：
```bash
bash scripts/sync_req.bash
```

<br/>

## 拓展阅读

> **提示：** 有关为 AgentHeaven 做贡献的更多信息，请参见：
> - [贡献概述](./overview.md) - 高级贡献指南和入门方式
> - [功能工作流](./feature_workflow.md) - 为 AgentHeaven 添加新功能的分步指南
> - [简单SRS](./srs.md) - 项目的高级软件需求
> - [分配需求 (AR)](./ar/index.md) - 详细的组件需求分配和规范

> **提示：** 有关 AgentHeaven 开发和使用的更多信息，请参见：
> - [入门指南](../getting-started/index.md) - 快速设置和基本使用指南
> - [Python指南](../python-guide/index.md) - 全面的Python开发指南
> - [配置指南](../configuration/index.md) - 配置系统设置和管理
> - [CLI指南](../cli-guide/index.md) - 命令行界面开发和使用

<br/>

