# 提示词 - 分配需求

本文档概述了 AgentHeaven 架构中提示词组件的分配需求。

## 1. 概述

提示词组件管理系统中的提示模板及其版本控制。

<br/>

## 2. 分配需求

### 2.1 功能需求

| ID | 需求 | 实现细节 | 优先级 |
|----|------|----------|--------|
| FR-05 | 提示模板 | 管理Jinja模板和版本 | 高 |
| FR-09 | 多语言提示引擎 | 支持多语言提示 | 高 |
| NFR-04 | 文档 | 记录提示模板和版本 | 中 |

<br/>

### 2.2 跨组件依赖

| 组件 | 描述 |
|------|------|
| BaseUKF | 用于存储提示模板 |
| 大语言模型 | 用于执行提示 |
| 知识库基础 | 用于检索上下文感知提示 |

<br/>

## 3. 实现说明

[在此添加实现说明]

<br/>

## 4. 待解决问题

[列出任何未解决的问题或疑问]

## 拓展阅读

> **提示：** 有关 AgentHeaven 中的 prompts 与模板的更多信息，请参见：
> - [主指南（Python） - Jinja 工具](../../python-guide/utils/basic/jinja_utils.md) - 模板处理与 Jinja 集成
> - [配置 - 核心](../../configuration/core.md) - 核心配置概念
> - [主指南（Python） - 配置工具](../../python-guide/utils/basic/config_utils.md) - 配置管理实用工具
>
> **提示：** 有关 AgentHeaven 架构的更多信息，请参见：
> - [LLM 组件](./llm.md) - LLM 集成与接口
> - [Agent 组件](./agent.md) - Agent 实现与架构
> - [CLI 指南 - LLM 推理](../../cli-guide/llm-inference.md) - 命令行 LLM 推理工具

<br/>
