// ============================================ //
// COSMIC GROW - HARVEST COUNTDOWN TIMER        //
// FLOATING WIDGET - APPEARS ON LEFT SIDE       //
// FULLY FIXED - NOW SHOWING PROPERLY           //
// ============================================ //

// Store user's harvest dates in localStorage
let harvestTimers = JSON.parse(localStorage.getItem('cosmicHarvestTimers')) || [];

// Initialize widget
function initHarvestTimerWidget() {
    console.log('🌿 Initializing Harvest Timer Widget...');
    
    // Check if widget already exists
    if (document.getElementById('cosmic-harvest-widget')) {
        console.log('Harvest widget already exists');
        return;
    }
    
    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'cosmic-harvest-widget';
    widget.className = 'cosmic-harvest-widget minimized'; // Start minimized
    
    widget.innerHTML = `
        <div class="harvest-widget-header" onclick="toggleHarvestWidget()">
            <div class="harvest-header-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="harvest-header-text">
                <span class="harvest-header-title">Harvest Timer</span>
                <span class="harvest-header-subtitle">Track your harvests</span>
            </div>
            <div class="harvest-header-toggle">
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
        </div>
        
        <div class="harvest-widget-content" style="display: none;">
            <div class="active-harvests" id="active-harvests">
                ${renderHarvestTimers()}
            </div>
            <button class="add-harvest-btn" onclick="showAddHarvestModal()">
                <i class="fas fa-plus"></i> Track New Harvest
            </button>
        </div>
    `;
    
    document.body.appendChild(widget);
    console.log('✅ Harvest Timer Widget added to page');
    
    // Start countdown updates
    updateAllCountdowns();
    setInterval(updateAllCountdowns, 60000); // Update every minute
}

function renderHarvestTimers() {
    if (harvestTimers.length === 0) {
        return '<div class="no-harvests">No harvests tracked yet.<br>Click button to add your first!</div>';
    }
    
    // Sort by closest harvest
    const sorted = [...harvestTimers].sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate));
    
    return sorted.map((timer, index) => {
        const harvestDate = new Date(timer.harvestDate);
        const now = new Date();
        const diffTime = harvestDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status = '';
        let statusClass = '';
        let statusIcon = '';
        
        if (diffDays < 0) {
            status = 'READY TO HARVEST!';
            statusClass = 'harvest-ready';
            statusIcon = '🎉';
        } else if (diffDays <= 7) {
            status = `${diffDays} days left`;
            statusClass = 'harvest-soon';
            statusIcon = '⚠️';
        } else if (diffDays <= 30) {
            status = `${diffDays} days left`;
            statusClass = 'harvest-month';
            statusIcon = '🌿';
        } else {
            status = `${diffDays} days left`;
            statusClass = 'harvest-far';
            statusIcon = '🌱';
        }
        
        // Calculate progress
        const plantDate = new Date(timer.plantDate || timer.harvestDate);
        const totalDays = timer.floweringTime ? parseInt(timer.floweringTime) : 70;
        const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((now - plantDate) / (1000 * 60 * 60 * 24))));
        const progress = (elapsedDays / totalDays) * 100;
        
        return `
            <div class="harvest-item ${statusClass}" data-id="${timer.id}">
                <div class="harvest-item-header">
                    <div class="harvest-strain-info">
                        <span class="harvest-strain">${timer.strain}</span>
                        ${timer.breeder ? `<span class="harvest-breeder">${timer.breeder}</span>` : ''}
                    </div>
                    <button class="remove-harvest" onclick="removeHarvest('${timer.id}')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="harvest-countdown">
                    <span class="countdown-number">${diffDays < 0 ? '🎉' : diffDays}</span>
                    <span class="countdown-label">${diffDays < 0 ? 'READY!' : 'days'}</span>
                </div>
                
                <div class="harvest-progress">
                    <div class="progress-header">
                        <span><i class="fas fa-calendar-alt"></i> Week ${Math.floor(elapsedDays/7)}/${Math.floor(totalDays/7)}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="harvest-details">
                    <span><i class="fas fa-seedling"></i> ${new Date(timer.plantDate || timer.harvestDate).toLocaleDateString()}</span>
                    <span><i class="fas fa-calendar-check"></i> ${new Date(timer.harvestDate).toLocaleDateString()}</span>
                </div>
                
                <div class="harvest-status ${statusClass}">
                    ${statusIcon} ${status}
                </div>
            </div>
        `;
    }).join('');
}

function updateAllCountdowns() {
    const container = document.getElementById('active-harvests');
    if (container) {
        container.innerHTML = renderHarvestTimers();
    }
}

function showAddHarvestModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'harvest-modal';
    modal.className = 'harvest-modal';
    modal.innerHTML = `
        <div class="harvest-modal-content">
            <div class="harvest-modal-header">
                <h3><i class="fas fa-seedling"></i> Track New Harvest</h3>
                <button class="harvest-modal-close" onclick="closeHarvestModal()">&times;</button>
            </div>
            <div class="harvest-modal-body">
                <div class="form-group">
                    <label>Strain Name *</label>
                    <input type="text" id="harvest-strain" placeholder="e.g., Apple Fritter" required>
                </div>
                <div class="form-row">
                    <div class="form-group half">
                        <label>Breeder (optional)</label>
                        <input type="text" id="harvest-breeder" placeholder="e.g., Cosmic Grow">
                    </div>
                    <div class="form-group half">
                        <label>Flowering Time</label>
                        <select id="harvest-flowering">
                            <option value="49">7 weeks (49 days)</option>
                            <option value="56">8 weeks (56 days)</option>
                            <option value="63" selected>9 weeks (63 days)</option>
                            <option value="70">10 weeks (70 days)</option>
                            <option value="77">11 weeks (77 days)</option>
                            <option value="84">12 weeks (84 days)</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group half">
                        <label>Plant Date</label>
                        <input type="date" id="harvest-plant-date">
                    </div>
                    <div class="form-group half">
                        <label>Expected Harvest *</label>
                        <input type="date" id="harvest-date" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes (optional)</label>
                    <textarea id="harvest-notes" placeholder="Any notes about this grow..." rows="2"></textarea>
                </div>
                <button class="save-harvest-btn" onclick="saveHarvestTimer()">
                    <i class="fas fa-save"></i> Start Tracking
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 63); // Default 9 weeks
    const defaultHarvest = harvestDate.toISOString().split('T')[0];
    
    setTimeout(() => {
        document.getElementById('harvest-plant-date').value = today;
        document.getElementById('harvest-date').value = defaultHarvest;
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
    const breeder = document.getElementById('harvest-breeder').value.trim();
    const floweringTime = document.getElementById('harvest-flowering').value;
    const plantDate = document.getElementById('harvest-plant-date').value;
    const harvestDate = document.getElementById('harvest-date').value;
    const notes = document.getElementById('harvest-notes').value.trim();
    
    if (!strain || !harvestDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newTimer = {
        id: Date.now().toString(),
        strain: strain,
        breeder: breeder,
        floweringTime: floweringTime,
        plantDate: plantDate,
        harvestDate: harvestDate,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    harvestTimers.push(newTimer);
    localStorage.setItem('cosmicHarvestTimers', JSON.stringify(harvestTimers));
    
    closeHarvestModal();
    updateAllCountdowns();
    showHarvestNotification(`🎉 Now tracking ${strain} until harvest!`);
}

function removeHarvest(id) {
    if (confirm('Remove this harvest from tracking?')) {
        harvestTimers = harvestTimers.filter(t => t.id !== id);
        localStorage.setItem('cosmicHarvestTimers', JSON.stringify(harvestTimers));
        updateAllCountdowns();
        showHarvestNotification('Harvest removed');
    }
}

function toggleHarvestWidget() {
    const widget = document.querySelector('.cosmic-harvest-widget');
    const content = document.querySelector('.harvest-widget-content');
    const icon = document.querySelector('.harvest-header-toggle .toggle-icon');
    
    if (!widget || !content || !icon) return;
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.className = 'fas fa-chevron-up toggle-icon';
        widget.classList.remove('minimized');
    } else {
        content.style.display = 'none';
        icon.className = 'fas fa-chevron-down toggle-icon';
        widget.classList.add('minimized');
    }
}

function showHarvestNotification(message) {
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

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHarvestTimerWidget);
} else {
    initHarvestTimerWidget();
}