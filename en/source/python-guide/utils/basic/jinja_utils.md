# Template Processing

The `jinja_utils.py` module provides comprehensive utilities for working with Jinja templates and internationalization (i18n) via Babel in AgentHeaven. This guide will walk you through using the template system, Babel integration, and environment management step-by-step.

## 1. Getting Started

### 1.1. Template Structure

Each template directory in AgentHeaven follows a consistent structure that supports templates, custom filters, and i18n:

```
template_directory/
├── *.jinja                 # Jinja template files
├── filters/                # Custom Jinja filters
│   └── *.py                # Python filter modules
└── locale/                 # Babel i18n
    ├── babel.cfg           # Babel configuration
    ├── messages.pot        # Portable Object Template
    └── zh/LC_MESSAGES/     # Language-specific translations
        ├── messages.po     # Translation file
        └── messages.mo     # Compiled translation
```

The three main components of each template directory:

- **Templates (`.jinja` files)**: Contain the template content with Jinja syntax and translatable strings
- **Filters (`filters/` directory)**: Custom Python functions that extend Jinja's filtering capabilities  
- **Locale (`locale/` directory)**: Babel i18n files for multi-language support

<br/>

### 1.2. Basic Usage

`jinja_utils` provides three main functions for template management:

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env, babel_init, babel_compile

# Load a Jinja environment with default settings
env = load_jinja_env()

# Render a template from the experience directory
template = env.get_template("experience/default_instance.jinja")
result = template.render(inputs={"query": "test"}, output="response")
print(result)
```

<br/>

## 2. Jinja Environments

### 2.1. What is Jinja?

[Jinja](https://jinja.palletsprojects.com/en/stable/) is a fast, expressive, extensible templating engine for Python. Special placeholders in the template allow you to write code similar to Python syntax. The template is then passed data to render a final document. It's widely used for generating HTML, configuration files, and, with the rise of LLMs, prompt templates.

For example, you can create a template like this:

```jinja
Hello, {{ name }}! Welcome to our platform.
```

And then render it with Python:

```python
from jinja2 import Template

template = Template("Hello, {{ name }}! Welcome to our platform.")
output = template.render(name="Alex")
print(output)  # Output: Hello, Alex! Welcome to our platform.
```

This separation of logic and presentation makes it easy to create dynamic content.

<br/>

### 2.2. Loading Environments

The `load_jinja_env` function creates configured Jinja environments with automatic localization and filter loading:

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# Load from default scan paths (configured in prompts.scan)
env = load_jinja_env()

# Load from a single directory
env = load_jinja_env("path/to/templates")

# Load from multiple directories with choice loader
env = load_jinja_env(["templates/en", "templates/es"])

# Load with prefix loader for namespace separation
env = load_jinja_env({
    "experience": "src/ahvn/resources/prompts/experience",
    "autocode": "src/ahvn/resources/prompts/autocode"
})

# Load with specific language
env_zh = load_jinja_env(lang="zh")
```

<br/>

### 2.3. Built-in Templates

AgentHeaven organizes built-in templates in the `src/ahvn/resources/prompts/` directory with multiple template folders, each following the single template folder structure:

```
src/ahvn/resources/prompts/
├── experience/          # ExperienceUKFT templates
│   ├── default_instance.jinja
│   ├── correct_instance.jinja
│   ├── filters/         # Custom Jinja filters
│   │   └── value_repr.py
│   └── locale/          # Babel localization files
│       ├── babel.cfg
│       ├── messages.pot
│       └── zh/LC_MESSAGES/
│           ├── messages.po
│           └── messages.mo
├── autocode/           # Auto-code templates
│   └── default.jinja
├── autofunc/           # Auto-function templates
│   └── default.jinja
├── toolspec/           # Tool specification templates
│   └── default.jinja
└── po_translate/       # Translation templates
    └── default.jinja
```

### 2.4. Template Path Scanning

Besides the built-in templates, users can also add their own templates in the `prompts.scan` configuration.

When no path is specified during `load_jinja_env`, the system scans directories configured in `prompts.scan`:

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env
from ahvn.utils.basic.config_utils import HEAVEN_CM

# Check current scan configuration
scan_paths = HEAVEN_CM.get("prompts.scan", ["$ prompts/"])
print(f"Scan paths: {scan_paths}")

# Load with automatic scanning
env = load_jinja_env()

# Access templates by their directory prefix
template = env.get_template("experience/default_instance")
```

The scanner automatically:
- Expands paths using AgentHeaven's path resolution
- Creates prefix loaders for each subdirectory found
- Loads filters and translations from each directory

<br/>

### 2.5. Custom Filters

Custom Jinja filters are automatically loaded from `filters/` directories in each template directory:

```python
# Create a custom filter: my_filters/value_format.py
def value_format(value, precision=2):
    """Format numeric values with specified precision."""
    if isinstance(value, (int, float)):
        return f"{value:.{precision}f}"
    return str(value)

# The filter is automatically available in templates
env = load_jinja_env("path/to/templates")
template = env.get_template("my_template.jinja")

# Template usage: {{ price | value_format(3) }}
result = template.render(price=123.456789)
```

<br/>

## 3. Babel I18n

### 3.1. What is Babel?

[Babel](https://babel.pocoo.org/en/latest/) is a Python library that assists in internationalizing (i18n) and localizing (l10n) applications. It helps you manage translations for your project by providing tools to extract translatable text, create translation catalogs, and compile them for use at runtime.

For instance, you can mark a string in your Python code for translation:

```python
from babel.support import Translations

# Assume translations are loaded
translations = Translations.load('locale', ['en_US', 'de_DE'])
_ = translations.gettext

print(_('Hello, world!'))
```

When the application runs in a German locale, it might print `"Hallo, Welt!"` instead of `"Hello, world!"` if the translation is available. In AgentHeaven, Babel is integrated with Jinja to handle template translations seamlessly.

<br/>

### 3.1. How Jinja and Babel Work Together

AgentHeaven combines Jinja2 and Babel to create a powerful internationalization (i18n) workflow for prompts. This allows you to write a single prompt template and render it in multiple languages. Here’s how they interact:

1.  **Marking Translatable Text**: In your `.jinja` templates, you wrap any text that needs to be translated in `{% trans %}...{% endtrans %}` tags.
2.  **Extraction**: The `babel` command-line tool (or `babel_init` function) scans your templates, finds these `trans` blocks, and extracts the text into a `.pot` (Portable Object Template) file. This file is a master list of all translatable strings.
3.  **Translation**: From the `.pot` file, language-specific `.po` (Portable Object) files are created for each target language (e.g., `zh` for Chinese). Translators then fill in the corresponding translations for each string in these files. This step can be done manually or automated with the `ahvn babel translate` command.
4.  **Compilation**: The completed `.po` files are compiled into binary `.mo` (Machine Object) files using the `babel_compile` function. These files are optimized for fast lookups at runtime.
5.  **Rendering**: When you load a Jinja environment with a specific language (e.g., `lang="zh"`), it automatically finds and uses the corresponding `.mo` file. When it encounters a `{% trans %}` block during rendering, it replaces the original text with the translated version.

This entire process allows for a clean separation of prompt logic from translations, making it easy to manage and scale multilingual agent applications.

<br/>

### 3.3. Initialization

The `babel_init` function sets up i18n infrastructure:

```python
from ahvn.utils.basic.jinja_utils import babel_init

# Initialize Babel for a template directory
babel_init("src/ahvn/resources/prompts/experience")

# Initialize with specific languages
babel_init(
    "src/ahvn/resources/prompts/experience",
    langs=["zh", "es", "fr"],
    main="en"
)

# Initialize with overwrite (clear existing translations)
babel_init(
    "src/ahvn/resources/prompts/experience",
    langs=["zh"],
    overwrite=True
)
```

This creates:
- `locale/babel.cfg`: Babel configuration file
- `locale/messages.pot`: Portable Object Template with extractable strings
- `locale/zh/LC_MESSAGES/messages.po`: Translation file for Chinese

Then a recommended approach is to manually edit the `.po` files to add translations for each language.

> **Under Dev:** Add support for automatic translation via machine translation services.

<br/>

### 3.4. Compiling Translations

The `babel_compile` function compiles `.po` files into binary `.mo` files:

```python
from ahvn.utils.basic.jinja_utils import babel_compile

# Compile all available languages
babel_compile("src/ahvn/resources/prompts/experience")

# Compile specific languages
babel_compile(
    "src/ahvn/resources/prompts/experience",
    langs=["zh", "es"]
)

# Compile with auto-detection of available languages
babel_compile("src/ahvn/resources/prompts/experience")
```

The compiled `.mo` file can be recognized by Babel when loading the environment.

When loading the environment, specify the language to use:

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

env = load_jinja_env(lang="zh")
```

<br/>

### 3.5. Translatable Templates

Templates use Jinja's i18n extension for translatable content:

```jinja
{# experience/default_instance.jinja -#}
{% trans %}Inputs:{% endtrans %}
{% for key, value in inputs.items() -%}
- {{ key }}: {{ value | value_repr }}
{% endfor -%}

{% trans %}Output:{% endtrans %}
- {{ output | value_repr(-1) }}

{% if expected is defined -%}
{% trans %}Expected:{% endtrans %}
- {{ expected | value_repr(-1) }}
{% endif -%}
```

The translation workflow:
1. Create templates with `{% trans %}...{% endtrans %}` blocks
2. Run `babel_init()` to extract strings to `.pot` file
3. Translate strings in `.po` files
4. Run `babel_compile()` to compile to `.mo` files
5. Load environment with specific language

<br/>

## 4. Advanced Features

### 4.1. Multi-language Template Rendering

Render templates in different languages:

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# Load environments for different languages
env_en = load_jinja_env(lang="en")
env_zh = load_jinja_env(lang="zh")

# Render the same template in different languages
template_en = env_en.get_template("experience/default_instance")
template_zh = env_zh.get_template("experience/default_instance")

result_en = template_en.render(inputs={"test": "data"}, output="result")
result_zh = template_zh.render(inputs={"test": "数据"}, output="结果")
```

<br/>

### 4.2. Configuration Integration

The module integrates with AgentHeaven's configuration system:

```python
from ahvn.utils.basic.config_utils import HEAVEN_CM
from ahvn.utils.basic.jinja_utils import load_jinja_env

# Configure i18n settings
HEAVEN_CM.set("prompts.main", "en")        # Source language
HEAVEN_CM.set("prompts.lang", "zh")        # Target language
HEAVEN_CM.set("prompts.langs", ["zh", "es"]) # Available languages
HEAVEN_CM.set("prompts.scan", ["& prompts/"]) # Template scan paths

# Load with configuration defaults
env = load_jinja_env()  # Uses zh language automatically
```

<br/>

### 4.3. Integrating with UKF

> **Under Dev:** Add support for UKF (Unified Knowledge Format) integration.

<br/>

## 5. Best Practices

### 5.1. Example: ExperienceUKFT Formatting

The `experience/default_instance.jinja` template demonstrates advanced features.

#### 5.1.1. Jinja Template

```jinja
{#-
Required:
    inputs (Dict[str, Any]): A dictionary of input variables and their values.
    output (Any): The output value.
Optional:
    expected (Any): The expected output value. Omitted if not provided.
    cutoff (int): The maximum length for displaying input values, default to 256 (characters).
    hints (List[str]): A list of hints or additional information. Omitted if not provided.
Filters:
    value_repr(cutoff:int=256): A filter to format the value representation, truncating if necessary.
-#}
{% trans %}Inputs:{% endtrans %}
{% for key, value in inputs.items() -%}
- {{ key }}: {{ value | value_repr(cutoff|default(256)) }}
{% endfor -%}
{% trans %}Output:{% endtrans %}
- {{ output | value_repr(-1) }}
{% if expected is defined -%}
{% trans %}Expected:{% endtrans %}
- {{ expected | value_repr(-1) }}
{% endif -%}
{% if hints is defined and hints|length > 0 -%}
{% trans %}Hints:{% endtrans %}
{% for hint in hints -%}
- {{ hint }}
{% endfor -%}
{% endif -%}
```

#### 5.1.2. Custom Filters

The `value_repr` filter in `filters/value_repr.py`:

```python
CUTOFF_LENGTH_DEFAULT = 256

def value_repr(value, cutoff=CUTOFF_LENGTH_DEFAULT):
    """\
    Returns a string representation of the value, truncated to the specified length.

    Args:
        value: The value to be represented.
        cutoff: The maximum length of the string representation.
            If cutoff is negative, no truncation will be applied.

    Returns:
        A string representation of the value, truncated if necessary.
    """
    s = repr(value)
    return s if len(s) <= cutoff or cutoff < 0 else s[: cutoff - 3] + "..."
```

<br/>

#### 5.1.3. Usage

The template in AgentHeaven is already translated to both English and Chinese, therefore we can directly load them without i18n initialization.

> **Under Dev:** Add built-in template translations for more languages.

```python
from ahvn.utils.basic.jinja_utils import load_jinja_env

# Step 2: Load environment
env = load_jinja_env(lang="en")

# Step 3: Render with sample data
data = {
    "inputs": {
        "query": "What is the capital of France?",
        "context": "Geography question"
    },
    "output": "The capital of France is Paris.",
    "expected": "Paris",
    "cutoff": 50,
    "hints": ["Consider European geography", "Capital cities"]
}

template = env.get_template("experience/default_instance")
result = template.render(**data)
print(result)
```

Output:
```
Inputs:
- query: 'What is the capital of France?'
- context: 'Geography question'
Output:
- 'The capital of France is Paris.'
Expected:
- 'Paris'
Hints:
- Consider European geography
- Capital cities
```

<br/>

### 5.2. Template Organization

Organize templates effectively:

```python
# Good: Logical separation by functionality
template_paths = {
    "experience": "prompts/experience",
    "tools": "prompts/toolspec",
    "generation": "prompts/autocode"
}
env = load_jinja_env(template_paths)

# Good: Consistent naming conventions
template = env.get_template("experience/user_interaction")
```

<br/>

### 5.3. I18n Strategy

Plan for multiple languages:

```python
# Configure supported languages
HEAVEN_CM.set("prompts.langs", ["en", "zh", "es", "fr"])
b
# Use translatable strings in templates
# Good: {% trans %}Hello World{% endtrans %}
# Bad: Hello World

# Provide context for translators
# {# Context: User greeting message #}
# {% trans %}Welcome to AgentHeaven!{% endtrans %}
```

<br/>

## Further Exploration

> **Tip:** For more information about Prompting usage in AgentHeaven, see:
> - [Prompt Management](../../../cli-guide/prompt-management.md) - Prompt creation and localization in CLI

> **Tip:** For more information about utilities in AgentHeaven, see:
> - [Utilities](../index.md) - All Python utilities for convenience

<br/>
