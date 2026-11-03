(function(){
'use strict';
const grid=document.getElementById('productGrid'), search=document.getElementById('productSearch'), shop=document.getElementById('shopFilter'), cat=document.getElementById('categoryFilter'), count=document.getElementById('productCount'), more=document.getElementById('showMore'), freshness=document.getElementById('productFreshness');
if(!grid||!search||!shop||!cat||!count||!more)return;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(v);
let rows=[],limit=24,modelLinks={},dataReady=false;
const params=new URLSearchParams(location.search);
if(params.has('q'))search.value=params.get('q');
function render(){
 if(!dataReady)return;
 const q=search.value.trim().toLocaleLowerCase('ru-RU');
 const selected=rows.filter(p=>(!shop.value||p.shop===shop.value)&&(!cat.value||p.category===cat.value)&&(!q||(p.name+' '+p.shop+' '+p.category).toLocaleLowerCase('ru-RU').includes(q)));
 const shown=selected.slice(0,limit);
 grid.innerHTML=shown.map(p=>{
  const detail=modelLinks[p.id],safeDetail=typeof detail==='string'&&/^\/products\/models\/[a-z0-9-]+\/$/.test(detail);
  return '<article class="product-card" data-product-id="'+esc(p.id)+'"><a class="product-photo" href="'+esc(p.url)+'" target="_blank" rel="sponsored nofollow noopener" aria-label="'+esc(p.name)+' — открыть магазин">'+(p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<span>Фото товара</span>')+'</a><div class="product-body"><div class="product-shop">Реклама · '+esc(p.shop)+'</div><h2>'+esc(p.name)+'</h2><div><span class="product-price">'+money(p.price)+' ₽</span>'+(p.oldprice?'<span class="product-old">'+money(p.oldprice)+' ₽</span>':'')+'</div><div class="product-category">'+esc(p.category||'Товары')+'</div><div class="product-buy">'+(safeDetail?'<a class="product-model-link" href="'+esc(detail)+'">Характеристики и выбор →</a>':'')+'<a class="btn" href="'+esc(p.url)+'" target="_blank" rel="sponsored nofollow noopener">В магазин →</a></div></div></article>';
 }).join('');
 count.textContent='Найдено товаров: '+selected.length+' · магазинов: '+new Set(selected.map(p=>p.shop)).size+' · от дорогих к дешёвым';
 more.hidden=shown.length>=selected.length;
}
function freshnessText(meta){
 const date=meta&&meta.imported_at?new Date(meta.imported_at):null;
 let text=date&&Number.isFinite(date.getTime())?'Загрузка партнёрских данных: '+date.toLocaleString('ru-RU',{timeZone:'UTC'})+' UTC. ':'Дата исходной товарной выгрузки неизвестна. ';
 if(date&&Date.now()-date.getTime()>48*3600*1000)text+='Данные старше двух суток. ';
 if(meta&&meta.import_status==='error')text+='Последнее обновление не удалось; сохранена предыдущая подборка. ';
 return text+'Цена и наличие подтверждаются магазином перед заказом.';
}
const load=(url,optional=false)=>fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).catch(error=>{if(optional)return null;throw error;});
Promise.all([load('/data/products.json'),load('/data/products-meta.json',true),load('/data/product-seo-links.json',true)]).then(([data,meta,links])=>{
 rows=(Array.isArray(data)?data:[]).sort((a,b)=>Number(b.price)-Number(a.price)||String(a.id).localeCompare(String(b.id)));
 modelLinks=links&&links.models||{};
 if(freshness&&meta)freshness.textContent=freshnessText(meta);
 [...new Set(rows.map(p=>p.shop).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).forEach(v=>shop.insertAdjacentHTML('beforeend','<option value="'+esc(v)+'">'+esc(v)+'</option>'));
 [...new Set(rows.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).forEach(v=>cat.insertAdjacentHTML('beforeend','<option value="'+esc(v)+'">'+esc(v)+'</option>'));
 if([...shop.options].some(o=>o.value===params.get('shop')))shop.value=params.get('shop');
 if([...cat.options].some(o=>o.value===params.get('category')))cat.value=params.get('category');
 dataReady=true;
 render();
}).catch(()=>{count.textContent='Показана сохранённая подборка. Фильтры временно недоступны; обновите страницу позже.';});
[search,shop,cat].forEach(el=>el.addEventListener('input',()=>{limit=24;render()}));
more.addEventListener('click',()=>{limit+=24;render()});
})();
