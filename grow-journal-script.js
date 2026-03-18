// ============================================ //
// COSMIC GROW - GROW JOURNAL SYSTEM            //
// ============================================ //

// Store grows in localStorage
let grows = JSON.parse(localStorage.getItem('cosmicGrows')) || [];
let currentGrow = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    loadGrows();
    updateStats();
    
    // Event listeners
    document.getElementById('start-new-grow').addEventListener('click', showNewGrowModal);
    document.getElementById('new-grow-form').addEventListener('submit', saveNewGrow);
    document.getElementById('add-entry-form').addEventListener('submit', saveJournalEntry);
    
    // Filter buttons
    document.querySelectorAll('.journal-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.journal-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterGrows(this.dataset.filter);
        });
    });
    
    // Search
    document.getElementById('journal-search').addEventListener('input', function() {
        searchGrows(this.value);
    });
});

// Show new grow modal
function showNewGrowModal() {
    const modal = document.getElementById('new-grow-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 70); // Default 10 weeks
    
    document.getElementById('grow-plant-date').value = today;
    document.getElementById('grow-harvest-date').value = harvestDate.toISOString().split('T')[0];
}

// Close new grow modal
function closeNewGrowModal() {
    const modal = document.getElementById('new-grow-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('new-grow-form').reset();
    document.getElementById('cover-preview').innerHTML = '';
    document.getElementById('cover-preview').style.display = 'none';
}

// Preview cover photo
function previewCoverPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('cover-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Cover">`;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Save new grow
function saveNewGrow(e) {
    e.preventDefault();
    
    const newGrow = {
        id: Date.now(),
        strain: document.getElementById('grow-strain').value,
        breeder: document.getElementById('grow-breeder').value,
        plantDate: document.getElementById('grow-plant-date').value,
        growType: document.getElementById('grow-type').value,
        medium: document.getElementById('grow-medium').value,
        light: document.getElementById('grow-light').value,
        harvestDate: document.getElementById('grow-harvest-date').value,
        difficulty: document.getElementById('grow-difficulty').value,
        notes: document.getElementById('grow-notes').value,
        cover: document.getElementById('cover-preview').querySelector('img')?.src || 'img/default-grow.jpg',
        status: 'active',
        entries: [],
        createdAt: new Date().toISOString()
    };
    
    grows.unshift(newGrow);
    localStorage.setItem('cosmicGrows', JSON.stringify(grows));
    
    closeNewGrowModal();
    loadGrows();
    updateStats();
    showNotification(`🌱 Started growing ${newGrow.strain}!`);
}

// Load grows into grid
function loadGrows() {
    const container = document.getElementById('grows-container');
    const emptyState = document.getElementById('empty-journal');
    
    if (grows.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = grows.map(grow => {
        const plantDate = new Date(grow.plantDate);
        const harvestDate = new Date(grow.harvestDate);
        const now = new Date();
        
        const totalDays = Math.ceil((harvestDate - plantDate) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((now - plantDate) / (1000 * 60 * 60 * 24));
        const progress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
        
        const daysLeft = Math.max(0, Math.ceil((harvestDate - now) / (1000 * 60 * 60 * 24)));
        
        return `
            <div class="grow-card ${grow.status}-grow" data-id="${grow.id}">
                <div class="grow-cover">
                    <img src="${grow.cover}" alt="${grow.strain}">
                    <span class="grow-status ${grow.status}">${grow.status}</span>
                </div>
                <div class="grow-info">
                    <div class="grow-header">
                        <h3>${grow.strain}</h3>
                        ${grow.breeder ? `<span class="grow-breeder">${grow.breeder}</span>` : ''}
                    </div>
                    
                    <div class="grow-details">
                        <div class="grow-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Planted: ${new Date(grow.plantDate).toLocaleDateString()}</span>
                        </div>
                        <div class="grow-detail">
                            <i class="fas fa-clock"></i>
                            <span>Day ${elapsedDays}</span>
                        </div>
                        <div class="grow-detail">
                            <i class="fas fa-leaf"></i>
                            <span>${grow.growType}</span>
                        </div>
                        <div class="grow-detail">
                            <i class="fas fa-tint"></i>
                            <span>${grow.medium}</span>
                        </div>
                    </div>
                    
                    <div class="grow-progress">
                        <div class="progress-header">
                            <span>Progress</span>
                            <span>${daysLeft} days to harvest</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="grow-footer">
                        <span class="entry-count">
                            <i class="fas fa-pen"></i> ${grow.entries.length} entries
                        </span>
                        <div class="grow-actions">
                            <button class="grow-btn" onclick="viewGrowDetails(${grow.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="grow-btn primary" onclick="addJournalEntry(${grow.id})">
                                <i class="fas fa-plus"></i> Add Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update stats
function updateStats() {
    document.getElementById('total-grows').textContent = grows.length;
    document.getElementById('active-grows').textContent = grows.filter(g => g.status === 'active').length;
    document.getElementById('completed-grows').textContent = grows.filter(g => g.status === 'completed').length;
    
    const totalPhotos = grows.reduce((sum, grow) => {
        return sum + grow.entries.reduce((entrySum, entry) => {
            return entrySum + (entry.photos ? entry.photos.length : 0);
        }, 0);
    }, 0);
    
    document.getElementById('total-photos').textContent = totalPhotos;
}

// Filter grows
function filterGrows(filter) {
    const cards = document.querySelectorAll('.grow-card');
    
    cards.forEach(card => {
        if (filter === 'all' || card.classList.contains(`${filter}-grow`)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Search grows
function searchGrows(query) {
    const cards = document.querySelectorAll('.grow-card');
    const searchTerm = query.toLowerCase();
    
    cards.forEach(card => {
        const strain = card.querySelector('h3').textContent.toLowerCase();
        const breeder = card.querySelector('.grow-breeder')?.textContent.toLowerCase() || '';
        
        if (strain.includes(searchTerm) || breeder.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Add journal entry
let currentGrowId = null;

function addJournalEntry(growId) {
    currentGrowId = growId;
    const modal = document.getElementById('add-entry-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set default date
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
}

function closeEntryModal() {
    const modal = document.getElementById('add-entry-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('add-entry-form').reset();
    document.getElementById('entry-photos-preview').innerHTML = '';
}

// Preview entry photos
let entryPhotos = [];

function previewEntryPhotos(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('entry-photos-preview');
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-thumb';
            photoDiv.innerHTML = `
                <img src="${e.target.result}" alt="Entry photo">
                <button class="remove-photo" onclick="removeEntryPhoto(this)">&times;</button>
            `;
            preview.appendChild(photoDiv);
            entryPhotos.push(e.target.result);
        };
        reader.readAsDataURL(file);
    });
}

function removeEntryPhoto(btn) {
    const thumb = btn.parentElement;
    const imgSrc = thumb.querySelector('img').src;
    entryPhotos = entryPhotos.filter(src => src !== imgSrc);
    thumb.remove();
}

// Save journal entry
function saveJournalEntry(e) {
    e.preventDefault();
    
    const grow = grows.find(g => g.id === currentGrowId);
    if (!grow) return;
    
    const newEntry = {
        id: Date.now(),
        day: document.getElementById('entry-day').value,
        date: document.getElementById('entry-date').value,
        temperature: document.getElementById('entry-temp').value,
        humidity: document.getElementById('entry-humidity').value,
        ph: document.getElementById('entry-ph').value,
        ec: document.getElementById('entry-ec').value,
        nutrients: document.getElementById('entry-nutrients').value,
        notes: document.getElementById('entry-notes').value,
        photos: [...entryPhotos]
    };
    
    grow.entries.push(newEntry);
    grow.entries.sort((a, b) => a.day - b.day);
    
    localStorage.setItem('cosmicGrows', JSON.stringify(grows));
    
    closeEntryModal();
    loadGrows();
    updateStats();
    showNotification('📝 Journal entry saved!');
    
    entryPhotos = [];
}

// View grow details
function viewGrowDetails(growId) {
    const grow = grows.find(g => g.id === growId);
    if (!grow) return;
    
    currentGrow = grow;
    
    // Create detail view
    const detailView = document.createElement('div');
    detailView.className = 'grow-detail-view active';
    detailView.id = 'grow-detail-view';
    
    const plantDate = new Date(grow.plantDate);
    const now = new Date();
    const daysFromPlant = Math.ceil((now - plantDate) / (1000 * 60 * 60 * 24));
    
    detailView.innerHTML = `
        <div class="grow-detail-header">
            <button class="grow-detail-back" onclick="closeGrowDetail()">
                <i class="fas fa-arrow-left"></i> Back to Journal
            </button>
            <div class="grow-detail-info">
                <div class="grow-detail-title">
                    <h2>${grow.strain}</h2>
                    <p>${grow.breeder || 'Unknown breeder'} • ${grow.growType} • ${grow.medium}</p>
                </div>
                <div class="grow-detail-stats">
                    <div class="grow-detail-stat">
                        <span class="stat-value">${daysFromPlant}</span>
                        <span class="stat-label">Days</span>
                    </div>
                    <div class="grow-detail-stat">
                        <span class="stat-value">${grow.entries.length}</span>
                        <span class="stat-label">Entries</span>
                    </div>
                    <div class="grow-detail-stat">
                        <span class="stat-value">${grow.entries.reduce((sum, e) => sum + (e.photos?.length || 0), 0)}</span>
                        <span class="stat-label">Photos</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="grow-timeline">
            ${grow.entries.length === 0 ? `
                <div style="text-align: center; padding: 60px; color: #888;">
                    <i class="fas fa-pen" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No journal entries yet</h3>
                    <p>Start documenting your grow!</p>
                    <button class="btn-primary" onclick="addJournalEntry(${grow.id})">
                        <i class="fas fa-plus"></i> First Entry
                    </button>
                </div>
            ` : grow.entries.map(entry => `
                <div class="timeline-entry">
                    <div class="entry-header">
                        <span class="entry-day">Day ${entry.day}</span>
                        <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="entry-stats">
                        ${entry.temperature ? `
                            <span class="entry-stat">
                                <i class="fas fa-thermometer-half"></i> ${entry.temperature}°C
                            </span>
                        ` : ''}
                        ${entry.humidity ? `
                            <span class="entry-stat">
                                <i class="fas fa-tint"></i> ${entry.humidity}%
                            </span>
                        ` : ''}
                        ${entry.ph ? `
                            <span class="entry-stat">
                                <i class="fas fa-flask"></i> pH ${entry.ph}
                            </span>
                        ` : ''}
                        ${entry.ec ? `
                            <span class="entry-stat">
                                <i class="fas fa-chart-line"></i> EC ${entry.ec}
                            </span>
                        ` : ''}
                    </div>
                    
                    ${entry.nutrients ? `
                        <div style="color: #4CAF50; font-size: 0.9rem; margin-bottom: 10px;">
                            <i class="fas fa-leaf"></i> ${entry.nutrients}
                        </div>
                    ` : ''}
                    
                    <div class="entry-notes">
                        ${entry.notes.replace(/\n/g, '<br>')}
                    </div>
                    
                    ${entry.photos && entry.photos.length > 0 ? `
                        <div class="entry-photos">
                            ${entry.photos.map(photo => `
                                <div class="entry-photo" onclick="openLightbox('${photo}')">
                                    <img src="${photo}" alt="Entry photo">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            
            ${grow.entries.length > 0 ? `
                <div style="text-align: center; margin: 40px 0;">
                    <button class="btn-primary" onclick="addJournalEntry(${grow.id})">
                        <i class="fas fa-plus"></i> Add Another Entry
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(detailView);
    document.body.style.overflow = 'hidden';
}

function closeGrowDetail() {
    const detailView = document.getElementById('grow-detail-view');
    if (detailView) {
        detailView.remove();
        document.body.style.overflow = 'auto';
    }
}

// Open lightbox for photos
function openLightbox(src) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox active';
    lightbox.innerHTML = `
        <span class="lightbox-close" onclick="this.parentElement.remove()">&times;</span>
        <div class="lightbox-content">
            <img src="${src}" alt="Full size">
        </div>
    `;
    document.body.appendChild(lightbox);
}

// Show notification
function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'harvest-notification';
    notif.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('show');
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }, 100);
}

// Initialize particles
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60 },
                color: { value: ["#4CAF50", "#2E7D32"] },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#4CAF50", opacity: 0.2 }
            }
        });
    }
}