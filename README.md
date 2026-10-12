# ForgeMesh 改进优化方案与实现

本仓库是对 [Mekoforge/ForgeMesh](https://github.com/Mekoforge/ForgeMesh) 做代码审查后的产出：一份改进优化文档，以及按文档实现、以 `git format-patch` 格式保存的两轮主题分支。每个分支对应一个上游 PR。

| 路径 | 内容 |
|---|---|
| [`docs/forgemesh-improvement-plan.md`](docs/forgemesh-improvement-plan.md) | 改进优化文档：P0/P1/P2 问题清单（附基线代码位置）、修复与设计方案、验收标准、分阶段路线图与实施情况 |
| [`patches/forgemesh/`](patches/forgemesh/) | 第一轮：7 个分支，基于 `5a0be13`，已作为 [#5](https://github.com/Mekoforge/ForgeMesh/pull/5) 至 [#11](https://github.com/Mekoforge/ForgeMesh/pull/11) 合入上游 |
| [`patches/forgemesh/round-2/`](patches/forgemesh/round-2/) | 第二轮：5 个分支，基于第一轮合入后的上游 `main`（`3dc1342`） |

两轮各有一个 `apply-branches.sh`，在 ForgeMesh 克隆里按顺序重建该轮的全部分支，可选签署 DCO、改作者、推送到 fork。

## 第二轮主题分支

分支是叠放的：每个分支以前一个分支为基础，第一个基于 `3dc1342`，共 37 个提交。治理分支不依赖其他分支，可以单独合入；其余分支按顺序合入。

| 顺序 | 目录 / 分支 | 提交数 | 内容 |
|---|---|---|---|
| 1 | `01-governance-preview-status` / `cursor/governance-preview-status-b108` | 3 | 治理：ADR-014 改为 Accepted；API 稳定性标注由 `stable` 更正为 `beta`（OpenAPI、README、SECURITY.md、弃用政策新增 1.4 节）；1.0.0 中与实现不符的能力表述改为勘误，README 功能概览逐条注明现状 |
| 2 | `02-p1-scheduler-allocation` / `cursor/p1-scheduler-allocation-b108` | 9 | P1-2：静态加速器清单（`FORGEMESH_INVENTORY_FILE`）上的 first-fit 调度器；分配按资源 uid 关联、设备独占由数据库保证、按 uid + generation 幂等；持有分配的资源删除时一律走 `Terminating` |
| 3 | `03-p1-workflow-execution` / `cursor/p1-workflow-execution-b108` | 6 | P1-3：参考工作流运行时在后台执行步骤并在重启后恢复；部署工作流（准备模型 → 启动实例 → 验证实例）与启动器契约；协调器按状态机逐阶段推进，到 `Ready` 才写 `status.endpoints`，失败时停实例、释放分配 |
| 4 | `04-p1-runtime-launcher-e2e` / `cursor/p1-runtime-launcher-e2e-b108` | 10 | P1-6：`fake`（进程内 OpenAI 兼容桩服务）与 `vllm-process` 两个启动器（`FORGEMESH_RUNTIME_LAUNCHER`）；重启后实例丢失的服务转为 `Degraded`；compose 冒烟经网关覆盖完整闭环 |
| 5 | `05-p1-plugin-supply-chain` / `cursor/p1-plugin-supply-chain-b108` | 9 | P1-7：Ed25519 制品签名并在注册时验签；权限按管理员授予判定；统一权限词表；10 个插件的入口改为 `<模块>:<类>`；清单如实声明进程内隔离 |

## 重建并推送到 fork

```bash
git clone https://github.com/<你的账号>/ForgeMesh.git
cd ForgeMesh
git fetch https://github.com/Mekoforge/ForgeMesh.git main   # fork 的 main 落后时，取回基线 3dc1342
/path/to/this/repo/patches/forgemesh/round-2/apply-branches.sh . --signoff --reset-author --push origin
```

- `--signoff`：给每个提交加上你的 `Signed-off-by`。上游 CONTRIBUTING 要求 DCO 签署，这一步必须由你本人确认。
- `--reset-author`：把提交作者改成你的 git 身份；不加则保留 `Cursor Agent <cursoragent@cursor.com>`。
- `--push origin`：把全部分支推到 fork；不加则只在本地创建分支。

脚本要求克隆中有基线提交、工作区干净、目标分支不存在；重建后的代码树与这里验证过的结果逐字节一致。第一轮的脚本是 `patches/forgemesh/apply-branches.sh`，用法相同，基线为 `5a0be13`。

## 验证

需要 Python 3.12 及以上与 Go 1.22。

```bash
make install    # 默认的 python3 低于 3.12 时：make install PY=python3.12
make test       # 第二轮五个分支都应用后：1800 passed（3dc1342 上为 1244）
make lint
(cd gateway && test -z "$(gofmt -l .)" && go vet ./... && go test -race ./...)
for s in validate_manifests openapi_semantic_check check_metadata_consistency plugin_entrypoint_smoke; do
  .venv/bin/python scripts/$s.py
done
scripts/compose_smoke.sh   # 需要 Docker、Compose v2 与 jq：经网关跑通创建、Ready、流式对话、删除、重建与重启
```

部署推理服务（设备清单、启动器、本地用假运行时跑通闭环）见 ForgeMesh 根目录 README 的「部署推理服务」一节。
