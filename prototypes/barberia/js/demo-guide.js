(() => {
  const role = document.body.dataset.demoRole;
  const send = (type, key) => {
    if (window.parent !== window) window.parent.postMessage({ source: 'barber-guide', role, type, key }, '*');
  };
  function scrollableBetween(target, movement) {
    for (let node = target; node && node !== document; node = node.parentElement) {
      if (!(node instanceof Element)) continue;
      const style = getComputedStyle(node);
      if (!/(auto|scroll)/.test(style.overflowY) || node.scrollHeight <= node.clientHeight + 2) continue;
      if (movement > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 3) return true;
    }
    return false;
  }
  let wheelDistance = 0;
  document.addEventListener('wheel', event => {
    if (event.deltaY <= 0 || scrollableBetween(event.target, event.deltaY)) return;
    wheelDistance += event.deltaY;
    if (wheelDistance > 85) { send('swipe', 'up'); wheelDistance = 0; }
    clearTimeout(window.barberWheelReset);
    window.barberWheelReset = setTimeout(() => { wheelDistance = 0; }, 350);
  }, { passive: true });
  let touchStart = null;
  document.addEventListener('touchstart', event => { touchStart = event.touches[0]?.clientY ?? null; }, { passive: true });
  document.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const movement = touchStart - (event.changedTouches[0]?.clientY ?? touchStart);
    touchStart = null;
    if (movement > 75 && !scrollableBetween(event.target, movement)) send('swipe', 'up');
  }, { passive: true });
  const idMap = role === 'client' ? {
    'account-open': 'account', 'booking-service': 'calendar', 'month-prev': 'calendar',
    'month-next': 'calendar', 'booking-search': 'time', 'booking-choices': 'time',
    'booking-mobile-next': 'calendar', 'booking-mobile-team': 'barber',
    'cart-toggle': 'cart', 'cart-checkout': 'cart', 'catalog-products': 'product',
    'barber-options': 'barber', 'barber-portfolio': 'barber',
  } : {
    'agenda-nav': 'agenda', 'alerts-nav': 'notices', 'roster-nav': 'roster',
    'day': 'day', 'barber': 'day', 'prev': 'day', 'today': 'day', 'next': 'day',
    'reload': 'day', 'add-block': 'block', 'grid': 'appointment',
    'report': 'report', 'history': 'report', 'new-barber': 'roster',
    'alert-list': 'notices', 'detail-content': 'appointment',
  };
  document.addEventListener('click', event => {
    const target = event.target.closest('button,a,summary,input,select');
    if (!target) return;
    if (role === 'client') {
      if (target.closest('#s-welcome')) return send('action', 'welcome');
      if (target.dataset.go) return send('action', target.dataset.go === 'menu' ? 'back' : target.dataset.go);
    }
    const host = target.closest('[id]');
    const key = host && idMap[host.id] || idMap[target.id];
    if (key && !(role === 'admin' && host.id === 'grid')) return send('action', key);
    const label = (target.textContent || target.getAttribute('aria-label') || '').trim().toLowerCase();
    if (role === 'admin') {
      if (/notific|avvis/.test(label)) send('action', 'notices');
      else if (/incass|pagament/.test(label)) send('action', 'payment');
      else if (/non presentato|come servito/.test(label)) send('action', 'outcome');
      else if (/annulla|disdetta/.test(label)) send('action', 'cancel');
      else if (/sposta/.test(label)) send('action', 'move');
      else if (/resoconto|storico/.test(label)) send('action', 'report');
      else if (/barbier|portfolio|profilo/.test(label)) send('action', 'roster');
      else if (/blocca|fascia/.test(label)) send('action', 'block');
      else if (/aggiungi|libero/.test(label)) send('action', 'add');
      else send('action', 'appointment');
    } else if (/conferm|prenota/.test(label)) send('action', 'confirm');
    else if (/registr|acced|password|email/.test(label)) send('action', 'register');
    else if (/avvis/.test(label)) send('action', 'notices');
    else if (/barbier|foto|tagli/.test(label)) send('action', 'barber');
    else if (/orari|ora/.test(label)) send('action', 'time');
    else if (/giorno|calendario|servizio/.test(label)) send('action', 'calendar');
    else if (/carrello/.test(label)) send('action', 'cart');
    else if (/prodotto|aggiungi/.test(label)) send('action', 'product');
    else if (/appuntamenti|profilo|avvisi|account/.test(label)) send('action', 'account');
  }, true);
  if (role === 'client') {
    new MutationObserver(() => {
      const scene = document.body.dataset.screen;
      if (['menu', 'sinistra', 'destra'].includes(scene)) send('action', scene);
    }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  }
  let timer;
  window.barberDemoExplain = route => {
    send('backend', route);
    let note = document.getElementById('demo-action-notice');
    if (!note) {
      note = document.createElement('div');
      note.id = 'demo-action-notice';
      note.setAttribute('role', 'status');
      note.style.cssText = 'position:fixed;z-index:99999;left:50%;bottom:1.5rem;transform:translateX(-50%);width:min(90vw,36rem);padding:1rem 1.3rem;background:#24190f;color:#fff6e7;border:1px solid #dba668;box-shadow:0 12px 35px #0009;font:600 .9rem/1.4 system-ui,sans-serif;text-align:center';
      document.body.append(note);
    }
    note.textContent = role === 'client'
      ? 'Anteprima: nessun account, ordine o appuntamento reale viene creato. Le email e i promemoria sono disponibili solo in un sito collegato al backend.'
      : 'Anteprima: questa modifica è temporanea e non aggiorna alcuna agenda reale.';
    clearTimeout(timer);
    timer = setTimeout(() => note.remove(), 8500);
  };
})();
