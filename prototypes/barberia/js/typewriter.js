(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const element = entry.target;
      if (!entry.isIntersecting || !pending.has(element) || getComputedStyle(element).visibility !== 'visible') continue;
      observer.unobserve(element);
      const { output, characters } = pending.get(element);
      pending.delete(element);
      let start;
      function type(now) {
        if (!element.isConnected) return;
        start ??= now;
        const count = reducedMotion.matches ? characters.length : 1 + Math.floor((now - start) / 19);
        output.textContent = characters.slice(0, count).join('');
        if (count < characters.length) requestAnimationFrame(type);
      }
      requestAnimationFrame(type);
    }
  });

  window.typeDescription = (element, text) => {
    for (const previous of pending.keys()) {
      if (previous.isConnected) continue;
      observer.unobserve(previous);
      pending.delete(previous);
    }
    element.classList.add('typed-description');
    const full = document.createElement('span');
    full.className = 'typed-full';
    full.textContent = text;
    const output = document.createElement('span');
    output.setAttribute('aria-hidden', 'true');
    element.replaceChildren(full, output);
    pending.set(element, { output, characters: Array.from(text) });
    observer.observe(element);
  };

  new MutationObserver(() => {
    for (const element of pending.keys()) {
      observer.unobserve(element);
      if (element.isConnected) observer.observe(element);
      else pending.delete(element);
    }
  }).observe(document.body, { attributeFilter: ['data-screen'] });
})();
