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
const getApiBase = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'){
        return 'http://localhost:5000/api';
    }
    return 'https://my-flask-backend-7cwg.onrender.com';
};
const API_BASE = getApiBase();

async function loadNews(){
    try{
        console.log("Attempting to fetch news from:", `${API_BASE}/news`);
        const response = await fetch(`${API_BASE}/news`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("News Data received:", data);
    } catch (error) {
        console.error("Failed to load news articles:", error);
    }
    
}
window.addEventListener('DOMContentLoaded', loadNews);
