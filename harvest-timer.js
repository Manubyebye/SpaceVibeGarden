// ============================================ //
// COSMIC GROW - HARVEST COUNTDOWN TIMER        //
// ULTRA-COMPACT VERSION - PERFECT FOR MOBILE  //
// ============================================ //

let harvestTimers = JSON.parse(localStorage.getItem('cosmicHarvestTimers')) || [];

function initHarvestTimerWidget() {
    if (document.getElementById('cosmic-harvest-widget')) return;
    
    const widget = document.createElement('div');
    widget.id = 'cosmic-harvest-widget';
    widget.className = 'cosmic-harvest-widget minimized';
    
    widget.innerHTML = `
        <div class="harvest-widget-header" onclick="toggleHarvestWidget()">
            <div class="harvest-header-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="harvest-header-text">
                <span class="harvest-header-title">Harvest</span>
            </div>
            <div class="harvest-header-count" id="harvest-count">${harvestTimers.length}</div>
            <div class="harvest-header-toggle">
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
        </div>
        
        <div class="harvest-widget-content" style="display: none;">
            <div class="active-harvests" id="active-harvests">
                ${renderHarvestTimers()}
            </div>
            <button class="add-harvest-btn" onclick="showAddHarvestModal()">
                <i class="fas fa-plus"></i> Add
            </button>
        </div>
    `;
    
    document.body.appendChild(widget);
    updateAllCountdowns();
    setInterval(updateAllCountdowns, 60000);
}

function renderHarvestTimers() {
    if (harvestTimers.length === 0) {
        return '<div class="no-harvests">No harvests</div>';
    }
    
    const sorted = [...harvestTimers].sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate));
    
    return sorted.map((timer, index) => {
        const harvestDate = new Date(timer.harvestDate);
        const now = new Date();
        const diffTime = harvestDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusClass = '';
        let statusIcon = '';
        
        if (diffDays < 0) {
            statusClass = 'harvest-ready';
            statusIcon = '🎉';
        } else if (diffDays <= 7) {
            statusClass = 'harvest-soon';
            statusIcon = '⚠️';
        } else if (diffDays <= 30) {
            statusClass = 'harvest-month';
            statusIcon = '🌿';
        } else {
            statusClass = 'harvest-far';
            statusIcon = '🌱';
        }
        
        const plantDate = new Date(timer.plantDate || timer.harvestDate);
        const totalDays = timer.floweringTime ? parseInt(timer.floweringTime) : 70;
        const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((now - plantDate) / (1000 * 60 * 60 * 24))));
        const progress = (elapsedDays / totalDays) * 100;
        
        return `
            <div class="harvest-item ${statusClass}" data-id="${timer.id}">
                <div class="harvest-item-header">
                    <span class="harvest-strain">${timer.strain}</span>
                    <button class="remove-harvest" onclick="removeHarvest('${timer.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="harvest-countdown">
                    <span class="countdown-number">${diffDays < 0 ? '🎉' : diffDays}</span>
                    <span class="countdown-label">${diffDays < 0 ? 'ready' : 'days'}</span>
                </div>
                
                <div class="harvest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="harvest-footer">
                    <span class="harvest-status-indicator ${statusClass}">${statusIcon}</span>
                    <span class="harvest-date">${new Date(timer.harvestDate).toLocaleDateString().slice(0,5)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateAllCountdowns() {
    const container = document.getElementById('active-harvests');
    const countEl = document.getElementById('harvest-count');
    if (container) container.innerHTML = renderHarvestTimers();
    if (countEl) countEl.textContent = harvestTimers.length;
}

function showAddHarvestModal() {
    const modal = document.createElement('div');
    modal.id = 'harvest-modal';
    modal.className = 'harvest-modal';
    modal.innerHTML = `
        <div class="harvest-modal-content">
            <div class="harvest-modal-header">
                <h3>New Harvest</h3>
                <button class="harvest-modal-close" onclick="closeHarvestModal()">&times;</button>
            </div>
            <div class="harvest-modal-body">
                <input type="text" id="harvest-strain" placeholder="Strain name" required>
                <select id="harvest-flowering">
                    <option value="56">8 weeks</option>
                    <option value="63" selected>9 weeks</option>
                    <option value="70">10 weeks</option>
                </select>
                <input type="date" id="harvest-plant-date">
                <input type="date" id="harvest-date" required>
                <button class="save-harvest-btn" onclick="saveHarvestTimer()">Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const today = new Date().toISOString().split('T')[0];
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 63);
    
    setTimeout(() => {
        document.getElementById('harvest-plant-date').value = today;
        document.getElementById('harvest-date').value = harvestDate.toISOString().split('T')[0];
    }, 100);
}

function closeHarvestModal() {
    const modal = document.getElementById('harvest-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function saveHarvestTimer() {
    const strain = document.getElementById('harvest-strain').value.trim();
    if (!strain) return alert('Enter strain name');
    
    const newTimer = {
        id: Date.now().toString(),
        strain: strain,
        floweringTime: document.getElementById('harvest-flowering').value,
        plantDate: document.getElementById('harvest-plant-date').value,
        harvestDate: document.getElementById('harvest-date').value
    };
    
    harvestTimers.push(newTimer);
    localStorage.setItem('cosmicHarvestTimers', JSON.stringify(harvestTimers));
    closeHarvestModal();
    updateAllCountdowns();
}

function removeHarvest(id) {
    harvestTimers = harvestTimers.filter(t => t.id !== id);
    localStorage.setItem('cosmicHarvestTimers', JSON.stringify(harvestTimers));
    updateAllCountdowns();
}

function toggleHarvestWidget() {
    const widget = document.querySelector('.cosmic-harvest-widget');
    const content = document.querySelector('.harvest-widget-content');
    const icon = document.querySelector('.harvest-header-toggle .toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.className = 'fas fa-chevron-up toggle-icon';
        widget.classList.remove('minimized');
    } else {
        content.style.display = 'none';
        icon.className = 'fas fa-chevron-down toggle-icon';
        widget.classList.add('minimized');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHarvestTimerWidget);
} else {
    initHarvestTimerWidget();
}