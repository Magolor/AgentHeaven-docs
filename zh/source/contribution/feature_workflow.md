# 功能添加工作流

本指南为向 AgentHeaven 添加新功能提供了一个全面的工作流。无论您是开源开发的新手还是经验丰富的贡献者，此工作流都将帮助您创建符合项目标准和模式的高质量功能。

添加新功能的常规步骤：
1. 在 `src/` 下实现功能，遵循现有模块（Cache、KLStore、KLEngine）的编码风格。保持函数模块化和小型化。
2. 在 `tests/` 下添加标准单元测试，以验证您的功能并确保整个测试套件仍然通过。
3. 在 `docs/en/` 和 `docs/zh/` 下创建英文和中文文档，遵循现有的文档样式（编号章节、代码块、`<br/>` 分隔符）。建议：首先用英文编写，然后使用大语言模型翻译成中文并手动校对。
4. 运行格式化和代码检查（Black/Flake8）以确保代码质量和可读风格。
5. 在开启 PR 之前，验证您的分支上的 CI（GitHub Actions）是否通过。
6. 开启一个拉取请求以供审查，并根据反馈进行修改，直到合并。

下面的指南通过模式、示例和检查来扩展每个步骤，以帮助您成功。

<br/>

## 1. 分支创建和命名约定

### 1.1. 分支命名规则

使用遵循此模式的描述性分支名称：

```
<类型>/<简短描述>-<问题编号>
```

**类型:**
- `feat/` - 新功能
- `fix/` - 错误修复
- `docs/` - 文档变更
- `refactor/` - 代码重构
- `test/` - 测试改进
- `perf/` - 性能优化

**示例:**
```
feat/add-redis-cache-backend-123
fix/memory-leak-in-klstore-456
docs/update-cache-guide-789
refactor/simplify-base-cache-abc-101
```

<br/>

### 1.2. 创建您的分支

```bash
# 始终从最新的 main/master 分支开始
git checkout master
git pull upstream master

# 创建您的功能分支
git checkout -b feat/your-feature-name-123
```

<br/>

## 2. 功能实现

### 2.1. 代码结构和模式

**遵循已建立的模式：**
- 所有核心模块都继承自抽象基类
- 使用一致的命名约定（函数使用 snake_case，类使用 PascalCase）
- 实现格式正确的综合文档字符串
- 遵循具有明确关注点分离的模块化架构

**缓存实现模式示例：**
```python
__all__ = [
    "MyCache",
]

from ..utils.basic import *
from ..cache.base import BaseCache, CacheEntry

logger = get_logger(__name__)

class MyCache(BaseCache):
    """
    我的自定义缓存实现。
    
    此缓存提供... (综合描述)
    
    属性:
        _cache: 缓存条目的内部存储
    """
    
    def __init__(self, exclude: Optional[Iterable[str]] = None, *args, **kwargs):
        """
        初始化 MyCache。
        
        参数:
            exclude: 从缓存键生成中排除的参数
            *args: 额外的定位参数
            **kwargs: 额外的关键字参数
        """
        super().__init__(exclude=exclude, *args, **kwargs)
        self._cache = {}
    
    @abstractmethod
    def _get(self, key: int, default: Any = ...) -> Dict[str, Any]:
        """
        按键检索缓存条目。
        
        参数:
            key: 缓存条目键
            default: 如果未找到的默认值
            
        返回:
            缓存条目数据或默认值
        """
        # 此处实现
        pass
    
    @abstractmethod 
    def _set(self, key: int, value: Dict[str, Any]):
        """
        按键设置缓存条目。
        
        参数:
            key: 缓存条目键
            value: 缓存条目数据
        """
        # 此处实现
        pass
    
    # 实现其他必需的抽象方法...
```

<br/>

### 2.2. 模块结构

**将您的代码放在适当的目录中：**
- 工具: `src/ahvn/utils/`
- 缓存: `src/ahvn/cache/`
- 知识库存储: `src/ahvn/klstore/`
- 知识库引擎: `src/ahvn/klengine/`
- 知识库基类: `src/ahvn/klbase/`
- 大语言模型: `src/ahvn/llm/`
- 智能体: `src/ahvn/agent/`
- 资源: `src/ahvn/resources/`

**更新 `__init__.py` 文件：**
```python
__all__ = [
    "MyCache",
]

from .my_cache import MyCache
```

<br/>

### 2.3. 错误处理和日志记录

**使用一致的错误处理：**
```python
from ..utils.basic.log_utils import get_logger
logger = get_logger(__name__)

def my_function():
    try:
        # 您的实现
        pass
    except Exception as e:
        logger.error(f"my_function 中出错: {e}")
        raise  # 重新抛出以便上游处理
```

### 2.4. 配置管理

**如果您的功能需要配置：**
```python
# 添加到 src/ahvn/resources/config_schema.yaml
my_feature:
    enabled: true
    cache_size: 1000
    timeout: 30
```

<br/>

## 3. 测试

### 3.1. 测试结构

**遵循现有模式创建综合测试：**
- 单元测试: `tests/unit/your_module/`
- 集成测试: `tests/integration/`
- 测试固件: `tests/fixtures/`

**测试结构示例：**
```python
"""
MyCache 实现的单元测试。

测试涵盖基本功能、边缘情况和集成模式。
"""

import pytest
from pathlib import Path

# 将 tests 目录添加到 Python 路径
TESTS_DIR = Path(__file__).resolve().parents[2]
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

from base import CacheTestCase
from ahvn.cache.my_cache import MyCache


class TestMyCache(CacheTestCase):
    """测试 MyCache 功能。"""
    
    def setup_method(self):
        """设置测试固件。"""
        super().setup_method()
        self.cache = MyCache()
    
    def test_basic_functionality(self):
        """测试基本缓存操作。"""
        # 您的测试在此处
        pass
    
    def test_edge_cases(self):
        """测试边缘情况和错误条件。"""
        # 您的测试在此处
        pass
```

<br/>

### 3.2. 测试覆盖率要求

**力求全面的覆盖率：**
- 所有公共方法都必须经过测试
- 测试成功和失败两种情况
- 包括与其他组件的集成测试
- 如果适用，测试异步函数
- 使用 pytest 固件处理通用测试数据

<br/>

### 3.3. 运行测试

```bash
# 运行所有测试
pytest

# 运行特定的测试文件
pytest tests/unit/your_module/test_my_cache.py

# 运行并检查覆盖率
pytest --cov=src/ahvn/your_module

# 运行特定的测试类
pytest tests/unit/your_module/test_my_cache.py::TestMyCache
```

<br/>

## 4. 文档

### 4.1. 英文文档

**创建综合的英文文档：**
``````markdown
# MyCache

AgentHeaven 提供了一个自定义缓存实现，它... (简要描述)

<br/>

## 1. 基本用法示例
此示例展示了如何使用 MyCache 来...

```python
from ahvn.cache import MyCache

cache = MyCache()

@cache.memoize()
def my_function(x):
    return x * 2

# 用法
result = my_function(5)
```

<br/>

## 2. 配置选项

### 2.1. 基本配置
使用默认设置的简单配置。

```python
from ahvn.cache import MyCache

cache = MyCache()
```
- **优点**: 易于使用，设置最少
- **缺点**: 定制化有限
- **使用场景**: 开发，简单的缓存需求

<br/>

## 3. 高级功能

### 3.1. 自定义参数
使用自定义参数配置 MyCache。

```python
cache = MyCache(
    cache_size=1000,
    timeout=30,
    custom_option="value"
)
```

<br/>

``````

<br/>

### 4.2. 中文文档

**创建中文翻译：**
``````markdown
# MyCache

AgentHeaven 提供了一个自定义缓存实现，用于... (中文描述)

<br/>

## 1. 基本使用示例
本示例展示如何使用 MyCache 进行...

```python
from ahvn.cache import MyCache

cache = MyCache()

@cache.memoize()
def my_function(x):
    return x * 2

# 使用
result = my_function(5)
```

<br/>

``````

<br/>

### 4.3. 文档要求

**遵循以下指南：**
- 对所有章节和小节进行编号
- 每个章节以 `<br/>` 结尾
- 包括综合的代码示例
- 遵循现有的文档风格
- 添加到适当的索引文件中
- 使用正确的 markdown 格式

<br/>

### 4.4. 更新文档索引

**将您的文档添加到相关索引中：**
```markdown
# 更新 docs/en/source/python-guide/index.md
```{toctree}
:maxdepth: 2

cache
klstore
klengine
my_cache  # 添加您的新模块
```

<br/>

## 5. 代码质量和格式化

### 5.1. 代码格式化

**使用项目的格式化脚本：**
```bash
# 使用 Black 格式化代码并用 Flake8 检查
bash scripts/flake.bash -b -f

# 等效的手动命令：
black --line-length 160 src/ahvn/your_module/
flake8 --max-line-length=160 --ignore=F401,F403,F405,E203,E402,E501,W503,E701 src/ahvn/your_module/
```

<br/>

### 5.2. 代码质量标准

**遵循以下质量标准：**
- 行长度：最多 120 个字符
- 对所有函数签名使用类型提示
- 编写综合的文档字符串
- 遵循 PEP 8 风格指南
- 包括适当的错误处理
- 添加用于调试的日志记录

<br/>

### 5.3. 提交前检查

**在提交之前，运行这些检查：**
```bash
# 代码质量检查
bash scripts/flake.bash -b -f

# 运行所有测试
bash scripts/test.bash

# 构建文档
bash scripts/docs.bash en zh -s
```

<br/>

## 6. GitHub Actions 和 CI/CD

### 6.1. 理解 CI 管道

该项目使用 GitHub Actions 进行持续集成：

**Python 测试 (`.github/workflows/python-test.yml`):**
- 在推送到 `master`、`develop` 和 `copilot/*` 分支时运行
- 针对 Python 3.10、3.11、3.12、3.13 进行测试
- 仅当提交消息包含 `[major]` 时运行
- 安装依赖项并运行 pytest

**代码质量 (`.github/workflows/code-quality.yml`):**
- 运行 Black 和 Flake8 检查
- 如果需要格式化，则在 PR 上发表评论
- 强制执行代码风格标准

<br/>

## 7. 拉取请求流程

### 7.1. 创建 PR 之前

**完成此清单：**
- [ ] 所有测试在本地通过
- [ ] 代码已正确格式化
- [ ] 文档完整并遵循风格指南
- [ ] 功能已完全实现
- [ ] 没有破坏性变更（或已正确记录）
- [ ] 分支与 master（或正确的基础分支）保持同步

<br/>

### 7.2. 创建拉取请求

1. **推送您的分支：**
   ```bash
   git push origin feat/your-feature-name-123
   ```

2. **在 GitHub 上创建 PR：**
   - 基础分支: `master` 或 `develop`
   - 比较分支: 您的功能分支
   - 标题: 功能的清晰描述
   - 描述: 包含测试说明的详细解释

3. **链接到问题：** 使用 `Closes #123` 引用任何相关问题

<br/>

### 7.3. PR 审查流程

**准备好面对：**
- 代码审查反馈
- 文档建议
- 测试覆盖率改进
- 性能考虑
- 安全审查

**回应反馈：**
- 处理所有评论
- 更新代码和文档
- 如果需要，添加额外的测试
- 保持礼貌和协作

<br/>

### 7.4. 最终检查

**合并前：**
- 所有 CI 检查通过
- 至少获得一位维护者的批准
- 文档已更新
- 测试是全面的
- 代码遵循项目标准

<br/>

## 8. 合并后任务

### 8.1. 清理

**在您的 PR 合并后：**
```bash
# 切换到 master 并更新
git checkout master
git pull upstream master

# 删除您的功能分支
git branch -d feat/your-feature-name-123
git push origin --delete feat/your-feature-name-123
```

<br/>

### 8.2. 庆祝和记录

**分享您的贡献：**
- 更新您的作品集或简历
- 考虑写一篇关于您功能的博客文章/教程
- 在问题中帮助回答有关您功能的问题
- 监控与您功能相关的错误报告

<br/>

## 9. 故障排除和帮助

### 9.1. 常见问题

**测试失败：**
- 检查 Python 版本兼容性
- 确保所有依赖项都已安装
- 验证您的 conda 环境是否已激活
- 检查与现有代码的集成问题

**代码质量问题：**
- 在本地运行格式化脚本
- 检查行长度和风格指南
- 确保正确的类型提示
- 验证文档字符串格式

**文档问题：**
- 检查 markdown 语法
- 验证所有章节都已编号
- 确保存在 `<br/>` 标签
- 测试文档中的代码示例

<br/>

### 9.2. 获取帮助

**资源：**
- GitHub 问题: 报告错误或提问
- 文档: 查看现有指南
- 代码示例: 查看类似功能
- 社区: 加入存储库中的讨论

**何时寻求帮助：**
- 您在技术问题上卡住了
- 您不确定设计决策
- 您需要澄清需求
- 您希望对您的方法获得反馈

<br/>

## 10. 最佳实践和技巧

### 10.1. 开发最佳实践

**代码质量：**
- 编写干净、模块化的代码
- 遵循现有的模式和约定
- 添加全面的测试
- 彻底记录您的代码
- 考虑性能影响

**协作：**
- 尽早并经常沟通
- 对反馈和建议持开放态度
- 帮助审查其他贡献者的代码
- 分享知识和经验
- 保持耐心和尊重

<br/>

### 10.2. 性能考虑

**考虑：**
- 内存使用和效率
- 您解决方案的可扩展性
- 对现有功能的影响
- 与其他组件的集成
- 在不同条件下进行测试

<br/>

### 10.3. 安全考虑

**始终考虑：**
- 输入验证和清理
- 适当的错误处理
- 安全的配置管理
- 依赖项安全
- 访问控制和权限

<br/>

## 拓展阅读

> **提示：** 有关为 AgentHeaven 做贡献的更多信息，请参见：
> - [贡献概述](./overview.md) - 高级贡献指南和入门方式
> - [开发者指南](./for_developers.md) - 开发者设置、工作流和测试说明
> - [简单SRS](./srs.md) - 项目的高级软件需求
> - [分配需求 (AR)](./ar/index.md) - 详细的组件需求分配和规范

> **提示：** 有关 AgentHeaven 开发的更多信息，请参见：
> - [Python指南](../python-guide/index.md) - 全面的Python开发指南
> - [配置指南](../configuration/index.md) - 配置系统设置和管理
> - [CLI指南](../cli-guide/index.md) - 命令行界面开发和使用
> - [社区资源](../community/index.md) - 社区指南和支持资源

<br/>

---

本工作流指南应能帮助您成功地为 AgentHeaven 贡献新功能。请记住，目标是创建高质量、可维护的代码，使整个社区受益。在流程的任何时候都不要犹豫寻求帮助或澄清！

<br/>
