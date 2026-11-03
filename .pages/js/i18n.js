/* One language owner for every page, including late-rendered offers and forms. */
(function () {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const names = {ru:'Русский',en:'English',kk:'Қазақша',tt:'Татарча',uz:'Oʻzbekcha',zh:'中文'};
  const dictionaries = {ru:{}};
  const pending = {};
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const schemas = new Map();
  const seo = document.documentElement.dataset.i18nSeo === 'true';
  const pagePath = document.documentElement.dataset.i18nPath || '';
  const pageRoutes = new Set(window.COUPON_I18N_ROUTES || []);
  const initialLanguage = names[document.documentElement.lang] ? document.documentElement.lang : 'ru';
  const publishedCanonical = document.querySelector('link[rel="canonical"]')?.href;
  const initialSuffix = (initialLanguage === 'ru' ? '' : initialLanguage + '/') + pagePath;
  const publishedRoot = publishedCanonical ? publishedCanonical.slice(0, publishedCanonical.length - initialSuffix.length) : root.href;
  // History changes can add/remove a language directory; keep relative links rooted.
  if(seo && document.querySelector('base'))document.querySelector('base').href=root.href;
  let language = seo ? initialLanguage : 'ru', requested = 0, observer, scheduled = false;
  const excluded = 'script,style,noscript,code,svg,textarea,.lang,.mn,[translate="no"]';
  const attrNames = ['title','aria-label','placeholder','alt'];
  const canonical = value => value === 'kz' ? 'kk' : value;
  const languagePath = (path,target) => (target==='ru'?'':target+'/')+path;
  function languageFromUrl() {
    const segment=location.pathname.slice(root.pathname.length).split('/')[0];
    return names[segment] && segment!=='ru' ? segment : 'ru';
  }
  function localizeUrl(value,target=language,base=document.baseURI) {
    const url=new URL(value,base);
    if(url.origin!==root.origin || !url.pathname.startsWith(root.pathname))return url.href;
    let path=url.pathname.slice(root.pathname.length);
    if(names[path.split('/')[0]] && path.split('/')[0]!=='ru')path=path.slice(path.indexOf('/')+1);
    path=path.replace(/index\.html$/,'');
    if(!pageRoutes.has(path))return url.href;
    url.pathname=root.pathname+languagePath(path,target);
    return url.href;
  }
  function schemaValue(value,key='') {
    if(Array.isArray(value))return value.map(v=>schemaValue(v,key));
    if(value && typeof value==='object') {
      const next=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,schemaValue(v,k)]));
      if(['WebSite','WebPage','Article','BlogPosting'].includes(next['@type']))next.inLanguage=language;
      return next;
    }
    if(typeof value==='string') {
      if(['name','headline','description','text'].includes(key))return translate(value);
      if(['url','item','@id','target'].includes(key) && value.startsWith(publishedRoot)) {
        const path=value.slice(publishedRoot.length);
        return publishedRoot+languagePath(path,language);
      }
    }
    return value;
  }
  // Seed Russian originals before deferred app code can replace the rendered nodes.
  try {
    const seeds=JSON.parse(document.getElementById('i18n-seeds')?.textContent||'{}');
    document.querySelectorAll('[data-i18n-seed]').forEach(el=>{
      const seed=seeds[el.dataset.i18nSeed];if(!seed)return;
      Object.entries(seed.text||{}).forEach(([index,source])=>{
        const node=el.childNodes[Number(index)];
        if(node?.nodeType===Node.TEXT_NODE)originals.set(node,{source,last:node.nodeValue});
      });
      if(seed.attrs)attributes.set(el,Object.fromEntries(Object.entries(seed.attrs).map(([name,source])=>[name,{source,last:el.getAttribute(name)}])));
      if(seed.schema)schemas.set(el,seed.schema);
    });
  } catch(_) {}
  function normalize(text) {
    const values=[];
    const key=String(text).replace(/\s+/g,' ').trim().replace(/\d+(?:[.,]\d+)*/g,n=>'{N'+(values.push(n)-1)+'}');
    return {key,values};
  }
  function translate(text, target=language) {
    const {key,values}=normalize(text);
    const translated=dictionaries[target] && dictionaries[target][key];
    if (translated===undefined) return text;
    const value=translated.replace(/\{N(\d+)\}/g,(_,n)=>values[Number(n)] ?? '');
    return (String(text).match(/^\s*/)||[''])[0]+value+(String(text).match(/\s*$/)||[''])[0];
  }
  function sourceText(node) {
    let record=originals.get(node);
    if (!record || node.nodeValue!==record.last) record={source:node.nodeValue,last:node.nodeValue};
    originals.set(node,record);
    return record;
  }
  function translateAttribute(element,name) {
    const value=element.getAttribute(name);
    if (!value) return;
    let records=attributes.get(element);
    if (!records) {records={};attributes.set(element,records);}
    let record=records[name];
    if (!record || value!==record.last) record={source:value,last:value};
    const next=translate(record.source);
    if(next!==value) element.setAttribute(name,next);
    record.last=next; records[name]=record;
  }
  function observe() {
    if(observer) observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrNames.concat(['content'])});
  }
  function refresh() {
    if(!document.body) return;
    if(observer) observer.disconnect();
    const walk=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walk.nextNode())) {
      if(!node.parentElement || node.parentElement.closest(excluded)) continue;
      const record=sourceText(node), next=translate(record.source);
      if(node.nodeValue!==next) node.nodeValue=next;
      record.last=next;
    }
    document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(el=>{
      if(el.closest('script,style,code,[translate="no"]'))return;
      attrNames.forEach(name=>translateAttribute(el,name));
    });
    document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(el=>translateAttribute(el,'content'));
    const note=document.getElementById('translation-note');
    if(note){note.hidden=language==='ru';note.textContent=translate('Перевод условий выполнен автоматически. Проверьте условия на сайте магазина.');}
    document.documentElement.lang=language;
    document.documentElement.dataset.lang=language;
    document.querySelectorAll('.lang button,.lang a').forEach(button=>{
      const active=canonical(button.dataset.l)===language;
      button.classList.toggle('on',active);
      if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(active));
      if(button.tagName==='A') {
        if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
        const url=new URL(languagePath(pagePath,button.dataset.l),root);url.search=location.search;url.hash=location.hash;button.href=url.href;
      }
    });
    document.querySelectorAll('.lang').forEach(el=>el.setAttribute('aria-label',translate('Выбрать язык')));
    if(seo) {
      const url=publishedRoot+languagePath(pagePath,language);
      document.querySelectorAll('link[rel="canonical"]').forEach(el=>el.href=url);
      document.querySelectorAll('meta[property="og:url"]').forEach(el=>el.content=url);
      document.querySelectorAll('a[href]').forEach(el=>{if(!el.closest('.lang'))el.href=localizeUrl(el.getAttribute('href'));});
      schemas.forEach((source,el)=>{const value=JSON.stringify(schemaValue(source));if(el.textContent!==value)el.textContent=value;});
    }
    // Report titles follow the selected language without changing coupon IDs or links.
    document.querySelectorAll('.report-link').forEach(link=>{
      try {
        const url=new URL(link.href);
        const article=link.closest('[data-id]');
        if(article) {
          url.searchParams.set('title',translate('Купон 1:').replace('1',article.dataset.id)+' '+(article.querySelector('.mn')?.textContent||''));
          url.searchParams.set('body','ID: '+article.dataset.id+'\n'+translate('Опишите проблему и условия применения. Не указывайте персональные данные.'));
          link.href=url.href;
        }
      } catch (_) {}
    });
    observe();
  }
  function schedule() {
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;refresh();});
  }
  function load(target) {
    if(dictionaries[target])return Promise.resolve();
    if(pending[target])return pending[target];
    pending[target]=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const version=(window.COUPON_LOCALE_VERSIONS||{})[target]||'1';
      script.src=new URL('js/locales/'+target+'.js?v='+encodeURIComponent(version),root).href;
      const timer=setTimeout(()=>{script.remove();delete pending[target];reject(new Error('translation_timeout'));},20000);
      script.onload=()=>{clearTimeout(timer);if(dictionaries[target])resolve();else{delete pending[target];reject(new Error('translation_missing'));}};
      script.onerror=()=>{clearTimeout(timer);script.remove();delete pending[target];reject(new Error('translation_load_failed'));};
      document.head.appendChild(script);
    });
    return pending[target];
  }
  async function setLanguage(value,options={}) {
    const target=canonical(value);
    if(!names[target])return false;
    const request=++requested;
    const status=document.getElementById('language-status');
    if(status)status.textContent=translate('Загрузка перевода…');
    try {
      await load(target);
      if(request!==requested)return false;
      language=target;
      if(seo && options.history!=='none') {
        const url=new URL(languagePath(pagePath,target),root);url.search=location.search;url.hash=location.hash;
        if(url.href!==location.href)history[options.history==='replace'?'replaceState':'pushState'](history.state,'',url);
      }
      try{localStorage.setItem('gl_lang',target==='kk'?'kz':target);}catch(_){}
      if(status)status.textContent='';
      refresh();
      window.dispatchEvent(new CustomEvent('coupon-language-change',{detail:{language}}));
      return true;
    } catch(_) {
      if(request===requested && status) status.textContent=translate('Выбранный язык не удалось загрузить. Попробуйте ещё раз.');
      return false;
    }
  }
  function boot() {
    let controls=document.querySelector('.lang');
    if(!controls) {
      controls=document.createElement('div');controls.className='lang';
      const header=document.querySelector('.hdr-in')||document.querySelector('header')||document.body;
      header.appendChild(controls);
    }
    controls.setAttribute('role','group');controls.setAttribute('aria-label','Выбрать язык');controls.removeAttribute('title');
    controls.replaceChildren(...Object.entries(names).map(([code,name])=>{
      const button=document.createElement(seo?'a':'button');
      if(seo){button.href=new URL(languagePath(pagePath,code),root).href;button.hreflang=code;}else button.type='button';
      button.dataset.l=code;button.textContent=name;button.lang=code;return button;
    }));
    const status=document.createElement('span');status.id='language-status';status.setAttribute('role','status');status.className='language-status';controls.after(status);
    document.addEventListener('click',event=>{
      const button=event.target.closest('.lang button,.lang a');
      if(button && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button===0){event.preventDefault();event.stopImmediatePropagation();void setLanguage(button.dataset.l);}
    },true);
    if(!document.getElementById('translation-note')) {
      const note=document.createElement('p');note.id='translation-note';note.className='wrap translation-note';note.setAttribute('translate','no');note.hidden=true;(document.querySelector('main')||document.body).appendChild(note);
    }
    observer=new MutationObserver(schedule);observe();
    let initial;
    try{initial=localStorage.getItem('gl_lang');}catch(_){}
    initial=seo?initialLanguage:canonical(initial||(navigator.language||'ru').split('-')[0].toLowerCase());
    void setLanguage(names[initial]?initial:'ru',{history:'none'});
    window.addEventListener('storage',event=>{if(event.key==='gl_lang')void setLanguage(event.newValue||'ru',{history:'replace'});});
    window.addEventListener('popstate',()=>{if(seo)void setLanguage(languageFromUrl(),{history:'none'});});
  }
  window.CouponI18n={translate,refresh,setLanguage,normalize,localizeUrl,register(code,dict){dictionaries[code]=dict;},get language(){return language;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
