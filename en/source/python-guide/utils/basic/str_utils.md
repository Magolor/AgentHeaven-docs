# String Utilities

The `str_utils.py` module provides a comprehensive set of string manipulation and text processing utilities for AgentHeaven. These utilities include text normalization, n-gram generation, string similarity calculations, and formatting functions.

<br/>

## 1. String Formatting

### 1.1. `indent()` - String Indentation

The `indent()` function adds indentation to multi-line strings:

```python
from ahvn.utils.basic.str_utils import indent

# Using spaces
text = "Line 1\nLine 2\nLine 3"
indented = indent(text, 4)
print(indented)
#     Line 1
#     Line 2
#     Line 3

# Using custom tab character
indented = indent(text, "  ")
print(indented)
#   Line 1
#   Line 2
#   Line 3
```

<br/>

## 2. Text Processing

### 2.1. `is_delimiter()` - Word Boundary Detection

The `is_delimiter()` function checks if a character serves as a word boundary:

```python
from ahvn.utils.basic.str_utils import is_delimiter

# Check various characters
print(is_delimiter(' '))   # True (whitespace)
print(is_delimiter('.'))   # True (punctuation)
print(is_delimiter('a'))   # False (alphanumeric)
print(is_delimiter('\n'))  # True (whitespace)
```

<br/>

### 2.2. `normalize_text()` - Text Normalization

The `normalize_text()` function performs comprehensive text normalization including tokenization, stop word removal, lemmatization, and lowercasing:

```python
from ahvn.utils.basic.str_utils import normalize_text

# Normalize text
text = "The quick brown foxes are running!"
normalized = normalize_text(text)
print(normalized)
# "quick brown fox run"

# Complex text with punctuation
text = "Hello, world! How are you doing today?"
normalized = normalize_text(text)
print(normalized)
# "hello world today"
```

> **Note:** This function requires spaCy and the `en_core_web_sm` model to be installed. The model is loaded lazily on first use.
> ```bash
> pip install spacy
> python -m spacy download en_core_web_sm
> ```

<br/>

## 3. N-gram Analysis

### 3.1. `generate_ngrams()` - N-gram Generation

The `generate_ngrams()` function creates n-grams from a list of tokens:

```python
from ahvn.utils.basic.str_utils import generate_ngrams

# Generate n-grams from tokens
tokens = ["the", "quick", "brown", "fox"]
ngrams = generate_ngrams(tokens, n=3)
print(sorted(ngrams))
# ['brown', 'brown fox', 'fox', 'quick', 'quick brown', 'quick brown fox', 'the', 'the quick', 'the quick brown']

# Single token
tokens = ["hello"]
ngrams = generate_ngrams(tokens, n=2)
print(ngrams)
# {'hello'}
```

<br/>

### 3.2. `asymmetric_jaccard_score()` - Text Similarity

The `asymmetric_jaccard_score()` function calculates how much of a query is contained within a document using n-gram analysis. The `ngram` parameter defaults to `6`.

```python
from ahvn.utils.basic.str_utils import asymmetric_jaccard_score

# Calculate containment score
query = "quick brown fox"
doc = "The quick brown fox jumps over the lazy dog"
score = asymmetric_jaccard_score(query, doc)
print(f"Containment score: {score:.3f}")
# Containment score: 0.875

# Query not well contained in document
query = "machine learning algorithms"
doc = "The quick brown fox jumps"
score = asymmetric_jaccard_score(query, doc, ngram=2)
print(f"Containment score: {score:.3f}")
# Containment score: 0.000
```

The function works by:
1. Normalizing both query and document text
2. Generating n-grams from the normalized tokens
3. Calculating what fraction of query n-grams appear in the document

<br/>

## 4. Conflict Resolution

### 4.1. `resolve_match_conflicts()` - Resolve Overlapping Matches

The `resolve_match_conflicts()` function filters overlapping text spans from search results based on a specified strategy. This is useful when multiple entities match at the same or overlapping positions in a query string.

```python
from ahvn.utils.basic.str_utils import resolve_match_conflicts

results = [
    {'id': 1, 'matches': [(0, 5), (10, 15), (22, 27), (32, 37)]},
    {'id': 2, 'matches': [(2, 8), (12, 18), (21, 27), (32, 38)]}
]

# Using the "longest" strategy
filtered_results = resolve_match_conflicts(results, conflict="longest", query_length=40)
print(filtered_results)
# [{'id': 1, 'matches': [(0, 5), (10, 15)]}, {'id': 2, 'matches': [(21, 27), (32, 38)]}]
```

The function supports the following conflict resolution strategies:
- **`overlap`**: (Default) Keeps all matches, including overlapping ones.
- **`longest`**: For any set of overlapping matches, it keeps only the longest one.
- **`longest_distinct`**: Allows multiple entities to have overlapping matches, but only if they are the longest matches for their respective entities.

<br/>

## 5. Usage Examples

### 5.1. Basic String Processing Pipeline

```python
from ahvn.utils.basic.str_utils import (
    normalize_text, 
    generate_ngrams, 
    asymmetric_jaccard_score
)

# Process and analyze text
def analyze_text_similarity(query, documents):
    # Normalize query once
    normalized_query = normalize_text(query)
    query_tokens = normalized_query.split()
    
    results = []
    for doc in documents:
        # Calculate similarity score
        score = asymmetric_jaccard_score(query, doc)
        results.append((doc, score))
    
    # Sort by similarity
    return sorted(results, key=lambda x: x[1], reverse=True)

# Example usage
query = "artificial intelligence"
docs = [
    "Machine learning and artificial intelligence research",
    "Natural language processing techniques", 
    "AI and deep learning applications"
]

ranked_docs = analyze_text_similarity(query, docs)
for doc, score in ranked_docs:
    print(f"Score: {score:.3f} - {doc}")
```

<br/>

### 5.2. Text Formatting Workflow

```python
from ahvn.utils.basic.str_utils import indent, is_delimiter

def format_code_block(code, indent_size=4):
    # Add indentation to code
    indented_code = indent(code, indent_size)
    
    # Wrap in markdown code block
    return f"```\n{indented_code}\n```"

# Example
python_code = "def hello():\n    print('Hello, World!')"
formatted = format_code_block(python_code)
print(formatted)
```

<br/>

## Further Exploration

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
