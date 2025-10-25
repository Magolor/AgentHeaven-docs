# Built-in Templates

## 1. KnowledgeUKFT

`KnowledgeUKFT` is a general-purpose knowledge entity used to store various types of information.

<br/>

### 1.1. Usage Example

```python
from ahvn.ukf import KnowledgeUKFT

# Create a basic KnowledgeUKFT instance
knowledge = KnowledgeUKFT(
    content_resources={
        "topic": "Python Programming",
        "content": "Python is a high-level programming language...",
        "difficulty": "beginner"
    }
)
```

<br/>

## 2. ExperienceUKFT

`ExperienceUKFT` is a class used to store function input-output pairs and annotated data. It supports automatic instance building from cache `CacheEntry` or dictionary objects, and provides various ways to display content.

<br/>

### 2.1. Building ExperienceUKFT from CacheEntry

You can use the `ExperienceUKFT.from_cache_entry(entry)` method to directly convert cached function call results (such as `CacheEntry` or dictionary) into ExperienceUKFT instances.

```python
cache_entry = CacheEntry(func="add", inputs={"a": 1, "b": 2}, output=3)
exp = ExperienceUKFT.from_cache_entry(cache_entry)
print(exp.name)  # Output: add(a=1, b=2)
```

This method automatically sets the `content_resources` field (including func, inputs, output, etc.) and configures commonly used composers:

- `default`/`instance`: Structured display of inputs and outputs
- `assertion`: Generate Python test assertions

<br/>

### 2.2. Composer Display Methods

ExperienceUKFT supports multiple content composers that can generate structured text or assertions for different scenarios.

<br/>

#### 2.2.1. instance_prompt_composer

Used to structurally display ExperienceUKFT's inputs, outputs, expected values, etc., typically combined with Jinja2 template rendering.

```python
kl.content_resources = {"func": "calculate", "inputs": {"x": 5}, "output": 20, "expected": 25}
print(kl.text("instance"))
# Output:
# Inputs:
# - x: 5
# Output:
# - 20
# Expected:
# - 25
```

<br/>

#### 2.2.2. assertion_composer

Automatically generates Python assertion statements for testing function outputs.

```python
kl.content_resources = {"func": "add", "inputs": {"a": 1, "b": 2}, "output": 3}
print(kl.text("assertion"))
# Output: assert (add(a=1, b=2) == 3)
```

<br/>

#### 2.2.3. Custom composer

You can extend custom content generation methods through the `content_composers` dictionary.

<br/>

### 2.3. Recommended Fields

- `func`: Function name
- `inputs`: Input parameter dictionary
- `output`: Actual output
- `expected`: Expected output (optional)
- `metadata`: Other metadata (optional)

<br/>

## 3. DocumentUKFT

`DocumentUKFT` is a document (or document block) entity used to store text-based information.

TODO

<br/>

<br/>

## 4. TemplateUKFT

`TemplateUKFT` is a template entity used to store Jinja2 templates or template definitions from other template systems.

TODO

<br/>
