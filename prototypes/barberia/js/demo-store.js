/* Dati fittizi della vetrina: tutto vive soltanto nella memoria di questa pagina. */
(() => {
  const services = [
    { id: 'cut', name: 'Taglio', minutes: 30, price: 25 },
    { id: 'beard', name: 'Rifinitura barba', minutes: 15, price: 15 },
    { id: 'shave', name: 'Rasatura a panno caldo', minutes: 30, price: 23 },
    { id: 'combo', name: 'Taglio & barba', minutes: 45, price: 35 },
  ];
  const barbers = [
    { id: 'gianluca', name: 'Gianluca', bio: 'Dai tagli classici ai look corti, Gianluca cura le proporzioni e le rifiniture. La rasatura a panno caldo è il suo modo di farti rallentare e goderti il tempo in poltrona.', services: ['cut', 'beard', 'shave', 'combo'], active: true },
    { id: 'matteo', name: 'Matteo', bio: 'Matteo lavora su contrasti, sfumature e tagli con movimento, dal classico pettinato al mullet. Gli piace trovare una forma che abbia carattere e che tu riesca a sistemare anche a casa.', services: ['cut', 'beard', 'combo'], active: true },
    { id: 'andrea', name: 'Andrea', bio: 'Andrea dà forma a ricci, ciuffi e volumi naturali, con un occhio attento alle sfumature. Tra un taglio preciso e il suo sorriso, è facile uscire dalla barberia di buon umore.', services: ['cut', 'beard', 'shave', 'combo'], active: true },
  ];
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', dateStyle: 'short' }).format(new Date());
  const shiftDay = (day, offset) => {
    const value = new Date(day + 'T12:00:00Z');
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
  };
  const shifts = day => new Date(day + 'T12:00:00Z').getUTCDay() === 1 ? [] : [[480, 810], [900, 1200]];
  const time = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const offer = id => services.find(item => item.id === id);
  const person = id => barbers.find(item => item.id === id);
  const demoClient = { id: 'demo-client', first: 'Cliente', last: 'Demo', email: 'cliente@demo.invalid', staff: false };
  let client = { ...demoClient };
  let nextId = 10;
  const appointments = [];
  const notices = [];
  const events = [];
  const blocks = [];

  function makeAppointment({ id, day, start, barber, service, clientName, owner = false, status = 'confirmed', created = Date.now() / 1000, paid = null }) {
    const selected = offer(service);
    return { id: id || `demo-${nextId++}`, day, start, end: start + selected.minutes, barberId: barber,
      serviceId: service, client: clientName, owner, status, created: Math.floor(created),
      price: selected.price * 100, paid };
  }
  const currentDay = today();
  appointments.push(
    makeAppointment({ id: 'demo-1', day: currentDay, start: 600, barber: 'gianluca', service: 'cut', clientName: 'Marco Rossi' }),
    makeAppointment({ id: 'demo-2', day: currentDay, start: 690, barber: 'gianluca', service: 'beard', clientName: 'Luca Bianchi', status: 'served', paid: 1500, created: Date.now() / 1000 - 86400 }),
    makeAppointment({ id: 'demo-3', day: currentDay, start: 900, barber: 'gianluca', service: 'combo', clientName: 'Paolo Verdi', status: 'cancelled' }),
    makeAppointment({ id: 'demo-4', day: currentDay, start: 960, barber: 'andrea', service: 'cut', clientName: 'Sara Neri' }),
    makeAppointment({ id: 'demo-5', day: shiftDay(currentDay, 1), start: 990, barber: 'matteo', service: 'cut', clientName: 'Cliente Demo', owner: true })
  );
  notices.push({ id: 'notice-1', appointment: 'demo-5', title: 'Appuntamento confermato',
    body: 'Taglio con Matteo · domani alle 16:30 · notifica dimostrativa.', read: 0 });
  events.push({ barber: 'gianluca', appointment: 'demo-1', day: currentDay,
    message: 'Nuova prenotazione · Marco Rossi · Taglio · 10:00' });
  events.push({ barber: 'gianluca', appointment: 'demo-3', day: currentDay,
    message: 'Disdetta · Paolo Verdi · Taglio & barba · 15:00' });

  const publicAppointment = item => ({ id: item.id, day: item.day, start: item.start,
    status: item.status, datetime: `${item.day}T${time(item.start)}:00`,
    service: offer(item.serviceId)?.name || item.serviceId,
    barber: person(item.barberId)?.name || item.barberId, duration: item.end - item.start });
  const staffAppointment = item => ({ ...publicAppointment(item), client: item.client,
    barberId: item.barberId, serviceId: item.serviceId, end: item.end,
    created: item.created, price: item.price, paid: item.paid });
  const catalog = () => ({ services: services.map(item => ({ ...item })), barbers: barbers.filter(item => item.active).map(item => ({
    id: item.id, name: item.name, bio: item.bio, services: [...item.services],
    avatar: `assets/barbers/${item.id}.webp`,
    photos: [1, 2, 3].map(index => `assets/barbers/${item.id}-${index}.webp`),
  })) });
  const overlaps = (item, start, end) => item.start < end && item.end > start;
  const free = (day, barber, start, duration, except = '') =>
    shifts(day).some(([open, close]) => open <= start && start + duration <= close) &&
    !appointments.some(item => item.id !== except && item.day === day && item.barberId === barber &&
      item.status !== 'cancelled' && overlaps(item, start, start + duration)) &&
    !blocks.some(item => item.day === day && item.barber === barber &&
      item.first_minute < start + duration && item.last_minute > start);
  const error = (message, status = 400) => Object.assign(new Error(message), { status });
  function addEvent(item, label) {
    const message = `${label} · ${item.client} · ${offer(item.serviceId)?.name} · ${item.day} ${time(item.start)}`;
    events.unshift({ barber: item.barberId, appointment: item.id, day: item.day, message });
    if (item.owner) notices.unshift({ id: `notice-${Date.now()}-${Math.random()}`, appointment: item.id,
      title: label, body: message + ' · notifica dimostrativa.', read: 0 });
  }
  function create(data, owner) {
    const selected = offer(data.service);
    if (!selected || !person(data.barber)?.active || !free(data.day, data.barber, Number(data.start), selected.minutes))
      throw error('Questo orario non è disponibile nella demo.', 409);
    const item = makeAppointment({ day: data.day, start: Number(data.start), barber: data.barber,
      service: data.service, clientName: owner ? `${client.first} ${client.last}` : `${data.first || 'Cliente'} ${data.last || 'Demo'}`, owner });
    appointments.push(item);
    addEvent(item, 'Nuova prenotazione');
    return { appointment: publicAppointment(item) };
  }

  async function api(path, data) {
    const [route, search = ''] = path.split('?');
    const query = new URLSearchParams(search);
    if (data !== undefined && ['/appointments', '/register', '/login', '/recover', '/profile/email', '/token', '/staff/roster', '/staff/appointments', '/staff/blocks'].includes(route)) {
      window.barberDemoExplain?.(route);
    }
    if (data !== undefined && /^\/(appointments|staff\/appointments)\//.test(route)) window.barberDemoExplain?.(route);
    if (route === '/config') return { demo: false, policies: {
      privacy: 'Questa è una copia dimostrativa. Usa dati inventati: le modifiche restano solo in memoria e si cancellano ricaricando la pagina.',
      cookies: 'Questa copia non usa sessioni cliente né cookie di prenotazione.',
      preferences: 'La copia dimostrativa non richiede cookie facoltativi.' } };
    if (route === '/catalog') return catalog();
    if (route === '/session') return { user: document.body.dataset.demoRole === 'staff' ?
      { first: 'Gianluca', last: 'Demo', email: 'staff@demo.invalid', staff: true, owner: true, barber: 'gianluca' } : client };
    if (route === '/availability') {
      const day = query.get('day'), service = offer(query.get('service'));
      if (!day || !service) return { slots: [] };
      const target = query.get('barber');
      const people = barbers.filter(item => item.active && (!target || target === item.id) && item.services.includes(service.id));
      const starts = shifts(day).flatMap(([open, close]) => {
        const values = [];
        for (let start = open; start < close; start += 30) values.push(start);
        return values;
      });
      if (service.minutes === 15) {
        for (const item of appointments) {
          if (item.day === day && item.status !== 'cancelled' && item.end % 30 === 15) starts.push(item.end);
        }
      }
      return { slots: people.flatMap(item => [...new Set(starts)].filter(start => free(day, item.id, start, service.minutes))
        .map(start => ({ start, barber: item.id, name: item.name })))
        .sort((a, b) => a.start - b.start || a.name.localeCompare(b.name)) };
    }
    if (route === '/appointments' && data === undefined) return { appointments: appointments.filter(item => item.owner).map(publicAppointment) };
    if (route === '/appointments' && data !== undefined) return create(data, true);
    const clientAppointment = route.match(/^\/appointments\/([^/]+)(?:\/(cancel))?$/);
    if (clientAppointment) {
      const item = appointments.find(entry => entry.id === clientAppointment[1] && entry.owner);
      if (!item) throw error('Appuntamento demo non trovato.', 404);
      if (clientAppointment[2]) { item.status = 'cancelled'; addEvent(item, 'Disdetta'); return { appointment: publicAppointment(item) }; }
      return { appointment: publicAppointment(item) };
    }
    if (route === '/notices') return { notices: notices.map(item => ({ ...item })) };
    if (route === '/notices/read') { const item = notices.find(entry => entry.id === data.id); if (item) item.read = 1; return {}; }
    if (route === '/profile') { client = { ...client, first: data.first, last: data.last }; return { user: client }; }
    if (route === '/profile/email') return { message: 'Cambio email non disponibile nella copia dimostrativa.' };
    if (route === '/recover') return { message: 'Nessuna email inviata: questa è una copia dimostrativa.' };
    if (route === '/register') return { message: 'Registrazione simulata: nessun account è stato creato.' };
    if (route === '/login') { client = { ...demoClient }; return { user: client }; }
    if (route === '/token') return { message: 'Operazione dimostrativa: nessun account è stato modificato.' };
    if (route === '/logout') { client = null; return {}; }

    if (route === '/staff/roster' && data === undefined) return { barbers: barbers.map(item => ({ ...item, services: [...item.services] })),
      barber: 'gianluca', owner: true, services: services.map(item => ({ ...item })) };
    if (route === '/staff/roster' && data) {
      if (data.action === 'deactivate') { const item = person(data.barber); if (item && item.id !== 'gianluca') item.active = false; return {}; }
      if (data.action === 'add') { barbers.push({ id: data.id, name: data.name, bio: data.bio,
        services: data.services, active: true }); return {}; }
    }
    if (route === '/staff/events') return { events: events.map(item => ({ ...item })) };
    if (route === '/staff/appointments' && data === undefined) {
      const day = query.get('day') || today(), barber = query.get('barber') || 'gianluca';
      const list = appointments.filter(item => item.day === day && item.barberId === barber).map(staffAppointment);
      const served = list.filter(item => item.status === 'served');
      return { appointments: list, shifts: shifts(day), blocks: blocks.filter(item => item.day === day && item.barber === barber),
        report: { minutes: served.reduce((sum, item) => sum + item.duration, 0),
          paid: served.reduce((sum, item) => sum + (item.paid || 0), 0), served,
          absent: list.filter(item => item.status === 'no_show'), idle: [] } };
    }
    if (route === '/staff/appointments' && data) return create(data, false);
    const staffAppointmentPath = route.match(/^\/staff\/appointments\/([^/]+)\/(cancel|move|outcome|payment)$/);
    if (staffAppointmentPath) {
      const item = appointments.find(entry => entry.id === staffAppointmentPath[1]);
      if (!item) throw error('Appuntamento demo non trovato.', 404);
      const action = staffAppointmentPath[2];
      if (action === 'cancel') item.status = 'cancelled';
      if (action === 'outcome') item.status = data.outcome;
      if (action === 'payment') item.paid = Number(data.paid);
      if (action === 'move') {
        const selected = offer(data.service);
        if (!selected || !free(data.day, data.barber, Number(data.start), selected.minutes, item.id))
          throw error('Orario non disponibile nella demo.', 409);
        item.day = data.day; item.start = Number(data.start); item.end = item.start + selected.minutes;
        item.barberId = data.barber; item.serviceId = data.service;
      }
      addEvent(item, { cancel: 'Disdetta', move: 'Appuntamento spostato', outcome: 'Esito aggiornato', payment: 'Incasso registrato' }[action]);
      return {};
    }
    if (route === '/staff/blocks' && data) {
      if (data.action === 'remove') {
        const index = blocks.findIndex(item => item.id === data.id);
        if (index >= 0) blocks.splice(index, 1);
      } else blocks.push({ id: `block-${Date.now()}`, barber: data.barber, day: data.day,
        first_minute: Number(data.start), last_minute: Number(data.end), reason: data.reason || 'Pausa' });
      return {};
    }
    throw error('Funzione non disponibile nella copia dimostrativa.', 404);
  }
  window.barberDemoApi = api;
})();
