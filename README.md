# AgentHeaven Documentation

This repository contains the documentation for AgentHeaven, now separated into its own public repository.

## Structure

- `en/` - English documentation
- `zh/` - Chinese documentation  
- `shared/` - Shared resources and images
- `i18n.md` - Internationalization guide
- `structure.md` - Documentation structure overview

## Building

To build the documentation locally, see the build instructions in each language folder.

## 🌍 Multi-Language Support
- **Primary**: English (`en/`)
- **Secondary**: Simplified Chinese (`zh/`)

## 📁 Directory Layout

```
docs/
├── en/                          # English documentation
│   ├── source/                  # Sphinx source files (English)
│   │   ├── *.md                 # English Markdown files
│   │   ├── api/                 # Auto-generated API docs (English only)
│   │   ├── _static/             # Static assets for English docs
│   │   └── conf.py              # English configuration
│   ├── build/                   # Built English documentation
│   └── Makefile                 # Build configuration
├── zh/                          # Chinese documentation  
│   ├── source/                  # Sphinx source files (Chinese)
│   │   ├── *.md                 # Chinese Markdown files
│   │   ├── api/                 # Auto-generated API docs (shared structure)
│   │   ├── _static/             # Static assets for Chinese docs
│   │   └── conf.py              # Chinese configuration
│   ├── build/                   # Built Chinese documentation
│   └── Makefile                 # Build configuration
├── shared/                      # Shared assets
│   └── images/                  # Images and diagrams
├── i18n.md                      # Translation glossary
├── requirements.txt             # Documentation build dependencies
└── README.md                    # This documentation structure file
```

## 📖 Content Organization

### **Documentation Structure**

1. **Introduction**
   - Index (Landing page)
   - Concept (Core philosophy and approach)
   - Architecture (System architecture overview)
   - Learning (Learning resources and pathways)

2. **Getting Started**
   - Index (Getting started overview)
   - Installation (Installation guide)
   - Setup (Configuration and setup)
   - 5-Minute Quick Start (Rapid start guide)
   - 60-Minute Tutorial (Comprehensive tutorial)

3. **CLI Guide**
   - Index (CLI overview)
   - Repo Management (Repository management commands)
   - LLM Inference (Language model inference commands)
   - LLM Session (Interactive session management)
   - Knowledge Management (Knowledge base operations)

4. **Configuration**
   - Index (Configuration)
   - Core (Core configuration options)
   - LLM (Language model configuration)
   - Database (Database configuration)
   - Advanced (Advanced configuration options)

5. **Main Guide (Python)**
   - Index (Python API overview)
   - Utilities
     - Index (Utilities overview)
     - Basic (Basic utilities)
     - Extensions (Extended utilities)
   - Cache (Caching system)
   - LLM (Language model integration)
   - UKF (Unified Knowledge Format)
     - Index (UKF overview)
     - UKF v1.0 (Version 1.0 specification)
     - Built-in Templates (Template system)
   - KLStore (Knowledge storage layer)
   - KLEngine (Knowledge utilization layer)
   - KLBase (Knowledge base management)
   - Agent (Agent system integration)

6. **GUI Guide**
   - Index (GUI overview and usage)

7. **Example Applications**
   - Index (Examples overview)
   - NL2SQL System (Natural language to SQL system)

8. **Community**
   - Index (Community overview)
   - Resources (Community resources and links)
   - Troubleshooting (Common issues and solutions)

9. **API Reference**
   - API Index (Complete API documentation)
   - Auto-generated API docs (Detailed module documentation)

10. **Roadmap**
    - Development roadmap and future plans

11. **Contribution**
    - Contribution guidelines and development setup

12. **Citation**
    - How to cite AgentHeaven in academic work

13. **License**
    - License information and terms
