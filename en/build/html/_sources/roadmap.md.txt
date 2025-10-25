# Roadmap

## v0.9.1 (Beta)

- [ ] LLM Integration
    - [ ] Tool Use Refactor
    - [ ] Batch Inference Testing
    - [ ] Ensemble

- [ ] KLBase
    - [ ] MCP Compatibility

- [ ] Imitator
    - [ ] ICL Mimic
    - [ ] Cache Mimic
    - [ ] Codegen Mimic

- [ ] UKF Variants
    - [x] Resource
    - [ ] TemplateUKFT (as a special type of ExperienceUKFT)
    - [x] Prompt (as a special type of Resource)
    - [ ] Tool?

- [ ] Demos
    - [ ] Simple Tool Use
    - [ ] Rubik NL2SQL
    - [ ] Doc Translate

<br/>

## v1.0.0 (Stable)

- [ ] Backends
    - [ ] Neo4j for KLStore/KLEngine
    - [ ] Mongo for Cache/KLStore/KLEngine

- [ ] GUI
    - [ ] LLM Chat/Session GUI
    - [ ] Knowledge Management GUI
        - [ ] View
        - [ ] Upsert/Delete
        - [ ] Smart Search (Keyword/Regex/Vector/Relation)
        - [ ] Flush
        - [ ] Snapshot?
    - [ ] Repo Management GUI
    - [ ] Agent GUI

- [ ] Agent
    - [ ] AgentSpec v1.0

- [ ] Robust Database Handling
    - [ ] Safely create and drop postgres/mysql DBs
    - [ ] Check in-memory database support

- [ ] User System
    - [ ] Authority Control
    - [ ] User signature for UKFs

- [ ] Claude Skills Compatibility
    - [ ] Skills Creator as a Skill

<br/>

## V1.1.0 (Preview)

- [ ] Git-based Version Control
    - [ ] Snapshot / Revert
    - [ ] Branching

- [ ] Database Integration
    - [ ] Views / Materialized Views
    - [ ] Updates (with Version Control?)

- [ ] Backends
    - [ ] Elastic for KLEngine

- [ ] Imitator
    - [ ] SFT/LoRA Mimic

<br/>

## v2.0.0 (Visionary)

- [ ] BaseUKF v2.0

- [ ] Lakehouse Integration

- [ ] LLMEnsemble

- [ ] LangChain/LangGraph Compatibility

- [ ] AgentHeaven should self-contain via UKFs
    - For example, descriptions of UKFs should be defined as UKFs themselves
    - Built-in templates should be UKFs
    - Prompts should be UKFs, created by other prompts or workflows
    - Tools should be UKFs, created by other prompts or workflows
    - AgentSpecs should be UKFs, created by other prompts or workflows

<br/>
