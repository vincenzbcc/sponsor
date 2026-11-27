(() => {
  const products = {
    shampoo: [
      ['antiforfora', 'Shampoo antiforfora purificante', 19, 'Per chi cerca una detersione mirata in presenza di scaglie visibili. Pulisce il cuoio capelluto e lascia una sensazione di freschezza.'],
      ['lenitivo', 'Shampoo lenitivo per cute sensibile', 19, 'Una detersione delicata per il cuoio capelluto sensibile, pensata per lasciare i capelli morbidi e la cute confortevole.'],
      ['seboregolatore', 'Shampoo seboregolatore', 19, 'Per capelli che si appesantiscono facilmente alle radici. Rimuove il sebo in eccesso e lascia la chioma leggera.'],
      ['energizzante', 'Shampoo energizzante', 21, 'Pensato per capelli fini e spenti. Una detersione fresca per preparare la chioma allo styling senza appesantirla.'],
      ['idratante', 'Shampoo idratante', 20, 'Per capelli secchi, crespi o stressati dal phon. Aiuta a ritrovare morbidezza e facilita la pettinatura.'],
      ['frequente', 'Shampoo per uso frequente', 17, 'Una detersione leggera per i lavaggi frequenti, anche dopo lo sport. Lascia i capelli puliti e facili da pettinare.'],
      ['antigiallo', 'Shampoo antigiallo', 22, 'Per capelli grigi, bianchi o decolorati. La tonalità viola aiuta a smorzare i riflessi gialli e a valorizzare i toni freddi.'],
      ['detox', 'Shampoo scrub detox', 22, 'Per alternare alla detersione abituale quando si usano spesso cere o pomate. Aiuta a rimuovere i residui di styling.'],
      ['volumizzante', 'Shampoo volumizzante', 20, 'Per capelli fini che tendono a restare piatti. Una detersione leggera che prepara la chioma a una piega con più corpo.'],
    ],
    asciugamani: [
      ['microfibra', 'Telo capelli in microfibra', 16, 'Assorbe l’acqua tamponando, con meno bisogno di sfregare. Pratico per capelli ricci, trattati o inclini al crespo.'],
      ['panni', 'Panni monouso in fibra di cotone', 12, 'Panni morbidi in confezione dispenser, pratici per tamponare il viso o rimuovere i residui di prodotto dopo la rasatura.'],
      ['viso', 'Telo viso e barba antimacchia', 18, 'Un telo scuro e morbido per asciugare la barba e tamponare il viso dopo la rasatura. Il colore scuro rende meno visibili i residui di lozioni e oli.'],
    ],
    styling: [
      ['sale', 'Spray al sale marino', 18, 'Dona corpo e una finitura opaca con un effetto mosso naturale. Si può usare come base sui capelli umidi prima del phon.'],
      ['tonico', 'Tonico volumizzante', 19, 'Un liquido leggero da distribuire sui capelli umidi prima del phon per dare corpo alla piega e facilitare il controllo delle ciocche.'],
      ['polvere', 'Polvere volumizzante', 17, 'Si applica in piccole quantità alle radici per ottenere volume, presa e una finitura opaca.'],
    ],
  };
  const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const list = document.querySelector('#catalog-products');
  const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
  const cartList = document.querySelector('#cart-items');
  const cartTotal = document.querySelector('#cart-total');
  const cartCount = document.querySelector('#cart-count');
  const cartStatus = document.querySelector('#cart-status');
  const checkout = document.querySelector('#cart-checkout');
  const confirmation = document.querySelector('#cart-confirmation');
  const cart = new Map();
  const cartPanel = document.querySelector('#catalog-cart');
  const cartToggle = document.querySelector('#cart-toggle');
  let category = 'shampoo';
  let showingCart = false;

  function renderCart() {
    let quantity = 0;
    let total = 0;
    for (const item of cart.values()) {
      quantity += item.quantity;
      total += item.price * item.quantity;
    }
    cartList.replaceChildren();
    for (const [id, item] of showingCart ? cart : []) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      const remove = document.createElement('button');
      label.textContent = `${item.name} × ${item.quantity} · ${money.format(item.price * item.quantity)}`;
      remove.type = 'button';
      remove.textContent = 'Rimuovi uno';
      remove.setAttribute('aria-label', `Rimuovi un articolo: ${item.name}`);
      remove.addEventListener('click', () => {
        confirmation.textContent = '';
        item.quantity--;
        if (!item.quantity) cart.delete(id);
        renderCart();
        (cartList.querySelector('button') ?? cartToggle).focus();
        cartStatus.textContent = `Rimosso dal carrello: ${item.name}.`;
      });
      const image = new Image();
      image.className = 'product-image';
      image.src = `assets/products/${id}.webp`;
      image.alt = '';
      row.append(image, label, remove);
      cartList.append(row);
    }
    cartCount.textContent = `· ${quantity} ${quantity === 1 ? 'articolo' : 'articoli'}`;
    cartTotal.textContent = quantity ? `Totale ${money.format(total)}` : 'Il carrello è vuoto.';
    checkout.hidden = !quantity;
  }

  function renderProduct([id, name, price, text]) {
    const row = document.createElement('li');
    row.className = 'product-row';
    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = `assets/products/${id}.webp`;
    image.loading = 'lazy';
    image.alt = '';

    const details = document.createElement('div');
    details.className = 'product-details';
    const title = document.createElement('h3');
    title.textContent = name;
    const description = document.createElement('p');
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const amount = document.createElement('strong');
    amount.textContent = money.format(price);
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Aggiungi';
    add.setAttribute('aria-label', `Aggiungi al carrello: ${name}`);
    add.addEventListener('click', () => {
      confirmation.textContent = '';
      const item = cart.get(id) ?? { name, price, quantity: 0 };
      item.quantity++;
      cart.set(id, item);
      renderCart();
      cartStatus.textContent = `${name} aggiunto al carrello. Quantità ${item.quantity}.`;
      add.textContent = 'Aggiunto';
      clearTimeout(add.feedbackTimer);
      add.feedbackTimer = setTimeout(() => { add.textContent = 'Aggiungi'; }, 900);
    });
    actions.append(amount, add);
    details.append(title, description, actions);
    row.append(image, details);
    list.append(row);
    window.typeDescription(description, text);
  }

  function showCatalog() {
    cartPanel.hidden = !showingCart;
    list.hidden = showingCart;
    cartToggle.setAttribute('aria-expanded', String(showingCart));
    for (const control of categoryButtons) {
      control.setAttribute('aria-pressed', String(!showingCart && control.dataset.category === category));
    }
    if (showingCart) renderCart();
    else {
      list.replaceChildren();
      for (const item of products[category]) renderProduct(item);
      list.scrollTop = 0;
    }
  }

  for (const control of categoryButtons) {
    control.addEventListener('click', () => {
      if (!showingCart && category === control.dataset.category) return;
      category = control.dataset.category;
      showingCart = false;
      showCatalog();
    });
  }
  cartToggle.addEventListener('click', () => {
    showingCart = !showingCart;
    showCatalog();
  });
  checkout.addEventListener('click', () => {
    if (!cart.size) return;
    const total = [...cart.values()].reduce((sum, item) => sum + item.quantity * item.price, 0);
    cart.clear();
    renderCart();
    confirmation.textContent = `Ordine demo confermato · ${money.format(total)}.`;
    cartToggle.focus();
  });
  showCatalog();
  renderCart();
})();
