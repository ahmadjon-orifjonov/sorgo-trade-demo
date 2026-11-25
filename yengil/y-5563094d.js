(function(){var f=document.querySelector('.form'),vh=innerHeight;
document.querySelectorAll('.rv').forEach(function(e){if(e.getBoundingClientRect().top<vh)e.classList.add('rv-0');});
if(document.fonts)document.fonts.ready.then(function(){if(scrollY>0)return;document.querySelectorAll('.rv-0').forEach(function(e){if(e.getBoundingClientRect().top>=innerHeight)e.classList.remove('rv-0');});});
document.querySelectorAll('.menu a').forEach(function(a){a.addEventListener('click',function(){var m=a.closest('details');if(m)m.open=false;});});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;var m=document.querySelector('.menu[open]');if(m){m.open=false;m.querySelector('summary').focus();}});
if(!f)return;var mi=f.querySelector('#f-models');
var s=f.querySelector('[data-js]');if(s){s.hidden=false;s.disabled=false;}
document.querySelectorAll('[data-pick]').forEach(function(a){a.addEventListener('click',function(){var v=a.getAttribute('data-pick'),cur=mi.value.split(',').map(function(s){return s.trim();}).filter(Boolean);if(cur.indexOf(v)<0){cur.push(v);mi.value=cur.join(', ');}});});
f.addEventListener('submit',function(e){e.preventDefault();f.querySelector('.form__status').textContent=f.getAttribute('data-ok');f.reset();mi.value=mi.defaultValue;});})();
