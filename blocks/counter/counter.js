export default function decorate(block){
    const odometers  = [...block.firstElementChild.children];
    odometers.forEach((el,idx)=>{
      el.classList.add("text-center");
            el.classList.add("s");
        el.querySelector("h2").classList.add("animate-here");
        observeCounter(el.querySelector(".animate-here"))
        // el.querySelector(".animate-here").textContent = number;
    });
}

function observeCounter(el) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(el);
        obs.unobserve(el); // run once
      }
    });
  }, {
    threshold: 0.4,
  });

  observer.observe(el);
}

/**
 * Animate counter
 */
function animateCounter(el, duration = 1500) {
  if (!el) return;

  const text = el.textContent.trim();

  // Extract prefix, number, suffix
  const match = text.match(/^([^0-9]*)([\d,\.]+)(.*)$/);
  if (!match) return;

  const prefix = match[1];      // $, ₹
  const numberPart = match[2];  // 300, 5,000, 4.8
  const suffix = match[3];      // %, +

  const endValue = parseFloat(numberPart.replace(/,/g, ''));
  const hasDecimal = numberPart.includes('.');

  let startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    const progress = timestamp - startTime;
    const progressRatio = Math.min(progress / duration, 1);

    // easeOutCubic
    const eased = 1 - Math.pow(1 - progressRatio, 3);

    const currentValue = endValue * eased;

    el.textContent =
      prefix +
      formatNumber(currentValue, hasDecimal) +
      suffix;

    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      el.textContent =
        prefix +
        formatNumber(endValue, hasDecimal) +
        suffix;
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Format number (handles commas + decimals)
 */
function formatNumber(value, hasDecimal) {
  return hasDecimal
    ? value.toFixed(1)
    : Math.floor(value).toLocaleString();
}