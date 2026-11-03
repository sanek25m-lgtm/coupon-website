(function(){
  'use strict';
  var path=location.pathname.replace(/index\.html$/,'').replace(/\/+$/,'/')||'/';
  document.querySelectorAll('.site-nav-link').forEach(function(link){
    if(link.hash)return;
    var target=new URL(link.href,location.href).pathname.replace(/index\.html$/,'').replace(/\/+$/,'/')||'/';
    var active=path===target||(link.dataset.nav==='blog'&&/\/blog\//.test(path));
    if(active){link.classList.add('is-active');link.setAttribute('aria-current','page')}
  });
})();