# Prompt Management

AgentHeaven uses a combination of [Jinja2](https://jinja.palletsprojects.com/en/3.1.x/) templating and [Babel](https://babel.pocoo.org/en/latest/) for powerful and flexible prompt management. This approach allows you to separate prompt structures from the content, making it easy to manage, version, and localize prompts for different languages.

For a detailed guide on the underlying utilities, see [Jinja Utilities](../python-guide/utils/basic/jinja_utils.md).

<br/>

## 1. How Jinja and Babel Work Together

AgentHeaven combines Jinja2 and Babel to create a powerful internationalization (i18n) workflow for prompts. This allows you to write a single prompt template and render it in multiple languages. Here’s how they interact:

1.  **Marking Translatable Text**: In your `.jinja` templates, you wrap any text that needs to be translated in `{% trans %}...{% endtrans %}` tags.
2.  **Extraction**: The `babel` command-line tool (or `babel_init` function) scans your templates, finds these `trans` blocks, and extracts the text into a `.pot` (Portable Object Template) file. This file is a master list of all translatable strings.
3.  **Translation**: From the `.pot` file, language-specific `.po` (Portable Object) files are created for each target language (e.g., `zh` for Chinese). Translators then fill in the corresponding translations for each string in these files. This step can be done manually or automated with the `ahvn babel translate` command.
4.  **Compilation**: The completed `.po` files are compiled into binary `.mo` (Machine Object) files using the `babel_compile` function. These files are optimized for fast lookups at runtime.
5.  **Rendering**: When you load a Jinja environment with a specific language (e.g., `lang="zh"`), it automatically finds and uses the corresponding `.mo` file. When it encounters a `{% trans %}` block during rendering, it replaces the original text with the translated version.

This entire process allows for a clean separation of prompt logic from translations, making it easy to manage and scale multilingual agent applications.

> For more details on using Jinja2 for templating, refer to the [Template Processing](../python-guide/utils/basic/jinja_utils.md) documentation.

<br/>

## 2. Template Structure

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

> For more details on creating and using custom Jinja filters, refer to the [Template Processing](../python-guide/utils/basic/jinja_utils.md) documentation.

<br/>

## 3. Babel CLI Commands

The `ahvn babel` command group provides tools to manage the localization workflow.

<br/>

### 3.1. `ahvn babel init`

This command initializes the directory structure and configuration for Babel.

**Usage:**
```bash
ahvn babel init [PATH] [OPTIONS]
```

**Arguments:**
- `PATH`: The directory to initialize. Defaults to the current directory.

**Options:**
- `-l, --langs`: Specify target languages (e.g., `-l en -l zh`).
- `-m, --main`: The main (source) language.
- `-o, --overwrite`: Overwrite existing translation files.
- `-e, --encoding`: Encoding for the Babel configuration file.

<br/>

### 3.2. `ahvn babel translate`

Uses a Large Language Model (LLM) to automatically translate `.po` files from the source language to the target language(s).

**Usage:**
```bash
ahvn babel translate [PATH] [OPTIONS]
```

**Arguments:**
- `PATH`: The directory containing the `.po` files. Defaults to the current directory.

**Options:**
- `-s, --src-lang`: Source language for translation.
- `-t, --tgt-lang`: Target language for translation.
- `-o, --overwrite`: Overwrite existing translations in the `.po` files.
- `-b, --batch-size`: Number of entries to process in a single batch.
- `-h, --hint`: Provide hints to the LLM for translation.
- `-p, --llm-preset`: The LLM preset to use for translation (e.g., `translator`).

<br/>

### 3.3. `ahvn babel compile`

Compiles the `.po` translation files into `.mo` files, which are binary files used by the application at runtime.

**Usage:**
```bash
ahvn babel compile [PATH] [OPTIONS]
```

**Arguments:**
- `PATH`: The directory containing the `.po` files. Defaults to the current directory.

**Options:**
- `-l, --langs`: Specify which languages to compile.
- `-m, --main`: The main (source) language.

<br/>

## Further Exploration

> **Tip:** For more information about Prompts in AgentHeaven, see:
> - [Template Processing](../python-guide/utils/basic/jinja_utils.md) - Jinja + Babel templating utilities in Python

> **Tip:** For more information about CLI usage in AgentHeaven, see:
> - [LLM Inference](./llm-inference.md) - LLM inference tools in CLI
> - [LLM Session](./llm-session.md) - LLM interactive sessions in CLI
> - [Knowledge Management](./knowledge-management.md) - Knowledge base management in CLI
> - [Repo Management](./repo-management.md) - Project init, config, and management in CLI

<br/>
