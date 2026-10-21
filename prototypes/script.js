/**
 * TECHMARKT (R) — FEATURED TECH CAROUSEL
 * Smooth, infinite-circular 3D-feel product showcase.
 */

// Product data matching the reference layout
const PRODUCTS = [
  {
    id: 'switch',
    name: 'Nintendo Switch OLED',
    price: '$349',
    image: 'assets/nintendo-switch.png',
    alt: 'Nintendo Switch OLED with White Joy-Cons and Dock'
  },
  {
    id: 'ps5',
    name: 'PS5 Console',
    price: '$499',
    image: 'assets/ps5.png',
    alt: 'PlayStation 5 Console with DualSense Controller'
  },
  {
    id: 'pc',
    name: 'Custom Gaming PC',
    price: '$1,499',
    image: 'assets/pc.png',
    alt: 'Custom White Gaming PC with RGB fans and internal display'
  },
  {
    id: 'headphones',
    name: 'Gaming Headphones',
    price: '$149',
    image: 'assets/headphones.png',
    alt: 'Wireless Gaming Headphones in White and Black'
  },
  {
    id: 'xbox',
    name: 'Xbox Series S',
    price: '$299',
    image: 'assets/xbox.png',
    alt: 'Xbox Series S Console with White Wireless Controller'
  }
];

// Configuration
const REPEAT_COUNT = 3; // 3 sets of 5 products = 15 cards for infinite smooth scrolling
const INITIAL_ACTIVE_MODULO = 2; // Center is Custom Gaming PC (index 2)
let currentIndex = PRODUCTS.length + INITIAL_ACTIVE_MODULO; // Index 7 (middle set)
let isAnimating = false;

// DOM Elements
const viewport = document.getElementById('carouselViewport');
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

/**
 * Build the DOM cards for the infinite track
 */
function buildCarousel() {
  track.innerHTML = '';
  let globalCardIndex = 0;

  for (let r = 0; r < REPEAT_COUNT; r++) {
    PRODUCTS.forEach((prod, prodIndex) => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.dataset.index = globalCardIndex;
      card.dataset.prodId = prod.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View ${prod.name}`);

      card.innerHTML = `
        <div class="card-visual">
          <div class="product-img-wrap">
            <img src="${prod.image}" alt="${prod.alt}" class="product-img" loading="eager">
          </div>
          <div class="product-shadow" aria-hidden="true"></div>
        </div>
        <div class="card-info">
          <h3 class="product-name">${prod.name}</h3>
          <p class="product-price">${prod.price}</p>
        </div>
      `;

      // Click to center
      card.addEventListener('click', () => {
        handleCardClick(parseInt(card.dataset.index, 10));
      });

      // Keyboard accessibility on card
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(parseInt(card.dataset.index, 10));
        }
      });

      track.appendChild(card);
      globalCardIndex++;
    });
  }
}

/**
 * Calculate the exact center position and apply CSS transform to track and cards
 */
function updateCarousel(instant = false) {
  const cards = track.querySelectorAll('.carousel-card');
  if (!cards.length) return;

  const activeCard = cards[currentIndex];
  if (!activeCard) return;

  // Determine card spacing and geometry
  const cardRect = activeCard.getBoundingClientRect();
  const cardWidth = activeCard.offsetWidth;
  const style = window.getComputedStyle(activeCard);
  const marginRight = parseFloat(style.marginRight) || 24;
  const cardPitch = cardWidth + marginRight;

  // Align activeCard at exact horizontal center of the viewport
  const viewportWidth = viewport.clientWidth;
  const targetOffset = (viewportWidth / 2) - (currentIndex * cardPitch) - (cardWidth / 2);

  if (instant) {
    track.style.transition = 'none';
  } else {
    track.style.transition = 'transform var(--anim-duration) var(--ease-spring)';
  }

  track.style.transform = `translate3d(${targetOffset}px, 0, 0)`;

  // Update card slot classes
  cards.forEach((card, idx) => {
    const diff = idx - currentIndex;
    card.classList.remove('is-center', 'is-near', 'is-far', 'is-hidden');

    if (diff === 0) {
      card.classList.add('is-center');
      card.setAttribute('aria-current', 'true');
    } else if (Math.abs(diff) === 1) {
      card.classList.add('is-near');
      card.removeAttribute('aria-current');
    } else if (Math.abs(diff) === 2) {
      card.classList.add('is-far');
      card.removeAttribute('aria-current');
    } else {
      card.classList.add('is-hidden');
      card.removeAttribute('aria-current');
    }
  });
}

/**
 * Transition to a specific card index
 */
function goToIndex(newIndex) {
  if (newIndex === currentIndex) return;

  currentIndex = newIndex;
  updateCarousel(false);

  // Seamless normalization when wrapping outside middle set
  const count = PRODUCTS.length;
  const minSafeIndex = count; // 5
  const maxSafeIndex = count * 2 - 1; // 9

  clearTimeout(goToIndex._timer);
  goToIndex._timer = setTimeout(() => {
    if (currentIndex < minSafeIndex) {
      currentIndex += count;
      updateCarousel(true);
      // Force layout reflow
      void track.offsetWidth;
    } else if (currentIndex > maxSafeIndex) {
      currentIndex -= count;
      updateCarousel(true);
      // Force layout reflow
      void track.offsetWidth;
    }
  }, 680); // Corresponds to transition duration (650ms + 30ms buffer)
}

/**
 * Handle card click
 */
function handleCardClick(clickedIndex) {
  goToIndex(clickedIndex);
}

// --------------------------------------------------------------------------
// Event Listeners & Controls
// --------------------------------------------------------------------------

// Arrow buttons
prevBtn.addEventListener('click', () => {
  goToIndex(currentIndex - 1);
});

nextBtn.addEventListener('click', () => {
  goToIndex(currentIndex + 1);
});

// Keyboard navigation (Left / Right arrow keys)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    goToIndex(currentIndex - 1);
  } else if (e.key === 'ArrowRight') {
    goToIndex(currentIndex + 1);
  }
});

// Window resize handling
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCarousel(true);
  }, 50);
});

// --------------------------------------------------------------------------
// Touch & Mouse Drag Support for Silky Mobile/Desktop Navigation
// --------------------------------------------------------------------------
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let dragDistance = 0;

function getPositionX(e) {
  return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
}

viewport.addEventListener('mousedown', dragStart);
viewport.addEventListener('touchstart', dragStart, { passive: true });

viewport.addEventListener('mousemove', dragMove);
viewport.addEventListener('touchmove', dragMove, { passive: true });

viewport.addEventListener('mouseup', dragEnd);
viewport.addEventListener('touchend', dragEnd);
viewport.addEventListener('mouseleave', dragEnd);

function dragStart(e) {
  if (e.target.closest('.arrow-btn')) return;
  isDragging = true;
  startX = getPositionX(e);
  dragDistance = 0;
  viewport.classList.add('is-dragging');
}

function dragMove(e) {
  if (!isDragging) return;
  const currentX = getPositionX(e);
  dragDistance = currentX - startX;
}

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  viewport.classList.remove('is-dragging');

  // Swipe threshold
  const threshold = 50;
  if (dragDistance < -threshold) {
    goToIndex(currentIndex + 1);
  } else if (dragDistance > threshold) {
    goToIndex(currentIndex - 1);
  } else {
    // Snap back
    updateCarousel(false);
  }
  dragDistance = 0;
}

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  buildCarousel();
  // Ensure DOM is painted before computing geometry
  requestAnimationFrame(() => {
    updateCarousel(true);
    // Remove any flash of unstyled content
    setTimeout(() => {
      document.body.classList.add('is-ready');
    }, 100);
  });
});
