# Windsurf Better — AI 安装指南

> **读者：AI 助手。** 用户把本文件夹交给你，请严格按照以下步骤执行安装。不要跳步、不要猜测、不要省略。

---

## 0. 这个工具是什么

Windsurf IDE 增强插件，功能一览：

| 功能 | 说明 |
|------|------|
| 界面汉化 | 300+ 翻译词条，菜单/设置/模型选择器中文化 |
| 自动继续 | 配额耗尽时自动发送"继续"，含冷却/跨窗口锁/用户输入保护 |
| 完成提示音 | AI 回复完成时播放提示音+系统通知 |

---

## 1. 文件清单

| 文件 | 用途 | 安装时需要？ |
|------|------|:---:|
| `windsurf-better.js` | **整合版脚本**（全部功能） | ✅ 必须 |
| `deploy.py` | 部署脚本，注入JS到Windsurf | ✅ 必须 |
| `windsurf-localization.js` | 汉化独立版 | ❌ 仅独立部署时 |
| `源码.html` | 已注入的workbench.html参考 | ❌ 不需要 |
| `安装说明（给AI看的）.md` | 本文件 | ❌ 不需要 |

---

## 2. 前置条件检查

在执行安装前，**先确认以下条件**，缺一不可：

### 2.1 Windsurf 已安装
```powershell
# 检查常见安装路径
Test-Path "C:\Program Files\Windsurf"
Test-Path "$env:LOCALAPPDATA\Programs\Windsurf"
# 也可能装在 D:\ E:\ 等盘
```
如果都不存在，问用户 Windsurf 装在哪里。

### 2.2 Python 可用
```powershell
python --version
```
需要 Python 3.6+。如果没有，帮用户安装或用其他方式部署。

### 2.3 Windsurf 已关闭
**部署前必须关闭 Windsurf**，否则文件被锁无法写入。
```powershell
# 检查是否还在运行
Get-Process -Name "Windsurf" -ErrorAction SilentlyContinue
```
如果有输出，提示用户关闭 Windsurf 后再继续。

---

## 3. 执行安装

### 3.1 标准安装（推荐）

在**本文件夹**下执行：

```powershell
python deploy.py deploy -b
```

`-b` = 部署整合版（windsurf-better.js，包含全部功能）。

### 3.2 如果提示"未找到 Windsurf 安装目录"

手动指定路径：

```powershell
python deploy.py deploy -b -t "C:\Users\用户名\AppData\Local\Programs\Windsurf"
```

`-t` 后面是 Windsurf **安装根目录**（含 `windsurf.exe` 的那个文件夹），脚本会自动定位到 `resources\app\out\vs\code\electron-browser\workbench\workbench.html`。

### 3.3 如果提示"权限不足"

用管理员权限重新运行：
1. 右键 PowerShell → 以管理员身份运行
2. `cd` 到本文件夹
3. 重新执行 `python deploy.py deploy -b`

### 3.4 验证安装

```powershell
python deploy.py status
```

应输出：
```
 目标目录: ...
  workbench.html:  存在
  备份文件:  存在
  补丁状态:  已打补丁
```

---

## 4. 安装后操作

### 4.1 启动 Windsurf

**完全重启**（不是刷新窗口）：
1. 确认 Windsurf 已完全关闭（任务栏无图标）
2. 重新打开 Windsurf

### 4.2 确认生效

启动后右侧应出现 **⚙️ 齿轮悬浮按钮**，点击可看到设置面板：
- 汉化开关
- 自动继续开关
- 完成提示音开关 / 音色 / 音量
- 系统通知开关

如果没出现，打开开发者工具（Ctrl+Shift+I）→ Console，搜索 `[WS-Better]`，看是否有初始化日志。

---

## 5. 卸载

```powershell
python deploy.py restore
```

这会从备份恢复原始 workbench.html。然后重启 Windsurf。

---

## 6. Windsurf 更新后重新部署

Windsurf 更新会覆盖 workbench.html，需要重新部署：

```powershell
python deploy.py deploy -b
```

脚本会自动清理旧补丁再注入新的，无需手动处理。

---

## 7. 故障排查

| 症状 | 检查方法 | 解决 |
|------|----------|------|
| 齿轮按钮没出现 | Console 搜 `[WS-Better]` | 确认 `deploy.py status` 显示已打补丁；确认完全重启了 Windsurf |
| 汉化没生效 | 设置面板中汉化开关是否开启 | 点击齿轮 → 打开汉化开关 |
| 找不到 Windsurf | `python deploy.py status` 报错 | 用 `-t` 手动指定路径 |
| 权限不足 | 报错 "PermissionError" | 管理员权限运行 PowerShell |
| "文件已损坏"通知 | Windsurf 启动时弹出 | 正常现象，插件会自动关闭该通知 |
| 自动继续不触发 | Console 搜 `[AutoContinue]` | 查看诊断日志，确认检测条件 |
| 自动继续误触发 | Console 搜 `[AutoContinue]` | 查看日志中匹配了什么元素，反馈给开发者 |

---

## 8. 命令速查

| 命令 | 说明 |
|------|------|
| `python deploy.py deploy -b` | 部署整合版（**推荐**） |
| `python deploy.py deploy -l` | 仅部署汉化功能 |
| `python deploy.py deploy -b -t "路径"` | 手动指定路径部署 |
| `python deploy.py status` | 查看部署状态 |
| `python deploy.py restore` | 卸载/恢复原始文件 |
