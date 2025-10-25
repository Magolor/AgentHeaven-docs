# 内置模板

## 1. KnowledgeUKFT

`KnowledgeUKFT` 是通用知识实体，用于存储各种类型的信息。

<br/>

### 1.1. 使用示例

```python
from ahvn.ukf import KnowledgeUKFT

# 创建基本的 KnowledgeUKFT 实例
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

`ExperienceUKFT` 经验类是用于存储函数输入输出对以及标注数据，支持自动从缓存 `CacheEntry` 或字典对象构建实例，并通过多种方式进行内容展示。

<br/>

### 2.1. 从 CacheEntry 构建 ExperienceUKFT

可以通过 `ExperienceUKFT.from_cache_entry(entry)` 方法，直接将缓存的函数调用结果（如 `CacheEntry` 或字典）转为 ExperienceUKFT 实例。

```python
cache_entry = CacheEntry(func="add", inputs={"a": 1, "b": 2}, output=3)
exp = ExperienceUKFT.from_cache_entry(cache_entry)
print(exp.name)  # 输出：add(a=1, b=2)
```

该方法会自动设置 `content_resources` 字段（包含 func、inputs、output 等），并配置常用的 composer：

- `default`/`instance`：结构化展示输入输出
- `assertion`：生成 Python 测试断言

<br/>

### 2.2. Composer 展示方式

ExperienceUKFT 支持多种内容合成器（composer），可根据不同场景生成结构化文本或断言。

<br/>

#### 2.2.1. instance_prompt_composer

用于结构化展示 ExperienceUKFT 的输入、输出、期望值等，通常结合 Jinja2 模板渲染。

```python
kl.content_resources = {"func": "calculate", "inputs": {"x": 5}, "output": 20, "expected": 25}
print(kl.text("instance"))
# 输出：
# Inputs:
# - x: 5
# Output:
# - 20
# Expected:
# - 25
```

<br/>

#### 2.2.2. assertion_composer

自动生成 Python 断言语句，便于测试函数输出。

```python
kl.content_resources = {"func": "add", "inputs": {"a": 1, "b": 2}, "output": 3}
print(kl.text("assertion"))
# 输出：assert (add(a=1, b=2) == 3)
```

<br/>

#### 2.2.3. 自定义 composer

可通过 `content_composers` 字典扩展自定义内容生成方式。

<br/>

### 2.3. 推荐字段

- `func`：函数名
- `inputs`：输入参数字典
- `output`：实际输出
- `expected`：期望输出（可选）
- `metadata`：其他元信息（可选）

<br/>

## 3. DocumentUKFT

`DocumentUKFT` 是文档（或文档块）实体，用于存储基于文本的信息。

TODO

<br/>

<br/>

## 4. TemplateUKFT

`TemplateUKFT` 是模板实体，用于存储Jinja2模板或其他模板系统的模板定义。

TODO

<br/>
