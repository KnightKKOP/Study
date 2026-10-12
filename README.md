# ForgeMesh 改进优化方案与实现

本仓库是对 [Mekoforge/ForgeMesh](https://github.com/Mekoforge/ForgeMesh)（基线提交 `5a0be13`）做代码审查后的产出：

| 路径 | 内容 |
|---|---|
| [`docs/forgemesh-improvement-plan.md`](docs/forgemesh-improvement-plan.md) | 改进优化文档：P0/P1/P2 问题清单（附基线代码位置）、修复与设计方案、验收标准、分阶段路线图 |
| [`patches/forgemesh/`](patches/forgemesh/) | 按文档实现的代码，每个子目录是一个主题分支（对应一个上游 PR），`git format-patch` 格式 |
| [`patches/forgemesh/apply-branches.sh`](patches/forgemesh/apply-branches.sh) | 在你的 ForgeMesh 克隆里重建这些分支，可选签署 DCO、改作者、推送到 fork |

## 主题分支

分支是叠放的：每个分支以前一个分支为基础，第一个基于上游 `main`（`5a0be13`）。向上游提 PR 时按顺序提交，前一个合入后再提下一个（或者先提出来、在描述里注明依赖）。

| 顺序 | 目录 / 分支 | 提交数 | 内容 |
|---|---|---|---|
| 1 | `01-p0-correctness-fixes` / `cursor/p0-correctness-fixes-b108` | 9 | P0-1 ~ P0-8：注册中心并发与 CAS、空 namespace 唯一性、分页过滤、调和去重、可运行入口、依赖声明、创建接口校验；CHANGELOG / README / OpenAPI 同步 |
| 2 | `02-p0-auth-tenant-binding` / `cursor/p0-auth-tenant-binding-b108` | 8 | P0-9：绑定租户的 API key 认证（网关与控制平面各自校验）、scope、统一错误信封、凭证不再转发给推理实例、按已验证租户限流；ADR-014 与文档 |
| 3 | `03-p0-controller-loop` / `cursor/p0-controller-loop-b108` | 8 | P0-10：控制器随应用启动，增量读取变更记录、按资源排队与退避、经 status 子资源（CAS）回写协调结果、写入成功后才登记去重键；缺少调度器时报告 `Ready=False`（`SchedulerUnavailable`），不再误报 `Ready=True` |
| 4 | `04-p1-inference-routing` / `cursor/p1-inference-routing-b108` | 4 | P1-1：`status.endpoints` 定义为 `{url, ready, instanceId, protocol}` 并进入资源模型、Schema 与 OpenAPI；status 子资源可写入实例地址；网关新增带命名空间的推理路由，只转发到 ready 实例，并按 `protocol` 映射实例上的推理路径（不再原样拼接入站路径） |
| 5 | `05-p1-gateway-hardening` / `cursor/p1-gateway-hardening-b108` | 7 | P1-8 / P2-2：网关在拨号时检查实例地址（`GATEWAY_INSTANCE_ALLOWED_CIDRS`，默认拒绝回环、链路本地与云元数据地址）、请求体上限（`413`）、放宽空闲连接池、解析器合并并发回源并短暂缓存"不存在 / 未就绪"、`/readyz` 改为请求控制平面的 `/readyz`、实例错误响应保留 `Content-Type` |
| 6 | `06-p2-sqlite-storage` / `cursor/p2-sqlite-storage-b108` | 3 | P2-1（部分）：控制平面的 SQLite 存储以 WAL 模式打开并启用外键约束；去重键查询不再每次删除过期键；备份文档改为 `VACUUM INTO` / `Connection.backup` 在线快照（原来的 checkpoint + `cp` 在写入期间可能得到损坏的备份），恢复时保留旧库的 `-wal` |

## 推送到你的 fork

```bash
git clone https://github.com/<你的账号>/ForgeMesh.git
cd ForgeMesh
/path/to/this/repo/patches/forgemesh/apply-branches.sh . --signoff --reset-author --push origin
```

- `--signoff`：给每个提交加上你的 `Signed-off-by`。上游 CONTRIBUTING 要求 DCO 签署，这一步必须由你本人确认。
- `--reset-author`：把提交作者改成你的 git 身份；不加则保留 `Cursor Agent <cursoragent@cursor.com>`。
- `--push origin`：把全部分支推到 fork；不加则只在本地创建分支。

脚本要求工作区干净、目标分支不存在；应用后的代码树与这里验证过的结果逐字节一致。

## 验证

需要 Python 3.12 及以上与 Go 1.22。

```bash
make install    # 默认的 python3 低于 3.12 时：make install PY=python3.12
make test       # 六个分支都应用后：1244 passed（基线为 1115）
make lint
(cd gateway && go vet ./... && go test -race ./...)
for s in validate_manifests openapi_semantic_check check_metadata_consistency plugin_entrypoint_smoke; do
  .venv/bin/python scripts/$s.py
done
```

启动方式（认证配置、key 生成、`dev` 模式）见 ForgeMesh 根目录 README 的「运行控制平面」一节。
