/* TWQR : générateur de code QR (ISO/IEC 18004), mode octets, versions 1-40, correction L/M/Q/H. Sans dépendance, fonctionne hors ligne. */
const TWQR=(function(){
"use strict";
const ECC=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
[-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
[-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
const BLK=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
[-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
[-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];
const LV={L:0,M:1,Q:2,H:3},FB=[1,0,3,2];
const bit=(v,i)=>((v>>>i)&1)!==0;
function raw(v){let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r}
function ndata(v,e){return Math.floor(raw(v)/8)-ECC[e][v]*BLK[e][v]}
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z}
function divisor(d){const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1]}root=mul(root,2)}return r}
function rem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=mul(c,f)})}return r}
function utf8(s){return Array.from(new TextEncoder().encode(s))}
function make(text,level){
 const e=LV[level||"M"],bytes=utf8(String(text));let v=1;
 for(;;v++){if(v>40)throw new Error("Texte trop long pour un code QR");const cc=v<10?8:16;if(bytes.length<(1<<cc)&&4+cc+8*bytes.length<=ndata(v,e)*8)break}
 const bits=[],put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
 put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
 const cap=ndata(v,e)*8;put(0,Math.min(4,cap-bits.length));put(0,(8-bits.length%8)%8);
 for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
 const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}
 const nb=BLK[e][v],el=ECC[e][v],rc=Math.floor(raw(v)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb),dv=divisor(el),blocks=[];
 for(let i=0,k=0;i<nb;i++){const d=data.slice(k,k+sl-el+(i<ns?0:1));k+=d.length;const ec=rem(d,dv);if(i<ns)d.push(0);blocks.push(d.concat(ec))}
 const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-el||j>=ns)all.push(b[i])});
 const n=v*4+17,M=[],F=[];for(let i=0;i<n;i++){M.push(new Array(n).fill(false));F.push(new Array(n).fill(false))}
 const sf=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
 for(let i=0;i<n;i++){sf(6,i,i%2===0);sf(i,6,i%2===0)}
 const finder=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<n&&yy>=0&&yy<n)sf(xx,yy,d!==2&&d!==4)}};
 finder(3,3);finder(n-4,3);finder(3,n-4);
 if(v>1){const na=Math.floor(v/7)+2,st=v===32?26:Math.ceil((v*4+4)/(na*2-2))*2,pos=[6];for(let p=n-7;pos.length<na;p-=st)pos.splice(1,0,p);
  for(let i=0;i<na;i++)for(let j=0;j<na;j++){if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)sf(pos[i]+dx,pos[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}}
 const fmt=m=>{const d=(FB[e]<<3)|m;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412;
  for(let i=0;i<=5;i++)sf(8,i,bit(b,i));sf(8,7,bit(b,6));sf(8,8,bit(b,7));sf(7,8,bit(b,8));for(let i=9;i<15;i++)sf(14-i,8,bit(b,i));
  for(let i=0;i<8;i++)sf(n-1-i,8,bit(b,i));for(let i=8;i<15;i++)sf(8,n-15+i,bit(b,i));sf(8,n-8,true)};
 fmt(0);
 if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(v<<12)|r;for(let i=0;i<18;i++){const c=bit(b,i),a=n-11+i%3,q=Math.floor(i/3);sf(a,q,c);sf(q,a,c)}}
 for(let right=n-1,i=0;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<n;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?n-1-vert:vert;if(!F[y][x]&&i<all.length*8){M[y][x]=bit(all[i>>>3],7-(i&7));i++}}}
 const mask=m=>{for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(F[y][x])continue;let k;
  switch(m){case 0:k=(x+y)%2===0;break;case 1:k=y%2===0;break;case 2:k=x%3===0;break;case 3:k=(x+y)%3===0;break;case 4:k=(Math.floor(x/3)+Math.floor(y/2))%2===0;break;case 5:k=x*y%2+x*y%3===0;break;case 6:k=(x*y%2+x*y%3)%2===0;break;default:k=((x+y)%2+x*y%3)%2===0}
  if(k)M[y][x]=!M[y][x]}};
 const PA=[1,0,1,1,1,0,1,0,0,0,0],PB=PA.slice().reverse();
 const penalty=()=>{let p=0,dark=0;
  for(let t=0;t<2;t++){for(let a=0;a<n;a++){const line=[];for(let b=0;b<n;b++)line.push(t?M[b][a]:M[a][b]);
   let run=1;for(let b=1;b<n;b++){if(line[b]===line[b-1]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}
   for(let b=0;b+11<=n;b++){let ma=true,mb=true;for(let k=0;k<11;k++){const c=line[b+k]?1:0;if(c!==PA[k])ma=false;if(c!==PB[k])mb=false}if(ma)p+=40;if(mb)p+=40}}}
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(M[y][x])dark++;if(x<n-1&&y<n-1&&M[y][x]===M[y][x+1]&&M[y][x]===M[y+1][x]&&M[y][x]===M[y+1][x+1])p+=3}
  p+=(Math.ceil(Math.abs(dark*20-n*n*10)/(n*n))-1)*10;return p};
 let best=0,bp=1e9;for(let m=0;m<8;m++){mask(m);fmt(m);const p=penalty();if(p<bp){bp=p;best=m}mask(m)}
 mask(best);fmt(best);
 return{size:n,version:v,mask:best,get:(x,y)=>M[y][x]};
}
/* Chemin SVG : une seule forme pour tous les modules sombres (léger et net à toute taille). */
function path(q,quiet){const z=quiet==null?4:quiet;let d="";for(let y=0;y<q.size;y++){let x=0;while(x<q.size){if(!q.get(x,y)){x++;continue}let s=x;while(x<q.size&&q.get(x,y))x++;d+="M"+(s+z)+" "+(y+z)+"h"+(x-s)+"v1h-"+(x-s)+"z"}}return d}
function svg(q,o){o=o||{};const z=o.quiet==null?4:o.quiet,s=q.size+2*z;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+s+' '+s+'" shape-rendering="crispEdges" role="img"'+(o.label?' aria-label="'+o.label.replace(/"/g,"&quot;")+'"':"")+'><rect width="'+s+'" height="'+s+'" fill="'+(o.bg||"#fff")+'"/><path d="'+path(q,z)+'" fill="'+(o.fg||"#000")+'"/></svg>'}
/* Dessin sur canvas à l'échelle entière (px par module) : net, sans flou, lisible au scanner. */
function draw(ctx,q,X,Y,px,o){o=o||{};const z=o.quiet==null?4:o.quiet;ctx.fillStyle=o.bg||"#fff";ctx.fillRect(X,Y,(q.size+2*z)*px,(q.size+2*z)*px);ctx.fillStyle=o.fg||"#000";
 for(let y=0;y<q.size;y++){let x=0;while(x<q.size){if(!q.get(x,y)){x++;continue}let s=x;while(x<q.size&&q.get(x,y))x++;ctx.fillRect(X+(s+z)*px,Y+(y+z)*px,(x-s)*px,px)}}
 return(q.size+2*z)*px}
return{make,svg,draw,path};
})();

const WA="237656739419",SMSNUM="+237656739419",CARTON=30,MSG="";/* MSG : identifiant de la page ou du profil Messenger (m.me/IDENTIFIANT). Vide = bouton Messenger direct masqué. */
const isAnd=/Android/i.test(navigator.userAgent);
const CAT=[
{n:"Saveur nature",g:"chips",c:"var(--green)",h:"#1f6b2a",p:1000,s:"200 g · 1 000 F le paquet",d:"200 g",x:"nature"},
{n:"Saveur épicée",g:"chips",c:"var(--orange)",h:"#d9791a",p:1000,s:"200 g · 1 000 F le paquet",d:"200 g",x:"épicée"},
{n:"Saveur pimentée",g:"chips",c:"var(--red)",h:"#a8321a",p:1000,s:"200 g · 1 000 F le paquet",d:"200 g",x:"pimentée"},
{n:"Beignets soufflés · 1 000 F",g:"beignets",c:"#a5680d",h:"#a5680d",p:1000,s:"En sachet · 12 sachets de 100 F à l'intérieur · 1 000 F",d:"en sachet · 12 sachets de 100 F",k:12,x:"1000F"},
{n:"Beignets soufflés · 2 000 F",g:"beignets",c:"#a5680d",h:"#a5680d",p:2000,s:"En carton · 24 sachets de 100 F à l'intérieur · 2 000 F",d:"en carton · 24 sachets de 100 F",k:24,x:"2000F"},
{n:"Croquettes · 1 000 F",g:"croquettes",c:"#8a4b12",h:"#8a4b12",p:1000,s:"12 sachets de 100 F à l'intérieur · 1 000 F",d:"12 sachets de 100 F",k:12,x:"1000F"},
{n:"Croquettes · 2 000 F",g:"croquettes",c:"#8a4b12",h:"#8a4b12",p:2000,s:"24 sachets de 100 F à l'intérieur · 2 000 F",d:"24 sachets de 100 F",k:24,x:"2000F"}];
const G={chips:"Chips TAWADOUCE",beignets:"Beignets soufflés",croquettes:"Croquettes"};
const qty=CAT.map(()=>0),fmt=n=>n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g," ")+" F";
const tot=()=>qty.reduce((a,b)=>a+b,0),$=id=>document.getElementById(id),pad=n=>String(n).padStart(2,"0");
const sum=()=>CAT.reduce((a,f,i)=>a+qty[i]*f.p,0),nb=g=>CAT.reduce((a,f,i)=>a+(f.g===g?qty[i]:0),0),sachets=g=>CAT.reduce((a,f,i)=>a+(f.k&&(!g||f.g===g)?f.k*qty[i]:0),0);
const IM=[...document.querySelectorAll(".fl img")].map(x=>x.src).concat([$("bg-i3").src,$("bg-i1").src,$("cq-i1").src,$("cq-i1").src]);
let lastG="";
CAT.forEach((f,i)=>{

const r=document.createElement("div");r.className="row";r.style.setProperty("--c",f.c);
r.innerHTML=`<img src="${IM[i]}" alt=""><div><strong style="color:${f.c}">${f.n}</strong><small>${f.s}</small></div><div class="q"><button aria-label="Moins">−</button><input type="number" min="0" value="0" aria-label="Quantité ${f.n}"><button aria-label="Plus">+</button>${f.g==="chips"?`<button class="ct">+${CARTON}</button>`:""}</div>`;
const[b1,inp,b2,b3]=r.querySelectorAll("button,input");
const set=v=>{qty[i]=Math.max(0,parseInt(v)||0);inp.value=qty[i];draw()};
b1.onclick=()=>set(qty[i]-1);b2.onclick=()=>set(qty[i]+1);if(b3)b3.onclick=()=>set(qty[i]+CARTON);inp.oninput=()=>{qty[i]=Math.max(0,parseInt(inp.value)||0);draw()};
$("rows-"+f.g).appendChild(r)});
const cartons=n=>{const c=Math.floor(n/CARTON),r=n%CARTON;return c+" carton"+(c>1?"s":"")+(r?" + "+r+" paquet"+(r>1?"s":""):"")};
const u=(i,q)=>CAT[i].g==="chips"?q+" paquet"+(q>1?"s":""):q+" format"+(q>1?"s":"")+" de "+fmt(CAT[i].p);
const lots=()=>{const a=[],c=nb("chips");if(c)a.push(c+" paquet"+(c>1?"s":"")+" de chips"+(c>=CARTON?" ("+cartons(c)+")":""));["beignets","croquettes"].forEach(g=>{const b=nb(g);if(b)a.push(b+" format"+(b>1?"s":"")+" de "+g+" ("+sachets(g)+" sachets de 100 F)")});return a.join(" + ")};
const gs=g=>CAT.reduce((a,f,i)=>a+(f.g===g?qty[i]*f.p:0),0);
function draw(){
let h="",ct="";
Object.keys(G).forEach(g=>{const s=gs(g);$("sub-"+g).textContent=fmt(s);if(!nb(g))return;
h+=`<div><dt>${G[g]}</dt><dd>${fmt(s)}</dd></div>`;
ct+=`<div class="cg"><h4>${G[g]}</h4>`+CAT.map((f,i)=>f.g===g&&qty[i]?`<div class="cl"><span>${f.n} × ${qty[i]}</span><b>${fmt(qty[i]*f.p)}</b></div>`:"").join("")+`<div class="cs"><span>Sous-total</span><b>${fmt(s)}</b></div></div>`});
if(!tot()){h="<div><dt>Aucun article choisi</dt><dd></dd></div>";ct='<p class="note">Votre panier est vide. Ajoutez vos produits dans les sections <a href="#cmd-chips">Chips</a>, <a href="#cmd-beignets">Beignets</a> et <a href="#cmd-croquettes">Croquettes</a>.</p>'}
h+=`<div class="tot"><dt>Total</dt><dd>${fmt(sum())}</dd></div>`;$("sum").innerHTML=h;$("cart").innerHTML=ct;badge();flash()}
const now=new Date(),today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;$("date").min=today;
function collect(){
 const err=$("err");err.textContent="";document.querySelectorAll(".bad").forEach(e=>e.classList.remove("bad"));
 if(!tot()){err.textContent="Choisissez au moins un article.";return null}
 const d={};["nom","tel","ville","adr","date","cre","pay","note"].forEach(k=>d[k]=$(k).value.trim());
 const bad=["nom","tel","ville","adr","date","cre","pay"].filter(k=>!d[k]);
 if(d.tel&&d.tel.replace(/\D/g,"").length<8)bad.push("tel");
 if(d.date&&d.date<today)bad.push("date");
 if(bad.length){bad.forEach(k=>$(k).classList.add("bad"));err.textContent="Complétez les champs en rouge (la date ne peut pas être passée).";$(bad[0]).focus();return null}
 return d}
const ref=()=>`TW-${String(now.getFullYear()).slice(2)}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(1000+Math.random()*9000)}`;
const dateFr=s=>new Date(s+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const items=()=>CAT.map((f,i)=>qty[i]?[f,qty[i],i]:null).filter(Boolean);
const plur=q=>q+" paquet"+(q>1?"s":"");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmtM=n=>fmt(n).replace(/ /g,"\u00a0");
const closeThx=()=>{const e=$("thx");if(e)e.remove()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeThx()});
function balloons(){
 if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const old=$("bll");if(old)old.remove();
 const L=document.createElement("div");L.id="bll";L.setAttribute("aria-hidden","true");
 const C=[["#e0a526","#241705"],["#cf6d16","#fff"],["#a8321a","#fff"],["#1f6b2a","#fff"],["#14451c","#fff"]],N=26;
 for(let i=0;i<N;i++){const s=112+Math.random()*44,k=C[i%C.length],x=document.createElement("span");x.className="bl";
  x.innerHTML="<b>TAWADEU</b><i>le goût de la réussite</i>";
  x.style.cssText=`left:calc(${(i+.5)/N*100}% - ${s/2}px);--s:${s}px;--c:${k[0]};--t:${k[1]};--d:${6+Math.random()*3}s;--dl:${Math.random()*3.5}s`;L.appendChild(x)}
 document.body.appendChild(L);setTimeout(()=>L.remove(),13500)}
function overlay(){closeThx();const o=document.createElement("div");o.id="thx";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-labelledby","thxt");return o}
function thanks(d,R,n,canal,again){
 const o=overlay();balloons();const c=document.createElement("div");c.className="thxc";
 c.innerHTML=`<div class="chk"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3 id="thxt">Merci ${esc(d.nom.split(" ")[0])} !</h3><p>Votre commande est prête. Appuyez sur « Envoyer » dans ${canal} pour la valider : nous vous confirmons ensuite la disponibilité, les frais et l'heure de livraison.</p><div class="rcp"><div><span>Référence</span><b>${esc(R)}</b></div><div><span>Total</span><b>${fmt(sum())}</b></div><div><span>Livraison</span><b>${esc(dateFr(d.date))}<br>${esc(d.cre)}</b></div></div><button class="btn g" id="thxok">Fermer</button><button class="retry" id="thxre">Le message ne s'est pas ouvert ? Réessayer</button><p style="margin:14px 0 0;font-size:13px">Merci de votre confiance. TAWADEU : cultivés localement, transformés avec fierté.</p>`;
 o.appendChild(c);document.body.appendChild(o);$("thxok").onclick=closeThx;$("thxre").onclick=again;$("thxok").focus()}
const logoImg=new Image();logoImg.src=document.querySelector(".brand img").src;
const COL=["#1f6b2a","#d9791a","#a8321a"];
async function drawBon(d,R,n){
 try{await logoImg.decode()}catch(e){}
 const W=1080,P=60,H0=3900,c=document.createElement("canvas");c.width=W;c.height=H0;const x=c.getContext("2d");
 const SER='Georgia,"Times New Roman",serif',SAN='"Segoe UI",Roboto,Arial,sans-serif';
 const rr=(X,Y,w,h,r,f)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();x.fillStyle=f;x.fill()};
 const T=(s,X,Y,font,col,al)=>{x.font=font;x.fillStyle=col;x.textAlign=al||"left";x.fillText(s,X,Y)};
 const wrap=(s,font,mw)=>{x.font=font;const out=[];String(s).split("\n").forEach(par=>{let line="";par.split(" ").forEach(w=>{const t=line?line+" "+w:w;if(x.measureText(t).width>mw&&line){out.push(line);line=w}else line=t});out.push(line)});return out};
 x.fillStyle="#fff";x.fillRect(0,0,W,H0);
 const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,"#14451c");g.addColorStop(1,"#1f6b2a");x.fillStyle=g;x.fillRect(0,0,W,230);
 x.fillStyle="#e0a526";x.fillRect(0,230,W,8);
 rr(P,50,130,130,22,"#fff");if(logoImg.naturalWidth)x.drawImage(logoImg,P+8,58,114,114);
 T("TAWADEU",P+160,112,"700 62px "+SER,"#fff");T("Ets Kamite Gourmets",P+162,158,"500 28px "+SAN,"#f3c75b");
 T("FACTURE",W-P,110,"700 40px "+SER,"#fff","right");T("N° "+R,W-P,155,"600 30px "+SAN,"#f3c75b","right");
 T(new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),W-P,198,"500 26px "+SAN,"#dbe8d6","right");
 let y=300;
 const head=t=>{rr(P,y,10,42,5,"#e0a526");T(t,P+30,y+34,"700 38px "+SER,"#1f6b2a");y+=72};
 head("Détail de la commande");
 rr(P,y,W-2*P,56,12,"#f4ead2");T("Article",P+24,y+38,"700 26px "+SAN,"#6b5a45");T("Qté",W-P-300,y+38,"700 26px "+SAN,"#6b5a45","center");T("Montant",W-P-24,y+38,"700 26px "+SAN,"#6b5a45","right");y+=56;
 let lg="";CAT.forEach((f,i)=>{const q=qty[i];if(!q)return;if(f.g!==lg){lg=f.g;x.fillStyle=f.h;x.fillRect(P,y+12,8,32);T(GT[f.g],P+24,y+38,"700 26px "+SAN,f.h);y+=60}x.fillStyle=f.h;x.beginPath();x.arc(P+38,y+36,15,0,7);x.fill();
  T(f.n,P+68,y+46,"600 32px "+SAN,"#22190f");T(fmtM(f.p)+" l'unité · "+f.d,P+68,y+82,"500 24px "+SAN,"#8a7a68");
  T("× "+q,W-P-300,y+46,"700 32px "+SAN,"#22190f","center");T(fmtM(q*f.p),W-P-24,y+46,"700 32px "+SAN,"#22190f","right");
  y+=108;x.fillStyle="#eee3cf";x.fillRect(P,y-1,W-2*P,2);if(!CAT.some((g,j)=>j>i&&qty[j]&&g.g===f.g)){const st=CAT.reduce((a,g,j)=>a+(g.g===f.g?qty[j]*g.p:0),0);rr(P,y+8,W-2*P,56,12,"#f4ead2");T("Sous-total · "+G[f.g],P+24,y+46,"700 26px "+SAN,f.h);T(fmtM(st),W-P-24,y+46,"700 28px "+SAN,f.h,"right");y+=84}});
 y+=24;rr(P,y,W-2*P,112,26,"#14451c");T("Total à payer",P+36,y+70,"700 38px "+SER,"#fff");T(fmtM(sum()),W-P-36,y+74,"700 58px "+SER,"#f3c75b","right");y+=112+36;
 wrap(`${lots()} · prix départ usine, hors frais de livraison`,"500 24px "+SAN,W-2*P).forEach(l=>{T(l,W/2,y,"500 24px "+SAN,"#8a7a68","center");y+=34});y+=30;
 const kv=(k,v)=>{const ls=wrap(v,"600 30px "+SAN,W-P-300-P);T(k,P+10,y+34,"500 26px "+SAN,"#8a7a68");ls.forEach((l,i)=>T(l,P+300,y+34+i*42,"600 30px "+SAN,"#22190f"));y+=ls.length*42+16;x.fillStyle="#f1e8d6";x.fillRect(P,y-8,W-2*P,2)};
 head("Client");kv("Nom",d.nom);kv("Téléphone",d.tel);y+=16;
 head("Livraison");kv("Ville",d.ville);kv("Adresse",d.adr);kv("Date souhaitée",dateFr(d.date));kv("Heure",d.cre);kv("Paiement",d.pay);if(d.note)kv("Remarques",d.note);y+=24;
 {const qt="Bonjour TAWADEU, je vous contacte au sujet de la facture "+R+" ("+fmt(sum())+").",q=TWQR.make(waLink(qt),"M"),mods=q.size+8,px=Math.max(4,Math.floor(300/mods)),S=mods*px,bh=S+56,tx=P+28+S+36,tw=W-P-28-tx;
  const tl=wrap("Ouvrez l'appareil photo de votre téléphone : la conversation WhatsApp avec TAWADEU s'ouvre avec la référence de votre facture.","500 26px "+SAN,tw),th=46+tl.length*36+50;
  rr(P,y,W-2*P,bh,26,"#f4ead2");TWQR.draw(x,q,P+28,y+28,px,{fg:"#14451c",bg:"#fff",quiet:4});
  let ty=y+Math.max(34,(bh-th)/2)+34;T("Scannez pour nous joindre",tx,ty,"700 34px "+SER,"#1f6b2a");ty+=22;tl.forEach(l=>{ty+=36;T(l,tx,ty,"500 26px "+SAN,"#6b5a45")});ty+=52;T("Réf. "+R,tx,ty,"700 30px "+SAN,"#22190f");
  y+=bh+44}
 T("Merci pour votre confiance !",W/2,y+34,"italic 700 40px "+SER,"#1f6b2a","center");y+=84;
 T("656 739 419  ·  650 579 357",W/2,y,"600 28px "+SAN,"#22190f","center");y+=40;
 T("Ets Kamite Gourmets · Ngaoundéré, Cameroun",W/2,y,"500 25px "+SAN,"#8a7a68","center");y+=34;
 T("Facture établie automatiquement · Frais de livraison en sus",W/2,y,"600 25px "+SAN,"#1f6b2a","center");y+=50;
 ["#1f6b2a","#e0a526","#d9791a","#a8321a"].forEach((s,i)=>{x.fillStyle=s;x.fillRect(i*W/4,y,W/4,20)});y+=20;
 const out=document.createElement("canvas");out.width=W;out.height=y;out.getContext("2d").drawImage(c,0,0,W,y,0,0,W,y);return out}
const GE={chips:"🍠",beignets:"🍩",croquettes:"🥨"},GT={chips:"CHIPS TAWADOUCE · 200 g",beignets:"BEIGNETS SOUFFLÉS",croquettes:"CROQUETTES"},LN="━━━━━━━━━━━━━━━━";
function waText(d,R){
const L=["🛍️ *FACTURE · COMMANDE TAWADEU*",LN,"🧾 *Réf.* : "+R,"📅 *Passée le* : "+new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})];
["chips","beignets","croquettes"].forEach(g=>{const its=items().filter(x=>x[0].g===g);if(!its.length)return;
L.push("",GE[g]+" *"+GT[g]+"* · sous-total "+fmtM(its.reduce((a,x)=>a+x[1]*x[0].p,0)));
its.forEach(x=>{const f=x[0],q=x[1];L.push(f.g==="chips"?`▪️ ${f.n} : ${q} paquet${q>1?"s":""} → *${fmtM(q*f.p)}*`:`▪️ Format ${fmt(f.p)} · ${f.d} × ${q} → *${fmtM(q*f.p)}*`)})});
L.push("",LN,"💰 *TOTAL : "+fmtM(sum())+"*","📦 "+lots(),"_Prix départ usine, hors frais de livraison_",LN,
"👤 *CLIENT*","• Nom : "+d.nom,"• Tél : "+d.tel,"","🚚 *LIVRAISON*","📍 Ville : "+d.ville,"🏠 Adresse : "+d.adr,"🗓️ Date souhaitée : "+dateFr(d.date),"🕗 Heure : "+d.cre,"💳 Paiement : "+d.pay);
if(d.note)L.push("📝 Remarques : "+d.note);
L.push(LN,"✅ _Merci de confirmer la disponibilité, les frais et l'heure de livraison._","🌿 _TAWADEU · Ets Kamite Gourmets · De la ferme à la table_");
return L.join("\n")}
async function bon(d,R,n,text){
 const cv=await drawBon(d,R,n),url=cv.toDataURL("image/png"),blob=await new Promise(r=>cv.toBlob(r,"image/png"));
 const file=new File([blob],"facture-tawadeu-"+R+".png",{type:"image/png"});
 const o=overlay(),c=document.createElement("div");c.className="thxc";
 c.innerHTML=`<h3 id="thxt">Votre facture globale</h3><p id="bmsg">Vérifiez votre facture, puis choisissez l'application pour l'envoyer à TAWADEU (656 739 419). Votre commande est déjà rédigée.</p><img class="bonimg" src="${url}" alt="FACTURE ${esc(R)}"><button class="btn wa" id="bshare">Envoyer sur WhatsApp</button>${isAnd?'<button class="btn wb" id="bbiz">Envoyer sur WhatsApp Business</button>':''}${MSG?'<button class="btn ms" id="bmsgr">Envoyer sur Messenger</button>':''}<button class="btn ms" id="bimg">Messenger ou autre application (avec l'image)</button><button class="btn alt" id="bcopy">Copier le message</button><button class="btn alt" id="bdl">Télécharger la facture (image)</button><p style="font-size:13px;margin:0 0 6px">Les boutons WhatsApp ouvrent directement la conversation avec TAWADEU, message déjà rédigé. Le bouton « Messenger ou autre application » partage l'image de la facture et le message : vous choisissez l'application, puis TAWADEU.</p><button class="retry" id="thxok">Modifier ma commande</button>`;
 o.appendChild(c);document.body.appendChild(o);
 const done=m=>{$("thxt").textContent="Merci "+d.nom.split(" ")[0]+" !";$("bmsg").textContent=m||"Appuyez sur « Envoyer » dans WhatsApp pour valider. Nous vous confirmons ensuite la disponibilité, les frais et l'heure de livraison.";if(!$("bll"))balloons()};
 const dl=()=>{const a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove()};
 const wa=t=>window.open("https://wa.me/"+WA+"?text="+encodeURIComponent(t),"_blank");
 $("bdl").onclick=dl;$("thxok").onclick=closeThx;
 const note=m=>{$("bmsg").textContent=m};
 const copy=async t=>{try{await navigator.clipboard.writeText(t);return true}catch(e){try{const ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;opacity:0";document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok}catch(e2){return false}}};
 $("bshare").onclick=()=>{wa(text);done()};
 if($("bbiz"))$("bbiz").onclick=()=>{const q=encodeURIComponent(text);location.href="intent://send?phone="+WA+"&text="+q+"#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url="+encodeURIComponent("https://wa.me/"+WA+"?text="+q)+";end";done()};
 if($("bmsgr"))$("bmsgr").onclick=async()=>{await copy(text);window.open("https://m.me/"+MSG,"_blank");done("Le message est copié : collez-le dans la conversation Messenger avec TAWADEU, puis envoyez.")};
 $("bimg").onclick=async()=>{
  await copy(text);
  try{
   if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Commande TAWADEU "+R,text:text});done("Choisissez Messenger, WhatsApp ou l'application de votre choix, puis TAWADEU (656 739 419). Le message est aussi copié : collez-le si le texte n'apparaît pas.");return}
   if(navigator.share){await navigator.share({title:"Commande TAWADEU "+R,text:text});done("Choisissez l'application, puis TAWADEU (656 739 419). Le message est aussi copié.");return}
  }catch(e){if(e&&e.name==="AbortError")return}
  note("Le message est copié. Ouvrez Messenger (ou l'application de votre choix), collez-le, et joignez la facture téléchargée si vous le souhaitez.")};
 $("bcopy").onclick=async()=>note(await copy(text)?"Message copié. Collez-le dans WhatsApp, WhatsApp Business, Messenger ou toute autre application.":"La copie n'a pas fonctionné sur cet appareil.")}
$("send").onclick=async()=>{const d=collect();if(!d)return;const n=tot(),R=ref();
const t=waText(d,R);
await bon(d,R,n,t)};
$("sms").onclick=()=>{const d=collect();if(!d)return;const n=tot(),R=ref();
const t=`COMMANDE TAWADEU ${R}\n${items().map(x=>({chips:"Chips ",beignets:"Beignets ",croquettes:"Croquettes "}[x[0].g])+x[0].x+" x"+x[1]).join(", ")}\nTotal : ${lots()} = ${fmtM(sum())} (départ usine)\nNom : ${d.nom}\nTél : ${d.tel}\nLivraison : ${d.ville}, ${d.adr}\nLe : ${dateFr(d.date)}, ${d.cre}\nPaiement : ${d.pay}${d.note?"\nNote : "+d.note:""}`;
const go=()=>{location.href="sms:"+SMSNUM+"?&body="+encodeURIComponent(t)};go();thanks(d,R,n,"vos SMS",go)};
draw();

/* ===== Codes QR (Contacts + facture) ===== */
const QRC="#14451c";
const waLink=t=>"https://wa.me/"+WA+(t?"?text="+encodeURIComponent(t):"");
function qrPoster(text,title,sub){
 const W=1080,c=document.createElement("canvas");c.width=W;c.height=1800;const x=c.getContext("2d");
 const SER='Georgia,"Times New Roman",serif',SAN='"Segoe UI",Roboto,Arial,sans-serif';
 const rr=(X,Y,w,h,r,f)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();x.fillStyle=f;x.fill()};
 const T=(s,X,Y,f,col,al)=>{x.font=f;x.fillStyle=col;x.textAlign=al||"center";x.fillText(s,X,Y)};
 const wrap=(s,f,mw)=>{x.font=f;const o=[];let l="";s.split(" ").forEach(w=>{const t=l?l+" "+w:w;if(x.measureText(t).width>mw&&l){o.push(l);l=w}else l=t});o.push(l);return o};
 x.fillStyle="#fff";x.fillRect(0,0,W,1800);
 const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,"#14451c");g.addColorStop(1,"#1f6b2a");x.fillStyle=g;x.fillRect(0,0,W,230);x.fillStyle="#e0a526";x.fillRect(0,230,W,8);
 rr(60,50,130,130,22,"#fff");if(logoImg.naturalWidth)x.drawImage(logoImg,68,58,114,114);
 T("TAWADEU",220,112,"700 62px "+SER,"#fff","left");T("Ets Kamite Gourmets",222,158,"500 28px "+SAN,"#f3c75b","left");
 let y=345;T(title,W/2,y,"700 62px "+SER,"#1f6b2a");y+=30;
 wrap(sub,"500 34px "+SAN,W-200).forEach(l=>{y+=48;T(l,W/2,y,"500 34px "+SAN,"#6b5a45")});
 const q=TWQR.make(text,"M"),mods=q.size+8,px=Math.max(4,Math.floor(760/mods)),S=mods*px,X=Math.round((W-S)/2),Y=y+60;
 rr(X-14,Y-14,S+28,S+28,30,"#e0a526");rr(X-7,Y-7,S+14,S+14,24,"#fff");TWQR.draw(x,q,X,Y,px,{fg:QRC,bg:"#fff",quiet:4});
 y=Y+S+96;T("Scannez avec l'appareil photo de votre téléphone",W/2,y,"700 36px "+SAN,"#22190f");
 y+=60;T("656 739 419  ·  650 579 357",W/2,y,"600 30px "+SAN,"#22190f");
 y+=44;T("Ets Kamite Gourmets · Ngaoundéré, Cameroun",W/2,y,"500 26px "+SAN,"#8a7a68");
 y+=50;["#1f6b2a","#e0a526","#d9791a","#a8321a"].forEach((s,i)=>{x.fillStyle=s;x.fillRect(i*W/4,y,W/4,20)});y+=20;
 const o=document.createElement("canvas");o.width=W;o.height=y;o.getContext("2d").drawImage(c,0,0,W,y,0,0,W,y);return o}
function qrSave(cv,name){cv.toBlob(b=>{const a=document.createElement("a"),u=URL.createObjectURL(b);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)},"image/png")}
(function(){
 const cards=[
  {id:"wa",text:waLink("Bonjour TAWADEU, je souhaite avoir des informations."),label:"Code QR : écrire à TAWADEU sur WhatsApp",title:"Écrivez-nous sur WhatsApp",sub:"Scannez le code : votre message est déjà prêt.",file:"qr-tawadeu-whatsapp.png"},
  {id:"site",text:/^https?:/i.test(location.href)?location.href.split("#")[0]:"",label:"Code QR : ouvrir le site TAWADEU",title:"Retrouvez TAWADEU en ligne",sub:"Scannez le code pour ouvrir notre site et commander.",file:"qr-tawadeu-site.png"}];
 cards.forEach(k=>{
  if(!k.text)return;
  try{
   const q=TWQR.make(k.text,"M");$("qt-"+k.id).innerHTML=TWQR.svg(q,{fg:QRC,bg:"#fff",quiet:4,label:k.label});
   $("qc-"+k.id).hidden=false;
   $("qd-"+k.id).onclick=()=>qrSave(qrPoster(k.text,k.title,k.sub),k.file)
  }catch(e){}
 });
 const o=$("qo-wa");if(o)o.href=cards[0].text;
})();

/* ===== Pages ===== */
function noMotion(){return matchMedia("(prefers-reduced-motion:reduce)").matches}
function anim(el,kf,o){if(!el||!el.animate||noMotion())return;el.animate(kf,o)}
function bump(el,k){anim(el,[{transform:"scale(1)"},{transform:"scale("+(k||1.25)+")",offset:.4},{transform:"scale(1)"}],{duration:380,easing:"ease-out"})}
function fabsUpdate(){const c=$("fab-cart"),t=$("fab-top");if(c)c.hidden=!(tot()>0&&curPg!=="commander");if(t)t.hidden=(window.scrollY||0)<500}
function badge(){const n=tot(),p=window.__n||0;document.querySelectorAll(".bdg").forEach(b=>{b.textContent=n;b.hidden=!n;if(n&&n!==p)bump(b,1.45)});if(n>p)bump($("fab-cart"),1.18);window.__n=n;fabsUpdate()}
function flash(){const L=window.__ls=window.__ls||{};["chips","beignets","croquettes"].forEach(g=>{const el=$("sub-"+g);if(el&&L[g]!==el.textContent){if(L[g]!==undefined)bump(el,1.3);L[g]=el.textContent}});const t=document.querySelector("#sum .tot dd");if(t){const v=t.textContent;if(L.t!==undefined&&L.t!==v)bump(t,1.25);L.t=v}}
document.querySelectorAll("[data-from]").forEach(i=>{i.src=$(i.dataset.from).src});
const PGS=["accueil","produits","contacts","commander","apropos"],ALIAS={contact:"contacts"},
TT={accueil:"TAWADEU – Chips TAWADOUCE, beignets soufflés et croquettes | Ets Kamite Gourmets",produits:"Nos produits – TAWADEU | Ets Kamite Gourmets",contacts:"Contacts – TAWADEU | Ets Kamite Gourmets",commander:"Commander – TAWADEU | Ets Kamite Gourmets",apropos:"À propos et notre histoire – TAWADEU | Ets Kamite Gourmets"};
var curPg="";
function show(name,el){
 const changed=name!==curPg;curPg=name;fabsUpdate();
 PGS.forEach(p=>$("pg-"+p).classList.toggle("on",p===name));
 document.querySelectorAll("[data-nav]").forEach(a=>{const on=a.dataset.nav===name;a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
 document.title=TT[name];
 if(el)el.scrollIntoView({behavior:changed?"auto":"smooth",block:"start"});else window.scrollTo({top:0,left:0,behavior:"auto"});
}
function route(){
 let h="";try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}
 h=ALIAS[h]||h||"accueil";
 if(PGS.includes(h))return show(h);
 const el=$(h),pg=el&&el.closest(".pg");
 if(pg)show(pg.id.slice(3),el);else show("accueil");
}
addEventListener("hashchange",route);
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(a&&a.getAttribute("href")===location.hash){e.preventDefault();route()}});

/* ===== Animations au clic ===== */
const CLK=".btn,button,.fab,.chipnav a,.tabs a";
document.addEventListener("pointerdown",e=>{
 const b=e.target.closest&&e.target.closest(CLK+",.tz");
 if(!b||b.disabled)return;
 const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,sp=document.createElement("span");
 sp.className="rpl";sp.style.cssText="width:"+d+"px;height:"+d+"px;left:"+(e.clientX-r.left-d/2)+"px;top:"+(e.clientY-r.top-d/2)+"px";
 b.appendChild(sp);
 const a=sp.animate([{transform:"scale(0)",opacity:.38},{transform:"scale(1)",opacity:0}],{duration:650,easing:"ease-out"});a.onfinish=()=>sp.remove();
});
const EMO=["🎉","🥳","🎊","✨","🎉","🥳","🎈"];
function burst(x,y,n){
 window.__emo=window.__emo||0;if(window.__emo>150)return;
 for(let i=0;i<n;i++){
  const el=document.createElement("span");el.className="emo";el.textContent=EMO[i%EMO.length];
  const lx=((i+Math.random())/n)*100;
  el.style.cssText="left:"+lx+"%;bottom:-60px;font-size:"+(24+Math.random()*22)+"px";
  document.body.appendChild(el);window.__emo++;
  const sw=(Math.random()-.5)*160,rot=(Math.random()-.5)*540;
  const a=el.animate([
   {transform:"translate(0,0) rotate(0deg)",opacity:1},
   {transform:"translate("+sw+"px,-55vh) rotate("+rot/2+"deg)",opacity:1,offset:.55},
   {transform:"translate("+(-sw/2)+"px,-115vh) rotate("+rot+"deg)",opacity:.9}
  ],{duration:2600+Math.random()*1400,delay:Math.random()*700,easing:"cubic-bezier(.35,.1,.6,.9)",fill:"backwards"});
  a.onfinish=()=>{el.remove();window.__emo--};
 }
}
document.addEventListener("click",e=>{
 const b=e.target.closest&&e.target.closest(CLK+",.tz,nav ul a");
 if(!b)return;
 const r=b.getBoundingClientRect(),x=e.clientX||r.left+r.width/2,y=e.clientY||r.top+r.height/2;
 if(b.animate)b.animate([{transform:"scale(.88)"},{transform:"scale(1.1)",offset:.5},{transform:"scale(1)"}],{duration:420,easing:"ease-out"});
 const sv=b.closest(".tabs")&&b.querySelector("svg");
 if(sv)sv.animate([{transform:"scale(1) translateY(0) rotate(0deg)"},{transform:"scale(1.7) translateY(-12px) rotate(-14deg)",offset:.4},{transform:"scale(1) translateY(0) rotate(0deg)"}],{duration:560,easing:"cubic-bezier(.3,1.6,.5,1)"});
 if(b.closest(".q")){const i=b.parentNode.querySelector("input");if(i)bump(i,1.35)}
 burst(x,y,b.closest(".q")?16:34);
});
$("fab-top").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
addEventListener("scroll",fabsUpdate,{passive:true});
fabsUpdate();
badge();route();
