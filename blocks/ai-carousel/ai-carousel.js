/* carousel.js */

export default function decorate(block) {
  /*
    EDS structure:

    .carousel
      > div (hero row)
      > div (card row)
  */

  const rows = [...block.querySelectorAll(':scope > div')];

  /* =========================
     HERO CONTENT
  ========================= */
  const heroRow = rows[0];
  const heroCell = heroRow?.querySelector(':scope > div');

  const heroParagraphs = heroCell
    ? [...heroCell.querySelectorAll('p')]
    : [];

  const heroTitle = heroParagraphs[0]?.textContent.trim() || '';
  const heroDescSource = heroParagraphs[1] || null;

  /* =========================
     EXTRACT ALL CARDS
  ========================= */
  const cards = [];

  rows.slice(1).forEach((row) => {
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      if (!cell.textContent.trim()) return;

      const title = cell.querySelector('strong')?.textContent.trim() || '';
      const paragraphs = [...cell.querySelectorAll('p')];

      const descElement = paragraphs.find(
        (p) => !p.querySelector('strong') && !p.querySelector('a'),
      );

      const link = cell.querySelector('a');

      if (title || descElement) {
        cards.push({
          title,
          descSource: descElement || null,
          linkSource: link || null,
        });
      }
    });
  });

  /* =========================
     HELPERS
  ========================= */

  function getCardsPerView() {
    const width = window.innerWidth;
    if (width >= 1500) return 3;
    if (width >= 1024) return 2;
    if (width >= 768) return 2;
    return 1;
  }

  function chunkArray(arr, size) {
    const result = [];

    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  }

  /* Clone the actual child nodes of a source element into a target element.
     This preserves rich, authored formatting (bold, links, etc.) without
     ever serializing to / parsing from an HTML string (no innerHTML). */
  function cloneChildren(sourceEl, targetEl) {
    if (!sourceEl) return;
    [...sourceEl.childNodes].forEach((node) => {
      targetEl.appendChild(node.cloneNode(true));
    });
  }

  function buildCardElement(card) {
    const article = document.createElement('article');
    article.className = 'dell-ai-carousel-card';

    const titleEl = document.createElement('h3');
    titleEl.className = 'dell-ai-carousel-card-title';
    titleEl.textContent = card.title;
    article.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.className = 'dell-ai-carousel-card-desc';
    cloneChildren(card.descSource, descEl);
    article.appendChild(descEl);

    if (card.linkSource) {
      const anchor = document.createElement('a');
      anchor.href = card.linkSource.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      anchor.className = 'dell-ai-carousel-card-link';
      anchor.textContent = card.linkSource.textContent.trim();
      article.appendChild(anchor);
    }

    return article;
  }

  function buildSlideElement(group) {
    const slide = document.createElement('div');
    slide.className = 'dell-ai-carousel-slide';
    group.forEach((card) => slide.appendChild(buildCardElement(card)));
    return slide;
  }

  function buildSlides(cardsPerView) {
    const grouped = chunkArray(cards, cardsPerView);
    return grouped.map(buildSlideElement);
  }

  function buildDotElement(index, activeIndex) {
    const button = document.createElement('button');
    button.className = `dell-ai-carousel-dot${index === activeIndex ? ' dell-ai-carousel-dot-active' : ''}`;
    button.setAttribute('aria-label', `Go to slide ${index + 1}`);
    button.dataset.index = String(index);
    button.addEventListener('click', () => {
      goToSlide(index); // eslint-disable-line no-use-before-define
    });
    return button;
  }

  function buildDots(total, activeIndex) {
    return Array.from({ length: total }, (_, i) => buildDotElement(i, activeIndex));
  }

  /* =========================
     ROOT CLASS
  ========================= */

  block.classList.add('dell-ai-carousel');

  /* =========================
     INITIAL MARKUP (DOM API, no innerHTML)
  ========================= */

  const heroSection = document.createElement('div');
  heroSection.className = 'dell-ai-carousel-hero';

  const heroTitleEl = document.createElement('h2');
  heroTitleEl.className = 'dell-ai-carousel-hero-title';
  heroTitleEl.textContent = heroTitle;
  heroSection.appendChild(heroTitleEl);

  const heroDescEl = document.createElement('div');
  heroDescEl.className = 'dell-ai-carousel-hero-desc';
  cloneChildren(heroDescSource, heroDescEl);
  heroSection.appendChild(heroDescEl);

  const shell = document.createElement('div');
  shell.className = 'dell-ai-carousel-shell';

  const prevButton = document.createElement('button');
  prevButton.className = 'dell-ai-carousel-arrow dell-ai-carousel-arrow-prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.textContent = '\u2190';

  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'dell-ai-carousel-track-wrapper';

  const track = document.createElement('div');
  track.className = 'dell-ai-carousel-track';
  trackWrapper.appendChild(track);

  const nextButton = document.createElement('button');
  nextButton.className = 'dell-ai-carousel-arrow dell-ai-carousel-arrow-next';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.textContent = '\u2192';

  shell.append(prevButton, trackWrapper, nextButton);

  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'dell-ai-carousel-dots';

  block.replaceChildren(heroSection, shell, dotsContainer);

  /* =========================
     STATE
  ========================= */

  let currentSlide = 0;
  let cardsPerView = getCardsPerView();
  let totalSlides = 0;

  /* =========================
     NAVIGATION
  ========================= */

  function updateUI() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    dotsContainer
      .querySelectorAll('.dell-ai-carousel-dot')
      .forEach((dot, index) => {
        dot.classList.toggle(
          'dell-ai-carousel-dot-active',
          index === currentSlide,
        );
      });

    prevButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide === totalSlides - 1;
  }

  function goToSlide(index) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    updateUI();
  }

  /* =========================
     BUILD CAROUSEL
  ========================= */

  function buildCarousel() {
    cardsPerView = getCardsPerView();

    const groupedSlides = chunkArray(cards, cardsPerView);
    totalSlides = groupedSlides.length;

    track.replaceChildren(...buildSlides(cardsPerView));
    dotsContainer.replaceChildren(...buildDots(totalSlides, currentSlide));

    if (currentSlide >= totalSlides) {
      currentSlide = totalSlides - 1;
    }

    updateUI();
  }

  /* =========================
     LISTENER LIFECYCLE
     Guard against listener accumulation if this block is ever
     re-decorated (e.g. re-run of decorate() on the same element).
     Any previously registered listeners for this block are aborted
     before new ones are attached.
  ========================= */

  if (block.dellAiCarouselController) {
    block.dellAiCarouselController.abort();
  }
  const controller = new AbortController();
  block.dellAiCarouselController = controller;
  const { signal } = controller;

  /* =========================
     ARROWS
  ========================= */

  prevButton.addEventListener('click', () => {
    goToSlide(currentSlide - 1);
  }, { signal });

  nextButton.addEventListener('click', () => {
    goToSlide(currentSlide + 1);
  }, { signal });

  /* =========================
     TOUCH SWIPE
  ========================= */

  let touchStartX = 0;

  track.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true, signal },
  );

  track.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) < 50) return;

      if (diff > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    },
    { passive: true, signal },
  );

  /* =========================
     RESPONSIVE REBUILD
  ========================= */

  let resizeTimer;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      const updatedCPV = getCardsPerView();

      if (updatedCPV !== cardsPerView) {
        currentSlide = 0;
        buildCarousel();
      }
    }, 150);
  }, { signal });

  /* =========================
     INITIALIZE
  ========================= */

  buildCarousel();
}