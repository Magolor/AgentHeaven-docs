# 多线程并行化

`parallel_utils.py` 模块提供了一个 `Parallelized` 上下文管理器，它通过内置的 `tqdm` 进度跟踪简化了使用线程的并行任务执行。本指南将引导您使用 `Parallelized` 上下文管理器在 AgentHeaven 中进行高效的多线程处理。

## 1. 上下文管理器模式

`Parallelized` 使用上下文管理器模式来确保正确的线程池管理。进入上下文时，它会创建一个线程池，并通过将多个 `kwargs` 字典提交给提供的函数来开始执行任务。随着任务的完成，上下文管理器会产生 `(kwargs, result, error)` 元组。

一个典型的使用模式：
```python
from ahvn.utils.basic.parallel_utils import Parallelized
import time

def sample_task(task_id: int, duration: float):
    """A simple task that sleeps for a given duration."""
    time.sleep(duration)
    return f"Task {task_id} finished after {duration}s"

# 每个列表元素都是 sample_task 的关键字参数字典
tasks = [
    {"task_id": 1, "duration": 0.2},
    {"task_id": 2, "duration": 0.1},
]

with Parallelized(sample_task, tasks, desc="Processing tasks") as par:
    for kwargs, result, error in par:
        if error:
            print(f"Task {kwargs['task_id']} failed: {error}")
        else:
            print(f"Completed: {result}")
```

其中 `kwargs` 是提交给 `your_function` 的关键字参数字典，`result` 是返回值，`error` 是发生的任何异常（如果任务成功，则为 `None`）。

<br/>

## 2. 线程池配置

`Parallelized` 是通过 `concurrent.futures.ThreadPoolExecutor` 实现的。您可以控制线程池的配置，最重要的是线程数。

- **`num_threads` (int, optional):** 工作线程的数量。
  - 如果为 `None` (默认值)，`ThreadPoolExecutor` 会自动确定线程数，通常基于 CPU 核心数。这适用于 CPU 密集型任务。
  - 对于 I/O 密集型任务（如网络请求或文件操作），您通常可以从更多的线程中受益。

```python
from ahvn.utils.basic.parallel_utils import Parallelized

def cpu_intensive_task(data: str, iterations: int = 1000):
    """Perform CPU-intensive processing."""
    result = data
    for _ in range(iterations):
        result = hash(result)  # 模拟计算
    return f"Hash result: {result}"

tasks = [{"data": f"item_{i}", "iterations": 1000} for i in range(20)]

# 使用 4 个工作线程 (适合 CPU 密集型任务)
with Parallelized(cpu_intensive_task, tasks, num_threads=4, desc="CPU processing") as par:
    for kwargs, result, error in par:
        if error:
            print(f"处理 {kwargs['data']} 时出错: {error}")
        else:
            print(f"完成 {kwargs['data']}: {result}")

# 为 I/O 密集型任务使用更多线程
# def download_file(url: str): ...
# with Parallelized(download_file, download_tasks, num_threads=10, desc="I/O processing") as par:
#     for kwargs, result, error in par:
#         print(f"Downloaded: {kwargs['url']}")
```

<br/>

## 3. 进度跟踪

`Parallelized` 将多线程与 `tqdm` 可视化相结合，以提供进度条。使用属性 `pbar` 来访问 tqdm 进度条。

```python
from ahvn.utils.basic.parallel_utils import Parallelized

def variable_duration_task(task_id: int, duration: float):
    """Task with variable duration."""
    import time
    time.sleep(duration)
    return f"Task {task_id} completed"

# 不同时长的任务
tasks = [
    {"task_id": 1, "duration": 0.1},
    {"task_id": 2, "duration": 0.3},
    {"task_id": 3, "duration": 0.2},
    {"task_id": 4, "duration": 0.4},
    {"task_id": 5, "duration": 0.1},
]

with Parallelized(variable_duration_task, tasks, desc="Variable duration tasks") as par:
    # 通过 pbar 属性访问进度条
    pbar = par.pbar
    
    # 设置要在进度条上显示的附加信息
    pbar.set_postfix({"status": "processing"})
    
    for kwargs, result, error in par:
        if error:
            print(f"❌ Task {kwargs['task_id']} failed")
        else:
            print(f"✅ {result}")
            
            # 使用最新的任务信息更新进度条
            pbar.set_postfix({
                "status": "active", 
                "last_task": f"task_{kwargs['task_id']}",
            })
```

<br/>

## 4. 产出顺序

结果是按完成顺序而不是提交顺序产出的，因为该实现使用了 `concurrent.futures.as_completed`。

```python
from ahvn.utils.basic.parallel_utils import Parallelized
import time
import random

def variable_duration_task(task_id: int, base_duration: float = 0.1):
    """Task with variable completion time."""
    duration = base_duration + random.uniform(0, 0.3)
    time.sleep(duration)
    return f"Task {task_id} completed after {duration:.2f}s"

# 任务将以不同于提交的顺序完成
tasks = [
    {"task_id": 1, "base_duration": 0.5},  # 可能最后完成
    {"task_id": 2, "base_duration": 0.1},  # 可能最先完成
    {"task_id": 3, "base_duration": 0.3},  # 可能在中间完成
    {"task_id": 4, "base_duration": 0.2},  # 可能第二个完成
]

print("🚀 Starting tasks (processing order may differ from submission order):")
with Parallelized(variable_duration_task, tasks, desc="Variable duration tasks") as par:
    for kwargs, result, error in par:
        if error:
            print(f"❌ Task {kwargs['task_id']} failed: {error}")
        else:
            print(f"✅ {result}")
```

<br/>

## 5. 中断

上下文管理器会优雅地处理 `KeyboardInterrupt`。当按下 `Ctrl+C` 时，它会取消所有待处理（尚未开始）的任务，并关闭线程池，而无需等待当前正在运行的任务完成。

```python
from ahvn.utils.basic.parallel_utils import Parallelized
import time

def long_running_task(task_id: int, duration: float):
    """Task that can be interrupted."""
    print(f"Task {task_id} started, will run for {duration}s...")
    time.sleep(duration)
    return f"Task {task_id} completed"

long_tasks = [{"task_id": i, "duration": 5.0} for i in range(10)]

try:
    # 当 num_threads=2 时，一次只有 2 个任务运行。
    # 按 Ctrl+C 查看待处理任务被取消。
    with Parallelized(long_running_task, long_tasks, num_threads=2, desc="Interruptible tasks") as par:
        for kwargs, result, error in par:
            if error:
                # 被取消任务的错误将是 KeyboardInterrupt
                print(f"Task {kwargs['task_id']} resulted in error: {type(error)}")
            else:
                print(result)
            
except KeyboardInterrupt:
    print("\n\n🛑 Execution interrupted by user.")
    print("✅ Pending tasks cancelled and resources cleaned up.")
```

这是因为 `__exit__` 方法在 `KeyboardInterrupt` 发生时会调用 `executor.shutdown(wait=False)`，允许主程序快速退出，同时放弃正在运行的任务。

<br/>

## 6. 最佳实践

### 6.1. 使用线程安全的函数

确保您的函数是线程安全的，尤其是在它们修改共享状态时。使用 `threading.Lock` 来保护对共享资源的访问。

```python
from ahvn.utils.basic.parallel_utils import Parallelized
import threading

# 使用锁来保护这个共享计数器
counter = 0
lock = threading.Lock()

def thread_safe_counter(item_id: int):
    """A function that safely increments a shared counter."""
    global counter
    with lock:
        counter += 1
        current_count = counter
    
    return f"Item {item_id} processed. Current count: {current_count}"

tasks = [{"item_id": i} for i in range(10)]
with Parallelized(thread_safe_counter, tasks, desc="Thread-safe processing") as par:
    for kwargs, result, error in par:
        if not error:
            print(f"✅ {result}")
```

这个原则也适用于数据库连接。例如，避免在多个线程中使用单个 `sqlite3` 连接。

<br/>

### 6.2. 错误收集与重试

有效地收集和分析错误。对于可能间歇性失败的任务（例如，网络请求），您可以实现重试机制。

```python
from ahvn.utils.basic.parallel_utils import Parallelized
from ahvn.utils.basic.debug_utils import error_str
import random

def unreliable_task(task_id: int, fail_rate: float = 0.3):
    """A task that may fail based on fail_rate."""
    if random.random() < fail_rate:
        raise RuntimeError(f"Random failure for task {task_id}")
    return f"Task {task_id} succeeded"

tasks = [{"task_id": i, "fail_rate": 0.5} for i in range(1, 11)]
successful_results = []
failed_tasks = []

# 第一次尝试
print("--- Attempt 1 ---")
with Parallelized(unreliable_task, tasks, desc="Processing with error collection") as par:
    for kwargs, result, error in par:
        if error:
            error_msg = error_str(error)
            print(f"❌ {error_msg}")
            failed_tasks.append(kwargs)
        else:
            print(f"✅ {result}")
            successful_results.append(result)

# 重试失败的任务
if failed_tasks:
    print(f"\n--- Retrying {len(failed_tasks)} failed tasks ---")
    with Parallelized(unreliable_task, failed_tasks, desc="Retrying failed tasks") as par:
        for kwargs, result, error in par:
            if error:
                print(f"❌ Retry failed for task {kwargs['task_id']}")
            else:
                print(f"✅ Retry succeeded for task {kwargs['task_id']}")
                successful_results.append(result)

print(f"\n📊 Results Summary:")
print(f"   Total tasks: {len(tasks)}")
print(f"   Successful after retry: {len(successful_results)}")
print(f"   Final failed: {len(tasks) - len(successful_results)}")
```

<br/>

## 进一步探索

> **提示：** 有关 AgentHeaven 中实用工具的更多信息，请参见：
> - [实用工具](../index.md) - 为方便起见提供的所有 Python 实用工具

<br/>
