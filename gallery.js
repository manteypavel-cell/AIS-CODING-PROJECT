/**
 * gallery.js — Akosombo International School (AIS) Gallery Logic
 * Supports:
 * 1. Tab Switching (Facilities, Sports, Events)
 * 2. View More / View Less Column Toggle across all extra placeholder columns
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching
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

    // 2. View More / View Less Toggle
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
});
