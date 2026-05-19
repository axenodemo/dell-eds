// script.js

const slides = document.querySelectorAll(".hero-slide");

const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

const currentText = document.getElementById("current");
const totalText = document.getElementById("total");

const pauseBtn = document.querySelector(".pause-btn");

let currentSlide = 0;
let autoPlay = true;

totalText.textContent = slides.length;

function showSlide(index) {

  slides.forEach((slide) => {
    slide.classList.remove("active");
  });

  slides[index].classList.add("active");

  currentText.textContent = index + 1;
}

function nextSlide() {

  currentSlide++;

  if (currentSlide >= slides.length) {
    currentSlide = 0;
  }

  showSlide(currentSlide);
}

function prevSlide() {

  currentSlide--;

  if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }

  showSlide(currentSlide);
}

nextBtn.addEventListener("click", () => {
  nextSlide();
});

prevBtn.addEventListener("click", () => {
  prevSlide();
});

let sliderInterval = setInterval(() => {

  if (autoPlay) {
    nextSlide();
  }

}, 5000);

pauseBtn.addEventListener("click", () => {

  autoPlay = !autoPlay;

  pauseBtn.textContent = autoPlay
    ? "Pause ||"
    : "Play ▶";

});