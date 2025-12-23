---
mode: agent
---
You are creating new documentation for AgentHeaven. This could be for new features, updated architecture, or comprehensive guides.

**Context**: You are working in the AgentHeaven-docs repository, which documents the AgentHeaven framework (an open-source Python package providing knowledge management utilities for modern LLM Agents).

### Documentation Creation Process:

1. **Understand the Feature/Topic**:
   - Review the relevant source code in AgentHeaven-dev
   - Understand the feature's purpose, architecture, and usage
   - Identify key components, APIs, and workflows
   - Check for existing examples or test cases

2. **Plan Documentation Structure**:
   - Determine appropriate documentation type (API guide, tutorial, reference)
   - Plan sections and subsections
   - Identify code examples needed
   - Consider both English and Chinese versions

3. **Write English Version First**:
   - Create file in `AgentHeaven-docs/en/source/`
   - Follow AgentHeaven documentation standards:
     - Number all main sections (except "Quick Navigation")
     - End sections with `<br/>`
     - Include "Further Exploration" section for most pages
     - Use clear, developer-friendly language
   - Include practical, tested code examples
   - Add to appropriate toctree in index files

4. **Content Guidelines**:
   - **API Documentation**: Describe parameters, return values, exceptions
   - **Tutorials**: Step-by-step, with expected outputs
   - **Architecture**: Explain component interactions and design decisions
   - **Guides**: Address common use cases and patterns

5. **AgentHeaven-Specific Content**:
   - Always demonstrate using `ahvn.utils` instead of system utilities
   - Show proper KLBase, KLEngine, KLStore usage
   - Include UKF format examples where relevant
   - Demonstrate LLM integration with LiteLLM
   - Show tool creation with FastMCP 2.0
   - Include caching strategies and adapter usage

6. **Create Chinese Translation**:
   - Create parallel file in `AgentHeaven-docs/zh/source/`
   - Use `AgentHeaven-docs/i18n.md` glossary for consistency
   - Maintain exact structure and line count
   - Follow all formatting requirements

7. **Update Navigation**:
   - Add new pages to appropriate toctrees
   - Update "Quick Navigation" grids if needed
   - Ensure cross-references are correct

8. **Quality Assurance**:
   - Test all code examples
   - Verify all links work
   - Build both language versions
   - Check for consistency with existing docs

### Documentation Types:

#### **API Reference Pages**
```markdown
# 1. ModuleName API

## 1.1 Overview
Brief description of module purpose.

## 1.2 Classes

### ClassA
Description of ClassA.

#### Parameters
- `param1` (type): Description
- `param2` (type, optional): Description

#### Methods
##### method_name(param1: type) -> return_type
Description of method.

<br/>
```

#### **Tutorial Pages**
```markdown
# 1. Tutorial Title

## 1.1 Prerequisites
What user needs before starting.

## 1.2 Step 1: Setup
Code and explanation.

## 1.3 Step 2: Implementation
Code and explanation.

## 1.4 Expected Output
Show what user should see.

<br/>
```

#### **Architecture Pages**
```markdown
# 1. Architecture Component

## 1.1 Overview
High-level description.

## 1.2 Components
List and describe subcomponents.

## 1.3 Data Flow
Explain how data moves through system.

## 1.4 Integration
How to use with other components.

<br/>
```

### Important Reminders:
- Always include import statements in examples
- Use `from ahvn.utils import ...` instead of system utilities
- Test examples with current AgentHeaven-dev code
- Add to both language navigation structures
- Update glossary if introducing new terms