# Documentation Agents Guide

This folder contains internal documentation standards for the AgentHeaven docs site.
It is excluded from the published site via `.mintignore` and serves as a reference for
both human contributors and AI agents maintaining the documentation.

## Project overview

- **Platform**: Mintlify (MDX-based)
- **Config**: `docs.json` in project root
- **Legacy source**: `AgentHeaven-docs-legacy/` (Sphinx/mkdocs)
- **Codebase**: `AgentHeaven-dev/` (v0.9.4+)

## Key conventions

### 1. Page structure

Every page should follow this structure:

```mdx
---
title: "Page Title"
description: "Short description for SEO."
---

<Note>
    *A funny note, captures the core design philosophy in a memorable way.*
</Note>

## 1. First Section

Content...

<br/>

## 2. Second Section

Content...

<Tip>For advanced usage, see [Advanced Section](/guides/topic/advanced).</Tip>

<br/>

## 3. Third Section

Content...

<br/>

## Further Exploration

<Tip>
    **Related resources:**
    - [Link 1](/path/to/page) - Description
    - [Link 2](/path/to/page) - Description
</Tip>

<br/>
```

### 2. Heading numbering

- Use numbered headings: `## 1. Section`, `### 1.1. Subsection`, `### 1.2. Subsection`
- Do NOT number the "Further exploration" section (it's a standard closing section)

### 3. Section separators

- End every section (including subsections) with `<br/>`
- This provides visual spacing and maintains consistency

### 4. Callout blocks

Use Mintlify callout components for tips, notes, warnings, and other highlighted content.
These render as styled cards with icons on the Mintlify site.

Available callout types (in order of severity):

| Component     | Purpose                                      |
|---------------|----------------------------------------------|
| `<Tip>`       | Recommendations, best practices, cross-links |
| `<Note>`      | Supplementary info, safe to skip             |
| `<Info>`      | Helpful context (e.g., permissions, prereqs) |
| `<Check>`     | Success confirmation                         |
| `<Warning>`   | Potentially destructive or risky actions      |
| `<Danger>`    | Critical warnings, data loss risks            |

Usage example for cross-references between sections:

```mdx
<Tip>
    For advanced configuration, see [Configuration overview](/concepts/configuration).
</Tip>
```

Usage example for the "Further exploration" section:

```mdx
## Further Exploration

<Tip>
    **Getting started:**
    - [5-minute setup](/quickstart/five-minute-setup) — fast path to basic usage
    - [Your first chat](/quickstart/first-llm-chat) — start chatting with LLMs
</Tip>

<Tip>
    **Configuration:**
    - [Configuration overview](/concepts/configuration) — core configuration concepts
</Tip>
```

### 5. Syntax preferences

- **Prefer mkdocs-compatible Markdown** over Mintlify MDX components
    - Use standard markdown tables, code blocks, lists, bold/italic
    - Use `<br/>` (works in both mkdocs and Mintlify)
    - Avoid Mintlify-specific JSX layout components (e.g., `<Tabs>`, `<Accordion>`, `<Card>`) unless absolutely necessary
    - This ensures portability if the docs platform changes
- **Exception — callouts**: Use Mintlify callout components (`<Tip>`, `<Note>`, `<Warning>`, etc.) for tips and cross-references. These are the one Mintlify-specific component we use consistently. If migrating away from Mintlify, these can be bulk-converted to admonitions or blockquotes.
- **Exception — frontmatter**: `title`, `description` are required by Mintlify and are fine
- **Indentation**: Always use 4 spaces for indentation in code blocks, lists, and nested content. Do NOT use tabs.

### 6. Code blocks

- Always include language tags: ` ```bash `, ` ```python `, etc.
- Use realistic values, not placeholder names like "foo" or "bar"
- Provide separate code blocks per tool (pip, uv, poetry, conda) rather than one block with comments

### 7. Internal links

- Use root-relative paths without file extensions: `/quickstart/installation`
- Do NOT use relative paths (`../`) or absolute URLs for internal pages

### 8. Writing style

- Default to first person plural ("we") when describing AgentHeaven, its design, and its built-in workflows
- Use second person ("you") when the reader is customizing, choosing, or running something on their own
- Active voice, direct language
- Title case (e.g., "Getting Started", not "Getting started")
- Use short title with only nounphrases whenever possible (e.g., "Installation", not "How to Install AgentHeaven")
- No marketing language ("powerful", "seamless", "cutting-edge")
- No filler phrases ("it's important to note", "in order to")

### 9. Images

- Store in `/images/`, reference as `/images/filename.png`
- Always include descriptive alt text

## File naming

- Use kebab-case: `five-minute-setup.mdx`, `api-reference.mdx`
- Match existing patterns in the directory

## Navigation

- Every new page MUST be added to `docs.json` navigation
- Hidden pages (not in nav) are only accessible by direct URL

## Current migration notes

- We are migrating from `AgentHeaven-docs-legacy/` (Sphinx) to this Mintlify site
- AgentHeaven-dev v0.9.4 is significantly different from previous versions
- Optional dependency groups (`exp`, `gui`, `dev`) are dropped for now — they need updates
- Always verify content against the current codebase before publishing
