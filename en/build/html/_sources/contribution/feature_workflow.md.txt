# Feature Addition Workflow

This guide provides a comprehensive workflow for adding new features to AgentHeaven. Whether you're new to open-source development or an experienced contributor, this workflow will help you create high-quality features that follow the project's standards and patterns.

General steps to add a new feature:
1. Implement the feature under `src/`, following the coding style of existing modules (Cache, KLStore, KLEngine). Keep functions modular and small.
2. Add standard unit tests under `tests/` that validate your feature and ensure the full test-suite still passes.
3. Create English and Chinese docs under `docs/en/` and `docs/zh/`, following existing doc style (numbered sections, code blocks, `<br/>` separators). Recommended: write in English first, then translate to Chinese using an LLM and proofread manually.
4. Run formatting and linting (Black/Flake8) to ensure code quality and readable style.
5. Verify CI (GitHub Actions) passes on your branch before opening a PR.
6. Open a pull request for review and address feedback until merged.

This guide below expands each step with patterns, examples, and checks to help you succeed.

<br/>

## 1. Branch Creation and Naming Convention

### 1.1. Branch Naming Rules

Use descriptive branch names that follow this pattern:

```
<type>/<short-description>-<issue-number>
```

**Types:**
- `feat/` - New features
- `fix/` - Bug fixes  
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `perf/` - Performance optimizations

**Examples:**
```
feat/add-redis-cache-backend-123
fix/memory-leak-in-klstore-456
docs/update-cache-guide-789
refactor/simplify-base-cache-abc-101
```

<br/>

### 1.2. Creating Your Branch

```bash
# Always start from the latest main/master branch
git checkout master
git pull upstream master

# Create your feature branch
git checkout -b feat/your-feature-name-123
```

<br/>

## 2. Feature Implementation

### 2.1. Code Structure and Patterns

**Follow the established patterns:**
- All core modules inherit from abstract base classes
- Use consistent naming conventions (snake_case for functions, PascalCase for classes)
- Implement comprehensive docstrings with proper formatting
- Follow the modular architecture with clear separation of concerns

**Example Cache Implementation Pattern:**
```python
__all__ = [
    "MyCache",
]

from ..utils.basic import *
from ..cache.base import BaseCache, CacheEntry

logger = get_logger(__name__)

class MyCache(BaseCache):
    """\
    My custom cache implementation.
    
    This cache provides... (comprehensive description)
    
    Attributes:
        _cache: Internal storage for cache entries
    """
    
    def __init__(self, exclude: Optional[Iterable[str]] = None, *args, **kwargs):
        """\
        Initialize MyCache.
        
        Args:
            exclude: Parameters to exclude from cache key generation
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments
        """
        super().__init__(exclude=exclude, *args, **kwargs)
        self._cache = {}
    
    @abstractmethod
    def _get(self, key: int, default: Any = ...) -> Dict[str, Any]:
        """\
        Retrieve cache entry by key.
        
        Args:
            key: Cache entry key
            default: Default value if not found
            
        Returns:
            Cache entry data or default
        """
        # Implementation here
        pass
    
    @abstractmethod 
    def _set(self, key: int, value: Dict[str, Any]):
        """\
        Set cache entry by key.
        
        Args:
            key: Cache entry key
            value: Cache entry data
        """
        # Implementation here
        pass
    
    # Implement other required abstract methods...
```

<br/>

### 2.2. Module Structure

**Place your code in the appropriate directory:**
- Utilities: `src/ahvn/utils/`
- Caching: `src/ahvn/cache/`
- KLStorage: `src/ahvn/klstore/`
- KLEngines: `src/ahvn/klengine/`
- KLBases: `src/ahvn/klbase/`
- LLM: `src/ahvn/llm/`
- Agents: `src/ahvn/agent/`
- Resources: `src/ahvn/resources/`

**Update `__init__.py` files:**
```python
__all__ = [
    "MyCache",
]

from .my_cache import MyCache
```

<br/>

### 2.3. Error Handling and Logging

**Use consistent error handling:**
```python
from ..utils.basic.log_utils import get_logger
logger = get_logger(__name__)

def my_function():
    try:
        # Your implementation
        pass
    except Exception as e:
        logger.error(f"Error in my_function: {e}")
        raise  # Re-raise for upstream handling
```

### 2.4. Configuration Management

**If your feature needs configuration:**
```python
# Add to src/ahvn/resources/config_schema.yaml
my_feature:
    enabled: true
    cache_size: 1000
    timeout: 30
```

<br/>

## 3. Testing

### 3.1. Test Structure

**Create comprehensive tests following the existing patterns:**
- Unit tests: `tests/unit/your_module/`
- Integration tests: `tests/integration/`
- Test fixtures: `tests/fixtures/`

**Example Test Structure:**
```python
"""
Unit tests for MyCache implementation.

Tests cover basic functionality, edge cases, and integration patterns.
"""

import pytest
from pathlib import Path

# Add tests directory to Python path
TESTS_DIR = Path(__file__).resolve().parents[2]
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

from base import CacheTestCase
from ahvn.cache.my_cache import MyCache


class TestMyCache(CacheTestCase):
    """Test MyCache functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        super().setup_method()
        self.cache = MyCache()
    
    def test_basic_functionality(self):
        """Test basic cache operations."""
        # Your test here
        pass
    
    def test_edge_cases(self):
        """Test edge cases and error conditions."""
        # Your test here
        pass
```

<br/>

### 3.2. Test Coverage Requirements

**Aim for comprehensive coverage:**
- All public methods must be tested
- Test both success and failure cases
- Include integration tests with other components
- Test async functions if applicable
- Use pytest fixtures for common test data

<br/>

### 3.3. Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/your_module/test_my_cache.py

# Run with coverage
pytest --cov=src/ahvn/your_module

# Run specific test class
pytest tests/unit/your_module/test_my_cache.py::TestMyCache
```

<br/>

## 4. Documentation

### 4.1. English Documentation

**Create comprehensive English documentation:**
``````markdown
# MyCache

AgentHeaven provides a custom cache implementation that... (brief description)

<br/>

## 1. Basic Usage Example
This example shows how to use MyCache for...

```python
from ahvn.cache import MyCache

cache = MyCache()

@cache.memoize()
def my_function(x):
    return x * 2

# Usage
result = my_function(5)
```

<br/>

## 2. Configuration Options

### 2.1. Basic Configuration
Simple configuration with default settings.

```python
from ahvn.cache import MyCache

cache = MyCache()
```
- **Pros**: Easy to use, minimal setup
- **Cons**: Limited customization
- **Use case**: Development, simple caching needs

<br/>

## 3. Advanced Features

### 3.1. Custom Parameters
Configure MyCache with custom parameters.

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

### 4.2. Chinese Documentation

**Create Chinese translation:**
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

### 4.3. Documentation Requirements

**Follow these guidelines:**
- Number all sections and subsections
- End each section with `<br/>`
- Include comprehensive code examples
- Follow the existing documentation style
- Add to appropriate index files
- Use proper markdown formatting

<br/>

### 4.4. Update Documentation Index

**Add your documentation to the relevant index:**
```markdown
# Update docs/en/source/python-guide/index.md
```{toctree}
:maxdepth: 2

cache
klstore
klengine
my_cache  # Add your new module
```

<br/>

## 5. Code Quality and Formatting

### 5.1. Code Formatting

**Use the project's formatting scripts:**
```bash
# Format code with Black and check with Flake8
bash scripts/flake.bash -b -f

# Equivalent manual commands:
black --line-length 160 src/ahvn/your_module/
flake8 --max-line-length=160 --ignore=F401,F403,F405,E203,E402,E501,W503,E701 src/ahvn/your_module/
```

<br/>

### 5.2. Code Quality Standards

**Follow these quality standards:**
- Line length: 120 characters maximum
- Use type hints for all function signatures
- Write comprehensive docstrings
- Follow PEP 8 style guidelines
- Include proper error handling
- Add logging for debugging

<br/>

### 5.3. Pre-commit Checks

**Before committing, run these checks:**
```bash
# Code quality checks
bash scripts/flake.bash -b -f

# Run all tests
bash scripts/test.bash

# Build documentation
bash scripts/docs.bash en zh -s
```

<br/>

## 6. GitHub Actions and CI/CD

### 6.1. Understanding the CI Pipeline

The project uses GitHub Actions for continuous integration:

**Python Tests (`.github/workflows/python-test.yml`):**
- Runs on push to `master`, `develop`, and `copilot/*` branches
- Tests against Python 3.10, 3.11, 3.12, and 3.13
- Only runs if commit message contains `[major]`
- Installs dependencies and runs pytest

**Code Quality (`.github/workflows/code-quality.yml`):**
- Runs Black and Flake8 checks
- Comments on PRs if formatting is needed
- Enforces code style standards

<br/>

## 7. Pull Request Process

### 7.1. Before Creating a PR

**Complete this checklist:**
- [ ] All tests pass locally
- [ ] Code is properly formatted
- [ ] Documentation is complete and follows style guidelines
- [ ] Feature is fully implemented
- [ ] No breaking changes (or properly documented)
- [ ] Branch is up to date with master (or proper base branch)

<br/>

### 7.2. Creating the Pull Request

1. **Push your branch:**
   ```bash
   git push origin feat/your-feature-name-123
   ```

2. **Create PR on GitHub:**
   - Base branch: `master` or `develop`
   - Compare branch: your feature branch
   - Title: Clear description of the feature
   - Description: Detailed explanation with testing instructions

3. **Link to issues:** Reference any related issues using `Closes #123`

<br/>

### 7.3. PR Review Process

**Be prepared for:**
- Code review feedback
- Documentation suggestions
- Test coverage improvements
- Performance considerations
- Security reviews

**Respond to feedback:**
- Address all comments
- Update code and documentation
- Add additional tests if needed
- Be polite and collaborative

<br/>

### 7.4. Final Checks

**Before merging:**
- All CI checks pass
- At least one approval from maintainers
- Documentation is updated
- Tests are comprehensive
- Code follows project standards

<br/>

## 8. Post-Merger Tasks

### 8.1. Cleanup

**After your PR is merged:**
```bash
# Switch to master and update
git checkout master
git pull upstream master

# Delete your feature branch
git branch -d feat/your-feature-name-123
git push origin --delete feat/your-feature-name-123
```

<br/>

### 8.2. Celebrate and Document

**Share your contribution:**
- Update your portfolio or resume
- Consider writing a blog post / tutorial about your feature
- Help answer questions about your feature in issues
- Monitor for bug reports related to your feature

<br/>

## 9. Troubleshooting and Help

### 9.1. Common Issues

**Test Failures:**
- Check Python version compatibility
- Ensure all dependencies are installed
- Verify your conda environment is active
- Check for integration issues with existing code

**Code Quality Issues:**
- Run the formatting scripts locally
- Check line length and style guidelines
- Ensure proper type hints
- Verify docstring format

**Documentation Issues:**
- Check markdown syntax
- Verify all sections are numbered
- Ensure `<br/>` tags are present
- Test code examples in documentation

<br/>

### 9.2. Getting Help

**Resources:**
- GitHub Issues: Report bugs or ask questions
- Documentation: Check existing guides
- Code Examples: Look at similar features
- Community: Join discussions in the repository

**When to ask for help:**
- You're stuck on a technical issue
- You're unsure about design decisions
- You need clarification on requirements
- You want feedback on your approach

<br/>

## 10. Best Practices and Tips

### 10.1. Development Best Practices

**Code Quality:**
- Write clean, modular code
- Follow existing patterns and conventions
- Add comprehensive tests
- Document your code thoroughly
- Consider performance implications

**Collaboration:**
- Communicate early and often
- Be open to feedback and suggestions
- Help review other contributors' code
- Share knowledge and experience
- Be patient and respectful

<br/>

### 10.2. Performance Considerations

**Think about:**
- Memory usage and efficiency
- Scalability of your solution
- Impact on existing functionality
- Integration with other components
- Testing under different conditions

<br/>

### 10.3. Security Considerations

**Always consider:**
- Input validation and sanitization
- Proper error handling
- Secure configuration management
- Dependency security
- Access control and permissions

<br/>

## Further Exploration

> **Tip:** For more information about contributing to AgentHeaven, see:
> - [Contribution Overview](./overview.md) - High-level contribution guidelines and ways to get started
> - [For Developers](./for_developers.md) - Developer setup, workflow, and testing instructions
> - [Simple SRS](./srs.md) - High-level software requirements for the project
> - [Allocated Requirements (AR)](./ar/index.md) - Detailed component requirements allocation and specifications

> **Tip:** For more information about AgentHeaven development, see:
> - [Main Guide (Python)](../python-guide/index.md) - Comprehensive Python development guide
> - [Configuration Guide](../configuration/index.md) - Configuration system setup and management
> - [CLI Guide](../cli-guide/index.md) - Command-line interface development and usage
> - [Community Resources](../community/index.md) - Community guidelines and support resources

<br/>
```````
