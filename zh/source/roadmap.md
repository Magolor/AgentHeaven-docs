# 开发规划

## v0.9.1 (Beta)

- [ ] LLM 集成
    - [ ] 工具使用重构
    - [ ] 批量推理测试
    - [ ] 集成

- [ ] KLBase
    - [ ] MCP 兼容性

- [ ] Imitator
    - [ ] ICL 模仿
    - [ ] Cache 模仿
    - [ ] Codegen 模仿

- [ ] UKF 变体
    - [x] Resource
    - [ ] TemplateUKFT（作为一种特殊类型的 Experience）
    - [x] Prompt（作为一种特殊类型的 Resource）
    - [ ] Tool?

- [ ] Demos
    - [ ] 简单工具使用
    - [ ] Rubik NL2SQL
    - [ ] 文档翻译

<br/>

## v1.0.0 (Stable)

- [ ] 后端
    - [ ] KLStore/KLEngine 的 Neo4j 支持
    - [ ] Cache/KLStore/KLEngine 的 Mongo 支持

- [ ] GUI
    - [ ] LLM 聊天/会话 GUI
    - [ ] 知识管理 GUI
        - [ ] 查看
        - [ ] Upsert/删除
        - [ ] 智能搜索（关键词/正则/向量/关系）
        - [ ] 刷新
        - [ ] 快照?
    - [ ] 仓库管理 GUI
    - [ ] Agent GUI

- [ ] Agent
    - [ ] AgentSpec v1.0

- [ ] 稳健的数据库处理
    - [ ] 安全地创建和删除 Postgres/MySQL 数据库
    - [ ] 检查内存数据库支持

- [ ] 用户系统
    - [ ] 权限控制
    - [ ] UKFs 的用户签名

- [ ] Claude Skills 兼容性
    - [ ] Skills 创造工具作为一种 Skill

<br/>

## V1.1.0 (Preview)

- [ ] 基于 Git 的版本控制
    - [ ] 快照 / 恢复
    - [ ] 分支

- [ ] 数据库集成
    - [ ] 视图 / 物化视图
    - [ ] 更新（带版本控制？）

- [ ] 后端
    - [ ] KLEngine 的 Elastic 支持

- [ ] Imitator
    - [ ] SFT/LoRA 模仿

<br/>

## v2.0.0 (Visionary)

- [ ] BaseUKF v2.0

- [ ] Lakehouse 集成

- [ ] LLMEnsemble

- [ ] LangChain/LangGraph 兼容性

- [ ] AgentHeaven 通过UKF实现自包含
    - 例如，UKF 的描述应该作为 UKF 本身定义
    - 内置模板应该是 UKF
    - 提示应该是 UKF，由其他提示或工作流创建
    - 工具应该是 UKF，由其他提示或工作流创建
    - AgentSpecs 应该是 UKF，由其他提示或工作流创建

<br/>
