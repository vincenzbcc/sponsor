(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('account-dialog');
  const content = byId('account-content');
  const message = byId('account-message');
  const label = byId('account-label');
  const openButton = byId('account-open');
  const policy = byId('policy-dialog');
  const appointmentFormat = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', dateStyle: 'long', timeStyle: 'short',
  });
  let user = null;
  let intendedBooking = null;
  let appointmentLink = null;
  let version = 0;
  let siteConfig = { demo: true, policies: {} };
  const configReady = api('/config').then(result => { siteConfig = result; }).catch(() => {});

  async function api(path, payload) {
    return window.barberDemoApi(path, payload);
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function action(text, handler) {
    const button = element('button', text, 'booking-link');
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  function setUser(result) {
    user = result.user;
    label.textContent = user ? `Area personale di ${user.first}` : 'Area personale';
    openButton.title = label.textContent;
  }

  function setMessage(text = '') {
    message.textContent = text;
  }

  const fields = {
    first: ['Nome', 'text', 'given-name'],
    last: ['Cognome', 'text', 'family-name'],
    email: ['Email', 'email', 'email'],
    password: ['Password', 'password', 'current-password'],
  };

  function form(names, submit, handler, { values = {}, newPassword = false, privacy = false } = {}) {
    const form = element('form', '', 'account-form');
    for (const name of names) {
      const [caption, type, autocomplete] = fields[name];
      const row = element('label', caption);
      const input = element('input');
      input.name = name;
      input.type = type;
      input.required = true;
      input.maxLength = name === 'email' ? 254 : 120;
      input.autocomplete = name === 'password' && newPassword ? 'new-password' : autocomplete;
      if (name === 'password' && newPassword) input.minLength = 10;
      input.value = values[name] ?? '';
      row.append(input);
      form.append(row);
    }
    if (privacy) form.append(action('Leggi l’informativa privacy', () => showPolicy('privacy')));
    const button = element('button', submit, 'booking-link');
    button.type = 'submit';
    form.append(button);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      button.disabled = true;
      setMessage();
      try {
        await handler(Object.fromEntries(new FormData(form)));
      } catch (error) {
        if (dialog.open && form.isConnected) setMessage(error.message);
      } finally {
        button.disabled = false;
      }
    });
    return form;
  }

  function renderAuth(mode = 'login', token = '') {
    version++;
    const nav = element('nav', '', 'account-nav');
    nav.setAttribute('aria-label', 'Accesso e registrazione');
    for (const [key, caption] of [['login','Accedi'], ['register','Registrati'], ['recover','Recupera password']]) {
      const button = action(caption, () => { setMessage(); renderAuth(key); });
      button.setAttribute('aria-pressed', String(mode === key));
      nav.append(button);
    }
    content.replaceChildren(nav);
    if (mode === 'register') {
      content.append(form(['first','last','email','password'], 'Crea account', async data => {
        const result = await api('/register', data);
        renderAuth('login');
        setMessage(result.message + (siteConfig.demo ? ' Per aprire il link, usa python server.py posta.' : ''));
      }, { newPassword: true, privacy: true }));
    } else if (mode === 'recover') {
      content.append(form(['email'], 'Richiedi un link', async data => {
        const result = await api('/recover', data);
        setMessage(result.message + (siteConfig.demo ? ' Apri la posta di test con python server.py posta.' : ''));
      }));
    } else if (mode === 'reset') {
      content.append(form(['password'], 'Salva la nuova password', async data => {
        const result = await api('/token', { ...data, purpose: 'reset', token });
        setUser({ user: null });
        renderAuth('login');
        setMessage(result.message);
      }, { newPassword: true }));
    } else {
      content.append(form(['email','password'], 'Accedi', async data => {
        setUser(await api('/login', data));
        if (user.staff) {
          location.assign('staff.html');
          return;
        }
        if (intendedBooking) {
          const resume = intendedBooking;
          intendedBooking = null;
          dialog.close();
          resume();
        } else if (appointmentLink) {
          const id = appointmentLink;
          appointmentLink = null;
          renderDashboard('appointments', id);
        } else {
          renderDashboard();
        }
      }));
    }
  }

  function appointmentCard(item) {
    const card = element('article', '', 'account-entry');
    const states = { cancelled: 'Annullato', served: 'Servito', no_show: 'Non presentato' };
    const state = states[item.status] ?? (Date.parse(item.datetime) < Date.now() ? 'Concluso' : 'Confermato');
    card.append(
      element('strong', `${item.service} con ${item.barber}`),
      element('p', `${appointmentFormat.format(new Date(item.datetime))} · ${item.duration} min`),
      element('small', state)
    );
    if (item.status === 'confirmed' && Date.parse(item.datetime) > Date.now()) {
      card.append(action('Disdici appuntamento', async () => {
        if (!confirm('Vuoi disdire questo appuntamento? L’orario tornerà disponibile.')) return;
        try {
          await api('/appointments/' + encodeURIComponent(item.id) + '/cancel', {});
          await renderDashboard('appointments');
          setMessage('Appuntamento disdetto.');
        } catch (error) { setMessage(error.message); }
      }));
    }
    return card;
  }

  function appointmentGroup(target, title, items) {
    if (!items.length) return;
    const section = element('section', '', 'account-section');
    const stack = element('div', '', 'account-list');
    stack.append(...items.map(appointmentCard));
    section.append(element('h3', title), stack);
    target.append(section);
  }

  async function renderAppointments(target, id) {
    if (id) {
      const { appointment } = await api('/appointments/' + encodeURIComponent(id));
      target.append(appointmentCard(appointment));
      return;
    }
    const { appointments } = await api('/appointments');
    if (!appointments.length) {
      target.append(element('p', 'Non hai ancora appuntamenti'), action('Prenota un taglio', () => {
        dialog.close();
        window.barber.goTo('sinistra');
      }));
      return;
    }
    const future = appointments.filter(item => item.status !== 'cancelled' && Date.parse(item.datetime) >= Date.now());
    const archive = appointments.filter(item => !future.includes(item)).reverse();
    appointmentGroup(target, 'Prossimo appuntamento', future.slice(0, 1));
    appointmentGroup(target, 'Altri appuntamenti futuri', future.slice(1));
    appointmentGroup(target, 'Storico e annullati', archive);
  }

  async function renderNotices(target) {
    const { notices } = await api('/notices');
    if (!notices.length) target.append(element('p', 'Non hai ancora avvisi.'));
    const stack = element('div', '', 'account-list');
    for (const notice of notices) {
      const card = element('article', '', 'account-entry');
      const button = action(notice.title, async () => {
        try {
          await api('/notices/read', { id: notice.id });
          renderDashboard('appointments', notice.appointment);
        } catch (error) {
          setMessage(error.message);
        }
      });
      card.append(element('small', notice.read ? 'Letto' : 'Nuovo'), element('p', notice.body), button);
      stack.append(card);
    }
    target.append(stack);
  }

  function renderProfile(target) {
    target.append(
      element('h3', 'Dati personali'),
      element('p', user.email),
      form(['first','last'], 'Aggiorna nome e cognome', async data => {
        setUser(await api('/profile', data));
        setMessage('Dati aggiornati.');
      }, { values: user })
    );
    const emailSection = element('section', '', 'account-section');
    emailSection.append(element('h3', 'Cambia email'), form(['email','password'], 'Verifica il nuovo indirizzo', async data => {
      const result = await api('/profile/email', data);
      setMessage(result.message);
    }));
    const controls = element('div', '', 'account-nav');
    controls.append(
      action('Cambia password', async () => {
        try {
          const result = await api('/recover', { email: user.email });
          setMessage(result.message);
        } catch (error) { setMessage(error.message); }
      }),
      action('Esci', async () => {
        try {
          await api('/logout', {});
          setUser({ user: null });
          renderAuth();
        } catch (error) { setMessage(error.message); }
      })
    );
    target.append(emailSection, controls);
  }

  async function renderDashboard(tab = 'appointments', appointmentId = null) {
    const active = ++version;
    setMessage();
    const nav = element('nav', '', 'account-nav');
    nav.setAttribute('aria-label', 'Sezioni dell’area personale');
    const tabs = [['appointments','I miei appuntamenti'], ['notices','Avvisi'], ['profile','Il mio profilo']];
    for (const [key, title] of tabs) {
      const button = action(title, () => renderDashboard(key));
      button.setAttribute('aria-pressed', String(key === tab && !appointmentId));
      nav.append(button);
    }
    const target = element('div', '', 'account-section');
    content.replaceChildren(nav, target);
    if (tab === 'profile') { renderProfile(target); return; }
    try {
      if (tab === 'appointments') await renderAppointments(target, appointmentId);
      else await renderNotices(target);
    } catch (error) {
      if (active !== version) return;
      if (error.status === 401) {
        setUser({ user: null });
        renderAuth();
      }
      setMessage(error.message);
    }
  }

  const policies = {
    privacy: ['Privacy', 'Demo locale. Nome, cognome, email e appuntamenti sono salvati nell’agenda locale. Le password sono conservate come hash. I messaggi di prova sono consultabili dall’operatore della demo. Il testo definitivo va approvato dal titolare prima della pubblicazione.'],
    cookies: ['Cookie policy', 'La demo usa un cookie tecnico di sessione per mantenere l’accesso. La sessione scade dopo sette giorni e si può chiudere da Il mio profilo.'],
    preferences: ['Preferenze cookie', 'È attivo solo il cookie tecnico di sessione. La demo non usa cookie facoltativi di analisi o marketing.'],
  };

  async function showPolicy(key) {
    await configReady;
    const [title, fallback] = policies[key];
    const text = siteConfig.demo ? fallback : (siteConfig.policies[key] ?? 'Testo in attesa di approvazione.');
    if (policy.open) return;
    byId('policy-title').textContent = title;
    byId('policy-text').textContent = text;
    policy.showModal();
  }

  async function open(options = {}) {
    intendedBooking = options.onLogin ?? null;
    if (!dialog.open) dialog.showModal();
    const active = ++version;
    content.replaceChildren();
    setMessage(options.message ?? 'Caricamento…');
    try {
      const result = await api('/session');
      if (active !== version || !dialog.open) return;
      setUser(result);
      if (user?.staff) {
        location.assign('staff.html');
        return;
      }
      if (user) renderDashboard('appointments', options.appointment);
      else {
        appointmentLink = options.appointment ?? null;
        renderAuth();
        setMessage(options.message);
      }
    } catch (error) {
      if (active === version) setMessage(error.message);
    }
  }

  openButton.addEventListener('click', () => open());
  byId('account-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { intendedBooking = null; appointmentLink = null; version++; });
  for (const button of document.querySelectorAll('[data-policy]')) {
    button.addEventListener('click', () => showPolicy(button.dataset.policy));
  }

  async function followLink() {
    if (!['menu','sinistra','destra'].includes(document.body.dataset.screen)) return;
    const hash = new URLSearchParams(location.hash.slice(1));
    const purpose = hash.get('account');
    const token = hash.get('token');
    const appointment = hash.get('appointment');
    if (!appointment && (!purpose || !token)) return;
    history.replaceState(null, '', location.pathname + location.search);
    if (appointment) { open({ appointment }); return; }
    if (!dialog.open) dialog.showModal();
    setMessage();
    if (purpose === 'reset') {
      renderAuth('reset', token);
      return;
    }
    try {
      const { message: result } = await api('/token', { purpose, token });
      if (purpose === 'email') setUser(await api('/session'));
      if (user) renderDashboard('profile');
      else renderAuth();
      setMessage(result);
    } catch (error) {
      renderAuth();
      setMessage(error.message);
    }
  }

  new MutationObserver(followLink).observe(document.body, { attributeFilter: ['data-screen'] });
  window.addEventListener('hashchange', followLink);
  api('/session').then(result => { if (!dialog.open && !version) setUser(result); }).catch(() => {});
  window.barberAccount = { api, open };
})();
