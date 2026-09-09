/**
 * news.js — Akosombo International School (AIS) Dynamic News & Sliders Engine
 * Connects with the active backend API (/api/news & /api/headlines)
 * with robust offline fallback.
 */

const getApiBase = () => {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
        return 'http://localhost:3000/api';
    }
    return '/api';
};
const API_BASE = getApiBase();

function formatMediaUrl(url) {
    if (!url) return 'placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/') && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))) {
        return 'http://localhost:3000' + url;
    }
    return url;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadDynamicHeadlines();
    await loadDynamicNews();
    initSliders();
});

// Fetch and render headline banner slides from API
async function loadDynamicHeadlines() {
    const swiperWrapper = document.querySelector('.headline-swiper .swiper-wrapper');
    if (!swiperWrapper) return;

    try {
        const res = await fetch(`${API_BASE}/headlines`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            swiperWrapper.innerHTML = data.data.map(h => `
                <div class="swiper-slide">
                    <img src="${escapeNewsHtml(formatMediaUrl(h.imageUrl))}" alt="${escapeNewsHtml(h.title || 'AIS News')}">
                    ${h.caption ? `<div style="position:absolute; bottom:0; left:0; right:0; padding:18px 24px; background:linear-gradient(to top, rgba(15,41,66,0.9), transparent); color:#fff; font-weight:700;">${escapeNewsHtml(h.title)} - ${escapeNewsHtml(h.caption)}</div>` : ''}
                </div>
            `).join('');
        }
    } catch (err) {
        console.warn('Using local fallback for headline sliders:', err);
    }
}

// Fetch and render news articles from API
async function loadDynamicNews() {
    const newsSection = document.querySelector('.news-section');
    if (!newsSection) return;

    try {
        const res = await fetch(`${API_BASE}/news`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            newsSection.innerHTML = data.data.map((item, index) => {
                // If item has multiple images, render card-swiper
                let mediaHtml = '';
                if (Array.isArray(item.images) && item.images.length > 1) {
                    mediaHtml = `
                        <div class="swiper card-swiper" style="height:100%; width:100%;">
                            <div class="swiper-wrapper">
                                ${item.images.map(img => `<div class="swiper-slide"><img src="${escapeNewsHtml(formatMediaUrl(img))}" alt="${escapeNewsHtml(item.title)}"></div>`).join('')}
                            </div>
                            <div class="swiper-pagination"></div>
                        </div>
                    `;
                } else {
                    mediaHtml = `<img src="${escapeNewsHtml(formatMediaUrl(item.imageUrl))}" alt="${escapeNewsHtml(item.title)}">`;
                }

                return `
                    <div class="news">
                        <div class="news-image">
                            ${mediaHtml}
                        </div>
                        <div class="article">
                            <p class="article-date"><i class="codicon codicon-calendar"></i> ${escapeNewsHtml(item.date || '')} ${item.category ? `· <span style="color:var(--cyan-dark); font-weight:700;">${escapeNewsHtml(item.category)}</span>` : ''}</p>
                            <h3>${escapeNewsHtml(item.title)}</h3>
                            <p>${escapeNewsHtml(item.summary || '')}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.warn('Using local fallback for news list:', err);
    }
}

// Initialize Swiper sliders
function initSliders() {
    // 1. Initialize Headline Slider
    if (document.querySelector('.headline-swiper')) {
        new Swiper('.headline-swiper', {
            direction: 'horizontal',
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: 3500,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.headline-swiper .swiper-pagination',
                clickable: true,
            },
        });
    }

    // 2. Initialize Card Slider
    document.querySelectorAll('.card-swiper').forEach(sliderEl => {
        new Swiper(sliderEl, {
            direction: 'horizontal',
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: 2800,
                disableOnInteraction: false,
            },
            pagination: {
                el: sliderEl.querySelector('.swiper-pagination'),
                clickable: true,
            },
        });
    });
}

function escapeNewsHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}