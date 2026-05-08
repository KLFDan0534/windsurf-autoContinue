const vscode = require('vscode');
const path = require('path');

const VERSION = '1.4.4';

function activate(context) {
    console.log('[WS-Better-Ext] Activating v' + VERSION);
    const panelProvider = new BetterPanelProvider(context.extensionPath);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('windsurf-better.panel', panelProvider)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('windsurf-better.reloadWindow', () => {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        })
    );
    console.log('[WS-Better-Ext] Activated');
}

class BetterPanelProvider {
    constructor(extensionPath) {
        this._extensionPath = extensionPath;
        this._view = null;
    }

    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionPath, 'resources'))]
        };
        webviewView.webview.html = this._getHtml();
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'reloadWindow':
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                    break;
                case 'updateSetting':
                    // 收到webview设置变更，注入JS到workbench页面更新localStorage
                    const key = msg.key;
                    const value = msg.value;
                    const script = `
                        (function(){
                            try {
                                var s = JSON.parse(localStorage.getItem('ws-better-settings') || '{}');
                                s['${key}'] = ${JSON.stringify(value)};
                                localStorage.setItem('ws-better-settings', JSON.stringify(s));
                                // 通知windsurf-better.js重新加载设置
                                if (window.__wsBetterReloadSettings) window.__wsBetterReloadSettings();
                            } catch(e) { console.error('[WS-Better-Ext] 注入设置失败:', e); }
                        })()
                    `;
                    // 通过vscode命令执行注入（在activeTextEditor的终端中不可行，需要用workspace）
                    // 唯一可靠方式：写一个临时文件让windsurf-better.js轮询读取
                    const fs = require('fs');
                    const os = require('os');
                    const tmpPath = path.join(os.tmpdir(), 'ws-better-settings-update.json');
                    fs.writeFileSync(tmpPath, JSON.stringify({ key, value, ts: Date.now() }), 'utf-8');
                    break;
            }
        });
    }

    _getHtml() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);padding:10px;font-size:13px;overflow-y:auto}
.header{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--vscode-panel-border)}
.header h2{font-size:14px;font-weight:600}
.ver{font-size:11px;color:var(--vscode-descriptionForeground);margin-left:auto}
.section{margin-bottom:12px;padding:8px 10px;border-radius:6px;background:var(--vscode-editor-inactiveSelectionBackground,rgba(128,128,128,.08))}
.section-title{font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.row{display:flex;justify-content:space-between;align-items:center;padding:3px 0}
.row label{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--vscode-editor-foreground)}
.toggle{position:relative;width:32px;height:18px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0}
.toggle .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--vscode-input-background,#3c3c3c);border-radius:9px;transition:.2s}
.toggle .slider:before{position:absolute;content:"";height:14px;width:14px;left:2px;bottom:2px;background:#888;border-radius:50%;transition:.2s}
.toggle input:checked+.slider{background:var(--vscode-button-background,#0e639c)}
.toggle input:checked+.slider:before{transform:translateX(14px);background:#fff}
.btn{width:100%;padding:7px 0;border-radius:6px;border:1px solid var(--vscode-button-border,transparent);background:var(--vscode-button-background);color:var(--vscode-button-foreground);font-size:12px;font-weight:600;cursor:pointer;margin-top:4px}
.btn:hover{background:var(--vscode-button-hoverBackground)}
.btn-sec{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border-color:var(--vscode-button-secondaryBorder,transparent)}
.btn-sec:hover{background:var(--vscode-button-secondaryHoverBackground)}
.info{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:10px;text-align:center;line-height:1.5}
</style>
</head>
<body>
<div class="header">
<h2>Windsurf Better</h2>
<span class="ver">v${VERSION}</span>
</div>

<div class="section">
<div class="section-title">气泡提示</div>
<div class="row"><label>启用气泡</label><label class="toggle"><input type="checkbox" id="bubblesEnabled" checked><span class="slider"></span></label></div>
<div class="row"><label>自动发送</label><label class="toggle"><input type="checkbox" id="bubblesAutoSend" checked><span class="slider"></span></label></div>
</div>

<div class="section">
<div class="section-title">界面汉化</div>
<div class="row"><label>启用汉化</label><label class="toggle"><input type="checkbox" id="localizationEnabled" checked><span class="slider"></span></label></div>
</div>

<div class="section">
<div class="section-title">自动继续</div>
<div class="row"><label>自动发送"继续"</label><label class="toggle"><input type="checkbox" id="autoContinueEnabled" checked><span class="slider"></span></label></div>
<div class="row"><label>多轮对话队列</label><label class="toggle"><input type="checkbox" id="chatQueueEnabled" checked><span class="slider"></span></label></div>
</div>

<div class="section">
<div class="section-title">通知与提示音</div>
<div class="row"><label>提示音</label><label class="toggle"><input type="checkbox" id="notifySoundEnabled" checked><span class="slider"></span></label></div>
<div class="row"><label>系统通知</label><label class="toggle"><input type="checkbox" id="notifySystemEnabled" checked><span class="slider"></span></label></div>
<div class="row"><label>AI回复完成</label><label class="toggle"><input type="checkbox" id="notifyOnComplete" checked><span class="slider"></span></label></div>
<div class="row"><label>自动继续通知</label><label class="toggle"><input type="checkbox" id="notifyOnAutoContinue" checked><span class="slider"></span></label></div>
<div class="row"><label>配额耗尽通知</label><label class="toggle"><input type="checkbox" id="notifyOnQuotaExhaust"><span class="slider"></span></label></div>
<div class="row"><label>队列完成通知</label><label class="toggle"><input type="checkbox" id="notifyOnQueueDone" checked><span class="slider"></span></label></div>
<div class="row"><label>AI提问通知</label><label class="toggle"><input type="checkbox" id="notifyOnAiQuestion" checked><span class="slider"></span></label></div>
</div>

<div class="section">
<div class="section-title">操作</div>
<button class="btn btn-sec" onclick="reloadWindow()">🔄 重载窗口</button>
</div>

<div class="info">
Windsurf Better v${VERSION}<br/>
气泡 · 汉化 · 自动继续 · 配额检测<br/>
设置实时生效，无需重载
</div>

<script>
const vscode = acquireVsCodeApi();
const KEY = 'ws-better-settings';
const DEFAULTS = {
    bubblesEnabled:true, bubblesAutoSend:true, bubblesTheme:'emerald', bubblesShape:'rounded',
    localizationEnabled:true, autoContinueEnabled:true, chatQueueEnabled:true,
    notifySoundEnabled:true, notifySoundVolume:0.3, notifySoundPreset:'chime',
    notifySystemEnabled:true, notifyOnComplete:true, notifyOnAutoContinue:true,
    notifyOnQuotaExhaust:false, notifyOnQueueDone:true, notifyOnAiQuestion:true,
    togglePos:null, panelBgColor:'#1e1e2e', toggleBgColor:'rgba(128,128,128,.15)'
};

function loadSettings() {
    try {
        const r = localStorage.getItem(KEY);
        return r ? {...DEFAULTS, ...JSON.parse(r)} : {...DEFAULTS};
    } catch { return {...DEFAULTS}; }
}

function saveSettings(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

let settings = loadSettings();

// 同步UI到当前设置
const toggleIds = ['bubblesEnabled','bubblesAutoSend','localizationEnabled','autoContinueEnabled',
    'chatQueueEnabled','notifySoundEnabled','notifySystemEnabled','notifyOnComplete',
    'notifyOnAutoContinue','notifyOnQuotaExhaust','notifyOnQueueDone','notifyOnAiQuestion'];

toggleIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!settings[id];
    el.addEventListener('change', () => {
        settings[id] = el.checked;
        // 保存到webview自己的localStorage（虽然隔离，但保持一致性）
        saveSettings(settings);
        // 通过postMessage通知Extension host写入临时文件，让注入的JS能读取
        vscode.postMessage({ command: 'updateSetting', key: id, value: el.checked });
    });
});

function reloadWindow() {
    vscode.postMessage({ command: 'reloadWindow' });
}
</script>
</body>
</html>`;
    }
}

function deactivate() {
    console.log('[WS-Better-Ext] Deactivated');
}

module.exports = { activate, deactivate };
