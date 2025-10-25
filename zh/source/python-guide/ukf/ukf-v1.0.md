# UKF v1.0

最新更新：2025.10.20

## 1. 核心字段

本文档描述了 UKF v1.0 核心模型，并将 :class:`BaseUKF` 上的公共字段映射到类型、默认值和预期用途。

### 1.1. 元数据

这些属性承载描述性和标识性信息。

- **`name`** (必需): 知识项的主要稳定标识符。
    - 类型: string
    - 默认值: 必需 (无默认值)
    - 不可变: 是 (冻结)
    - 描述: 此知识项的稳定、描述性标识符。不唯一，但应可区分。
- **`notes`** (可选): 扩展的人类导向注释或注解。
    - 类型: string
    - 默认值: ``""``
    - 描述: 人类可读描述。不被系统处理。
- **`short_description`** (可选): 简短、LLM 友好的描述。
    - 类型: string
    - 默认值: ``""``
    - 描述: 一句话摘要（少于 200 字符），针对 LLM 和预览优化。包括关键目的和范围。
- **`description`** (可选): 适合 UI 显示的长格式描述。
    - 类型: string
    - 默认值: ``""``
    - 描述: 内容、使用和目的的详细解释。包括术语、范围等，所有帮助人类和检索系统理解此知识的信息。
- **`type`** (可选): 知识分类（例如 ``"document"``）。
    - 类型: string
    - 默认值: ``"general"``
    - 不可变: 是 (冻结)
    - 描述: 用于路由和处理的知识类别。例如：'experience', 'knowledge', 'resource'。系统用于适当处理不同知识类型的重大分类器。通常有不同的类和 `content_composers`。
- **`version`** (可选): 项的语义版本字符串。
    - 类型: string
    - 默认值: ``"v0.1.0"``
    - 不可变: 是 (冻结)
    - 描述: 语义版本 (Major.Minor.Patch)。Major = 破坏性更改，Minor = 功能，Patch = 修复。从 'v0.1.0' 开始。使用 derive() 自动递增。
- **`version_notes`** (可选): 描述当前版本的注释。
    - 类型: string
    - 默认值: ``""``
    - 描述: 此版本更改的人类可读解释。不被系统处理。
- **`variant`** (可选): 变体限定符（例如语言/模型变体）。
    - 类型: string
    - 默认值: ``"default"``
    - 不可变: 是 (冻结)
    - 描述: 区分同一知识的不同实现。例如：语言 ('en', 'zh')，复杂度 ('basic', 'advanced')，平台 ('web', 'mobile')，模型 ('gpt4', 'claude')。主要版本使用 'default'。
- **`variant_notes`** (可选): 描述变体的注释。
    - 类型: string
    - 默认值: ``""``
    - 描述: 此变体的人类可读解释。不被系统处理。

<br/>

### 1.2. 内容

内容相关字段持有主要负载和补充资产。

- **`content`** (可选): 表示知识的主要文本负载。
    - 类型: string
    - 默认值: ``""``
    - 不可变: 是 (冻结)
    - 描述: 文本格式的实际知识内容。包含直接馈送到 LLM 的核心信息，无需处理。
- **`content_resources`** (可选): 结构化资源，如附件或嵌入，由 composers 和 renderers 使用。
    - 类型: Dict[str, Any]
    - 默认值: 空字典 ``{}``
    - 不可变: 是 (冻结)
    - 描述: 支持/替换内容的自由形式半结构化数据。由 `content_composers` 引用以进行格式化。
- **`content_composers`** (可选): composer 名称到可调用对象的映射。
    - 类型: Dict[str, Callable]
    - 默认值: 包含一个返回 ``kl.content`` 的 ``"default"`` composer
    - 不可变: 是 (冻结)
    - 描述: 将 composer 名称映射到函数的字典，每个函数产生知识的文本表示。函数是 `f(kl: BaseUKF, **kwargs) -> str` 可调用对象，接收 UKF 对象和可选参数，返回字符串。产生的文本用作原始 `content` 字符串的替代。
    - 注释: composers 应接受签名 ``f(kl: BaseUKF, **kwargs) -> str``。

<br/>

### 1.3. 出处

用于源跟踪和所有权的字段。

- **`source`** (可选): 知识项的来源。
    - 类型: ``"system", "user", "auto", "tool", "derived", "unknown"`` 的字面量
    - 默认值: ``"unknown"``
    - 不可变: 是 (冻结)
    - 描述: 此知识如何创建或获取。选项：'system' (内置或固定)，'user' (手动创建)，'auto' (自动生成)，'tool' (工具产生)，'derived' (从其他知识派生)，'unknown' (其他)。
- **`parents`** (可选): 应用程序定义的出处引用。
    - 类型: Dict[str, Any]
    - 默认值: ``{}``
    - 不可变: 是 (冻结)
    - 描述: 待改进
- **`creator`** (可选): 创建者身份（用户/代理/工具）。
    - 类型: string
    - 默认值: ``"unknown"``
    - 不可变: 是 (冻结)
    - 描述: 谁或什么直接创建了此知识项。通常是用户/团队 `id_str` 或系统组件名称（如果是自动生成）。
- **`owner`** (可选): 所有者或负责主体。
    - 类型: string
    - 默认值: ``"unknown"``
    - 不可变: 是 (冻结)
    - 描述: 谁维护和管理此知识。通常是用户/团队 `id_str`。
- **`workspace`** (可选): 命名空间或租户上下文。
    - 类型: string
    - 默认值: ``"unknown"``
    - 不可变: 是 (冻结)
    - 描述: 分离此知识与其他知识的组织或项目上下文。启用多租户和知识隔离。

<br/>

### 1.4. 检索

帮助索引、分类和运行时激活的字段。

- **`collection`** (可选): 用于分组项的逻辑集合名称。
    - 类型: string
    - 默认值: ``"general"``
    - 不可变: 是 (冻结)
    - 描述: 工作区内用于组织和检索的类别或主题分组。
- **`tags`** (可选): ``"[SLOT:value]"`` 格式的标签字符串集合。
    - 类型: Set[str]
    - 默认值: 空集合 ``set()``
    - 不可变: 是 (冻结)
    - 描述: 字符串集合。用于过滤和分类的结构化标签。使用格式 '[SLOT:value]'。例如：[UKF_TYPE:knowledge], [LANGUAGE:en]。启用高级搜索如分面等。
- **`synonyms`** (可选): 替代名称/别名以改善召回。
    - 类型: Set[str]
    - 默认值: 空集合 ``set()``
    - 描述: 字符串集合。替代名称、别名或相关搜索术语。例如，'Password Reset Guide'：'password recovery', 'account access', 'login help', 'forgot password'。通常用于基于字符串的搜索系统。
    - 注释: 使用 :meth:`BaseUKF.add_synonyms` 或编程变异；模型确定性序列化同义词。
- **`triggers`** (可选): 用于运行时激活或过滤项的命名谓词函数。
    - 类型: Dict[str, Callable]
    - 默认值: 包含始终返回 True 的 ``"default"`` trigger
    - 描述: 确定此知识何时激活的条件函数。每个 trigger 接收 UKF 对象和上下文，返回 True/False。示例：'business_hours_only', 'requires_manager_role', 'valid_until_2024', 'customer_context'。用于动态规则。
    - 注释: trigger 可调用对象具有签名 ``f(kl: BaseUKF, **kwargs) -> bool``。
- **`priority`** (可选): 选择/排名的排序提示。
    - 类型: int
    - 默认值: ``0``
    - 描述: 排名重要性，其中较高值在搜索结果中首先出现。

<br/>

### 1.5. 关系

链接知识项的轻量级关系元组。

- **`related`** (可选): 关系元组集合。
    - 类型: Set[Tuple[int, str, int, Optional[int], Optional[str]]]
    - 默认值: 空集合 ``set()``
    - 元组格式: ``(subject_id, relation, object_id, relation_id?, relation_resources_json?)``
    - 描述: 作为关系元组 `(subject_id, relation, object_id, relation_id?, resources?)` 到其他知识项的连接。`relation_id` 和 `resources` 是可选的。
    - 注释: 关系资源序列化为 JSON 字符串以进行存储；代码公开助手以自动 (反)序列化它们。
- **`auths`** (可选): 作为 ``(user, authority)`` 的访问控制条目。
    - 类型: Set[Tuple[str, str]]
    - 默认值: 空集合 ``set()``
    - 描述: 待改进：作为 `(user_id, authority)` 对的访问控制权限。

<br/>

### 1.6. 生命周期

控制时间敏感性和到期的字段。

- **`timefluid`** (可选): 项是否时间敏感。
    - 类型: bool
    - 默认值: ``False``
    - 不可变: 是 (冻结)
    - 描述: 此知识是否时间敏感。如果知识有效性取决于时间，则设置为 True。
- **`timestamp`** (可选): UTC 创建时间戳（微秒剥离）。
    - 类型: datetime.datetime
    - 默认值: 当前 UTC 时间
    - 不可变: 是 (冻结)
    - 描述: 此知识创建的时间（UTC，无微秒）。用于审计、按时间排序和跟踪年龄。自动设置；更新期间不变。
- **`last_verified`** (可选): 最后验证/刷新时间戳。
    - 类型: datetime.datetime
    - 默认值: 当前 UTC 时间
    - 描述: 此内容最后确认准确的时间（UTC，无微秒）。编辑内容或明确审查时更新。
- **`expiration`** (可选): 从 ``last_verified`` 的 TTL（秒）；负值禁用自动到期。
    - 类型: int
    - 默认值: ``-1``
    - 描述: 内容在 last_verified 后保持有效的时间（秒）。负值 = 永不到期。
- **`inactive_mark`** (可选): 手动弃用标记；当 True 时，无论时间戳如何，项被视为非活跃。
    - 类型: bool
    - 默认值: ``False``
    - 描述: 手动停用标志以立即从活跃使用中移除此项。当内容被弃用、取代或临时禁用时设置为 True。覆盖到期检查 - 当 True 时，无论时间戳如何，项始终非活跃。

<br/>

### 1.7. 统计字段

应用程序可扩展元数据和运行时统计。

- **`metadata`** (可选): 附加结构化元数据。
    - 类型: Dict[str, Any]
    - 默认值: ``{}``
    - 描述: 自由形式应用程序特定数据。它绝不应该被系统使用。
- **`profile`** (可选): 运行时统计和计数器（使用、命中）。
    - 类型: Dict[str, Any]
    - 默认值: ``{}``
    - 描述: 待改进：自由形式运行时使用统计和质量指标，随着知识使用而演变。

<br/>

## 2. 内部字段

这些是实现级字段，用于缓存、哈希和序列化。它们不是外部 API 的一部分，但此处为集成者记录。

### 2.1. 内部字段

- **`_id`**: 从 :data:`identity_hash_fields` 计算的缓存整数 id。
    - 类型: Optional[int]
    - 默认值: ``None``
- **`_content_hash`**: 从 :data:`content_hash_fields` 计算的缓存内容哈希。
    - 类型: Optional[int]
    - 默认值: ``None``
- **`_slots`**: 从 ``tags`` 计算的从标签槽到值集合的缓存映射。
    - 类型: Dict[str, Set[str]]
    - 默认值: ``{}``

<br/>

### 2.2. 类模式字段

这些类级元组定义了模型中使用的字段分组：

- **`external_fields`**: 序列化器使用的公开导出字段元组。
    - 值: ``("name", "notes", "short_description", "description", "type", "version", "version_notes", "variant", "variant_notes", "content", "content_resources", "content_composers", "source", "parents", "creator", "owner", "workspace", "collection", "tags", "synonyms", "triggers", "priority", "related", "auths", "timefluid", "timestamp", "last_verified", "expiration", "inactive_mark", "metadata", "profile")``
- **`internal_fields`**: 从外部导出中排除的私有属性元组。
    - 值: ``("_id", "_content_hash", "_slots")``
- **`property_fields`**: 计算属性字段元组。
    - 值: ``("id", "id_str", "content_hash", "content_hash_str", "expiration_timestamp", "is_inactive", "is_active")``
- **`identity_hash_fields`**: 用于计算项身份哈希的字段。
    - 值: ``("type", "name", "version", "variant", "source", "creator", "owner", "workspace", "collection", "tags", "timefluid")``
- **`content_hash_fields`**: 用于计算内容哈希的字段。
    - 值: ``("content", "content_resources")``
- **`set_fields`**: 表示为集合的字段（tags, synonyms, related, auths）。
    - 值: ``("tags", "synonyms", "related", "auths")``
- **`json_func_fields`**: 包含需要特殊 JSON 序列化的可调用函数的字段（content_composers, triggers）。
    - 值: ``("content_composers", "triggers")``
- **`json_data_fields`**: 包含结构化 JSON 数据的字段（content_resources, parents, metadata, profile）。
    - 值: ``("content_resources", "parents", "metadata", "profile")``

参考 ``src/ahvn/ukf/base.py`` 中的代码以获取确切元组和序列化器/反序列化器的行为。此文档旨在作为开发者友好的摘要；对于精确行为，始终咨询模型实现。

<br/>

### 2.3. 验证

模型使用 Pydantic 进行验证，并为以下提供自定义序列化器/验证器：

- **集合**: Tags、synonyms、related 元组和 auths 序列化为排序列表。
- **函数**: Triggers 和 content composers 使用自定义函数序列化进行序列化。
- **时间戳**: UTC datetime 对象，微秒剥离，序列化为 ISO 字符串。
- **关系**: 具有 JSON 序列化资源的复杂关系元组。

<br/>

## 3. 实用函数

UKF 模块提供了几个用于处理标签、关系和版本控制的实用函数：

### 3.1. 标签助手

- **`tag_s(tag)`**: 从格式为 ``"[slot:value]"`` 的标签字符串中提取槽（键）。
- **`tag_v(tag)`**: 从标签字符串中提取值部分。
- **`tag_t(tag)`**: 将标签字符串拆分为 ``(slot, value)`` 元组。
- **`ptags(**kwargs)`**: 从大写关键字参数创建格式化标签字符串。只有大写键转换为标签。值可以是标量或可迭代对象。
- **`gtags(tags, **kwargs)`**: 按槽名称分组标签并将值收集到映射中。

<br/>

### 3.2. 标签过滤

- **`has_tag(tags, slot, operator, value)`**: 检查标签集合是否满足条件。
  支持各种运算符，如 ``"ANY_OF"``、``"ALL_OF"``、``"HAS_NONE"`` 等。

  **支持的运算符：**
  - `"EXACT"` 或 `"=="`: 槽值与提供的数值完全匹配（集合相等）。
  - `"NONE_OF"`: 没有槽值与提供的数值匹配。
  - `"ANY_OF"`: 至少一个槽值与提供的数值匹配。
  - `"ANY_IF_EXISTS"`: 如果槽存在，至少一个提供的数值匹配；如果槽缺失，返回 True。
  - `"ONE_OF"`: 恰好一个槽值与提供的数值匹配。
  - `"MANY_OF"`: 至少两个槽值与提供的数值匹配。
  - `"ALL_OF"`: 所有提供的数值都存在于槽值中。
  - `"ALL_IN"` 或 `"IN"`: 所有槽值都包含在提供的数值中。
  - `"HAS_NONE"`: 一元 — 槽没有数值。
  - `"HAS_ANY"`: 一元 — 槽至少有一个数值。
  - `"HAS_ONE"`: 一元 — 槽恰好有一个数值。
  - `"HAS_MANY"`: 一元 — 槽至少有两个数值。
  - `int`: 数字运算符，表示“至少 N 个匹配数值”。
  - `float`: Jaccard 相似度阈值（交集/并集 >= 阈值）。

<br/>

### 3.3. 关系助手

- **`has_related(related, ...)`**: 检查关系元组是否包含匹配关系。
  支持按 subject_id、relation、object_id 等过滤。

<br/>

### 3.4. 版本控制

- **`next_ver(version)`**: 递增版本字符串的最后一个数字部分。
  示例：``"v1.2.3"`` → ``"v1.2.4"``，``"v1.2.beta"`` → ``"v1.2.beta.1"``

<br/>

### 3.5. 默认可调用对象

- **`default_trigger(kl, **kwargs)`**: 始终返回 ``True``，用作安全默认 trigger。
- **`default_composer(kl, **kwargs)`**: 返回 ``kl.content``，用作安全默认 composer。

<br/>

## 4. 关键方法和属性

### 4.1. 身份和哈希

- **`id`**: 基于身份字段的计算确定性整数标识符。
- **`id_str`**: id 的零填充字符串表示（40 位数字）。
- **`content_hash`**: 内容相关字段的哈希，用于变更检测。
- **`content_hash_str`**: 内容哈希的字符串表示。

<br/>

### 4.2. 标签操作

- **`has_tag(slot, operator, value)`**: 检查标签条件的实例方法。
- **`slots`**: 从标签槽到其值的缓存映射。

<br/>

### 4.3. 关系

- **`has_related(...)`**: 检查匹配关系。
- **`link(kl, dir, rel, ...)`**: 在知识项之间添加关系。
- **`list_object_ids(rel)`**: 获取此项作为主体的对象 ID。
- **`list_subject_ids(rel)`**: 获取此项作为对象的主体 ID。

<br/>

### 4.4. 生命周期

- **`is_active`**: 指示项当前是否活跃的属性。
- **`is_inactive`**: 指示项是否非活跃的属性。
- **`expiration_timestamp`**: 计算到期 datetime。
- **`set_inactive()`**: 将项标记为非活跃。
- **`unset_inactive()`**: 清除非活跃标记。

<br/>

### 4.5. 内容合成

- **`text(composer, **kwargs)`**: 使用命名 composer 获取合成文本表示。

<br/>

### 4.6. 克隆和派生

- **`clone(**updates)`**: 创建带有更新的深拷贝。
- **`derive(**updates)`**: 创建带有递增版本和出处的派生项。

<br/>

### 4.7. 访问控制

- **`grant(user, authority)`**: 向用户授予权限。
- **`revoke(user, authority)`**: 撤销用户的权限。
- **`has_authority(user, authority)`**: 检查用户是否具有权限。

<br/>

### 4.8. 同义词

- **`add_synonyms(synonyms)`**: 添加替代名称/别名。

<br/>

### 4.9. 过滤

- **`evaluate(triggers, contexts, aggregate)`**: 使用上下文的命名 triggers 过滤项。
- **`scalar_match(**kwargs)`**: 检查标量字段是否与提供的数值匹配。

<br/>

### 4.10. 序列化

- **`to_dict()`**: 序列化为字典（排除内部字段）。
- **`from_dict(data)`**: 从字典创建实例。
- **`update_triggers(triggers)`**: 合并新的 trigger 可调用对象。

<br/>

## 5. 示例

### 5.1. 创建知识项

```python
from ahvn.ukf.base import BaseUKF

kl = BaseUKF(
    name="example_doc",
    content="This is example content",
    tags={"[type:document]", "[lang:en]"},
    type="document"
)
```

<br/>

### 5.2. 使用标签助手

```python
from ahvn.ukf.base import ptags, gtags, has_tag

# 创建标签
tags = ptags(TYPE="document", LANG="en", CATEGORY=["tech", "ai"])

# 分组标签
grouped = gtags(tags)  # {'type': {'document'}, 'lang': {'en'}, 'category': {'tech', 'ai'}}

# 检查条件
has_tag(tags, "type", "ANY_OF", "document")  # True
```

<br/>

### 5.3. 关系

```python
# 链接项
kl1.link(kl2, rel="references")

# 检查关系
kl1.has_related(object_id=kl2.id, relation="references")  # True

# 列出相关 ID
kl1.list_object_ids("references")  # [kl2.id]
```

<br/>

### 5.4. 版本管理

```python
from ahvn.ukf.base import next_ver

next_ver("v1.2.3")  # "v1.2.4"
next_ver("v1.2.beta")  # "v1.2.beta.1"
```

<br/>

### 5.5. 内容合成

```python
# 定义自定义 composer
def summary_composer(kl, **kwargs):
    return f"Summary: {kl.short_description}"

kl.content_composers["summary"] = summary_composer
kl.text("summary")  # "Summary: ..."
```

<br/>

### 5.6. 派生

```python
# 创建派生项
derived = kl.derive(
    content="Updated content",
    version_notes="Added new information"
)
# derived.version 将递增，source="derived"
```

<br/>

## 拓展阅读

> **提示：** 有关 UKF 背后的架构和设计原则，请参阅：
> - [架构](../../introduction/architecture.md) - Agent Heaven 架构概述

<br/>
