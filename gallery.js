/**
 * gallery.js — Akosombo International School (AIS) Dynamic Gallery Logic
 * Supports:
 * 1. Dynamic API data loading from /api/gallery
 * 2. Category Tab Switching (Facilities, Sports, Events)
 * 3. View More / View Less Column Toggle
 * 4. Lightbox Click Integration
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
    setupTabSwitching();
    setupViewMoreToggle();
    await loadDynamicGallery();
});

// 1. Tab Switching
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.gallery-tabs .tab');
    const pages = document.querySelectorAll('.page');

    tabs.forEach(clickedTab => {
        clickedTab.addEventListener('click', () => {
            tabs.forEach(tab => tab.classList.remove('current'));
            clickedTab.classList.add('current');

            pages.forEach(page => page.classList.remove('active'));

            const targetId = clickedTab.getAttribute('data-target');
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
        });
    });
}

// 2. View More / View Less Toggle
function setupViewMoreToggle() {
    const viewButtons = document.querySelectorAll('.view-more');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentSection = btn.closest('.page');
            if (!currentSection) return;

            const hiddenCols = currentSection.querySelectorAll('.col3, .col4, .col5, .col6, .col7, .col8');
            if (!hiddenCols || hiddenCols.length === 0) return;

            const isHidden = hiddenCols[0].classList.contains('hidden');

            hiddenCols.forEach(col => {
                if (isHidden) {
                    col.classList.remove('hidden');
                } else {
                    col.classList.add('hidden');
                }
            });

            btn.innerHTML = isHidden 
                ? '<i class="codicon codicon-fold"></i> View Less' 
                : '<i class="codicon codicon-unfold"></i> View More';
        });
    });
}

// 3. Load Dynamic Gallery Photos from API
async function loadDynamicGallery() {
    try {
        const res = await fetch(`${API_BASE}/gallery`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            renderSectionPhotos('facilities', data.data.filter(g => (g.category || '').toLowerCase() === 'facilities'));
            renderSectionPhotos('sports', data.data.filter(g => (g.category || '').toLowerCase() === 'sports'));
            renderSectionPhotos('events', data.data.filter(g => (g.category || '').toLowerCase() === 'events'));
        }
    } catch (err) {
        console.warn('Using local fallback for gallery photos:', err);
    }
}

function renderSectionPhotos(sectionId, photos) {
    if (!photos || photos.length === 0) return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    const container = section.querySelector('.gallery-images');
    if (!container) return;

    // Distribute photos across up to 8 columns (4 items per column)
    const itemsPerCol = 4;
    const numCols = Math.max(2, Math.min(8, Math.ceil(photos.length / itemsPerCol)));
    
    let columnsHtml = '';
    for (let c = 0; c < numCols; c++) {
        const colPhotos = photos.slice(c * itemsPerCol, (c + 1) * itemsPerCol);
        if (colPhotos.length === 0) continue;

        const isHiddenCol = c >= 2 ? `col${c + 1} hidden` : '';
        const colClass = `gallery-column${c + 1} ${isHiddenCol}`.trim();

        const itemsHtml = colPhotos.map(p => {
            const sizeClass = (p.size === 'big') ? 'big-image' : (p.size === 'small' ? 'small-image' : 'medium-image');
            const mediaUrl = formatMediaUrl(p.imageUrl);
            return `
                <div class="${sizeClass} lightbox-trigger" data-title="${escapeGalleryHtml(p.title || 'AIS Gallery')}" data-caption="${escapeGalleryHtml(p.caption || '')}" data-full-img="${escapeGalleryHtml(mediaUrl)}" style="cursor:pointer;" title="${escapeGalleryHtml(p.title || '')}">
                    <img src="${escapeGalleryHtml(mediaUrl)}" alt="${escapeGalleryHtml(p.title || 'AIS Photo')}">
                </div>
            `;
        }).join('');

        columnsHtml += `<div class="${colClass}">${itemsHtml}</div>`;
    }

    container.innerHTML = columnsHtml;

    // Attach click listener for lightbox if available in app.js
    container.querySelectorAll('.lightbox-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const imgSrc = trigger.getAttribute('data-full-img');
            const title = trigger.getAttribute('data-title');
            const caption = trigger.getAttribute('data-caption');

            const lightbox = document.getElementById('lightboxModal');
            const lightboxImg = document.getElementById('lightboxImg');
            const lightboxTitle = document.getElementById('lightboxTitle');
            const lightboxCaption = document.getElementById('lightboxCaption');

            if (lightbox && lightboxImg) {
                lightboxImg.src = imgSrc;
                if (lightboxTitle) lightboxTitle.textContent = title;
                if (lightboxCaption) lightboxCaption.textContent = caption;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
}

function escapeGalleryHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
