"use strict";(()=>{var Q="/api/v1",ne={default:{name:"Og\xF3lne",icon:"\u{1F4AC}"},ksef:{name:"KSeF",icon:"\u{1F4C4}"},b2b:{name:"B2B",icon:"\u{1F4BC}"},zus:{name:"ZUS",icon:"\u{1F3E5}"},vat:{name:"VAT",icon:"\u{1F4B0}"}};function ie(){let n=document.querySelectorAll(".channel-item");n.length&&n.forEach(s=>{s.addEventListener("click",()=>{let e=s.dataset.module;e&&(n.forEach(t=>t.classList.remove("active")),s.classList.add("active"),P(e))})})}var r={messages:document.getElementById("messages"),form:document.getElementById("chat-form"),input:document.getElementById("user-input"),sendBtn:document.getElementById("send-btn"),status:document.getElementById("status"),statusText:document.querySelector(".status-text"),currentModule:document.getElementById("current-module"),charCount:document.getElementById("char-count"),sourcesPanel:document.getElementById("sources-panel"),sourcesList:document.getElementById("sources-list"),closeSources:document.getElementById("close-sources"),quickQuestions:document.getElementById("quick-questions")},B="default",I=!1,D=[];function J(){!r.form||!r.input||!r.messages||(oe(),ie(),ae(),de(),ue(),G(),r.input.focus())}function oe(){document.querySelectorAll(".module-btn").forEach(s=>{let e=s.dataset.module;e&&s.addEventListener("click",()=>{P(e)})})}function ae(){let{form:n,input:s,charCount:e}=r;!n||!s||(n.addEventListener("submit",async t=>{t.preventDefault();let i=s.value.trim();!i||I||await re(i)}),s.addEventListener("input",()=>{if(!e)return;let t=s.value.length;e.textContent=`${t}/2000`}),s.addEventListener("keydown",t=>{let i=t;i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),n.dispatchEvent(new Event("submit")))}))}async function re(n){I=!0,W(!0),r.quickQuestions&&(r.quickQuestions.style.display="none"),b(n,"user"),r.input&&r.charCount&&(r.input.value="",r.charCount.textContent="0/2000");let s=b("","assistant",!0);try{let e=await fetch(`${Q}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:n,module:B})});if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();K(s),b(t.response,"assistant",!1,t.sources||[]),D=t.sources||[]}catch(e){console.error("Error:",e),K(s),b("Przepraszam, wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia. Sprawd\u017A czy serwisy dzia\u0142aj\u0105 (docker compose ps) i spr\xF3buj ponownie.","assistant")}finally{I=!1,W(!1),r.input?.focus()}}function b(n,s,e=!1,t){let i=`msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;if(!r.messages)return i;let o=document.createElement("div");o.id=i,o.className=`message ${s}${e?" loading":""}`;let a=s==="user"?"\u{1F464}":"\u{1F985}",c=ce(n);return t&&t.length>0&&(c+=`
            <div class="sources-link" onclick="showSources()">
                \u{1F4DA} Zobacz \u017Ar\xF3d\u0142a (${t.length})
            </div>
        `),o.innerHTML=`
        <div class="message-avatar">${a}</div>
        <div class="message-content">${c}</div>
    `,r.messages.appendChild(o),le(),i}function K(n){let s=document.getElementById(n);s&&s.remove()}function ce(n){if(!n)return"";let s=n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return s=s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),s=s.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),s=s.replace(/`(.+?)`/g,"<code>$1</code>"),s=s.replace(/\n\n/g,"</p><p>"),s=s.replace(/\n/g,"<br>"),s.startsWith("<p>")||(s=`<p>${s}</p>`),s}function le(){r.messages&&(r.messages.scrollTop=r.messages.scrollHeight)}function W(n){r.sendBtn&&(r.sendBtn.disabled=n),r.input&&(r.input.disabled=n)}function de(){let n=document.querySelectorAll(".quick-btn");n.length&&n.forEach(s=>{s.addEventListener("click",()=>{let e=s.dataset.question||"",t=s.dataset.module;t&&t!==B&&P(t),r.input&&(r.input.value=e,r.form?.dispatchEvent(new Event("submit")))})})}function ue(){r.closeSources&&r.closeSources.addEventListener("click",V),document.addEventListener("click",n=>{if(!r.sourcesPanel)return;let s=n.target;if(!s)return;let e=r.sourcesPanel.contains(s),t=s.classList.contains("sources-link");!e&&!t&&V()})}function pe(){!r.sourcesPanel||!r.sourcesList||D.length&&(r.sourcesList.innerHTML=D.map(n=>`
        <li>
            <div class="source-title">${Z(n.title)}</div>
            <div class="source-meta">
                ${Z(n.source)}
                <span class="source-similarity">${Math.round(n.similarity*100)}%</span>
            </div>
        </li>
    `).join(""),r.sourcesPanel.classList.remove("hidden"),r.sourcesPanel.classList.add("visible"))}function V(){r.sourcesPanel&&(r.sourcesPanel.classList.remove("visible"),setTimeout(()=>{r.sourcesPanel&&r.sourcesPanel.classList.add("hidden")},300))}async function G(){try{let n=Q.replace("/api/v1",""),e=await(await fetch(`${n}/health`)).json();if(!r.status||!r.statusText)return;e.status==="healthy"?(r.status.classList.add("healthy"),r.status.classList.remove("unhealthy"),r.statusText.textContent="Po\u0142\u0105czono z Bielikiem"):e.status==="degraded"?(r.statusText.textContent="Cz\u0119\u015Bciowo dost\u0119pny",e.services?.model==="not_loaded"&&(r.statusText.textContent="\u0141adowanie modelu...")):(r.status.classList.add("unhealthy"),r.statusText.textContent="B\u0142\u0105d po\u0142\u0105czenia")}catch(n){console.error("Health check failed:",n),r.status&&r.statusText&&(r.status.classList.add("unhealthy"),r.statusText.textContent="Brak po\u0142\u0105czenia")}finally{setTimeout(()=>{G()},3e4)}}function P(n){if(B=n,document.querySelectorAll(".module-btn").forEach(e=>{e.classList.toggle("active",e.dataset.module===n)}),r.currentModule){let e=ne[n];r.currentModule.textContent=`Modu\u0142: ${e.name}`}b({default:"Zadaj dowolne pytanie dotycz\u0105ce prowadzenia firmy w Polsce.",ksef:"Pytaj o Krajowy System e-Faktur: terminy wdro\u017Cenia, wymagania techniczne, procedury.",b2b:"Pomog\u0119 oceni\u0107 ryzyko Twojej umowy B2B wed\u0142ug kryteri\xF3w Inspekcji Pracy.",zus:"Oblicz\u0119 sk\u0142adki ZUS i wyja\u015Bni\u0119 zasady ubezpiecze\u0144 dla przedsi\u0119biorc\xF3w.",vat:"Pomog\u0119 z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi."}[n],"assistant"),r.input?.focus()}function Z(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}typeof window<"u"&&(window.showSources=pe,window.setModule=P);var w="/api/v1",v=null;function f(){return{documentsList:document.getElementById("documents-list"),documentsRefresh:document.getElementById("documents-refresh"),docTitle:document.getElementById("doc-title"),docCategory:document.getElementById("doc-category"),docContent:document.getElementById("doc-content"),docNew:document.getElementById("doc-new"),docDelete:document.getElementById("doc-delete"),docSave:document.getElementById("doc-save"),documentEvents:document.getElementById("document-events")}}function F(){let n=f();n.documentsList&&(n.documentsRefresh?.addEventListener("click",H),n.docNew?.addEventListener("click",()=>{v=null,X()}),n.docSave?.addEventListener("click",ge),n.docDelete?.addEventListener("click",ye),H())}async function H(){if(f().documentsList)try{let s=await fetch(`${w.replace("/api/v1","")}/api/v1/documents?limit=50`);if(!s.ok)throw new Error(`HTTP ${s.status}`);let e=await s.json();me(e||[])}catch(s){console.error("Nie uda\u0142o si\u0119 pobra\u0107 dokument\xF3w:",s)}}function me(n){let s=f();s.documentsList&&(s.documentsList.innerHTML="",n.forEach(e=>{let t=document.createElement("li");t.className="document-item",t.dataset.id=String(e.id),t.textContent=`${e.title} (${e.category})`,t.addEventListener("click",()=>{he(e,t)}),s.documentsList.appendChild(t)}))}function he(n,s){v=n.id,document.querySelectorAll(".document-item").forEach(t=>t.classList.remove("active")),s&&s.classList.add("active");let e=f();e.docTitle&&(e.docTitle.value=n.title||""),e.docCategory&&(e.docCategory.value=n.category||""),e.docContent&&(e.docContent.value=n.content||""),ve(n.id)}function X(){document.querySelectorAll(".document-item").forEach(s=>s.classList.remove("active"));let n=f();n.docTitle&&(n.docTitle.value=""),n.docCategory&&(n.docCategory.value=""),n.docContent&&(n.docContent.value=""),n.documentEvents&&(n.documentEvents.innerHTML="")}async function ve(n){if(f().documentEvents)try{let e=await fetch(`${w}/events/documents/${n}`);if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();fe(t||[])}catch(e){console.error("Nie uda\u0142o si\u0119 pobra\u0107 historii dokumentu:",e)}}function fe(n){let s=f();s.documentEvents&&(s.documentEvents.innerHTML=n.map(e=>{let t=e.created_at||e.createdAt,i=t?new Date(t).toLocaleString("pl-PL"):"",o=e.event_type||e.eventType||"";return`<li>[${i}] ${Ee(o)}</li>`}).join(""))}async function ge(){let n=f();if(!n.docTitle||!n.docCategory||!n.docContent)return;let s=n.docTitle.value.trim(),e=n.docCategory.value.trim()||"default",t=n.docContent.value.trim();if(!s||!t){alert("Tytu\u0142 i tre\u015B\u0107 dokumentu nie mog\u0105 by\u0107 puste.");return}let i={title:s,category:e,content:t,source:null};try{let o,a;v?(o=`${w}/commands/documents/update`,a={id:v,title:s,source:null,category:e,content:t}):(o=`${w}/commands/documents/create`,a=i);let c=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!c.ok)throw new Error(`HTTP ${c.status}`);v=(await c.json()).id,await H()}catch(o){console.error("Nie uda\u0142o si\u0119 zapisa\u0107 dokumentu:",o),alert("Nie uda\u0142o si\u0119 zapisa\u0107 dokumentu. Sprawd\u017A logi API.")}}async function ye(){if(v&&confirm("Na pewno usun\u0105\u0107 ten dokument?"))try{let n=await fetch(`${w}/commands/documents/delete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:v})});if(!n.ok)throw new Error(`HTTP ${n.status}`);v=null,X(),await H()}catch(n){console.error("Nie uda\u0142o si\u0119 usun\u0105\u0107 dokumentu:",n),alert("Nie uda\u0142o si\u0119 usun\u0105\u0107 dokumentu.")}}function Ee(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}var S="/api/v1",x=null,L=null,$=null;function j(){return{projectsList:document.getElementById("projects-list"),filesList:document.getElementById("files-list")}}function q(){let n=j();if(!n.projectsList||!n.filesList)return;let s=document.querySelectorAll(".contact-item");s.forEach(e=>{e.addEventListener("click",()=>{s.forEach(t=>t.classList.remove("active")),e.classList.add("active"),$=e.textContent?.trim()||null,Y()})}),Y()}async function Y(){if(j().projectsList)try{let s=`${S}/projects?limit=50`;if($){let i=encodeURIComponent($);s=`${S}/projects?contact=${i}&limit=50`}let e=await fetch(s);if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();be(t||[])}catch(s){console.error("Nie uda\u0142o si\u0119 pobra\u0107 projekt\xF3w:",s)}}function be(n){let s=j();!s.projectsList||!s.filesList||(s.projectsList.innerHTML="",x=null,L=null,s.filesList.innerHTML="",n.forEach(e=>{let t=document.createElement("li");t.className="project-item",t.dataset.projectId=String(e.id);let i=e.name||`Projekt ${e.id}`,o=je(i);t.innerHTML=`<span class="project-icon">${o}</span> ${te(i)}`,t.addEventListener("click",()=>{document.querySelectorAll(".project-item").forEach(a=>a.classList.remove("active")),t.classList.add("active"),x=e.id,we(e.id),ee()}),s.projectsList.appendChild(t)}))}async function we(n){if(j().filesList)try{let e=await fetch(`${S}/projects/${n}/files`);if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();Le(t||[])}catch(e){console.error("Nie uda\u0142o si\u0119 pobra\u0107 plik\xF3w projektu:",e)}}function Le(n){let s=j();s.filesList&&(s.filesList.innerHTML="",L=null,n.forEach(e=>{let t=document.createElement("li");t.className="file-item",t.dataset.fileId=String(e.id);let i=$e(e.filename||"");t.innerHTML=`${i} ${te(e.filename||"")}`,t.addEventListener("click",()=>{document.querySelectorAll(".file-item").forEach(o=>o.classList.remove("active")),t.classList.add("active"),L=e.id,ee()}),s.filesList.appendChild(t)}))}function $e(n){let s=n.split(".").pop()?.toLowerCase()||"";return{pdf:"\u{1F4D1}",doc:"\u{1F4DD}",docx:"\u{1F4DD}",xls:"\u{1F4CA}",xlsx:"\u{1F4CA}",txt:"\u{1F4C4}",png:"\u{1F5BC}\uFE0F",jpg:"\u{1F5BC}\uFE0F",jpeg:"\u{1F5BC}\uFE0F",gif:"\u{1F5BC}\uFE0F",zip:"\u{1F4E6}",rar:"\u{1F4E6}"}[s]||"\u{1F4C4}"}function je(n){let s=(n||"").toLowerCase();return s.includes("ksef")||s.includes("faktur")?"\u{1F4CB}":s.includes("b2b")||s.includes("umowa")||s.includes("kontrakt")?"\u{1F4BC}":s.includes("zus")||s.includes("sk\u0142adk")?"\u{1F3E5}":s.includes("vat")||s.includes("jpk")?"\u{1F4B0}":"\u{1F4C1}"}async function ee(){try{let n=new URLSearchParams;if($&&n.append("contact",$),x!=null&&n.append("project_id",String(x)),L!=null&&n.append("file_id",String(L)),![...n.keys()].length){A();return}let s=await fetch(`${S}/context/channels?${n.toString()}`);if(!s.ok)throw new Error(`HTTP ${s.status}`);let t=(await s.json()).channels||[];if(t.length===0){A();return}let i=t[0];i?.id&&window.setModule&&window.setModule(i.id);let o=new Set(t.map(a=>a.id));document.querySelectorAll(".channel-item").forEach(a=>{let c=a.dataset.module;c&&a.classList.toggle("recommended",o.has(c))})}catch(n){console.error("Nie uda\u0142o si\u0119 pobra\u0107 kana\u0142\xF3w kontekstowych:",n),A()}}function A(){window.setModule&&window.setModule("default"),document.querySelectorAll(".channel-item").forEach(n=>{let s=n.dataset.module;s&&(n.classList.remove("recommended"),n.classList.toggle("active",s==="default"))})}function te(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}var se="/api/v1",m=!1,p=null;function z(){return{panelLeft:document.getElementById("panel-left"),panelRight:document.getElementById("panel-right"),editToggle:document.getElementById("edit-dashboard-toggle")}}async function U(){document.querySelectorAll(".dashboard-module").forEach(s=>{s.classList.add("no-drag")});try{let s=await fetch(`${se}/layout`);if(s.ok){let e=await s.json();e&&Array.isArray(e.modules)&&ke(e.modules)}}catch(s){console.error("Nie uda\u0142o si\u0119 pobra\u0107 uk\u0142adu dashboardu:",s)}Me(),xe()}function ke(n){let s={};document.querySelectorAll(".dashboard-module").forEach(o=>{let a=o.dataset.moduleId;a&&(s[a]=o)});let{panelLeft:e,panelRight:t}=z();if(!e||!t)return;e.innerHTML="",t.innerHTML="";let i={left:e,right:t};n.slice().sort((o,a)=>(o.order||0)-(a.order||0)).forEach(o=>{let a=s[o.id],c=i[o.column]||e;a&&c&&c.appendChild(a)}),Object.keys(s).forEach(o=>{let a=s[o];a&&!a.parentElement&&e.appendChild(a)})}function Me(){document.querySelectorAll(".dashboard-module").forEach(t=>{t.addEventListener("dragstart",Ce),t.addEventListener("dragend",Te)});let{panelLeft:s,panelRight:e}=z();[s,e].forEach(t=>{t&&(t.addEventListener("dragover",Pe),t.addEventListener("drop",He))})}function Ce(n){if(!m){n.preventDefault();return}let s=n.currentTarget;s&&(p=s,n.dataTransfer&&(n.dataTransfer.effectAllowed="move"),p.classList.add("dragging"))}function Te(){p&&(p.classList.remove("dragging"),p=null)}function Pe(n){m&&n.preventDefault()}function He(n){if(!m||(n.preventDefault(),!p))return;let s=n.currentTarget;if(!s)return;let e=n.target?.closest(".dashboard-module");e&&e!==p&&e.parentElement===s?s.insertBefore(p,e):s.appendChild(p),p.classList.remove("dragging"),p=null,Se()}function Se(){let{panelLeft:n,panelRight:s}=z();if(!n||!s)return;let e={modules:[]};[["left",n],["right",s]].forEach(([i,o])=>{o.querySelectorAll(".dashboard-module").forEach((c,h)=>{let y=c.dataset.moduleId;y&&e.modules.push({id:y,column:i,order:h})})}),fetch(`${se}/layout`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).catch(i=>{console.error("Nie uda\u0142o si\u0119 zapisa\u0107 uk\u0142adu dashboardu:",i)})}function xe(){let{editToggle:n}=z();n&&n.addEventListener("click",()=>{m=!m,n.classList.toggle("active",m),n.setAttribute("aria-pressed",String(m)),document.body.classList.toggle("dashboard-edit",m),document.querySelectorAll(".dashboard-module").forEach(e=>{m?(e.classList.remove("no-drag"),e.setAttribute("draggable","true")):(e.classList.add("no-drag"),e.removeAttribute("draggable"))})})}var u=class{constructor(s){this.mounted=!1;this.config=s,this.container=typeof s.container=="string"?document.querySelector(s.container):s.container}mount(){if(!this.container){console.warn("Container not found for component");return}this.container.innerHTML=this.render(),this.mounted=!0,this.afterMount(),this.bindEvents()}afterMount(){}bindEvents(){}$(s){return this.container?.querySelector(s)||null}$$(s){return this.container?.querySelectorAll(s)||document.querySelectorAll("__none__")}destroy(){this.container&&(this.container.innerHTML=""),this.mounted=!1}},_=class{constructor(){this.events=new Map}on(s,e){this.events.has(s)||this.events.set(s,[]),this.events.get(s).push(e)}off(s,e){let t=this.events.get(s);if(t){let i=t.indexOf(e);i>-1&&t.splice(i,1)}}emit(s,...e){let t=this.events.get(s);t&&t.forEach(i=>i(...e))}},d=new _,R=class n{constructor(s="/api/v1"){this.baseUrl=s}static getInstance(){return n.instance||(n.instance=new n),n.instance}async get(s){let e=await fetch(`${this.baseUrl}${s}`);if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}async post(s,e){let t=await fetch(`${this.baseUrl}${s}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP ${t.status}`);return t.json()}async delete(s){let e=await fetch(`${this.baseUrl}${s}`,{method:"DELETE"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}getBaseUrl(){return this.baseUrl.replace("/api/v1","")}},l=R.getInstance();var k=class extends u{constructor(){super(...arguments);this.status="checking";this.statusMessage="Sprawdzam po\u0142\u0105czenie..."}render(){return`
      <header class="header">
        <div class="logo">
          <h1 class="detax-logo">
            <span class="de">de</span><span class="tax">tax</span>
          </h1>
        </div>
        <p class="tagline">Odetchnij od podatk\xF3w</p>
        <div class="status ${this.status}" id="app-status">
          <span class="status-dot"></span>
          <span class="status-text">${this.statusMessage}</span>
        </div>
      </header>
    `}async afterMount(){await this.checkHealth()}async checkHealth(){try{let e=l.getBaseUrl(),i=await(await fetch(`${e}/health`)).json();this.status=i.status,i.status==="healthy"?this.statusMessage="Po\u0142\u0105czono z Bielikiem":i.status==="degraded"?this.statusMessage=i.services?.model==="not_loaded"?"\u0141adowanie modelu...":"Cz\u0119\u015Bciowo dost\u0119pny":this.statusMessage="B\u0142\u0105d po\u0142\u0105czenia"}catch{this.status="unhealthy",this.statusMessage="Brak po\u0142\u0105czenia"}this.updateStatus(),setTimeout(()=>this.checkHealth(),3e4)}updateStatus(){let e=this.$("#app-status"),t=this.$(".status-text");e&&(e.className=`status ${this.status}`),t&&(t.textContent=this.statusMessage)}};var M={default:{name:"Og\xF3lne",icon:"\u{1F4AC}",hint:"Zadaj dowolne pytanie dotycz\u0105ce prowadzenia firmy w Polsce."},ksef:{name:"KSeF",icon:"\u{1F4C4}",hint:"Pytaj o Krajowy System e-Faktur: terminy wdro\u017Cenia, wymagania techniczne, procedury."},b2b:{name:"B2B",icon:"\u{1F4BC}",hint:"Pomog\u0119 oceni\u0107 ryzyko Twojej umowy B2B wed\u0142ug kryteri\xF3w Inspekcji Pracy."},zus:{name:"ZUS",icon:"\u{1F3E5}",hint:"Oblicz\u0119 sk\u0142adki ZUS i wyja\u015Bni\u0119 zasady ubezpiecze\u0144 dla przedsi\u0119biorc\xF3w."},vat:{name:"VAT",icon:"\u{1F4B0}",hint:"Pomog\u0119 z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi."}},ze=[{question:"Kiedy KSeF b\u0119dzie obowi\u0105zkowy?",module:"ksef",label:"KSeF"},{question:"Jak oceni\u0107 czy moja umowa B2B jest bezpieczna?",module:"b2b",label:"B2B"},{question:"Ile wynosi sk\u0142adka zdrowotna na rycza\u0142cie w 2025?",module:"zus",label:"ZUS"},{question:"Co to jest VAT OSS i kiedy go stosowa\u0107?",module:"vat",label:"VAT"}],C=class extends u{constructor(){super(...arguments);this.currentModule="default";this.isLoading=!1;this.lastSources=[];this.showQuickQuestions=!0}render(){return`
      <div class="chat-panel-component">
        <div class="chat-channels">
          <h4>\u{1F4E2} Kana\u0142y</h4>
          <ul class="channels-list">
            ${Object.entries(M).map(([e,t])=>`
              <li class="channel-item ${e===this.currentModule?"active":""}" 
                  data-module="${e}">
                <span class="channel-icon">${t.icon}</span>
                <span class="channel-name"># ${t.name.toLowerCase()}</span>
              </li>
            `).join("")}
          </ul>
        </div>

        <main class="chat-container">
          <div id="chat-messages" class="messages">
            ${this.renderWelcomeMessage()}
          </div>

          <div class="quick-questions ${this.showQuickQuestions?"":"hidden"}" id="quick-questions">
            <span class="quick-label">Szybkie pytania:</span>
            <div class="quick-btns">
              ${ze.map(e=>`
                <button class="quick-btn" data-question="${e.question}" data-module="${e.module}">
                  ${e.label}
                </button>
              `).join("")}
            </div>
          </div>

          <form id="chat-form" class="input-area">
            <div class="input-wrapper">
              <input 
                type="text" 
                id="chat-input" 
                placeholder="Zadaj pytanie..." 
                autocomplete="off"
                maxlength="2000"
              >
              <button type="submit" id="send-btn" ${this.isLoading?"disabled":""}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div class="input-hints">
              <span class="current-module" id="current-module">Modu\u0142: ${M[this.currentModule].name}</span>
              <span class="char-count" id="char-count">0/2000</span>
            </div>
          </form>
        </main>

        <aside id="sources-panel" class="sources-panel hidden">
          <div class="sources-header">
            <h3>\u{1F4DA} \u0179r\xF3d\u0142a</h3>
            <button class="close-btn" id="close-sources">\xD7</button>
          </div>
          <ul id="sources-list" class="sources-list"></ul>
        </aside>
      </div>
    `}renderWelcomeMessage(){return`
      <div class="message assistant">
        <div class="message-avatar">\u{1F985}</div>
        <div class="message-content">
          <p>Cze\u015B\u0107! Jestem <strong>Bielikiem</strong> - polskim asystentem AI dla przedsi\u0119biorc\xF3w.</p>
          <p>Mog\u0119 pom\xF3c Ci z:</p>
          <ul>
            <li><strong>KSeF</strong> - terminy, wymagania, procedury e-faktur</li>
            <li><strong>B2B</strong> - ryzyko przekwalifikowania umowy na etat</li>
            <li><strong>ZUS</strong> - sk\u0142adki, ubezpieczenia, obliczenia</li>
            <li><strong>VAT</strong> - JPK, VAT OSS, rozliczenia</li>
          </ul>
          <p>Wybierz kana\u0142 po lewej i zadaj pytanie!</p>
        </div>
      </div>
    `}afterMount(){d.on("channel:selected",e=>{e in M&&this.setModule(e)})}bindEvents(){this.$$(".channel-item").forEach(a=>{a.addEventListener("click",()=>{let c=a.dataset.module;c&&this.setModule(c)})});let e=this.$("#chat-form"),t=this.$("#chat-input"),i=this.$("#char-count");e?.addEventListener("submit",async a=>{a.preventDefault();let c=t?.value.trim();c&&!this.isLoading&&await this.sendMessage(c)}),t?.addEventListener("input",()=>{i&&(i.textContent=`${t.value.length}/2000`)}),t?.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),e?.dispatchEvent(new Event("submit")))}),this.$$(".quick-btn").forEach(a=>{a.addEventListener("click",()=>{let c=a.dataset.question,h=a.dataset.module;h&&h!==this.currentModule&&this.setModule(h),c&&t&&(t.value=c,e?.dispatchEvent(new Event("submit")))})}),this.$("#close-sources")?.addEventListener("click",()=>this.hideSources()),t?.focus()}setModule(e){this.currentModule=e,this.$$(".channel-item").forEach(i=>{i.classList.toggle("active",i.dataset.module===e)});let t=this.$("#current-module");t&&(t.textContent=`Modu\u0142: ${M[e].name}`),this.addMessage(M[e].hint,"assistant"),this.$("#chat-input")?.focus()}async sendMessage(e){this.isLoading=!0,this.setLoadingState(!0);let t=this.$("#quick-questions");t&&t.classList.add("hidden"),this.showQuickQuestions=!1,this.addMessage(e,"user");let i=this.$("#chat-input"),o=this.$("#char-count");i&&(i.value=""),o&&(o.textContent="0/2000");let a=this.addMessage("","assistant",!0);try{let c=await l.post("/chat",{message:e,module:this.currentModule});this.removeMessage(a),this.addMessage(c.response,"assistant",!1,c.sources),this.lastSources=c.sources||[]}catch(c){console.error("Chat error:",c),this.removeMessage(a),this.addMessage("Przepraszam, wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia. Sprawd\u017A czy serwisy dzia\u0142aj\u0105 i spr\xF3buj ponownie.","assistant")}finally{this.isLoading=!1,this.setLoadingState(!1),i?.focus()}}addMessage(e,t,i=!1,o){let a=`msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,c=this.$("#chat-messages");if(!c)return a;let h=t==="user"?"\u{1F464}":"\u{1F985}",y=this.formatMessage(e);o&&o.length>0&&(y+=`
        <div class="sources-link" data-action="show-sources">
          \u{1F4DA} Zobacz \u017Ar\xF3d\u0142a (${o.length})
        </div>
      `);let E=document.createElement("div");return E.id=a,E.className=`message ${t}${i?" loading":""}`,E.innerHTML=`
      <div class="message-avatar">${h}</div>
      <div class="message-content">${y}</div>
    `,E.querySelector('[data-action="show-sources"]')?.addEventListener("click",()=>this.showSources()),c.appendChild(E),c.scrollTop=c.scrollHeight,a}removeMessage(e){document.getElementById(e)?.remove()}formatMessage(e){if(!e)return'<div class="typing-indicator"><span></span><span></span><span></span></div>';let t=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n\n/g,"</p><p>"),t=t.replace(/\n/g,"<br>"),!t.startsWith("<p>")&&!t.startsWith("<div")&&(t=`<p>${t}</p>`),t}setLoadingState(e){let t=this.$("#send-btn"),i=this.$("#chat-input");t&&(t.disabled=e),i&&(i.disabled=e)}showSources(){let e=this.$("#sources-panel"),t=this.$("#sources-list");!e||!t||!this.lastSources.length||(t.innerHTML=this.lastSources.map(i=>`
      <li>
        <div class="source-title">${this.escapeHtml(i.title)}</div>
        <div class="source-meta">
          ${i.source?this.escapeHtml(i.source):"Brak \u017Ar\xF3d\u0142a"}
          <span class="source-similarity">${Math.round(i.similarity*100)}%</span>
        </div>
      </li>
    `).join(""),e.classList.remove("hidden"),e.classList.add("visible"))}hideSources(){let e=this.$("#sources-panel");e&&(e.classList.remove("visible"),setTimeout(()=>e.classList.add("hidden"),300))}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}};var T=class extends u{constructor(){super(...arguments);this.contacts=[];this.state={selectedContact:null,selectedProject:null,selectedFile:null,recommendedChannels:[]}}render(){return`
      <div class="context-panel">
        <div class="context-section contacts-section">
          <h3>\u{1F465} Kontakty</h3>
          <ul class="contacts-list" id="context-contacts">
            ${this.renderContacts()}
          </ul>
        </div>

        <div class="context-section projects-section">
          <h3>\u{1F4C1} Projekty</h3>
          <ul class="projects-list" id="context-projects">
            ${this.renderProjects()}
          </ul>
        </div>

        <div class="context-section files-section">
          <h3>\u{1F4C4} Pliki</h3>
          <ul class="files-list" id="context-files">
            ${this.renderFiles()}
          </ul>
        </div>

        <div class="context-section channels-section">
          <h3>\u{1F4E2} Rekomendowane kana\u0142y</h3>
          <ul class="channels-list" id="context-channels">
            ${this.renderChannels()}
          </ul>
        </div>

        <div class="context-summary" id="context-summary">
          ${this.renderSummary()}
        </div>
      </div>
    `}renderContacts(){return this.contacts.length?this.contacts.map(e=>`
      <li class="contact-item ${this.state.selectedContact===e.name?"active":""}" 
          data-contact="${this.escapeHtml(e.name)}">
        <span class="contact-icon">\u{1F464}</span>
        <span class="contact-name">${this.escapeHtml(e.name)}</span>
        <span class="contact-count">${e.projects.length}</span>
      </li>
    `).join(""):'<li class="empty">\u0141adowanie...</li>'}renderProjects(){if(!this.state.selectedContact)return'<li class="empty">Wybierz kontakt</li>';let e=this.contacts.find(t=>t.name===this.state.selectedContact);return!e||!e.projects.length?'<li class="empty">Brak projekt\xF3w</li>':e.projects.map(t=>`
      <li class="project-item ${this.state.selectedProject?.id===t.id?"active":""}"
          data-project-id="${t.id}">
        <span class="project-icon">\u{1F4CB}</span>
        <div class="project-info">
          <span class="project-name">${this.escapeHtml(t.name)}</span>
          <span class="project-desc">${this.escapeHtml(t.description||"")}</span>
        </div>
        <span class="project-files-count">${t.files.length} plik\xF3w</span>
      </li>
    `).join("")}renderFiles(){return this.state.selectedProject?this.state.selectedProject.files.length?this.state.selectedProject.files.map(e=>`
      <li class="file-item ${this.state.selectedFile?.id===e.id?"active":""}"
          data-file-id="${e.id}">
        <span class="file-icon">${this.getFileIcon(e.filename)}</span>
        <span class="file-name">${this.escapeHtml(e.filename)}</span>
      </li>
    `).join(""):'<li class="empty">Brak plik\xF3w</li>':'<li class="empty">Wybierz projekt</li>'}renderChannels(){return this.state.recommendedChannels.length?this.state.recommendedChannels.map(e=>`
      <li class="channel-item" data-channel="${e.id}">
        <span class="channel-hash">#</span>
        <span class="channel-name">${this.escapeHtml(e.name)}</span>
      </li>
    `).join(""):'<li class="empty">Wybierz kontekst, aby zobaczy\u0107 kana\u0142y</li>'}renderSummary(){let e=[];return this.state.selectedContact&&e.push(`\u{1F464} ${this.state.selectedContact}`),this.state.selectedProject&&e.push(`\u{1F4C1} ${this.state.selectedProject.name}`),this.state.selectedFile&&e.push(`\u{1F4C4} ${this.state.selectedFile.filename}`),e.length?`
      <div class="summary-path">${e.join(" \u2192 ")}</div>
      <button class="clear-context-btn" id="clear-context">Wyczy\u015B\u0107</button>
    `:'<span class="summary-empty">Wybierz kontekst do rozmowy z Bielikiem</span>'}getFileIcon(e){let t=e.split(".").pop()?.toLowerCase();return{pdf:"\u{1F4D5}",doc:"\u{1F4D8}",docx:"\u{1F4D8}",xls:"\u{1F4D7}",xlsx:"\u{1F4D7}",txt:"\u{1F4C4}",jpg:"\u{1F5BC}\uFE0F",png:"\u{1F5BC}\uFE0F"}[t||""]||"\u{1F4C4}"}async afterMount(){await this.loadHierarchy()}async loadHierarchy(){try{let e=await l.get("/context/hierarchy");this.contacts=e.contacts,this.updateUI()}catch(e){console.error("Error loading context hierarchy:",e)}}async loadChannels(){try{let e=new URLSearchParams;this.state.selectedContact&&e.set("contact",this.state.selectedContact),this.state.selectedProject&&e.set("project_id",String(this.state.selectedProject.id)),this.state.selectedFile&&e.set("file_id",String(this.state.selectedFile.id));let t=await l.get(`/context/channels?${e}`);this.state.recommendedChannels=t.channels,this.updateChannelsUI(),d.emit("context:changed",this.state)}catch(e){console.error("Error loading channels:",e)}}updateUI(){let e=this.$("#context-contacts"),t=this.$("#context-projects"),i=this.$("#context-files"),o=this.$("#context-summary");e&&(e.innerHTML=this.renderContacts()),t&&(t.innerHTML=this.renderProjects()),i&&(i.innerHTML=this.renderFiles()),o&&(o.innerHTML=this.renderSummary()),this.rebindEvents()}updateChannelsUI(){let e=this.$("#context-channels");e&&(e.innerHTML=this.renderChannels()),this.bindChannelEvents()}bindEvents(){this.rebindEvents()}rebindEvents(){this.$$("#context-contacts .contact-item").forEach(t=>{t.addEventListener("click",()=>{let i=t.dataset.contact;i&&this.selectContact(i)})}),this.$$("#context-projects .project-item").forEach(t=>{t.addEventListener("click",()=>{let i=parseInt(t.dataset.projectId||"0");i&&this.selectProject(i)})}),this.$$("#context-files .file-item").forEach(t=>{t.addEventListener("click",()=>{let i=parseInt(t.dataset.fileId||"0");i&&this.selectFile(i)})}),this.$("#clear-context")?.addEventListener("click",()=>this.clearContext()),this.bindChannelEvents()}bindChannelEvents(){this.$$("#context-channels .channel-item").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.channel;t&&d.emit("channel:selected",t)})})}selectContact(e){this.state.selectedContact=e,this.state.selectedProject=null,this.state.selectedFile=null,this.state.recommendedChannels=[],this.updateUI(),this.loadChannels()}selectProject(e){let i=this.contacts.find(o=>o.name===this.state.selectedContact)?.projects.find(o=>o.id===e);i&&(this.state.selectedProject=i,this.state.selectedFile=null,this.updateUI(),this.loadChannels())}selectFile(e){let t=this.state.selectedProject?.files.find(i=>i.id===e);t&&(this.state.selectedFile=t,this.updateUI(),this.loadChannels())}clearContext(){this.state={selectedContact:null,selectedProject:null,selectedFile:null,recommendedChannels:[]},this.updateUI(),this.updateChannelsUI(),d.emit("context:cleared")}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}};var g=class extends u{constructor(){super(...arguments);this.sources=[];this.legalDocs=[];this.activeTab="sources";this.filterType="all"}render(){return`
      <div class="sources-panel-component">
        <div class="sources-tabs">
          <button class="tab-btn ${this.activeTab==="sources"?"active":""}" data-tab="sources">
            \u{1F517} \u0179r\xF3d\u0142a danych
          </button>
          <button class="tab-btn ${this.activeTab==="documents"?"active":""}" data-tab="documents">
            \u{1F4DC} Akty prawne
          </button>
        </div>

        <div class="sources-filter">
          <select class="filter-select" id="source-type-filter">
            <option value="all" ${this.filterType==="all"?"selected":""}>Wszystkie</option>
            <option value="official" ${this.filterType==="official"?"selected":""}>Urz\u0119dowe</option>
            <option value="commercial" ${this.filterType==="commercial"?"selected":""}>Komercyjne</option>
          </select>
        </div>

        <div class="sources-content">
          ${this.activeTab==="sources"?this.renderSources():this.renderDocuments()}
        </div>

        <div class="sources-verify">
          <h4>\u{1F50D} Weryfikacja podmiotu</h4>
          <div class="verify-form">
            <input type="text" id="verify-input" placeholder="NIP, KRS lub VAT UE (np. PL1234567890)">
            <select id="verify-type">
              <option value="nip">NIP (CEIDG)</option>
              <option value="krs">KRS</option>
              <option value="vat_eu">VAT UE (VIES)</option>
            </select>
            <button type="button" id="verify-btn" class="verify-button">Sprawd\u017A</button>
          </div>
          <div id="verify-result" class="verify-result"></div>
        </div>
      </div>
    `}renderSources(){let e=this.sources.filter(t=>this.filterType==="all"||t.type===this.filterType);return e.length?`
      <ul class="sources-list-component">
        ${e.map(t=>`
          <li class="source-item ${t.active?"":"inactive"}" data-source-id="${t.id}">
            <div class="source-header">
              <span class="source-type-badge ${t.type}">${t.type==="official"?"\u{1F3DB}\uFE0F":"\u{1F4BC}"}</span>
              <span class="source-name">${this.escapeHtml(t.name)}</span>
              <span class="source-status ${t.active?"active":"inactive"}">
                ${t.active?"\u2705":"\u{1F511}"}
              </span>
            </div>
            <div class="source-description">${this.escapeHtml(t.description)}</div>
            <a href="${t.base_url}" target="_blank" class="source-url">${t.base_url}</a>
          </li>
        `).join("")}
      </ul>
    `:'<div class="sources-empty">\u0141adowanie \u017Ar\xF3de\u0142...</div>'}renderDocuments(){if(!this.legalDocs.length)return'<div class="sources-empty">\u0141adowanie dokument\xF3w...</div>';let e=this.groupByCategory(this.legalDocs);return`
      <div class="legal-docs-list">
        ${Object.entries(e).map(([t,i])=>`
          <div class="docs-category">
            <h5 class="category-header">${this.getCategoryLabel(t)}</h5>
            <ul class="docs-list">
              ${i.map(o=>`
                <li class="doc-item">
                  <a href="${o.url}" target="_blank" class="doc-link">
                    <span class="doc-title">${this.escapeHtml(o.title)}</span>
                    <span class="doc-id">${o.id}</span>
                  </a>
                </li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `}groupByCategory(e){return e.reduce((t,i)=>(t[i.category]||(t[i.category]=[]),t[i.category].push(i),t),{})}getCategoryLabel(e){return{ksef:"\u{1F4C4} KSeF",vat:"\u{1F4B0} VAT",b2b:"\u{1F4BC} B2B / Prawo pracy",zus:"\u{1F3E5} ZUS"}[e]||e}async afterMount(){await this.loadData()}async loadData(){try{let[e,t]=await Promise.all([l.get("/sources"),l.get("/legal-documents")]);this.sources=e,this.legalDocs=t,this.updateContent()}catch(e){console.error("Error loading sources data:",e)}}updateContent(){let e=this.$(".sources-content");e&&(e.innerHTML=this.activeTab==="sources"?this.renderSources():this.renderDocuments())}bindEvents(){this.$$(".tab-btn").forEach(o=>{o.addEventListener("click",()=>{this.activeTab=o.dataset.tab,this.$$(".tab-btn").forEach(a=>a.classList.remove("active")),o.classList.add("active"),this.updateContent()})});let e=this.$("#source-type-filter");e?.addEventListener("change",()=>{this.filterType=e.value,this.updateContent()}),this.$("#verify-btn")?.addEventListener("click",()=>this.handleVerify()),this.$("#verify-input")?.addEventListener("keydown",o=>{o.key==="Enter"&&this.handleVerify()})}async handleVerify(){let e=this.$("#verify-input"),t=this.$("#verify-type"),i=this.$("#verify-result");if(!e||!t||!i)return;let o=e.value.trim();if(!o){i.innerHTML='<span class="error">Wprowad\u017A identyfikator</span>';return}i.innerHTML='<span class="loading">Weryfikuj\u0119...</span>';try{let a=await l.post("/verify",{identifier:o,type:t.value});a.valid?(i.innerHTML=`
          <div class="verify-success">
            <strong>\u2705 Zweryfikowano:</strong> ${this.escapeHtml(o)}<br>
            ${a.data?.name?`<strong>Nazwa:</strong> ${this.escapeHtml(a.data.name)}<br>`:""}
            ${a.data?.address?`<strong>Adres:</strong> ${this.escapeHtml(a.data.address)}`:""}
          </div>
        `,d.emit("entity:verified",a)):i.innerHTML=`
          <div class="verify-error">
            \u274C ${a.error||"Nie znaleziono"}
          </div>
        `}catch{i.innerHTML='<span class="error">B\u0142\u0105d weryfikacji</span>'}}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}};var N=class extends u{constructor(){super(...arguments);this.documents=[];this.selectedDocument=null;this.events=[];this.stats=null;this.viewMode="list";this.isLoading=!1}render(){return`
      <div class="documents-panel-component">
        <div class="documents-header">
          <h3>\u{1F4DA} Dokumenty (CQRS)</h3>
          <div class="documents-actions">
            <button type="button" class="btn-icon" id="doc-refresh" title="Od\u015Bwie\u017C">\u{1F504}</button>
            <button type="button" class="btn-icon" id="doc-new" title="Nowy dokument">\u2795</button>
            <button type="button" class="btn-icon ${this.viewMode==="events"?"active":""}" 
                    id="doc-toggle-events" title="Historia zdarze\u0144">\u{1F4DC}</button>
          </div>
        </div>

        <div class="documents-stats" id="doc-stats">
          ${this.renderStats()}
        </div>

        <div class="documents-content">
          ${this.viewMode==="list"?this.renderList():""}
          ${this.viewMode==="edit"?this.renderEditor():""}
          ${this.viewMode==="events"?this.renderEvents():""}
        </div>
      </div>
    `}renderStats(){return this.stats?`
      <div class="stats-row">
        <span class="stat-item">
          <strong>${this.stats.total_documents}</strong> dokument\xF3w
        </span>
        <span class="stat-item">
          <strong>${this.stats.total_chunks}</strong> chunk\xF3w
        </span>
      </div>
      <div class="stats-categories">
        ${this.stats.categories.map(e=>`
          <span class="category-badge ${e.category}">${e.category}: ${e.count}</span>
        `).join("")}
      </div>
    `:'<div class="stats-loading">\u0141adowanie...</div>'}renderList(){return this.isLoading?'<div class="loading">\u0141adowanie dokument\xF3w...</div>':this.documents.length?`
      <ul class="documents-list-component">
        ${this.documents.map(e=>`
          <li class="document-item ${this.selectedDocument?.id===e.id?"selected":""}"
              data-doc-id="${e.id}">
            <div class="document-info">
              <span class="document-title">${this.escapeHtml(e.title)}</span>
              <span class="document-category ${e.category}">${e.category}</span>
            </div>
            <div class="document-meta">
              ${e.source?`<span class="document-source">${this.escapeHtml(e.source)}</span>`:""}
            </div>
          </li>
        `).join("")}
      </ul>
    `:'<div class="empty">Brak dokument\xF3w. Kliknij \u2795 aby doda\u0107 nowy.</div>'}renderEditor(){let e=this.selectedDocument,t=!e?.id;return`
      <form class="document-editor-form" id="doc-editor-form">
        <div class="form-group">
          <label for="doc-title-input">Tytu\u0142</label>
          <input type="text" id="doc-title-input" class="form-input" 
                 value="${e?this.escapeHtml(e.title):""}" 
                 placeholder="Tytu\u0142 dokumentu" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="doc-category-input">Kategoria</label>
            <select id="doc-category-input" class="form-select" required>
              <option value="">Wybierz...</option>
              <option value="ksef" ${e?.category==="ksef"?"selected":""}>KSeF</option>
              <option value="b2b" ${e?.category==="b2b"?"selected":""}>B2B</option>
              <option value="zus" ${e?.category==="zus"?"selected":""}>ZUS</option>
              <option value="vat" ${e?.category==="vat"?"selected":""}>VAT</option>
            </select>
          </div>
          <div class="form-group">
            <label for="doc-source-input">\u0179r\xF3d\u0142o</label>
            <input type="text" id="doc-source-input" class="form-input"
                   value="${e?.source?this.escapeHtml(e.source):""}"
                   placeholder="np. Dz.U. 2024 poz. 123">
          </div>
        </div>

        <div class="form-group">
          <label for="doc-content-input">Tre\u015B\u0107</label>
          <textarea id="doc-content-input" class="form-textarea" rows="10" 
                    placeholder="Tre\u015B\u0107 dokumentu..." required>${e?this.escapeHtml(e.content):""}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn secondary" id="doc-cancel">Anuluj</button>
          ${t?"":'<button type="button" class="btn danger" id="doc-delete">Usu\u0144</button>'}
          <button type="submit" class="btn primary">${t?"Utw\xF3rz":"Zapisz"}</button>
        </div>

        ${t?"":`
          <div class="editor-events-preview">
            <h4>\u{1F4DC} Ostatnie zdarzenia</h4>
            <ul class="events-mini-list">
              ${this.events.slice(0,3).map(i=>`
                <li class="event-mini">
                  <span class="event-type">${i.event_type}</span>
                  <span class="event-time">${this.formatTime(i.created_at)}</span>
                </li>
              `).join("")}
            </ul>
            <button type="button" class="btn-link" id="doc-show-all-events">
              Zobacz wszystkie zdarzenia \u2192
            </button>
          </div>
        `}
      </form>
    `}renderEvents(){return this.selectedDocument?this.events.length?`
      <div class="events-panel">
        <div class="events-header">
          <h4>\u{1F4DC} Historia zdarze\u0144: ${this.escapeHtml(this.selectedDocument.title)}</h4>
          <button type="button" class="btn secondary btn-sm" id="events-back">\u2190 Wr\xF3\u0107</button>
        </div>
        <ul class="events-list">
          ${this.events.map(e=>`
            <li class="event-item ${e.event_type.toLowerCase()}">
              <div class="event-icon">${this.getEventIcon(e.event_type)}</div>
              <div class="event-details">
                <div class="event-header">
                  <span class="event-type">${e.event_type}</span>
                  <span class="event-time">${this.formatTime(e.created_at)}</span>
                </div>
                <div class="event-payload">
                  <pre>${JSON.stringify(e.payload,null,2)}</pre>
                </div>
              </div>
            </li>
          `).join("")}
        </ul>
      </div>
    `:'<div class="empty">Brak zdarze\u0144 dla tego dokumentu</div>':'<div class="empty">Wybierz dokument, aby zobaczy\u0107 histori\u0119 zdarze\u0144</div>'}getEventIcon(e){return{DocumentCreated:"\u2728",DocumentUpdated:"\u270F\uFE0F",DocumentDeleted:"\u{1F5D1}\uFE0F"}[e]||"\u{1F4CC}"}formatTime(e){return new Date(e).toLocaleString("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}async afterMount(){await Promise.all([this.loadDocuments(),this.loadStats()])}async loadDocuments(){this.isLoading=!0;try{this.documents=await l.get("/documents"),this.updateList()}catch(e){console.error("Error loading documents:",e)}finally{this.isLoading=!1}}async loadStats(){try{this.stats=await l.get("/documents/stats"),this.updateStats()}catch(e){console.error("Error loading stats:",e)}}async loadEvents(e){try{this.events=await l.get(`/events/documents/${e}`)}catch(t){console.error("Error loading events:",t),this.events=[]}}updateList(){let e=this.$(".documents-content");e&&this.viewMode==="list"&&(e.innerHTML=this.renderList(),this.bindListEvents())}updateStats(){let e=this.$("#doc-stats");e&&(e.innerHTML=this.renderStats())}updateContent(){let e=this.$(".documents-content");e&&(this.viewMode==="list"?(e.innerHTML=this.renderList(),this.bindListEvents()):this.viewMode==="edit"?(e.innerHTML=this.renderEditor(),this.bindEditorEvents()):this.viewMode==="events"&&(e.innerHTML=this.renderEvents(),this.bindEventsEvents()))}bindEvents(){this.$("#doc-refresh")?.addEventListener("click",()=>this.loadDocuments()),this.$("#doc-new")?.addEventListener("click",()=>this.newDocument()),this.$("#doc-toggle-events")?.addEventListener("click",()=>this.toggleEventsView()),this.bindListEvents()}bindListEvents(){this.$$(".document-item").forEach(e=>{e.addEventListener("click",async()=>{let t=parseInt(e.dataset.docId||"0");await this.selectDocument(t)})})}bindEditorEvents(){this.$("#doc-editor-form")?.addEventListener("submit",async t=>{t.preventDefault(),await this.saveDocument()}),this.$("#doc-cancel")?.addEventListener("click",()=>{this.viewMode="list",this.selectedDocument=null,this.updateContent()}),this.$("#doc-delete")?.addEventListener("click",async()=>{this.selectedDocument&&confirm("Czy na pewno chcesz usun\u0105\u0107 ten dokument?")&&await this.deleteDocument(this.selectedDocument.id)}),this.$("#doc-show-all-events")?.addEventListener("click",()=>{this.viewMode="events",this.updateContent()})}bindEventsEvents(){this.$("#events-back")?.addEventListener("click",()=>{this.viewMode="edit",this.updateContent()})}async selectDocument(e){try{this.selectedDocument=await l.get(`/documents/${e}`),await this.loadEvents(e),this.viewMode="edit",this.updateContent()}catch(t){console.error("Error selecting document:",t)}}newDocument(){this.selectedDocument={id:0,title:"",source:null,category:"",content:""},this.events=[],this.viewMode="edit",this.updateContent()}async saveDocument(){let e=this.$("#doc-title-input")?.value,t=this.$("#doc-category-input")?.value,i=this.$("#doc-source-input")?.value,o=this.$("#doc-content-input")?.value;if(!e||!t||!o){alert("Wype\u0142nij wszystkie wymagane pola");return}try{if(this.selectedDocument?.id)await l.post("/commands/documents/update",{id:this.selectedDocument.id,title:e,category:t,content:o,source:i||null}),d.emit("document:updated",this.selectedDocument.id);else{let a=await l.post("/commands/documents/create",{title:e,category:t,content:o,source:i||null});d.emit("document:created",a.id)}await this.loadDocuments(),await this.loadStats(),this.viewMode="list",this.selectedDocument=null,this.updateContent()}catch(a){console.error("Error saving document:",a),alert("B\u0142\u0105d zapisu dokumentu")}}async deleteDocument(e){try{await l.post("/commands/documents/delete",{id:e}),d.emit("document:deleted",e),await this.loadDocuments(),await this.loadStats(),this.viewMode="list",this.selectedDocument=null,this.updateContent()}catch(t){console.error("Error deleting document:",t),alert("B\u0142\u0105d usuwania dokumentu")}}toggleEventsView(){this.viewMode==="events"?this.viewMode=this.selectedDocument?"edit":"list":this.viewMode="events",this.updateContent(),this.$("#doc-toggle-events")?.classList.toggle("active",this.viewMode==="events")}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}};var O=class extends u{constructor(){super(...arguments);this.projects=[];this.contacts=[];this.selectedProject=null;this.projectFiles=[];this.events=[];this.viewMode="list";this.filterContact=null}render(){return`
      <div class="projects-panel-component">
        <div class="projects-header">
          <h3>\u{1F4C1} Projekty (CQRS)</h3>
          <div class="projects-actions">
            <button type="button" class="btn-icon" id="proj-refresh" title="Od\u015Bwie\u017C">\u{1F504}</button>
            <button type="button" class="btn-icon" id="proj-new" title="Nowy projekt">\u2795</button>
          </div>
        </div>

        <div class="projects-filter">
          <select id="contact-filter" class="filter-select">
            <option value="">Wszystkie kontakty</option>
            ${this.contacts.map(e=>`
              <option value="${this.escapeHtml(e)}" ${this.filterContact===e?"selected":""}>
                ${this.escapeHtml(e)}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="projects-content">
          ${this.viewMode==="list"?this.renderList():""}
          ${this.viewMode==="edit"?this.renderEditor():""}
          ${this.viewMode==="files"?this.renderFiles():""}
        </div>
      </div>
    `}renderList(){let e=this.filterContact?this.projects.filter(i=>i.contact===this.filterContact):this.projects;if(!e.length)return'<div class="empty">Brak projekt\xF3w. Kliknij \u2795 aby doda\u0107 nowy.</div>';let t=this.groupByContact(e);return`
      <div class="projects-grouped">
        ${Object.entries(t).map(([i,o])=>`
          <div class="contact-group">
            <div class="contact-header">
              <span class="contact-icon">\u{1F464}</span>
              <span class="contact-name">${this.escapeHtml(i||"Bez kontaktu")}</span>
              <span class="contact-count">${o.length}</span>
            </div>
            <ul class="projects-list-component">
              ${o.map(a=>`
                <li class="project-item ${this.selectedProject?.id===a.id?"selected":""}"
                    data-proj-id="${a.id}">
                  <span class="project-icon">\u{1F4CB}</span>
                  <div class="project-info">
                    <span class="project-name">${this.escapeHtml(a.name)}</span>
                    <span class="project-desc">${this.escapeHtml(a.description||"")}</span>
                  </div>
                </li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `}renderEditor(){let e=this.selectedProject,t=!e?.id;return`
      <form class="project-editor-form" id="proj-editor-form">
        <div class="form-group">
          <label for="proj-name-input">Nazwa projektu</label>
          <input type="text" id="proj-name-input" class="form-input"
                 value="${e?this.escapeHtml(e.name):""}"
                 placeholder="Nazwa projektu" required>
        </div>

        <div class="form-group">
          <label for="proj-contact-input">Kontakt</label>
          <input type="text" id="proj-contact-input" class="form-input"
                 value="${e?.contact?this.escapeHtml(e.contact):""}"
                 placeholder="np. Kontrahent, Ksi\u0119gowa..."
                 list="contacts-datalist">
          <datalist id="contacts-datalist">
            ${this.contacts.map(i=>`<option value="${this.escapeHtml(i)}">`).join("")}
          </datalist>
        </div>

        <div class="form-group">
          <label for="proj-desc-input">Opis</label>
          <textarea id="proj-desc-input" class="form-textarea" rows="4"
                    placeholder="Opis projektu...">${e?.description?this.escapeHtml(e.description):""}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn secondary" id="proj-cancel">Anuluj</button>
          ${t?"":`
            <button type="button" class="btn info" id="proj-files">\u{1F4C4} Pliki</button>
            <button type="button" class="btn danger" id="proj-delete">Usu\u0144</button>
          `}
          <button type="submit" class="btn primary">${t?"Utw\xF3rz":"Zapisz"}</button>
        </div>

        ${t?"":`
          <div class="editor-events-preview">
            <h4>\u{1F4DC} Historia zdarze\u0144</h4>
            <ul class="events-mini-list">
              ${this.events.slice(0,3).map(i=>`
                <li class="event-mini">
                  <span class="event-type">${i.event_type}</span>
                  <span class="event-time">${this.formatTime(i.created_at)}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        `}
      </form>
    `}renderFiles(){return this.selectedProject?`
      <div class="files-panel">
        <div class="files-header">
          <h4>\u{1F4C4} Pliki projektu: ${this.escapeHtml(this.selectedProject.name)}</h4>
          <button type="button" class="btn secondary btn-sm" id="files-back">\u2190 Wr\xF3\u0107</button>
        </div>

        <form class="add-file-form" id="add-file-form">
          <div class="form-row">
            <input type="text" id="file-name-input" class="form-input" 
                   placeholder="Nazwa pliku (np. umowa.pdf)">
            <input type="text" id="file-path-input" class="form-input"
                   placeholder="\u015Acie\u017Cka (opcjonalna)">
            <button type="submit" class="btn primary btn-sm">Dodaj</button>
          </div>
        </form>

        <ul class="files-list-component">
          ${this.projectFiles.map(e=>`
            <li class="file-item" data-file-id="${e.id}">
              <span class="file-icon">${this.getFileIcon(e.filename)}</span>
              <div class="file-info">
                <span class="file-name">${this.escapeHtml(e.filename)}</span>
                ${e.path?`<span class="file-path">${this.escapeHtml(e.path)}</span>`:""}
              </div>
              <button type="button" class="btn-icon danger" data-action="remove-file" data-file-id="${e.id}">\u{1F5D1}\uFE0F</button>
            </li>
          `).join("")}
          ${this.projectFiles.length?"":'<li class="empty">Brak plik\xF3w</li>'}
        </ul>
      </div>
    `:'<div class="empty">Wybierz projekt</div>'}groupByContact(e){return e.reduce((t,i)=>{let o=i.contact||"";return t[o]||(t[o]=[]),t[o].push(i),t},{})}getFileIcon(e){let t=e.split(".").pop()?.toLowerCase();return{pdf:"\u{1F4D5}",doc:"\u{1F4D8}",docx:"\u{1F4D8}",xls:"\u{1F4D7}",xlsx:"\u{1F4D7}",txt:"\u{1F4C4}",jpg:"\u{1F5BC}\uFE0F",png:"\u{1F5BC}\uFE0F",zip:"\u{1F4E6}"}[t||""]||"\u{1F4C4}"}formatTime(e){return new Date(e).toLocaleString("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}async afterMount(){await this.loadProjects()}async loadProjects(){try{this.projects=await l.get("/projects"),this.contacts=[...new Set(this.projects.map(e=>e.contact).filter(Boolean))],this.updateContent()}catch(e){console.error("Error loading projects:",e)}}async loadProjectFiles(e){try{this.projectFiles=await l.get(`/projects/${e}/files`)}catch(t){console.error("Error loading project files:",t),this.projectFiles=[]}}async loadEvents(e){try{this.events=await l.get(`/events/projects/${e}`)}catch(t){console.error("Error loading events:",t),this.events=[]}}updateContent(){let e=this.$(".projects-content"),t=this.$(".projects-filter");t&&(t.innerHTML=`
        <select id="contact-filter" class="filter-select">
          <option value="">Wszystkie kontakty</option>
          ${this.contacts.map(i=>`
            <option value="${this.escapeHtml(i)}" ${this.filterContact===i?"selected":""}>
              ${this.escapeHtml(i)}
            </option>
          `).join("")}
        </select>
      `,this.bindFilterEvents()),e&&(this.viewMode==="list"?(e.innerHTML=this.renderList(),this.bindListEvents()):this.viewMode==="edit"?(e.innerHTML=this.renderEditor(),this.bindEditorEvents()):this.viewMode==="files"&&(e.innerHTML=this.renderFiles(),this.bindFilesEvents()))}bindEvents(){this.$("#proj-refresh")?.addEventListener("click",()=>this.loadProjects()),this.$("#proj-new")?.addEventListener("click",()=>this.newProject()),this.bindFilterEvents(),this.bindListEvents()}bindFilterEvents(){let e=this.$("#contact-filter");e?.addEventListener("change",()=>{this.filterContact=e.value||null,this.updateContent()})}bindListEvents(){this.$$(".project-item").forEach(e=>{e.addEventListener("click",async()=>{let t=parseInt(e.dataset.projId||"0");await this.selectProject(t)})})}bindEditorEvents(){this.$("#proj-editor-form")?.addEventListener("submit",async t=>{t.preventDefault(),await this.saveProject()}),this.$("#proj-cancel")?.addEventListener("click",()=>{this.viewMode="list",this.selectedProject=null,this.updateContent()}),this.$("#proj-files")?.addEventListener("click",async()=>{this.selectedProject&&(await this.loadProjectFiles(this.selectedProject.id),this.viewMode="files",this.updateContent())}),this.$("#proj-delete")?.addEventListener("click",async()=>{this.selectedProject&&confirm("Czy na pewno chcesz usun\u0105\u0107 ten projekt?")&&await this.deleteProject(this.selectedProject.id)})}bindFilesEvents(){this.$("#files-back")?.addEventListener("click",()=>{this.viewMode="edit",this.updateContent()}),this.$("#add-file-form")?.addEventListener("submit",async t=>{t.preventDefault(),await this.addFile()}),this.$$('[data-action="remove-file"]').forEach(t=>{t.addEventListener("click",async()=>{let i=parseInt(t.dataset.fileId||"0");i&&confirm("Usun\u0105\u0107 plik?")&&await this.removeFile(i)})})}async selectProject(e){try{this.selectedProject=await l.get(`/projects/${e}`),await this.loadEvents(e),this.viewMode="edit",this.updateContent(),d.emit("project:selected",this.selectedProject)}catch(t){console.error("Error selecting project:",t)}}newProject(){this.selectedProject={id:0,name:"",description:"",contact:""},this.events=[],this.viewMode="edit",this.updateContent()}async saveProject(){let e=this.$("#proj-name-input")?.value,t=this.$("#proj-contact-input")?.value,i=this.$("#proj-desc-input")?.value;if(!e){alert("Podaj nazw\u0119 projektu");return}try{if(this.selectedProject?.id)await l.post("/commands/projects/update",{id:this.selectedProject.id,name:e,contact:t,description:i}),d.emit("project:updated",this.selectedProject.id);else{let o=await l.post("/commands/projects/create",{name:e,contact:t,description:i});d.emit("project:created",o.id)}await this.loadProjects(),this.viewMode="list",this.selectedProject=null,this.updateContent()}catch(o){console.error("Error saving project:",o),alert("B\u0142\u0105d zapisu projektu")}}async deleteProject(e){try{await l.post("/commands/projects/delete",{id:e}),d.emit("project:deleted",e),await this.loadProjects(),this.viewMode="list",this.selectedProject=null,this.updateContent()}catch(t){console.error("Error deleting project:",t),alert("B\u0142\u0105d usuwania projektu")}}async addFile(){if(!this.selectedProject)return;let e=this.$("#file-name-input")?.value,t=this.$("#file-path-input")?.value;if(!e){alert("Podaj nazw\u0119 pliku");return}try{await l.post("/commands/projects/files/add",{project_id:this.selectedProject.id,filename:e,path:t||null}),await this.loadProjectFiles(this.selectedProject.id),this.updateContent(),d.emit("file:added",{projectId:this.selectedProject.id,filename:e})}catch(i){console.error("Error adding file:",i),alert("B\u0142\u0105d dodawania pliku")}}async removeFile(e){try{await l.post("/commands/projects/files/remove",{id:e}),this.selectedProject&&(await this.loadProjectFiles(this.selectedProject.id),this.updateContent()),d.emit("file:removed",e)}catch(t){console.error("Error removing file:",t),alert("B\u0142\u0105d usuwania pliku")}}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}};var Ie={useNewComponents:!1};function De(){let s=new URLSearchParams(window.location.search).get("sso_token");if(s){localStorage.setItem("detax_token",s);try{let e=JSON.parse(atob(s.split(".")[1])),t={id:e.sub,email:e.email,sso:!0,sso_from:e.sso_from||"idcard.pl"};localStorage.setItem("detax_user",JSON.stringify(t)),console.log("\u2705 SSO login successful:",t.email),Be(t.email)}catch(e){console.error("SSO token decode error:",e)}window.history.replaceState({},document.title,window.location.pathname)}else{let e=localStorage.getItem("detax_user");if(e)try{let t=JSON.parse(e);t.sso&&Fe(t.email)}catch{}}}function Be(n){let s=document.querySelector(".status-text");s&&(s.textContent=`Zalogowano przez IDCard.pl: ${n}`,s.parentElement?.classList.add("connected"));let e=document.getElementById("messages");if(e){let t=document.createElement("div");t.className="message assistant",t.innerHTML=`
      <div class="message-avatar">\u{1F510}</div>
      <div class="message-content">
        <p><strong>Zalogowano przez IDCard.pl!</strong></p>
        <p>Witaj, <strong>${n}</strong>! Jeste\u015B zalogowany przez Single Sign-On z IDCard.pl.</p>
        <p>Mo\u017Cesz teraz korzysta\u0107 z wszystkich funkcji Detax AI.</p>
      </div>
    `,e.insertBefore(t,e.firstChild?.nextSibling||null)}}function Fe(n){let s=document.querySelector(".status-text");s&&(s.textContent=`Zalogowano: ${n}`)}function Ae(){De(),J(),F(),q(),U();let n=document.getElementById("sources-data-panel");n&&new g({container:n}).mount()}function qe(){let n=document.getElementById("app-header");n&&new k({container:n}).mount();let s=document.getElementById("app-chat");s&&new C({container:s}).mount();let e=document.getElementById("app-context");e&&new T({container:e}).mount();let t=document.getElementById("app-sources");t&&new g({container:t}).mount(),F(),q(),U()}function Ue(){document.addEventListener("DOMContentLoaded",()=>{try{console.log("\u{1F985} Bielik Frontend initializing..."),Ie.useNewComponents?(qe(),console.log("\u2705 Components initialized")):(Ae(),console.log("\u2705 Legacy modules initialized")),d.on("context:changed",n=>{console.log("Context changed:",n)}),d.on("entity:verified",n=>{console.log("Entity verified:",n)})}catch(n){console.error("\u274C B\u0142\u0105d inicjalizacji frontendu:",n)}})}Ue();})();
