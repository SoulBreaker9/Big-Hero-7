(async()=>{
await document.fonts.ready;
const result=[];
for(const page of document.querySelectorAll('.page')){
 const base=page.getBoundingClientRect(),items=[];
 const box=r=>({x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height});
 function visit(el){
  const s=getComputedStyle(el),r=el.getBoundingClientRect(),b=box(r);
  if(s.display==='none'||r.width===0||r.height===0)return;
  if(el!==page&&s.backgroundColor!=='rgba(0, 0, 0, 0)')items.push({type:'rect',...b,color:s.backgroundColor});
  if(s.backgroundImage!=='none')items.push({type:'gradient',...b,css:s.backgroundImage});
  for(const side of ['Top','Bottom','Left','Right']){const w=parseFloat(s['border'+side+'Width']);if(w){const horizontal=['Top','Bottom'].includes(side);items.push({type:'rect',x:b.x+(side==='Right'?b.w-w:0),y:b.y+(side==='Bottom'?b.h-w:0),w:horizontal?b.w:w,h:horizontal?w:b.h,color:s['border'+side+'Color']});}}
  if(el.tagName==='IMG'){items.push({type:'image',...b,src:el.getAttribute('src'),fit:s.objectFit});return;}
  if(el.tagName.toLowerCase()==='svg'){items.push({type:'svg',...b,html:el.outerHTML});return;}
  for(const node of el.childNodes){
   if(node.nodeType===1){visit(node);continue;}
   if(node.nodeType!==3||!node.textContent.trim())continue;
   const text=node.textContent,lines=[];let last=null;
   for(let i=0;i<text.length;i++){
    const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const cr=range.getBoundingClientRect();
    if(!cr.width&&!cr.height)continue;
    if(!last||Math.abs(last.top-cr.top)>2){last={top:cr.top,x:cr.x,y:cr.y,w:cr.width,h:cr.height,t:text[i]};lines.push(last);}else{last.t+=text[i];last.w=Math.max(last.w,cr.right-last.x);last.h=Math.max(last.h,cr.height);}
   }
   for(const l of lines){let t=l.t.replace(/\s+/g,' ');if(!t.trim())continue;if(s.textTransform==='uppercase')t=t.toUpperCase();items.push({type:'text',x:l.x-base.x,y:l.y-base.y,w:l.w,h:l.h,text:t,size:parseFloat(s.fontSize),weight:parseInt(s.fontWeight),stretch:parseFloat(s.fontStretch)||100,color:s.color,family:s.fontFamily,spacing:parseFloat(s.letterSpacing)||0,href:el.closest('a')?.href});}
  }
 }
 visit(page);result.push({title:page.dataset.label,notes:page.dataset.speakerNotes,background:getComputedStyle(page).backgroundColor,items});
}
document.body.innerHTML='<pre id="layout">'+JSON.stringify(result).replaceAll('&','&amp;').replaceAll('<','&lt;')+'</pre>';
})();
