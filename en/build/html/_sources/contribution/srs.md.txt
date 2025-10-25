# Simple SRS

This document outlines the high-level requirements for the AgentHeaven project.

## 1. Functional Requirements

| ID | Requirement | Description |
|---|---|---|
| FR-01 | Environment Management | The system shall allow users to create, activate, deactivate, and delete isolated project environments. |
| FR-02 | Knowledge Management | The system shall allow users to store, retrieve, lookup, edit, delete and merge knowledge artifacts in a consistent logical format, which is independent of the physical storage or retrieval method. |
| FR-03 | Unified LLM Interface | The system shall provide a unified interface for interacting with different LLM providers. |
| FR-04 | Unified KV Interface | The system shall provide a unified interface for interacting with different key-value stores. |
| FR-05 | Unified Database Interface | The system shall provide a unified interface for interacting with different databases. |
| FR-06 | Tool Management | The system shall provide a unified interface for serializing and interacting with different tools or native Python functions. |
| FR-07 | Cache/Memeory | The system shall provide a way for users to monitor any existing running system's inputs, outputs and intermediate emissions, and store them for later analysis or replay. |
| FR-08 | Retrieval Engine | The system shall provide a series of built-in retrieval methods, including string matching, faceted search, vector search, graph walks, and allow users to define their own retrieval methods. |
| FR-09 | Multi-lingual Prompt Engine | The system shall provide a way for users to define and manage prompts, which can be used to generate LLM inputs or Knowledge serializations, supporting multiple languages. |
| FR-10 | MCP Compatible | The system shall be compatible with the Multi-Component Protocol (MCP), so that it can be used as a component in a larger system, e.g., agent frameworks. |
| FR-11 | Database Native | The system shall provide a series of built-in tools specially designed for interacting with databases: including database context engineering and NL2SQL workflows. |
| FR-12 | GUI | The system shall provide a Graphical User Interface (GUI) for users to interact with the knowledge management system. It should be easy to use for non-developers. It should contain a user system for differentiating produced knowledge from different users. |
| FR-13 | CLI | The system shall provide a Command Line Interface (CLI) for users to interact with the knowledge management, LLM use, configuration, etc. |
| FR-14 | (Optional) Knowledge Distillation | The system shall provide a way for users to fine-tune LLMs on Cache/Memory data. It should be cross-platform compatible (LLama-Facotry/Unsloth/MLX) and extensible to NPUs. |
| FR-15 | (Optional) Basic Agents | The system shall provide a series of built-in agent orchestration, such as basic tool use agent, NL-based tool use agent (for non-function-call LLMs), ReAct agent, CodeAct agent. |
| FR-16 | (Optional) Test-time Scaling | The system shall provide useful Test-time Scaling (TTS) for LLMs. |
| FR-17 | (Optional) Distributed System | The system shall provide a way for users to run the knowledge management system in a distributed environment, with cross-platform knowledge exchange and retrieval. |
| FR-18 | (Optional) Authentication | The system shall provide a way for users to authenticate and authorize access to the knowledge management system. |

<br/>

## 3. Non-Functional Requirements

| ID | Requirement | Description |
|---|---|---|
| NFR-01 | Usability | The system should be easy to use by both developers and non-developers. |
| NFR-02 | Extensibility | The system architecture should be modular to allow for the addition of new LLM providers, tools, database dialects, agents, retrieval methods, rerankers, and knowledge base backends. |
| NFR-03 | NL2SQL Accuracy | The system should be able to rapidly develop an NL2SQL application with SOTA accuracy. |

<br/>