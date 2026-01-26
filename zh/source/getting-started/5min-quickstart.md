# 5 分钟快速开始

这里给出一个快速上手AgentHeaven的简单示例，用一个情感分析的应用场景，展示AgentHeaven是如何利用经验提升模型问答的准确率。

## 数据集准备

下载IMDb Movie Review Dataset
https://ai.stanford.edu/~amaas/data/sentiment/

自行用脚本处理数据，处理后的数据格式如下，保存到dataset.json文件中

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

## LLM配置

参考 [LLM配置](../configuration/llm.md)

## 第一轮问答

下面的autotask方法调用大模型进行情感分析，llm_args参数指定LLM配置中的模型。
```
from ahvn.utils.exts.autotask import autotask
from ahvn.cache import JsonCache
analyzer_task = autotask(
    descriptions="Sentiment analysis. Rate the sentiment of the text from 1 to 10. Return an integer.",
    output_schema={"mode": "repr"},
    llm_args={"preset": "sys"},
)
```
接着声明了一个缓存，类型是JsonCache，这是AgentHeaven内置的一种缓存类型，缓存信息以Json的格式存储在本地。
```
cache = JsonCache("./json_cache")
```
@cache.memoize()是一个装饰器，用该装饰器修饰的方法，会将每次的函数调用信息缓存下来。
```
@cache.memoize()
def sentiment_analyzer(text):
    return analyzer_task(inputs={"text": text})
```
打开缓存的json文件可以看到，包括函数名、输入信息和输出信息都被缓存了。
```
{
    "func": "sentiment_analyzer",
    "inputs": {"text": "NOTE TO ALL DIRECTORS: Long is not necessarily..."},
    "output": 3,
    "metadata": {}
}
```
对于之前获取到的数据集dataset.json，调用autotask方法进行情感分析，评分1到5是消极情绪，6到10是积极情绪，完整代码如下：
```
cache = JsonCache("./json_cache")
@cache.memoize()
def sentiment_analyzer(text):
    return analyzer_task(inputs={"text": text})

def evaluate_accuracy(json_file_path): 
    with open(json_file_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    total_count = len(dataset)
    for i, item in enumerate(dataset, 1):
        text = item.get('text')
        true_tag = item.get('tag')
        # 获取评分
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
    
    print(f"总样本数: {total_count}")
    print(f"正确样本: {correct_count}")
    print(f"最终准确率: {accuracy:.2f}%")

if __name__ == '__main__':
    evaluate_accuracy('dataset.json')
```

```
>> 总样本数: 400
>> 正确样本: 355
>> 最终准确率: 88.75%
```
## 从缓存中添加经验
下面将之前缓存的函数调用信息作为经验，编码之后存入VectorKLStore。

初始化embedding模型，选用lancedb作为向量存储的数据库，VectorKLStore会在./data/lancedb目录下创建一个名为ukf_base的collection
```
embedder = LLM(preset="embedder")
vecstore = VectorKLStore(
    collection="ukf_base",
    provider="lancedb",
    uri="./data/lancedb",
    embedder=embedder
)
```
从缓存中取出输出评分1~2和9~10的函数调用信息（位于两端的评分相对更加精准）作为经验存入VectorKLStore。
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

## 加入经验后，第二轮问答

创建VectorKLEngine并选取语义相似度top3的函数调用信息作为经验加入到autotask中。
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
用同样的模型进行第二轮问答
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
        # 获取评分
        prediction_raw = sentiment_analyzer_with_exp(text)
        score = int(prediction_raw)

        is_correct = False
        
        if true_tag == 'neg' and 1 <= score <= 5:
            is_correct = True
        elif true_tag == 'pos' and 6 <= score <= 10:
            is_correct = True
        # 统计
        if is_correct:
            correct_count += 1

    accuracy = (correct_count / total_count) * 100
    
    print(f"总样本数: {total_count}")
    print(f"正确样本: {correct_count}")
    print(f"最终准确率: {accuracy:.2f}%")

if __name__ == '__main__':
    evaluate_accuracy('dataset.json')
```
从结果可以看出，加入经验后，第二轮问答的精度相比第一轮有了提升。
```
>> 总样本数: 400
>> 正确样本: 361
>> 最终准确率: 90.25%
```
## 拓展阅读

> **提示：** 有关快速入门和更多使用示例，请参见：
> - [60 分钟教程](./60min-tutorial.md) - 逐步教程与示例

<br/>