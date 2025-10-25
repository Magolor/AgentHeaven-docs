# 字符串实用工具

`str_utils.py` 模块为 AgentHeaven 提供了一套全面的字符串操作和文本处理实用工具。这些工具包括文本规范化、n-gram 生成、字符串相似度计算和格式化函数。

<br/>

## 1. 字符串格式化

### 1.1. `indent()` - 字符串缩进

`indent()` 函数可以为多行字符串添加缩进：

```python
from ahvn.utils.basic.str_utils import indent

# 使用空格
text = "Line 1\nLine 2\nLine 3"
indented = indent(text, 4)
print(indented)
#     Line 1
#     Line 2
#     Line 3

# 使用自定义制表符
indented = indent(text, "  ")
print(indented)
#   Line 1
#   Line 2
#   Line 3
```

<br/>

## 2. 文本处理

### 2.1. `is_delimiter()` - 单词边界检测

`is_delimiter()` 函数检查一个字符是否作为单词边界：

```python
from ahvn.utils.basic.str_utils import is_delimiter

# 检查各种字符
print(is_delimiter(' '))   # True (空白符)
print(is_delimiter('.'))   # True (标点符号)
print(is_delimiter('a'))   # False (字母数字)
print(is_delimiter('\n'))  # True (空白符)
```

<br/>

### 2.2. `normalize_text()` - 文本规范化

`normalize_text()` 函数执行全面的文本规范化，包括分词、停用词移除、词形还原和转为小写：

```python
from ahvn.utils.basic.str_utils import normalize_text

# 规范化文本
text = "The quick brown foxes are running!"
normalized = normalize_text(text)
print(normalized)
# "quick brown fox run"

# 带标点的复杂文本
text = "Hello, world! How are you doing today?"
normalized = normalize_text(text)
print(normalized)
# "hello world today"
```

> **注意：** 此函数需要安装 spaCy 和 `en_core_web_sm` 模型。该模型在首次使用时延迟加载。
> ```bash
> pip install spacy
> python -m spacy download en_core_web_sm
> ```

<br/>

## 3. N-gram 分析

### 3.1. `generate_ngrams()` - N-gram 生成

`generate_ngrams()` 函数从一个令牌（token）列表中创建 n-gram：

```python
from ahvn.utils.basic.str_utils import generate_ngrams

# 从令牌生成 n-gram
tokens = ["the", "quick", "brown", "fox"]
ngrams = generate_ngrams(tokens, n=3)
print(sorted(ngrams))
# ['brown', 'brown fox', 'fox', 'quick', 'quick brown', 'quick brown fox', 'the', 'the quick', 'the quick brown']

# 单个令牌
tokens = ["hello"]
ngrams = generate_ngrams(tokens, n=2)
print(ngrams)
# {'hello'}
```

<br/>

### 3.2. `asymmetric_jaccard_score()` - 文本相似度

`asymmetric_jaccard_score()` 函数使用 n-gram 分析来计算一个文档中包含多少查询内容。`ngram` 参数默认为 `6`。

```python
from ahvn.utils.basic.str_utils import asymmetric_jaccard_score

# 计算包含分数
query = "quick brown fox"
doc = "The quick brown fox jumps over the lazy dog"
score = asymmetric_jaccard_score(query, doc)
print(f"包含分数: {score:.3f}")
# 包含分数: 0.875

# 查询在文档中没有很好的包含
query = "machine learning algorithms"
doc = "The quick brown fox jumps"
score = asymmetric_jaccard_score(query, doc, ngram=2)
print(f"包含分数: {score:.3f}")
# 包含分数: 0.000
```

该函数的工作原理如下：
1. 规范化查询和文档的文本
2. 从规范化后的令牌生成 n-gram
3. 计算查询 n-gram 在文档中出现的比例

<br/>

## 4. 冲突解决

### 4.1. `resolve_match_conflicts()` - 解决重叠匹配

`resolve_match_conflicts()` 函数根据指定的策略从搜索结果中过滤重叠的文本范围。当多个实体在查询字符串中的相同或重叠位置匹配时，此功能非常有用。

```python
from ahvn.utils.basic.str_utils import resolve_match_conflicts

results = [
    {'id': 1, 'matches': [(0, 5), (10, 15), (22, 27), (32, 37)]},
    {'id': 2, 'matches': [(2, 8), (12, 18), (21, 27), (32, 38)]}
]

# 使用 "longest" 策略
filtered_results = resolve_match_conflicts(results, conflict="longest", query_length=40)
print(filtered_results)
# [{'id': 1, 'matches': [(0, 5), (10, 15)]}, {'id': 2, 'matches': [(21, 27), (32, 38)]}]
```

该函数支持以下冲突解决策略：
- **`overlap`**: (默认) 保留所有匹配，包括重叠的匹配。
- **`longest`**: 对于任何一组重叠的匹配，只保留最长的一个。
- **`longest_distinct`**: 允许多个实体有重叠的匹配，但前提是它们是各自实体中最长的匹配。

<br/>

## 5. 使用示例

### 5.1. 基本字符串处理流程

```python
from ahvn.utils.basic.str_utils import (
    normalize_text, 
    generate_ngrams, 
    asymmetric_jaccard_score
)

# 处理和分析文本
def analyze_text_similarity(query, documents):
    # 对查询进行一次规范化
    normalized_query = normalize_text(query)
    query_tokens = normalized_query.split()
    
    results = []
    for doc in documents:
        # 计算相似度分数
        score = asymmetric_jaccard_score(query, doc)
        results.append((doc, score))
    
    # 按相似度排序
    return sorted(results, key=lambda x: x[1], reverse=True)

# 示例用法
query = "artificial intelligence"
docs = [
    "Machine learning and artificial intelligence research",
    "Natural language processing techniques", 
    "AI and deep learning applications"
]

ranked_docs = analyze_text_similarity(query, docs)
for doc, score in ranked_docs:
    print(f"分数: {score:.3f} - {doc}")
```

<br/>

### 5.2. 文本格式化工作流

```python
from ahvn.utils.basic.str_utils import indent, is_delimiter

def format_code_block(code, indent_size=4):
    # 为代码添加缩进
    indented_code = indent(code, indent_size)
    
    # 包装在 markdown 代码块中
    return f"```\n{indented_code}\n```"

# 示例
python_code = "def hello():\n    print('Hello, World!')"
formatted = format_code_block(python_code)
print(formatted)
```

<br/>

## 拓展阅读

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
