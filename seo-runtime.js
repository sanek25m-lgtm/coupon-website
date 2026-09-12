/* Shared progressive enhancement. No synthetic ratings or server claims. */
(function () {
  'use strict';
  const root = new URL('.', document.currentScript.src);
  // Site identity stays the same when a mirror serves the repository at /.
  const project = 'coupon-website';
  window.couponSiteRoot = root.href;
  window.merchantUrl = function (name) {
    const routes = window.COUPON_ROUTES && window.COUPON_ROUTES.stores || {};
    return new URL(routes[name] || ('store.html?merchant=' + encodeURIComponent(name)), root).href;
  };
  window.categoryUrl = function (name) {
    const routes = window.COUPON_ROUTES && window.COUPON_ROUTES.categories || {};
    return new URL(routes[name] || ('index.html?cat=' + encodeURIComponent(name)), root).href;
  };
  window.couponExpiry = function (value) {
    if (!value) return Infinity;
    let text = String(value);
    const day = text.slice(0,10);
    const calendar = new Date(day+'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0,10)!==day) return NaN;
    if (text.length===10) text+='T23:59:59.999Z';
    else {
      if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(text)) return NaN;
      text=text.replace(' ','T');
      if (!/(Z|[+-]\d{2}:?\d{2})$/.test(text)) text+='Z';
    }
    return Date.parse(text);
  };
  window.couponIsActive = function (c) {
    return window.couponExpiry(c.finish || c.end) >= Date.now();
  };
  window.couponForSite = function (c) {
    const hasCode = Boolean(String(c.code || '').trim());
    return window.couponIsActive(c) && hasCode === (project === 'kod-kupona');
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  window.couponOfferCount = function (count) {
    const n = Math.abs(count), last = n % 10, teen = n % 100;
    const noun = last === 1 && teen !== 11 ? 'предложение' : last >= 2 && last <= 4 && (teen < 12 || teen > 14) ? 'предложения' : 'предложений';
    return count + ' ' + noun;
  };
  function discountInfo(c) {
    if (/(?:к[еэ]шб[еэ]к|cash\s*back|бонус|балл|рассроч)/i.test(String(c.name || ''))) return { value: 0, capped: false };
    const match = String(c.name || '').match(/(\d{1,3})\s*%/);
    const value = match && +match[1] > 0 && +match[1] <= 100 ? +match[1] : 0;
    const capped = value && new RegExp('(?:до|up\\s+to)\\s*[−-]?\\s*' + value + '\\s*%', 'i').test(String(c.name || '') + ' ' + String(c.ins || ''));
    return { value, capped };
  }
  window.couponOfferKind = function (c) {
    if (/(?:бонус|балл)/i.test(String(c.name || '') + ' ' + String(c.desc || ''))) return 'бонусы';
    return String(c.code || '').trim() ? 'промокод' : 'предложение магазина';
  };
  window.couponDiscountLabel = function (c) {
    const info = discountInfo(c);
    return info.value ? (info.capped ? 'до ' : '−') + info.value + '%' : '';
  };
  window.couponDescription = function (c) {
    const text = String(c.desc || ''), info = discountInfo(c);
    if (!text || text === c.name) return '';
    if (info.capped && new RegExp('(^|[^0-9])' + info.value + '\\s*%').test(text)
        && !new RegExp('(?:до|up\\s+to)\\s*[−-]?\\s*' + info.value + '\\s*%', 'i').test(text)) return '';
    return text;
  };
  window.couponReportUrl = function (c) {
    const u = new URL('https://github.com/sanek25m-lgtm/' + project + '/issues/new');
    u.searchParams.set('title', 'Купон ' + c.id + ': ' + c.merchant);
    u.searchParams.set('body', 'ID: ' + c.id + '\nМагазин: ' + c.merchant + '\nОпишите проблему и условия применения. Не указывайте персональные данные.');
    return u.href;
  };
  window.couponTools = function (c) {
    return (c.ins ? '<details class="coupon-conditions"><summary>Условия предложения</summary><p>' + esc(c.ins) + '</p></details>' : '') +
      (c.code ? '<div class="coupon-code"><code>' + esc(c.code) + '</code> <button type="button" class="copy-code" data-copy="' + esc(c.code) + '">Скопировать</button></div>' : '') +
      '<a class="report-link" href="' + esc(window.couponReportUrl(c)) + '" target="_blank" rel="nofollow noopener">Сообщить об ошибке (GitHub)</a>';
  };
  function announce(message) {
    let status = document.getElementById('copy-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'copy-status';
      status.setAttribute('role', 'status');
      status.className = 'copy-status';
      document.body.appendChild(status);
    }
    status.textContent = message;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => { status.textContent = ''; }, 4500);
  }
  document.addEventListener('click', async function (event) {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    event.preventDefault();
    const text = button.dataset.copy;
    if (!text) return;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      announce('Промокод скопирован.');
    } catch (_) {
      announce('Не удалось скопировать автоматически. Выделите код на карточке и скопируйте вручную.');
    }
  });
  // Legacy info links are retained as navigation, not as duplicate content.
  if (/\/info\.html$/.test(location.pathname)) {
    const p = new URLSearchParams(location.search).get('p') || 'about';
    if (['about','contacts','privacy','terms','cookies'].includes(p)) {
      location.replace(new URL('info/' + p + '.html', root).href);
    }
  }
})();
