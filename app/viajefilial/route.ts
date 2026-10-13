// OJO: al ser static la clave se lee en el build, si la cambio hay que redeployar
export const dynamic = 'force-static';

const html = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Lista del bondi · Filial Capital Federal</title>
<style>
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);--bg:#fff;--tx:#111827;--mut:#6b7280;--ln:#e5e7eb;--acc:#0b3a8f;--ok:#16a34a;--okbg:#f0fdf4;--warn:#c2410c;--red:#b91c1c;--in:#f3f4f6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1420;--tx:#eef2fa;--mut:#9aa6bd;--ln:#252f47;--acc:#7aa7ff;--ok:#4ade80;--okbg:#10261a;--warn:#fb923c;--red:#f87171;--in:#1a2236}}
:root[data-theme="dark"]{--bg:#0f1420;--tx:#eef2fa;--mut:#9aa6bd;--ln:#252f47;--acc:#7aa7ff;--ok:#4ade80;--okbg:#10261a;--warn:#fb923c;--red:#f87171;--in:#1a2236}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{margin:0;background:var(--bg);color:var(--tx);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%}
button{font:inherit;color:inherit;background:none;border:0;padding:0}
input,select{font:inherit;font-size:16px;color:var(--tx);background:var(--in);border:0;border-radius:10px;padding:11px 12px;width:100%}
header{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding:10px 14px 8px;border-bottom:1px solid var(--ln)}
.hd{display:flex;justify-content:space-between;align-items:center}
.t{font-weight:700;font-size:17px}
.sub{font-size:12px;color:var(--mut)}
#status{font-size:11px;color:var(--mut)}
.ic{font-size:26px;line-height:1;width:40px;height:40px;border-radius:10px;color:var(--mut)}
.menu{position:absolute;right:10px;top:54px;background:var(--bg);border:1px solid var(--ln);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);min-width:200px;overflow:hidden}
.menu button{display:block;width:100%;text-align:left;padding:14px 16px;font-size:15px;border-bottom:1px solid var(--ln)}
.menu button:last-child{border:0}
.tabs{display:flex;gap:4px;margin:8px 0}
.tab{flex:1;padding:8px 2px;border-radius:9px;font-size:13px;color:var(--mut);background:var(--in)}
.tab b{color:var(--tx);margin-left:3px}
.tab.on{background:var(--acc);color:#fff}
.tab.on b{color:#fff}
main{padding:0 0 110px}
.sh{display:flex;align-items:center;justify-content:space-between;padding:16px 14px 6px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);font-weight:600}
.plus{font-size:22px;line-height:1;width:34px;height:34px;color:var(--acc)}
.r{display:flex;gap:12px;padding:11px 14px;border-bottom:1px solid var(--ln);align-items:flex-start}
.r.up{background:var(--okbg)}
.chk{flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.chk i{width:30px;height:30px;border-radius:50%;border:2px solid var(--ln);display:flex;align-items:center;justify-content:center;font-style:normal;color:#fff;font-weight:700;font-size:17px}
.up .chk i{background:var(--ok);border-color:var(--ok)}
.i{flex:1;min-width:0}
.nm{font-weight:600;font-size:16px;word-break:break-word}
.nm small{color:var(--mut);font-weight:400;font-size:12px;margin-right:4px}
.mn{font-size:11px;color:var(--acc);font-weight:600;margin-left:6px}
.sm{font-size:13px;color:var(--mut);margin-top:1px}
.sm a{color:var(--acc);text-decoration:none}
.cm{font-size:13px;color:var(--acc);margin-top:2px}
.debe{display:inline-block;margin-top:5px;font-size:13px;font-weight:700;color:var(--warn);border:1px solid var(--warn);border-radius:99px;padding:3px 10px}
.cobr{display:inline-block;margin-top:4px;font-size:12px;color:var(--ok)}
.note{margin-top:5px;padding:6px 0;font-size:15px;background:none;border-radius:0;border-bottom:1px dashed var(--ln)}
.note::placeholder{color:var(--mut);opacity:.6}
.lnk{font-size:12px;color:var(--red);margin-left:10px;font-weight:400}
.mv{display:block;font-size:13px;color:var(--acc);margin-top:5px;font-weight:600}
.empty{text-align:center;color:var(--mut);padding:36px 20px;font-size:14px}
.ex{display:flex;gap:8px;padding:6px 14px}
.btn{background:var(--acc);color:#fff;border-radius:10px;padding:11px 16px;font-size:15px;font-weight:600;white-space:nowrap}
.btn.g{background:var(--in);color:var(--tx)}
.fab{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);width:58px;height:58px;border-radius:50%;background:var(--acc);color:#fff;font-size:32px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.3);z-index:6}
.gate{position:fixed;inset:0;z-index:30;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px}
.gate input{max-width:200px;text-align:center;font-size:24px;letter-spacing:.3em}
#gerr{color:var(--red);font-size:13px;min-height:16px}
.ov{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.45);display:flex;align-items:flex-end}
.sheet{background:var(--bg);width:100%;border-radius:18px 18px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px);display:flex;flex-direction:column;gap:10px;max-height:92%;overflow:auto}
.sheet h3{margin:0 0 2px;font-size:17px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.seg{display:flex;gap:6px}
.seg button{flex:1;padding:11px;border-radius:10px;background:var(--in);color:var(--mut);font-size:15px}
.seg button.on{background:var(--acc);color:#fff}
.chkl{display:flex;align-items:center;gap:8px;font-size:15px}
.chkl input{width:20px;height:20px;padding:0}
.acts{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:4px}
</style>
</head>
<body>
<div class="gate" id="gate" hidden>
  <div class="t">Lista del bondi</div>
  <input type="password" id="pin" inputmode="numeric" autocomplete="off" placeholder="PIN">
  <div id="gerr"></div>
  <button class="btn" id="pinOk">Entrar</button>
</div>

<header>
  <div class="hd">
    <div>
      <div class="t">Lista del bondi</div>
      <div class="sub" id="sub">—</div>
    </div>
    <button class="ic" id="menuBtn" aria-label="Menú">⋯</button>
  </div>
  <div id="status">Conectando…</div>
  <div class="menu" id="menu" hidden>
    <button id="up">Subir PDF (reemplaza la lista)</button>
    <button id="add">Sumar PDF a la lista</button>
    <button id="clear" style="color:var(--red)">Borrar todos los datos</button>
  </div>
  <div class="tabs">
    <button class="tab on" data-f="all">Todos<b id="cAll">0</b></button>
    <button class="tab" data-f="falta">Faltan<b id="cFalta">0</b></button>
    <button class="tab" data-f="subio">Subieron<b id="cSubio">0</b></button>
    <button class="tab" data-f="pend">Deben<b id="cPend">0</b></button>
  </div>
  <input type="search" id="q" placeholder="Buscar nombre, DNI o teléfono" autocomplete="off">
</header>
<main id="main"></main>
<button class="fab" id="fab" aria-label="Agregar persona">+</button>
<input type="file" id="file" accept="application/pdf" hidden>

<div class="ov" id="ov" hidden>
  <div class="sheet" id="sheet">
    <h3>Agregar persona</h3>
    <input type="text" id="fNom" placeholder="Nombre y apellido" autocomplete="off">
    <select id="fPar"></select>
    <input type="text" id="fParNew" placeholder="Nombre de la parada" hidden>
    <div class="row2">
      <input type="text" id="fDni" inputmode="numeric" placeholder="DNI">
      <input type="tel" id="fTel" placeholder="Teléfono">
    </div>
    <div class="seg" id="fPago">
      <button data-pago="P" class="on">Pagado</button>
      <button data-pago="D">Debe</button>
    </div>
    <input type="text" id="fFalta" inputmode="numeric" placeholder="Monto que falta (opcional)" hidden>
    <input type="text" id="fCom" placeholder="Comentario (opcional)">
    <label class="chkl"><input type="checkbox" id="fMenor"> Es menor</label>
    <label class="chkl"><input type="checkbox" id="fSubio"> Ya subió</label>
    <div class="acts">
      <button class="btn g" id="fCancel">Cancelar</button>
      <button class="btn" id="fOk">Agregar</button>
    </div>
  </div>
</div>

<div class="ov" id="ov2" hidden>
  <div class="sheet">
    <h3>Asignar parada</h3>
    <select id="mPar"></select>
    <input type="text" id="mParNew" placeholder="Nombre de la parada" hidden>
    <div class="acts">
      <button class="btn g" id="mCancel">Cancelar</button>
      <button class="btn" id="mOk">Asignar</button>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
var SB_URL="__SB_URL__";
var SB_KEY="__SB_KEY__";
var POLL_MS=2000;
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function money(n){return "$"+Number(n).toLocaleString("es-AR")}

var SIN="Sin parada";
function stopOf(p){var s=(p.parada&&String(p.parada).trim())||SIN;return /^sin parada$/i.test(s)?SIN:s}
function knownStops(){var a=[],s={};(S.pasajeros||[]).forEach(function(p){var x=stopOf(p);if(x!==SIN&&!s[x]){s[x]=1;a.push(x)}});return a}
var PIN=lsGet("bondi-pin")||"",S={meta:{},pasajeros:[],extras:[]},busy=0,lastW=0,sig="",filter="all",qv="",timers={};

function setStatus(t,bad){var e=$("status");e.textContent=t;e.style.color=bad?"var(--warn)":"var(--mut)"}
function showGate(msg){$("gate").hidden=false;$("gerr").textContent=msg||"";setTimeout(function(){$("pin").focus()},50)}
function hideGate(){$("gate").hidden=true}

function call(fn,args){
  args=args||{};args.p_pin=PIN;
  var h={"Content-Type":"application/json","apikey":SB_KEY};
  if(SB_KEY.indexOf("eyJ")===0)h.Authorization="Bearer "+SB_KEY;
  return fetch(SB_URL+"/rest/v1/rpc/"+fn,{method:"POST",headers:h,body:JSON.stringify(args)}).then(function(r){
    return r.json().catch(function(){return null}).then(function(j){
      if(!r.ok)throw new Error((j&&j.message)||("Error "+r.status));
      return j});
  });
}
function onErr(e){
  if(/PIN/i.test(e.message)){PIN="";lsSet("bondi-pin","");showGate("PIN incorrecto");return}
  setStatus("Sin conexión · reintentando…",true);
}
function refresh(force){
  if(!PIN)return Promise.resolve();
  var a=document.activeElement;
  if(!force&&(document.hidden||busy||Date.now()-lastW<2000||(a&&a.dataset&&a.dataset.note!==undefined)))return Promise.resolve();
  return call("bondi_get").then(function(d){
    hideGate();
    var s=JSON.stringify(d);
    if(s!==sig){sig=s;S=d;render()}
    setStatus("● En vivo · "+new Date().toLocaleTimeString("es-AR"));
  }).catch(onErr);
}
function write(fn,args){
  busy++;lastW=Date.now();
  return call(fn,args).catch(function(e){sig="";if(/PIN/i.test(e.message))onErr(e);else setStatus("No se pudo guardar",true)}).then(function(){
    busy--;lastW=Date.now();if(!sig)refresh(true)});
}
function find(id){return S.pasajeros.filter(function(p){return p.id===id})[0]}
function isPend(p){return p.pago==="D"&&!p.cobrado}

function row(p){
  var id=p.id,x="";
  var tel=p.telefono?'<a href="tel:'+esc(String(p.telefono).replace(/[^0-9]/g,""))+'">'+esc(p.telefono)+'</a>':"";
  var sm=[p.dni?"DNI "+esc(p.dni):"",tel].filter(Boolean).join(" · ");
  if(p.comentario)x+='<div class="cm">'+esc(p.comentario)+'</div>';
  if(stopOf(p)===SIN)x+='<button class="mv" data-move="'+id+'">Asignar parada</button>';
  if(p.pago==="D"){
    x+=p.cobrado?'<button class="cobr" data-pay="'+id+'">✓ Cobrado (deshacer)</button>'
      :'<button class="debe" data-pay="'+id+'">Debe'+(p.falta?" "+money(p.falta):"")+' · cobrar</button>';
  }
  return '<div class="r'+(p.subio?" up":"")+'"><button class="chk" data-up="'+id+'" aria-label="Subió"><i>'+(p.subio?"✓":"")+'</i></button><div class="i"><div class="nm"><small>#'+p.orden+'</small>'+esc(p.nombre)+(p.menor?'<span class="mn">MENOR</span>':"")+(p.manual?'<button class="lnk" data-del="'+id+'">Quitar</button>':"")+'</div>'+(sm?'<div class="sm">'+sm+'</div>':"")+x+'<input type="text" class="note" data-note="'+id+'" placeholder="Nota" value="'+esc(p.nota||"")+'"></div></div>';
}
function render(){
  var P=S.pasajeros||[],up=0,pend=0;
  P.forEach(function(p){if(p.subio)up++;if(isPend(p))pend++});
  $("cAll").textContent=P.length;$("cFalta").textContent=P.length-up;$("cSubio").textContent=up;$("cPend").textContent=pend;
  var m=S.meta||{},parts=[m.destino,m.salida].filter(Boolean);
  $("sub").textContent=parts.length?parts.join(" · "):"Sin lista cargada";
  var html="";
  if(!P.length){
    html='<div class="empty">No hay lista cargada.<br>Menú ⋯ → Subir PDF, o tocá + para agregar personas.</div>';
  }else{
    var stops=[],seen={};
    P.forEach(function(p){var s=stopOf(p);if(s!==SIN&&!seen[s]){seen[s]=1;stops.push(s)}});
    stops.push(SIN);
    var qn=qv.toLowerCase().trim(),any=false;
    stops.forEach(function(st){
      var tot=P.filter(function(p){return stopOf(p)===st});
      var rows=tot.filter(function(p){
        if(filter==="falta"&&p.subio)return false;
        if(filter==="subio"&&!p.subio)return false;
        if(filter==="pend"&&!isPend(p))return false;
        if(qn&&((p.nombre||"")+" "+(p.dni||"")+" "+(p.telefono||"")).toLowerCase().indexOf(qn)<0)return false;
        return true});
      if(!rows.length&&!(st===SIN&&filter==="all"&&!qn))return;
      any=true;
      var u=tot.filter(function(p){return p.subio}).length;
      html+='<div class="sh"><span>'+esc(st)+' · '+u+'/'+tot.length+'</span><button class="plus" data-addstop="'+esc(st)+'" aria-label="Agregar en esta parada">+</button></div>'+rows.map(row).join("");
    });
    if(!any)html+='<div class="empty">Nadie con ese filtro.</div>';
  }
  html+='<div class="sh"><span>Subieron sin estar en lista · '+S.extras.length+'</span></div>';
  S.extras.forEach(function(e){html+='<div class="r up"><div class="i"><div class="nm">'+esc(e.texto)+'<button class="lnk" data-rm="'+e.id+'">Quitar</button></div></div></div>'});
  html+='<div class="ex"><input type="text" id="exIn" placeholder="Nombre o DNI"><button class="btn" id="exAdd">Agregar</button></div>';
  $("main").innerHTML=html;
}

$("main").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.up){
    var p=find(+t.dataset.up);if(!p)return;
    p.subio=!p.subio;render();write("bondi_update",{p_id:p.id,p_patch:{subio:p.subio}});
  }else if(t.dataset.pay){
    var q=find(+t.dataset.pay);if(!q)return;
    q.cobrado=!q.cobrado;render();write("bondi_update",{p_id:q.id,p_patch:{cobrado:q.cobrado}});
  }else if(t.dataset.del){
    var d=find(+t.dataset.del);if(!d)return;
    if(!confirm("¿Quitar a "+d.nombre+" de la lista?"))return;
    write("bondi_del_pasajero",{p_id:d.id}).then(function(){refresh(true)});
  }else if(t.dataset.rm){
    write("bondi_del_extra",{p_id:+t.dataset.rm}).then(function(){refresh(true)});
  }else if(t.dataset.move){
    openMove(+t.dataset.move);
  }else if(t.dataset.addstop!==undefined){
    openSheet(t.dataset.addstop);
  }else if(t.id==="exAdd"){
    var v=$("exIn").value.trim();if(!v)return;
    write("bondi_add_extra",{p_texto:v}).then(function(){refresh(true)});
  }
});
$("main").addEventListener("input",function(e){
  var id=e.target.dataset.note;if(id===undefined)return;
  var p=find(+id);if(!p)return;
  p.nota=e.target.value;lastW=Date.now();
  clearTimeout(timers[id]);
  timers[id]=setTimeout(function(){write("bondi_update",{p_id:p.id,p_patch:{nota:p.nota}})},600);
});
$("q").addEventListener("input",function(e){qv=e.target.value;render()});
document.querySelectorAll(".tab").forEach(function(b){b.addEventListener("click",function(){
  document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("on")});
  b.classList.add("on");filter=b.dataset.f;render()})});

$("menuBtn").addEventListener("click",function(e){e.stopPropagation();$("menu").hidden=!$("menu").hidden});
document.addEventListener("click",function(e){if(!e.target.closest("#menu"))$("menu").hidden=true});
$("clear").addEventListener("click",function(){
  $("menu").hidden=true;
  if(!confirm("¿Borrar TODOS los datos (pasajeros, marcas, cobros y anotaciones)? No se puede deshacer."))return;
  write("bondi_clear",{}).then(function(){refresh(true)});
});

var sheetPago="P";
function setPago(v){
  sheetPago=v;
  document.querySelectorAll("#fPago button").forEach(function(b){b.classList.toggle("on",b.dataset.pago===v)});
  $("fFalta").hidden=(v!=="D");
}
function openSheet(stop){
  var stops=knownStops(),opts=stops.concat([SIN]);
  $("fPar").innerHTML=opts.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>'}).join("")+'<option value="__new">Otra parada…</option>';
  $("fPar").value=(stop&&opts.indexOf(stop)>=0)?stop:(stops[0]||SIN);
  ["fNom","fParNew","fDni","fTel","fFalta","fCom"].forEach(function(i){$(i).value=""});
  $("fMenor").checked=false;$("fSubio").checked=false;
  setPago("P");parChange();
  $("ov").hidden=false;
  setTimeout(function(){$("fNom").focus()},50);
}
function parChange(){$("fParNew").hidden=($("fPar").value!=="__new")}
$("fPar").addEventListener("change",parChange);
$("fPago").addEventListener("click",function(e){var b=e.target.closest("button");if(b)setPago(b.dataset.pago)});
$("fab").addEventListener("click",function(){openSheet("")});
$("fCancel").addEventListener("click",function(){$("ov").hidden=true});
$("ov").addEventListener("click",function(e){if(e.target.id==="ov")$("ov").hidden=true});
$("fOk").addEventListener("click",function(){
  var nom=$("fNom").value.trim();if(!nom){$("fNom").focus();return}
  var par=$("fPar").value==="__new"?$("fParNew").value.trim():$("fPar").value;
  if(!par){$("fParNew").focus();return}
  var falta=parseInt(($("fFalta").value||"").replace(/[^0-9]/g,""),10)||0;
  var data={nombre:nom,parada:par,dni:$("fDni").value.trim(),telefono:$("fTel").value.trim(),pago:sheetPago,falta:sheetPago==="D"?falta:0,comentario:$("fCom").value.trim(),menor:$("fMenor").checked,subio:$("fSubio").checked};
  $("ov").hidden=true;
  write("bondi_add_pasajero",{p_data:data}).then(function(){refresh(true)});
});

var mvId=0;
function openMove(id){
  mvId=id;
  var stops=knownStops();
  $("mPar").innerHTML=stops.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>'}).join("")+'<option value="__new">Otra parada…</option>';
  $("mPar").value=stops[0]||"__new";$("mParNew").value="";mvChange();
  $("ov2").hidden=false;
}
function mvChange(){$("mParNew").hidden=($("mPar").value!=="__new")}
$("mPar").addEventListener("change",mvChange);
$("mCancel").addEventListener("click",function(){$("ov2").hidden=true});
$("ov2").addEventListener("click",function(e){if(e.target.id==="ov2")$("ov2").hidden=true});
$("mOk").addEventListener("click",function(){
  var v=$("mPar").value==="__new"?$("mParNew").value.trim():$("mPar").value;
  if(!v){$("mParNew").focus();return}
  var p=find(mvId);$("ov2").hidden=true;if(!p)return;
  p.parada=v;render();
  write("bondi_update",{p_id:p.id,p_patch:{parada:v}}).then(function(){refresh(true)});
});

function tryPin(){
  var v=$("pin").value.trim();if(!v)return;
  PIN=v;$("gerr").textContent="Verificando…";
  call("bondi_get").then(function(d){lsSet("bondi-pin",v);$("pin").value="";hideGate();sig=JSON.stringify(d);S=d;render();setStatus("● En vivo")}).catch(function(e){PIN="";$("gerr").textContent=/PIN/i.test(e.message)?"PIN incorrecto":"No se pudo conectar"});
}
$("pinOk").addEventListener("click",tryPin);
$("pin").addEventListener("keydown",function(e){if(e.key==="Enter")tryPin()});

function tc(s){return s.toLowerCase().split(" ").map(function(w){
  if(/^\(|\)$/.test(w))return w.toUpperCase();
  if(w==="y"||w==="de"||w==="del")return w;
  return w.charAt(0).toUpperCase()+w.slice(1)}).join(" ")}
function pdfLines(pdf){
  var out=[],chain=Promise.resolve();
  for(var n=1;n<=pdf.numPages;n++){(function(n){
    chain=chain.then(function(){return pdf.getPage(n)}).then(function(pg){return pg.getTextContent()}).then(function(c){
      var it=c.items.filter(function(i){return i.str&&i.str.trim()}).map(function(i){return{x:i.transform[4],y:i.transform[5],s:i.str}});
      it.sort(function(a,b){return b.y-a.y||a.x-b.x});
      var g=[],cur=null;
      it.forEach(function(i){
        if(!cur||Math.abs(cur.y-i.y)>3){cur={y:i.y,a:[]};g.push(cur)}
        cur.a.push(i)});
      g.forEach(function(r){r.a.sort(function(a,b){return a.x-b.x});out.push(r.a.map(function(i){return i.s}).join(" "))});
    });
  })(n)}
  return chain.then(function(){return out});
}
function parseRec(r){
  var t=r.t.replace(/\s+/g," ").trim();
  var m=t.match(/^(.+?)\s+(\d{7,8})(?=\s|$)\s*(.*)$/);if(!m)return null;
  var nombre=m[1],dni=m[2],rest=m[3];
  var menor=/\(menor\)/i.test(nombre);nombre=nombre.replace(/\(menor\)/i,"").trim();
  var tel="",mt=rest.match(/^(\d{9,12}(?:\s*\(tit\.\))?)\s*(.*)$/i);
  if(mt){tel=mt[1];rest=mt[2]}
  var mp=rest.match(/\b(Pagado|Pendiente)\b\s*(.*)$/i);
  var pago=(mp&&/pendiente/i.test(mp[1]))?"D":"P",com=mp?mp[2]:"";
  var falta=0,mf=com.match(/faltan\s*\$?\s*([\d.,]+)/i);
  if(mf){falta=parseInt(mf[1].replace(/[.,]/g,""),10)||0;com=com.replace(mf[0],"")}
  com=com.replace(/ParqueCentenario/g,"Parque Centenario").replace(/\s+/g," ").trim();
  return{orden:r.orden,nombre:tc(nombre),menor:menor,dni:dni,telefono:tel,parada:r.parada,pago:pago,falta:falta,comentario:com};
}
function parseLines(lines){
  var meta={titulo:"",destino:"",salida:"",lugar:"",total_pdf:0},stop="",recs=[],cur=null,last=0;
  lines.forEach(function(l){
    l=l.replace(/\s+/g," ").trim();if(!l)return;
    var m=l.match(/Destino:\s*(.*?)\s*\|\s*Salida:\s*(.*?)\s*\|\s*Lugar:\s*(.*)$/i);
    if(m){meta.destino=m[1];meta.salida=m[2];meta.lugar=m[3];return}
    if(/Lista de pasajeros/i.test(l)&&!meta.titulo){meta.titulo=l;return}
    m=l.match(/^Total:\s*(\d+)/i);if(m){meta.total_pdf=+m[1];return}
    if(/^Total de la lista|^Generado el|^Hoja \d|^#\s*Subi/i.test(l))return;
    m=l.match(/^PARADA:\s*(.+?)\s*-\s*\d+\s*pasajeros?/i);if(m){stop=tc(m[1]);return}
    m=l.match(/^(\d{1,3})\s+(\D.*)$/);
    if(m&&+m[1]===last+1){last=+m[1];cur={orden:last,parada:stop,t:m[2]};recs.push(cur);return}
    if(cur)cur.t+=" "+l;
  });
  var list=[],bad=0;
  recs.forEach(function(r){var x=parseRec(r);if(x)list.push(x);else bad++});
  return{meta:meta,list:list,bad:bad};
}
var addMode=false;
$("up").addEventListener("click",function(){addMode=false;$("menu").hidden=true;$("file").click()});
$("add").addEventListener("click",function(){addMode=true;$("menu").hidden=true;$("file").click()});
$("file").addEventListener("change",function(e){
  var f=e.target.files[0];e.target.value="";if(!f)return;
  if(typeof pdfjsLib==="undefined"){alert("No se pudo cargar el lector de PDF. Revisá la conexión.");return}
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  setStatus("Leyendo PDF…");
  f.arrayBuffer().then(function(buf){return pdfjsLib.getDocument({data:buf}).promise}).then(pdfLines).then(function(lines){
    var r=parseLines(lines);
    if(!r.list.length){alert("No pude leer pasajeros de ese PDF.");setStatus("● En vivo");return}
    var msg="Se leyeron "+r.list.length+" pasajeros";
    if(r.meta.total_pdf&&r.meta.total_pdf!==r.list.length)msg+=" (el PDF indica "+r.meta.total_pdf+", revisá la lista después)";
    if(r.bad)msg+=". "+r.bad+" no se pudieron leer";
    if(addMode){
      var have={};S.pasajeros.forEach(function(p){have[p.dni]=1});
      var dup=r.list.filter(function(x){return have[x.dni]}).length;
      msg+=". Se suman a los "+S.pasajeros.length+" actuales"+(dup?" (se omiten "+dup+" repetidos por DNI)":"")+".\n\n¿Continuar?";
      if(!confirm(msg)){setStatus("● En vivo");return}
      return write("bondi_append",{p_pasajeros:r.list}).then(function(){return refresh(true)});
    }
    msg+=".\n\nEsto reemplaza la lista del PDF (las personas agregadas a mano se conservan). Las marcas y anotaciones de quienes siguen en la lista (por DNI) se conservan.\n\n¿Continuar?";
    if(!confirm(msg)){setStatus("● En vivo");return}
    return write("bondi_load",{p_meta:r.meta,p_pasajeros:r.list}).then(function(){return refresh(true)});
  }).catch(function(err){alert("No se pudo leer el PDF: "+err.message);setStatus("● En vivo")});
});

if(!PIN)showGate("");else refresh(true);
setInterval(function(){refresh(false)},POLL_MS);
</script>
</body>
</html>
`;

// aca solo va la clave publishable, jamas la service_role
const soloSeguros = (v: string | undefined) => (v || '').replace(/[^A-Za-z0-9_.:/\-]/g, '');
const SB_URL = soloSeguros(process.env.NEXT_PUBLIC_SUPABASE_URL);
const claveRaw = soloSeguros(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

// por las dudas: si alguien pega una clave secreta en esta variable no la sirvo
function esClaveSecreta(k: string): boolean {
  if (k.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(k.split('.')[1] || '', 'base64url').toString());
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

const SB_KEY = esClaveSecreta(claveRaw) ? '' : claveRaw;

export function GET() {
  const htmlFinal = html.replace('__SB_URL__', () => SB_URL).replace('__SB_KEY__', () => SB_KEY);
  return new Response(htmlFinal, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'no-store',
    },
  });
}
