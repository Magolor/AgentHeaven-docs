# Configuration file for the Sphinx documentation builder.

import os
import sys
sys.path.insert(0, os.path.abspath('../../../src'))

# -- Project information -----------------------------------------------------

project = 'AgentHeaven'
copyright = '2025, RubikSQL Team'
author = 'RubikSQL Team'
release = '0.9.1'

# -- General configuration ---------------------------------------------------

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.viewcode',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.mathjax',
    'sphinx_autodoc_typehints',
    'myst_parser',
    'sphinx_copybutton',
    'sphinx_tabs.tabs',
    'sphinxcontrib.mermaid',
    'sphinx_design',
]

templates_path = ['_templates', '../../shared/templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output ------------------------------------------------

html_theme = 'furo'
html_static_path = ['_static', '../../shared/images']
html_css_files = ['custom.css']
html_js_files = ['line-numbers.js', 'mouse-spotlight.js', 'dynamic-background.js', 'sidebar-toggle.js']

html_theme_options = {
    "sidebar_hide_name": True,
    "light_logo": "logo-light.png",
    "dark_logo": "logo-dark.png",
    "source_repository": "https://github.com/Magolor/AgentHeaven/",
    "source_branch": "master",
    "source_directory": "docs/en/source/",
    "announcement": "🚧 AgentHeaven is in active development. Features may change.",
}

html_title = "AgentHeaven Doc"
html_short_title = "AgentHeaven Doc"
html_favicon = "../../shared/images/favicon.ico"

# Language selection
html_context = {
    'languages': [
        ('English', '/en/', 'en'),
        ('简体中文', '/zh/', 'zh'),
    ],
    'current_language': 'en',
}

# -- Extension configuration -------------------------------------------------

# AutoDoc configuration
autodoc_default_options = {
    'members': True,
    'undoc-members': True,
    'show-inheritance': True,
    'special-members': '__init__',
}

autodoc_typehints = 'description'
autodoc_preserve_defaults = True
autodoc_class_signature = 'mixed'

# Suppress duplicate object warnings
suppress_warnings = ['autodoc.duplicate_object', 'ref.python', 'autosummary', 'docutils']

# Add autosummary configuration for better cross-referencing
autosummary_mock_imports = []
autosummary_imported_members = True
autosummary_generate_overwrite = False
autosummary_ignore_module_all = False

# Configure autodoc to skip duplicate imports
autodoc_mock_imports = []
autodoc_member_order = 'bysource'
nitpicky = False

# Napoleon configuration (for Google/NumPy style docstrings)
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = False
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = False
napoleon_use_admonition_for_notes = False
napoleon_use_admonition_for_references = False
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_preprocess_types = False
napoleon_type_aliases = None
napoleon_attr_annotations = True

# Intersphinx mapping
intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'numpy': ('https://numpy.org/doc/stable/', None),
    'pandas': ('https://pandas.pydata.org/docs/', None),
}

# MyST Parser configuration
myst_enable_extensions = [
    "amsmath",
    "colon_fence",
    "deflist",
    "dollarmath",
    "html_admonition",
    "html_image",
    "replacements",
    "smartquotes",
    "substitution",
    "tasklist",
]

# Suppress specific warnings
myst_suppress_warnings = ["myst.xref_ambiguous"]

# Copy button configuration
copybutton_prompt_text = r">>> |\.\.\. |\$ |In \[\d*\]: | {2,5}\.\.\.: | {5,8}: "
copybutton_prompt_is_regexp = True

# Autosummary configuration
autosummary_generate = True

# Tabs configuration
sphinx_tabs_valid_builders = ['html']
sphinx_tabs_disable_tab_closing = True
