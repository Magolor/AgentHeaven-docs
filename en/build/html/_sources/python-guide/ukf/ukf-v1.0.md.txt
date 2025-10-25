# UKF v1.0

Latest updated: 2025.10.20

## 1. Core Fields

This document describes the UKF v1.0 core model and maps the public fields present on :class:`BaseUKF` to types, default values and intended usage.

### 1.1. Metadata

These attributes carry descriptive and identifying information.

- **`name`** (Required): Primary stable identifier for the knowledge item.
    - Type: string
    - Default: required (no default)
    - Immutable: yes (frozen)
    - Description: Stable, descriptive identifier for this knowledge item. Not unique, but should be distinguishable.
- **`notes`** (Optional): Extended human-oriented notes or annotations.
    - Type: string
    - Default: ``""``
    - Description: Human-readable description. Not processed by systems.
- **`short_description`** (Optional): Short, LLM-friendly description.
    - Type: string
    - Default: ``""``
    - Description: One-sentence summary (under 200 chars) optimized for LLMs and previews. Include key purpose and scope.
- **`description`** (Optional): Long-form description suitable for UI display.
    - Type: string
    - Default: ``""``
    - Description: Detailed explanation of content, usage, and purpose. Include terminology, scope, etc., all the information to help humans and retrieval systems understand this knowledge.
- **`type`** (Optional): Classification of the knowledge (e.g. ``"document"``).
    - Type: string
    - Default: ``"general"``
    - Immutable: yes (frozen)
    - Description: Knowledge category for routing and processing. For example: 'experience', 'knowledge', 'resource'. A major classifier used by systems to handle different knowledge types appropriately. Typically have different classes and `content_composers`.
- **`version`** (Optional): Semantic version string for the item.
    - Type: string
    - Default: ``"v0.1.0"``
    - Immutable: yes (frozen)
    - Description: Semantic version (Major.Minor.Patch). Major = breaking changes, Minor = features, Patch = fixes. Start at 'v0.1.0'. Use derive() to auto-increment.
- **`version_notes`** (Optional): Notes describing the current version.
    - Type: string
    - Default: ``""``
    - Description: Human-readable explanation of changes in this version. Not processed by systems.
- **`variant`** (Optional): Variant qualifier (e.g. language/model variant).
    - Type: string
    - Default: ``"default"``
    - Immutable: yes (frozen)
    - Description: Distinguishes implementations of the same knowledge. For example: languages ('en', 'zh'), complexity ('basic', 'advanced'), platforms ('web', 'mobile'), for models ('gpt4', 'claude'). Use 'default' for primary version.
- **`variant_notes`** (Optional): Notes describing the variant.
    - Type: string
    - Default: ``""``
    - Description: Human-readable explanation of this variant. Not processed by systems.

<br/>

### 1.2. Content

Content-related fields holding the primary payload and supplemental assets.

- **`content`** (Optional): Primary textual payload representing the knowledge.
    - Type: string
    - Default: ``""``
    - Immutable: yes (frozen)
    - Description: Actual knowledge content in text format. Contains core information that are directly fed to LLMs without processing.
- **`content_resources`** (Optional): Structured resources such as attachments or embeddings used by composers and renderers.
    - Type: Dict[str, Any]
    - Default: empty dict ``{}``
    - Immutable: yes (frozen)
    - Description: Free-form semi-structured data supporting/replacing the content. Referenced by `content_composers` for formatting.
- **`content_composers`** (Optional): Mapping of composer names to callables.
    - Type: Dict[str, Callable]
    - Default: contains a ``"default"`` composer that returns ``kl.content``
    - Immutable: yes (frozen)
    - Description: A dictionary mapping composer names to functions, each producing a text representation of the knowledge. The functions are `f(kl: BaseUKF, **kwargs) -> str` callables that take the UKF object and optional parameters, returning a string. The produced text are used as alternatives to the raw `content` string.
    - Notes: composers should accept the signature ``f(kl: BaseUKF, **kwargs) -> str``.

<br/>

### 1.3. Provenance

Fields used for source tracking and ownership.

- **`source`** (Optional): Origin of the knowledge item.
    - Type: Literal of ``"system", "user", "auto", "tool", "derived", "unknown"``
    - Default: ``"unknown"``
    - Immutable: yes (frozen)
    - Description: How this knowledge was created or obtained. Options: 'system' (built-in or fixed), 'user' (manually created), 'auto' (auto-generated), 'tool' (produced by tool), 'derived' (from other knowledge), 'unknown' (others).
- **`parents`** (Optional): Application-defined provenance references.
    - Type: Dict[str, Any]
    - Default: ``{}``
    - Immutable: yes (frozen)
    - Description: TO BE IMPROVED
- **`creator`** (Optional): Creator identity (user/agent/tool).
    - Type: string
    - Default: ``"unknown"``
    - Immutable: yes (frozen)
    - Description: Who or what directly created this knowledge item. Typically a user/team `id_str` or a system component name if it is auto-generated.
- **`owner`** (Optional): Owner or responsible principal.
    - Type: string
    - Default: ``"unknown"``
    - Immutable: yes (frozen)
    - Description: Who maintains and manages this knowledge. Typically a user/team `id_str`.
- **`workspace`** (Optional): Namespace or tenant context.
    - Type: string
    - Default: ``"unknown"``
    - Immutable: yes (frozen)
    - Description: Organizational or project context separating this knowledge from others. Enables multi-tenancy and knowledge isolation.

<br/>

### 1.4. Retrieval

Fields that help indexing, classification and runtime activation.

- **`collection`** (Optional): Logical collection name for grouping items.
    - Type: string
    - Default: ``"general"``
    - Immutable: yes (frozen)
    - Description: Category or theme grouping within a workspace for organization and retrieval.
- **`tags`** (Optional): Set of tag strings in the ``"[SLOT:value]"`` format.
    - Type: Set[str]
    - Default: empty set ``set()``
    - Immutable: yes (frozen)
    - Description: A set of strings. Structured tags for filtering and classification. Use format '[SLOT:value]'. e.g.,: [UKF_TYPE:knowledge], [LANGUAGE:en]. Enables advanced search like facet, etc.
- **`synonyms`** (Optional): Alternative names/aliases to improve recall.
    - Type: Set[str]
    - Default: empty set ``set()``
    - Description: A set of strings. Alternative names, aliases, or related search terms. For example, 'Password Reset Guide': 'password recovery', 'account access', 'login help', 'forgot password'. Typically used for string-based search systems.
    - Notes: Use :meth:`BaseUKF.add_synonyms` or mutate programmatically; the model serializes synonyms deterministically.
- **`triggers`** (Optional): Named predicate functions used to activate or filter items at runtime.
    - Type: Dict[str, Callable]
    - Default: contains a ``"default"`` trigger that always returns True
    - Description: Conditional functions determining when this knowledge activates. Each trigger receives the UKF object and context, returns True/False. Examples: 'business_hours_only', 'requires_manager_role', 'valid_until_2024', 'customer_context'. Use for dynamic rules.
    - Notes: trigger callables have signature ``f(kl: BaseUKF, **kwargs) -> bool``.
- **`priority`** (Optional): Ordering hint for selection/ranking.
    - Type: int
    - Default: ``0``
    - Description: Ranking importance where higher values appear first in search results.

<br/>

### 1.5. Relationships

Lightweight relation tuples linking knowledge items.

- **`related`** (Optional): Set of relation tuples.
    - Type: Set[Tuple[int, str, int, Optional[int], Optional[str]]]
    - Default: empty set ``set()``
    - Tuple format: ``(subject_id, relation, object_id, relation_id?, relation_resources_json?)``
    - Description: Connections to other knowledge items as relationship tuples `(subject_id, relation, object_id, relation_id?, resources?)`. `relation_id` and `resources` are optional.
    - Notes: relation resources are serialized to JSON strings for storage; the code exposes helpers to (de)serialize them automatically.
- **`auths`** (Optional): Access control entries as ``(user, authority)``.
    - Type: Set[Tuple[str, str]]
    - Default: empty set ``set()``
    - Description: TO BE IMPROVED: Access control permissions as `(user_id, authority)` pairs.

<br/>

### 1.6. Lifecycle

Fields controlling time-sensitivity and expiration.

- **`timefluid`** (Optional): Whether the item is time-sensitive.
    - Type: bool
    - Default: ``False``
    - Immutable: yes (frozen)
    - Description: Whether this knowledge is time-sensitive. Set True if knowledge validity depends on time.
- **`timestamp`** (Optional): UTC creation timestamp (microseconds stripped).
    - Type: datetime.datetime
    - Default: current UTC time
    - Immutable: yes (frozen)
    - Description: When this knowledge was created (UTC, without microseconds). Used for auditing, chronological sorting, and tracking age. Automatically set; doesn't change during updates.
- **`last_verified`** (Optional): Last verification/refresh timestamp.
    - Type: datetime.datetime
    - Default: current UTC time
    - Description: When this content was last confirmed accurate (UTC, without microseconds). Update when content is edited or explicitly reviewed.
- **`expiration`** (Optional): TTL in seconds from ``last_verified``; negative disables automatic expiration.
    - Type: int
    - Default: ``-1``
    - Description: How long content remains valid after last_verified (in seconds). negative value = never expires.
- **`inactive_mark`** (Optional): Manual deprecation marker; when True the item is considered inactive regardless of timestamps.
    - Type: bool
    - Default: ``False``
    - Description: Manual deactivation flag to immediately remove this item from active use. Set True when content is deprecated, superseded, or temporarily disabled. Overrides expiration checks - when True, item is always inactive regardless of timestamps.

<br/>

### 1.7. Statistical Fields

Application-extensible metadata and runtime statistics.

- **`metadata`** (Optional): Additional structured metadata.
    - Type: Dict[str, Any]
    - Default: ``{}``
    - Description: Free-form application-specific data. It should never be used by systems.
- **`profile`** (Optional): Runtime statistics and counters (usage, hits).
    - Type: Dict[str, Any]
    - Default: ``{}``
    - Description: TO BE IMPROVED: Free-form runtime usage statistics and quality metrics that evolve as knowledge is used.

<br/>

## 2. Internal Fields

These are implementation-level fields used for caching, hashing and serialization. They are not part of the external API but are documented here for integrators.

### 2.1. Internal Fields

- **`_id`**: Cached integer id computed from :data:`identity_hash_fields`.
    - Type: Optional[int]
    - Default: ``None``
- **`_content_hash`**: Cached content hash computed from :data:`content_hash_fields`.
    - Type: Optional[int]
    - Default: ``None``
- **`_slots`**: Cached mapping from tag slot to set of values (computed from ``tags``).
    - Type: Dict[str, Set[str]]
    - Default: ``{}``

<br/>

### 2.2. Class Schema Fields

These class-level tuples define field groupings used throughout the model:

- **`external_fields`**: Tuple of publicly exported fields used by serializers.
    - Value: ``("name", "notes", "short_description", "description", "type", "version", "version_notes", "variant", "variant_notes", "content", "content_resources", "content_composers", "source", "parents", "creator", "owner", "workspace", "collection", "tags", "synonyms", "triggers", "priority", "related", "auths", "timefluid", "timestamp", "last_verified", "expiration", "inactive_mark", "metadata", "profile")``
- **`internal_fields`**: Tuple of private attributes excluded from external exports.
    - Value: ``("_id", "_content_hash", "_slots")``
- **`property_fields`**: Tuple of computed property fields.
    - Value: ``("id", "id_str", "content_hash", "content_hash_str", "expiration_timestamp", "is_inactive", "is_active")``
- **`identity_hash_fields`**: Fields used to compute the item identity hash.
    - Value: ``("type", "name", "version", "variant", "source", "creator", "owner", "workspace", "collection", "tags", "timefluid")``
- **`content_hash_fields`**: Fields used to compute the content hash.
    - Value: ``("content", "content_resources")``
- **`set_fields`**: Fields represented as sets (tags, synonyms, related, auths).
    - Value: ``("tags", "synonyms", "related", "auths")``
- **`json_func_fields`**: Fields containing callable functions that need special JSON serialization (content_composers, triggers).
    - Value: ``("content_composers", "triggers")``
- **`json_data_fields`**: Fields containing structured JSON data (content_resources, parents, metadata, profile).
    - Value: ``("content_resources", "parents", "metadata", "profile")``

Refer to the code in ``src/ahvn/ukf/base.py`` for exact tuples and the behavior of serializers/deserializers. This documentation is intended to be a developer-friendly summary; for precise behavior always consult the model implementation.

<br/>

### 2.3. Validation

The model uses Pydantic for validation and provides custom serializers/validators for:

- **Sets**: Tags, synonyms, related tuples, and auths are serialized as sorted lists.
- **Functions**: Triggers and content composers are serialized using custom function serialization.
- **Timestamps**: UTC datetime objects with microseconds stripped, serialized as ISO strings.
- **Relations**: Complex relation tuples with JSON-serialized resources.

<br/>

## 3. Utility Functions

The UKF module provides several utility functions for working with tags, relations, and versioning:

### 3.1. Tag Helpers

- **`tag_s(tag)`**: Extract the slot (key) from a tag string in format ``"[slot:value]"``.
- **`tag_v(tag)`**: Extract the value part from a tag string.
- **`tag_t(tag)`**: Split a tag string into ``(slot, value)`` tuple.
- **`ptags(**kwargs)`**: Create formatted tag strings from uppercase keyword arguments. Only uppercase keys are converted to tags. Values can be scalars or iterables.
- **`gtags(tags, **kwargs)`**: Group tags by slot name and collect values into a mapping.

<br/>

### 3.2. Tag Filtering

- **`has_tag(tags, slot, operator, value)`**: Check if a collection of tags satisfies a condition.
  Supports various operators like ``"ANY_OF"``, ``"ALL_OF"``, ``"HAS_NONE"``, etc.

  **Supported Operators:**
  - `"EXACT"` or `"=="`: Slot values exactly match the provided values (sets equal).
  - `"NONE_OF"`: No slot values match the provided values.
  - `"ANY_OF"`: At least one slot value matches the provided values.
  - `"ANY_IF_EXISTS"`: If the slot exists, at least one provided value matches; if slot missing, returns True.
  - `"ONE_OF"`: Exactly one slot value matches the provided values.
  - `"MANY_OF"`: At least two slot values match the provided values.
  - `"ALL_OF"`: All provided values are present in the slot values.
  - `"ALL_IN"` or `"IN"`: All slot values are included in the provided values.
  - `"HAS_NONE"`: Unary — slot has no values.
  - `"HAS_ANY"`: Unary — slot has at least one value.
  - `"HAS_ONE"`: Unary — slot has exactly one value.
  - `"HAS_MANY"`: Unary — slot has at least two values.
  - `int`: Numeric operator meaning "at least N matching values".
  - `float`: Jaccard similarity threshold (intersection/union >= threshold).

<br/>

### 3.3. Relation Helpers

- **`has_related(related, ...)`**: Check if relation tuples contain a matching relation.
  Supports filtering by subject_id, relation, object_id, etc.

<br/>

### 3.4. Versioning

- **`next_ver(version)`**: Increment the last numeric part of a version string.
  Examples: ``"v1.2.3"`` → ``"v1.2.4"``, ``"v1.2.beta"`` → ``"v1.2.beta.1"``

<br/>

### 3.5. Default Callables

- **`default_trigger(kl, **kwargs)`**: Always returns ``True``, used as safe default trigger.
- **`default_composer(kl, **kwargs)`**: Returns ``kl.content``, used as safe default composer.

<br/>

## 4. Key Methods and Properties

### 4.1. Identity and Hashing

- **`id`**: Computed deterministic integer identifier based on identity fields.
- **`id_str`**: Zero-padded string representation of the id (40 digits).
- **`content_hash`**: Hash of content-related fields for change detection.
- **`content_hash_str`**: String representation of content hash.

<br/>

### 4.2. Tag Operations

- **`has_tag(slot, operator, value)`**: Instance method to check tag conditions.
- **`slots`**: Cached mapping from tag slots to their values.

<br/>

### 4.3. Relations

- **`has_related(...)`**: Check for matching relations.
- **`link(kl, dir, rel, ...)`**: Add relations between knowledge items.
- **`list_object_ids(rel)`**: Get object IDs where this item is the subject.
- **`list_subject_ids(rel)`**: Get subject IDs where this item is the object.

<br/>

### 4.4. Lifecycle

- **`is_active`**: Property indicating if the item is currently active.
- **`is_inactive`**: Property indicating if the item is inactive.
- **`expiration_timestamp`**: Computed expiration datetime.
- **`set_inactive()`**: Mark item as inactive.
- **`unset_inactive()`**: Clear inactive mark.

<br/>

### 4.5. Content Composition

- **`text(composer, **kwargs)`**: Get composed text representation using named composer.

<br/>

### 4.6. Cloning and Derivation

- **`clone(**updates)`**: Create a deep copy with updates.
- **`derive(**updates)`**: Create a derived item with incremented version and provenance.

<br/>

### 4.7. Access Control

- **`grant(user, authority)`**: Grant authority to a user.
- **`revoke(user, authority)`**: Revoke authority from a user.
- **`has_authority(user, authority)`**: Check if user has authority.

<br/>

### 4.8. Synonyms

- **`add_synonyms(synonyms)`**: Add alternative names/aliases.

<br/>

### 4.9. Filtering

- **`evaluate(triggers, contexts, aggregate)`**: Filter items using named triggers with context.
- **`scalar_match(**kwargs)`**: Check if scalar fields match provided values.

<br/>

### 4.10. Serialization

- **`to_dict()`**: Serialize to dictionary (excludes internal fields).
- **`from_dict(data)`**: Create instance from dictionary.
- **`update_triggers(triggers)`**: Merge new trigger callables.

<br/>

## 5. Examples

### 5.1. Creating a Knowledge Item

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

### 5.2. Using Tag Helpers

```python
from ahvn.ukf.base import ptags, gtags, has_tag

# Create tags
tags = ptags(TYPE="document", LANG="en", CATEGORY=["tech", "ai"])

# Group tags
grouped = gtags(tags)  # {'type': {'document'}, 'lang': {'en'}, 'category': {'tech', 'ai'}}

# Check conditions
has_tag(tags, "type", "ANY_OF", "document")  # True
```

<br/>

### 5.3. Relations

```python
# Link items
kl1.link(kl2, rel="references")

# Check relations
kl1.has_related(object_id=kl2.id, relation="references")  # True

# List related IDs
kl1.list_object_ids("references")  # [kl2.id]
```

<br/>

### 5.4. Version Management

```python
from ahvn.ukf.base import next_ver

next_ver("v1.2.3")  # "v1.2.4"
next_ver("v1.2.beta")  # "v1.2.beta.1"
```

<br/>

### 5.5. Content Composition

```python
# Define custom composer
def summary_composer(kl, **kwargs):
    return f"Summary: {kl.short_description}"

kl.content_composers["summary"] = summary_composer
kl.text("summary")  # "Summary: ..."
```

<br/>

### 5.6. Derivation

```python
# Create derived item
derived = kl.derive(
    content="Updated content",
    version_notes="Added new information"
)
# derived.version will be incremented, source="derived"
```

<br/>

## Further Exploration

> **Tip:** For the architecture and design principles behind UKF, see:
> - [Architecture](../../introduction/architecture.md) - Agent Heaven Architecture Overview

<br/>
