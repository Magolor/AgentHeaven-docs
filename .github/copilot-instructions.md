# AgentHeaven Documentation Development Instructions

## Background

AgentHeaven-docs contains comprehensive bilingual documentation for the AgentHeaven framework. This repository serves as the central source of truth for all AgentHeaven documentation, providing both English and Chinese versions of all guides, API references, and tutorials.

### Project Ecosystem
- **AgentHeaven-dev**: The open-source Python package being documented
- **RubikSQL-dev**: Uses AgentHeaven as its foundation
- **RubikSQL-gui**: Desktop GUI consuming AgentHeaven through RubikSQL
- **RubikBench-dev**: Benchmarking suite that evaluates AgentHeaven-based systems

## General Instructions

When working on documentation:

1. **Plan**: Understand which documentation needs updating or creating
2. **Verify**: Check the source code in AgentHeaven-dev for accuracy
3. **Write**: Create clear, accurate documentation following standards
4. **Translate**: Ensure Chinese version matches English exactly
5. **Review**: Test all examples and verify all links
6. **Build**: Confirm both language versions build successfully

## Environment & Setup

```bash
# In AgentHeaven-dev directory (for building docs)
conda activate ahvn

# Build and serve documentation
bash scripts/docs.bash en zh -s
```

## Project-Specific Instructions

### Documentation Standards

#### Language Requirements
- **English**: Professional yet accessible, developer-friendly
- **Chinese**: 专业但友好 (Professional but friendly), use `i18n.md` glossary
- **Structure**: Both versions must have identical structure and line count

#### Formatting Rules
- **Section Numbering**: All main sections must be numbered (except "Quick Navigation")
- **Section Endings**: All sections must end with `<br/>`
- **Index Pages**: Must contain "Quick Navigation" grid and "Contents" toctree
- **Code Blocks**: Translate comments, never translate code itself
- **Links**: Update to point to correct language version

#### Translation Process
1. **Source Code Priority**: When conflicts, follow hierarchy: source code > English docs > tests > Chinese docs
2. **Glossary**: Always reference `i18n.md` for consistent terminology
3. **Structure Maintenance**: Chinese docs must match English structure exactly
4. **Line Count**: Keep same number of lines between versions

### Synchronization Workflow

#### Code-to-Documentation Sync
- Verify all code examples against AgentHeaven-dev
- Update English documentation first
- Synchronize changes to Chinese documentation
- Update glossary for new terminology

#### Version Alignment
- Documentation version must match AgentHeaven release
- Tag documentation releases
- Maintain changelog in documentation

## Development Commands

### Building Documentation
```bash
# In AgentHeaven-dev directory
conda activate ahvn

# Build both languages and serve
bash scripts/docs.bash en zh -s

# Or manually in AgentHeaven-docs
sphinx-build en/source en/build
sphinx-build zh/source zh/build
```

### Local Development
```bash
# Watch for changes
sphinx-autobuild en/source en/build
sphinx-autobuild zh/source zh/build

# Serve both languages
python -m http.server 8000 --directory en/build &
python -m http.server 8001 --directory zh/build &
```

## Documentation Types

### 1. API Documentation
- Auto-generated from AgentHeaven-dev docstrings
- Must be reviewed for clarity
- Add explanations for complex APIs

### 2. User Guides
- Step-by-step tutorials
- Practical examples
- Common use cases

### 3. Architecture Documentation
- System design explanations
- Component interactions
- Design decisions

### 4. Development Guide
- Contributing instructions
- Code standards
- Release process

## Quality Assurance

### Review Checklist
- [ ] English and Chinese versions match structurally
- [ ] All code examples are tested
- [ ] Links work correctly
- [ ] Images display properly
- [ ] Glossary is up-to-date
- [ ] No broken references

### Common Issues to Avoid
1. **Outdated examples**: Code examples that don't match current API
2. **Missing translations**: New English content not yet translated
3. **Broken links**: References to non-existent sections
4. **Version mismatch**: Documentation for wrong AgentHeaven version

## Content Guidelines

### Writing Style
- **English**: Clear, concise, active voice
- **Chinese**: 简洁明了, 避免过于正式
- **Technical Terms**: Use glossary for consistency
- **Examples**: Always include practical, tested examples

### Code Documentation
```markdown
```python
# This comment should be translated in Chinese docs
from ahvn.klbase import KLBase

# This code remains unchanged
kb = KLBase()
```
```

### Link Management
- Internal links: Use relative paths
- External links: Verify they work
- Cross-language: Link to correct language version
- Images: Place in `_static/` after build

## Translation Guidelines

### Using the Glossary
Always check `AgentHeaven-docs/i18n.md` for:
- Technical term translations
- Consistent naming conventions
- Standard abbreviations

### When to Update Glossary
- New technical terms introduced
- Better translation found
- Inconsistencies discovered
- Requires human review and approval

## Important Constraints

- **NEVER edit build directories** (`en/build/`, `zh/build/`)
- **ALWAYS update source files** (`en/source/`, `zh/source/`)
- **MAINTAIN exact line count** between language versions
- **TEST all code examples** before including
- **KEEP glossary current** with new terminology

## Repository Structure Standards

```
AgentHeaven-docs/
├── en/                      # English documentation
│   ├── source/             # Sphinx source files
│   ├── build/              # Built HTML (auto-generated, DO NOT EDIT)
│   └── _static/             # Static assets
├── zh/                      # Chinese documentation
│   ├── source/             # Sphinx source files
│   ├── build/              # Built HTML (auto-generated, DO NOT EDIT)
│   └── _static/             # Static assets
├── i18n.md                  # Translation glossary (maintain carefully)
├── shared/                  # Shared resources
└── scripts/                 # Build and sync scripts
```