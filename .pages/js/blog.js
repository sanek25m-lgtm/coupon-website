/* Progressive store-directory filtering; every article remains crawlable without JS. */
(() => {
  const input = document.getElementById('blog-store-search');
  if (!input) return;
  const stores = Array.from(document.querySelectorAll('[data-blog-store]'));
  const empty = document.getElementById('blog-store-empty');
  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('ru');
    let visible = 0;
    stores.forEach(item => {
      item.hidden = !item.dataset.blogStore.includes(query);
      if (!item.hidden) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
  });
})();
