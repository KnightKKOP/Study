# ForgeMesh 改进优化方案与实现

本仓库是对 [Mekoforge/ForgeMesh](https://github.com/Mekoforge/ForgeMesh) 做代码审查后的产出：一份改进优化文档，以及按文档实现、以 `git format-patch` 格式保存的三轮主题分支。每个分支对应一个上游 PR。

| 路径 | 内容 |
|---|---|
| [`docs/forgemesh-improvement-plan.md`](docs/forgemesh-improvement-plan.md) | 改进优化文档：P0/P1/P2 问题清单（附基线代码位置）、修复与设计方案、验收标准、分阶段路线图、实施情况与后续开发计划 |
| [`patches/forgemesh/`](patches/forgemesh/) | 第一轮：7 个分支，基于 `5a0be13`，已作为 [#5](https://github.com/Mekoforge/ForgeMesh/pull/5) 至 [#11](https://github.com/Mekoforge/ForgeMesh/pull/11) 合入上游 |
| [`patches/forgemesh/round-2/`](patches/forgemesh/round-2/) | 第二轮：5 个分支，基于 `3dc1342`，已作为 [#12](https://github.com/Mekoforge/ForgeMesh/pull/12) 至 [#16](https://github.com/Mekoforge/ForgeMesh/pull/16) 合入上游 |
| [`patches/forgemesh/round-3/`](patches/forgemesh/round-3/) | 第三轮：7 个分支，基于 `c5b7f76`，已作为 [#17](https://github.com/Mekoforge/ForgeMesh/pull/17) 至 [#23](https://github.com/Mekoforge/ForgeMesh/pull/23) 合入上游；[`pr-texts.md`](patches/forgemesh/round-3/pr-texts.md) 是 7 个 PR 的标题与描述 |
| [`patches/forgemesh/roadmap/`](patches/forgemesh/roadmap/) | 上游的路线图与架构设计文档：路线图 `docs/architecture/roadmap.md` 第 1 版已作为 [#24](https://github.com/Mekoforge/ForgeMesh/pull/24) 合入；第 2 版（与 KServe、Kthena 的分工，各主题注明承接的遗留问题）与架构设计文档 v1.1（清理复制残留、与 ADR 和 1.1.0 对齐、新增执行后端与模型服务接入）两个分支叠放在 `cd5226f` 上，待提交；[`pr-texts.md`](patches/forgemesh/roadmap/pr-texts.md) 是这些 PR 的标题与描述 |

每一轮（以及路线图文档）都有一个 `apply-branches.sh`，在 ForgeMesh 克隆里按顺序重建对应的分支，可选签署 DCO、改作者、推送到 fork。

## 第三轮主题分支

第三轮实施改进文档 9.1 节的第三阶段，已作为 #17 至 #23 合入上游（合入后 `main` 为 `871cf9b`）。分支是叠放的：每个分支以前一个分支为基础，第一个基于 `c5b7f76`，共 87 个提交。

| 顺序 | 目录 / 分支 | 提交数 | 内容 |
|---|---|---|---|
| 1 | `01-p1-api-contract-completion` / `cursor/p1-api-contract-completion-b108` | 11 | R3-1：服务端维护 `generation`；`PUT` / `PATCH` 更新接口（乐观并发）；签名的分页游标；服务端推导决策风险等级；注册中心未初始化时返回 503；OpenAPI 契约测试 |
| 2 | `02-p1-update-and-health` / `cursor/p1-update-and-health-b108` | 20 | R3-2：修改 `spec` 后重新部署；定期核对实例，丢失时经 `Degraded` 重新部署；回收孤立的分配；`tgi-process` 启动器；控制平面被杀死之后结束残留的实例进程 |
| 3 | `03-p1-cli-over-http` / `cursor/p1-cli-over-http-b108` | 6 | R3-3：CLI 改为 REST API 的客户端（`apply`、`get`、`describe`、`list`、`delete`、`wait`），分级退出码 |
| 4 | `04-p1-outbox-audit` / `cursor/p1-outbox-audit-b108` | 14 | R3-4：资源变更事件与审计记录同事务写入；Outbox 退避重试与 `dead`；事件发布到日志或 webhook；审计查询 API |
| 5 | `05-p2-observability-metrics` / `cursor/p2-observability-metrics-b108` | 17 | R3-5：控制平面与网关的 Prometheus `/metrics`；W3C `traceparent` 与结构化日志；网关错误统一为 JSON 信封 |
| 6 | `06-p2-ci-deploy-hardening` / `cursor/p2-ci-deploy-hardening-b108` | 14 | R3-6：覆盖率下限、依赖漏洞审计、包导入检查；网关升级到 Go 1.27；网关的 Kubernetes 清单、ServiceAccount 与网络策略 |
| 7 | `07-p2-ruff-format` / `cursor/p2-ruff-format-b108` | 5 | R3-7：ruff 固定在 0.17 系列，全仓执行一次 `ruff format`，CI 检查格式 |

第 7 个目录只有 4 个补丁：最后一个提交把格式化提交的哈希写进 `.git-blame-ignore-revs`，哈希要等补丁应用之后才知道，由 `apply-branches.sh` 生成。这个文件要求上游以合并提交的方式合入（与前两轮相同），squash 或 rebase 合入会改变哈希。

## 重建并推送到 fork

```bash
git clone https://github.com/<你的账号>/ForgeMesh.git
cd ForgeMesh
git fetch https://github.com/Mekoforge/ForgeMesh.git main   # fork 的 main 落后时，取回基线 c5b7f76
/path/to/this/repo/patches/forgemesh/round-3/apply-branches.sh . --signoff --reset-author --push origin
```

- `--signoff`：给每个提交加上你的 `Signed-off-by`。上游 CONTRIBUTING 要求 DCO 签署，这一步必须由你本人确认。
- `--reset-author`：把提交作者改成你的 git 身份；不加则保留 `Cursor Agent <cursoragent@cursor.com>`。
- `--push origin`：把全部分支推到 fork；不加则只在本地创建分支。

脚本要求克隆中有基线提交、工作区干净、目标分支不存在。重建后前 6 个分支的代码树与这里验证过的结果逐字节一致，第 7 个分支只有 `.git-blame-ignore-revs` 中的哈希不同。前两轮的脚本分别在 `patches/forgemesh/` 与 `patches/forgemesh/round-2/`，用法相同，基线为 `5a0be13` 与 `3dc1342`。

## 验证

需要 Python 3.12 及以上与 Go 1.27（1.21 之后的 go 命令会按 `gateway/go.mod` 自动下载）。

```bash
make install    # 默认的 python3 低于 3.12 时：make install PY=python3.12
make test       # 第三轮七个分支都应用后：2698 passed（c5b7f76 上为 1800）
make coverage   # 与 CI 相同：总覆盖率不得低于 97%（实测 97.2%）
make lint       # ruff check 与 ruff format --check
make audit      # pip-audit，需要网络；网关为 make -C gateway vulncheck
(cd gateway && test -z "$(gofmt -l .)" && go vet ./... && go test -race ./...)
for s in validate_manifests openapi_semantic_check check_metadata_consistency plugin_entrypoint_smoke; do
  .venv/bin/python scripts/$s.py
done
.venv/bin/python scripts/check_package_imports.py   # 每个包一个全新的虚拟环境
scripts/compose_smoke.sh   # 需要 Docker、Compose v2 与 jq
```

compose 冒烟经网关走完创建、`Ready`、流式对话、抓取两边的 `/metrics`、按 trace-id 关联日志、删除、同名重建、修改 `spec` 后重新部署、实例退出后重新部署与重启控制平面。部署推理服务（设备清单、启动器、本地用假运行时跑通闭环）与 Kubernetes 部署见 ForgeMesh 根目录 README 的「部署推理服务」与「Kubernetes 部署」两节。
