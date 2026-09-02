/**
 * admin.js — Akosombo International School Management Portal Controller
 * Full CRUD for News, Gallery, Inquiries, and Admin Authentication
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

let authToken = localStorage.getItem('ais_admin_token') || '';
let currentNewsList = [];
let currentGalleryList = [];
let currentInquiriesList = [];

// ==========================================
// 1. INITIALIZATION & AUTH STATE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupTabNavigation();
    setupAuthListeners();
    setupNewsListeners();
    setupGalleryListeners();
    setupInquiriesListeners();
    setupSettingsListeners();
    setupDropzones();

    if (authToken) {
        verifyAuth();
    } else {
        showLoginOverlay();
    }
});

// Theme Management for Admin
function initTheme() {
    const savedTheme = localStorage.getItem('ais-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme') || 'light';
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('ais-theme', next);
        });
    }
}

// Toast helper
function showToast(msg, isError = false) {
    const toast = document.getElementById('adminToast');
    const toastMsg = document.getElementById('adminToastMsg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.className = 'admin-toast show ' + (isError ? 'toast-error' : 'toast-success');

    setTimeout(() => {
        toast.className = 'admin-toast';
    }, 3500);
}

// Check if authenticated
async function verifyAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            hideLoginOverlay();
            loadDashboardData();
        } else {
            logout();
        }
    } catch (e) {
        // Fallback for offline testing if token exists
        hideLoginOverlay();
        loadDashboardData();
    }
}

function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
}

function logout() {
    authToken = '';
    localStorage.removeItem('ais_admin_token');
    showLoginOverlay();
    showToast('Signed out successfully.');
}

function setupAuthListeners() {
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (data.success && data.token) {
                    authToken = data.token;
                    localStorage.setItem('ais_admin_token', authToken);
                    hideLoginOverlay();
                    showToast('Welcome back, Administrator!');
                    loadDashboardData();
                } else {
                    showToast(data.message || 'Invalid credentials.', true);
                }
            } catch (err) {
                showToast('Unable to connect to server backend.', true);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Global Tab Switcher
window.adminSwitchTab = function(tabId) {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.admin-tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === tabId);
    });
    if (tabId === 'tab-news') loadNews();
    if (tabId === 'tab-gallery') loadGallery();
    if (tabId === 'tab-inquiries') loadInquiries();
    if (tabId === 'tab-overview') loadDashboardData();
};

function setupTabNavigation() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            adminSwitchTab(tabId);
        });
    });
}

// ==========================================
// 2. OVERVIEW DASHBOARD DATA
// ==========================================
async function loadDashboardData() {
    try {
        const res = await fetch(`${API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success && data.stats) {
            document.getElementById('statNewsCount').textContent = data.stats.totalNews;
            document.getElementById('statGalleryCount').textContent = data.stats.totalGallery;
            document.getElementById('statUnreadCount').textContent = data.stats.unreadContacts;

            const badge = document.getElementById('unreadBadge');
            if (badge) {
                if (data.stats.unreadContacts > 0) {
                    badge.textContent = data.stats.unreadContacts;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }

            renderOverviewInquiries(data.recentContacts || []);
            renderOverviewNews(data.recentNews || []);
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

function renderOverviewInquiries(items) {
    const container = document.getElementById('overviewRecentInquiries');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No inquiries received yet.</p>';
        return;
    }

    container.innerHTML = items.map(c => `
        <div style="padding:10px 0; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:700; font-size:0.88rem; display:flex; align-items:center; gap:6px;">
                    ${c.read ? '' : '<span style="width:8px; height:8px; background:var(--cyan-dark); border-radius:50%; display:inline-block;"></span>'}
                    ${escapeHtml(c.firstName + ' ' + c.lastName)}
                </div>
                <div style="font-size:0.78rem; color:var(--text-light);">${escapeHtml(c.email)}</div>
            </div>
            <button class="btn-secondary" style="font-size:0.75rem; padding:4px 10px;" onclick="openInquiryModal('${c.id}')">View</button>
        </div>
    `).join('');
}

function renderOverviewNews(items) {
    const container = document.getElementById('overviewRecentNews');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No news published yet.</p>';
        return;
    }

    container.innerHTML = items.map(n => `
        <div style="padding:10px 0; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:700; font-size:0.88rem;">${escapeHtml(n.title)}</div>
                <div style="font-size:0.78rem; color:var(--text-light);">${escapeHtml(n.date)} · <span style="color:var(--cyan-dark);">${escapeHtml(n.category || 'General')}</span></div>
            </div>
            <button class="btn-secondary" style="font-size:0.75rem; padding:4px 10px;" onclick="editNews('${n.id}')">Edit</button>
        </div>
    `).join('');
}

// ==========================================
// 3. NEWS & EVENTS CRUD
// ==========================================
async function loadNews() {
    const tbody = document.getElementById('newsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Loading news articles...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/news`);
        const data = await res.json();
        if (data.success) {
            currentNewsList = data.data || [];
            renderNewsTable(currentNewsList);
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#DC2626;">Error fetching news articles.</td></tr>';
    }
}

function renderNewsTable(list) {
    const tbody = document.getElementById('newsTableBody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No news articles found. Click "Publish New Article" to add one!</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr>
            <td>
                <img src="${escapeHtml(formatMediaUrl(item.imageUrl))}" alt="Cover" style="width:50px; height:40px; object-fit:cover; border-radius:var(--radius-sm);">
            </td>
            <td>
                <strong style="display:block; font-size:0.92rem; color:var(--text-dark);">${escapeHtml(item.title)}</strong>
                <span style="font-size:0.8rem; color:var(--text-light); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">
                    ${escapeHtml(item.summary || '')}
                </span>
            </td>
            <td>
                <span style="background:var(--bg-card-subtle); padding:4px 10px; border-radius:var(--radius-full); font-size:0.78rem; font-weight:700; color:var(--cyan-dark); border:1px solid var(--border-subtle);">
                    ${escapeHtml(item.category || 'General')}
                </span>
            </td>
            <td style="white-space:nowrap; font-size:0.82rem; color:var(--text-light);">${escapeHtml(item.date || '')}</td>
            <td>
                ${item.isHeadline ? '<span style="color:#D97706; font-size:0.8rem; font-weight:800;"><i class="codicon codicon-star-full"></i> Featured</span>' : '<span style="color:var(--text-muted); font-size:0.8rem;">Standard</span>'}
            </td>
            <td style="text-align:right; white-space:nowrap;">
                <button class="btn-secondary" style="padding:6px 12px; font-size:0.78rem;" onclick="editNews('${item.id}')">
                    <i class="codicon codicon-edit"></i> Edit
                </button>
                <button class="btn-danger" style="margin-left:4px;" onclick="deleteNews('${item.id}')">
                    <i class="codicon codicon-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function setupNewsListeners() {
    const createBtn = document.getElementById('openCreateNewsModalBtn');
    const newsModal = document.getElementById('newsModal');
    const closeBtn = document.getElementById('closeNewsModalBtn');
    const cancelBtn = document.getElementById('cancelNewsModalBtn');
    const newsForm = document.getElementById('newsForm');
    const searchInput = document.getElementById('newsSearchInput');
    const categoryFilter = document.getElementById('newsCategoryFilter');

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            document.getElementById('newsModalTitle').textContent = 'Publish News Article';
            document.getElementById('newsForm').reset();
            document.getElementById('newsEditId').value = '';
            document.getElementById('newsPreviewImg').style.display = 'none';
            document.getElementById('newsDate').value = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            newsModal.classList.add('open');
        });
    }

    const closeModal = () => newsModal && newsModal.classList.remove('open');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('newsEditId').value;
            const title = document.getElementById('newsTitle').value;
            const date = document.getElementById('newsDate').value;
            const category = document.getElementById('newsCategory').value;
            const summary = document.getElementById('newsSummary').value;
            const content = document.getElementById('newsContent').value;
            const imageUrl = document.getElementById('newsImageUrl').value || 'placeholder.png';
            const isHeadline = document.getElementById('newsIsHeadline').checked;

            const payload = { title, date, category, summary, content, imageUrl, isHeadline };

            try {
                const url = editId ? `${API_BASE}/news/${editId}` : `${API_BASE}/news`;
                const method = editId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    showToast(editId ? 'Article updated successfully!' : 'Article published successfully!');
                    closeModal();
                    loadNews();
                    loadDashboardData();
                } else {
                    showToast(data.message || 'Error saving article.', true);
                }
            } catch (err) {
                showToast('Server connection error.', true);
            }
        });
    }

    // Live search & category filter
    const filterNews = () => {
        const q = (searchInput ? searchInput.value : '').toLowerCase();
        const cat = categoryFilter ? categoryFilter.value : 'all';

        const filtered = currentNewsList.filter(item => {
            const matchesQ = !q || (item.title && item.title.toLowerCase().includes(q)) || (item.summary && item.summary.toLowerCase().includes(q));
            const matchesCat = cat === 'all' || item.category === cat;
            return matchesQ && matchesCat;
        });
        renderNewsTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterNews);
    if (categoryFilter) categoryFilter.addEventListener('change', filterNews);
}

window.editNews = function(id) {
    const item = currentNewsList.find(n => n.id === id);
    if (!item) return;

    document.getElementById('newsModalTitle').textContent = 'Edit News Article';
    document.getElementById('newsEditId').value = item.id;
    document.getElementById('newsTitle').value = item.title || '';
    document.getElementById('newsDate').value = item.date || '';
    document.getElementById('newsCategory').value = item.category || 'General';
    document.getElementById('newsSummary').value = item.summary || '';
    document.getElementById('newsContent').value = item.content || '';
    document.getElementById('newsImageUrl').value = item.imageUrl || '';
    document.getElementById('newsIsHeadline').checked = Boolean(item.isHeadline);

    const preview = document.getElementById('newsPreviewImg');
    if (item.imageUrl) {
        preview.src = item.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('newsModal').classList.add('open');
};

window.deleteNews = async function(id) {
    if (!confirm('Are you sure you want to delete this news article?')) return;

    try {
        const res = await fetch(`${API_BASE}/news/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast('Article deleted successfully.');
            loadNews();
            loadDashboardData();
        } else {
            showToast(data.message || 'Failed to delete article.', true);
        }
    } catch (err) {
        showToast('Connection error.', true);
    }
};

// ==========================================
// 4. PHOTO GALLERY CRUD
// ==========================================
async function loadGallery() {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px;">Loading gallery photos...</p>';

    try {
        const res = await fetch(`${API_BASE}/gallery`);
        const data = await res.json();
        if (data.success) {
            currentGalleryList = data.data || [];
            renderGalleryGrid(currentGalleryList);
        }
    } catch (err) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#DC2626; padding:30px;">Error fetching gallery photos.</p>';
    }
}

function renderGalleryGrid(list) {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px;">No photos found in this category. Click "Upload Photo" to add one!</p>';
        return;
    }

    grid.innerHTML = list.map(item => `
        <div class="admin-gallery-card">
            <img class="admin-gallery-thumb" src="${escapeHtml(formatMediaUrl(item.imageUrl))}" alt="${escapeHtml(item.title || 'Photo')}">
            <div class="admin-gallery-body">
                <h4>${escapeHtml(item.title || 'Photo')}</h4>
                <p>${escapeHtml(item.caption || 'No caption added.')}</p>
                <div class="admin-gallery-footer">
                    <span style="background:var(--cyan-pale); color:var(--cyan-dark); padding:3px 8px; border-radius:var(--radius-full); font-size:0.75rem; font-weight:700; text-transform:capitalize;">
                        ${escapeHtml(item.category || 'facilities')}
                    </span>
                    <button class="btn-danger" style="padding:4px 8px;" onclick="deleteGalleryItem('${item.id}')" title="Delete Photo">
                        <i class="codicon codicon-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setupGalleryListeners() {
    const uploadBtn = document.getElementById('openUploadGalleryModalBtn');
    const galleryModal = document.getElementById('galleryModal');
    const closeBtn = document.getElementById('closeGalleryModalBtn');
    const cancelBtn = document.getElementById('cancelGalleryModalBtn');
    const galleryForm = document.getElementById('galleryForm');
    const searchInput = document.getElementById('gallerySearchInput');
    const catPills = document.querySelectorAll('.gallery-cat-pill');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            document.getElementById('galleryForm').reset();
            document.getElementById('galleryEditId').value = '';
            document.getElementById('galleryPreviewImg').style.display = 'none';
            galleryModal.classList.add('open');
        });
    }

    const closeModal = () => galleryModal && galleryModal.classList.remove('open');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (galleryForm) {
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('galleryTitle').value;
            const category = document.getElementById('galleryCategory').value;
            const size = document.getElementById('gallerySize').value;
            const caption = document.getElementById('galleryCaption').value;
            const imageUrl = document.getElementById('galleryImageUrl').value;

            if (!imageUrl) {
                showToast('Please select an image to upload or enter an image URL.', true);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/gallery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ title, category, size, caption, imageUrl })
                });
                const data = await res.json();

                if (data.success) {
                    showToast('Photo added to gallery!');
                    closeModal();
                    loadGallery();
                    loadDashboardData();
                } else {
                    showToast(data.message || 'Error saving photo.', true);
                }
            } catch (err) {
                showToast('Connection error.', true);
            }
        });
    }

    // Category pills filter
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const cat = pill.getAttribute('data-category');
            filterGallery(cat);
        });
    });

    const filterGallery = (cat) => {
        const activeCat = cat || document.querySelector('.gallery-cat-pill.active')?.getAttribute('data-category') || 'all';
        const q = (searchInput ? searchInput.value : '').toLowerCase();

        const filtered = currentGalleryList.filter(item => {
            const matchesCat = activeCat === 'all' || (item.category && item.category.toLowerCase() === activeCat.toLowerCase());
            const matchesQ = !q || (item.title && item.title.toLowerCase().includes(q)) || (item.caption && item.caption.toLowerCase().includes(q));
            return matchesCat && matchesQ;
        });
        renderGalleryGrid(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', () => filterGallery());
}

window.deleteGalleryItem = async function(id) {
    if (!confirm('Are you sure you want to remove this photo from the gallery?')) return;

    try {
        const res = await fetch(`${API_BASE}/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast('Photo removed successfully.');
            loadGallery();
            loadDashboardData();
        } else {
            showToast(data.message || 'Failed to remove photo.', true);
        }
    } catch (err) {
        showToast('Connection error.', true);
    }
};

// ==========================================
// 5. CONTACT INQUIRIES MANAGEMENT
// ==========================================
async function loadInquiries() {
    const container = document.getElementById('inquiriesListContainer');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:30px;">Loading contact inquiries...</p>';

    try {
        const res = await fetch(`${API_BASE}/contact`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            currentInquiriesList = data.data || [];
            renderInquiriesList(currentInquiriesList);
        }
    } catch (err) {
        container.innerHTML = '<p style="text-align:center; color:#DC2626; padding:30px;">Error fetching inquiries.</p>';
    }
}

function renderInquiriesList(list) {
    const container = document.getElementById('inquiriesListContainer');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = '<div class="admin-card-container" style="text-align:center; color:var(--text-muted); padding:30px;">No messages matching this filter.</div>';
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="inquiry-item ${item.read ? '' : 'unread'}" onclick="openInquiryModal('${item.id}')">
            <div class="inquiry-header">
                <div class="inquiry-sender">
                    <i class="codicon ${item.read ? 'codicon-mail-read' : 'codicon-mail'}" style="color:${item.read ? 'var(--text-muted)' : 'var(--cyan-dark)'}"></i>
                    ${escapeHtml(item.firstName + ' ' + item.lastName)}
                    <span class="inquiry-email">(${escapeHtml(item.email)})</span>
                </div>
                <span class="inquiry-date">${new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div class="inquiry-preview">${escapeHtml(item.reason)}</div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;" onclick="event.stopPropagation();">
                <button class="btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="toggleReadStatus('${item.id}', ${!item.read})">
                    <i class="codicon ${item.read ? 'codicon-mail' : 'codicon-check'}"></i> Mark as ${item.read ? 'Unread' : 'Read'}
                </button>
                <a class="btn-secondary" style="padding:4px 10px; font-size:0.75rem; text-decoration:none;" href="mailto:${escapeHtml(item.email)}?subject=Re: Inquiry with Akosombo International School">
                    <i class="codicon codicon-reply"></i> Reply
                </a>
                <button class="btn-danger" style="padding:4px 8px;" onclick="deleteInquiry('${item.id}')">
                    <i class="codicon codicon-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function setupInquiriesListeners() {
    const searchInput = document.getElementById('inquiriesSearchInput');
    const filterPills = document.querySelectorAll('.inquiry-filter-pill');
    const closeBtn = document.getElementById('closeInquiryModalBtn');
    const modal = document.getElementById('inquiryDetailModal');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filterInquiries();
        });
    });

    const filterInquiries = () => {
        const activeStatus = document.querySelector('.inquiry-filter-pill.active')?.getAttribute('data-status') || 'all';
        const q = (searchInput ? searchInput.value : '').toLowerCase();

        const filtered = currentInquiriesList.filter(item => {
            const matchesStatus = activeStatus === 'all' || (activeStatus === 'unread' && !item.read) || (activeStatus === 'read' && item.read);
            const matchesQ = !q || 
                (item.firstName && item.firstName.toLowerCase().includes(q)) ||
                (item.lastName && item.lastName.toLowerCase().includes(q)) ||
                (item.email && item.email.toLowerCase().includes(q)) ||
                (item.reason && item.reason.toLowerCase().includes(q));
            return matchesStatus && matchesQ;
        });
        renderInquiriesList(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterInquiries);
}

window.openInquiryModal = async function(id) {
    const item = currentInquiriesList.find(c => c.id === id);
    if (!item) return;

    // Auto mark as read
    if (!item.read) {
        await toggleReadStatus(id, true, false);
    }

    const modal = document.getElementById('inquiryDetailModal');
    const content = document.getElementById('inquiryDetailContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:16px;">
            <div>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Sender Name</span>
                <h4 style="margin:2px 0 0; font-size:1.1rem;">${escapeHtml(item.firstName + ' ' + item.lastName)}</h4>
            </div>
            <div>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Email Address</span>
                <p style="margin:2px 0 0;"><a href="mailto:${escapeHtml(item.email)}" style="color:var(--blue-primary); font-weight:700;">${escapeHtml(item.email)}</a></p>
            </div>
            <div>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Date Submitted</span>
                <p style="margin:2px 0 0; color:var(--text-light); font-size:0.88rem;">${new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <div>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Inquiry / Message</span>
                <div style="margin:6px 0 0; padding:16px; background:var(--bg-card-subtle); border-radius:var(--radius-md); border:1px solid var(--border-subtle); line-height:1.6; font-size:0.92rem; white-space:pre-wrap;">${escapeHtml(item.reason)}</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <button class="btn-danger" onclick="deleteInquiry('${item.id}'); document.getElementById('inquiryDetailModal').classList.remove('open');">
                    <i class="codicon codicon-trash"></i> Delete
                </button>
                <div style="display:flex; gap:8px;">
                    <a href="mailto:${escapeHtml(item.email)}?subject=Re: Akosombo International School Inquiry" class="btn-primary" style="text-decoration:none;">
                        <i class="codicon codicon-mail"></i> Reply via Email
                    </a>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('open');
};

window.toggleReadStatus = async function(id, status, refreshUI = true) {
    try {
        const res = await fetch(`${API_BASE}/contact/${id}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ read: status })
        });
        const data = await res.json();
        if (data.success) {
            const item = currentInquiriesList.find(c => c.id === id);
            if (item) item.read = status;
            if (refreshUI) {
                renderInquiriesList(currentInquiriesList);
                loadDashboardData();
            }
        }
    } catch (err) {
        console.error('Failed to toggle read status:', err);
    }
};

window.deleteInquiry = async function(id) {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
        const res = await fetch(`${API_BASE}/contact/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast('Message deleted.');
            loadInquiries();
            loadDashboardData();
        }
    } catch (err) {
        showToast('Connection error.', true);
    }
};

// ==========================================
// 6. DROPZONE FILE UPLOADER ENGINE
// ==========================================
function setupDropzones() {
    setupSingleDropzone('newsDropzone', 'newsImageFileInput', 'newsImageUrl', 'newsPreviewImg');
    setupSingleDropzone('galleryDropzone', 'galleryFileInput', 'galleryImageUrl', 'galleryPreviewImg');
}

function setupSingleDropzone(dropzoneId, fileInputId, urlInputId, previewImgId) {
    const dropzone = document.getElementById(dropzoneId);
    const fileInput = document.getElementById(fileInputId);
    const urlInput = document.getElementById(urlInputId);
    const previewImg = document.getElementById(previewImgId);

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--cyan-dark)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0], urlInput, previewImg);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFileUpload(fileInput.files[0], urlInput, previewImg);
        }
    });

    if (urlInput && previewImg) {
        urlInput.addEventListener('input', () => {
            if (urlInput.value.trim()) {
                previewImg.src = urlInput.value.trim();
                previewImg.style.display = 'block';
            } else {
                previewImg.style.display = 'none';
            }
        });
    }
}

async function handleFileUpload(file, urlInput, previewImg) {
    showToast('Uploading image to server...');
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        const data = await res.json();

        if (data.success && data.url) {
            if (urlInput) urlInput.value = data.url;
            if (previewImg) {
                previewImg.src = data.url;
                previewImg.style.display = 'block';
            }
            showToast('Image uploaded successfully!');
        } else {
            showToast(data.message || 'Upload failed.', true);
        }
    } catch (err) {
        showToast('Error uploading file to server.', true);
    }
}

// ==========================================
// 7. SETTINGS
// ==========================================
function setupSettingsListeners() {
    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;

            try {
                const res = await fetch(`${API_BASE}/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();

                if (data.success) {
                    showToast('Password updated successfully!');
                    form.reset();
                } else {
                    showToast(data.message || 'Failed to update password.', true);
                }
            } catch (err) {
                showToast('Connection error.', true);
            }
        });
    }
}

// Helper utility
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
