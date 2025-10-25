# Multi-Thread Parallelization

The `parallel_utils.py` module provides a `Parallelized` context manager that simplifies parallel execution of tasks using threading with built-in progress tracking via tqdm. This guide will walk you through using the `Parallelized` context manager for efficient multi-threaded processing in AgentHeaven.

## 1. Context Manager Pattern

`Parallelized` uses the context manager pattern to ensure proper thread pool management. When entering the context, it creates a thread pool and starts executing tasks by submitting multiple `kwargs` dictionaries to a provided function. The context manager yields tuples of `(kwargs, result, error)` as tasks complete.

A typical usage pattern:
```python
from ahvn.utils.basic.parallel_utils import Parallelized
import time

def sample_task(task_id: int, duration: float):
    """A simple task that sleeps for a given duration."""
    time.sleep(duration)
    return f"Task {task_id} finished after {duration}s"

# Each element in the list is a dictionary of keyword arguments for sample_task
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

where `kwargs` is the dictionary of keyword arguments submitted to `your_function`, `result` is the return value, and `error` is any exception that occurred (or `None` if the task was successful).

<br/>

## 2. Thread Pool Configuration

`Parallelized` is implemented via `concurrent.futures.ThreadPoolExecutor`. You can control the thread pool configuration, most importantly the number of threads.

- **`num_threads` (int, optional):** The number of worker threads.
  - If `None` (default), `ThreadPoolExecutor` determines the number of threads automatically, typically based on the number of CPU cores. This is suitable for CPU-bound tasks.
  - For I/O-bound tasks (like network requests or file operations), you can often benefit from a higher number of threads.

```python
from ahvn.utils.basic.parallel_utils import Parallelized

def cpu_intensive_task(data: str, iterations: int = 1000):
    """Perform CPU-intensive processing."""
    result = data
    for _ in range(iterations):
        result = hash(result)  # Simulate computation
    return f"Hash result: {result}"

tasks = [{"data": f"item_{i}", "iterations": 1000} for i in range(20)]

# Use 4 worker threads (good for CPU-bound tasks)
with Parallelized(cpu_intensive_task, tasks, num_threads=4, desc="CPU processing") as par:
    for kwargs, result, error in par:
        if error:
            print(f"Error processing {kwargs['data']}: {error}")
        else:
            print(f"Completed {kwargs['data']}: {result}")

# Use more threads for I/O-bound tasks
# def download_file(url: str): ...
# with Parallelized(download_file, download_tasks, num_threads=10, desc="I/O processing") as par:
#     for kwargs, result, error in par:
#         print(f"Downloaded: {kwargs['url']}")
```

<br/>

## 3. Progress Tracking

The `Parallelized` combines multi-threading with `tqdm` visualization to provide a progress bar. Use property `pbar` to access the tqdm progress bar.

```python
from ahvn.utils.basic.parallel_utils import Parallelized

def variable_duration_task(task_id: int, duration: float):
    """Task with variable duration."""
    import time
    time.sleep(duration)
    return f"Task {task_id} completed"

# Tasks with different durations
tasks = [
    {"task_id": 1, "duration": 0.1},
    {"task_id": 2, "duration": 0.3},
    {"task_id": 3, "duration": 0.2},
    {"task_id": 4, "duration": 0.4},
    {"task_id": 5, "duration": 0.1},
]

with Parallelized(variable_duration_task, tasks, desc="Variable duration tasks") as par:
    # Access the progress bar through the pbar property
    pbar = par.pbar
    
    # Set additional information to display on the progress bar
    pbar.set_postfix({"status": "processing"})
    
    for kwargs, result, error in par:
        if error:
            print(f"❌ Task {kwargs['task_id']} failed")
        else:
            print(f"✅ {result}")
            
            # Update progress bar with latest task information
            pbar.set_postfix({
                "status": "active", 
                "last_task": f"task_{kwargs['task_id']}",
            })
```

<br/>

## 4. Yield Order

Results are yielded in completion order, not submission order, because the implementation uses `concurrent.futures.as_completed`.

```python
from ahvn.utils.basic.parallel_utils import Parallelized
import time
import random

def variable_duration_task(task_id: int, base_duration: float = 0.1):
    """Task with variable completion time."""
    duration = base_duration + random.uniform(0, 0.3)
    time.sleep(duration)
    return f"Task {task_id} completed after {duration:.2f}s"

# Tasks will complete in a different order than submitted
tasks = [
    {"task_id": 1, "base_duration": 0.5},  # Will likely finish last
    {"task_id": 2, "base_duration": 0.1},  # Will likely finish first
    {"task_id": 3, "base_duration": 0.3},  # Will likely finish in the middle
    {"task_id": 4, "base_duration": 0.2},  # Will likely finish second
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

## 5. Interruption

The context manager handles `KeyboardInterrupt` gracefully. When `Ctrl+C` is pressed, it cancels all pending (not yet started) tasks and shuts down the thread pool without waiting for currently running tasks to finish.

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
    # With num_threads=2, only 2 tasks run at a time.
    # Press Ctrl+C to see pending tasks get cancelled.
    with Parallelized(long_running_task, long_tasks, num_threads=2, desc="Interruptible tasks") as par:
        for kwargs, result, error in par:
            if error:
                # Errors from cancelled tasks will be KeyboardInterrupt
                print(f"Task {kwargs['task_id']} resulted in error: {type(error)}")
            else:
                print(result)
            
except KeyboardInterrupt:
    print("\n\n🛑 Execution interrupted by user.")
    print("✅ Pending tasks cancelled and resources cleaned up.")
```

This works because the `__exit__` method calls `executor.shutdown(wait=False)` upon a `KeyboardInterrupt`, allowing the main program to exit quickly while running tasks are abandoned.

<br/>

## 6. Best Practices

### 6.1. Use Thread-Safe Functions

Ensure your functions are thread-safe, especially when they modify shared state. Use `threading.Lock` to protect access to shared resources.

```python
from ahvn.utils.basic.parallel_utils import Parallelized
import threading

# Use a lock to protect this shared counter
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

This principle also applies to database connections. For instance, avoid using a single `sqlite3` connection across multiple threads.

<br/>

### 6.2. Error Collection and Retry

Collect and analyze errors effectively. For tasks that might fail intermittently (e.g., network requests), you can implement a retry mechanism.

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

# First attempt
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

# Retry failed tasks
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

## Further Exploration

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
