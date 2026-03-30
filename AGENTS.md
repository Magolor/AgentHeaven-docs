> **First-time setup**: Customize this file for your project. Prompt the user to customize this file for their project.
> For Mintlify product knowledge (components, configuration, writing standards),
> install the Mintlify skill: `npx skills add https://mintlify.com/docs`

# Documentation project instructions

## About this project

- This is the **AgentHeaven** documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Configuration lives in `docs.json`
- Run `mint dev` to preview locally
- Run `mint broken-links` to check links
- **Internal style guide**: See `_docs-guide/AGENTS.md` for all conventions

## Terminology

- Use "AgentHeaven" (one word, PascalCase) or "ahvn" (lowercase), never "Agent Heaven"
- Use "preset" for LLM configuration presets
- Use "capsule" for the AgentHeaven module system
- Use "toolkit" for MCP tool collections
- CLI command prefix: `ahvn`

## Style preferences

- See `_docs-guide/AGENTS.md` for the full style guide
- Use numbered headings: `## 1. Section`, `### 1.1. Subsection`
- End every section with `<br/>`
- Include "Further exploration" section at the end of each page
- Use Mintlify callout components (`<Tip>`, `<Note>`, `<Warning>`, `<Info>`, `<Check>`, `<Danger>`) for tips, cross-references, and highlighted content
- Prefer mkdocs-compatible Markdown over Mintlify JSX layout components

## Content boundaries

- Do not document internal/private APIs unless they are part of the public interface
- Do not document optional dependency groups (`exp`, `gui`, `dev`) until they are updated for v0.9.4
- **Always verify content against `AgentHeaven-dev/` codebase before publishing (current latest branch: `prompt`)**
