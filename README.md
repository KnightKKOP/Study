# ForgeMesh 改进优化方案

本仓库是对 [Mekoforge/ForgeMesh](https://github.com/Mekoforge/ForgeMesh)（基线提交 `5a0be13`）做代码审查后的产出，包含两部分：

| 路径 | 内容 |
|---|---|
| [`docs/forgemesh-improvement-plan.md`](docs/forgemesh-improvement-plan.md) | 改进优化文档：P0/P1/P2 问题清单（附基线代码位置）、修复与设计方案、验收标准、分阶段路线图 |
| [`patches/forgemesh/`](patches/forgemesh/) | 8 个已验证的 P0 修复补丁（`git format-patch` 格式），可以直接用 `git am` 应用到基线上 |

## 应用补丁并验证

需要 Git、Python 3.12 及以上；验证网关还需要 Go 1.22。

```bash
git clone https://github.com/Mekoforge/ForgeMesh.git
cd ForgeMesh
git checkout -b improve/p0-fixes 5a0be13
git am /path/to/this/repo/patches/forgemesh/*.patch

make install    # 默认的 python3 低于 3.12 时：make install PY=python3.12
make test       # 预期：1146 passed（基线为 1115）
make lint
(cd gateway && go vet ./... && go test -race ./...)
```

在 `5a0be13` 上应用后，代码树与验证时的结果逐字节一致（10 个文件，+772/−142 行）。如果上游 `main` 已经前进，先试 `git am -3`；冲突会集中在 `store.py`、`routes.py`、`app.py` 这三个文件。

启动控制平面并创建一个推理服务：

```bash
FORGEMESH_DB_PATH=/tmp/forgemesh.db FORGEMESH_PORT=18480 .venv/bin/forgemesh-control-plane &

curl -s -X POST http://127.0.0.1:18480/api/v1/inference-services \
  -H 'X-Tenant-Id: acme' -H 'Content-Type: application/json' \
  -d '{
        "apiVersion": "forgemesh.io/v1alpha1",
        "kind": "InferenceService",
        "metadata": {"name": "llama", "namespace": "default"},
        "spec": {
          "model": {"reference": "models/llama"},
          "runtime": {"provider": "vllm", "version": "0.6.3"},
          "resources": {"accelerator": {"type": "nvidia-gpu", "count": 1, "minMemoryGiB": 16}}
        }
      }'
# 预期：HTTP 201，响应中包含 spec、服务端分配的 uid，以及 status.phase = "Pending"
```

想确认新测试确实能抓住这些缺陷，可以按文档[附录 B](docs/forgemesh-improvement-plan.md#附录-b复现与冒烟方法)的方法把业务代码换回基线重跑：补丁带来的 32 个新增或修改的测试会全部失败。

## 补丁一览

| 补丁 | 修复 |
|---|---|
| 0001 | 注册中心多个线程共用一个 SQLite 连接却不加锁，并发写入会互相回滚，接口报告成功但数据没有落库 |
| 0002 | `namespace` 为空时，同名资源可以无限重复创建 |
| 0003 | `request_delete` 和 `release_allocation` 写入时不带版本条件，会覆盖并发更新、绕过新加的 finalizer |
| 0004 | 标签过滤在 `LIMIT` 之后才执行，导致分页漏数据；`limit=-1` 会返回全部数据 |
| 0005 | 策略拒绝、待审批、分配失败之后，重新入队的协调被去重检查短路，永远不会重新评估 |
| 0006 | 可运行入口只挂了返回 501 的占位路由；现在提供真实 API，数据库路径和监听地址通过环境变量配置 |
| 0007 | 控制平面漏声明两个依赖，也没有命令行入口；只按声明依赖安装时，协调器和插件管理器无法导入 |
| 0008 | 创建接口丢弃 `spec`、允许任意 `kind`、返回 200；现在按强类型校验，成功返回 201，非法请求返回 400 |

## 合入前须知

补丁会改变一些对外行为，完整列表见文档 [3.4 节](docs/forgemesh-improvement-plan.md#34-行为变化升级须知)。最容易影响现有部署的几项：

- 默认监听地址从 `0.0.0.0` 改为 `127.0.0.1`，容器部署需要设置 `FORGEMESH_HOST=0.0.0.0`；
- 数据库默认落盘到 `./forgemesh.db`，路径由 `FORGEMESH_DB_PATH` 指定；
- 如果存量数据库里已有重复资源，服务会拒绝启动，需要先清理；
- `DELETE` 遇到并发修改时返回 409，客户端需要重试。

## 尚未修复的部分

还有两项 P0 没有补丁，文档里给出了设计：

- **P0-9 认证与租户绑定**（[4.9 节](docs/forgemesh-improvement-plan.md#49-p0-9-认证与租户绑定待做)）：目前租户身份就是请求头里的任意字符串，任何能访问网关或控制平面的人都能读写任意租户的数据。
- **P0-10 控制器驱动循环**（[4.10 节](docs/forgemesh-improvement-plan.md#410-p0-10-控制器驱动循环与状态回写待做)）：生产代码里没有任何地方运行协调器，创建的资源会一直停在 `Pending`。

这两项完成之前，ForgeMesh 不应该对外称为“稳定版”。P1、P2 的方案以及分阶段路线图，见文档第 5–7 节。
