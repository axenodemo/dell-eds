export default function decorate(block) {
  const rows = [...block.children];

  // CONTROLS
  const controlsRow = rows[0];

  const controlsText = controlsRow.children[0]?.textContent.trim()
    || 'Play,Pause';

  const [playLabel, pauseLabel] = controlsText.split(',');

  const playText = playLabel?.trim() || 'Play';

  const pauseText = pauseLabel?.trim() || 'Pause';

  // SLIDES
  const slides = rows.slice(1).map((row) => {
    const cols = [...row.children];

    const pictureEls = row.querySelectorAll('picture');

    const contentCol = cols[2];

    const eyebrowEl = contentCol?.querySelector('p');

    const titleEl = contentCol?.querySelector('h2');

    const descriptionEl = contentCol?.querySelector('h3');

    const linkEls = contentCol?.querySelectorAll('a') || [];

    return {
      image: pictureEls[0]?.querySelector('img')?.src || '',

      mobileImage:
        pictureEls[1]?.querySelector('img')?.src || '',

      eyebrow:
        eyebrowEl?.textContent.trim() || '',

      title:
        titleEl?.textContent.trim() || '',

      description:
        descriptionEl?.textContent.trim() || '',

      primaryText:
        linkEls[0]?.textContent.trim() || '',

      primaryLink:
        linkEls[0]?.href || '',

      secondaryText:
        linkEls[1]?.textContent.trim() || '',

      secondaryLink:
        linkEls[1]?.href || '',
    };
  });

  block.textContent = '';

  const carousel = document.createElement('section');

  carousel.className = 'hero-carousel-dell-hero-block';

  slides.forEach((slide, index) => {
    const slideEl = document.createElement('div');

    slideEl.className = `
      hero-slide-dell-hero-block
      ${index === 0 ? 'active' : ''}
      ${
  index % 2 === 0
    ? 'dark-theme-dell-hero-block'
    : 'light-theme-dell-hero-block'
}
    `;

    const content = document.createElement('div');
    content.className = 'hero-content-dell-hero-block';

    // Eyebrow
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow-dell-hero-block';
    eyebrow.textContent = slide.eyebrow;
    content.appendChild(eyebrow);

    // Title
    const title = document.createElement('h1');
    title.className = 'title-dell-hero-block';
    title.textContent = slide.title;
    content.appendChild(title);

    // Description
    const desc = document.createElement('p');
    desc.className = 'desc-dell-hero-block';
    desc.textContent = slide.description;
    content.appendChild(desc);

    // Buttons
    const btnWrap = document.createElement('div');
    btnWrap.className = 'btn-wrap-dell-hero-block';

    if (slide.primaryText) {
      const primary = document.createElement('a');
      primary.className = 'primary-btn-dell-hero-block';
      primary.textContent = slide.primaryText;
      primary.href = slide.primaryLink || '#';
      btnWrap.appendChild(primary);
    }

    if (slide.secondaryText) {
      const secondary = document.createElement('a');
      secondary.className = 'outline-btn-dell-hero-block';
      secondary.textContent = slide.secondaryText;
      secondary.href = slide.secondaryLink || '#';
      btnWrap.appendChild(secondary);
    }

    content.appendChild(btnWrap);

   const imageWrapper = document.createElement('div');
   imageWrapper.className = 'hero-image-dell-hero-block';

   const picture = document.createElement('picture');

   if (slide.mobileImage) {
     const source = document.createElement('source');
     source.media = '(max-width: 1023px)';
     source.srcset = slide.mobileImage;
     picture.appendChild(source);
   }

   const img = document.createElement('img');
   img.src = slide.image;
   img.alt = slide.title || 'Hero Banner';

   picture.appendChild(img);
   imageWrapper.appendChild(picture);

   slideEl.appendChild(content);
   slideEl.appendChild(imageWrapper);

   carousel.append(slideEl);
  });

  // CONTROLS
  const controls = document.createElement('div');

  controls.className = 'carousel-controls-dell-hero-block';

  const controlsGroup = document.createElement('div');
  controlsGroup.className = 'controls-group-dell-hero-block';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'nav-btn-dell-hero-block prev-dell-hero-block';
  prevBtn.textContent = '←';

  const slideCount = document.createElement('div');
  slideCount.className = 'slide-count-dell-hero-block';

  const current = document.createElement('span');
  current.className = 'current-slide-dell-hero-block';
  current.textContent = '1';

  slideCount.appendChild(current);
  slideCount.append(`/${slides.length}`);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'nav-btn-dell-hero-block next-dell-hero-block';
  nextBtn.textContent = '→';

  controlsGroup.appendChild(prevBtn);
  controlsGroup.appendChild(slideCount);
  controlsGroup.appendChild(nextBtn);

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'pause-btn-dell-hero-block';
  pauseBtn.textContent = `${pauseText} ||`;

  controls.appendChild(controlsGroup);
  controls.appendChild(pauseBtn);

  carousel.append(controls);

  block.append(carousel);

  // JS
  const heroSlides = block.querySelectorAll(
    '.hero-slide-dell-hero-block',
  );

  const currentSlideText = block.querySelector(
    '.current-slide-dell-hero-block',
  );

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
    currentSlide += 1;

    if (currentSlide >= heroSlides.length) {
      currentSlide = 0;
    }

    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide -= 1;

    if (currentSlide < 0) {
      currentSlide = heroSlides.length - 1;
    }

    showSlide(currentSlide);
  }

  nextBtn.addEventListener('click', nextSlide);

  prevBtn.addEventListener('click', prevSlide);

  const autoPlayInterval = setInterval(() => {
    if (autoPlay) {
      nextSlide();
    }
  }, 5000);

  const observer = new MutationObserver(() => {
    if (!document.body.contains(block)) {
      clearInterval(autoPlayInterval);
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  pauseBtn.addEventListener('click', () => {
    autoPlay = !autoPlay;

    pauseBtn.textContent = autoPlay
      ? `${pauseText} ||`
      : `${playText} ▶`;
  });
}
