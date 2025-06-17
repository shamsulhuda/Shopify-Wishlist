;(function() {
  const STORAGE_KEY = 'my_wishlist';
  const API_ROOT = window.Shopify.routes.root + 'products/';

  function readWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function writeWishlist(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function isWishlisted(handle) {
    return readWishlist().includes(handle);
  }

  function toggleWishlist(handle) {
    const list = readWishlist();
    if (list.includes(handle)) {
      writeWishlist(list.filter(h => h !== handle));
      return false;
    } else {
      list.push(handle);
      writeWishlist(list);
      return true;
    }
  }

  function updateWishlistButton(btn) {
    const handle = btn.dataset.handle;
    const active = isWishlisted(handle);
    btn.setAttribute('aria-pressed', active);
  }

  function updateWishlistCounter() {
    const count = readWishlist().length;
    const counter = document.querySelector('#wishlist-icon-bubble .wishlist-counter');
    if (counter) counter.textContent = count;
  }

  function initWishlistButtons() {
    document.querySelectorAll('.btn--wishlist').forEach(btn => {
      const handle = btn.dataset.handle;
      if (!handle) return;
      updateWishlistButton(btn);
      btn.addEventListener('click', e => {
        e.preventDefault();
        toggleWishlist(handle);
        updateWishlistButton(btn);
        updateWishlistCounter();
      });
    });
  }

  async function renderWishlistPage() {
    const container = document.getElementById('wishlist-container');
    if (!container) return;

    const handles = readWishlist();
    if (!handles.length) {
      container.innerHTML = '<p>Your wishlist is empty.</p>';
      return;
    }

    container.innerHTML = '';

    for (const handle of handles) {
      try {
        const res = await fetch(`${API_ROOT}${handle}.js`);
        if (!res.ok) throw new Error(res.status);
        const product = await res.json();

        const card = document.createElement('div');
        card.className = 'grid__item wishlist-item';
        card.innerHTML = `
          <div class="card-wrapper product-card-wrapper underline-links-hover">
            <div class="wishlist-card">
              <div class="wishlist-card__inner">
                <div class="wishlist-card__media">
                  <div class="wishlist-media">
                    <img src="${product.images[0] || ''}" alt="${product.title}">
                  </div>
                </div>
              </div>
              <div class="card__information">
                <h3 class="card__heading h3">
                  <a href="${product.url}" class="full-unstyled-link">${product.title}</a>
                </h3>
                <p>${Shopify.formatMoney(product.price)}</p>
                <button class="btn btn--remove-wl" data-handle="${handle}" aria-label="Remove from wishlist">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);

        card.querySelector('.btn--remove-wl').addEventListener('click', e => {
          e.preventDefault();
          toggleWishlist(handle);
          card.remove();
          updateWishlistCounter();
          if (!readWishlist().length) {
            container.innerHTML = '<p>Your wishlist is empty.</p>';
          }
          document
            .querySelectorAll(`.btn--wishlist[data-handle="${handle}"]`)
            .forEach(updateWishlistButton);
        });

      } catch (err) {
        console.warn(`Could not load product ${handle}:`, err);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initWishlistButtons();
    updateWishlistCounter();
    renderWishlistPage();
  });
})();
