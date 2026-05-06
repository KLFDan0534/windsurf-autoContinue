/**
 * Windsurf Bubbles v0.1.0
 */
(function () {
	'use strict';
	const VERSION = '0.1.0';
	const LOG_PREFIX = '[WS-Bubbles]';
	const CHAT_ROOT_SELECTOR = '.chat-client-root';
	const BOT_MSG_SELECTOR = '.text-ide-message-block-bot-color';
	const INPUT_CANDIDATES = [
		'div[contenteditable="true"][data-lexical-editor="true"]',
		'div[contenteditable="true"][role="textbox"]',
		'div[contenteditable="true"]',
		'textarea',
	];
	const SEND_BTN_CANDIDATES = [
		'button[data-tooltip-id*="send"]',
		'button[aria-label*="Send"]',
		'button[aria-label*="send"]',
		'button.send-button',
	];
	const DEFAULT_SETTINGS = { bubblesEnabled: true, bubblesAutoSend: true, bubblesTheme: 'emerald', bubblesShape: 'rounded' };
	const STORAGE_KEY = 'ws-bubbles-settings';
	function loadSettings() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? { ...DEFAULT_SETTINGS, ...JSON.parse(r) } : { ...DEFAULT_SETTINGS }; } catch { return { ...DEFAULT_SETTINGS }; } }
	function saveSettings(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }
	let settings = loadSettings();
	const BUBBLE_THEMES = [
		{ id:'emerald',name:'\u7fe1\u7fe0',bg:'linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6)',bgHover:'linear-gradient(135deg,#16a34a,#0891b2,#2563eb)',color:'#fff',shadow:'0 2px 8px rgba(34,197,94,.2)',border:'none',letterBg:'rgba(255,255,255,.2)',letterColor:'#fff',tagBg:'linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6)'},
		{ id:'aurora',name:'\u6781\u5149',bg:'linear-gradient(135deg,#a855f7,#ec4899)',bgHover:'linear-gradient(135deg,#9333ea,#db2777)',color:'#fff',shadow:'0 2px 8px rgba(168,85,247,.2)',border:'none',letterBg:'rgba(255,255,255,.2)',letterColor:'#fff',tagBg:'linear-gradient(135deg,#a855f7,#ec4899)'},
		{ id:'sunset',name:'\u65e5\u843d',bg:'linear-gradient(135deg,#f59e0b,#ef4444)',bgHover:'linear-gradient(135deg,#d97706,#dc2626)',color:'#fff',shadow:'0 2px 8px rgba(245,158,11,.2)',border:'none',letterBg:'rgba(255,255,255,.2)',letterColor:'#fff',tagBg:'linear-gradient(135deg,#f59e0b,#ef4444)'},
		{ id:'ocean',name:'\u6d77\u6d0b',bg:'#1e40af',bgHover:'#1e3a8a',color:'#fff',shadow:'0 2px 8px rgba(30,64,175,.25)',border:'none',letterBg:'rgba(255,255,255,.15)',letterColor:'#fff',tagBg:'#1e40af'},
		{ id:'glass',name:'\u6bdb\u7483\u7490',bg:'rgba(255,255,255,.08)',bgHover:'rgba(255,255,255,.14)',color:'rgba(255,255,255,.8)',shadow:'0 2px 8px rgba(0,0,0,.1)',border:'1px solid rgba(255,255,255,.12)',letterBg:'rgba(255,255,255,.1)',letterColor:'rgba(255,255,255,.6)',tagBg:'rgba(167,139,250,.3)',blur:true},
		{ id:'dark',name:'\u6697\u591c',bg:'#1f2937',bgHover:'#111827',color:'#e5e7eb',shadow:'0 2px 8px rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.08)',letterBg:'rgba(255,255,255,.1)',letterColor:'#9ca3af',tagBg:'#374151'},
	];
	const BUBBLE_SHAPES = [{id:'pill',radius:'20px'},{id:'rounded',radius:'10px'},{id:'soft',radius:'6px'},{id:'sharp',radius:'2px'}];
	const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const ICON_BUBBLES = 'M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M6,14v-2h8v2H6z M14,11H6V9h8V11z M18,8H6V6h12V8z';

	function injectStyles() {
		if (document.getElementById('ws-bubbles-css')) return;
		const style = document.createElement('style');
		style.id = 'ws-bubbles-css';
		style.textContent = `
.ws-bubbles{margin:16px 0 12px;padding:0;background:none;border:none;border-radius:0;animation:wsBubbleFadeIn .35s ease}
@keyframes wsBubbleFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.ws-bubbles-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ws-bubbles-title{font-size:13px;font-weight:600;color:#0ea5e9!important;display:flex;align-items:center;gap:6px}
.ws-bubbles-title svg{width:14px;height:14px;fill:#0ea5e9}
.ws-bubbles-question{font-size:13px;color:#0ea5e9!important;font-weight:500;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.ws-bubbles-mode-tag{font-size:10px;color:#fff;background:linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6);padding:2px 8px;border-radius:10px;margin-left:8px}
.ws-bubble-option{display:flex!important;align-items:center!important;gap:12px!important;padding:10px 14px!important;margin-bottom:6px!important;border-radius:10px!important;cursor:pointer!important;transition:all .2s ease!important;background:linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6)!important;border:none!important;box-shadow:0 2px 8px rgba(34,197,94,.2)}
.ws-bubble-option:hover{background:linear-gradient(135deg,#16a34a,#0891b2,#2563eb)!important;box-shadow:0 4px 12px rgba(34,197,94,.3);transform:translateX(3px)}
.ws-bubble-option-letter{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.2);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
.ws-bubble-option-text{font-size:13px!important;color:#fff!important;font-weight:500!important;flex:1}
.ws-bubbles-chips{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.ws-bubble-chip{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:8px 16px!important;border-radius:10px!important;cursor:pointer!important;font-size:13px!important;font-weight:500!important;font-family:inherit!important;color:#fff!important;background:linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6)!important;border:none!important;transition:all .2s ease!important;box-shadow:0 2px 8px rgba(34,197,94,.2)}
.ws-bubble-chip::before{content:'\\2726';font-size:8px;color:rgba(255,255,255,.8);flex-shrink:0}
.ws-bubble-chip:hover{background:linear-gradient(135deg,#16a34a,#0891b2,#2563eb)!important;color:#fff!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(34,197,94,.3)}
.ws-bubble-related{display:flex!important;align-items:center!important;padding:11px 14px!important;margin-bottom:6px!important;border-radius:10px!important;cursor:pointer!important;font-size:13px!important;font-weight:500!important;font-family:inherit!important;color:#fff!important;background:linear-gradient(135deg,#ca8a04,#22c55e,#06b6d4,#3b82f6)!important;border:none!important;transition:all .2s ease!important;text-align:left!important;width:100%!important;box-shadow:0 2px 8px rgba(34,197,94,.2)}
.ws-bubble-related::before{content:'\\2192';margin-right:10px;color:rgba(255,255,255,.8);font-weight:700;font-size:14px}
.ws-bubble-related:hover{background:linear-gradient(135deg,#ca8a04,#16a34a,#0891b2,#2563eb)!important;box-shadow:0 4px 12px rgba(34,197,94,.3);transform:translateX(3px)}
.ws-bubble-custom-input{flex:1;padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#e5e7eb;font-size:13px;outline:none}
.ws-bubble-custom-input:focus{border-color:rgba(59,130,246,.5)}
.ws-bubble-custom-send{padding:5px 12px;border-radius:6px;border:none;background:linear-gradient(135deg,#7c3aed,#667eea);color:#fff;font-size:12px;cursor:pointer;font-family:inherit}
.ws-bubble-custom-send:hover{filter:brightness(1.15)}
.ws-bubbles-toggle{position:fixed;top:50%;right:16px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#3b82f6);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 12px rgba(34,197,94,.3);z-index:9999;transition:transform .2s}
.ws-bubbles-toggle:hover{transform:translateY(-50%) scale(1.1)}
.ws-bubbles-panel{position:fixed;top:50%;right:56px;transform:translateY(-50%);width:280px;background:#1e1e2e;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.4);color:#e5e7eb;font-size:13px;display:none;overflow:visible}
.ws-bubbles-panel.open{display:block;transform:translateY(-50%)}
.ws-bubbles-panel h3{margin:0 0 12px;font-size:14px;color:#0ea5e9;display:flex;align-items:center;justify-content:space-between}
.ws-bubbles-close{background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer;padding:0 2px;line-height:1}
.ws-bubbles-close:hover{color:#e5e7eb}
.ws-bubbles-panel label{display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer}
.ws-dd{position:relative;width:100%;margin-bottom:8px;box-sizing:border-box}
.ws-dd-btn{width:100%;padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:#2a2a3e;color:#e5e7eb;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;text-align:left;box-sizing:border-box}
.ws-dd-btn:hover{border-color:rgba(255,255,255,.35)}
.ws-dd-btn::after{content:'\u25BE';font-size:10px;color:#9ca3af}
.ws-dd-list{display:none;position:absolute;top:100%;left:0;width:100%;box-sizing:border-box;background:#2a2a3e;border:1px solid rgba(255,255,255,.15);border-radius:6px;margin-top:4px;max-height:200px;overflow-y:auto;z-index:10001;box-shadow:0 4px 16px rgba(0,0,0,.4);scrollbar-width:thin;scrollbar-color:#555 transparent}
.ws-dd-list::-webkit-scrollbar{width:6px}
.ws-dd-list::-webkit-scrollbar-track{background:transparent;border-radius:3px}
.ws-dd-list::-webkit-scrollbar-thumb{background:#555;border-radius:3px}
.ws-dd-list::-webkit-scrollbar-thumb:hover{background:#777}
.ws-dd.open .ws-dd-list{display:block}
.ws-dd-item{padding:6px 10px;color:#e5e7eb;cursor:pointer;font-size:13px}
.ws-dd-item:hover{background:rgba(255,255,255,.1)}
.ws-dd-item.active{background:rgba(14,165,233,.25);color:#0ea5e9}
`;
		document.head.appendChild(style);
	}
	function log(...args){console.log(LOG_PREFIX,...args)}
	function findChatRoot(){
		let root=document.querySelector(CHAT_ROOT_SELECTOR);
		if(root)return root;
		try{for(const f of document.querySelectorAll('iframe')){try{const d=f.contentDocument;if(d){root=d.querySelector(CHAT_ROOT_SELECTOR);if(root)return root}}catch{}}}catch{}
		return null;
	}
	let _cachedInput=null;
	function findInputEl(){
		if(_cachedInput&&_cachedInput.isConnected&&_cachedInput.getBoundingClientRect().width>0)return _cachedInput;
		const scopes=[findChatRoot(),document].filter(Boolean);
		for(const scope of scopes){for(const sel of INPUT_CANDIDATES){const el=scope.querySelector(sel);if(el){_cachedInput=el;return el}}}
		for(const el of document.querySelectorAll('[contenteditable="true"]')){const r=el.getBoundingClientRect();if(r.width>100&&r.bottom>window.innerHeight*0.5){_cachedInput=el;return el}}
		for(const ta of document.querySelectorAll('textarea')){const r=ta.getBoundingClientRect();if(r.width>100&&r.height>20){_cachedInput=ta;return ta}}
		return null;
	}
	function setInputText(text){
		const inputEl=findInputEl();
		if(!inputEl){log('找不到输入框');return false}
		inputEl.focus();
		if(inputEl.getAttribute('data-lexical-editor')==='true'){
			const sel=window.getSelection();if(sel&&inputEl.firstChild){sel.selectAllChildren(inputEl);sel.deleteFromDocument()}
			document.execCommand('insertText',false,text);inputEl.dispatchEvent(new Event('input',{bubbles:true}));log('已写入(Lexical)');return true;
		}
		if(inputEl.contentEditable==='true'){inputEl.textContent='';document.execCommand('insertText',false,text);inputEl.dispatchEvent(new Event('input',{bubbles:true}));log('已写入(contenteditable)');return true}
		if(inputEl.tagName==='TEXTAREA'||inputEl.tagName==='INPUT'){const ns=Object.getOwnPropertyDescriptor(inputEl.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')?.set;if(ns)ns.call(inputEl,text);else inputEl.value=text;inputEl.dispatchEvent(new Event('input',{bubbles:true}));inputEl.dispatchEvent(new Event('change',{bubbles:true}));log('已写入(textarea)');return true}
		inputEl.innerHTML='';text.split('\n').forEach(line=>{const p=document.createElement('p');p.textContent=line||'\u200B';inputEl.appendChild(p)});inputEl.dispatchEvent(new Event('input',{bubbles:true}));log('已写入(fallback)');return true;
	}
	function findSendBtnAdvanced(){
		const root=findChatRoot();const scope=root||document;
		for(const sel of SEND_BTN_CANDIDATES){const el=scope.querySelector(sel);if(el)return el}
		const btns=scope.querySelectorAll('button');
		for(const btn of btns){
			const a=(btn.getAttribute('aria-label')||'').toLowerCase();
			const t=(btn.getAttribute('title')||'').toLowerCase();
			const tt=(btn.getAttribute('data-tooltip-id')||'').toLowerCase();
			const cls=(btn.className||'').toLowerCase();
			if(a.includes('send')||t.includes('send')||tt.includes('send')||a.includes('submit')||t.includes('submit'))return btn;
		}
		const inputEl=findInputEl();
		if(inputEl){
			let container=inputEl.parentElement;
			for(let i=0;i<5&&container;i++){
				const btnsNear=container.querySelectorAll('button');
				for(const btn of btnsNear){
					const svg=btn.querySelector('svg');
					if(svg&&!btn.disabled){
						const paths=svg.querySelectorAll('path');
						if(paths.length<=3){log('找到输入框附近SVG按钮');return btn}
					}
				}
				container=container.parentElement;
			}
		}
		return null;
	}
	function submitBubbleText(text){
		if(!text)return;
		const ok=setInputText(text);
		if(!settings.bubblesAutoSend)return;
		setTimeout(()=>{
			const inputEl=findInputEl();
			if(!inputEl)return;
			inputEl.focus();
			try{inputEl.dispatchEvent(new InputEvent('beforeinput',{inputType:'insertLineBreak',bubbles:true,cancelable:true,composed:true}))}catch{}
			const targets=new Set([inputEl,inputEl.parentElement,inputEl.closest('[role="textbox"]'),document.activeElement].filter(Boolean));
			for(const t of targets){t.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true,composed:true}))}
			setTimeout(()=>{
				const btn=findSendBtnAdvanced();
				if(btn&&!btn.disabled){btn.click();return}
				const scope=findChatRoot()||document;
				for(const b of scope.querySelectorAll('button')){const r=b.getBoundingClientRect();if(r.width>0&&r.height>0&&!b.disabled&&r.bottom>window.innerHeight*0.7){b.click();return}}
			},200);
		},200);
	}
	function renderBubblesCard(data,container){
		const wrapper=document.createElement('div');wrapper.className='ws-bubbles';wrapper.dataset.wsBubblesRendered='1';wrapper.style.cssText='pointer-events:all!important;position:relative;z-index:10;';
		if(data.title||data.type==='clarify'){const header=document.createElement('div');header.className='ws-bubbles-header';const titleEl=document.createElement('div');titleEl.className='ws-bubbles-title';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',ICON_BUBBLES);path.setAttribute('fill','currentColor');svg.appendChild(path);titleEl.appendChild(svg);titleEl.appendChild(document.createTextNode(data.title||'Suggestions'));header.appendChild(titleEl);wrapper.appendChild(header)}
		if(data.type==='clarify'&&data.question){const qEl=document.createElement('div');qEl.className='ws-bubbles-question';qEl.appendChild(document.createTextNode(data.question));const tag=document.createElement('span');tag.className='ws-bubbles-mode-tag';tag.textContent=data.mode==='multi'?'Multi':'Single';qEl.appendChild(tag);wrapper.appendChild(qEl)}
		if(data.type==='clarify'){
			data.items.forEach((item,i)=>{const opt=document.createElement('div');opt.className='ws-bubble-option';const letter=document.createElement('span');letter.className='ws-bubble-option-letter';letter.textContent=LETTERS[i]||String(i+1);const text=document.createElement('span');text.className='ws-bubble-option-text';text.textContent=item;opt.appendChild(letter);opt.appendChild(text);opt.style.pointerEvents='all';opt.addEventListener('click',e=>{e.stopPropagation();e.stopImmediatePropagation();submitBubbleText(LETTERS[i]+'. '+item);wrapper.remove()});opt.addEventListener('mousedown',e=>e.stopPropagation());wrapper.appendChild(opt)});
			const co=document.createElement('div');co.className='ws-bubble-option';const cl=document.createElement('span');cl.className='ws-bubble-option-letter';cl.textContent='\u270F';cl.style.fontSize='13px';const ct=document.createElement('span');ct.className='ws-bubble-option-text';ct.textContent='Custom answer...';ct.style.opacity='0.5';ct.style.fontStyle='italic';co.appendChild(cl);co.appendChild(ct);const cir=document.createElement('div');cir.style.cssText='display:none;gap:6px;align-items:center;margin-top:6px;';const ci=document.createElement('input');ci.type='text';ci.className='ws-bubble-custom-input';ci.placeholder='Type your answer...';ci.style.flex='1';const csb=document.createElement('button');csb.className='ws-bubble-custom-send';csb.textContent='Send';csb.addEventListener('click',()=>{const v=ci.value.trim();if(v){submitBubbleText(v);wrapper.remove()}});ci.addEventListener('keydown',e=>{if(e.key==='Enter')csb.click()});cir.appendChild(ci);cir.appendChild(csb);co.addEventListener('click',e=>{if(e.target===ci||e.target===csb)return;cir.style.display=cir.style.display==='none'?'flex':'none';if(cir.style.display==='flex')setTimeout(()=>ci.focus(),50)});wrapper.appendChild(co);wrapper.appendChild(cir);
		}else if(data.type==='suggest'){
			const chips=document.createElement('div');chips.className='ws-bubbles-chips';data.items.forEach(item=>{const chip=document.createElement('button');chip.className='ws-bubble-chip';chip.style.pointerEvents='all';chip.textContent=item;chip.addEventListener('click',e=>{e.stopPropagation();e.stopImmediatePropagation();submitBubbleText(item);wrapper.remove()});chip.addEventListener('mousedown',e=>e.stopPropagation());chips.appendChild(chip)});wrapper.appendChild(chips);
		}else{
			data.items.forEach(item=>{const b=document.createElement('button');b.className='ws-bubble-related';b.style.pointerEvents='all';b.textContent=item;b.addEventListener('click',e=>{e.stopPropagation();e.stopImmediatePropagation();submitBubbleText(item);wrapper.remove()});b.addEventListener('mousedown',e=>e.stopPropagation());wrapper.appendChild(b)});
		}
		container.appendChild(wrapper);
		const themeId=settings.bubblesTheme||'emerald';const theme=BUBBLE_THEMES.find(t=>t.id===themeId);
		if(theme&&themeId!=='emerald'){const S=(el,p,v)=>el.style.setProperty(p,v,'important');wrapper.querySelectorAll('.ws-bubble-option,.ws-bubble-chip,.ws-bubble-related').forEach(btn=>{S(btn,'background',theme.bg);S(btn,'color',theme.color);S(btn,'box-shadow',theme.shadow);if(theme.border&&theme.border!=='none')S(btn,'border',theme.border);else S(btn,'border','none');if(theme.blur)btn.style.backdropFilter='blur(12px)';btn.addEventListener('mouseenter',()=>S(btn,'background',theme.bgHover));btn.addEventListener('mouseleave',()=>S(btn,'background',theme.bg))});wrapper.querySelectorAll('.ws-bubble-option-letter').forEach(el=>{S(el,'background',theme.letterBg);S(el,'color',theme.letterColor)});wrapper.querySelectorAll('.ws-bubble-option-text').forEach(el=>S(el,'color',theme.color));wrapper.querySelectorAll('.ws-bubbles-mode-tag').forEach(el=>S(el,'background',theme.tagBg||theme.bg));}
		const shapeId=settings.bubblesShape||'rounded';const shape=BUBBLE_SHAPES.find(s=>s.id===shapeId);if(shape){wrapper.querySelectorAll('.ws-bubble-option,.ws-bubble-chip,.ws-bubble-related').forEach(btn=>btn.style.setProperty('border-radius',shape.radius,'important'));wrapper.querySelectorAll('.ws-bubble-option-letter').forEach(el=>{const lr=Math.max(2,parseInt(shape.radius)-2)+'px';el.style.setProperty('border-radius',lr,'important')})}
	}
	function parseBubbleMetaFromText(text,data){const tm=text.match(/\btype:\s*(clarify|suggest|related)/);if(tm)data.type=tm[1];const ti=text.match(/\btitle:\s*(.+?)(?:\s+(?:type|question|mode|items):|$)/);if(ti)data.title=ti[1].trim();const qm=text.match(/\bquestion:\s*(.+?)(?:\s+(?:type|title|mode|items):|$)/);if(qm)data.question=qm[1].trim();const mm=text.match(/\bmode:\s*(single|multi)/);if(mm)data.mode=mm[1]}
	function scanForBubbles(scope){
		if(!settings.bubblesEnabled)return;if(!scope)scope=findChatRoot();if(!scope)return;
		scope.querySelectorAll('p').forEach(p=>{
			if(p.dataset.wsBubblesProcessed)return;const ct=(p.textContent||'').trim();if(!ct.includes(':::bubbles'))return;
			let hasClosing=false,sib=p.nextElementSibling;while(sib){const st=(sib.textContent||'').trim();if(st===':::'||/:{3}\s*$/.test(st)){hasClosing=true;break}sib=sib.nextElementSibling}if(!hasClosing)return;p.dataset.wsBubblesProcessed='1';
			const data={type:'suggest',title:'',question:'',mode:'single',items:[]};const hide=[p];parseBubbleMetaFromText(ct.replace(':::bubbles',''),data);
			sib=p.nextElementSibling;while(sib){const st=(sib.textContent||'').trim();if(st===':::'||/^:{3}\s*$/.test(st)){hide.push(sib);break}hide.push(sib);if(sib.tagName==='UL'||sib.tagName==='OL'){const lis=sib.querySelectorAll('li');lis.forEach((li,idx)=>{let t=(li.textContent||'').trim();if(idx===lis.length-1)t=t.replace(/\s*:{3}\s*$/,'');if(t)data.items.push(t)});const last=lis[lis.length-1];if(last&&(last.textContent||'').trim().endsWith(':::'))break}else if(st.endsWith(':::')){const b=st.slice(0,-3).trim();if(b)parseBubbleMetaFromText(b,data);break}else{if(st.includes(':::bubbles'))break;parseBubbleMetaFromText(st,data)}sib=sib.nextElementSibling}
			if(data.items.length>0){log('检测到气泡:',data.type,data.items.length,'项');const last=hide[hide.length-1];const next=last.nextElementSibling;if(next&&next.dataset.wsBubbleCard)return;hide.forEach(el=>el.style.display='none');const host=document.createElement('div');host.dataset.wsBubbleCard='1';renderBubblesCard(data,host);last.parentElement.insertBefore(host,last.nextSibling)}
		});
	}
	let bubblesObserver=null;
	function startObserving(){if(bubblesObserver){bubblesObserver.disconnect();bubblesObserver=null}if(!settings.bubblesEnabled)return;const scope=findChatRoot();if(!scope){log('聊天根未找到，稍后重试');setTimeout(startObserving,2000);return}log('✅已找到聊天根，开始监听');bubblesObserver=new MutationObserver(()=>{clearTimeout(window._wsBubTimer);window._wsBubTimer=setTimeout(()=>scanForBubbles(scope),500)});bubblesObserver.observe(scope,{childList:true,subtree:true});scanForBubbles(scope)}
	function createSettingsUI(){
		if(document.getElementById('ws-bubbles-toggle'))return;
		const toggle=document.createElement('button');toggle.id='ws-bubbles-toggle';toggle.className='ws-bubbles-toggle';toggle.textContent='\uD83E\uDEE7';toggle.title='Windsurf Bubbles Settings';
		const panel=document.createElement('div');panel.className='ws-bubbles-panel';panel.id='ws-bubbles-panel';
		const title=document.createElement('h3');const titleTxt=document.createElement('span');titleTxt.textContent='\uD83E\uDEE7 \u6c14\u6ce1\u5efa\u8bae v'+VERSION;title.appendChild(titleTxt);const closeBtn=document.createElement('button');closeBtn.className='ws-bubbles-close';closeBtn.textContent='\u2715';closeBtn.addEventListener('click',()=>panel.classList.remove('open'));title.appendChild(closeBtn);panel.appendChild(title);
		const el=document.createElement('label');const ec=document.createElement('input');ec.type='checkbox';ec.checked=settings.bubblesEnabled;ec.addEventListener('change',()=>{settings.bubblesEnabled=ec.checked;saveSettings(settings);if(settings.bubblesEnabled)startObserving();else if(bubblesObserver){bubblesObserver.disconnect();bubblesObserver=null}});el.appendChild(ec);el.appendChild(document.createTextNode(' \u542f\u7528\u6c14\u6ce1'));panel.appendChild(el);
		const al=document.createElement('label');const ac=document.createElement('input');ac.type='checkbox';ac.checked=settings.bubblesAutoSend;ac.addEventListener('change',()=>{settings.bubblesAutoSend=ac.checked;saveSettings(settings)});al.appendChild(ac);al.appendChild(document.createTextNode(' \u70b9\u51fb\u81ea\u52a8\u53d1\u9001'));panel.appendChild(al);
		function mkDropdown(label,items,current,onChange){
			const wrap=document.createElement('div');wrap.style.marginTop='8px';
			const lbl=document.createElement('div');lbl.textContent=label;wrap.appendChild(lbl);
			const dd=document.createElement('div');dd.className='ws-dd';
			const btn=document.createElement('div');btn.className='ws-dd-btn';btn.textContent=(items.find(i=>i.value===current)||items[0]).label;
			const list=document.createElement('div');list.className='ws-dd-list';
			items.forEach(item=>{
				const d=document.createElement('div');d.className='ws-dd-item'+(item.value===current?' active':'');d.textContent=item.label;d.dataset.val=item.value;
				d.addEventListener('click',e=>{e.stopPropagation();btn.textContent=item.label;list.querySelectorAll('.ws-dd-item').forEach(x=>x.classList.remove('active'));d.classList.add('active');dd.classList.remove('open');onChange(item.value)});
				list.appendChild(d);
			});
			btn.addEventListener('click',e=>{e.stopPropagation();dd.classList.toggle('open')});
			document.addEventListener('click',()=>dd.classList.remove('open'));
			dd.appendChild(btn);dd.appendChild(list);wrap.appendChild(dd);return wrap;
		}
		const themeDd=mkDropdown('\u4e3b\u9898:',BUBBLE_THEMES.map(t=>({value:t.id,label:t.name})),settings.bubblesTheme,v=>{settings.bubblesTheme=v;saveSettings(settings)});
		panel.appendChild(themeDd);
		const shapeNames={pill:'\u80f6\u56ca',rounded:'\u5706\u89d2',soft:'\u67d4\u548c',sharp:'\u76f4\u89d2'};
		const shapeDd=mkDropdown('\u5f62\u72b6:',BUBBLE_SHAPES.map(s=>({value:s.id,label:shapeNames[s.id]||s.id})),settings.bubblesShape,v=>{settings.bubblesShape=v;saveSettings(settings)});
		panel.appendChild(shapeDd);
		toggle.addEventListener('click',()=>panel.classList.toggle('open'));document.body.appendChild(toggle);document.body.appendChild(panel);
	}
	function dismissCorruptWarning(){const kw=['corrupt','reinstall','损坏','重新安装'];function tryD(){document.querySelectorAll('.notification-toast,.notifications-toasts .notification-list-item').forEach(t=>{const x=(t.textContent||'').toLowerCase();if(kw.some(k=>x.includes(k))){const c=t.querySelector('.codicon-notifications-clear,.codicon-close,.action-label[title*="Close"],.action-label[title*="关闭"]');if(c){c.click();log('✅关闭损坏通知')}else{t.style.display='none';log('✅隐藏损坏通知')}}})}const obs=new MutationObserver(()=>tryD());obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>obs.disconnect(),30000);setTimeout(tryD,2000)}
	function init(){
		log('🚀 Windsurf Bubbles v'+VERSION+' 初始化');injectStyles();createSettingsUI();dismissCorruptWarning();
		const tryStart=()=>{const root=findChatRoot();if(root){log('✅聊天面板已就绪');startObserving()}else{const obs=new MutationObserver((_,o)=>{const r=findChatRoot();if(r){o.disconnect();log('✅聊天面板已就绪(延迟)');startObserving()}});obs.observe(document.body,{childList:true,subtree:true});log('⏳等待聊天面板...')}};
		if(document.readyState==='complete')setTimeout(tryStart,1000);else window.addEventListener('load',()=>setTimeout(tryStart,1000));
	}
	init();
})();
