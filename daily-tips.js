// ============================================ //
// COSMIC GROW - DAILY TIPS WIDGET              //
// FLOATING WIDGET - APPEARS ON RIGHT SIDE      //
// NOW STARTS MINIMIZED - CLICK TO OPEN         //
// ============================================ //

const cosmicDailyTips = [
    // Germination Tips
    { tip: "🌱 Soak seeds in water for 12-24 hours until they sink before planting", category: "germination", icon: "🌱" },
    { tip: "🌡️ Keep germination temps at 24-27°C for optimal sprouting", category: "germination", icon: "🌡️" },
    { tip: "💧 Use paper towel method: damp (not wet) paper towel in a warm dark place", category: "germination", icon: "💧" },
    { tip: "🌿 Plant seeds 1-2cm deep with the taproot pointing down", category: "germination", icon: "🌿" },
    
    // Vegetative Tips
    { tip: "💡 18/6 light schedule during veg - plants need rest too!", category: "vegetative", icon: "💡" },
    { tip: "🌿 Top plants above the 4th node for better branching", category: "vegetative", icon: "✂️" },
    { tip: "💧 Water when top 2-3cm of soil is dry, not on a schedule", category: "vegetative", icon: "💧" },
    { tip: "🌡️ Keep veg temps 22-28°C with humidity 50-70%", category: "vegetative", icon: "🌡️" },
    { tip: "🍃 Yellow lower leaves? Usually nitrogen deficiency - check your feed", category: "vegetative", icon: "🍃" },
    
    // Flowering Tips
    { tip: "🌸 Switch to 12/12 light schedule to trigger flowering", category: "flowering", icon: "🌸" },
    { tip: "🌡️ Drop humidity to 40-50% during flowering to prevent bud rot", category: "flowering", icon: "🌡️" },
    { tip: "🔬 Check trichomes with a jeweler's loupe - cloudy for peak THC", category: "flowering", icon: "🔬" },
    { tip: "💪 Increase phosphorus and potassium during bloom phase", category: "flowering", icon: "💪" },
    { tip: "✂️ Remove large fan leaves blocking bud sites for better light penetration", category: "flowering", icon: "✂️" },
    
    // Nutrient Tips
    { tip: "🧪 Cal-Mag deficiencies show as rust spots - common in LED grows", category: "nutrients", icon: "🧪" },
    { tip: "💧 Flush with plain water 1-2 weeks before harvest", category: "nutrients", icon: "💧" },
    { tip: "📊 Keep pH at 5.8-6.3 in soil, 5.5-6.0 in hydro", category: "nutrients", icon: "📊" },
    { tip: "⚠️ Start nutrients at 1/4 strength and gradually increase", category: "nutrients", icon: "⚠️" },
    { tip: "🌊 Always pH your water after adding nutrients, not before", category: "nutrients", icon: "🌊" },
    
    // Harvest Tips
    { tip: "✂️ Harvest when 70-90% of pistils have turned brown/amber", category: "harvest", icon: "✂️" },
    { tip: "🌡️ Dry at 18-22°C with 50-60% humidity for 7-14 days", category: "harvest", icon: "🌡️" },
    { tip: "🍯 Cure in glass jars, burp daily for first week, then weekly", category: "harvest", icon: "🍯" },
    { tip: "⏱️ Minimum 2-4 weeks cure for smooth smoke, 3 months for premium", category: "harvest", icon: "⏱️" },
    { tip: "🔪 Trim wet for bag appeal, dry for easier trimming", category: "harvest", icon: "🔪" },
    
    // Problem Solving
    { tip: "🐛 Spider mites? Use neem oil or predator mites", category: "problems", icon: "🐛" },
    { tip: "🍂 Curling leaves? Check for heat stress or overwatering", category: "problems", icon: "🍂" },
    { tip: "🧂 Brown crispy tips? Nutrient burn - flush immediately", category: "problems", icon: "🧂" },
    { tip: "🌡️ Stretching plants? Lights too far away", category: "problems", icon: "🌡️" },
    { tip: "💨 Weak stems? Add a fan for airflow to strengthen them", category: "problems", icon: "💨" },
    
    // Equipment Tips
    { tip: "💡 LED distance: 30-45cm for veg, 20-30cm for flower", category: "equipment", icon: "💡" },
    { tip: "🔄 Replace HPS bulbs every 3-4 grows, they lose efficiency", category: "equipment", icon: "🔄" },
    { tip: "🌬️ Air exchange: entire room volume every 1-2 minutes", category: "equipment", icon: "🌬️" },
    { tip: "🌡️ Use infrared thermometer to check leaf temp (24-28°C ideal)", category: "equipment", icon: "🌡️" },
    
    // General Wisdom
    { tip: "📱 Take photos daily - you'll spot problems and progress easier", category: "general", icon: "📱" },
    { tip: "📓 Keep a grow journal - your future self will thank you!", category: "general", icon: "📓" },
    { tip: "🤝 Join the Cosmic Grow forum to share and learn", category: "general", icon: "🤝" },
    { tip: "🌱 Patience is the most important nutrient", category: "general", icon: "🌱" },
    { tip: "🧹 Cleanliness = no pests. Keep your grow room spotless!", category: "general", icon: "🧹" }
];

// Category colors and icons
const categoryStyles = {
    germination: { color: "#8BC34A", icon: "🌱", bg: "rgba(139, 195, 74, 0.15)" },
    vegetative: { color: "#4CAF50", icon: "🌿", bg: "rgba(76, 175, 80, 0.15)" },
    flowering: { color: "#FF9800", icon: "🌸", bg: "rgba(255, 152, 0, 0.15)" },
    nutrients: { color: "#2196F3", icon: "🧪", bg: "rgba(33, 150, 243, 0.15)" },
    harvest: { color: "#9C27B0", icon: "✂️", bg: "rgba(156, 39, 176, 0.15)" },
    problems: { color: "#F44336", icon: "⚠️", bg: "rgba(244, 67, 54, 0.15)" },
    equipment: { color: "#607D8B", icon: "🔧", bg: "rgba(96, 125, 139, 0.15)" },
    general: { color: "#795548", icon: "💡", bg: "rgba(121, 85, 72, 0.15)" }
};

// Create and inject the beautiful floating widget
function initDailyTipsWidget() {
    console.log('💡 Initializing Daily Tips Widget...');
    
    // Check if widget already exists
    if (document.getElementById('cosmic-tips-widget')) {
        console.log('Tips widget already exists');
        return;
    }
    
    // Get today's tip (based on date for consistency)
    const today = new Date();
    const tipIndex = today.getDate() % cosmicDailyTips.length;
    const todayTip = cosmicDailyTips[tipIndex];
    
    // Create widget container - START MINIMIZED
    const widget = document.createElement('div');
    widget.id = 'cosmic-tips-widget';
    widget.className = 'cosmic-tips-widget minimized';
    
    // Generate category buttons HTML
    const categoryButtons = Object.keys(categoryStyles).map(cat => {
        const style = categoryStyles[cat];
        return `
            <button class="tip-category-btn" data-category="${cat}" title="${cat.charAt(0).toUpperCase() + cat.slice(1)}">
                <span style="color: ${style.color}">${style.icon}</span>
            </button>
        `;
    }).join('');
    
    widget.innerHTML = `
        <div class="tips-widget-glow"></div>
        <div class="tips-widget-header" onclick="toggleTipsWidget()">
            <div class="header-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="header-text">
                <span class="header-title">Daily Grow Tips</span>
                <span class="header-subtitle">Cultivation Wisdom</span>
            </div>
            <div class="header-toggle">
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
        </div>
        
        <div class="tips-widget-content" style="display: none;">
            <!-- Tip of the Day - Featured -->
            <div class="tip-of-day-card">
                <div class="tip-of-day-badge">✨ Tip of the Day</div>
                <div class="tip-of-day-content">
                    <div class="tip-of-day-icon" style="background: ${categoryStyles[todayTip.category].bg}">
                        <span style="color: ${categoryStyles[todayTip.category].color}">${todayTip.icon}</span>
                    </div>
                    <div class="tip-of-day-text">
                        <span class="tip-of-day-category" style="color: ${categoryStyles[todayTip.category].color}">
                            ${todayTip.category}
                        </span>
                        <p class="tip-of-day-message">${todayTip.tip}</p>
                    </div>
                </div>
            </div>
            
            <!-- Category Quick Filter -->
            <div class="tips-categories">
                <button class="category-filter-btn active" data-category="all">
                    <span>🌐</span>
                    <span>All</span>
                </button>
                ${categoryButtons}
            </div>
            
            <!-- Tips List -->
            <div class="tips-list-container">
                <div class="tips-list-header">
                    <h4><i class="fas fa-list"></i> All Tips</h4>
                    <span class="tips-count">${cosmicDailyTips.length} tips</span>
                </div>
                <div class="tips-list" id="tips-list">
                    ${getTipsByCategory('all').map(t => `
                        <div class="tip-item" data-category="${t.category}">
                            <div class="tip-item-icon" style="background: ${categoryStyles[t.category].bg}">
                                <span style="color: ${categoryStyles[t.category].color}">${t.icon}</span>
                            </div>
                            <div class="tip-item-content">
                                <span class="tip-item-category" style="color: ${categoryStyles[t.category].color}">
                                    ${t.category}
                                </span>
                                <span class="tip-item-text">${t.tip}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Widget Footer -->
            <div class="tips-widget-footer">
                <button class="new-tip-btn" onclick="getNewRandomTip()">
                    <i class="fas fa-sync-alt"></i> New Tip
                </button>
                <div class="tip-counter">
                    <i class="fas fa-seedling"></i>
                    <span>${cosmicDailyTips.length} tips</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(widget);
    console.log('✅ Daily Tips Widget added to page (minimized)');
    
    // Add event listeners
    setTimeout(() => {
        // Category filter buttons
        document.querySelectorAll('.category-filter-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const category = this.dataset.category;
                
                // Update active class
                document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Filter tips
                filterTipsByCategory(category);
            });
        });
        
        // Individual category buttons (icons)
        document.querySelectorAll('.tip-category-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const category = this.dataset.category;
                
                // Update active class on category filter
                document.querySelectorAll('.category-filter-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.category === category);
                });
                
                // Filter tips
                filterTipsByCategory(category);
            });
        });
    }, 100);
}

function filterTipsByCategory(category) {
    const tipsList = document.getElementById('tips-list');
    const tipItems = tipsList.querySelectorAll('.tip-item');
    
    tipItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'flex';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
    
    // Update header
    const header = document.querySelector('.tips-list-header h4');
    const categoryNames = {
        all: 'All Tips',
        germination: 'Germination Tips',
        vegetative: 'Vegetative Tips',
        flowering: 'Flowering Tips',
        nutrients: 'Nutrient Tips',
        harvest: 'Harvest Tips',
        problems: 'Problem Solving',
        equipment: 'Equipment Tips',
        general: 'General Wisdom'
    };
    if (header) {
        header.innerHTML = `<i class="fas fa-list"></i> ${categoryNames[category] || 'Tips'}`;
    }
}

function getTipsByCategory(category) {
    if (category === 'all') return cosmicDailyTips;
    return cosmicDailyTips.filter(t => t.category === category);
}

function getNewRandomTip() {
    const randomIndex = Math.floor(Math.random() * cosmicDailyTips.length);
    const randomTip = cosmicDailyTips[randomIndex];
    
    const tipOfDayCard = document.querySelector('.tip-of-day-card');
    if (tipOfDayCard) {
        tipOfDayCard.innerHTML = `
            <div class="tip-of-day-badge">✨ Tip of the Day</div>
            <div class="tip-of-day-content">
                <div class="tip-of-day-icon" style="background: ${categoryStyles[randomTip.category].bg}">
                    <span style="color: ${categoryStyles[randomTip.category].color}">${randomTip.icon}</span>
                </div>
                <div class="tip-of-day-text">
                    <span class="tip-of-day-category" style="color: ${categoryStyles[randomTip.category].color}">
                        ${randomTip.category}
                    </span>
                    <p class="tip-of-day-message">${randomTip.tip}</p>
                </div>
            </div>
        `;
        
        // Add celebration effect
        tipOfDayCard.classList.add('tip-refresh');
        setTimeout(() => tipOfDayCard.classList.remove('tip-refresh'), 500);
    }
}

function toggleTipsWidget() {
    const widget = document.querySelector('.cosmic-tips-widget');
    const content = document.querySelector('.tips-widget-content');
    const icon = document.querySelector('.header-toggle .toggle-icon');
    
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

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyTipsWidget);
} else {
    initDailyTipsWidget();
}