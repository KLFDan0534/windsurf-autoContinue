# Windsurf Better

Windsurf IDE 增强插件，通过注入 `workbench.html` 添加多项实用功能。

## 功能

- **界面汉化** — 300+ 翻译词条，覆盖菜单、设置页、模型选择器等界面元素，一键开关
- **自动继续** — 检测配额耗尽提示，自动发送"继续"恢复对话。含60秒冷却、跨窗口互斥锁、用户输入保护（打字时不打断）、排队消息去重
- **完成提示音** — AI 回复完成时播放提示音 + 系统通知，支持多种音色和音量调节
- **可拖拽设置面板** — 悬浮齿轮按钮，所有功能实时开关，无需重启

## 安装

### 前置条件

- 已安装 [Windsurf IDE](https://windsurf.com)
- Python 3.6+
- 安装前**关闭 Windsurf**

### 一键部署

```bash
python deploy.py deploy -b
```

如果自动查找 Windsurf 失败，手动指定路径：

```bash
python deploy.py deploy -b -t "C:\Users\用户名\AppData\Local\Programs\Windsurf"
```

部署后**完全重启 Windsurf**（不是刷新窗口），右侧会出现 ⚙️ 齿轮悬浮按钮。

### 验证

```bash
python deploy.py status
```

## 卸载

```bash
python deploy.py restore
```

## Windsurf 更新后

Windsurf 更新会覆盖 `workbench.html`，重新运行部署即可：

```bash
python deploy.py deploy -b
```

## 命令速查

| 命令 | 说明 |
|------|------|
| `python deploy.py deploy -b` | 部署整合版（推荐） |
| `python deploy.py deploy -l` | 仅部署汉化功能 |
| `python deploy.py deploy -b -t "路径"` | 手动指定路径部署 |
| `python deploy.py status` | 查看部署状态 |
| `python deploy.py restore` | 卸载/恢复原始文件 |

## 故障排查

| 症状 | 解决 |
|------|------|
| 齿轮按钮没出现 | 确认 `deploy.py status` 显示已打补丁；确认完全重启了 Windsurf |
| 汉化没生效 | 点击齿轮 → 打开汉化开关 |
| 找不到 Windsurf | 用 `-t` 手动指定路径 |
| 权限不足 | 管理员权限运行 PowerShell |
| "文件已损坏"通知 | 正常现象，插件会自动关闭该通知 |
| 自动继续不触发 | 开发者工具 Console 搜 `[AutoContinue]` 查看诊断日志 |
| 自动继续误触发 | 同上，查看日志中匹配了什么元素 |

## 文件说明

| 文件 | 说明 |
|------|------|
| `windsurf-better.js` | 整合版脚本（全部功能） |
| `deploy.py` | 部署脚本 |
| `windsurf-bubbles.js` | 气泡功能独立版 |
| `windsurf-localization.js` | 汉化功能独立版 |
| `安装说明（给AI看的）.md` | AI 助手安装指南 |

## License

MIT
