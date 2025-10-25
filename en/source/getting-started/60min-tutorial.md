# 60min Tutorial

Here are some simple toy-examples that step-by-step introduces the concepts and features of AgentHeaven, leading to a knowledge management system use case in a meaningful application.

## Level 1: Function Cache

Consider the following naive recursive implementation of the Fibonacci sequence:

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

The time complexity of this implementation is exponential. Now we use AgentHeaven's cache system (like diskcache) to optimize it:

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

To understand what happened in the cache, let's output the cache contents after the function calls:

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

We can see how the cache is populated with intermediate results, significantly improving the performance of our Fibonacci function (now it is linear).

Notice that the cache contains a key `expected`, which allows human intervention to verify the correctness of the cached results.

For example, let's annotate `fibonacci(42) = "Answer to the Ultimate Question of Life, the Universe, and Everything"`:
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

## Level 2: LLM Cache

If cache is applicable to any function, it sure is applicable to an LLM.

Let's first create an LLM. AgentHeaven uses [LiteLLM](https://www.litellm.ai/) as a universal provider, with cutomizable presets in Agentheaven's config.

For this example, we use the default local model (qwen3:8b) through [Ollama](https://ollama.com/). For advanced settings on LLMs, see [Setup](../getting-started/setup.md) and [LLM Integration](../python-guide/llm.md).

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

It is observed that only the first call to the LLM incurs the cost of computation, while subsequent calls retrieve the result from the cache almost instantly.

<br/>

## Level 3: Auto Function

Now let's combine the use of caching with LLM.

First, instead of implementing the fibonacci function (with artifact at 42), let's use an LLM to do it for us:

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

Obviously, the capabilities of `autofunc` is more than just computing fibonacci. This is now a universal approach for implementing AI functions with few-shot ICL (In-Context Learning) LLM inferences.

Notice that now we manually crafted the examples. Yet the examples can be exported from cache. For example, we can create annotations in cache and export them:

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

## Level 4: Knowledge Storage

Finally, let's introduce the concept of knowledge. Each cached entry can be viewed as a piece of knowledge (specifically, a knowledge of type `ExperienceUKFT`) that the system can leverage in future interactions.

All knowledges in AgentHeaven follows the [Unified Knowledge Format (UKF)](../python-guide/ukf/index.md), which is the `BaseUKF` class in the `ahvn` module. `ExperienceUKFT` is a subclass of `BaseUKF`, which supports exported from cache entries and then used as few-shot examples, like we've seen above in the fibonacci autofunc example. AgentHeaven uses `KLStore` to store and manage knowledge.

When knowledge are stored as UKF, a much more powerful representation than cache entry and carries more information. In the `KLStore`, they can be managed, retrieved and utilized more effectively:

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

Or, for a more structured view of UKF in `KLStore`, try `DatabaseKLStore`:

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

`KLStore` are merely storage that supports CRUD operations. The real power of knowledge comes from the UKF definition and its utilizations.

For a naive example, by default `ExperienceUKFT` instances can be serialized to assertion statements that can be used for generating unit tests:

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

Nevertheless, the `KLStore` only offers basic CRUD operations, we can't really see how UKF can be utilized effectively. In the next level, we will see how knowledge can be retrieved and utilized.

<br/>

## Level 5: Knowledge Retrieval

Now that we have knowledge stored, we need to retrieve it effectively. AgentHeaven provides `KLEngine` to enable powerful search capabilities over stored knowledge. Let's explore two types of engines: `FacetKLEngine` for structured filtering and `DAACKLEngine` for autocomplete-style text search.

First, let's create more diverse knowledge including both factual knowledge and experiences:

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

Now let's set up search engines:

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

Search for knowledge about "42" (using synonyms):

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

Search for knowledge about "Fibonacci primes" (using synonyms):

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

Search for actual values of fibonacci primes (using faceted search):

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

In the next level, we'll integrate everything into a unified `KLBase` that orchestrates multiple storage and search engines.

<br/>

## Level 6: Knowledge Management

So far we've seen individual components: cache, knowledge storage, and search engines. Now let's integrate them into a unified `KLBase` - a comprehensive knowledge management system that orchestrates multiple storage backends and search engines.

`KLBase` serves as the central hub that:
- Manages multiple `KLStore` instances for different storage needs
- Coordinates multiple `KLEngine` instances for diverse search capabilities
- Provides a unified interface for knowledge operations
- Can be extended with custom tools for agent integration

Since AgentHeaven does not aim to replace Agent frameworks, while an out-of-the-box agent integration is provided, users are encouraged to build custom tools that fit their specific agent frameworks and workflows. Specifically, upon building a new domain-specific application, the developer is expected to inherit the `KLBase` class to customize which storages and engines to use, as well as the search they want to provide to the agent.

Let's build a complete knowledge base using a cold and hot knowledge store, with vector, facet, and ac engines for diverse retrieval capabilities:

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

Now we have a `KLBase` with multiple storages and engines, which now looks just like a wrapped composite of the previous KLStores and KLEngines. The only difference we introduce here is the `condition` parameter of the engines and stores. Using `condition`, we can filter which knowledge go into which storage or engine. For example, in the above code, we only store knowledge of type "knowledge" in the autocomplete engines, and only knowledge of type "experience" in the vector engine.

Similar to the previous example, we can add knowledge to the base:

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

Now we can search across all engines by specifying the engine name in the `klbase.search()` method:

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

With `KLBase`, we have a unified, powerful knowledge management system. In the next level, we'll see how to unleash the full potential of KLBase and further integrate this into agent workflows using `ToolSpec`.

<br/>

## Level 7: ToolSpec and Agent Integration

TODO

<br/>

## Level 8: Boosting KLBase with Imitator

TODO

<br/>

## Level 9: Building an Actual, Meaningful Application

TODO

<br/>

## Further Exploration

> **Tip:** For more information about core AgentHeaven modules, see:
> - [Main Guide (Python)](../python-guide/index.md) - Documentation of the full AgentHeaven Python SDK
> - [Example Applications](../example-applications/index.md) - Cases of meaningful applications built with AgentHeaven

<br/>
