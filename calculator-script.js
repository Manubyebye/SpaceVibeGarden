// ============================================ //
// ADVANCED YIELD CALCULATOR                     //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Calculator loaded');
    
    // Initialize particles
    initParticles();
    
    // Load saved calculations
    loadSavedCalculations();
    
    // Set up event listeners
    setupEventListeners();
    
    // Run initial calculation
    calculateYield();
});

// ============================================ //
// CALCULATION ENGINE                            //
// ============================================ //

function calculateYield() {
    // Get input values
    const strainType = document.getElementById('strain-type').value;
    const strainYield = document.getElementById('strain-yield').value;
    const growArea = parseFloat(document.getElementById('grow-area').value) || 10000;
    const plantCount = parseFloat(document.getElementById('plant-count').value) || 4;
    const lightType = document.getElementById('light-type').value;
    const lightWattage = parseFloat(document.getElementById('light-wattage').value) || 480;
    const growMedium = document.getElementById('grow-medium').value;
    const experienceLevel = document.getElementById('experience-level').value;
    const vegWeeks = parseFloat(document.getElementById('veg-weeks').value) || 4;
    
    // Base yield per m² (in grams)
    let baseYieldPerM2 = 400; // Standard
    
    // Strain yield potential multiplier
    const yieldMultiplier = {
        'low': 0.7,
        'medium': 1.0,
        'high': 1.3,
        'elite': 1.6
    };
    
    // Strain type multiplier
    const strainMultiplier = {
        'indica': 1.1,  // Bushy, dense buds
        'sativa': 0.9,  // Airier buds, taller
        'hybrid': 1.0,  // Balanced
        'auto': 0.8     // Smaller plants
    };
    
    // Light efficiency multiplier
    const lightEfficiency = {
        'led': 1.3,
        'cmh': 1.1,
        'hps': 1.0,
        'fluorescent': 0.6
    };
    
    // Growing medium multiplier
    const mediumMultiplier = {
        'soil': 1.0,
        'coco': 1.2,
        'hydro': 1.4,
        'aeroponics': 1.5
    };
    
    // Experience level multiplier
    const experienceMultiplier = {
        'beginner': 0.7,
        'intermediate': 1.0,
        'advanced': 1.2,
        'expert': 1.4
    };
    
    // Vegetative weeks multiplier (more weeks = more yield)
    const vegMultiplier = 0.8 + (vegWeeks * 0.1);
    
    // Calculate area in m²
    const areaM2 = growArea / 10000;
    
    // Apply all multipliers
    let estimatedYield = baseYieldPerM2 * areaM2;
    estimatedYield *= yieldMultiplier[strainYield] || 1.0;
    estimatedYield *= strainMultiplier[strainType] || 1.0;
    estimatedYield *= lightEfficiency[lightType] || 1.0;
    estimatedYield *= mediumMultiplier[growMedium] || 1.0;
    estimatedYield *= experienceMultiplier[experienceLevel] || 1.0;
    estimatedYield *= vegMultiplier;
    
    // Light wattage adjustment (if using less/more light than optimal)
    const optimalWattagePerM2 = 500; // 500W per m² is optimal
    const actualWattagePerM2 = lightWattage / areaM2;
    const wattageRatio = actualWattagePerM2 / optimalWattagePerM2;
    estimatedYield *= Math.min(wattageRatio, 1.3); // Cap at 30% increase
    
    // Round to nearest gram
    estimatedYield = Math.round(estimatedYield);
    
    // Calculate per plant
    const yieldPerPlant = Math.round(estimatedYield / plantCount);
    
    // Calculate per watt
    const yieldPerWatt = (estimatedYield / lightWattage).toFixed(2);
    
    // Calculate per m²
    const yieldPerM2 = Math.round(estimatedYield / areaM2);
    
    // Update DOM
    document.getElementById('total-yield').textContent = estimatedYield;
    document.getElementById('yield-per-plant').textContent = yieldPerPlant;
    document.getElementById('yield-per-watt').textContent = yieldPerWatt;
    document.getElementById('yield-per-meter').textContent = yieldPerM2;
    
    // Update timeline
    updateTimeline(strainType, vegWeeks);
    
    // Update environmental factors
    updateEnvironmentalFactors(strainType, growMedium);
    
    // Update recommendations
    updateRecommendations(estimatedYield, yieldPerPlant, lightType, growMedium, experienceLevel);
}

// ============================================ //
// TIMELINE FUNCTIONS                            //
// ============================================ //

function updateTimeline(strainType, vegWeeks) {
    // Flowering weeks based on strain type
    let flowerWeeks = 8; // Default for hybrids
    if (strainType === 'indica') flowerWeeks = 7;
    if (strainType === 'sativa') flowerWeeks = 10;
    if (strainType === 'auto') flowerWeeks = 6;
    
    // Calculate days
    const vegDays = vegWeeks * 7;
    const flowerDays = flowerWeeks * 7;
    const totalDays = 10 + vegDays + flowerDays + 14; // Germination + Veg + Flower + Drying
    
    // Update progress bars
    document.getElementById('veg-bar').style.width = `${(vegDays / totalDays) * 100}%`;
    document.getElementById('veg-days').textContent = `${vegDays} days`;
    
    document.getElementById('flower-bar').style.width = `${(flowerDays / totalDays) * 100}%`;
    document.getElementById('flower-days').textContent = `${flowerDays} days`;
    
    document.getElementById('total-days').textContent = totalDays;
}

// ============================================ //
// ENVIRONMENTAL FACTORS                         //
// ============================================ //

function updateEnvironmentalFactors(strainType, growMedium) {
    const humidityEl = document.getElementById('humidity-range');
    
    // Adjust humidity based on strain and medium
    if (strainType === 'sativa') {
        humidityEl.textContent = '55-65%';
        humidityEl.className = 'factor-value optimal';
    } else if (strainType === 'indica') {
        humidityEl.textContent = '45-55%';
        humidityEl.className = 'factor-value optimal';
    } else {
        humidityEl.textContent = '50-60%';
        humidityEl.className = 'factor-value optimal';
    }
    
    // Additional environmental notes could be added here
}

// ============================================ //
// RECOMMENDATIONS                               //
// ============================================ //

function updateRecommendations(yield, perPlant, lightType, medium, experience) {
    const list = document.getElementById('recommendations-list');
    list.innerHTML = '';
    
    // Base recommendations
    const recs = [
        { icon: 'fa-check-circle', text: `Target yield: ${yield}g (${perPlant}g per plant)` },
        { icon: 'fa-check-circle', text: 'Maintain 24-28°C temperature' }
    ];
    
    // Light-specific recommendations
    if (lightType === 'led') {
        recs.push({ icon: 'fa-lightbulb', text: 'Keep LEDs 30-45cm from canopy' });
        recs.push({ icon: 'fa-clock', text: 'Run LEDs 18/6 in veg, 12/12 in flower' });
    } else if (lightType === 'hps') {
        recs.push({ icon: 'fa-fire', text: 'Keep HPS 45-60cm from canopy (heat management)' });
        recs.push({ icon: 'fa-fan', text: 'Ensure adequate exhaust for heat removal' });
    }
    
    // Medium-specific recommendations
    if (medium === 'soil') {
        recs.push({ icon: 'fa-leaf', text: 'Water when top 2cm of soil is dry' });
        recs.push({ icon: 'fa-seedling', text: 'Use organic nutrients for best flavor' });
    } else if (medium === 'coco') {
        recs.push({ icon: 'fa-tint', text: 'Water daily with nutrients' });
        recs.push({ icon: 'fa-flask', text: 'Maintain EC between 1.2-2.0' });
    } else if (medium === 'hydro') {
        recs.push({ icon: 'fa-water', text: 'Check pH daily (5.5-6.5)' });
        recs.push({ icon: 'fa-temperature-high', text: 'Keep water temp at 18-22°C' });
    }
    
    // Experience-specific recommendations
    if (experience === 'beginner') {
        recs.push({ icon: 'fa-book', text: 'Start with easy-to-grow strains' });
        recs.push({ icon: 'fa-camera', text: 'Document your grow for learning' });
    } else if (experience === 'expert') {
        recs.push({ icon: 'fa-flask', text: 'Experiment with training techniques' });
        recs.push({ icon: 'fa-chart-line', text: 'Track and optimize your environment' });
    }
    
    // Add all recommendations to DOM
    recs.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas ${rec.icon}"></i> ${rec.text}`;
        list.appendChild(li);
    });
}

// ============================================ //
// SAVED CALCULATIONS                            //
// ============================================ //

function loadSavedCalculations() {
    const saved = localStorage.getItem('cosmicYieldCalculations');
    const container = document.getElementById('saved-calculations');
    
    if (!container) return;
    
    if (!saved) {
        container.innerHTML = '<p class="empty-state">No saved calculations yet. Calculate and save your first one!</p>';
        return;
    }
    
    try {
        const calculations = JSON.parse(saved);
        renderSavedCalculations(calculations);
    } catch (e) {
        console.error('Error loading saved calculations:', e);
    }
}

function renderSavedCalculations(calculations) {
    const container = document.getElementById('saved-calculations');
    if (!container) return;
    
    if (calculations.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved calculations yet.</p>';
        return;
    }
    
    // Show most recent first
    calculations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = calculations.map(calc => `
        <div class="saved-calculation-card">
            <div class="calculation-header">
                <h4>${calc.name || 'Yield Calculation'}</h4>
                <span class="calculation-date">${new Date(calc.date).toLocaleDateString()}</span>
            </div>
            <div class="calculation-details">
                <div class="calculation-detail">
                    <span class="detail-label">Yield</span>
                    <span class="detail-value">${calc.yield}g</span>
                </div>
                <div class="calculation-detail">
                    <span class="detail-label">Plants</span>
                    <span class="detail-value">${calc.plantCount}</span>
                </div>
                <div class="calculation-detail">
                    <span class="detail-label">Light</span>
                    <span class="detail-value">${calc.wattage}W</span>
                </div>
                <div class="calculation-detail">
                    <span class="detail-label">Area</span>
                    <span class="detail-value">${calc.area}cm²</span>
                </div>
            </div>
            <div class="calculation-actions">
                <button class="btn-secondary btn-small" onclick="loadCalculation('${calc.id}')">
                    <i class="fas fa-folder-open"></i> Load
                </button>
                <button class="btn-secondary btn-small" onclick="deleteCalculation('${calc.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function saveCalculation() {
    const calculation = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        name: `Grow Plan ${new Date().toLocaleDateString()}`,
        yield: document.getElementById('total-yield').textContent,
        plantCount: document.getElementById('plant-count').value,
        wattage: document.getElementById('light-wattage').value,
        area: document.getElementById('grow-area').value,
        strainType: document.getElementById('strain-type').value,
        strainYield: document.getElementById('strain-yield').value,
        lightType: document.getElementById('light-type').value,
        medium: document.getElementById('grow-medium').value,
        experience: document.getElementById('experience-level').value,
        vegWeeks: document.getElementById('veg-weeks').value
    };
    
    let saved = localStorage.getItem('cosmicYieldCalculations');
    let calculations = saved ? JSON.parse(saved) : [];
    
    calculations.unshift(calculation);
    
    // Keep only last 10 calculations
    if (calculations.length > 10) {
        calculations = calculations.slice(0, 10);
    }
    
    localStorage.setItem('cosmicYieldCalculations', JSON.stringify(calculations));
    renderSavedCalculations(calculations);
    
    showNotification('Calculation saved successfully!', 'success');
}

window.loadCalculation = function(id) {
    const saved = localStorage.getItem('cosmicYieldCalculations');
    if (!saved) return;
    
    const calculations = JSON.parse(saved);
    const calc = calculations.find(c => c.id === id);
    
    if (!calc) return;
    
    // Populate form
    document.getElementById('strain-type').value = calc.strainType;
    document.getElementById('strain-yield').value = calc.strainYield;
    document.getElementById('grow-area').value = calc.area;
    document.getElementById('plant-count').value = calc.plantCount;
    document.getElementById('light-type').value = calc.lightType;
    document.getElementById('light-wattage').value = calc.wattage;
    document.getElementById('grow-medium').value = calc.medium;
    document.getElementById('experience-level').value = calc.experience;
    document.getElementById('veg-weeks').value = calc.vegWeeks;
    
    // Recalculate
    calculateYield();
    
    showNotification('Calculation loaded!', 'success');
}

window.deleteCalculation = function(id) {
    const saved = localStorage.getItem('cosmicYieldCalculations');
    if (!saved) return;
    
    let calculations = JSON.parse(saved);
    calculations = calculations.filter(c => c.id !== id);
    
    localStorage.setItem('cosmicYieldCalculations', JSON.stringify(calculations));
    renderSavedCalculations(calculations);
    
    showNotification('Calculation deleted', 'info');
}

// ============================================ //
// EVENT LISTENERS                               //
// ============================================ //

function setupEventListeners() {
    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', calculateYield);
    
    // Real-time calculation on input change
    const inputs = [
        'strain-type', 'strain-yield', 'grow-area', 'grow-width', 'grow-length',
        'plant-count', 'light-type', 'light-wattage', 'grow-medium',
        'experience-level', 'veg-weeks'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateYield);
            element.addEventListener('change', calculateYield);
        }
    });
    
    // Width/Length sync with area
    document.getElementById('grow-width').addEventListener('input', function() {
        const width = parseFloat(this.value) || 100;
        const length = parseFloat(document.getElementById('grow-length').value) || 100;
        const area = width * length;
        document.getElementById('grow-area').value = Math.round(area);
        calculateYield();
    });
    
    document.getElementById('grow-length').addEventListener('input', function() {
        const length = parseFloat(this.value) || 100;
        const width = parseFloat(document.getElementById('grow-width').value) || 100;
        const area = width * length;
        document.getElementById('grow-area').value = Math.round(area);
        calculateYield();
    });
    
    // Save calculation
    document.getElementById('save-calculation').addEventListener('click', saveCalculation);
    
    // Print calculation
    document.getElementById('print-calculation').addEventListener('click', function() {
        window.print();
    });
    
    // Share calculation
    document.getElementById('share-calculation').addEventListener('click', function() {
        const yield_amount = document.getElementById('total-yield').textContent;
        const plants = document.getElementById('plant-count').value;
        const text = `🌱 My Cosmic Grow calculation: ${yield_amount}g from ${plants} plants!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Yield Calculation',
                text: text,
                url: window.location.href
            }).catch(() => {
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
    });
}

// ============================================ //
// UTILITY FUNCTIONS                             //
// ============================================ //

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `forum-notification forum-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// ============================================ //
// PARTICLES INITIALIZATION                       //
// ============================================ //

function initParticles() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ["#4CAF50", "#2E7D32", "#8BC34A"] },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#4CAF50", opacity: 0.2 },
                move: { enable: true, speed: 1, direction: "none", random: true }
            },
            interactivity: {
                detect_on: "canvas",
                events: { onhover: { enable: true, mode: "grab" } }
            }
        });
    }
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .forum-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border-left: 4px solid #4CAF50;
        padding: 15px 20px;
        border-radius: 8px;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        box-shadow: 0 5px 20px var(--shadow-color);
        animation: slideInRight 0.3s ease;
        border: 1px solid var(--border-color);
    }
    
    .forum-notification-error { border-left-color: #f44336; }
    .forum-notification-success { border-left-color: #4CAF50; }
    .forum-notification-info { border-left-color: #2196F3; }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .btn-small {
        padding: 6px 12px;
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        color: var(--text-muted);
        padding: 40px;
        background: var(--bg-tertiary);
        border-radius: 10px;
        border: 1px dashed var(--border-color);
    }
`;
document.head.appendChild(style);