# 60 分钟教程

这里有一些简单的玩具示例，逐步介绍 AgentHeaven 的概念和功能，最终带出一个有意义的知识管理系统用例。

## 第1级：函数缓存

考虑下面这个朴素的递归实现斐波那契数列的例子：

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)


print(fibonacci(10))
# print(fibonacci(60))     # Too slow
```

```
>> 55
```

该实现的时间复杂度是指数级的。现在我们使用 AgentHeaven 的缓存系统（类似 diskcache）来优化它：

```python
from ahvn import InMemCache

cache = InMemCache()


@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 2) + fibonacci(n - 1)


print(fibonacci(60))
```

```
>> 1548008755920
```

为了了解缓存中发生了什么，我们在函数调用后输出缓存的内容：

```python
for entry in cache:
    print(entry)
```

```
>> CacheEntry(func='fibonacci', inputs={'n': 0}, output=0, expected=Ellipsis, metadata={}, _key=40844552477485964873833877590705997385)
>> CacheEntry(func='fibonacci', inputs={'n': 1}, output=1, expected=Ellipsis, metadata={}, _key=234639375076406184388847613179489337225)
>> CacheEntry(func='fibonacci', inputs={'n': 2}, output=1, expected=Ellipsis, metadata={}, _key=306930591098636910896220234106169164060)
>> CacheEntry(func='fibonacci', inputs={'n': 3}, output=2, expected=Ellipsis, metadata={}, _key=106259342686184100204491642584171448114)
>> CacheEntry(func='fibonacci', inputs={'n': 4}, output=3, expected=Ellipsis, metadata={}, _key=303375194645784228785157125824794664211)
>> CacheEntry(func='fibonacci', inputs={'n': 5}, output=5, expected=Ellipsis, metadata={}, _key=280884837335060211149742954094243453247)
...
>> CacheEntry(func='fibonacci', inputs={'n': 58}, output=591286729879, expected=Ellipsis, metadata={}, _key=37163307098918357683251741339491369545)
>> CacheEntry(func='fibonacci', inputs={'n': 59}, output=956722026041, expected=Ellipsis, metadata={}, _key=102083246833177508137381571628365689399)
>> CacheEntry(func='fibonacci', inputs={'n': 60}, output=1548008755920, expected=Ellipsis, metadata={}, _key=166602100582307906362221505176331152801)
```

可以看到缓存如何保存中间结果，从而显著提升斐波那契函数的性能（现在变为线性时间）。

注意缓存中包含一个 `expected` 键，允许人工干预以校验缓存结果的正确性。

例如，我们可以为 `fibonacci(42)` 添加注释：
```python
cache.annotate("fibonacci", n=42, expected="Answer to the Ultimate Question of Life, the Universe, and Everything")

print(fibonacci(42))
print(fibonacci(43))
```

```
>> Answer to the Ultimate Question of Life, the Universe, and Everything
>> 433494437
```

<br/>

## 第2级：LLM 缓存

如果缓存适用于任意函数，那它同样适用于 LLM。

我们先创建一个 LLM。AgentHeaven 使用 [LiteLLM](https://www.litellm.ai/) 作为通用提供器，并在配置中支持可定制的预设。

在本示例中，我们通过 [Ollama](https://ollama.com/) 使用默认的本地模型（qwen3:8b）。关于 LLM 的高级配置，请参见 [设置](../getting-started/setup.md) 和 [LLM 集成](../python-guide/llm.md)。

```python
from ahvn import InMemCache

cache = InMemCache()

from ahvn import LLM

llm = LLM(preset='tiny', cache=cache)
query = "What is the Answer to the Ultimate Question of Life, the Universe, and Everything? Respond with the answer only."

for chunk in llm.stream(query):
    print(chunk, end='')
print()
for chunk in llm.stream(query):
    print(chunk, end='')
print()
for chunk in llm.stream(query):
    print(chunk, end='')
print()
```

```
>>> 42
>>> 42
>>> 42
```

可以观察到：只有第一次调用 LLM 会产生计算开销，后续调用几乎立即从缓存中返回结果。

<br/>

## 第3级：自动函数

现在我们把缓存与 LLM 结合起来。

首先，不再手动实现函数，而是让 LLM 为我们生成实现（并在 n=42 的情况下返回特殊字符串）：

```python
from ahvn import autofunc

def fibonacci(n: int) -> int:
    """\
    Compute the nth Fibonacci number.
    However, as a corner case, when asked about `fibonacci(42)`, you should respond with a string:
        "Answer to the Ultimate Question of Life, the Universe, and Everything"

    Args:
        n (int): The position in the Fibonacci sequence.

    Returns:
        int: The nth Fibonacci number.
    """
    pass

examples = [
    {"inputs": {"n": 0}, "expected": 0},
    {"inputs": {"n": 1}, "expected": 1},
    {"inputs": {"n": 2}, "expected": 1},
    {"inputs": {"n": 58}, "expected": 591286729879},
    {"inputs": {"n": 59}, "expected": 956722026041}
]

print(autofunc(fibonacci, inputs={"n": 60}, examples=examples, llm_args={"preset": "tiny"}))
print(autofunc(fibonacci, inputs={"n": 42}, examples=examples, llm_args={"preset": "tiny"}))
```

```
>>> 1548008755920
>>> Answer to the Ultimate Question of Life, the Universe, and Everything
```

显然，`autofunc` 的能力远不止计算斐波那契数：它是通过少样本（In-Context Learning）LLM 推理来实现 AI 函数的一种通用方法。

注意上面示例中的手工示例；这些示例也可以从缓存中导出。例如：

```python
from ahvn import InMemCache

cache = InMemCache()
cache.annotate("fibonacci", n=0, expected=0)
cache.annotate("fibonacci", n=1, expected=1)
cache.annotate("fibonacci", n=2, expected=1)
cache.annotate("fibonacci", n=58, expected=591286729879)
cache.annotate("fibonacci", n=59, expected=956722026041)
examples = [entry.to_dict() for entry in cache]

for example in examples:
    print(example)
```

```
>> {'func': 'fibonacci', 'inputs': {'n': 0}, 'output': 0, 'expected': 0, 'metadata': {}}
>> {'func': 'fibonacci', 'inputs': {'n': 1}, 'output': 1, 'expected': 1, 'metadata': {}}
>> {'func': 'fibonacci', 'inputs': {'n': 2}, 'output': 1, 'expected': 1, 'metadata': {}}
>> {'func': 'fibonacci', 'inputs': {'n': 58}, 'output': 591286729879, 'expected': 591286729879, 'metadata': {}}
>> {'func': 'fibonacci', 'inputs': {'n': 59}, 'output': 956722026041, 'expected': 956722026041, 'metadata': {}}
```

<br/>

## 第4级：知识存储

最后，让我们介绍“知识”的概念。每个缓存条目都可以被视为一条知识（在此示例中为 `ExperienceUKFT` 类型），系统可以在将来的交互中利用这些知识。

AgentHeaven 中的所有知识遵循[统一知识格式（UKF）](../python-guide/ukf/index.md)，即 `ahvn` 模块中的 `BaseUKF` 类。`ExperienceUKFT` 是 `BaseUKF` 的子类，支持从缓存条目导出并作为少样本示例使用（正如上文 autofunc 示例所示）。AgentHeaven 使用 `KLStore` 来存储和管理这些知识。

当知识以 UKF 形式保存时，它比简单缓存条目携带更多信息并拥有更强的表达能力。在 `KLStore` 中，这些知识可以被更高效地管理、检索与利用。示例如下：

```python
from ahvn import InMemCache, CacheKLStore, ExperienceUKFT

cache = InMemCache()
klstore = CacheKLStore(name="klstore", cache=InMemCache())

@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 2) + fibonacci(n - 1)

# Cache the results
fibonacci(10)

# Store them as experiences
klstore.batch_upsert([
    ExperienceUKFT.from_cache_entry(entry)
    for entry in cache
])
```

或者，如果你想把 UKF 存入更结构化的存储，可以使用 `DatabaseKLStore`：

```python
from ahvn import InMemCache, DatabaseKLStore, ExperienceUKFT

cache = InMemCache()
klstore = DatabaseKLStore(name="klstore", provider='sqlite', database="./fib.db")

@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 2) + fibonacci(n - 1)

# Cache the results
fibonacci(10)

# Store them as experiences
klstore.batch_upsert([
    ExperienceUKFT.from_cache_entry(entry)
    for entry in cache
])
```

`KLStore` 本身只是提供 CRUD 操作；知识的真正力量源于 UKF 定义及其使用方式。

举一个简单的例子，默认情况下 `ExperienceUKFT` 实例可以被序列化为断言语句，用于生成单元测试：

```python
for kl in klstore:
    print(kl.text(composer='assertion'))
```

```
>> assert (fibonacci(n=0) == 0)
>> assert (fibonacci(n=1) == 1)
>> assert (fibonacci(n=2) == 1)
>> assert (fibonacci(n=3) == 2)
>> assert (fibonacci(n=4) == 3)
>> assert (fibonacci(n=5) == 5)
>> assert (fibonacci(n=6) == 8)
>> assert (fibonacci(n=7) == 13)
>> assert (fibonacci(n=8) == 21)
>> assert (fibonacci(n=9) == 34)
>> assert (fibonacci(n=10) == 55)
```

然而，`KLStore` 仅提供基础的 CRUD 能力，我们还不能完全看到 UKF 的强大用途。在下一节中，我们将了解如何检索并利用这些知识。

<br/>

## 第5级：知识检索

现在我们已有了存储的知识，需要有效地检索它们。AgentHeaven 提供了 `KLEngine` 来对存储的知识进行强大的检索。接下来我们将探索两类引擎：用于结构化过滤的 `FacetKLEngine`，和用于自动补全式文本搜索的 `DAACKLEngine`。

首先，我们创建一些更丰富的知识，包括事实型知识和经验型知识：

```python
from ahvn.ukf import ptags, KnowledgeUKFT, ExperienceUKFT
from ahvn.cache import InMemCache
from ahvn.klstore import DatabaseKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine
from ahvn.utils.db.facet import Facet

cache = InMemCache()
klstore = DatabaseKLStore(name="klstore", provider='sqlite', database="./knowledge.db")

# Create factual knowledge
kl1 = KnowledgeUKFT(
    name="Fibonacci Sequence",
    content="The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.",
    tags=ptags(TOPIC="math", ENTITY="concept"),
    synonyms=["Fibonacci numbers", "Fibonacci series"],
)
kl2 = KnowledgeUKFT(
    name="The Number 42",
    content="In Douglas Adams' science fiction series 'The Hitchhiker's Guide to the Galaxy', the number 42 is humorously presented as the ultimate answer to the meaning of life, the universe, and everything.",
    tags=ptags(TOPIC="fiction", ENTITY="concept", NUMBER="42"),
    synonyms=["42", "The Answer", "Answer to the Universe"],
)
kl3 = KnowledgeUKFT(
    name="Leonardo Fibonacci",
    content="Leonardo Fibonacci was an Italian mathematician from Pisa, known for introducing the Fibonacci sequence to Western mathematics in his 1202 book Liber Abaci.",
    tags=ptags(TOPIC="math", ENTITY="person"),
    synonyms=["Leonardo of Pisa", "Fibonacci"],
)
kl4 = KnowledgeUKFT(
    name="Fibonacci Prime Numbers",
    content="Fibonacci prime numbers are Fibonacci numbers that are also prime. All verified Fibonacci primes have a prime index except for fibonacci(4)=3.",
    tags=ptags(TOPIC="math", ENTITY="concept"),
    synonyms=["Fibonacci primes", "Prime Fibonacci numbers"],
)
klstore.batch_upsert([kl1, kl2, kl3, kl4])

# Generate fibonacci experiences
@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 2) + fibonacci(n - 1)

fibonacci(60)

# Store experiences with tags indicating which numbers are prime
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

exps = [
    ExperienceUKFT.from_cache_entry(
        entry,
        content=f"fibonacci({entry.inputs['n']}) = {entry.output}",
        tags=ptags(
            TOPIC="math",
            PROPERTY="prime" if is_prime(entry.output) else "composite",
            NUMBER=[str(entry.inputs['n']), str(entry.output)]
        ),
        synonyms=[f"fibonacci({entry.inputs['n']})", f"{entry.inputs['n']}", f"{entry.output}"]
    ) for entry in cache
]
klstore.batch_upsert(exps)
```

现在我们来建立检索引擎：

```python
# FacetKLEngine: For structured tag-based filtering
facet_engine = FacetKLEngine(
    name="facet_engine",
    storage=klstore,
    inplace=True,
)

# DAACKLEngine: For autocomplete text search on synonyms
ac_engine = DAACKLEngine(
    name="ac_engine",
    storage=klstore,
    path="./ac_index",
    encoder=lambda kl: [syn or "" for syn in kl.synonyms], # using synonyms for search
)

# Add the klowledge to the engines from the store
facet_engine.sync()
ac_engine.sync()
```

使用同义词搜索关于“42”的知识：

```python
print("===== Search for knowledge about '42' =====")
results = ac_engine.search(query="42", topk=3)
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: {kl.content[:80]}...")
```

```
===== Search for knowledge about '42' (using synonyms) =====
- The Number 42: In Douglas Adams' science fiction series 'The Hitchhiker's Guide to the Galaxy',...
- fibonacci(n=42): fibonacci(42) = 267914296...
```

使用同义词搜索“Fibonacci primes”：

```python
print("===== Search for knowledge about 'Fibonacci primes' =====")
results = ac_engine.search(query="Fibonacci primes", topk=3)
for result in results:
    kl = result['kl']
    print(f"- {kl.name}: {kl.content[:80]}...")
```

```
===== Search for knowledge about 'Fibonacci primes' =====
- Fibonacci Prime Numbers: Fibonacci prime numbers are Fibonacci numbers that are also prime. All verified ...
- Leonardo Fibonacci: Leonardo Fibonacci was an Italian mathematician from Pisa, known for introducing...
```

使用分面检索实际的斐波那契素数值：

```python
print("===== Search for fibonacci primes =====")
results = facet_engine.search(
    mode='facet',
    tags=Facet.NF(slot="PROPERTY", value="prime"),
    type="experience"
)
for result in results:
    kl = result['kl']
    fib_n = kl.content_resources['inputs']['n']
    fib_val = kl.content_resources['output']
    print(f"- fibonacci({fib_n}) = {fib_val} (prime)")
```

```
===== Search for fibonacci primes =====
- fibonacci(3) = 2 (prime)
- fibonacci(4) = 3 (prime)
- fibonacci(5) = 5 (prime)
- fibonacci(7) = 13 (prime)
- fibonacci(11) = 89 (prime)
- fibonacci(13) = 233 (prime)
- fibonacci(17) = 1597 (prime)
- fibonacci(23) = 28657 (prime)
- fibonacci(29) = 514229 (prime)
- fibonacci(43) = 433494437 (prime)
- fibonacci(47) = 2971215073 (prime)
```

在下一层中，我们将把所有组件整合到一个统一的 `KLBase`，它可以协调多个存储与检索引擎。

<br/>

## 第6级：知识管理

到目前为止，我们已经看到了独立组件：缓存、知识存储与检索引擎。现在我们将它们整合到一个统一的 `KLBase`——一个可协调多个存储后端和检索引擎的知识管理系统。

`KLBase` 作为中心枢纽，负责：
- 管理多个 `KLStore` 实例以满足不同存储需求
- 协调多个 `KLEngine` 实例以提供多样化的检索能力
- 提供统一的知识操作接口
- 可以扩展自定义工具以便接入 agent 工作流

由于 AgentHeaven 并不试图取代现有 agent 框架，尽管提供了开箱即用的 agent 集成，开发者仍被鼓励根据具体场景继承 `KLBase` 并自定义存储、引擎与检索策略。

下面我们构建一个完整的知识库示例，包含冷/热两类存储，以及向量、分面和自动补全检索引擎：

```python
from ahvn.ukf import ptags, KnowledgeUKFT, ExperienceUKFT
from ahvn.cache import InMemCache
from ahvn.klstore import DatabaseKLStore, CacheKLStore
from ahvn.klengine import FacetKLEngine, DAACKLEngine, VectorKLEngine
from ahvn.klbase import KLBase
from ahvn.utils.db.facet import Facet

class MyKLBase(KLBase):
    def __init__(self, name: str = "my_klbase"):
        super().__init__(name=name)
        
        # Add a database storage backend
        self.add_storage(
            DatabaseKLStore(
                name="main_storage",
                provider="sqlite",
                database="./my_knowledge.db"
            )
        )
        self.add_storage(
            CacheKLStore(
                name="hot_storage",
                cache=InMemCache()
            )
        )
        
        # Add FacetKLEngine for tag-based filtering
        self.add_engine(
            FacetKLEngine(
                name="facet_engine",
                storage=self.storages["main_storage"],
                inplace=True,
            )
        )
        
        # Add DAACKLEngine for autocomplete on knowledge names/content
        self.add_engine(
            DAACKLEngine(
                name="ac_engine_content",
                storage=self.storages["main_storage"],
                path="./ac_index_content",
                encoder=lambda kl: [kl.name, kl.content],
                condition=lambda kl: kl.type == "knowledge",
            )
        )
        
        # Add DAACKLEngine for autocomplete on synonyms
        self.add_engine(
            DAACKLEngine(
                name="ac_engine_synonyms",
                storage=self.storages["main_storage"],
                path="./ac_index_synonyms",
                encoder=lambda kl: [syn for syn in kl.synonyms],
            )
        )
        
        # Add VectorKLEngine for semantic search on experiences
        self.add_engine(
            VectorKLEngine(
                name="vec_engine",
                provider="lancedb",
                collection="experiences",
                storage=self.storages["main_storage"],
                uri="./vec_index_experiences",
                inplace=False,
                include=["id"],
                encoder=(
                    lambda kl: kl.content,
                    lambda query: query
                ),
                embedder="embedder",
                condition=lambda kl: kl.type == "experience",
            )
        )

# Create and populate the knowledge base
klbase = MyKLBase()
klbase.clear()  # Start fresh
```

现在我们有了一个包含多个存储与引擎的 `KLBase`。不同之处在于引擎与存储的 `condition` 参数，用来过滤哪些知识被放入对应的存储或引擎。例如上例中，只有 type 为 "knowledge" 的条目会被放入内容自动补全引擎，而只有 type 为 "experience" 的条目会被放入向量引擎。

接下来我们像之前一样将知识加入到 KLBase 中：

```python
# Add factual knowledge
kl1 = KnowledgeUKFT(
    name="Fibonacci Sequence",
    content="The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.",
    tags=ptags(TOPIC="math", ENTITY="concept"),
    synonyms=["Fibonacci numbers", "Fibonacci series"],
)
kl2 = KnowledgeUKFT(
    name="The Number 42",
    content="In Douglas Adams' science fiction series 'The Hitchhiker's Guide to the Galaxy', the number 42 is humorously presented as the ultimate answer to the meaning of life, the universe, and everything.",
    tags=ptags(TOPIC="fiction", ENTITY="concept", NUMBER="42"),
    synonyms=["42", "The Answer", "Answer to the Universe"],
)
kl3 = KnowledgeUKFT(
    name="Leonardo Fibonacci",
    content="Leonardo Fibonacci was an Italian mathematician from Pisa, known for introducing the Fibonacci sequence to Western mathematics in his 1202 book Liber Abaci.",
    tags=ptags(TOPIC="math", ENTITY="person"),
    synonyms=["Leonardo of Pisa", "Fibonacci"],
)
kl4 = KnowledgeUKFT(
    name="Fibonacci Prime Numbers",
    content="Fibonacci prime numbers are Fibonacci numbers that are also prime. All verified Fibonacci primes have a prime index except for fibonacci(4)=3.",
    tags=ptags(TOPIC="math", ENTITY="concept"),
    synonyms=["Fibonacci primes", "Prime Fibonacci numbers"],
)
klbase.batch_upsert([kl1, kl2, kl3, kl4])

# Generate and store fibonacci experiences
cache = InMemCache()

@cache.memoize()
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

fibonacci(60)

exps = [
    ExperienceUKFT.from_cache_entry(
        entry,
        content=f"fibonacci({entry.inputs['n']}) = {entry.output}",
        tags=ptags(TOPIC="math", NUMBER=[str(entry.inputs['n']), str(entry.output)]),
        synonyms=[f"fibonacci({entry.inputs['n']})", f"{entry.output}"]
    ) for entry in cache
]
klbase.batch_upsert(exps)
```

现在我们可以通过在 `klbase.search()` 中指定引擎名称来跨所有引擎检索：

```python
print("===== Facet Search: TOPIC=fiction =====")
for result in klbase.search(
    engine='facet_engine',
    mode='facet',
    tags=Facet.NF(slot="TOPIC", value=Facet.LIKE("fic%"))
):
    kl = result['kl']
    print(f"- {kl.name}: {kl.content[:80]}...")

print("\n===== Autocomplete Search: 'Fibonacci' =====")
for result in klbase.search(engine='ac_engine_content', query="Fibonacci"):
    kl = result['kl']
    print(f"- {kl.name}: {kl.content[:80]}...")

print("\n===== Synonym Search: '42' =====")
for result in klbase.search(engine='ac_engine_synonyms', query="42"):
    kl = result['kl']
    print(f"- {kl.name}: {kl.content[:80]}...")

print("\n===== Vector Search: 'fibonacci(43) = ?' =====")
for result in klbase.search(
    engine='vec_engine',
    query="fibonacci(43) = ?",
    include=["id", "kl", "score"],
    topk=3
):
    kl = result['kl']
    score = result['score']
    fib_n = kl.content_resources['inputs']['n']
    fib_val = kl.content_resources['output']
    print(f"- fibonacci({fib_n}) = {fib_val} (score: {score:.3f})")
```

```
===== Facet Search: TOPIC=fiction =====
- The Number 42: In Douglas Adams' science fiction series 'The Hitchhiker's Guide to the Galaxy',...

===== Autocomplete Search: 'Fibonacci' =====
- Leonardo Fibonacci: Leonardo Fibonacci was an Italian mathematician from Pisa, known for introducing...
- Fibonacci Prime Numbers: Fibonacci prime numbers are Fibonacci numbers that are also prime. All verified ...
- Fibonacci Sequence: The Fibonacci sequence is a series of numbers where each number is the sum of th...

===== Synonym Search: '42' =====
- The Number 42: In Douglas Adams' science fiction series 'The Hitchhiker's Guide to the Galaxy',...

===== Vector Search: 'fibonacci(43) = ?' =====
- fibonacci(43) = 433494437 (score: 0.870)
- fibonacci(4) = 3 (score: 0.869)
- fibonacci(3) = 2 (score: 0.806)
```

使用 `KLBase`，我们得到了一个统一而强大的知识管理系统。在下一层中，我们将看到如何释放 KLBase 的全部潜力，并通过 `ToolSpec` 将其更深入地集成到 agent 工作流中。

<br/>

## 第7级：ToolSpec 与 Agent 集成

TODO

<br/>

## 第8级：用 Imitator 强化 KLBase

TODO

<br/>

## 第9级：构建有实际意义的应用

TODO

<br/>

## 拓展阅读

> **提示：** 有关核心 AgentHeaven 模块的更多信息，请参见：
> - [主指南（Python）](../python-guide/index.md) - Documentation of the full AgentHeaven Python SDK
> - [示例应用](../example-applications/index.md) - Cases of meaningful applications built with AgentHeaven

<br/>
