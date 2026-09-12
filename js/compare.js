'use strict';
(function () {
  function calculate(v) {
    const values = [v.price, v.qty, v.delivery, v.fees];
    if (!values.every(Number.isFinite) || values.some(n => n < 0) || !Number.isInteger(v.qty) || v.qty < 1 || v.qty > 1000000 || v.price > 100000000 || v.delivery > 100000000 || v.fees > 100000000) throw new Error('Введите неотрицательные суммы и целое количество от 1 до 1 000 000.');
    const total = Math.round(v.price * 100) * v.qty + Math.round(v.delivery * 100) + Math.round(v.fees * 100);
    if (!Number.isSafeInteger(total)) throw new Error('Сумма слишком велика для точного расчёта. Уменьшите значения.');
    return {total: total / 100, unit: total / v.qty / 100, qty: v.qty};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {calculate};
  if (typeof document === 'undefined') return;
  const form = document.getElementById('compare-form');
  if (!form) return;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const output = document.getElementById('compare-result');
    function read(prefix) {
      const v = {};
      ['price','qty','delivery','fees'].forEach(k => { v[k] = Number(form.elements[prefix + '_' + k].value); });
      return calculate(v);
    }
    try {
      const a = read('a'), b = read('b');
      const currency = form.elements.currency.value;
      const money = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:currency}).format(n);
      output.replaceChildren();
      const h = document.createElement('h2'); h.textContent = 'Сравнение итоговой стоимости'; output.appendChild(h);
      [ ['А',a], ['Б',b] ].forEach(item => {
        const p = document.createElement('p'); p.textContent = 'Вариант ' + item[0] + ': ' + money(item[1].total) + ' за заказ; ' + money(item[1].unit) + ' за единицу с доставкой и сборами.'; output.appendChild(p);
      });
      const p = document.createElement('p');
      if (a.qty !== b.qty) p.textContent = 'Количество различается. Сравнивайте цену за одинаковую единицу и учитывайте, нужен ли вам весь объём; меньшая общая сумма сама по себе не означает более выгодную покупку.';
      else if (Math.abs(a.total-b.total) < 0.005) p.textContent = 'Итоговые суммы одинаковы. Сравните комплектацию, сроки доставки и другие нужные вам условия.';
      else p.textContent = 'При одинаковом количестве вариант ' + (a.total < b.total ? 'А' : 'Б') + ' требует на ' + money(Math.abs(a.total-b.total)) + ' меньше к оплате.';
      output.appendChild(p);
    } catch (error) { output.textContent = error.message; }
  });
})();
