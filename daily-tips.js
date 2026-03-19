// ============================================ //
// COSMIC GROW - DAILY TIPS WIDGET              //
// ULTRA-COMPACT VERSION - PERFECT FOR MOBILE  //
// ============================================ //

const cosmicDailyTips = [
    { tip: "🌱 Soak seeds 12-24h before planting", category: "germination", icon: "🌱" },
    { tip: "🌡️ Germination temp: 24-27°C", category: "germination", icon: "🌡️" },
    { tip: "💧 Paper towel method: damp, not wet", category: "germination", icon: "💧" },
    { tip: "🌿 Plant seeds 1-2cm deep", category: "germination", icon: "🌿" },
    { tip: "💡 18/6 light schedule in veg", category: "vegetative", icon: "💡" },
    { tip: "✂️ Top above 4th node", category: "vegetative", icon: "✂️" },
    { tip: "💧 Water when top 2-3cm dry", category: "vegetative", icon: "💧" },
    { tip: "🌡️ Veg temps: 22-28°C, humidity 50-70%", category: "vegetative", icon: "🌡️" },
    { tip: "🍃 Yellow lower leaves = nitrogen deficiency", category: "vegetative", icon: "🍃" },
    { tip: "🌸 12/12 light to trigger flower", category: "flowering", icon: "🌸" },
    { tip: "🌡️ Flower humidity: 40-50%", category: "flowering", icon: "🌡️" },
    { tip: "🔬 Check trichomes with loupe", category: "flowering", icon: "🔬" },
    { tip: "💪 Boost PK during bloom", category: "flowering", icon: "💪" },
    { tip: "✂️ Remove fan leaves blocking buds", category: "flowering", icon: "✂️" },
    { tip: "🧪 Cal-Mag = rust spots", category: "nutrients", icon: "🧪" },
    { tip: "💧 Flush 1-2 weeks before harvest", category: "nutrients", icon: "💧" },
    { tip: "📊 Soil pH: 5.8-6.3, Hydro: 5.5-6.0", category: "nutrients", icon: "📊" },
    { tip: "⚠️ Start nutrients at 1/4 strength", category: "nutrients", icon: "⚠️" },
    { tip: "🌊 pH water after adding nutrients", category: "nutrients", icon: "🌊" },
    { tip: "✂️ Harvest when 70-90% pistils brown", category: "harvest", icon: "✂️" },
    { tip: "🌡️ Dry at 18-22°C, 50-60% humidity", category: "harvest", icon: "🌡️" },
    { tip: "🍯 Cure in jars, burp daily", category: "harvest", icon: "🍯" },
    { tip: "⏱️ Cure 2-4 weeks minimum", category: "harvest", icon: "⏱️" },
    { tip: "🔪 Wet trim = bag appeal, dry trim = easier", category: "harvest", icon: "🔪" },
    { tip: "🐛 Spider mites? Use neem oil", category: "problems", icon: "🐛" },
    { tip: "🍂 Curling leaves = heat stress", category: "problems", icon: "🍂" },
    { tip: "🧂 Brown tips = nutrient burn - flush", category: "problems", icon: "🧂" },
    { tip: "🌡️ Stretching = lights too far", category: "problems", icon: "🌡️" },
    { tip: "💨 Weak stems = add fan", category: "problems", icon: "💨" },
    { tip: "💡 LED distance: 30-45cm", category: "equipment", icon: "💡" },
    { tip: "🔄 Replace HPS every 3-4 grows", category: "equipment", icon: "🔄" },
    { tip: "🌬️ Air exchange: 1-2x per minute", category: "equipment", icon: "🌬️" },
    { tip: "🌡️ Leaf temp: 24-28°C", category: "equipment", icon: "🌡️" },
    { tip: "📱 Take photos daily", category: "general", icon: "📱" },
    { tip: "📓 Keep a grow journal", category: "general", icon: "📓" },
    { tip: "🤝 Join the forum!", category: "general", icon: "🤝" },
    { tip: "🌱 Patience is key", category: "general", icon: "🌱" },
    { tip: "🧹 Cleanliness = no pests", category: "general", icon: "🧹" }
];

const categoryStyles = {
    germination: { color: "#8BC34A", icon: "🌱" },
    vegetative: { color: "#4CAF50", icon: "🌿" },
    flowering: { color: "#FF9800", icon: "🌸" },
    nutrients: { color: "#2196F3", icon: "🧪" },
    harvest: { color: "#9C27B0", icon: "✂️" },
    problems: { color: "#F44336", icon: "⚠️" },
    equipment: { color: "#607D8B", icon: "🔧" },
    general: { color: "#795548", icon: "💡" }
};

function initDailyTipsWidget() {
    if (document.getElementById('cosmic-tips-widget')) return;
    
    const today = new Date();
    const tipIndex = today.getDate() % cosmicDailyTips.length;
    const todayTip = cosmicDailyTips[tipIndex];
    
    const widget = document.createElement('div');
    widget.id = 'cosmic-tips-widget';
    widget.className = 'cosmic-tips-widget minimized';
    
    widget.innerHTML = `
        <div class="tips-widget-header" onclick="toggleTipsWidget()">
            <div class="header-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="header-text">
                <span class="header-title">Daily Tip</span>
            </div>
            <div class="header-count" id="tips-count">${cosmicDailyTips.length}</div>
            <div class="header-toggle">
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
        </div>
        
        <div class="tips-widget-content" style="display: none;">
            <div class="tip-of-day-compact">
                <span class="tip-of-day-icon" style="color: ${categoryStyles[todayTip.category].color}">${todayTip.icon}</span>
                <div class="tip-of-day-compact-text">
                    <span class="tip-of-day-category">${todayTip.category}</span>
                    <span class="tip-of-day-message">${todayTip.tip}</span>
                </div>
            </div>
            
            <div class="tips-categories-compact">
                <button class="category-pill active" data-category="all">All</button>
                ${Object.keys(categoryStyles).map(cat => `
                    <button class="category-pill" data-category="${cat}" style="border-color: ${categoryStyles[cat].color}">
                        ${categoryStyles[cat].icon}
                    </button>
                `).join('')}
            </div>
            
            <div class="tips-list-compact" id="tips-list">
                ${getTipsByCategory('all').map(t => `
                    <div class="tip-item-compact" data-category="${t.category}">
                        <span class="tip-icon" style="color: ${categoryStyles[t.category].color}">${t.icon}</span>
                        <span class="tip-text">${t.tip}</span>
                    </div>
                `).join('')}
            </div>
            
            <button class="new-tip-btn" onclick="getNewRandomTip()">
                <i class="fas fa-sync-alt"></i> New
            </button>
        </div>
    `;
    
    document.body.appendChild(widget);
    
    setTimeout(() => {
        document.querySelectorAll('.category-pill').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.dataset.category;
                document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTipsByCategory(category);
            });
        });
    }, 100);
}

function filterTipsByCategory(category) {
    const tipsList = document.getElementById('tips-list');
    const tipItems = tipsList.querySelectorAll('.tip-item-compact');
    
    tipItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function getTipsByCategory(category) {
    if (category === 'all') return cosmicDailyTips;
    return cosmicDailyTips.filter(t => t.category === category);
}

function getNewRandomTip() {
    const randomIndex = Math.floor(Math.random() * cosmicDailyTips.length);
    const randomTip = cosmicDailyTips[randomIndex];
    
    const tipOfDay = document.querySelector('.tip-of-day-compact');
    if (tipOfDay) {
        tipOfDay.innerHTML = `
            <span class="tip-of-day-icon" style="color: ${categoryStyles[randomTip.category].color}">${randomTip.icon}</span>
            <div class="tip-of-day-compact-text">
                <span class="tip-of-day-category">${randomTip.category}</span>
                <span class="tip-of-day-message">${randomTip.tip}</span>
            </div>
        `;
    }
}

function toggleTipsWidget() {
    const widget = document.querySelector('.cosmic-tips-widget');
    const content = document.querySelector('.tips-widget-content');
    const icon = document.querySelector('.header-toggle .toggle-icon');
    
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
    document.addEventListener('DOMContentLoaded', initDailyTipsWidget);
} else {
    initDailyTipsWidget();
}