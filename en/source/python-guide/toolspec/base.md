# ToolSpec

ToolSpec is the core abstraction in AgentHeaven's tool specification and execution framework. It provides a standardized way to define, manage, and execute tools that can be used by agents, LLMs, and other components. ToolSpec bridges the gap between Python functions and structured tool interfaces compatible with various LLM frameworks and agent systems.

<br/>

## 1. Understanding ToolSpec

### 1.1. What is ToolSpec?

**ToolSpec** is AgentHeaven's unified tool abstraction layer. Think of it as a wrapper that:
- **Standardizes Functions**: Converts Python functions into structured tool specifications with well-defined input/output schemas
- **Manages State**: Supports parameter binding to state values for dynamic context management
- **Enables Interoperability**: Exports tools in multiple formats (MCP, FastMCP, JSON Schema) for different frameworks
- **Handles Execution**: Manages both synchronous and asynchronous tool execution with proper error handling
- **Auto-Documents**: Generates documentation from docstrings and schemas automatically

ToolSpec is **INTENTIONALLY** designed to be **format-agnostic** — it provides a single unified interface while supporting multiple export formats, eliminating the need to maintain separate tool definitions for different LLM frameworks.

<br/>

### 1.2. Why Use ToolSpec?

This unified abstraction brings several benefits:

**Single Source of Truth**: Define tools once as Python functions and automatically export to any format needed (OpenAI function calling, MCP tools, custom formats). No need to maintain multiple definitions.

**Type Safety**: Leverages Python's type hints and docstrings to generate accurate schemas, reducing errors and improving LLM understanding.

**Dynamic Binding**: Parameter binding allows tools to access context (user sessions, databases, API keys) without exposing these details in the tool signature or requiring agents to manage them.

**Flexibility**: Works with functions, methods, code snippets, or existing MCP tools. Supports both creation and conversion workflows.

**Discoverability**: The ToolRegistry pattern enables automatic tool discovery and registration, making it easy to expose class methods as agent tools.

<br/>

## 2. Core Architecture

**ToolSpec** wraps a `FastMCPTool` internally and extends it with additional state management and interoperability features:

**Core Components:**
- **Core Tool** (`FastMCPTool`): The underlying MCP tool implementation that handles the actual function execution and parameter validation
- **State** (`Dict[str, Any]`): A mutable dictionary for storing bound parameter values that can be dynamically updated at runtime
- **Binds** (`Dict[str, str]`): Mappings from function parameter names to state keys, enabling parameters to automatically resolve from state values

**Creation Methods:**
ToolSpec offers multiple entry points for creating tool specifications:
- **`from_function()`**: Create from Python functions with automatic schema extraction from type hints
- **`from_mcp()`**: Convert existing MCP tools to ToolSpec for enhanced capabilities
- **`from_code()`**: Generate from code snippets or strings for dynamic tool creation

**Export Formats:**
ToolSpec can be exported to various formats for framework interoperability:
- **`to_mcp()`**: Export as standard MCP Tool for MCP-compatible systems
- **`to_fastmcp()`**: Export as FastMCP Tool (direct access to internal tool)
- **`to_jsonschema()`**: Export as JSON Schema format compatible with OpenAI function calling, Anthropic tool use, and similar LLM frameworks
- **`to_prompt()`**: Generate human-readable prompt description for LLM context

This architecture enables ToolSpec to serve as a universal adapter between Python functions and various agent/LLM tool formats while maintaining dynamic state management capabilities.

<br/>

### 2.1. Key Components

- **Core Tool** (`FastMCPTool`): The underlying MCP tool implementation that handles actual execution
- **State** (`Dict[str, Any]`): A mutable state dictionary for storing bound parameter values
- **Binds** (`Dict[str, str]`): Mappings from parameter names to state keys for dynamic binding
- **Examples** (`Optional[Iterable[ExperienceType]]`): Example usages for documentation and few-shot learning
- **Cached Properties**: Performance-optimized caching for schemas, docstrings, and code generation

<br/>

## 3. Creating ToolSpecs

### 3.1. From Python Functions

The most common and recommended way to create a ToolSpec:

```python
from ahvn.tool import ToolSpec

def search_database(query: str, limit: int = 10) -> dict:
    """Search the database for matching records.
    
    Args:
        query: The search query string
        limit: Maximum number of results to return
    
    Returns:
        dict: Search results with matched records
    """
    # Implementation here
    return {"results": [...]}

# Create ToolSpec with docstring parsing
tool = ToolSpec.from_function(search_database, parse_docstring=True)
```

**Key Parameters**:
- `func` (Callable): The Python function to wrap
- `parse_docstring` (bool): Whether to parse function docstring for description and parameters (default: True)
- `examples` (Optional[Iterable[ExperienceType]]): Example usages for documentation
- Additional kwargs are passed to `FastMCPTool.from_function()`

<br/>

### 3.2. From MCP Tools

Convert existing MCP tools to ToolSpec for additional capabilities:

```python
from mcp.types import Tool as MCPTool
from ahvn.tool import ToolSpec

# Assuming you have an MCP tool
mcp_tool = MCPTool(
    name="my_tool",
    description="Tool description",
    inputSchema={...}
)

# Create ToolSpec from MCP
tool = ToolSpec.from_mcp(mcp_tool)
```

This is useful when integrating with existing MCP-based tools or services.

<br/>

### 3.3. From Code Snippets

Create ToolSpec directly from code strings for dynamic tool creation:

```python
from ahvn.tool import ToolSpec

code = """
def calculate_sum(a: int, b: int) -> int:
    '''Add two numbers together.
    
    Args:
        a: First number
        b: Second number
    
    Returns:
        int: The sum of a and b
    '''
    return a + b
"""

tool = ToolSpec.from_code(
    code=code,
    func_name="calculate_sum",  # Optional if only one function in code
    env=None  # Optional environment dict
)
```

**Key Parameters**:
- `code` (str): The code snippet containing the function definition
- `func_name` (Optional[str]): Name of function to extract (auto-detected if only one)
- `env` (Optional[Dict]): Environment dictionary for code execution
- Additional parameters same as `from_function()`

<br/>

## 4. Parameter Binding

One of ToolSpec's most powerful features is parameter binding, which allows tools to access context dynamically:

### 4.1. Basic Binding

```python
from ahvn.tool import ToolSpec

def user_action(user_id: str, action: str) -> str:
    """Perform an action for a user.
    
    Args:
        user_id: The user identifier
        action: The action to perform
    
    Returns:
        str: Result of the action
    """
    return f"User {user_id} performed: {action}"

tool = ToolSpec.from_function(user_action)

# Bind user_id to a state value
tool.bind(param="user_id", default="user123")

# Now you can call without providing user_id
result = tool(action="login")  # user_id automatically uses "user123"
```

<br/>

### 4.2. Dynamic State Updates

The bound state can be updated dynamically:

```python
# Update the state
tool.state["user_id"] = "user456"

# Next call uses updated value
result = tool(action="logout")  # user_id now uses "user456"
```

<br/>

### 4.3. Nested State Keys

Binding supports nested state keys using dot notation:

```python
tool.bind(param="api_key", state_key="config.api.key", default="default_key")

# Access nested state
tool.state = {"config": {"api": {"key": "my_secret_key"}}}
result = tool(query="test")  # Uses "my_secret_key"
```

<br/>

### 4.4. Unbinding Parameters

Remove bindings when needed:

```python
tool.unbind(param="user_id")
# Now user_id must be provided explicitly again
```

<br/>

## 5. Execution

ToolSpec provides flexible execution methods:

### 5.1. Synchronous Execution

```python
# Returns main output value (simplified)
result = tool.call(query="test", limit=5)

# Returns full ToolResult (structured)
full_result = tool.exec(query="test", limit=5)

# Callable shorthand
result = tool(query="test")  # Equivalent to tool.call()
```

<br/>

### 5.2. Asynchronous Execution

```python
# Returns main output value (simplified)
result = await tool.acall(query="test", limit=5)

# Returns full ToolResult (structured)
full_result = await tool.aexec(query="test", limit=5)
```

<br/>

### 5.3. Understanding Return Values

- **`call()` / `acall()`**: Returns the main output value directly
  - If output schema has one property, returns that property's value
  - Otherwise, returns the full `structured_content` dict

- **`exec()` / `aexec()`**: Returns the full `ToolResult` object with metadata
  - Access output via `result.structured_content`
  - Additional metadata like execution time, errors, etc.

<br/>

## 6. Schemas and Documentation

ToolSpec provides rich schema and documentation generation:

### 6.1. Input/Output Schemas

```python
# Full parameter schema (JSON Schema format)
input_schema = tool.input_schema
# {
#     "type": "object",
#     "properties": {
#         "query": {"type": "string", "description": "..."},
#         "limit": {"type": "integer", "default": 10, ...}
#     },
#     "required": ["query"]
# }

# Parameter properties only (shorthand)
params = tool.params
# {"query": {...}, "limit": {...}}

# Output schema
output_schema = tool.output_schema
```

<br/>

### 6.2. Auto-Generated Documentation

```python
# Google-style docstring (auto-generated)
docstring = tool.docstring

# Complete function definition with docstring
code = tool.code

# Function call signature with arguments
signature = tool.signature(query="example", limit=10)
# "search_database(query='example', limit=10)"
```

<br/>

### 6.3. Prompt Generation

```python
# Generate LLM-friendly prompt
prompt = tool.to_prompt()
# Returns formatted prompt string describing the tool
```

<br/>

## 7. Export Formats

ToolSpec can be exported to various formats for framework integration:

### 7.1. MCP Format

```python
from mcp.types import Tool as MCPTool

mcp_tool: MCPTool = tool.to_mcp()
# Export as MCP Tool for MCP-compatible systems
```

<br/>

### 7.2. FastMCP Format

```python
from fastmcp.tools import Tool as FastMCPTool

fastmcp_tool: FastMCPTool = tool.to_fastmcp()
# Export as FastMCP Tool (copy of internal tool)
```

<br/>

### 7.3. JSON Schema (for LLMs)

```python
schema = tool.to_jsonschema()
# Returns:
# {
#     "type": "function",
#     "name": "tool_name",
#     "description": "Tool description",
#     "parameters": {...},  # Input schema
#     "strict": True
# }
```

This format is compatible with OpenAI function calling, Anthropic tool use, and similar LLM frameworks.

<br/>

### 7.4. Additional Export Options

```python
# Add custom fields to JSON schema
schema = tool.to_jsonschema(custom_field="value")
```

<br/>

## 8. Tool Registry Pattern

The `ToolRegistry` mixin class enables automatic tool discovery and registration:

### 8.1. Basic Usage

```python
from ahvn.tool import ToolRegistry, reg_toolspec

class MyKnowledgeBase(ToolRegistry):
    @reg_toolspec(parse_docstring=True)
    def search(self, query: str, limit: int = 10) -> list:
        """Search the knowledge base.
        
        Args:
            query: Search query string
            limit: Maximum results
        
        Returns:
            list: Search results
        """
        return self._perform_search(query, limit)
    
    @reg_toolspec(parse_docstring=True)
    def add_item(self, title: str, content: str) -> dict:
        """Add an item to the knowledge base.
        
        Args:
            title: Item title
            content: Item content
        
        Returns:
            dict: Created item details
        """
        return self._add_to_kb(title, content)

# Create instance and get toolspecs
kb = MyKnowledgeBase()
tools = kb.to_toolspecs()  # Returns Dict[str, ToolSpec]

# List available tools
tool_names = kb.list_toolspecs()  # Returns List[str]
```

<br/>

### 8.2. How It Works

1. **`@reg_toolspec` Decorator**: Marks methods for tool registration
2. **`__init_subclass__`**: Automatically scans class during definition
3. **Metadata Storage**: Stores function and parameters in `_toolspecs` class variable
4. **Lazy Instantiation**: ToolSpecs created when `to_toolspecs()` is called
5. **Automatic Binding**: The `self` parameter is automatically bound to the instance

<br/>

### 8.3. Decorator Options

```python
@reg_toolspec(
    parse_docstring=True,  # Parse docstring for description/params
    description="Custom description",  # Override description
    output_schema={...},  # Custom output schema
    examples=[...],  # Example usages
    # Any other FastMCPTool.from_function() kwargs
)
def my_tool(self, ...):
    pass
```

<br/>

## 9. Advanced Features

### 9.1. Cloning ToolSpecs

Create independent copies of ToolSpecs:

```python
new_tool = tool.clone()
# Independent copy with separate state
new_tool.state["user_id"] = "different_user"
```

<br/>

### 9.2. Accessing the Binded Tool

Get the tool with all bindings applied:

```python
binded = tool.binded  # FastMCPTool with bound parameters hidden
```

This is useful for understanding the effective tool signature after bindings.

<br/>

### 9.3. Cache Management

ToolSpec caches expensive computations. Clear cache when modifying bindings:

```python
tool._clear_cache()  # Usually called automatically by bind/unbind
```

<br/>

## 10. Best Practices

### 10.1. Always Use Type Hints

```python
# Good: Clear types enable schema generation
def search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    pass

# Bad: No type information
def search(query, limit=10):
    pass
```

<br/>

### 10.2. Write Comprehensive Docstrings

```python
def my_tool(param1: str, param2: int = 10) -> dict:
    """Brief description of what the tool does.
    
    More detailed explanation if needed. Explain the purpose,
    behavior, and any important notes.
    
    Args:
        param1: Description of param1, including valid values or format
        param2: Description of param2, including default behavior
    
    Returns:
        dict: Description of return value structure and meaning
    
    Raises:
        ValueError: When param1 is invalid
        RuntimeError: When operation fails
    """
    pass
```

<br/>

### 10.3. Use Binding for Context

```python
# Good: Bind context that agents shouldn't manage
tool.bind(param="api_key", state_key="config.api_key")
tool.bind(param="user_session", state_key="session")

# Bad: Exposing internal details to agents
# Agents would need to know API keys, session IDs, etc.
```

<br/>

### 10.4. Leverage ToolRegistry

```python
# Good: Automatic discovery and management
class MyService(ToolRegistry):
    @reg_toolspec(parse_docstring=True)
    def tool1(self, ...):
        pass
    
    @reg_toolspec(parse_docstring=True)
    def tool2(self, ...):
        pass

# Bad: Manual tool creation and management
# tool1 = ToolSpec.from_function(...)
# tool2 = ToolSpec.from_function(...)
# tools = {"tool1": tool1, "tool2": tool2}
```

<br/>

## Further Exploration

> **Tip:** For more information about toolspec usage, see:
> - [Built-in ToolSpecs](./builtins.md): Pre-built tools for knowledge management
> - [KLBase](../klbase.md): Knowledge base with integrated ToolRegistry

<br/>
