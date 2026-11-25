(function(){var f=document.querySelector('.form');
document.querySelectorAll('.menu a').forEach(function(a){a.addEventListener('click',function(){var m=a.closest('details');if(m)m.open=false;});});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;var m=document.querySelector('.menu[open]');if(m){m.open=false;m.querySelector('summary').focus();}});
if(!f)return;
var s=f.querySelector('[data-js]');if(s){s.hidden=false;s.disabled=false;}
var bx=[].slice.call(f.querySelectorAll('input[type=checkbox]')),df=bx.map(function(c){return c.defaultChecked;});
document.querySelectorAll('[data-pick]').forEach(function(a){a.addEventListener('click',function(){var c=f.querySelector('input[value="'+a.getAttribute('data-pick')+'"]');if(c)c.checked=true;});});
f.addEventListener('submit',function(e){e.preventDefault();f.querySelector('.form__status').textContent=f.getAttribute('data-ok');f.reset();bx.forEach(function(c,i){c.checked=df[i];});});})();
