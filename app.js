/**
 * app.js — Akosombo International School (AIS) Core Interactive System
 * Features:
 * 1. Dark/Light Mode Theme Toggle Engine with LocalStorage Persistence
 * 2. Mobile Drawer Navigation & Animated Hamburger Toggle
 * 3. Universal Full-Screen Lightbox Modal for Photos & Social Moments
 * 4. Social Media Platform Feed Filter System
 * 5. Interactive Snapchat/Instagram Story Viewer
 * 6. Smooth Scroll Reveal & Active Nav Highlight
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ════════════════════════════════════════════════
       1. THEME ENGINE (Dark / Light Mode)
       ════════════════════════════════════════════════ */
    const initTheme = () => {
        const savedTheme = localStorage.getItem('ais-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeToggleIcons(currentTheme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('ais-theme', nextTheme);
        updateThemeToggleIcons(nextTheme);
    };

    const updateThemeToggleIcons = (theme) => {
        const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
        toggleButtons.forEach(btn => {
            btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        });
    };

    // Attach listeners to all theme toggle buttons
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    initTheme();

    /* ════════════════════════════════════════════════
       2. MOBILE HAMBURGER & DRAWER NAVIGATION
       ════════════════════════════════════════════════ */
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mobileDrawer = document.querySelector('.mobile-drawer');

    if (hamburgerBtn && mobileDrawer) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = mobileDrawer.classList.toggle('open');
            hamburgerBtn.classList.toggle('active', isOpen);
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileDrawer.contains(e.target) && !hamburgerBtn.contains(e.target) && mobileDrawer.classList.contains('open')) {
                mobileDrawer.classList.remove('open');
                hamburgerBtn.classList.remove('active');
            }
        });

        // Close on link click
        mobileDrawer.querySelectorAll('.link').forEach(link => {
            link.addEventListener('click', () => {
                mobileDrawer.classList.remove('open');
                hamburgerBtn.classList.remove('active');
            });
        });
    }

    /* ════════════════════════════════════════════════
       3. ACTIVE NAV LINK HIGHLIGHT
       ════════════════════════════════════════════════ */
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    /* ════════════════════════════════════════════════
       4. UNIVERSAL LIGHTBOX MODAL
       ════════════════════════════════════════════════ */
    const lightbox = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');

    const openLightbox = (imgSrc, title = 'AIS Spotlight', caption = '') => {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = imgSrc;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCaption) lightboxCaption.textContent = caption;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // Make triggerable elements open the lightbox
    document.querySelectorAll('.lightbox-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const img = el.querySelector('img') || el;
            const imgSrc = el.getAttribute('data-full-img') || img.src;
            const title = el.getAttribute('data-title') || img.alt || 'Akosombo International School';
            const caption = el.getAttribute('data-caption') || '';
            openLightbox(imgSrc, title, caption);
        });
    });

    /* ════════════════════════════════════════════════
       5. SOCIAL FEED PLATFORM FILTER PILLS
       ════════════════════════════════════════════════ */
    const socialFilterPills = document.querySelectorAll('.social-filter-pill');
    const socialCards = document.querySelectorAll('.social-card');

    if (socialFilterPills.length > 0 && socialCards.length > 0) {
        socialFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                socialFilterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const filter = pill.getAttribute('data-platform');
                socialCards.forEach(card => {
                    const platform = card.getAttribute('data-platform');
                    if (filter === 'all' || platform === filter) {
                        card.style.display = 'flex';
                        card.style.animation = 'fadeIn 0.4s ease';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    /* ════════════════════════════════════════════════
       6. INTERSECTION OBSERVER FOR FADE-IN
       ════════════════════════════════════════════════ */
    const fadeEls = document.querySelectorAll('.fade-in');
    if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        fadeEls.forEach(el => observer.observe(el));
    } else {
        fadeEls.forEach(el => el.classList.add('visible'));
    }
});
