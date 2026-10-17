# 学习路线

每个阶段达到出关标准再往下走；面试准备从阶段 2 开始并行。各阶段的预计投入和按每周投入换算的进度见[时间估算](time-estimate.md)，合规与面试时怎么讲 AI 辅助见 [README](../README.md#两点提醒)。

- 没有标“选做”的任务都是必做。
- 路径缩写：`cp/` 指 `packages/control-plane/src/forgemesh/controlplane/`，`gw/` 指 `gateway/internal/`。
- PR 编号指上游 [Mekoforge/ForgeMesh](https://github.com/Mekoforge/ForgeMesh) 的 PR；路线图编号指上游的 `docs/architecture/roadmap.md`。
- 改进文档指本仓库 `cursor/forgemesh-round-3-b108` 分支上的 [`docs/forgemesh-improvement-plan.md`](https://github.com/KnightKKOP/Study/blob/cursor/forgemesh-round-3-b108/docs/forgemesh-improvement-plan.md)，三轮补丁也在这个分支的 [`patches/forgemesh/`](https://github.com/KnightKKOP/Study/tree/cursor/forgemesh-round-3-b108/patches/forgemesh)。

## 阶段 0：准备：合规与发布 1.1.0

**目标**：让项目能安全、体面地写进简历。

**预计投入**：10～15 小时

- [ ] 确认公司对个人开源项目与对外贡献的规定；只用个人设备和个人时间，不碰任何内部代码、文档、数据和算力。
- [ ] 提交待合入的路线图第 2 版和架构文档 v1.1 两个 PR。
  - 架构文档 v1.1 会清理 `architecture.md` 里指向本机路径的残留（第 11 行的来源路径和第 201 行的失效图片）。补丁在 `cursor/forgemesh-round-3-b108` 分支的 [`patches/forgemesh/roadmap/`](https://github.com/KnightKKOP/Study/tree/cursor/forgemesh-round-3-b108/patches/forgemesh/roadmap)。
- [ ] 完成路线图 4.0：定稿 CHANGELOG 的 1.1.0，写 `docs/releases/v1.1.md`，按 1.1.0 改写 README 的功能概览（现在还写着 v1.0.0），打 `v1.1.0` 标签。
- [ ] 本地跑通 `make install`、`make test`、`make lint` 和 `scripts/compose_smoke.sh`。

**出关标准**：仓库有 v1.1.0 标签和发布记录，README 与代码一致，本地全部检查通过。

**产出**：v1.1.0 发布记录。

**面试时能讲**：项目有版本、有发布记录、有路线图，本身就体现工程素养。

## 阶段 1：吃透已有的核心链路

**目标**：不看代码，能在白板上讲清“创建、协调、调度、部署、状态回写、网关路由、可观测、删除”每一步，以及每一步为什么这么设计、坏了会怎样。

**预计投入**：70～100 小时（没写过 Go 再加 20～30 小时）

- [ ] 读 `architecture.md` 第 1～5 章与第 11～12 章、ADR-002/005/008/013/014、改进文档 1.1 节；自己画一张架构图和一张请求时序图。
- [ ] 逐个读 #5 至 #23 的 PR 描述。每个都写了问题、方案、验证和遗留问题，相当于 19 个设计案例。
- [ ] 用 compose 假运行时跑一遍：CLI `apply` 一个服务，看它从 `Pending` 走到 `Ready`；经网关流式对话；抓两边的 `/metrics`；按 trace-id 对上两边的日志；查审计；删除。写一份自己的操作手册。
- [ ] 控制平面按链路打断点读代码。
  - 顺序：`cp/api/routes.py` 与 `updates.py`，`cp/registry/store.py`，`cp/controller/manager.py` 与 `queue.py`，`cp/reconciler/core.py`，`cp/scheduler/first_fit.py`，`cp/deployment/workflow.py`、`process.py` 与 `recovery.py`。
- [ ] 网关按请求经过的顺序读代码。
  - 顺序：`gw/middleware` 的 `apikey.go`、`authz.go`、`ratelimit.go`、`tracecontext.go`，`gw/router/router.go`，`gw/upstream/resolver.go`，`gw/stream/proxy.go` 与 `addrpolicy.go`。
- [ ] 每个模块写一页笔记：解决什么问题、核心数据结构、不变量、失败路径、对应的测试。
- [ ] 按改进文档附录 B 复现 P0-1 至 P0-8：把业务代码换回基线，看回归测试失败，再读修复。
- [ ] 不看原代码，亲手写三个迷你版，写完再和项目代码对照。
  - 带工作队列和 CAS 的协调循环；Go 写的 SSE 反向代理加令牌桶限流，客户端断开时取消上游请求；带退避重试和 `dead` 状态的 Outbox 投递器。
- [ ] 读 `tests/e2e`、`tests/chaos`、`tests/security`、`tests/contract`，用测试理解边界行为。（选做）

**出关标准**：白板讲 15 分钟核心链路；[项目深挖题](interview-questions.md)的架构、一致性、网关三组都能答出来。

**产出**：架构图、时序图、模块笔记、三个迷你实现。

**面试时能讲**：声明式与协调循环、乐观并发、幂等分配、受控删除、SSE 转发、凭证不转发与 SSRF 防护。

## 阶段 2：推理原理、PyTorch 与真实 GPU 验证

**目标**：懂推理引擎在做什么，用 PyTorch 亲手验证过，并且有自己在 GPU 上测出来的数据。理论部分可以和阶段 3 并行。

**预计投入**：60～90 小时

- [ ] 学推理原理：prefill 与 decode、KV cache 显存估算、continuous batching、PagedAttention、前缀缓存、chunked prefill、投机解码、量化、TP/PP/EP、PD 分离。
- [ ] 精读 vLLM（PagedAttention）、Orca、SGLang（RadixAttention）、DistServe 四篇论文和 vLLM V1 的架构文档。
- [ ] PyTorch 补到读懂级：张量、dtype 与 device、`nn.Module`，会看显存占用。
  - 带实习生训模型时如果自己写过训练代码，这一条可以跳过。
- [ ] 用 PyTorch 手写一个 decoder-only 模型的推理，自己加上 KV cache，对比有无 KV cache、prefill 与 decode 的耗时。
  - 参考 [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) 或 [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch)。
- [ ] 用 transformers 加载一个小的 Qwen 模型，按 config 里的层数、KV 头数、head_dim 算每个 token 的 KV cache 字节数，再和实测显存对比。
- [ ] 掌握 TTFT、TPOT、ITL、吞吐、goodput 与 P50/P99，会用 `vllm bench serve` 压测。
- [ ] 租一台 GPU 机器（不要用公司的卡），用 `vllm-process` 启动器跑通完整闭环：创建、`Ready`、对话、更新、杀实例后重新部署、删除。这就是路线图 4.2-E。
  - 按 ForgeMesh 根目录 README“部署推理服务”一节配置 `FORGEMESH_INVENTORY_FILE` 与 `FORGEMESH_RUNTIME_LAUNCHER=vllm-process`。24GB 显存的卡跑 7B～8B 模型即可。
- [ ] 写压测报告放进 ForgeMesh 的文档：不同并发下的 TTFT、TPOT、吞吐，经网关与直连 vLLM 的差异，以及瓶颈分析。
- [ ] 读 vLLM 中 `llama.py` 或 `qwen2.py` 的实现：注意力怎么接到 PagedAttention 后端，权重怎么按张量并行切分。（选做）
- [ ] 读 vLLM 调度器与 KV cache 管理器的源码，和 SGLang 对比。（选做）
- [ ] 了解 vLLM-Ascend 与 MindIE。运营商、国企等国产化客户看重这一点。（选做）

**出关标准**：能手算一个 8B 模型在给定上下文与并发下的 KV cache 显存，并用自己手写的推理代码解释 prefill 与 decode 的差异；ForgeMesh 里有 GPU 演练记录与压测报告。

**产出**：迷你推理代码、GPU 演练记录、压测报告与脚本。

**面试时能讲**：推理引擎原理，你自己测出的性能数据和瓶颈。

## 阶段 3：MaaS 接入层

**目标**：OpenAI 官方 SDK 只改 `base_url` 和 key 就能用，并且有按 key 与模型的配额和 token 计量。这是最对口的部分，尽量自己设计、自己实现。

**预计投入**：70～100 小时

- [ ] 先自己写 ADR：模型的抽象（新增 `Model` 资源，还是在 `InferenceService` 上声明模型名）、配额与 key 的来源、多个网关副本怎么共享计数。
  - 可以参考 Kthena 把工作负载、实例池和按模型名路由拆成三个资源的做法（路线图第 2 版 1.2 节）。
- [ ] 路线图 4.3-B：网关新增 `/v1/models`、`/v1/chat/completions`（流式与非流式）、`/v1/embeddings`，按请求里的 `model` 路由；用 OpenAI 官方 SDK 写验收测试。
  - 改动点：`gw/router/router.go`、`gw/upstream/`，以及资源模型与 OpenAPI。现在网关只有按服务名的流式路由。
- [ ] 路线图 4.3-C：按 key 与模型的 RPM/TPM 配额，超出返回 429 与 `Retry-After`；流式请求按 `max_tokens` 预扣，结束后按实际用量结算。
  - 改动点：`gw/middleware/ratelimit.go` 一带。现在只有单机内存里按租户的令牌桶。
- [ ] 路线图 4.3-D：从响应和流里读 usage，写入计量记录，提供按租户查询用量的接口；保证与响应中的 usage 一致，重试不重复计。
  - 网关可以自动加上 `stream_options.include_usage`。改动点：`gw/stream/proxy.go`、`plugins/metering-basic`。
- [ ] 把新接口加进 compose 冒烟，同步 CHANGELOG、README 与 OpenAPI。
- [ ] 模型级故障转移与灰度：按权重把流量分到新旧版本。（选做）
- [ ] 路线图 4.3-E：key 热加载、过期与吊销，按主体限流。（选做）

**出关标准**：满足路线图 4.3 的退出条件：SDK 流式与非流式都能调用，超出 TPM 返回 429，计量与 usage 一致。

**产出**：两份 ADR、三个 PR、扩展后的 compose 冒烟。

**面试时能讲**：模型网关的完整设计：路由、配额、计量，以及流式场景下的难点。

## 阶段 4：多副本与推理感知路由

**目标**：做出“比轮询好多少”的可量化结果。

**预计投入**：70～90 小时

- [ ] 路线图 4.2-A 多副本与 4.2-C 应用层健康检查：探测实例的健康接口，连续失败的副本先摘除再重新部署。
- [ ] 路线图 4.4-A：采集 vLLM 的 `/metrics`，包括排队请求数、KV cache 占用、前缀缓存命中率。
- [ ] 路线图 4.4-B：把路由策略做成先过滤再打分的插件接口，实现最少排队、KV cache 感知与前缀亲和。
  - 对照 Gateway API Inference Extension 的实例选择器（EPP）、llm-d 与 Kthena router 的设计。
- [ ] 用共享前缀的负载（长 system prompt、多轮对话）对比轮询与新策略的 TTFT P99 和吞吐，结果和复现脚本写进文档。
- [ ] 路线图 4.2-B 滚动更新（`maxSurge` / `maxUnavailable`）。（选做）
- [ ] 路线图 4.4-C 按推理指标自动扩缩。（选做）

**出关标准**：有一张轮询与前缀亲和的对比图，别人能用你的脚本复现。

**产出**：路由插件框架、对比报告与压测脚本。

**面试时能讲**：推理感知路由的原理和你的数据，以及 ForgeMesh 与 KServe、Kthena 的分工。

## 阶段 5：智能诊断 Agent

**目标**：用开源方式重做你在工作中做过的“一键定位”，并用评测证明效果，把 Agent 方向并进同一个项目。

**预计投入**：50～70 小时

- [ ] 写 ADR：诊断 Agent 放在核心之外，只读、只建议，处置动作必须经人确认，符合“决策不等于授权”的不变量。
- [ ] 写一个 MCP server，用只读 scope 的 API key 把能力暴露成工具：服务状态与 conditions、审计与资源事件、按 trace-id 检索两边的日志、查 Prometheus 指标。
- [ ] 诊断 Agent：输入症状（例如“svc-a 返回 502”），自己调用工具收集证据，输出根因、证据链和处置建议。
- [ ] 故障注入评测集：每个场景标注真实根因，统计定位准确率、证据正确率、调用步数与成本。
  - 场景示例：杀实例、GPU 不足、模型路径错误、限流风暴、重新部署后的 502、key 配置错误、webhook 事件进入 `dead`。
- [ ] 加一个规则基线做对照，分析 Agent 强在哪、弱在哪。（选做）

**出关标准**：评测集覆盖主要故障类型，有准确率数据和失败案例分析。

**产出**：MCP server、诊断 Agent、评测集与报告。

**面试时能讲**：Agent 工程（工具设计、上下文、评测与 harness、权限边界），以及它和你工作经验的关系。

## 面试准备线（从阶段 2 开始并行）

**预计投入**：120～165 小时

- [ ] 简历：ForgeMesh 按“背景、你负责的部分、关键设计、量化结果”来写；现在公司的经历只讲公开层面的内容。（5～10 小时）
- [ ] 力扣热题 100，刷到中等题能稳定写出。（60～80 小时）
- [ ] 系统设计四题：MaaS 网关、分布式限流器、计量计费系统、推理服务自动扩缩器。（15～20 小时）
- [ ] 基础知识：Go 并发与 `net/http`、Python asyncio、TCP/HTTP/SSE、K8s 核心对象与控制器模式、数据库事务与隔离级别、Redis。（30～40 小时）
- [ ] 用[项目深挖题](interview-questions.md)自测或模拟面试，答不上来的回到代码和 PR 描述里找答案。（10～15 小时）
- [ ] 到“可以开始面试”这个里程碑后开始投递，用面试反馈调整后面的学习重点。
