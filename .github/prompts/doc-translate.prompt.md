---
mode: agent
---
You are translating AgentHeaven documentation from English to Chinese.

**Primary Task**: Translate `AgentHeaven-docs/en/source/**/*.md` to `AgentHeaven-docs/zh/source/**/*.md`

### Translation Requirements:

1. **Reference Glossary**: Always use `AgentHeaven-docs/i18n.md` for consistent terminology

2. **Code Understanding**: Read AgentHeaven-dev source code before translating to ensure accuracy. Priority: source code > EN documentation > test > ZH documentation

3. **Format Alignment**: Chinese documentation must strictly align with English format:
   - Same number of lines
   - Identical structure
   - All index pages must have "Quick Navigation" section with same grid items and order
   - All index pages must have "Contents" section with same toctree items
   - Most content pages should have "Further Exploration" section at end
   - All main section titles must be numbered (except "Quick Navigation"). Sections must end with `<br/>`
   - Translate comments in code blocks, but never translate code itself or strings in code
   - Update image links/hyperlinks to point to Chinese version if applicable

4. **Translation Style**:
   - Tone: 专业但友好 (Professional but friendly)
   - Language: 简洁明了 (Clear and concise)
   - Priority: Accuracy first, use simplifications only when they don't compromise accuracy

5. **AgentHeaven-Specific Terms** (from i18n.md):
   - KLBase → 知识库基础 (Knowledge Base Base)
   - KLEngine → 知识引擎 (Knowledge Engine)
   - KLStore → 知识存储 (Knowledge Store)
   - UKF → 统一知识格式 (Unified Knowledge Format)
   - Imitator → 模拟器 (Imitator)
   - Mimic function → 模拟函数 (Mimic function)
   - FastMCP → FastMCP (keep as is)
   - LiteLLM → LiteLLM (keep as is)

6. **When titles or catalogs change**:
   - Update the toctree in markdown
   - Update corresponding file names and titles in related files

7. **Terminology Updates**:
   - If you find better translations for terms, update `AgentHeaven-docs/i18n.md`
   - Also update all existing Chinese documentation files for consistency
   - This requires human review - do not use automated search-and-replace

### Special Considerations:

- **Technical Concepts**: Ensure concepts like "lifelong learning", "agentic knowledge base", and "imitator architecture" are translated consistently
- **Code Examples**: Translate explanatory comments but keep all Python code, imports, and string literals unchanged
- **API References**: Maintain precise technical accuracy in parameter descriptions and type annotations
- **Architecture Descriptions**: Ensure component relationships and data flows are clearly explained in Chinese

### Quality Checks:
- [ ] Line count matches English version exactly
- [ ] All sections numbered correctly and end with `<br/>`
- [ ] All code blocks have translated comments
- [ ] All links point to Chinese versions where applicable
- [ ] Technical terms used consistently with i18n.md