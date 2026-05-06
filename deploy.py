#!/usr/bin/env python3
"""
Windsurf Better 部署工具
将 windsurf-better.js（整合版）或单独脚本内联注入到 Windsurf 的 workbench.html 中
"""

import os
import re
import shutil
import argparse
from pathlib import Path

# ================== 配置 ==================
SCRIPT_DIR = Path(__file__).parent.resolve()
BETTER_SOURCE = SCRIPT_DIR / "windsurf-better.js"  # 整合版（气泡+汉化）
JS_SOURCE = SCRIPT_DIR / "windsurf-bubbles.js"
DOM_ANALYZER_SOURCE = SCRIPT_DIR / "windsurf-dom-analyzer.js"
LOCALIZATION_SOURCE = SCRIPT_DIR / "windsurf-localization.js"

WORKBENCH_SUBPATH = Path("resources") / "app" / "out" / "vs" / "code" / "electron-browser" / "workbench"
TARGET_FILENAME = "workbench.html"
BACKUP_SUFFIX = ".origin"

# 补丁标记
PATCH_MARKER = "<!-- WS-BUBBLES-PATCH -->"
TRUSTED_TYPE_NAME = "abBubbles"

# Windsurf 搜索路径
SEARCH_ROOTS = [
    Path(os.environ.get("ProgramFiles", "C:\\Program Files")) / "Windsurf",
    Path(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")) / "Windsurf",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Windsurf",
    Path("D:\\Program Files") / "Windsurf",
    Path("D:\\Program") / "Windsurf",
    Path("E:\\Program Files") / "Windsurf",
    Path("E:\\Program") / "Windsurf",
    Path("F:\\Program") / "Windsurf",
]


def find_windsurf_workbench(custom_path: str = None) -> Path | None:
    """查找 Windsurf 的 workbench 目录"""
    if custom_path:
        p = Path(custom_path)
        if (p / TARGET_FILENAME).exists():
            return p
        wb = p / WORKBENCH_SUBPATH
        if (wb / TARGET_FILENAME).exists():
            return wb
        return None

    # 从桌面快捷方式解析
    root = _find_from_shortcuts()
    if root:
        wb = root / WORKBENCH_SUBPATH
        if (wb / TARGET_FILENAME).exists():
            return wb

    # 硬编码路径搜索
    for root_path in SEARCH_ROOTS:
        wb = root_path / WORKBENCH_SUBPATH
        if wb.exists() and (wb / TARGET_FILENAME).exists():
            print(f"从预设路径找到: {root_path}")
            return wb

    return None


def _find_from_shortcuts() -> Path | None:
    """从桌面快捷方式解析 Windsurf 安装目录"""
    try:
        import subprocess
        desktop_dirs = [
            Path(os.environ.get("USERPROFILE", "")) / "Desktop",
            Path(os.environ.get("PUBLIC", "")) / "Desktop",
        ]
        for desktop in desktop_dirs:
            if not desktop.exists():
                continue
            for lnk in desktop.glob("*.lnk"):
                if "windsurf" not in lnk.stem.lower():
                    continue
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command",
                     f'(New-Object -ComObject WScript.Shell).CreateShortcut("{lnk}").TargetPath'],
                    capture_output=True, text=True, timeout=5
                )
                target = result.stdout.strip()
                if not target or "windsurf" not in target.lower():
                    continue
                target_path = Path(target)
                if target_path.name.lower().endswith(".exe"):
                    root = target_path.parent
                    print(f" 从快捷方式 [{lnk.name}] 解析到: {root}")
                    return root
    except Exception as e:
        print(f"快捷方式解析失败: {e}")
    return None


def is_patched(html_content: str) -> bool:
    """检查 HTML 是否已打过补丁"""
    return PATCH_MARKER in html_content


def patch_html(html_content: str, js_content: str) -> str:
    """给 workbench.html 打补丁：修改 CSP + 内联注入 JS"""
    # 0. 先移除所有历史补丁，避免重复注入
    if is_patched(html_content):
        html_content = re.sub(
            rf"\s*{re.escape(PATCH_MARKER)}\s*<script>.*?</script>",
            "",
            html_content,
            flags=re.DOTALL,
        )
        print("已清理旧补丁")

    # 1. 在 script-src 添加 'unsafe-inline'
    csp_pattern = r"(script-src\s+[^;]+)"
    match = re.search(csp_pattern, html_content)
    if match:
        script_src = match.group(1)
        if "'unsafe-inline'" not in script_src:
            new_script_src = script_src + " 'unsafe-inline'"
            html_content = html_content.replace(script_src, new_script_src)
            print("已添加 'unsafe-inline' 到 CSP script-src")
        else:
            print("CSP script-src 已包含 'unsafe-inline'")
    else:
        print("未找到 script-src 声明")

    # 2. 在 trusted-types 添加我们的策略名
    tt_pattern = r"(trusted-types\s*\n(?:\s+\w[\w#]*\s*\n)*?)(\s*;)"
    match = re.search(tt_pattern, html_content)
    if match:
        if TRUSTED_TYPE_NAME not in match.group(0):
            insertion = f"\t\t\t\t\t{TRUSTED_TYPE_NAME}\n"
            html_content = html_content[:match.end(1)] + insertion + html_content[match.start(2):]
            print(f"已添加 trusted-type: {TRUSTED_TYPE_NAME}")
        else:
            print(f"trusted-type {TRUSTED_TYPE_NAME} 已存在")
    else:
        print("未找到 trusted-types 声明")

    # 3. 在 </html> 前内联注入脚本
    inline_script = f"\n{PATCH_MARKER}\n<script>\n{js_content}\n</script>\n</html>"
    html_content = re.sub(r"</html>\s*$", lambda _: inline_script, html_content)
    print("已内联注入脚本")

    return html_content


def unpatch_html(html_content: str) -> str:
    """移除补丁"""
    # 移除内联脚本块
    html_content = re.sub(
        rf"{re.escape(PATCH_MARKER)}\s*<script>.*?</script>\s*</html>",
        "</html>",
        html_content,
        flags=re.DOTALL
    )

    # 移除 CSP 中的 'unsafe-inline'
    html_content = re.sub(r"\s*'unsafe-inline'", "", html_content)

    # 移除 trusted-type
    html_content = re.sub(rf"\t\t\t\t\t{re.escape(TRUSTED_TYPE_NAME)}\n", "", html_content)

    return html_content


def deploy(target_dir: Path, dry_run: bool = False, analyzer: bool = False, localization: bool = False, better: bool = False) -> tuple[bool, str]:
    """执行部署"""
    try:
        if analyzer and localization:
            return False, "参数冲突：-a 和 -l 不能同时使用"
        if analyzer and better:
            return False, "参数冲突：-a 和 -b 不能同时使用"
        if localization and better:
            return False, "参数冲突：-l 和 -b 不能同时使用"

        source_file = DOM_ANALYZER_SOURCE if analyzer else (LOCALIZATION_SOURCE if localization else (BETTER_SOURCE if better else JS_SOURCE))
        if not source_file.exists():
            return False, f"源文件不存在: {source_file}"

        target_html = target_dir / TARGET_FILENAME
        backup_html = target_dir / (TARGET_FILENAME + BACKUP_SUFFIX)

        if not target_html.exists():
            return False, f"目标 HTML 不存在: {target_html}"

        # 读取文件
        html_content = target_html.read_text(encoding="utf-8")
        js_content = source_file.read_text(encoding="utf-8")

        # 备份（仅首次）
        if not backup_html.exists():
            if dry_run:
                print(f"[DRY-RUN] 备份: {target_html} → {backup_html}")
            else:
                shutil.copy2(target_html, backup_html)
                print(f" 已备份: {backup_html}")
        else:
            print(f" 备份已存在: {backup_html}")

        # 打补丁
        patched_html = patch_html(html_content, js_content)
        if dry_run:
            print(f"[DRY-RUN] 写入补丁 HTML")
        else:
            target_html.write_text(patched_html, encoding="utf-8")

        return True, "部署成功！重启 Windsurf 生效。"

    except PermissionError:
        return False, "权限不足，请以管理员身份运行。"
    except Exception as e:
        return False, f"部署失败: {e}"


def restore(target_dir: Path, dry_run: bool = False) -> tuple[bool, str]:
    """恢复原始文件"""
    try:
        target_html = target_dir / TARGET_FILENAME
        backup_html = target_dir / (TARGET_FILENAME + BACKUP_SUFFIX)

        if backup_html.exists():
            if dry_run:
                print(f"[DRY-RUN] 恢复: {backup_html} → {target_html}")
            else:
                shutil.copy2(backup_html, target_html)
                print(f" 已恢复 HTML: {target_html}")
        else:
            html_content = target_html.read_text(encoding="utf-8")
            if is_patched(html_content):
                if not dry_run:
                    unpatched = unpatch_html(html_content)
                    target_html.write_text(unpatched, encoding="utf-8")
                    print(" 已移除 HTML 补丁")
            else:
                print("HTML 未打补丁，无需恢复")

        return True, "恢复成功！重启 Windsurf 生效。"

    except PermissionError:
        return False, "权限不足，请以管理员身份运行。"
    except Exception as e:
        return False, f"恢复失败: {e}"


def status(target_dir: Path):
    """查看状态"""
    target_html = target_dir / TARGET_FILENAME
    backup_html = target_dir / (TARGET_FILENAME + BACKUP_SUFFIX)

    print(f" 目标目录: {target_dir}")
    print(f"  workbench.html: {' 存在' if target_html.exists() else ' 不存在'}")
    print(f"  备份文件: {' 存在' if backup_html.exists() else ' 不存在'}")

    if target_html.exists():
        html = target_html.read_text(encoding="utf-8")
        print(f"  补丁状态: {' 已打补丁' if is_patched(html) else ' 未打补丁'}")


def main():
    parser = argparse.ArgumentParser(
        description="Windsurf Better 部署工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python deploy.py deploy                  # 部署气泡功能（默认）
  python deploy.py deploy -b               # 部署整合版（气泡+汉化）推荐
  python deploy.py deploy -l               # 部署汉化功能
  python deploy.py deploy -a               # 部署 DOM 分析工具
  python deploy.py deploy -t "E:\\..."    # 指定路径
  python deploy.py restore                 # 恢复原文件
  python deploy.py status                  # 查看状态
        """
    )

    parser.add_argument("action", choices=["deploy", "restore", "status"],
                        help="deploy=部署, restore=恢复, status=查看状态")
    parser.add_argument("-t", "--target", type=str, help="指定 Windsurf 安装目录或 workbench 目录")
    parser.add_argument("-n", "--dry-run", action="store_true", help="仅模拟，不实际执行")
    parser.add_argument("-b", "--better", action="store_true", help="部署整合版（气泡+汉化）")
    parser.add_argument("-a", "--analyzer", action="store_true", help="部署 DOM 分析工具")
    parser.add_argument("-l", "--localization", action="store_true", help="部署汉化脚本")

    args = parser.parse_args()

    # 查找目标
    target_dir = find_windsurf_workbench(args.target)
    if not target_dir:
        print("未找到 Windsurf 安装目录")
        print("  请使用 -t 参数指定路径，例如:")
        print('  python deploy.py deploy -t "E:\\Program\\Windsurf"')
        return

    print(f" 目标目录: {target_dir}")

    if args.action == "deploy":
        success, msg = deploy(target_dir, args.dry_run, args.analyzer, args.localization, args.better)
    elif args.action == "restore":
        success, msg = restore(target_dir, args.dry_run)
    elif args.action == "status":
        status(target_dir)
        return

    print(f"\n{'成功' if success else '失败'}: {msg}")


if __name__ == "__main__":
    main()
