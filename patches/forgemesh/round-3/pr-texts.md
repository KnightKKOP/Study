# 第三轮 7 个 PR 的标题与描述

7 个分支是叠放的：第 1 个基于上游 `main`（`c5b7f76`），其余每个基于前一个。在上游创建 PR 时目标分支都选 `main`；在前面的 PR 合入之前，后面的 PR 会连带显示前面 PR 的提交，所以每个描述里都给了只含本 PR 改动的对比链接。请按顺序合入。

---

### 第 1 个 PR：`cursor/p1-api-contract-completion-b108`

**标题**

```text
feat(api): 补全 API 契约：PUT / PATCH 更新、签名分页游标、服务端推导决策风险等级与 OpenAPI 契约测试
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-1。此前 API 有几处契约缺口：

- 没有更新接口，修改 `spec` 只能删除重建；
- `metadata.generation` 原样保存客户端提交的值；
- 列表接口最多返回 `limit` 条，OpenAPI 声明的 `nextPageToken` 从未返回；
- `POST /api/v1/decisions` 一律按 `low` 风险交给决策路由器；
- `get_registry()` 在初始化之前被调用时静默新建内存数据库：API 报告成功，重启后数据丢失；
- OpenAPI 与实现有多处不一致。

本 PR 补上这些缺口，并加一个契约测试，防止 OpenAPI 与实现再次偏离。

**依赖**：基于 `main`（`c5b7f76`），是第三轮 7 个叠放 PR 中的第 1 个，可以单独合入。

## 改动

- **服务端维护 generation**：创建时 `generation` 为 `1`、`observedGeneration` 为 `0`，请求中的值被忽略；之后只有 `spec` 变化时递增。OpenAPI 新增 `ObjectMeta`，服务端维护的字段标为 `readOnly`。
- **更新接口**：
  - `PUT /api/v1/inference-services/{name}` 整体替换 `spec`、labels 与 annotations；`PATCH` 接受 JSON Merge Patch（RFC 7386）。
  - 乐观并发：前置条件是 `metadata.resourceVersion` / `metadata.uid` 或 `If-Match`（响应带 `ETag`）。不满足时返回 `409`，`details.reason` 为 `ResourceVersionMismatch`、`UidMismatch` 或 `Terminating`。
  - 没有变化的更新不写入。Registry 新增 `update_spec`，检查与写入在同一个 `BEGIN IMMEDIATE` 事务中。
- **分页**：
  - 两个列表接口接受 `pageToken`，还有结果时返回 `nextPageToken`。
  - 游标以 HMAC-SHA256 签名，绑定租户与过滤条件；格式不对、被篡改或用于其他租户时返回 `400`。
  - 签名密钥保存在新表 `registry_meta` 中，控制平面重启后游标仍然有效。
- **决策风险等级**：由服务端按 `question` 的域推导（`forgemesh.controlplane.api.risk`），请求中的 `riskLevel` 只能调高。高风险请求的候选来自备用 Provider 时，返回 `503 DECISION_FALLBACK_REQUIRED`，不自动采用。
- **未初始化的 Registry**：`get_registry()` 抛出 `ComponentNotReadyError`，资源端点返回 `503 REGISTRY_UNAVAILABLE`，`/readyz` 返回 `503`。
- **关联 ID**：`400` / `409` 等错误信封回显请求的 `X-Correlation-Id`；OpenAPI 在全部业务端点上声明这个请求头。
- **契约测试** `tests/contract/test_openapi_contract.py`：
  - 双向核对应用的路由、参数和请求体与 OpenAPI 一致；
  - 逐一调用每个操作，校验响应符合契约；
  - 补齐 OpenAPI 中缺失的 `GET /api/v1/resources`、若干状态码与 `count` 字段。
- **文档**：README 的 REST API 一节、CHANGELOG、module-mapping、OpenAPI 与 JSON Schema；README 功能概览的「现状」注释与测试统计同步更新。

## 兼容性（破坏性）

以下变化都在 CHANGELOG 中以「**破坏性**」标注并写明迁移方式（API 稳定性为 `beta`，见弃用政策 1.4 节）：

- `metadata.generation` 由服务端维护。旧资源不迁移，下一次 `spec` 变化时从原值递增。
- `POST /api/v1/inference-services` 拒绝未知的顶层字段（`400`）。
- `SQLiteRegistry.list()` 的 `continue_token` 只接受 `list_page` 签发的签名游标。
- 决策风险等级改由服务端推导：推导为 `high` 的操作在没有合适候选时返回 `503`。

## 测试

- `make test`：2066 passed（`main` 上为 1800，新增 266 个）。每个提交单独检出时全部通过。
- 新增测试覆盖：
  - PUT / PATCH：前置条件与冲突、不可修改的字段、没有变化时不写入；
  - 分页：翻页覆盖每个资源恰好一次，篡改、跨租户与跨过滤条件的游标被拒绝，重启后游标仍然有效；
  - 风险等级的推导，以及请求只能调高等级；
  - 未初始化的 Registry 返回 `503`；
  - 契约测试本身。
- `ruff check .`、CI 的 4 个校验脚本与网关测试通过。

## 遗留

- 修改 `spec` 之后，服务还不会重新部署（第 2 个 PR 实现）。
- CLI 还不使用这些接口（第 3 个 PR 实现）。

## 检查项

- [x] 分支基于最新 `main`（`c5b7f76`）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；新增逻辑都有测试。
- [x] 公共接口的变化都有测试，并在 CHANGELOG 中以「破坏性」标注。
- [x] CHANGELOG、README、OpenAPI、JSON Schema 与 module-mapping 已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：分页游标签名并绑定租户，防止伪造与跨租户使用；高风险决策不再被自动采用。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 2 个 PR：`cursor/p1-update-and-health-b108`

**标题**

```text
feat(control-plane): 修改 spec 后重新部署，定期核对实例并重新部署丢失的实例，回收孤立分配，新增 tgi-process 启动器
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-2。此前存在以下问题：

- 已部署服务的 `spec` 变化不会重新部署；
- 实例退出或控制平面重启之后，服务仍报告 `Ready`，网关继续把请求转给已经不存在的实例；
- 绕过受控删除留下的分配永远占用设备；
- 控制平面被 `SIGKILL` 时，vLLM 子进程继续占用 GPU；
- 控制平面没有 TGI 启动器。

**依赖**：基于第 1 个 PR（`cursor/p1-api-contract-completion-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p1-api-contract-completion-b108...cursor/p1-update-and-health-b108)。

## 改动

- **修改 `spec` 后重新部署**：
  - `generation` 大于 `observedGeneration` 的 `Ready` / `Degraded` 服务经策略放行后进入 `Updating`，endpoint 标记为 `ready: false`。
  - 控制器停止旧实例，复用或重新分配加速器，按新的 `spec` 运行部署工作流；新实例通过验证后回到 `Ready`。
  - 部署进行中又提交的变化，会取消当前部署、改为部署最新的 `spec`；`Failed` 的服务在 `spec` 变化后回到 `Pending`，重新部署。
  - 部署运行的幂等键按 generation 区分：`deployment:{uid}:{generation}`，同一代 `spec` 的第 n 次为 `…:{n}`。
- **核对实例**：
  - 控制器每 `FORGEMESH_INSTANCE_CHECK_INTERVAL_SECONDS` 秒（默认 `10`）经启动器的 `is_running` 核对实例。
  - 实例已不在运行的服务转为 `Degraded`（`InstanceLost`），网关不再转发；控制器随后按同一个 `spec` 重新部署（不重新评估策略）。第一次重新部署立即开始，之后的间隔从 10 秒起翻倍，最多 300 秒。
  - 控制平面启动时，在控制器之前做一次同样的核对：重启之前 `Ready` 的服务经 `Degraded` 以新实例回到 `Ready`。
- **回收孤立分配**：归属资源已不存在的 Active 分配，在启动时与每次全量同步之后回收：先停止对应的部署，再标记为 `Expired`；停止失败时保留，下次再试。
- **进程启动器**：
  - 抽出 vLLM 与 TGI 共用的进程管理代码。实例在自己的会话中运行，停止时结束会话中的每个进程组。
  - 新增 `tgi-process`，配置变量为 `FORGEMESH_TGI_*`。
  - 实例进程记在数据库旁的 `forgemesh.instances.json` 中。控制平面被杀死之后，下次启动时先结束仍在运行的实例；只向 pid 与启动时间都与记录一致的进程发信号。
- **假启动器**：`POST /fake/exit` 让实例像进程退出一样结束，用来演练实例丢失。
- **compose 冒烟**：新增三段：以 `PUT` 修改 `spec`、让实例退出、重启控制平面，每一段都以新实例回到 `Ready`。
- **测试辅助函数**：第一个提交修复 `main` 上已有的偶发失败：进程在读取 `/proc/<pid>/stat` 期间被回收时，读取抛出的是 `ProcessLookupError` 而不是 `FileNotFoundError`，之前没有被当作进程已结束。
- **文档**：README「部署推理服务」一节（更新、实例丢失、控制平面重启、孤立分配、TGI）、CHANGELOG、module-mapping、备份与恢复（工作流存储与实例记录文件）；README 功能概览的「现状」注释与测试统计同步更新。

## 兼容性（破坏性）

- 修改已部署服务的 `spec` 会重新部署。这是先停后起：从进入 `Updating` 到新实例通过验证，服务不可用。
- `ReconciliationController` 的构造参数与部署运行的幂等键有变化，见 CHANGELOG。
- 1.1.0 之前以 `{kind}/{name}` 记录的分配被当作孤立分配回收。

## 测试

- `make test`：2207 passed（新增 141 个）。每个提交单独检出时全部通过。
- 新增测试覆盖：
  - `spec` 更新：各个阶段与失败路径、部署过程中再次更新、`Failed` 之后重新部署；
  - 实例丢失的检测、退避与启动时的核对；
  - 孤立分配的回收，包括停止失败时保留分配；
  - 进程会话的停止、`SIGKILL` 之后残留进程的清理与 PID 复用的防护；
  - tgi-process 的命令行，以及端口与私有目录的隔离（以桩命令代替 TGI）。
- compose 冒烟通过，含更新、实例退出与重启三段。

## 遗留

- 核对实例只看进程是否还在运行，不探测实例能否回答请求；更新是先停后起，没有滚动更新。
- 网关缓存实例列表 5 秒，重新部署之后的几秒内可能返回 `502`。
- vLLM 与 TGI 没有在真实 GPU 上验证过；tgi-process 只用桩命令测试过。
- Linux 会复用 PID 命名空间的编号，所以「忽略另一个 PID 命名空间的记录」这一判断并不完全可靠。安全性仍然成立：只有 pid 与启动时间都一致的进程才会收到信号。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；新增逻辑都有测试。
- [x] 行为变化在 CHANGELOG 中以「破坏性」标注。
- [ ] ADR：没有单独写 ADR（遵守 ADR-013 的单写者约束）；如果维护者认为需要，可以补一份。
- [x] CHANGELOG、README、module-mapping 与备份恢复文档已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：结束残留实例时，只向 pid 与启动时间都一致的进程发信号；TGI 私有目录权限为 `0700`。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 3 个 PR：`cursor/p1-cli-over-http-b108`

**标题**

```text
feat(cli): 命令行工具改为 REST API 客户端，新增 list / delete / wait 与分级退出码
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-3（改进计划 5.11）。此前 CLI 每条命令新建一个内存 SQLite 数据库，从不连接控制平面：`apply` 写入的资源在命令结束时就丢失了，`get` / `list` 永远找不到资源，CLI 实际不可用。包的依赖声明也与实际导入不一致。

**依赖**：基于第 2 个 PR（`cursor/p1-update-and-health-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p1-update-and-health-b108...cursor/p1-cli-over-http-b108)。

## 改动

- **命令**：`forgemesh` 经 REST API 管理 `InferenceService`：
  - `apply -f`：资源不存在就创建；存在就以读到的 `resourceVersion` 与 `uid` 为前置条件整体替换，遇到并发修改时重试。输出 `created`、`configured` 或 `unchanged`。
  - `get`、`describe`；`list` 跟随 `nextPageToken` 读取全部页。
  - `delete`：区分 `204`（已删除）与 `202`（进入 `Terminating`）。
  - `wait --for ready|delete`。
- **连接与认证**：
  - 地址取自 `--api-url` 或 `FORGEMESH_API_URL`，默认为网关 `http://127.0.0.1:8081`。
  - API key 只从 `--api-key-file` 或 `FORGEMESH_API_KEY` 读取，不接受命令行参数，任何输出都不含 key。
  - 一次调用的全部请求带同一个 `X-Correlation-Id`。
- **退出码**：错误信封与非信封的响应都映射到固定的退出码（`0`–`12` 与 `130`），`forgemesh --help` 列出这张表。
- **wait 的语义**：
  - `--for ready` 要求 `observedGeneration` 等于 `generation`，即服务运行的是当前的 `spec`。
  - `--for delete` 在资源不存在时成功，与 `kubectl wait --for=delete` 一致；结果不取决于删除与第一次读取的先后。
- **依赖**：只依赖标准库与 PyYAML（`pyyaml>=6.0.1`），不再依赖 `forgemesh-core` 或控制平面的包。`tests/unit/cli/test_packaging.py` 核对 CLI 导入的第三方包与声明的依赖完全一致。
- **端到端测试** `tests/e2e/test_cli.py`：在后台以 uvicorn 运行控制平面（API key 认证、假启动器）。CLI 经真实的 HTTP 依次执行 `apply`、`wait`、修改 `spec` 后再次 `apply` 与 `wait`、`get`、`list`、`delete` 与 `wait --for delete`。
- **文档**：README「命令行工具」一节（命令、退出码、环境变量）、CHANGELOG、module-mapping；README 功能概览的「现状」注释与测试统计同步更新。

## 兼容性（破坏性）

- CLI 需要运行中的网关或控制平面。
- `--api-url` 的默认值、`--tenant` 的语义、输出格式与退出码都有变化，见 CHANGELOG。
- 旧 CLI 实际不可用，没有需要迁移的数据。

## 测试

- `make test`：2360 passed（新增 153 个）。每个提交单独检出时全部通过。
- 新增测试覆盖：每个命令；退出码的映射；key 只出现在 `Authorization` 头中；`apply` 的并发重试；`wait` 遇到限流、`502`–`504` 与连接失败时的处理；以及上面的端到端流程。

## 遗留

- CLI 只管理 `InferenceService`。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；新增逻辑都有测试。
- [x] CLI 的行为变化在 CHANGELOG 中以「破坏性」标注。
- [x] CHANGELOG、README 与 module-mapping 已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：key 不能经命令行参数传入，也不会出现在任何输出中；CLI 不跟随重定向。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 4 个 PR：`cursor/p1-outbox-audit-b108`

**标题**

```text
feat(control-plane): 资源变更事件与审计记录同事务写入，Outbox 退避重试并发布到日志或 webhook，新增审计查询 API
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-4（改进计划 5.4）。此前 Outbox 与审计日志都没有接入控制平面的生产路径，并且存在以下问题：

- `Outbox.put` 自行提交，事件无法与它描述的业务写入处于同一事务；
- 事件发布失败一次就永久 `failed`；
- `IdempotentConsumer` 只在内存中去重；
- 共用 sqlite3 连接的存储之间没有串行化，一方的提交会连带另一方尚未完成的写入。

**依赖**：基于第 3 个 PR（`cursor/p1-cli-over-http-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p1-cli-over-http-b108...cursor/p1-outbox-audit-b108)。

## 改动

- **工作单元** `forgemesh.controlplane.sqlite.Database`：一个连接加一把可重入锁，由 Registry、Outbox 与审计日志共用。`transaction()` 以 `BEGIN IMMEDIATE` 开始，出现异常时回滚。
- **资源变更事件**：Registry 对资源的每次写入（创建、更新、写入 status、请求删除、删除），都在同一事务中写入一条事件，信封见 `api/schemas/event.schema.json`。
- **发布**：
  - 应用在后台运行 `Dispatcher`。默认把事件写进日志（logger `forgemesh.events`）；设置 `FORGEMESH_EVENT_WEBHOOK_URL`（以及 `_TOKEN`、`_TIMEOUT_SECONDS`）后 `POST` 到 webhook。
  - 至少投递一次，接收方按 `eventId`（请求头 `X-Forgemesh-Event-Id`）去重。
  - 失败时从 1 秒起翻倍、最长 300 秒重试；失败 10 次后进入 `dead`，可以 `redrive()`，见备份与恢复文档第 5 节。
- **消费端幂等**：`IdempotentConsumer` 已处理的事件记在 SQLite 表 `consumed_events` 中。
- **审计**：
  - 经 API 的创建、更新与删除在同一事务中写入审计记录，含租户、主体、key id、correlation id、动作与结果。
  - 新增 `GET /api/v1/audit-events`：要求 `read` scope，只返回本租户的记录，可按 `correlationId` 过滤，以签名游标分页。网关转发这个路径。
- **webhook 安全**：日志与错误中只出现 webhook 的 scheme、主机与端口；不跟随重定向；地址不能含用户信息；token 经明文 http 发往非回环地址时，启动日志给出警告。
- **文档**：README（配置表、事件与审计）、CHANGELOG、OpenAPI（审计接口与动作枚举）、module-mapping、备份与恢复（重新投递）；修正恢复检查清单中的一个错字；README 功能概览的「现状」注释与测试统计同步更新。

## 兼容性（破坏性）

- `Outbox.put` 只能在调用方的事务中调用；`Outbox` 的 `conn` 参数改为 `database=`。
- Outbox 的终态 `failed` 改为 `dead`（打开旧库时自动转换），`get_stats()` 的键随之改变。

## 测试

- `make test`：2584 passed（新增 224 个）；Go 测试函数 136 个（新增 2 个，覆盖网关转发审计接口）。每个提交单独检出时全部通过。
- 新增测试覆盖：
  - 写入失败回滚时，事件与审计记录一起消失；
  - 共用连接的并发写入被串行化；
  - 重试、`dead`、`redrive()`，以及重启之后继续发布；
  - webhook 的重定向、凭证脱敏与超时；
  - 审计查询的租户隔离与分页。
- compose 冒烟通过。

## 遗留

- 事件只是尽力按写入顺序投递，没有按资源保证顺序。
- webhook 只用 bearer token 认证，没有请求签名。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；新增逻辑都有测试。
- [x] 公共接口的变化在 CHANGELOG 中以「破坏性」标注。
- [x] ADR：实现 ADR-008（事务性 Outbox），遵守 ADR-013。
- [x] CHANGELOG、README、OpenAPI、module-mapping 与备份恢复文档已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：审计查询限定在本租户；webhook 的 token 与地址中的敏感部分不会出现在日志中。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 5 个 PR：`cursor/p2-observability-metrics-b108`

**标题**

```text
feat(observability): 控制平面与网关导出 Prometheus 指标并传递 W3C traceparent，网关错误统一为 JSON 信封
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-5（改进计划 P2-3）。此前存在以下问题：

- 指标与追踪只记录在内存中，没有任何导出；
- 网关自己的错误响应（限流、上游失败、未匹配路由）是纯文本；
- 同一个请求在网关与控制平面的日志中无法对应起来。

**依赖**：基于第 4 个 PR（`cursor/p1-outbox-audit-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p1-outbox-audit-b108...cursor/p2-observability-metrics-b108)。

## 改动

- **控制平面 `/metrics`**：以 Prometheus 文本格式（0.0.4）输出，不依赖第三方库。指标覆盖：
  - HTTP 请求数与耗时；
  - 协调次数与耗时、控制器的重试与队列深度；
  - 部署结果，以及实例核对、重新部署与孤立分配回收的计数；
  - 各阶段的服务数、分配与设备、工作流运行；
  - Outbox 的积压与发布尝试；
  - 数据库锁的等待时间。
- **网关 `/metrics`**：请求数与耗时、流式首字节耗时、上游错误、限流、Resolver 查询与实例状态。
- **有界的标签**：标签只取路由模板、方法、状态码与固定的枚举值，不含租户、服务名、命名空间、uid 或地址；每个指标最多 200 个标签组合，超出的计入 `overflow`。
- **追踪上下文**：
  - 网关沿用请求中合法的 `traceparent`，否则生成一个，再转发给控制平面与推理实例；控制平面按同样的规则读取。
  - 日志默认为 JSON（`FORGEMESH_LOG_FORMAT=text` 可选，级别由 `FORGEMESH_LOG_LEVEL` 控制），日志与错误信封都带 trace-id 与关联 ID。
- **错误信封**：
  - 网关自己返回的 `429` / `500` / `502` / `404` 改为 JSON 信封，错误码分别为 `RATE_LIMITED`、`INTERNAL_ERROR`、`UPSTREAM_UNAVAILABLE`、`ROUTE_NOT_FOUND`。
  - panic 由 Recovery 兜底为带 ID 的 `500`。
  - 控制平面对不匹配任何端点的路径返回 `404 ROUTE_NOT_FOUND`，资源不存在仍为 `NOT_FOUND`；CLI 据此提示检查 `--api-url`。
- **compose 冒烟**：不带凭证抓取两边的 `/metrics`；按 trace-id 在两边的日志与错误信封中找到同一个请求；核对实例核对与重新部署的计数。
- **CHANGELOG**：两条改变客户端所见响应的条目此前没有标注「破坏性」：控制平面的错误信封（第一轮写入）与网关的错误信封。现补上标注与迁移方式。
- **文档**：README「可观测性」一节、gateway/README、CHANGELOG、module-mapping；README 功能概览的「现状」注释与测试统计同步更新。

## 兼容性（破坏性）

- 网关自己的错误响应由纯文本改为 JSON 信封，状态码与 `Retry-After` 不变。
- 控制平面的日志默认改为 JSON 格式，写到标准错误。
- 两个 `/metrics` 不要求认证，只输出跨租户聚合的数据；部署时不要把它们暴露到公网。

## 测试

- `make test`：2689 passed（新增 105 个）；Go 测试函数 187 个（新增 51 个）。每个提交单独检出时全部通过。
- 新增测试覆盖：指标的输出格式与标签上限；每个计数器在对应的代码路径上递增；`traceparent` 的解析、生成与转发；日志格式；每一种错误信封。
- compose 冒烟通过。

## 遗留

- 不记录 span，也没有 OTLP 导出。
- `forgemesh.controlplane.observability` 中的内存记录器不经 `/metrics` 输出。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；网关 `gofmt`、`go vet`、`go test -race` 通过。
- [x] 响应格式的变化在 CHANGELOG 中以「破坏性」标注。
- [x] CHANGELOG、README、gateway/README 与 module-mapping 已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：指标不含租户与服务标识；文档说明不要把 `/metrics` 暴露到公网。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 6 个 PR：`cursor/p2-ci-deploy-hardening-b108`

**标题**

```text
ci: 覆盖率下限、依赖漏洞审计与包导入检查，网关升级到 Go 1.27；补齐 Kubernetes 网关、ServiceAccount 与网络策略
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-6。此前 CI 存在以下缺口：

- 没有覆盖率门禁和依赖漏洞审计；
- 包的依赖漏声明会被同一环境中的其他包掩盖；
- 网关用的 Go 1.22 已经停止维护。

Kubernetes 清单也只有控制平面：没有网关，没有专用的 ServiceAccount，也没有网络策略。

**依赖**：基于第 5 个 PR（`cursor/p2-observability-metrics-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p2-observability-metrics-b108...cursor/p2-ci-deploy-hardening-b108)。

## 改动

- **CI**：
  - 统计 ADR 文件改用 `find`。
  - 新增 `package-imports` job：每个包一个全新的虚拟环境，只装它声明的依赖，然后导入它的全部模块。
  - `python` job 改以 `pytest --cov` 运行，总覆盖率低于 `fail_under` 时失败。下限为 97，实测 97.20%。
  - 新增 `dependency-audit` job：`pip-audit` 2.10.1 审计 `make install` 装出的环境，`govulncheck` v1.9.0 检查网关。
- **Go 1.27**：Dockerfile、CI 与 `gateway/go.mod`（`go 1.27.0`）一起升级。go.mod 的 `go` 行决定 GODEBUG 的默认值：以 Go 1.27 构建 `go 1.22` 的模块，会沿用 1.22 的默认行为（查询参数个数不设上限、反向代理重新编码查询串、GOMAXPROCS 不感知容器的 CPU 限制）。新增的 `godebug_test.go` 防止回退到旧的默认值。
- **Kubernetes**：
  - 网关的 Deployment 与 Service（`forgemesh-gateway`）；两个专用 ServiceAccount，都不挂载 token。
  - 默认拒绝的网络策略：只放行 DNS、网关到控制平面的 8080、任何来源到网关的 8081。
  - 可选的清单：Prometheus 抓取策略（`monitoring/`）；事件 webhook 的出站策略与补丁（`event-webhook/`）；假启动器的试用补丁，每秒核对一次实例。
  - 文档覆盖 tgi-process、实例记录文件与限制。
- **kind 验证**：用本分支构建的镜像，在 Calico（nftables 模式）上执行网络策略：
  - 经网关的认证请求：带 key 返回 `200`，不带 key 返回 `401`。
  - 网络策略 22 项检查全部符合预期：只有带 Prometheus 标签的 Pod 能抓取 `/metrics`，其他 Pod 访问不到控制平面。
  - 假启动器的闭环：创建、以 `PATCH` 更新、实例丢失之后重新部署、删除。
- **文档**：README「Kubernetes 部署」一节、CONTRIBUTING、SECURITY 3.1（已知漏洞的处理规则）、CHANGELOG、module-mapping；README 测试统计加入覆盖率。

## 兼容性（破坏性）

- 默认拒绝的网络策略：集群内的调用方必须经网关访问，已在 CHANGELOG 中以「破坏性」标注。
- 开发网关需要 Go 1.27；1.21 之后的 go 命令会自动下载。Go 1.27 默认行为的变化写在 CHANGELOG 中：
  - 查询参数超过 10000 个的请求，转发时不带查询串；
  - GOMAXPROCS 跟随容器的 CPU 限制；
  - 监听也接受 Multipath TCP。

## 测试

- `make test`：2698 passed（新增 9 个，覆盖包导入检查）；Go 测试函数 188 个（新增 1 个）；覆盖率 97.20%。每个提交单独检出时全部通过。
- pip-audit 没有发现已知漏洞；govulncheck（go1.27.2）没有发现漏洞。
- `actionlint` 通过，compose 冒烟通过。

## 遗留

- 覆盖率下限与实测值只差 0.2 个百分点。如果希望留出余量，可以把 `fail_under` 改为 96。
- 网关缓存实例列表 5 秒。在 kind 上，每次重新部署之后连续出现 3 次 `502`（compose 冒烟对此重试）。后续可以在连接被拒绝时刷新缓存。
- vLLM 与 TGI 没有在 Kubernetes 上验证过。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint` 与 `make test` 通过；网关 `gofmt`、`go vet`、`go test -race` 通过。
- [x] 部署方式的变化在 CHANGELOG 中以「破坏性」标注。
- [x] CHANGELOG、README、CONTRIBUTING、SECURITY 与 module-mapping 已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [x] 安全：引入依赖漏洞审计；Pod 满足 Pod Security 的 `restricted` 级别；网络策略默认拒绝。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```

---

### 第 7 个 PR：`cursor/p2-ruff-format-b108`

**标题**

```text
style: 全仓库执行 ruff format，并在 CI 中检查格式
```

**描述**

```markdown
## 概述

改进计划第 9 节的 R3-7。仓库中有 73 个 Python 文件不符合 `ruff format` 的格式；此前只要求新改动的文件是格式化的。本 PR 一次性格式化全仓库，并在 CI 中检查格式，以后的 diff 不再夹带格式改动。

**依赖**：基于第 6 个 PR（`cursor/p2-ci-deploy-hardening-b108`）。本 PR 自己的改动见[这里](https://github.com/KnightKKOP/ForgeMesh/compare/cursor/p2-ci-deploy-hardening-b108...cursor/p2-ruff-format-b108)。

## 改动

- **固定 ruff 版本**：`requirements-dev.txt` 把 ruff 限定在 0.17 系列。ruff 的格式风格与规则集随 minor 版本变化；升级时以 `make fmt` 重新格式化全仓库，并与版本号一起提交。
- **排除 Markdown**：`pyproject.toml` 让 Markdown 不参与格式化。ruff 0.17 也会格式化 Markdown 中的 Python 代码块，而文档中的代码是示意。
- **格式化**：`style:` 提交对 73 个文件执行 `ruff format`，只改格式。在它的父提交上运行 `make fmt`，可以逐字节复现这个提交。
- **CI 检查**：`python` job 新增 `ruff format --check .`，`make lint` 同样执行。CONTRIBUTING、README、SECURITY 与 CHANGELOG 同步说明。
- **跳过 blame**：`.git-blame-ignore-revs` 列出格式化提交，GitHub 的 blame 视图自动跳过它。这个文件依赖格式化提交的哈希，所以要以合并提交（Create a merge commit）合入；squash 或 rebase 合入会改变哈希。

## 兼容性

- 不改变任何行为。
- 其他进行中的分支 rebase 到本 PR 之后，可能遇到格式冲突。可以先在自己的分支上运行 `make fmt` 并提交，再 rebase。

## 测试

- `make test`：2698 passed（与上一个 PR 相同），覆盖率不变。每个提交单独检出时全部通过。
- `ruff check .` 与 `ruff format --check .` 通过，CI 的 4 个校验脚本通过。

## 检查项

- [x] 基于上一个 PR 的分支（叠放）。
- [x] 提交信息符合 Conventional Commits，并已 `Signed-off-by`（DCO）。
- [x] `make lint`（含格式检查）与 `make test` 通过。
- [x] 只改格式，不改变行为。
- [x] CHANGELOG、README、CONTRIBUTING 与 SECURITY 已同步。
- [x] 无遗留调试代码、密钥、临时文件或大体积二进制。
- [ ] 关联 Issue：上游目前没有对应的 Issue。
```
