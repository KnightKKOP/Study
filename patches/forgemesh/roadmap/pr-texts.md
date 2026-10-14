# 路线图 PR 的标题与描述

## 架构设计文档 v1.1：`cursor/docs-architecture-refresh-b108`（待提交）

分支叠放在路线图第 2 版（`cursor/docs-roadmap-backends-b108`）之上，只改文档。

### 标题

```text
docs(architecture): 架构设计文档修订为 v1.1：清理复制残留，与 ADR 和 1.1.0 对齐，新增执行后端与模型服务接入
```

### 描述

```markdown
## 概述

`docs/architecture/architecture.md` 是从一段对话回答及其渲染页面复制进仓库的：开头是对话回复，代码块前带着「YAML」「运行」等界面标签，三张示意图在 GitHub 上都显示不出来（一张指向本机磁盘上的 PNG，两张是内联为 SVG data URI 的 mermaid 输出，占了文件的一半以上）。正文还有几处与已采纳的 ADR 和已合入的实现不符。本 PR 把它修订为 v1.1。只改文档。

**依赖**：基于路线图第 2 版的 PR（`cursor/docs-roadmap-backends-b108`），新增的 10.4 与 11.5 引用其中的主题。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/docs-roadmap-backends-b108...cursor/docs-architecture-refresh-b108)。

## 改动

- **清理（第 1 个提交）**：
  - 开头的对话回复改为一段说明：文档的定位、实现状态与后续计划分别在哪里看、`v1alpha1` 与 API 稳定性的关系；
  - 去掉界面标签，代码块标注语言；
  - 三张示意图改为 mermaid 源码：两张 SVG 逐个节点解码，总体架构图按 3.1 节的分层重绘；文件从 126 KB 减到约 64 KB（含后面新增的内容）；
  - YAML 头原来声称正文「原样引入、未作删改」，并以本机磁盘上的文件为唯一事实来源，这在 ADR-013 之后已经不成立。现在改为仓库中的本文件是唯一事实来源，文末新增修订记录。
- **对齐（第 2 个提交）**：
  - ADR 总表补上 ADR-014，ADR-007 标注为目标态；
  - 权威存储的表述（3.1、3.2、4.2、16.1）改为 SQLite 先行（ADR-013）；5.5 写明单写者阶段控制平面以单进程运行；
  - 写明 1.1.0 已实现的部分：API、认证与错误信封（13.1），事件信封与投递保证（13.2），网关的转发规则（14.1），指标与追踪上下文（15.1、16.1）；
  - 17.1 按实际目录更正。README 称它为仓库结构的权威定义，而原文列出了不存在的文档与目录，漏掉了 `scripts/`、`docs/governance/`、`docs/releases/`、一个插件与大部分网关包；
  - 第 19 节标明为 v1.0 的原始路线并指向 roadmap.md；第 20 节的 ADR 范围改为 001–014，并指向路线图的正式版验收表。
- **新增（第 3 个提交）**：
  - 10.4 执行后端：启动器契约 `RuntimeLauncher`、各执行后端及其状态，以及与 KServe、Kthena 的分工；
  - 11.5 模型服务（MaaS）的接入：网关是推理流量的唯一入口，认证、配额与计量只执行一次，跨后端的放置；
  - 非目标、分层与总体架构图、已知限制与架构结论同步。
- **记录（第 4 个提交）**：README 的六层概览同步 L1 与 L5；CHANGELOG 记录这次修订。
- 章节编号不变（只新增 10.4 与 11.5），ADR 与其他文档中对章节的引用仍然有效。

## 兼容性

只改文档。

## 测试

- CI 的 architecture-docs job 中的各项检查与 4 个校验脚本在本地通过；文档中的相对链接都指向存在的文件，表格的列数一致。
- 三张 mermaid 图只用 flowchart 的基本语法；由 SVG 解码的两张图与原图的节点和连线一一对应。
- 17.1 的目录树与仓库的实际目录逐项核对。

## 检查项

- [x] 分支基于路线图第 2 版的 PR（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] 只改文档；CI 的文档检查在本地通过。
- [x] 章节编号不变，现有引用仍然有效。
- [ ] ADR：本 PR 不新增 ADR。10.4 中与 KServe、Kthena 的分工是对 1.3 非目标与 ADR-001 的细化，如果维护者认为需要，可以补一份 ADR；模型的抽象与 Kubernetes 后端的接入方式在实施时另写 ADR。
- [x] CHANGELOG 与 README 已同步。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

## 第 2 版：`cursor/docs-roadmap-backends-b108`（待提交）

分支基于上游 `main`（`cd5226f`，#24 合入之后），只改文档，不依赖其他 PR。

### 标题

```text
docs(architecture): 路线图第 2 版：Kubernetes 上以 Kthena / KServe 为执行后端，各主题注明承接的遗留问题
```

### 描述

```markdown
## 概述

#24 合入的路线图第 1 版计划在 Kubernetes 上自己实现多副本、多机、prefill / decode 分离、扩缩与推理感知的路由。这些能力 KServe（`LLMInferenceService`，自 v0.17 起标为生产可用）与 Kthena（`ModelServing` 与 router）已经提供，重做的意义不大；而两者都不管理 GPU 本身、只在 Kubernetes 上运行，也没有租户、计费用的用量记录、审批与审计这类平台层能力。本 PR 据此调整路线图的分工，并在每个主题中注明它承接的遗留问题。只改文档。

**依赖**：基于最新 `main`（`cd5226f`，#24 合入之后），不依赖其他 PR。

## 改动

- **新增 1.2 节「与 Kubernetes 原生推理框架的关系」**：
  - 两者覆盖什么、不覆盖什么；
  - 按资源层、工作负载层、请求路由层与平台治理层列出分工：Kubernetes 上的工作负载与实例选择交给后端；裸机、单机与边缘环境由 Node Agent 与 ForgeMesh 自己的启动器覆盖；平台治理层以 ForgeMesh 为准；
  - 原则：认证、配额与计量只在 ForgeMesh 网关执行一次，转发给后端时关闭或放宽后端的限流，并把已认证的主体传给后端；
  - 参考的设计点与对应的主题：Kthena 的 `ModelServing` / `ModelServer` / `ModelRoute`、KServe 的 `ServingRuntime` 与 `LocalModelCache`、Gateway API Inference Extension 的实例选择器、token 限流与公平排队、扩缩策略、多机与 prefill / decode 分离；
  - ForgeMesh 的 `InferenceService` 与 KServe 的同名，对接时要写清对应关系。
- **主题调整**：
  - 4.1-B 改为「容器启动器与 Kubernetes 后端」，拆成 3 个 PR：`container` 启动器、`kthena` 后端（生成 `ModelServing`、`ModelServer`、`ModelRoute`）、`kserve` 后端（生成 `LLMInferenceService`）；迭代 4.1 的退出条件增加：后端在 kind 上以 CPU 上运行的小模型跑通；
  - 4.2-A/B/C、4.4-A/B/C/D 与 5.4 区分 ForgeMesh 自己的启动器与 Kubernetes 后端，后者的能力由后端承担；
  - 4.3-C、4.3-D、4.3-E：配额与计量只在 ForgeMesh 网关执行；向后端传递已认证的主体；后端需要凭证时由网关注入；
  - 新增 4.4-E「多集群与多后端的放置」：同一个模型由多个集群或后端提供时，决策 Provider 提出放置，Policy 与 Scheduler 做最终授权，网关在后端之间路由与故障转移；
  - 第 6 节新增三项待定事项：先接哪个后端、是否做纯 Pod 启动器、裸机路径上是否自己实现 prefill / decode 分离；第 8 节新增后端 API 演进的风险。
- **遗留问题**：
  - 第 3、4 节的每个主题注明承接了哪些 PR 的遗留问题，与第 7 节的归属表逐条对应；
  - 第 7 节补上不在 PR 描述中、但记录在文档与验证中的遗留问题：实例丢失后重新部署的退避只记在内存中（#18 的实现）、TGI 实例的私有目录可能残留在 emptyDir 中（#22 的 kind 验证）、ADR-014「代价与约束」中的实例凭证注入与认证之前的洪泛防护；5.1、5.2 补上 #10、#16 中还没有写进主题的部分。
- 文档头部的版本改为第 2 版，状态改为「已采纳」（第 1 版经 #24 合入）；CHANGELOG 中路线图的条目同步。

## 兼容性

只改文档。

## 测试

- CI 的 architecture-docs job 中的各项检查与 4 个校验脚本在本地通过；文档中的相对链接都指向存在的文件，表格的列数一致。
- 逐条核对：第 7 节的每一行都有主题承接，每个主题注明的来源都在第 7 节中。
- KServe 与 Kthena 的能力依据它们的公开文档（截至 2026-10）：KServe v0.17 发布说明与 `LLMInferenceService` 文档，Kthena 的架构、router 与扩缩文档。

## 检查项

- [x] 分支基于最新 `main`（`cd5226f`）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] 只改文档；CI 的文档检查在本地通过。
- [x] 关于 KServe 与 Kthena 的描述都依据它们的公开文档，并注明了版本。
- [ ] ADR：路线图本身不是 ADR；Kubernetes 后端的接入方式与模型的抽象在实施时另写 ADR。
- [x] CHANGELOG 已同步。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

## 第 1 版：`cursor/docs-roadmap-b108`（已作为 #24 合入）

分支基于上游 `main`（`871cf9b`，#17–#23 合入之后）。

### 标题

```text
docs(architecture): 新增 1.1.0 之后的路线图：阶段 4（执行面与 MaaS 基础）与阶段 5（生产规模与正式版）
```

### 描述

```markdown
## 概述

#5–#23 合入之后，仓库里没有文档说明接下来要做什么，各个 PR 描述中记录的遗留问题也没有归属。本 PR 新增 `docs/architecture/roadmap.md`，把 1.1.0 之后的工作按依赖关系排成阶段与迭代。只改文档。

**依赖**：基于最新 `main`（`871cf9b`），不依赖其他 PR。

## 内容

- **现状**：1.1.0 在 API、控制器与调度、运行时、网关、事件与审计、可观测、执行面、插件、存储、工程与部署各个方面已经具备什么、还缺什么，并为每个缺口标注归属的迭代。
- **阶段 4：执行面与 MaaS 基础**：
  - 4.0 发布 1.1.0；
  - 4.1 执行面基础：Node Agent 网络传输（gRPC 加 mTLS）、容器与 Kubernetes 启动器、网关韧性与压测基线、协调与工作流持久化、span 与 OTLP、发布流水线与类型检查；
  - 4.2 多副本与运行时完善：多副本、滚动更新、应用层健康检查、远程实例与分配租约、真实 GPU 上的验证、按期移除已弃用的 `tenantId` 查询参数；
  - 4.3 MaaS 接入层：插件接入应用、模型与 OpenAI 兼容接口（`/v1/models`、`/v1/chat/completions` 等）、按 key 与模型的配额、token 计量、认证的后续；
  - 4.4 推理感知的路由、自动扩缩与分布式推理。
- **阶段 5：生产规模与正式版**：PostgreSQL 与多副本控制平面、插件进程隔离、LoRA 与模型目录、prefill / decode 分离、正式版评估。
- **写法**：每个主题写明内容、依赖与涉及的组件，每个迭代写明退出条件，依赖关系画成图；不估算工期。
- **正式版验收表**：对照 architecture.md 第 20 节，列出 1.1.0 尚未满足的 13 个条目，以及关闭它们的迭代。
- **需要维护者决定的事项**：新的第三方依赖（`grpcio` / `protobuf`、OpenTelemetry SDK）、模型的抽象、配额与 key 的来源、GPU 验证环境、覆盖率下限、发布节奏、正式版的版本号。
- **遗留问题的归属**：#8–#22 的 PR 描述与 ADR-014「后续事项」中尚未解决的遗留问题，逐条对应到迭代。
- **链接**：README（文档链接、里程碑表、目录树）、development-plan.md 的状态说明与 CHANGELOG 都链接到新文档。README 的目录树同时补上 `v1.1-development-plan.md` 与 `module-mapping.md`，ADR 的范围更正为 001~014。

文档头部的状态是「提案，待维护者评审」。评审通过后可以改为「已采纳」，之后每合入一个 PR，更新对应主题的状态。

## 兼容性

只改文档，不改变任何行为。

## 测试

- CI 的 architecture-docs job 中的各项检查在本地通过：架构文档存在、ADR 索引完整、OpenAPI 与 JSON Schema、manifest 校验、元数据一致性、插件入口冒烟。文档中的相对链接都指向存在的文件。
- 遗留问题表依据 GitHub 上 #5–#22 的 PR 描述与 ADR-014 逐条核对。

## 检查项

- [x] 分支基于最新 `main`（`871cf9b`）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] 只改文档；CI 的文档检查在本地通过。
- [x] 现状一节只陈述已合入代码的事实；计划项都标为「计划中」，需要决定的事项单独列出。
- [ ] ADR：路线图本身不是 ADR；文中标出了需要另行写 ADR 的主题（如模型的抽象、配额的来源、OIDC / JWT）。
- [x] CHANGELOG 与 README 已同步。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```
