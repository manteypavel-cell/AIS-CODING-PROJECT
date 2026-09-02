/**
 * news.js — Akosombo International School (AIS) News Sliders Initializer
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Headline Slider
    if (document.querySelector('.headline-swiper')) {
        new Swiper('.headline-swiper', {
            direction: 'horizontal',
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.headline-swiper .swiper-pagination',
                clickable: true,
            },
        });
    }

    // 2. Initialize Card Slider
    if (document.querySelector('.card-swiper')) {
        new Swiper('.card-swiper', {
            direction: 'horizontal',
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: 2500,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.card-swiper .swiper-pagination',
                clickable: true,
            },
        });
    }
});