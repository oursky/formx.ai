/* FormX.ai Clark: use case pages only. Run once after the page has rendered. */
/* 9. Menu toggle (use case pages only) */
(function(){var h=document.querySelector('header.nv'),b=h&&h.querySelector('.nv-burger');if(!b||!h.querySelector('.uc-links'))return;
b.addEventListener('click',function(){var o=!h.hasAttribute('data-open');o?h.setAttribute('data-open',''):h.removeAttribute('data-open');b.setAttribute('aria-expanded',o?'true':'false');});
h.querySelectorAll('.nv-panel a,.nv-cta a').forEach(function(a){a.addEventListener('click',function(){h.removeAttribute('data-open');b.setAttribute('aria-expanded','false');});});})();
/* 11. Mobile workflow: measure the cards so each keeps fixed padding */
(function(){var mq=window.matchMedia('(max-width:760px)');
function fit(){document.querySelectorAll('.ifx').forEach(function(x){var c=x.querySelectorAll('.ib');if(!mq.matches||c.length<4){['--y1','--y2','--d1','--d2','--ct','--ifx-h'].forEach(function(v){x.style.removeProperty(v)});return;}
var h=[].map.call(c,function(e){return e.offsetHeight}),t=[].map.call(c,function(e){return e.offsetTop}),gap=t[1]-t[0]-h[0];
x.style.setProperty('--y1',(t[1]-t[0])+'px');x.style.setProperty('--y2',(t[2]-t[0])+'px');
x.style.setProperty('--d1',(h[1]-h[0])+'px');x.style.setProperty('--d2',(h[2]-h[0])+'px');
x.style.setProperty('--ct',(40+h[0]+gap+20)+'px');
x.style.setProperty('--ifx-h',(40+Math.max(h[0]+h[1],h[1]+h[2],h[2]+h[3])+gap+40)+'px');});}
fit();window.addEventListener('resize',fit);if(document.fonts)document.fonts.ready.then(fit);setTimeout(fit,300);})();

