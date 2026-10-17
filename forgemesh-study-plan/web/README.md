# 学习计划网页版

把上一级目录里的学习计划 Markdown 渲染成可交互的网页：任务和深挖题可以打勾，选每周投入多少小时，里程碑会自动换算成月份。

在线地址：<https://knightkkop.github.io/Study/>

## 内容从哪来

网页没有自己的一份内容，构建时直接读取这些文档：

| 文档 | 网页上的位置 |
|---|---|
| [`../README.md`](../README.md) | 顶部的标题、三条要点和“两点提醒” |
| [`../docs/roadmap.md`](../docs/roadmap.md) | 学习路线 |
| [`../docs/time-estimate.md`](../docs/time-estimate.md) | 时间估算 |
| [`../docs/knowledge-map.md`](../docs/knowledge-map.md) | 知识地图 |
| [`../docs/features.md`](../docs/features.md) | 功能清单 |
| [`../docs/interview-questions.md`](../docs/interview-questions.md) | 项目深挖题 |

`vite-plugin-plan.ts` 读取文档，交给 `src/plan/parse.ts` 解析成结构化数据，页面通过 `import plan from 'virtual:plan'` 拿到。开发服务器运行时改了文档，页面会自动刷新。

解析是严格的：文档结构和预期不一致时（比如某个阶段少了“**出关标准**：”，或者表格的列名改了），构建会失败，并报出是哪个文件、哪一处。改文档时保持现有写法就行：

- 阶段标题写成 `## 阶段 N：标题`，阶段内依次是“**目标**：”“**预计投入**：”、任务列表、“**出关标准**：”“**产出**：”“**面试时能讲**：”。
- 选做任务以“（选做）”结尾；面试准备线的任务以“（N～M 小时）”结尾。
- 时间都写成 `N～M 小时`（全角波浪号）。
- 每道深挖题下面正好一条以“线索：”开头的子项。

## 勾选进度存在哪

- 文档里的 `- [x]` 是基准，网页上显示为已完成。
- 在网页上勾选只保存在当前浏览器的 localStorage 里，只记录和文档不同的项。换浏览器、清缓存都会丢。
- 想长期保存，就在 Markdown 里改成 `- [x]` 并提交，重新发布后所有设备上都会显示为已完成。

## 本地运行

需要 Node.js 22。

```bash
cd forgemesh-study-plan/web
npm install
npm run dev        # http://127.0.0.1:47321
```

检查：

```bash
npm test           # 解析器测试，包括各文档之间的数字是否一致
npm run lint
npm run build      # 类型检查并输出到 dist/
```

## 发布

网页发布在 GitHub Pages 上，内容来自仓库的 `gh-pages` 分支。

```bash
npm run deploy     # 测试、构建，然后把 dist/ 推到 gh-pages 分支
```

`main` 分支上 `forgemesh-study-plan/` 有改动时，GitHub Actions 工作流 [`forgemesh-plan-site.yml`](../../.github/workflows/forgemesh-plan-site.yml) 会自动做同样的事，所以在 GitHub 网页上改完文档提交即可，一两分钟后网页更新。

第一次发布后，如果网址打不开，到仓库的 Settings → Pages，把 Source 设为 “Deploy from a branch”，分支选 `gh-pages`、目录选 `/ (root)`。

网页上“Markdown 原文”链接指向的仓库和分支在 `plan.config.ts` 里配置。

## 技术栈

Vite、React、TypeScript、Tailwind CSS、shadcn/ui。Markdown 用 `mdast-util-from-markdown` 加 GFM 扩展解析。
