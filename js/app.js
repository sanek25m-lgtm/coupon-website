(function(){
var DATA=[], VIEW=[], PER=24, page=1, dataReady=false;
var state={q:'',cat:'',type:'',sort:'rel',merchant:'',favorites:location.hash==='#fav'};
// Render canonical source copy; CouponI18n owns language across all pages.
var lang='ru';
/* Базовый путь текущей страницы: работает и на localhost, и на GitHub Pages в подпапке,
   и при открытии файла двойным кликом (file://). */
var BASE = new URL('../', document.currentScript.src).pathname;
var SITE = new URL('../', document.currentScript.src).href.replace(/\/$/, '');

function t(k){return ({get:{ru:'Получить →',en:'Get →',kz:'Алу →',tt:'Алу →',uz:'Olish →',zh:'领取 →'},until:{ru:'до',en:'until',kz:'дейін',tt:'чак',uz:'muddati',zh:'至'},dead:{ru:'Истёк',en:'Expired',kz:'Мерзімі бітті',tt:'Вакыты беткән',uz:'Muddati tugagan',zh:'已过期'},all:{ru:'Все',en:'All',kz:'Барлығы',tt:'Барысы',uz:'Barchasi',zh:'全部'},found:{ru:'Найдено',en:'Found',kz:'Табылды',tt:'Табылды',uz:'Topildi',zh:'已找到'},nores:{ru:'Ничего не найдено',en:'Nothing found',kz:'Ештеңе табылмады',tt:'Берни табылмады',uz:'Hech narsa topilmadi',zh:'未找到'}}[k]||{ru:k})[lang]||({ru:k})[lang]||k;}

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function hash(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function disc(name){var m=String(name||'').match(/(\d{1,3})\s*%/);if(!m)return 0;var d=+m[1];return d>99?99:d}
function dmy(iso){if(!iso)return'';var p=String(iso).slice(0,10).split('-');return p.length==3?p[2]+'.'+p[1]+'.'+p[0]:iso}
function daysLeft(iso){if(!iso)return 999;return Math.ceil((couponExpiry(iso)-Date.now())/864e5)}

function favs(){try{return JSON.parse(localStorage.getItem('gl_fav')||'[]')}catch(e){return[]}}
function setFavs(a){localStorage.setItem('gl_fav',JSON.stringify(a));var n=document.getElementById('favN');if(n)n.textContent=a.length}

// Фича 1: Таймер
function timerBadge(end){
  if(!end)return'';var l=daysLeft(end);
  if(l<=1)return' <span class="timer-badge urgent">⏰ '+l+' дн.</span>';
  if(l<=7)return' <span class="timer-badge">⏳ '+l+' дн.</span>';
  return'';
}

// Фича 2: Конфетти
function launchConfetti(){
  var box=document.createElement('div');box.className='confetti-box';
  var colors=['#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#ec4899'];
  for(var i=0;i<30;i++){var p=document.createElement('div');p.className='confetti-piece';
    p.style.left=Math.random()*100+'%';p.style.top='-10px';
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDelay=(Math.random()*0.3)+'s';box.appendChild(p);}
  document.body.appendChild(box);setTimeout(function(){box.remove()},1500);
}

// Фича 4: Голоса
function getVotes(){try{return JSON.parse(localStorage.getItem('gl_votes')||'{}')}catch(e){return{}}}

var UI = {
    ru: { search_ph: 'Поиск магазина или купона…', search_ph2: 'Поиск по магазину…', city_lbl: 'Город', fav_lbl: 'Избранное',
      hero_pre: 'Купоны и промокоды', hero_post: 'магазинов — скидки сегодня', hero_p: 'Проверяем наличие и срок действия каждого купона. Делимся кодом в один клик.',
      sort_rel: 'По актуальности', sort_disc: 'Скидка ↓', sort_end: 'Срок ↑', sort_rate: 'Рейтинг ↓',
      type_all: 'Все', type_code: 'Промокод', type_link: 'Ссылка', only_active: 'Только активные',
      seo_h: 'Как мы проверяем купоны', pop_stores: 'Популярные магазины', pop_cats: 'Популярные категории',
      cookie_txt: 'Мы используем cookie, чтобы сайт работал удобнее. Продолжая пользоваться сайтом, вы соглашаетесь с политикой конфиденциальности.', cookie_ok: 'Принять',
      top_h: 'Топ скидок и новинки', top_p: 'Самые крупные скидки или только что добавленные купоны.', s_new: 'Новые', cat_h: 'Каталог магазинов и категорий', f_cookies: 'Cookie', f_ski: 'Скидки', f_new: 'Новые', f_cat: 'Каталог', f_about: 'О проекте', f_contacts: 'Контакты', f_privacy: 'Конфиденциальность', f_terms: 'Условия',
      cp: '© 2026 Купонатор. Прямая ответственность рекламодателей.', cp_short: '© 2026 Купонатор.',
      seo1: 'Каждый купон проверяется по дате окончания: просроченные автоматически удаляются из выдачи. Клик по «Получить →» ведёт на сайт партнёра; промокод активируется в корзине.',
      disc: 'Информация о скидках предоставлена партнёрами и носит справочный характер. 16+. Рекламодатели несут ответственность за содержание акций.',
      title: 'Купонатор — купоны и промокоды на скидки сегодня', desc: 'Актуальные купоны и промокоды магазинов: скидки, бесплатная доставка, промокоды на первый заказ. Проверено сегодня.' },
    en: { search_ph: 'Search a store or a coupon…', search_ph2: 'Search in this store…', city_lbl: 'City', fav_lbl: 'Favorites',
      hero_pre: 'Coupons & promo codes of', hero_post: 'stores — today\'s discounts', hero_p: 'We check availability and expiry date of every coupon. One click to the store.',
      sort_rel: 'Relevance', sort_disc: 'Discount ↓', sort_end: 'Expiry ↑', sort_rate: 'Rating ↓',
      type_all: 'All', type_code: 'Promo code', type_link: 'Link', only_active: 'Active only',
      seo_h: 'How we verify coupons', pop_stores: 'Popular stores', pop_cats: 'Popular categories',
      cookie_txt: 'We use cookies to make the site work better. By continuing you accept the privacy policy.', cookie_ok: 'Accept',
      top_h: 'Top discounts & new deals', top_p: 'Biggest discounts or freshly added coupons.', s_new: 'New', cat_h: 'Store & category catalog', f_cookies: 'Cookies', f_ski: 'Discounts', f_new: 'New', f_cat: 'Catalog', f_about: 'About', f_contacts: 'Contacts', f_privacy: 'Privacy', f_terms: 'Terms',
      cp: '© 2026 Kuponator. Advertisers are responsible for offer content.', cp_short: '© 2026 Kuponator.',
      seo1: 'Every coupon is checked by expiry date; expired offers are removed automatically. "Get →" opens the partner store, the promo code applies in the cart.',
      disc: 'Discount information is provided by partners and is indicative. Advertisers are responsible for offer content.',
      title: 'Kuponator — coupons and promo codes for today\'s discounts', desc: 'Fresh store coupons and promo codes: discounts, free shipping, first-order codes. Verified today.' },
    kz: { search_ph: 'Дүкен немесе купон іздеу…', search_ph2: 'Осы дүкеннен іздеу…', city_lbl: 'Қала', fav_lbl: 'Таңдаулылар',
      hero_pre: 'Купондар мен промокодтар', hero_post: 'дүкен — бүгінгі жеңілдіктер', hero_p: 'Әр купонның бар болуы мен мерзімін тексереміз. Бір басумен дүкенге өтіңіз.',
      sort_rel: 'Өзектілік', sort_disc: 'Жеңілдік ↓', sort_end: 'Мерзім ↑', sort_rate: 'Рейтинг ↓',
      type_all: 'Барлығы', type_code: 'Промокод', type_link: 'Сілтеме', only_active: 'Белсенді ғана',
      seo_h: 'Купондарды қалай тексереміз', pop_stores: 'Танымал дүкендер', pop_cats: 'Танымал санаттар',
      cookie_txt: 'Сайт ыңғайлы жұмыс істеуі үшін cookie пайдаланамыз. Жалғастыру арқылы құпиялық саясатымен келісесіз.', cookie_ok: 'Қабылдау',
      top_h: 'Үздік жеңілдіктер мен жаңалар', top_p: 'Ең үлкен жеңілдіктер немесе жаңа қосылған купондар.', s_new: 'Жаңалар', cat_h: 'Дүкендер мен санаттар каталогі', f_cookies: 'Cookie', f_ski: 'Жеңілдіктер', f_new: 'Жаңалар', f_cat: 'Каталог', f_about: 'Жоба туралы', f_contacts: 'Байланыс', f_privacy: 'Құпиялық', f_terms: 'Шарттар',
      cp: '© 2026 Kuponator. Жарнама берушілер акция мазмұнына жауап береді.', cp_short: '© 2026 Kuponator.',
      seo1: 'Әр купон мерзімі бойынша тексеріледі; мерзімі біткендер автоматты түрде алынады. «Алу →» серіктес дүкенін ашады, промокод себетте белсенеді.',
      disc: 'Деректер ашық серіктестік фидтерінен алынған. Жарнама берушілер акция мазмұнына жауап береді.',
      title: 'Kuponator — бүгінгі жеңілдік купондары мен промокодтары', desc: 'Дүкендердің өзекті купондары мен промокодтары: жеңілдіктер, тегін жеткізу.' },
    tt: { search_ph: 'Кибет яки купон эзләгез…', search_ph2: 'Бу кибәттән эзләү…', city_lbl: 'Шәһәр', fav_lbl: 'Сакланганнар',
      hero_pre: 'Купоннар һәм промокодлар', hero_post: 'кибет — бүгенге ташламалар', hero_p: 'Һәр купонның булуын һәм яраклылык вакытын тикшерәбез. Бер басып дүкәнгә күчегез.',
      sort_rel: 'Актуальлек', sort_disc: 'Ташлама ↓', sort_end: 'Вакыт ↑', sort_rate: 'Бәя ↓',
      type_all: 'Барысы', type_code: 'Промокод', type_link: 'Сылтама', only_active: 'Активлар гына',
      seo_h: 'Купоннарны ничек тикшерәбез', pop_stores: 'Популяр кибетләр', pop_cats: 'Популяр категорияләр',
      cookie_txt: 'Сайт уңайлы эшләсен өчен cookie кулланабыз. Дәвам итеп, сез хосусыйлык сәясәте белән килешәсез.', cookie_ok: 'Кабул итәм',
      f_ski: 'Ташламалар', f_new: 'Яңалар', f_cat: 'Каталог', f_about: 'Проект турында', f_contacts: 'Элемтә', f_privacy: 'Хосусыйлык', f_terms: 'Шартлар', f_cookies: 'Cookie',
      top_h: 'Иң яхшы ташламалар һәм яңалыклар', top_p: 'Иң зур ташламалар яки яңа өстәлгән купоннар.', s_new: 'Яңалар', cat_h: 'Кибетләр һәм категорияләр каталогы',
      cp: '© 2026 Купонатор. Реклама бирүчеләр эчтәлек өчен җаваплы.', cp_short: '© 2026 Купонатор.',
      seo1: 'Һәр купон вакыты буенча тикшерелә; вакыты беткәннәр автоматик рәвештә алына. «Алу →» партнёр кибетен ача, промокод себәптә активлаша.',
      disc: 'Мәгълүмат ачык серіктестік фидларыннан алынган. Реклама бирүчеләр җавап бирә.',
      title: 'Купонатор — бүгенге ташламалар өчен купоннар һәм промокодлар', desc: 'Кибетләрнең үзгәртмә купоннары һәм промокодлары.' },
    uz: { search_ph: 'Doʻkon yoki kupon qidiring…', search_ph2: 'Shu doʻkondan qidirish…', city_lbl: 'Shahar', fav_lbl: 'Sarlanganlar',
      hero_pre: 'Kuponlar va promokodlar ·', hero_post: 'doʻkon — bugungi chegirmalar', hero_p: 'Har bir kuponning mavjudligi va amal qilish muddatini tekshiramiz. Bir bosishda doʻkonga oʻting.',
      sort_rel: 'Dolzarblik', sort_disc: 'Chegirma ↓', sort_end: 'Muddat ↑', sort_rate: 'Reyting ↓',
      type_all: 'Barchasi', type_code: 'Promokod', type_link: 'Havola', only_active: 'Faqat faol',
      seo_h: 'Kuponlarni qanday tekshiramiz', pop_stores: 'Mashhur doʻkonlar', pop_cats: 'Mashhur kategoriyalar',
      cookie_txt: 'Sayt qulay ishlashi uchun cookie ishlatamiz. Davom etarak, maxfiylik siyosati bilan rozilik bildirasiz.', cookie_ok: 'Qabul qilish',
      f_ski: 'Chegirmalar', f_new: 'Yangi', f_cat: 'Katalog', f_about: 'Loyiha haqida', f_contacts: 'Aloqa', f_privacy: 'Maxfiylik', f_terms: 'Shartlar', f_cookies: 'Cookie',
      top_h: 'Eng yaxshi chegirmalar va yangiliklar', top_p: 'Eng katta chegirmalar yoki endigina qoʻshilgan kuponlar.', s_new: 'Yangi', cat_h: 'Doʻkonlar va kategoriyalar katalogi',
      cp: '© 2026 Kuponator. Reklamachilar kontent uchun javobgar.', cp_short: '© 2026 Kuponator.',
      seo1: 'Har bir kupon muddati boʻyicha tekshiriladi; muddati tugaganlari avtomatik olib tashlanadi. «Olish →» hamkor doʻkonini ochadi, promokod savatda faollashadi.',
      disc: 'Maʼlumotlar ochiq hamkorlik fidlaridan olingan. Reklamachilar javobgar.',
      title: 'Kuponator — bugungi chegirmalar uchun kupon va promokodlar', desc: 'Doʻkonlarning dolzarb kuponlari va promokodlari.' },
    zh: { search_ph: '搜索商店或优惠券…', search_ph2: '在本店搜索…', city_lbl: '城市', fav_lbl: '收藏',
      hero_pre: '优惠券与促销码 ·', hero_post: '家商店 — 今日折扣', hero_p: '我们逐一核验优惠券的有效性与截止日期，一键直达商店。',
      sort_rel: '综合排序', sort_disc: '折扣 ↓', sort_end: '到期 ↑', sort_rate: '评分 ↓',
      type_all: '全部', type_code: '优惠码', type_link: '链接', only_active: '仅看有效',
      seo_h: '我们如何核验优惠券', pop_stores: '热门商店', pop_cats: '热门分类',
      cookie_txt: '我们使用 Cookie 以提供更好的体验。继续浏览即表示您同意隐私政策。', cookie_ok: '接受',
      f_ski: '折扣', f_new: '最新', f_cat: '目录', f_about: '关于我们', f_contacts: '联系我们', f_privacy: '隐私', f_terms: '条款', f_cookies: 'Cookie',
      top_h: '热门折扣与最新优惠', top_p: '最大折扣或最新添加的优惠券。', s_new: '最新', cat_h: '商店与分类目录',
      cp: '© 2026 Kuponator。广告主对其内容负责。', cp_short: '© 2026 Kuponator.',
      seo1: '每张优惠券均按截止日期核验，过期优惠自动下架。点击「领取」将跳转至合作商家，促销码在购物车中生效。',
      disc: '数据来自公开的合作推广源，广告主对其内容负责。',
      title: 'Kuponator — 今日折扣优惠券与促销码', desc: '各商店的最新优惠券与促销码。' }
  };

  /* переводы категорий фида: RU-ключ -> {lang: name} */
  var CATS = {
    en: { 'Образование': 'Education', 'Путешествия, туризм': 'Travel & Tourism', 'Одежда, обувь и аксессуары': 'Clothing, Shoes & Accessories', 'Досуг и развлечения': 'Leisure & Entertainment', 'Электроника и фото': 'Electronics & Photo', 'Услуги': 'Services', 'Продукты, напитки, табак': 'Groceries, Drinks & Tobacco', 'Аптека': 'Pharmacy', 'Красота и здоровье': 'Beauty & Health', 'Доставка еды': 'Food Delivery', 'Скидки и акции': 'Deals & Promotions', 'Бытовая техника': 'Home Appliances', 'Все для дома': 'Home Essentials', 'Строительство и ремонт': 'Construction & Renovation', 'Подарки, сувениры, цветы': 'Gifts, Souvenirs & Flowers', 'Авто, мото': 'Auto & Moto', 'Животные и растения': 'Pets & Plants', 'Книги': 'Books', 'Питание': 'Food & Dining', 'Все для офиса': 'Office Essentials', 'Промышленная техника': 'Industrial Equipment', 'Товары для детей': "Kids' Goods", 'Мебель': 'Furniture' },
    kz: { 'Образование': 'Білім', 'Путешествия, туризм': 'Саяхат, туризм', 'Одежда, обувь и аксессуары': 'Киім, аяқкиім мен аксессуарлар', 'Досуг и развлечения': 'Бос уақыт және ойын-сауық', 'Электроника и фото': 'Электроника және фототехника', 'Услуги': 'Қызметтер', 'Продукты, напитки, табак': 'Азық-түлік, сусындар, темекі', 'Аптека': 'Дәріхана', 'Красота и здоровье': 'Сұлулық және денсаулық', 'Доставка еды': 'Тағам жеткізу', 'Скидки и акции': 'Жеңілдіктер мен акциялар', 'Бытовая техника': 'Тұрмыстық техника', 'Все для дома': 'Үйге қажетті заттар', 'Строительство и ремонт': 'Құрылыс және жөндеу', 'Подарки, сувениры, цветы': 'Сыйлықтар, сыйға тарту гүлдер', 'Авто, мото': 'Авто және мото', 'Животные и растения': 'Жануарлар мен өсімдіктер', 'Книги': 'Кітаптар', 'Питание': 'Тамақтану', 'Все для офиса': 'Кеңсеге қажетті', 'Промышленная техника': 'Өнеркәсіптік жабдықтар', 'Товары для детей': 'Балалар тауарлары', 'Мебель': 'Жиһаз' },
    tt: { 'Образование': 'Белем', 'Путешествия, туризм': 'Сәяхәт, туризм', 'Одежда, обувь и аксессуары': 'Кийем, аякчы һәм аксессуарлар', 'Досуг и развлечения': 'Курултыш һәм күңел ачу', 'Электроника и фото': 'Электроника һәм фото', 'Услуги': 'Хизмәтләр', 'Продукты, напитки, табак': 'Азык-төлек, эчемлекләр, тәмәке', 'Аптека': 'Емешханә', 'Красота и здоровье': 'Матурлык һәм сәламәтлек', 'Доставка еды': 'Азык-төлек җиткерү', 'Скидки и акции': 'Ташламалар һәм акцияләр', 'Бытовая техника': 'Көнкүреш техникасе', 'Все для дома': 'Өй өчен кирәкле әйберләр', 'Строительство и ремонт': 'Төзелеш һәм ремонт', 'Подарки, сувениры, цветы': 'Бүләкләр, истәлекләр, чәчәкләр', 'Авто, мото': 'Авто һәм мото', 'Животные и растения': 'Хайваннар һәм үсемлекләр', 'Книги': 'Китаплар', 'Питание': 'Туклану', 'Все для офиса': 'Офис өчен кирәкле әйберләр', 'Промышленная техника': 'Сәнәгать җиһазлары', 'Товары для детей': 'Балалар тауарлары', 'Мебель': 'Мебель' },
    uz: { 'Образование': 'Taʼlim', 'Путешествия, туризм': 'Sayohat va turizm', 'Одежда, обувь и аксессуары': 'Kiyim, poyabzal va aksessuarlar', 'Досуг и развлечения': 'Dam olish va koʻngilochar', 'Электроника и фото': 'Elektronika va foto', 'Услуги': 'Xizmatlar', 'Продукты, напитки, табак': 'Oziq-ovqat, ichimliklar, tamaki', 'Аптека': 'Dorixona', 'Красота и здоровье': 'Goʻzallik va salomatlik', 'Доставка еды': 'Ovqat yetkazib berish', 'Скидки и акции': 'Chegirmalar va aksiyalar', 'Бытовая техника': 'Maishiy texnika', 'Все для дома': 'Uy uchun hamma narsa', 'Строительство и ремонт': 'Qurilish va taʼmirlash', 'Подарки, сувениры, цветы': 'Sovgʻalar, esdaliklar, gullar', 'Авто, мото': 'Avto va moto', 'Животные и растения': 'Hayvonlar va oʻsimliklar', 'Книги': 'Kitoblar', 'Питание': 'Ovqatlanish', 'Все для офиса': 'Ofis uchun hamma narsa', 'Промышленная техника': 'Sanoat uskunasi', 'Товары для детей': 'Bolalar tovarlari', 'Мебель': 'Mebel' },
    zh: { 'Образование': '教育', 'Путешествия, туризм': '旅行与旅游', 'Одежда, обувь и аксессуары': '服装鞋履配饰', 'Досуг и развлечения': '休闲娱乐', 'Электроника и фото': '电子与摄影', 'Услуги': '服务', 'Продукты, напитки, табак': '食品饮品烟草', 'Аптека': '药店', 'Красота и здоровье': '美容健康', 'Доставка еды': '外卖配送', 'Скидки и акции': '折扣促销', 'Бытовая техника': '家用电器', 'Все для дома': '家居用品', 'Строительство и ремонт': '建筑装修', 'Подарки, сувениры, цветы': '礼品纪念品鲜花', 'Авто, мото': '汽车摩托', 'Животные и растения': '宠物与植物', 'Книги': '图书', 'Питание': '餐饮美食', 'Все для офиса': '办公用品', 'Промышленная техника': '工业设备', 'Товары для детей': '儿童用品', 'Мебель': '家具' }
  };
  
function catName(cat) { if (!cat) return ''; var m = CATS[lang]; return (m && m[cat]) || cat; }
function applyLang() {
    // Only interface controls are translated; the offer feed remains Russian.

    var d = UI[lang] || UI.ru;

    document.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.getAttribute('data-i18n'); if (d[k]) el.textContent = d[k]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { var k = el.getAttribute('data-i18n-ph'); if (d[k]) el.placeholder = d[k]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { var k = el.getAttribute('data-i18n-aria'); if (d[k]) el.setAttribute('aria-label', d[k]); });
    var notices = {ru:'Условия и сроки предоставлены партнёрским фидом. Перед оплатой проверьте применение скидки в корзине.',en:'Terms and dates come from the affiliate feed. Confirm the discount in your cart before paying.',kz:'Шарттар мен мерзімдер серіктес деректерінен алынады. Төлем алдында себеттегі жеңілдікті тексеріңіз.',tt:'Шартлар һәм вакытлар партнёр мәгълүматыннан алына. Түләү алдыннан ташламаны кәрзиндә тикшерегез.',uz:"Shartlar va muddatlar hamkor manbasidan olinadi. To'lovdan oldin savatdagi chegirmani tekshiring.",zh:'条件和有效期来自合作数据源。付款前请确认购物车中的折扣。'};
    var notice=notices[lang]||notices.ru;
    var s1 = document.getElementById('seo1'); if (s1) s1.textContent = notice;
    document.querySelectorAll('[data-i18n="hero_p"]').forEach(function(el){el.textContent=notice;});
    var ds = document.getElementById('disc'); if (ds) ds.textContent = d.disc || '';
    if (window.onLangChange) window.onLangChange(lang);
    if (DATA.length) { cats(); seo(); draw(); storeHead(); if(document.getElementById('grid')&&document.getElementById('dealOfDay')) renderDealOfDay(); }
  }


// Фича 7: Скелетон
function showSkeleton(){var g=document.getElementById('grid');if(!g||g.querySelector('.card'))return;var s='';for(var i=0;i<8;i++)s+='<div class="skel-card"></div>';g.innerHTML=s;}

// Карточка
function card(c){
  var d=disc(c.name),left=daysLeft(c.end),dead=c.end&&left<0;
  var label=couponDiscountLabel(c),description=couponDescription(c);
  var letter=esc((c.merchant||'?').replace(/^www\./,'')[0]||'?').toUpperCase();
  var logo=c.logo?'<img src="'+esc(c.logo)+'" alt="" loading="lazy" onerror="this.remove()">':letter;
  var h='<article id="coupon-'+esc(c.id)+'" class="card'+(dead?' dead':'')+'" data-id="'+esc(c.id)+'">';
  if(left>=0&&left<=7)h+='<span class="tt2">🔥 Истекает</span>';
  else if(dead)h+='<span class="tt2">'+t('dead')+'</span>';
  h+='<div class="ctop"><div class="lg">'+logo+'</div><div style="flex:1;min-width:0">'
    +'<a class="mn" href="'+esc(merchantUrl(c.merchant))+'">'+esc(c.merchant)+'</a>'
    +'<div class="rate">'+(c.cat?' <span>'+esc(catName(c.cat))+'</span>':'')+timerBadge(c.end)+'<span class="stars-b">'+t('until')+' '+dmy(c.end)+'</span></div>'
    +'</div><button class="fav'+(favs().indexOf(c.id)>=0?' on':'')+'" data-fav="'+esc(c.id)+'" aria-label="В избранное">★</button></div>';
  h+='<h3 style="margin:0;font-size:16px;line-height:1.35">'+esc(c.name)+'</h3>';
  if(description)h+='<p style="margin:0;font-size:13px;color:var(--mut)">'+esc(description)+'</p>';
  h+='<div class="meta">'+(label?'<span class="badge">'+esc(label)+'</span>':'')+'<span>'+esc(couponOfferKind(c))+'</span></div>';
  h+=couponTools(c);
  h+='<div class="act"><a class="btn" href="'+esc(c.urlc||c.url)+'" target="_blank" rel="sponsored nofollow noopener">'+t('get')+'</a></div>';
  return h+'</article>';
}

// Фильтрация + сортировка
function apply(){
  if(!dataReady)return;
  var q=state.q.toLowerCase(), saved=favs();
  VIEW=DATA.filter(function(c){
    if(state.favorites&&saved.indexOf(+c.id)<0)return false;
    if(state.merchant&&c.merchant!==state.merchant)return false;
    if(state.cat&&c.cat!==state.cat)return false;
    if(!couponIsActive(c))return false;
    if(state.type==='code'&&!c.code)return false;
    if(state.type==='link'&&c.code)return false;
    var haystack=c.name+' '+c.desc+' '+c.merchant+' '+c.cat;
    if(window.CouponI18n)haystack+=' '+[c.name,c.desc,c.cat].map(function(value){return window.CouponI18n.translate(value||'')}).join(' ');
    if(q&&haystack.toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  VIEW.sort(function(a,b){
    if(state.sort==='disc')return disc(b.name)-disc(a.name);
    if(state.sort==='end')return(a.end||'9999')<(b.end||'9999')?-1:1;
    if(state.sort==='new')return(b.start||'')<(a.start||'')?-1:1;
    return String(a.end||'9999').localeCompare(String(b.end||'9999')) || String(a.id).localeCompare(String(b.id));
  });
  page=1;draw();cats();seo();
}

function draw(){
  if(!dataReady)return;
  var g=document.getElementById('grid');if(!g)return;
  var pages=Math.max(1,Math.ceil(VIEW.length/PER)),slice=VIEW.slice((page-1)*PER,page*PER);
  var resEl=document.getElementById('res');if(!resEl){g.innerHTML=slice.map(card).join('');return}
  resEl.textContent=(state.favorites?'Избранное · ': '')+t('found')+' '+VIEW.length+(pages>1?' · стр.'+page:'');
  g.innerHTML=slice.length?slice.map(card).join(''):'<p role="status" style="grid-column:1/-1;color:var(--mut)">'+(state.favorites&&!favs().length?'В избранном пока нет предложений. Нажмите ★ на нужной карточке.':t('nores'))+'</p>';
  var pg=document.getElementById('pg'),ph='';
  for(var i=1;i<=Math.min(pages,12);i++)ph+='<button data-p="'+i+'" class="'+(i==page?'on':'')+'">'+i+'</button>';
  if(pages>1){ph+='<button data-p="'+(page<pages?page+1:pages)+'">›</button>'}
  if(pg)pg.innerHTML=pages>1?ph:'';
}

function cats(){
  var nav=document.getElementById('cats');if(!nav)return;
  var m={};DATA.forEach(function(c){if(c.cat)m[c.cat]=(m[c.cat]||0)+1});
  var keys=Object.keys(m).sort(function(a,b){return m[b]-m[a]}).slice(0,16);
  nav.innerHTML='<a href="'+BASE+'" class="'+(!state.cat?'on':'')+'">'+t('all')+'</a>'+keys.map(function(k){return'<a href="'+esc(categoryUrl(k))+'" class="'+(state.cat==k?'on':'')+'">'+esc(catName(k))+' <b>'+m[k]+'</b></a>'}).join('');
}

function renderHomeSeo(){
  if(!DATA.length)return;
  var top=DATA.slice(0,15).map(function(c,i){return{'@type':'ListItem','position':i+1,'name':c.name+(c.merchant?' — '+c.merchant:'')}});
  var il={'@context':'https://schema.org','@type':'ItemList','itemListElement':top};
  var tag=document.getElementById('__home_ld');
  if(!tag){tag=document.createElement('script');tag.id='__home_ld';tag.type='application/ld+json';document.head.appendChild(tag);}
  tag.textContent=JSON.stringify(il);
}
function seo(){
  var mer={},cm={};DATA.forEach(function(c){mer[c.merchant]=(mer[c.merchant]||0)+1;if(c.cat)cm[c.cat]=(cm[c.cat]||0)+1});
  var h=document.getElementById('heroN');if(h)h.textContent=String(Object.keys(mer).length);
  var top=Object.keys(mer).sort(function(a,b){return a.localeCompare(b,'ru')});
  var ml=document.getElementById('merList');if(ml)ml.innerHTML=top.map(function(k){return '<a href="'+esc(merchantUrl(k))+'">'+esc(k)+' <b>'+mer[k]+'</b></a>'}).join('');
  var cl=document.getElementById('catList');if(cl)cl.innerHTML=Object.keys(cm).sort(function(a,b){return cm[b]-cm[a]}).map(function(k){return '<a href="'+esc(categoryUrl(k))+'">'+esc(catName(k))+' <b>'+cm[k]+'</b></a>'}).join('');
}

// Фича 3: Купон дня
function renderDealOfDay(){
  if(!DATA.length)return;
  var dayOfYear=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/864e5);
  var deal=DATA[dayOfYear%DATA.length];
  var el=document.getElementById('dealOfDay');
  if(!el){el=document.createElement('div');el.id='dealOfDay';el.className='deal-of-day';
    var main=document.getElementById('main'),hero=main&&main.querySelector('.hero');
    if(hero&&hero.nextSibling)main.insertBefore(el,hero.nextSibling);else return;}
  el.innerHTML='<span class="badge-dod">⭐ Купон дня</span>'
    +'<h3>'+esc(deal.name)+'</h3>'
    +'<div class="dod-merch">'+esc(deal.merchant)+(disc(deal.name)?' · −'+disc(deal.name)+'%':'')+'</div>'
    +'<button class="btn" data-goto="'+esc(deal.urlc||deal.url)+'">'+t('get')+'</button>';
}

// Фича 9: Топ-популярное

// Фича 11: Алерт истекающих избранностей
function renderExpireAlert(){
  var fav=favs();if(!fav.length)return;
  var soon=DATA.filter(function(c){return fav.indexOf(c.id)>=0&&daysLeft(c.end)>0&&daysLeft(c.end)<=3});
  if(!soon.length)return;
  var el=document.createElement('div');el.className='expire-alert';
  el.innerHTML='<span class="icon">🔔</span><strong>Избранное</strong> <span>🔥 Истекает</span> '+soon.map(function(c){return '<span>'+esc(c.name)+'</span> <span>⏳ '+daysLeft(c.end)+' дн.</span>'}).join(', ');
  var grid=document.getElementById('grid');if(grid)grid.parentNode.insertBefore(el,grid);
}

// Режим магазина (store.html) + SEO: title/description/canonical/JSON-LD
var STORE_SEO_T = {ru:'Купоны и промокоды',en:'Coupons & promo codes',kz:'Купондар мен промокодтар',tt:'Купоннар һәм промокодлар',uz:'Kuponlar va promokodlar',zh:'优惠券与促销码'};
var STORE_SEO_S = {ru:'актуальные купоны и промокоды, скидки сегодня. Проверено.',en:'current coupons and promo codes, today\'s discounts. Verified.',kz:'өзекті купондар мен промокодтар, бүгінгі жеңілдіктер.',tt:'үзәклекле купоннар һәм промокодлар, бүгенге ташламалар.',uz:'dolzarb kuponlar va promokodlar, bugungi chegirmalar.',zh:'最新优惠券与促销码，今日折扣。'};
function storeHead(){
  var mh=document.getElementById('mhead');if(!mh)return;
  if(document.body.dataset.staticPage)return;
  var list=DATA.filter(function(c){return c.merchant===state.merchant});
  var name=state.merchant||'';
  var mt=document.getElementById('mtitle');if(mt)mt.innerHTML='<span>Акции без промокода</span> — <span translate="no">'+esc(name)+'</span>';
  var ms=document.getElementById('msub');
  if(ms)ms.innerHTML='<span>Найдено '+list.length+'</span>'+(list[0]&&list[0].cat?' · <span>'+esc(catName(list[0].cat))+'</span>':'');
  var lg=document.getElementById('mlogo');
  if(lg&&list[0]&&list[0].logo)lg.innerHTML='<img src="'+esc(list[0].logo)+'" alt="" onerror="this.remove()">';
  // --- SEO для страницы магазина ---
  document.title=(window.CouponI18n?window.CouponI18n.translate('Акции без промокода'):'Акции без промокода')+' — '+name+' — Kuponator';
  var md=document.querySelector('meta[name="description"]');
  if(md)md.setAttribute('content',window.CouponI18n?window.CouponI18n.translate('Условия и сроки предоставлены партнёрским фидом. Перед оплатой проверьте применение скидки в корзине.'):'Условия и сроки предоставлены партнёрским фидом. Перед оплатой проверьте применение скидки в корзине.');
  var mc=document.querySelector('link[rel="canonical"]');
  if(!mc){mc=document.createElement('link');mc.rel='canonical';document.head.appendChild(mc);}
  mc.setAttribute('href',merchantUrl(name));
  // JSON-LD: Organization + ItemList
  var ld={};
  try{ld=JSON.parse(document.getElementById('__seo_ld')?document.getElementById('__seo_ld').textContent:'{}');}catch(e){}
  var org={'@context':'https://schema.org','@type':'Organization','name':name,'url':SITE+'/store.html?merchant='+encodeURIComponent(name)};
  if(list[0]&&list[0].logo)org.logo=list[0].logo;
  var il={'@context':'https://schema.org','@type':'ItemList','itemListElement':list.slice(0,20).map(function(c,i){return{'@type':'ListItem','position':i+1,'name':c.name}})};
  var tag=document.getElementById('__store_ld');
  if(!tag){tag=document.createElement('script');tag.id='__store_ld';tag.type='application/ld+json';document.head.appendChild(tag);}
  tag.textContent=JSON.stringify([org,il]);
}

// Toast
function toast(m){var el=document.getElementById('tt');if(!el)return;el.textContent=m;el.classList.add('on');setTimeout(function(){el.classList.remove('on')},2500)}

// BOOT
function boot(){
  var up=new URLSearchParams(location.search);
  state.q=state.favorites?'':up.get('q')||'';
  if(/\/top\.html$/.test(location.pathname))state.sort='disc';
  if(document.getElementById('q'))document.getElementById('q').value=state.q;
  var hasListing=!!(document.getElementById('grid')||document.getElementById('merList'));
  applyLang();
  showSkeleton();
  var embedded=document.getElementById('page-coupons');
  var loading=!hasListing?Promise.resolve([]):embedded?Promise.resolve(JSON.parse(embedded.textContent)):fetch(BASE+'data/browser-coupons.json').then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()});
  loading.then(function(rows){
    if(!hasListing)return;
    DATA=rows.filter(couponForSite);setFavs(favs());
    dataReady=true;
    if(document.body.dataset.staticPage)PER=Math.max(24,DATA.length);
    if(up.get('cat'))state.cat=up.get('cat');
    state.cat=document.body.dataset.category||state.cat;
    if(document.getElementById('mhead'))state.merchant=document.body.dataset.merchant||up.get('merchant')||'';
    if(/\/store\.html$/.test(location.pathname)){
      var route=(window.COUPON_ROUTES.stores||{})[state.merchant];
      if(route){var target=new URL(route,couponSiteRoot);var params=new URLSearchParams(location.search);params.delete('merchant');target.search=params.toString();target.hash=location.hash;location.replace(window.CouponI18n?CouponI18n.localizeUrl(target.href):target.href);return;}
      var noindex=document.createElement('meta');noindex.name='robots';noindex.content='noindex';document.head.appendChild(noindex);
    }
    if(up.get('s')){state.sort=up.get('s');document.querySelectorAll('#sortChips button').forEach(function(x){x.classList.toggle('on',x.dataset.s===state.sort)})}
    apply();storeHead();if(!document.getElementById('mhead'))renderHomeSeo();applyLang();
    if(document.getElementById('grid')){if(!document.body.dataset.staticPage)renderDealOfDay();renderExpireAlert();}
  }).catch(function(e){var r=document.getElementById('res');if(r)r.textContent='Ошибка загрузки предложений. Обновите страницу.'});

  // Обработчики
  var q=document.getElementById('q');
  if(q)q.addEventListener('input',function(){state.q=q.value;apply()});
  document.querySelectorAll('#sortChips button').forEach(function(b){b.onclick=function(){document.querySelectorAll('#sortChips button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');state.sort=b.dataset.s;apply()}});
  document.querySelectorAll('#typeChips button').forEach(function(b){b.onclick=function(){document.querySelectorAll('#typeChips button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');state.type=b.dataset.t;apply()}});

  document.addEventListener('click',function(e){
    var conditionLink=e.target.closest('[data-coupon-jump]');
    if(conditionLink&&document.body.dataset.staticPage){
      state.q='';state.type='';state.cat=document.body.dataset.category||'';
      var query=document.getElementById('q');if(query)query.value='';
      apply();
    }
    var vb=e.target.closest('[data-vote]');if(vb){var v=getVotes();v[+vb.dataset.vid]=vb.dataset.vote;localStorage.setItem('gl_votes',JSON.stringify(v));vb.parentElement.querySelectorAll('.vote-btn').forEach(function(b){b.classList.remove('on-up','on-dn')});vb.classList.add(vb.dataset.vote==='up'?'on-up':'on-dn');return}
    var g=e.target.closest('[data-goto]');if(g){window.open(g.dataset.goto,'_blank','noopener');return}
    var lb=e.target.closest('.lang button');if(lb){lang=lb.dataset.l;localStorage.setItem('gl_lang',lang);applyLang();return}
    var f=e.target.closest('[data-fav]');if(f){var id=+f.dataset.fav,a=favs(),i=a.indexOf(id);i<0?a.push(id):a.splice(i,1);setFavs(a);if(state.favorites)apply();else f.classList.toggle('on',i<0);return}
    var p=e.target.closest('[data-p]');if(p){page=+p.dataset.p;draw();window.scrollTo(0,0);return}
    var c=e.target.closest('[data-cat]');if(c){state.cat=c.dataset.cat;apply()}
  });

  // Тема
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#themeToggle')){
      var th=localStorage.getItem('gl_theme')==='dark'?'light':'dark';
      localStorage.setItem('gl_theme',th);
      if(th==='dark')document.documentElement.setAttribute('data-theme','dark');else document.documentElement.removeAttribute('data-theme');
    }
  });

  // Cookie
  var ck=document.getElementById('cookie'),ok=document.getElementById('cookieOk');
  if(ck&&!localStorage.getItem('gl_cookie')){ck.classList.add('on');if(ok)ok.onclick=function(){localStorage.setItem('gl_cookie','1');ck.remove()}}
}

window.addEventListener('hashchange',function(){
  state.favorites=location.hash==='#fav';
  if(state.favorites){state.q='';state.cat='';state.type='';var q=document.getElementById('q');if(q)q.value='';}
  apply();
});
window.addEventListener('coupon-language-change',function(){if(state.q)apply();storeHead();});
window.applyLang=applyLang;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
