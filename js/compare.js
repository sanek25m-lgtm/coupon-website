'use strict';
(function () {
  const invalid='Введите неотрицательные суммы и целое количество от 1 до 1 000 000.';
  function calculate(v) {
    const values=[v.price,v.qty,v.delivery,v.fees];
    if(!values.every(Number.isFinite)||values.some(n=>n<0)||!Number.isInteger(v.qty)||v.qty<1||v.qty>1000000||v.price>100000000||v.delivery>100000000||v.fees>100000000)throw new Error(invalid);
    const total=Math.round(v.price*100)*v.qty+Math.round(v.delivery*100)+Math.round(v.fees*100);
    if(!Number.isSafeInteger(total))throw new Error('Сумма слишком велика для точного расчёта. Уменьшите значения.');
    return {total:total/100,unit:total/v.qty/100,qty:v.qty};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={calculate};
  if(typeof document==='undefined')return;
  const form=document.getElementById('compare-form');
  if(!form)return;
  form.noValidate=true;
  const output=document.getElementById('compare-result');
  let last=null;
  function render(){
    if(!last)return;
    const {a,b,currency}=last;
    const locale=window.CouponI18n?.language||'ru';
    const money=n=>new Intl.NumberFormat(locale,{style:'currency',currency}).format(n);
    output.replaceChildren();
    const h=document.createElement('h2');h.textContent='Сравнение итоговой стоимости';output.appendChild(h);
    function line(label,value,parent=output){
      const p=document.createElement('p'),caption=document.createElement('span');caption.textContent=label;
      p.append(caption,document.createTextNode(': '+value));parent.appendChild(p);
    }
    [['A',a],['B',b]].forEach(([name,result])=>{
      const box=document.createElement('div');const heading=document.createElement('h3');heading.textContent='Вариант '+name;box.appendChild(heading);
      line('За заказ',money(result.total),box);line('За единицу с доставкой и сборами',money(result.unit),box);output.appendChild(box);
    });
    const p=document.createElement('p');
    if(a.qty!==b.qty)p.textContent='Количество различается. Сравнивайте цену за одинаковую единицу и учитывайте, нужен ли вам весь объём; меньшая общая сумма сама по себе не означает более выгодную покупку.';
    else if(Math.abs(a.total-b.total)<0.005)p.textContent='Итоговые суммы одинаковы. Сравните комплектацию, сроки доставки и другие нужные вам условия.';
    else{
      const variant=document.createElement('span');variant.textContent='Вариант '+(a.total<b.total?'A':'B');p.appendChild(variant);output.appendChild(p);
      line('Меньше к оплате',money(Math.abs(a.total-b.total)));return;
    }
    output.appendChild(p);
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    function read(prefix){const v={};['price','qty','delivery','fees'].forEach(k=>{const field=form.elements[prefix+'_'+k];if(field.value.trim()===''||field.validity.badInput)throw new Error(invalid);v[k]=Number(field.value);});return calculate(v);}
    try{last={a:read('a'),b:read('b'),currency:form.elements.currency.value};render();}
    catch(error){last=null;output.textContent=error.message;}
  });
  window.addEventListener('coupon-language-change',render);
})();
