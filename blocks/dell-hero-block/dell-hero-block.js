export default function decorate(block) {

  const rows = [...block.children];

  // CONTROLS
  const controlsRow = rows[0];

  const playText =
    controlsRow.children[0]?.textContent.trim() || 'Play';

  const pauseText =
    controlsRow.children[1]?.textContent.trim() || 'Pause';

  // SLIDES
  const slides = rows.slice(1).map((row) => {

    const cols = [...row.children];

    return {
      image: cols[0]?.textContent.trim(),
      mobileImage: cols[1]?.textContent.trim(),
      eyebrow: cols[2]?.textContent.trim(),
      title: cols[3]?.textContent.trim(),
      description: cols[4]?.textContent.trim(),
      primaryText: cols[5]?.textContent.trim(),
      primaryLink: cols[6]?.textContent.trim(),
      secondaryText: cols[7]?.textContent.trim(),
      secondaryLink: cols[8]?.textContent.trim(),
    };
  });

  // CLEAR ORIGINAL
  block.textContent = '';

  // MAIN WRAPPER
  const carousel = document.createElement('section');
  carousel.className = 'hero-carousel-dell-hero-block';

  // CREATE SLIDES
  slides.forEach((slide, index) => {

    const slideEl = document.createElement('div');

    slideEl.className =
      `hero-slide-dell-hero-block ${index === 0 ? 'active' : ''} ${
        index % 2 === 0 ? 'dark-theme-dell-hero-block' : 'light-theme-dell-hero-block'
      }`;

    slideEl.innerHTML = `
      <div class="hero-content-dell-hero-block">

        <p class="eyebrow-dell-hero-block">
          ${slide.eyebrow || ''}
        </p>

        <h1 class="title-dell-hero-block">
          ${slide.title || ''}
        </h1>

        <p class="desc-dell-hero-block">
          ${slide.description || ''}
        </p>

        <div class="btn-wrap-dell-hero-block">

          ${
            slide.primaryText
              ? `
                <a
                  href="${slide.primaryLink || '#'}"
                  class="primary-btn-dell-hero-block"
                >
                  ${slide.primaryText}
                </a>
              `
              : ''
          }

          ${
            slide.secondaryText
              ? `
                <a
                  href="${slide.secondaryLink || '#'}"
                  class="outline-btn-dell-hero-block"
                >
                  ${slide.secondaryText}
                </a>
              `
              : ''
          }

        </div>

      </div>

      <div class="hero-image-dell-hero-block">
        <picture>
          ${slide.mobileImage ? `
            <source
              media="(max-width: 768px)"
              srcset="${slide.mobileImage}"
            />
          ` : ''}

          <img
            src="${slide.image}"
            alt="${slide.title || 'Hero Banner'}"
          />
        </picture>
      </div>
    `;

    carousel.append(slideEl);
  });

  // CONTROLS
  const controls = document.createElement('div');

  controls.className = 'carousel-controls-dell-hero-block';

  controls.innerHTML = `
    <button class="nav-btn-dell-hero-block prev-dell-hero-block">
      &#8592;
    </button>

    <div class="slide-count-dell-hero-block">
      <span class="current-slide-dell-hero-block">1</span>/${slides.length}
    </div>

    <button class="nav-btn-dell-hero-block next-dell-hero-block">
      &#8594;
    </button>

    <button class="pause-btn-dell-hero-block">
      ${pauseText} ||
    </button>
  `;

  carousel.append(controls);
  block.append(carousel);

  // JS (SCOPED)
  const heroSlides =
    block.querySelectorAll('.hero-slide-dell-hero-block');

  const nextBtn =
    block.querySelector('.next-dell-hero-block');

  const prevBtn =
    block.querySelector('.prev-dell-hero-block');

  const currentSlideText =
    block.querySelector('.current-slide-dell-hero-block');

  const pauseBtn =
    block.querySelector('.pause-btn-dell-hero-block');

  let currentSlide = 0;
  let autoPlay = true;

  function showSlide(index) {

    heroSlides.forEach((slide) => {
      slide.classList.remove('active');
    });

    heroSlides[index].classList.add('active');

    currentSlideText.textContent = index + 1;
  }

  function nextSlide() {

    currentSlide++;

    if (currentSlide >= heroSlides.length) {
      currentSlide = 0;
    }

    showSlide(currentSlide);
  }

  function prevSlide() {

    currentSlide--;

    if (currentSlide < 0) {
      currentSlide = heroSlides.length - 1;
    }

    showSlide(currentSlide);
  }

  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);

  setInterval(() => {

    if (autoPlay) {
      nextSlide();
    }

  }, 5000);

  pauseBtn.addEventListener('click', () => {

    autoPlay = !autoPlay;

    pauseBtn.textContent = autoPlay
      ? `${pauseText} ||`
      : `${playText} ▶`;
  });
}