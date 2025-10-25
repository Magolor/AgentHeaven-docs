# 工具规范

ToolSpec 是 AgentHeaven 工具规范和执行框架的核心抽象。它提供了标准化的方式来定义、管理和执行工具,这些工具可以被智能体、LLM 和其他组件使用。ToolSpec 填补了 Python 函数与各种 LLM 框架和智能体系统兼容的结构化工具接口之间的鸿沟。

<br/>

## 1. 理解工具规范

### 1.1. 什么是工具规范?

**ToolSpec** 是 AgentHeaven 的统一工具抽象层。可以将其视为一个包装器:
- **标准化函数**: 将 Python 函数转换为具有明确定义的输入/输出模式的结构化工具规范
- **管理状态**: 支持参数绑定到状态值以进行动态上下文管理
- **实现互操作性**: 以多种格式(MCP、FastMCP、JSON Schema)导出工具,适配不同框架
- **处理执行**: 通过适当的错误处理管理同步和异步工具执行
- **自动生成文档**: 从文档字符串和模式自动生成文档

ToolSpec **特意**被设计为**格式无关**——它提供单一统一的接口,同时支持多种导出格式,无需为不同的 LLM 框架维护单独的工具定义。

<br/>

### 1.2. 为什么使用工具规范?

这种统一的抽象带来了几个好处:

**单一事实来源**: 将工具定义一次为 Python 函数,并自动导出为所需的任何格式(OpenAI 函数调用、MCP 工具、自定义格式)。无需维护多个定义。

**类型安全**: 利用 Python 的类型提示和文档字符串生成准确的模式,减少错误并提高 LLM 理解能力。

**动态绑定**: 参数绑定允许工具访问上下文(用户会话、数据库、API 密钥),而无需在工具签名中暴露这些细节或要求智能体管理它们。

**灵活性**: 适用于函数、方法、代码片段或现有的 MCP 工具。支持创建和转换工作流。

**可发现性**: ToolRegistry 模式实现了自动工具发现和注册,使得将类方法公开为智能体工具变得容易。

<br/>

## 2. 核心架构

**ToolSpec** 在内部包装了 `FastMCPTool` 并通过额外的状态管理和互操作性特性对其进行扩展:

**核心组件:**
- **核心工具** (`FastMCPTool`): 处理实际函数执行和参数验证的底层 MCP 工具实现
- **状态** (`Dict[str, Any]`): 用于存储绑定参数值的可变字典,可以在运行时动态更新
- **绑定** (`Dict[str, str]`): 从函数参数名称到状态键的映射,使参数能够自动从状态值解析

**创建方法:**
ToolSpec 提供多个入口点来创建工具规范:
- **`from_function()`**: 从 Python 函数创建,自动从类型提示提取模式
- **`from_mcp()`**: 将现有 MCP 工具转换为 ToolSpec 以获得增强功能
- **`from_code()`**: 从代码片段或字符串生成,用于动态工具创建

**导出格式:**
ToolSpec 可以导出为各种格式以实现框架互操作性:
- **`to_mcp()`**: 导出为标准 MCP Tool,用于 MCP 兼容系统
- **`to_fastmcp()`**: 导出为 FastMCP Tool(直接访问内部工具)
- **`to_jsonschema()`**: 导出为 JSON Schema 格式,兼容 OpenAI 函数调用、Anthropic 工具使用和类似的 LLM 框架
- **`to_prompt()`**: 生成人类可读的提示词描述,用于 LLM 上下文

这种架构使 ToolSpec 能够作为 Python 函数和各种智能体/LLM 工具格式之间的通用适配器,同时保持动态状态管理能力。

<br/>

## 3. 创建工具规范

### 3.1. 从 Python 函数创建

最常见也是推荐的创建 ToolSpec 的方式:

```python
from ahvn.tool import ToolSpec

def search_database(query: str, limit: int = 10) -> dict:
    """在数据库中搜索匹配的记录。
    
    Args:
        query: 搜索查询字符串
        limit: 返回的最大结果数
    
    Returns:
        dict: 包含匹配记录的搜索结果
    """
    # 实现代码
    return {"results": [...]}

# 创建带有文档字符串解析的 ToolSpec
tool = ToolSpec.from_function(search_database, parse_docstring=True)
```

**关键参数**:
- `func` (Callable): 要包装的 Python 函数
- `parse_docstring` (bool): 是否解析函数文档字符串以获取描述和参数(默认值: True)
- `examples` (Optional[Iterable[ExperienceType]]): 用于文档的示例用法
- 其他 kwargs 传递给 `FastMCPTool.from_function()`

<br/>

### 3.2. 从 MCP 工具创建

将现有的 MCP 工具转换为 ToolSpec 以获得额外功能:

```python
from mcp.types import Tool as MCPTool
from ahvn.tool import ToolSpec

# 假设你有一个 MCP 工具
mcp_tool = MCPTool(
    name="my_tool",
    description="工具描述",
    inputSchema={...}
)

# 从 MCP 创建 ToolSpec
tool = ToolSpec.from_mcp(mcp_tool)
```

这在与现有基于 MCP 的工具或服务集成时非常有用。

<br/>

### 3.3. 从代码片段创建

直接从代码字符串创建 ToolSpec 以实现动态工具创建:

```python
from ahvn.tool import ToolSpec

code = """
def calculate_sum(a: int, b: int) -> int:
    '''将两个数字相加。
    
    Args:
        a: 第一个数字
        b: 第二个数字
    
    Returns:
        int: a 和 b 的和
    '''
    return a + b
"""

tool = ToolSpec.from_code(
    code=code,
    func_name="calculate_sum",  # 如果代码中只有一个函数则可选
    env=None  # 可选的环境字典
)
```

**关键参数**:
- `code` (str): 包含函数定义的代码片段
- `func_name` (Optional[str]): 要提取的函数名称(如果只有一个则自动检测)
- `env` (Optional[Dict]): 用于代码执行的环境字典
- 其他参数与 `from_function()` 相同

<br/>

## 4. 参数绑定

ToolSpec 最强大的功能之一是参数绑定,它允许工具动态访问上下文:

### 4.1. 基本绑定

```python
from ahvn.tool import ToolSpec

def user_action(user_id: str, action: str) -> str:
    """为用户执行操作。
    
    Args:
        user_id: 用户标识符
        action: 要执行的操作
    
    Returns:
        str: 操作的结果
    """
    return f"User {user_id} performed: {action}"

tool = ToolSpec.from_function(user_action)

# 将 user_id 绑定到状态值
tool.bind(param="user_id", default="user123")

# 现在可以不提供 user_id 进行调用
result = tool(action="login")  # user_id 自动使用 "user123"
```

<br/>

### 4.2. 动态状态更新

绑定的状态可以动态更新:

```python
# 更新状态
tool.state["user_id"] = "user456"

# 下次调用使用更新后的值
result = tool(action="logout")  # user_id 现在使用 "user456"
```

<br/>

### 4.3. 嵌套状态键

绑定支持使用点符号的嵌套状态键:

```python
tool.bind(param="api_key", state_key="config.api.key", default="default_key")

# 访问嵌套状态
tool.state = {"config": {"api": {"key": "my_secret_key"}}}
result = tool(query="test")  # 使用 "my_secret_key"
```

<br/>

### 4.4. 解除参数绑定

在需要时移除绑定:

```python
tool.unbind(param="user_id")
# 现在必须再次显式提供 user_id
```

<br/>

## 5. 执行

ToolSpec 提供灵活的执行方法:

### 5.1. 同步执行

```python
# 返回主要输出值(简化版)
result = tool.call(query="test", limit=5)

# 返回完整的 ToolResult(结构化)
full_result = tool.exec(query="test", limit=5)

# 可调用的简写形式
result = tool(query="test")  # 等同于 tool.call()
```

<br/>

### 5.2. 异步执行

```python
# 返回主要输出值(简化版)
result = await tool.acall(query="test", limit=5)

# 返回完整的 ToolResult(结构化)
full_result = await tool.aexec(query="test", limit=5)
```

<br/>

### 5.3. 理解返回值

- **`call()` / `acall()`**: 直接返回主要输出值
  - 如果输出模式有一个属性,返回该属性的值
  - 否则,返回完整的 `structured_content` 字典

- **`exec()` / `aexec()`**: 返回带有元数据的完整 `ToolResult` 对象
  - 通过 `result.structured_content` 访问输出
  - 附加元数据如执行时间、错误等

<br/>

## 6. 模式和文档

ToolSpec 提供丰富的模式和文档生成功能:

### 6.1. 输入/输出模式

```python
# 完整参数模式(JSON Schema 格式)
input_schema = tool.input_schema
# {
#     "type": "object",
#     "properties": {
#         "query": {"type": "string", "description": "..."},
#         "limit": {"type": "integer", "default": 10, ...}
#     },
#     "required": ["query"]
# }

# 仅参数属性(简写)
params = tool.params
# {"query": {...}, "limit": {...}}

# 输出模式
output_schema = tool.output_schema
```

<br/>

### 6.2. 自动生成的文档

```python
# Google 风格的文档字符串(自动生成)
docstring = tool.docstring

# 带有文档字符串的完整函数定义
code = tool.code

# 带有参数的函数调用签名
signature = tool.signature(query="example", limit=10)
# "search_database(query='example', limit=10)"
```

<br/>

### 6.3. 提示词生成

```python
# 生成 LLM 友好的提示词
prompt = tool.to_prompt()
# 返回描述工具的格式化提示词字符串
```

<br/>

## 7. 导出格式

ToolSpec 可以导出为各种格式以实现框架集成:

### 7.1. MCP 格式

```python
from mcp.types import Tool as MCPTool

mcp_tool: MCPTool = tool.to_mcp()
# 导出为 MCP Tool 用于 MCP 兼容系统
```

<br/>

### 7.2. FastMCP 格式

```python
from fastmcp.tools import Tool as FastMCPTool

fastmcp_tool: FastMCPTool = tool.to_fastmcp()
# 导出为 FastMCP Tool(内部工具的副本)
```

<br/>

### 7.3. JSON Schema(用于 LLM)

```python
schema = tool.to_jsonschema()
# 返回:
# {
#     "type": "function",
#     "name": "tool_name",
#     "description": "工具描述",
#     "parameters": {...},  # 输入模式
#     "strict": True
# }
```

此格式与 OpenAI 函数调用、Anthropic 工具使用和类似的 LLM 框架兼容。

<br/>

### 7.4. 其他导出选项

```python
# 向 JSON schema 添加自定义字段
schema = tool.to_jsonschema(custom_field="value")
```

<br/>

## 8. 工具注册模式

`ToolRegistry` mixin 类实现了自动工具发现和注册:

### 8.1. 基本用法

```python
from ahvn.tool import ToolRegistry, reg_toolspec

class MyKnowledgeBase(ToolRegistry):
    @reg_toolspec(parse_docstring=True)
    def search(self, query: str, limit: int = 10) -> list:
        """搜索知识库。
        
        Args:
            query: 搜索查询字符串
            limit: 最大结果数
        
        Returns:
            list: 搜索结果
        """
        return self._perform_search(query, limit)
    
    @reg_toolspec(parse_docstring=True)
    def add_item(self, title: str, content: str) -> dict:
        """向知识库添加项目。
        
        Args:
            title: 项目标题
            content: 项目内容
        
        Returns:
            dict: 创建的项目详情
        """
        return self._add_to_kb(title, content)

# 创建实例并获取工具规范
kb = MyKnowledgeBase()
tools = kb.to_toolspecs()  # 返回 Dict[str, ToolSpec]

# 列出可用的工具
tool_names = kb.list_toolspecs()  # 返回 List[str]
```

<br/>

### 8.2. 工作原理

1. **`@reg_toolspec` 装饰器**: 标记方法以进行工具注册
2. **`__init_subclass__`**: 在类定义期间自动扫描类
3. **元数据存储**: 在 `_toolspecs` 类变量中存储函数和参数
4. **延迟实例化**: 当调用 `to_toolspecs()` 时创建 ToolSpecs
5. **自动绑定**: `self` 参数自动绑定到实例

<br/>

### 8.3. 装饰器选项

```python
@reg_toolspec(
    parse_docstring=True,  # 解析文档字符串以获取描述/参数
    description="自定义描述",  # 覆盖描述
    output_schema={...},  # 自定义输出模式
    examples=[...],  # 示例用法
    # 任何其他 FastMCPTool.from_function() kwargs
)
def my_tool(self, ...):
    pass
```

<br/>

## 9. 高级功能

### 9.1. 克隆工具规范

创建 ToolSpecs 的独立副本:

```python
new_tool = tool.clone()
# 具有独立状态的独立副本
new_tool.state["user_id"] = "different_user"
```

<br/>

### 9.2. 访问绑定后的工具

获取应用了所有绑定的工具:

```python
binded = tool.binded  # 隐藏绑定参数的 FastMCPTool
```

这对于理解绑定后的有效工具签名很有用。

<br/>

### 9.3. 缓存管理

ToolSpec 缓存昂贵的计算。在修改绑定时清除缓存:

```python
tool._clear_cache()  # 通常由 bind/unbind 自动调用
```

<br/>

## 10. 最佳实践

### 10.1. 始终使用类型提示

```python
# 好: 清晰的类型启用模式生成
def search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    pass

# 坏: 没有类型信息
def search(query, limit=10):
    pass
```

<br/>

### 10.2. 编写全面的文档字符串

```python
def my_tool(param1: str, param2: int = 10) -> dict:
    """工具功能的简要描述。
    
    如需要可提供更详细的解释。解释目的、
    行为和任何重要注意事项。
    
    Args:
        param1: param1 的描述,包括有效值或格式
        param2: param2 的描述,包括默认行为
    
    Returns:
        dict: 返回值结构和含义的描述
    
    Raises:
        ValueError: 当 param1 无效时
        RuntimeError: 当操作失败时
    """
    pass
```

<br/>

### 10.3. 使用绑定处理上下文

```python
# 好: 绑定智能体不应管理的上下文
tool.bind(param="api_key", state_key="config.api_key")
tool.bind(param="user_session", state_key="session")

# 坏: 向智能体暴露内部细节
# 智能体需要知道 API 密钥、会话 ID 等
```

<br/>

### 10.4. 利用工具注册

```python
# 好: 自动发现和管理
class MyService(ToolRegistry):
    @reg_toolspec(parse_docstring=True)
    def tool1(self, ...):
        pass
    
    @reg_toolspec(parse_docstring=True)
    def tool2(self, ...):
        pass

# 坏: 手动工具创建和管理
# tool1 = ToolSpec.from_function(...)
# tool2 = ToolSpec.from_function(...)
# tools = {"tool1": tool1, "tool2": tool2}
```

<br/>

## 11. 拓展阅读·

> **提示：** 有关 toolspec 使用的更多信息,请参见:
> - [内置工具规范](./builtins.md): 用于知识管理的预构建工具
> - [KLBase](../klbase.md): 集成了 ToolRegistry 的知识库

<br/>
