# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the AgentHeaven-docs repository.

## Project Overview

AgentHeaven-docs contains comprehensive bilingual documentation for the AgentHeaven framework. This repository serves as the central source of truth for all AgentHeaven documentation, providing both English and Chinese versions of all guides, API references, and tutorials.

### Relationship to Other Projects

- **AgentHeaven-dev**: The open-source Python package being documented
- **RubikSQL-dev**: Uses AgentHeaven as its foundation
- **RubikSQL-gui**: Desktop GUI consuming AgentHeaven through RubikSQL
- **RubikBench-dev**: Benchmarking suite that evaluates AgentHeaven-based systems

## Documentation Structure

### Language Organization
```
AgentHeaven-docs/
├── en/                      # English documentation
│   ├── source/             # Sphinx source files
│   ├── build/              # Built HTML (auto-generated)
│   └── _static/             # Static assets
├── zh/                      # Chinese documentation
│   ├── source/             # Sphinx source files
│   ├── build/              # Built HTML (auto-generated)
│   └── _static/             # Static assets
├── i18n.md                  # Translation glossary
├── shared/                  # Shared resources
└── scripts/                 # Build and sync scripts
```

### Documentation Types

1. **User Guides** (`guides/`) - Step-by-step tutorials
2. **API Reference** (`api/`) - Auto-generated API documentation
3. **Architecture** (`architecture/`) - System design and concepts
4. **Tutorials** (`tutorials/`) - Hands-on examples
5. **Development** (`development/`) - Contributor guide

## Quick Start

### Building Documentation
```bash
# In AgentHeaven-dev directory
conda activate ahvn
bash scripts/docs.bash en zh -s

# Or manually:
cd AgentHeaven-docs
sphinx-build en/source en/build
sphinx-build zh/source zh/build
```

### Viewing Documentation
- English: http://localhost:8000 (after serving)
- Chinese: http://localhost:8001 (after serving)

## Documentation Standards

### Language Requirements

#### English Documentation
- **Tone**: Professional yet accessible
- **Style**: Clear, concise, developer-friendly
- **Audience**: Python developers, AI/ML engineers
- **Format**: Markdown with Sphinx extensions

#### Chinese Documentation
- **Tone**: 专业但友好 (Professional but friendly)
- **Style**: 简洁明了 (Clear and concise)
- **Reference**: Use `i18n.md` glossary for consistency
- **Alignment**: Must match English structure exactly

### Formatting Standards

#### Section Structure
```markdown
# 1. Main Section
All main sections must be numbered (except structural sections like "Quick Navigation").

## 1.1 Subsection
Subsections also numbered.

Content paragraphs go here.

## 1.2 Another Subsection
More content.

<br/>  <!-- Sections must end with <br/> -->
```

#### Index Pages
All index pages must contain:
1. **Quick Navigation** section with grid layout
2. **Contents** section with toctree
3. Consistent emojis in titles
4. Same order across languages

#### Content Pages
Most pages should include:
1. **Further Exploration** section at end
2. Links to Chinese version (in Chinese docs)
3. Numbered sections ending with `<br/>`

### Code Documentation
- **Comments in code blocks**: Translate to Chinese in Chinese docs
- **Code itself**: Never translate
- **Strings in code**: Keep original
- **Image links**: Update to point to correct language version

## Translation Guidelines

### Using the Glossary
Always reference `AgentHeaven-docs/i18n.md` for:
- Technical term translations
- Consistent naming conventions
- Standard abbreviations

### Translation Process
1. Read English source carefully
2. Check source code for accuracy
3. Consult glossary for terms
4. Translate maintaining structure
5. Update glossary if new terms needed

### Priority Hierarchy
When conflicts arise:
1. **Source code** (highest priority)
2. English documentation
3. Test cases
4. Chinese documentation (lowest priority)

## Synchronization Workflow

### Code-to-Doc Sync
When AgentHeaven-dev code changes:
1. Identify affected documentation
2. Compare code with doc examples
3. Update English docs first
4. Sync to Chinese docs
5. Update glossary if needed

### Version Alignment
- Documentation version must match AgentHeaven release
- Tag documentation releases
- Maintain changelog in docs

## Common Tasks

### Adding New Documentation
1. Create English markdown in `en/source/`
2. Add to appropriate toctree
3. Build and verify English version
4. Create Chinese translation
5. Add Chinese to toctree
6. Update glossary if needed

### Updating API Docs
1. Ensure docstrings are updated in AgentHeaven-dev
2. Run sphinx-build to generate API docs
3. Review generated docs for clarity
4. Add manual explanations where needed
5. Translate additions to Chinese

### Fixing Documentation Issues
1. Identify discrepancy between code and docs
2. Verify actual behavior in code
3. Update English documentation
4. Synchronize Chinese documentation
5. Test both language builds

## Build System

### Sphinx Configuration
- Use `conf.py` in each language directory
- Extensions: autodoc, nbsphinx, sphinx_rtd_theme
- Custom theme for consistent branding

### Automated Builds
- GitHub Actions builds on push
- Auto-deploy to documentation site
- Link checking in CI

### Local Development
```bash
# Watch for changes
sphinx-autobuild en/source en/build
sphinx-autobuild zh/source zh/build

# Serve both languages
python -m http.server 8000 --directory en/build &
python -m http.server 8001 --directory zh/build &
```

## Quality Assurance

### Review Checklist
- [ ] English and Chinese versions match structurally
- [ ] All code examples are tested
- [ ] Links work correctly
- [ ] Images display properly
- [ ] Glossary is up-to-date
- [ ] No broken references

### Common Issues
1. **Outdated examples**: Code examples that don't match current API
2. **Missing translations**: New English content not yet translated
3. **Broken links**: References to non-existent sections
4. **Version mismatch**: Documentation for wrong AgentHeaven version

## Important Notes

- **Never edit build directories** (`en/build/`, `zh/build/`)
- **Always update source files** (`en/source/`, `zh/source/`)
- **Maintain exact line count** between language versions
- **Test all code examples** before including
- **Keep glossary current** with new terminology