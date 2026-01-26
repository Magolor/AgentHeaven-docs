# 5min Quick Start

Here is a simple example to get started quickly with AgentHeaven. Using a sentiment analysis scenario, we demonstrate how AgentHeaven utilizes experience to improve the accuracy of model responses.

## Dataset Preparation

Download the IMDb Movie Review Dataset:
https://ai.stanford.edu/~amaas/data/sentiment/

Process the data using your own script. The processed data format should be as follows, saved into a `dataset.json` file:

```
[
    {
        "text": "I had a heck of a good time viewing.....",
        "tag": "pos"
    },
    {
        "text": "I loved this film, at first....",
        "tag": "pos"
    }
]

```

## LLM Configuration
Refer to [LLM Configuration](../configuration/llm.md).

## Round 1: Initial QA
The autotask method below calls the Large Language Model (LLM) for sentiment analysis. The llm_args parameter specifies the model from the LLM configuration.

```
from ahvn.utils.exts.autotask import autotask
from ahvn.cache import JsonCache

analyzer_task = autotask(
    descriptions="Sentiment analysis. Rate the sentiment of the text from 1 to 10. Return an integer.",
    output_schema={"mode": "repr"},
    llm_args={"preset": "sys"},
)
```

Next, we declare a cache of type JsonCache. This is a built-in cache type in AgentHeaven that stores cache information locally in JSON format.
```
cache = JsonCache("./json_cache")
```

@cache.memoize() is a decorator. Methods decorated with this will cache the information of every function call.

```
@cache.memoize()
def sentiment_analyzer(text):
    return analyzer_task(inputs={"text": text})
```

Opening the cached JSON file, you can see that the function name, input information, and output information have all been cached.
```
{
    "func": "sentiment_analyzer",
    "inputs": {"text": "NOTE TO ALL DIRECTORS: Long is not necessarily..."},
    "output": 3,
    "metadata": {}
}
```

Using the previously acquired dataset.json, we call the autotask method to perform sentiment analysis. A score of 1 to 5 indicates negative sentiment, and 6 to 10 indicates positive sentiment. The complete code is as follows:
```
cache = JsonCache("./json_cache")

@cache.memoize()
def sentiment_analyzer(text):
    return analyzer_task(inputs={"text": text})

def evaluate_accuracy(json_file_path): 
    with open(json_file_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    total_count = len(dataset)
    correct_count = 0  # Initialize counter

    for i, item in enumerate(dataset, 1):
        text = item.get('text')
        true_tag = item.get('tag')
        
        # Get rating
        prediction_raw = sentiment_analyzer(text)
        score = int(prediction_raw)

        is_correct = False
        
        if true_tag == 'neg' and 1 <= score <= 5:
            is_correct = True
        elif true_tag == 'pos' and 6 <= score <= 10:
            is_correct = True
            
        if is_correct:
            correct_count += 1

    accuracy = (correct_count / total_count) * 100
    
    print(f"Total samples: {total_count}")
    print(f"Correct samples: {correct_count}")
    print(f"Final Accuracy: {accuracy:.2f}%")

if __name__ == '__main__':
    evaluate_accuracy('dataset.json')
```

```
>> Total samples: 400
>> Correct samples: 355
>> Final Accuracy: 88.75%
```

## Adding Experience from Cache
Next, we take the previously cached function call information, encode it, and store it into VectorKLStore as "experience."

Initialize the embedding model and select lancedb as the vector storage database. VectorKLStore will create a collection named ukf_base in the ./data/lancedb directory.

```
embedder = LLM(preset="embedder")
vecstore = VectorKLStore(
    collection="ukf_base",
    provider="lancedb",
    uri="./data/lancedb",
    embedder=embedder
)
```

We extract function call information from the cache where the output scores are 1-2 and 9-10 (scores at the extremes are generally more precise) and store them as experience in VectorKLStore.

```
data_to_upsert = []

for entry in cache:
    data_to_upsert.append(ExperienceUKFT.from_cache_entry(entry))

def filter_cache_entries(entries):
    filtered_result = []
    for entry in entries:
        raw_output = entry.output
        score = float(raw_output)

        match_low = (1 <= score <= 2)
        match_high = (9 <= score <= 10)

        if match_low or match_high:
            filtered_result.append(entry)

    return filtered_result

filter_list = filter_cache_entries(data_to_upsert)

if filter_list:
    vecstore.batch_upsert(filter_list)
```

## Round 2: QA with Experience
Create a VectorKLEngine and select the top 3 semantically similar function calls as experience to add to the autotask.
```
engine = VectorKLEngine(storage=vecstore, inplace=True)

analyzer_task_with_exp  = autotask(
    descriptions="Sentiment analysis. Rate the sentiment of the text from 1 to 10. Return an integer.",
    examples = engine,
    output_schema={"mode": "repr"},
    llm_args={"preset": "sys"},
    search_encoder = lambda instance: {"query": "input="+str(instance.inputs.get("text")), "topk": 3},
)
```
Run the second round of QA using the same model:
```
def sentiment_analyzer_with_exp(text):
    return analyzer_task_with_exp(inputs={"text": text})

def evaluate_accuracy(json_file_path): 
    with open(json_file_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    total_count = len(dataset)
    correct_count = 0
    for i, item in enumerate(dataset, 1):
        text = item.get('text')
        true_tag = item.get('tag')
        
        # Get rating
        prediction_raw = sentiment_analyzer_with_exp(text)
        score = int(prediction_raw)

        is_correct = False
        
        if true_tag == 'neg' and 1 <= score <= 5:
            is_correct = True
        elif true_tag == 'pos' and 6 <= score <= 10:
            is_correct = True
            
        # Statistics
        if is_correct:
            correct_count += 1

    accuracy = (correct_count / total_count) * 100
    
    print(f"Total samples: {total_count}")
    print(f"Correct samples: {correct_count}")
    print(f"Final Accuracy: {accuracy:.2f}%")

if __name__ == '__main__':
    evaluate_accuracy('dataset.json')
```

As seen from the results, the accuracy of the second round has improved compared to the first round after adding experience.

```
>> Total samples: 400
>> Correct samples: 361
>> Final Accuracy: 90.25%
```

## Further Reading

> **Tip：** For a quick introduction and more usage examples, please see:
> - [60-Minute Tutorial](./60min-tutorial.md) - Step-by-step tutorial with examples
<br/>