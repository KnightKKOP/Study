# 项目深挖题

每道题都要能回答“是什么、为什么这么设计、坏了会怎样”。能脱稿讲清就勾上；答不上来就按线索回到代码和 PR 描述里找。路径缩写和编号的含义同[学习路线](roadmap.md)。

## 架构与设计取舍

- [ ] 为什么用声明式资源加协调循环，而不是在 API 里同步部署？代价是什么？
  - 线索：`architecture.md` 第 5 章、ADR-002；`cp/controller/` 与 `cp/reconciler/core.py`。
- [ ] generation、observedGeneration 与 resourceVersion 分别是什么？PUT 或 PATCH 冲突时怎么处理？
  - 线索：#17；`cp/api/updates.py` 与 `cp/registry/store.py`。
- [ ] 为什么存储先用 SQLite？单写者约束是什么？什么时候必须换 PostgreSQL？
  - 线索：ADR-013、ADR-007；P0-1 与 #10 的 WAL 模式。
- [ ] “决策不等于授权”在代码里怎么体现？
  - 线索：ADR-004、ADR-005；全部决策 Provider 失败时返回 503 而不是默认放行。

## 一致性与故障恢复

- [ ] 控制器崩溃重启后，怎么保证不会重复分配 GPU？
  - 线索：#13 按 uid 与 generation 幂等的分配；`cp/scheduler/first_fit.py`。
- [ ] 删除时 finalizer 起什么作用？处于 Scheduling 的资源被删除会怎样？
  - 线索：`architecture.md` 5.6 节；P0-3 与 P1-2。
- [ ] 实例进程退出怎么发现？进程启动器怎么避免误杀被复用的 PID？
  - 线索：#18；`cp/deployment/recovery.py` 与 `process_records.py`（pid 与启动时间都一致才发信号）。
- [ ] Outbox 解决什么问题？至少一次投递下消费端怎么做幂等？事件保序吗？
  - 线索：ADR-008；#20；`cp/outbox.py`。
- [ ] 讲一个你修过的并发问题：怎么发现、怎么修、怎么证明修好了？
  - 线索：P0-1 共享 SQLite 连接不加锁；改进文档 4.1 节与附录 B。

## 网关

- [ ] SSE 流式转发要注意什么？客户端断开时上游请求怎么处理？
  - 线索：`gw/stream/proxy.go`：响应头、逐块 Flush、取消上游、hop-by-hop 头。
- [ ] 为什么不能把客户端的 Authorization 转发给推理实例？实例地址白名单防的是什么？
  - 线索：P1-8；`gw/stream/addrpolicy.go`。
- [ ] 限流为什么按认证后的租户分桶？多个网关副本怎么做全局限流？
  - 线索：P1-9；`gw/middleware/ratelimit.go`；路线图 4.3-C。
- [ ] 流式响应的 token 数事先未知，TPM 配额怎么做？
  - 线索：按 `max_tokens` 预扣、结束后按实际用量结算；`stream_options.include_usage`。
- [ ] 重新部署之后几秒内的 502 是怎么来的？怎么消除？
  - 线索：`gw/upstream/resolver.go` 缓存实例列表 5 秒；路线图 4.1-C。

## 推理与性能

- [ ] 一个 8B 模型、8K 上下文、32 并发，KV cache 要多少显存？
  - 线索：每个 token 的 KV 字节数 = 2 × 层数 × KV 头数 × head_dim × 每个元素的字节数。
- [ ] 在你手写的推理代码里，KV cache 怎么存、怎么更新？为什么 decode 阶段通常卡在显存带宽上？
  - 线索：阶段 2 的迷你推理：decode 每一步只算一个新 token，却要读完全部权重和已有的 KV cache。
- [ ] TTFT 和 TPOT 分别受什么影响？你的压测里瓶颈在哪？
  - 线索：阶段 2 的压测报告。
- [ ] 前缀亲和和负载均衡冲突时怎么取舍？
  - 线索：先过滤再打分的实例选择器；阶段 4 的对比数据。
- [ ] ForgeMesh 为什么在 Kubernetes 上把多副本、扩缩和路由交给 KServe、Kthena？它自己负责什么？
  - 线索：路线图第 2 版 1.2 节：认证、配额、计量、审计与跨后端放置。

## 工程方法

- [ ] 项目大量用了 AI 编码 Agent，你怎么保证生成的代码是对的？
  - 线索：在基线上会失败的回归测试、每个分支单独过 CI、compose 冒烟、OpenAPI 契约测试。
- [ ] 如果重新设计，你会改什么？
  - 线索：从各个 PR 的遗留问题和路线图的风险一节找答案。
