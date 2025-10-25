# 分配需求 (AR)

本文档分解了 SRS 中的需求，并将其分配到 AgentHeaven 架构中的特定组件。

## 1. 组件文档

| 组件 | 描述 |
|------|------|
| [BaseUKF](./base_ukf.md) | 核心知识表示格式 |
| [缓存](./cache.md) | 监控和临时存储 |
| [大语言模型](./llm.md) | 语言模型接口 |
| [提示词](./prompts.md) | 提示模板管理 |
| [数据库](./database.md) | 数据库交互 |
| [知识库存储](./klstore.md) | 知识存储 |
| [知识库引擎](./klengine.md) | 知识检索 |
| [知识库基础](./klbase.md) | 核心集成 |
| [智能体](./agent.md) | 智能体编排 |
| [结构化信息提取 (SIE)](./sie.md) | 数据提取工具 |
| [命令行界面 (CLI)](./cli.md) | 命令行界面 |

<br/>

## 2. 概述

本文档分解了[SRS](../srs.md)中的需求，并将其分配到 AgentHeaven 架构中的特定组件。每个组件的文档详细说明了其职责以及如何满足系统需求。

## 拓展阅读

> **提示：** 有关 AgentHeaven 架构的更多信息，请参见：
> - [贡献概览](../overview.md) - 贡献总体指南
> - [SRS 文档](../srs.md) - 软件需求规格说明
> - [开发者贡献指南](../for_developers.md) - 开发者贡献指南
>
> **提示：** 有关 AgentHeaven 开发的更多信息，请参见：
> - [主指南（Python）](../../python-guide/index.md) - Python 开发指南
> - [配置](../../configuration/index.md) - 配置系统完整指南
> - [入门指南](../../getting-started/index.md) - AgentHeaven 入门指南

<br/>
