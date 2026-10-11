/* Villa Rudolf – průvodce: Umami click-tracker (dřív inline v index.html, oddělený kvůli CSP).
 * Měří kliknutí na externí odkazy v kartách výletů (.trip s nadpisem h3 – struktura z app.js).
 * Umami běží cookieless; značka samotná je v index.html (data-exclude-search, ať se neměří ?t=). */
document.addEventListener('click',function(e){
  var a=e.target.closest('a[href^="http"]');
  if(!a||!window.umami)return;
  var s=a.closest('.trip'),h=s&&s.querySelector('h3');
  window.umami.track('Link-Klick',{
    ausflug:h?h.textContent.trim().slice(0,48):'Allg.',
    link:(a.textContent||a.href).trim().replace(/\s+/g,' ').slice(0,60),
    url:a.href
  });
});
