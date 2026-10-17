# 知识地图

按优先级排列。“在 ForgeMesh 里怎么练”尽量落到项目上，学一样用一样。路径缩写同[学习路线](roadmap.md)。

## 1. 大模型推理原理与引擎

**优先级**：必须，最需要补。

- **学到什么程度**：能讲清 prefill 与 decode 的区别、KV cache 显存怎么算；continuous batching、PagedAttention、前缀缓存、chunked prefill、投机解码、量化（AWQ、GPTQ、FP8）各自解决什么、代价是什么；TP、PP、EP 与 PD 分离的适用场景；能读懂 vLLM 的调度器与 KV cache 管理器。
- **在 ForgeMesh 里怎么练**：阶段 2 在真实 GPU 上部署 vLLM 并压测；阶段 4 用 vLLM 的指标做推理感知路由。
- **资料**：vLLM（PagedAttention）、Orca、SGLang（RadixAttention）、DistServe 四篇论文；vLLM 官方文档中的 V1 架构与调度设计。

## 2. PyTorch

**优先级**：必须，读懂级就够。

- **学到什么程度**：张量、dtype 与 device、`nn.Module`；能读懂 decoder-only 模型的实现（embedding、RMSNorm、RoPE、GQA 注意力、MLP、采样）；会估算并实测显存。平台岗位不用深入训练技巧、CUDA/Triton 和分布式训练框架；改投推理引擎优化或训练平台岗位时才需要。
- **在 ForgeMesh 里怎么练**：阶段 2 手写带 KV cache 的迷你推理，并用一个小的 Qwen 模型核对 KV cache 显存；选做读 vLLM 中一个模型的实现。
- **资料**：PyTorch 官方 Learn the Basics 教程；[karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)；[rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch)。

不同岗位对 PyTorch 的要求：

| 岗位 | 要求 |
|---|---|
| MaaS 平台、网关、调度（主线） | 读懂级 |
| 推理引擎与性能优化（vLLM、SGLang 开发） | 精通，另需 CUDA/Triton 与性能分析 |
| 训练平台、Agentic RL | PyTorch 加分布式训练框架 |
| Agent 应用开发 | 基本不需要 |

## 3. MaaS 平台与模型网关

**优先级**：必须，直接对口。

- **学到什么程度**：OpenAI 接口语义（chat、completions、embeddings、流式 SSE、usage、tool calling）；多租户与 API key；RPM/TPM 配额，令牌桶、滑动窗口与基于 Redis 的分布式限流；计量计费的一致性与幂等；模型路由、灰度与故障转移。
- **在 ForgeMesh 里怎么练**：阶段 3 的 OpenAI 兼容接口、配额与计量。
- **资料**：OpenAI API 文档；LiteLLM、Envoy AI Gateway、Higress 的 AI 网关设计；Kthena router 的 token 限流与公平排队。

## 4. Kubernetes 与控制器模式

**优先级**：必须，多数 AI 平台跑在 K8s 上。

- **学到什么程度**：核心对象与调度；控制器模式（informer、workqueue、reconcile、finalizer、status 子资源）；CRD 与 Operator；device plugin 与 GPU Operator；HPA 与 KEDA；KServe、Kthena 的资源模型。
- **在 ForgeMesh 里怎么练**：ForgeMesh 的资源模型和协调循环就是照着 K8s 做的，读控制器代码时逐一对照；选做 Kthena 或 KServe 后端（路线图 4.1-B），在 kind 上用 CPU 小模型验证。
- **资料**：Kubernetes 官方文档；《Programming Kubernetes》；The Kubebuilder Book；KServe 与 Kthena 文档。

## 5. 分布式系统与存储

**优先级**：必须。

- **学到什么程度**：乐观并发（resourceVersion 与 CAS）、幂等、事务性 Outbox 与至少一次投递、租约与心跳、leader 选举、事务隔离级别、SQLite 与 PostgreSQL 的取舍。
- **在 ForgeMesh 里怎么练**：阶段 1 亲手重写协调循环和 Outbox；读 ADR-008、ADR-013。
- **资料**：《数据密集型应用系统设计》（DDIA）；microservices.io 上的 Transactional Outbox 模式。

## 6. Go 与后端工程

**优先级**：必须，网关与云原生的主流语言。

- **学到什么程度**：goroutine、channel 与 context 取消；`net/http` 与反向代理；sync 与原子操作；pprof 与 race 检测。Python 侧的 asyncio、FastAPI、pydantic。
- **在 ForgeMesh 里怎么练**：阶段 3、4 的网关功能全部用 Go 写；阶段 1 重写 SSE 反向代理。
- **资料**：《Go 程序设计语言》；标准库 `net/http/httputil` 中 ReverseProxy 的源码。

## 7. GPU 与算力调度

**优先级**：加分。

- **学到什么程度**：显存、带宽与算力的瓶颈分析；NVLink、InfiniBand 与 NCCL；MIG 与 vGPU；拓扑感知调度与 gang 调度。国产化方向了解 vLLM-Ascend 与 MindIE。
- **在 ForgeMesh 里怎么练**：读 ForgeMesh 的调度器（`cp/scheduler/`）与 gpu-nvidia 插件；了解 Volcano、Kueue、HAMi 怎么做。
- **资料**：NVIDIA 的 GPU 架构白皮书与 NCCL 文档；Volcano、Kueue、HAMi 文档。

## 8. 可观测性与 AIOps

**优先级**：你的长处，补到开源标准。

- **学到什么程度**：Prometheus 指标类型、直方图与 PromQL；OpenTelemetry 的 span、上下文传播与 OTLP；SLO 与告警；根因分析的方法。
- **在 ForgeMesh 里怎么练**：选做 OTLP 追踪（路线图 4.1-E）；阶段 5 的诊断 Agent。
- **资料**：Prometheus 与 OpenTelemetry 官方文档；《SRE：Google 运维解密》。

## 9. Agent 工程

**优先级**：差异化。

- **学到什么程度**：function calling 与 MCP；上下文工程；Agent 循环与规划；评测与 harness（任务集、验证器、轨迹评分）；权限边界与人工确认。
- **在 ForgeMesh 里怎么练**：阶段 5 的 MCP server、诊断 Agent 与故障注入评测集。
- **资料**：MCP 规范；Anthropic 的 Building effective agents；SWE-bench、τ-bench 的评测设计。

## 10. 面试基础

**优先级**：必须。

- **学到什么程度**：数据结构与算法（中等题稳定写出）；TCP、HTTP/2、SSE 与 WebSocket；进程、线程与 IO 多路复用；系统设计。
- **在 ForgeMesh 里怎么练**：见[学习路线](roadmap.md)的面试准备线。
- **资料**：力扣热题 100；《System Design Interview》（Alex Xu）。
