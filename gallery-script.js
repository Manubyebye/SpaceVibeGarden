// Gallery-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navbar scroll effect
    initNavbarScroll();
    
    // Gallery Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-media-item');
    const searchInput = document.getElementById('gallery-search');
    
    // Filter gallery items
    function filterGallery(filter) {
        galleryItems.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                }, 50);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Add click events to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter gallery
            const filter = this.getAttribute('data-filter');
            filterGallery(filter);
            
            // Update URL hash
            window.history.pushState(null, null, `#${filter}`);
        });
    });
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            galleryItems.forEach(item => {
                const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = item.querySelector('p')?.textContent.toLowerCase() || '';
                const category = Array.from(item.classList).find(cls => 
                    ['germination', 'vegetative', 'flowering', 'harvest', 'videos'].includes(cls)
                ) || '';
                
                if (title.includes(searchTerm) || 
                    description.includes(searchTerm) || 
                    category.includes(searchTerm) ||
                    searchTerm === '') {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
    
    // Lightbox functionality
    const lightbox = document.getElementById('media-lightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const lightboxMediaContainer = document.querySelector('.lightbox-media-container');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    
    let currentMediaIndex = 0;
    let filteredMediaItems = Array.from(galleryItems);
    
    // Open lightbox
    function openLightbox(index) {
        currentMediaIndex = index;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Update lightbox content
    function updateLightbox() {
        const mediaItem = filteredMediaItems[currentMediaIndex];
        if (!mediaItem) return;
        
        const mediaSrc = mediaItem.getAttribute('data-src');
        const mediaType = mediaItem.getAttribute('data-type');
        const title = mediaItem.querySelector('h3')?.textContent || 'Untitled';
        const description = mediaItem.querySelector('p')?.textContent || '';
        
        // Clear container
        lightboxMediaContainer.innerHTML = '';
        
        // Add media based on type
        if (mediaType === 'video') {
            const video = document.createElement('video');
            video.src = mediaSrc;
            video.controls = true;
            video.autoplay = true;
            lightboxMediaContainer.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = mediaSrc;
            img.alt = title;
            lightboxMediaContainer.appendChild(img);
        }
        
        // Update info
        lightboxTitle.textContent = title;
        lightboxDescription.textContent = description;
    }
    
    // Next media
    function nextMedia() {
        currentMediaIndex = (currentMediaIndex + 1) % filteredMediaItems.length;
        updateLightbox();
    }
    
    // Previous media
    function prevMedia() {
        currentMediaIndex = (currentMediaIndex - 1 + filteredMediaItems.length) % filteredMediaItems.length;
        updateLightbox();
    }
    
    // Add click events to gallery items
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            // Update filtered items based on current filter
            const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
            
            if (activeFilter === 'all') {
                filteredMediaItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
            } else {
                filteredMediaItems = Array.from(galleryItems).filter(item => 
                    item.classList.contains(activeFilter) && item.style.display !== 'none'
                );
            }
            
            // Find the index of clicked item in filtered array
            const filteredIndex = filteredMediaItems.findIndex(filteredItem => filteredItem === this);
            
            if (filteredIndex !== -1) {
                openLightbox(filteredIndex);
            }
        });
    });
    
    // Lightbox controls
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevMedia);
    if (lightboxNext) lightboxNext.addEventListener('click', nextMedia);
    
    // Close lightbox on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        } else if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) {
            nextMedia();
        } else if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) {
            prevMedia();
        }
    });
    
    // Close lightbox when clicking outside content
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Load more functionality
    const loadMoreBtn = document.getElementById('load-more-media');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Simulate loading more items
            this.textContent = 'Loading...';
            this.disabled = true;
            
            setTimeout(() => {
                // In a real implementation, you would load more items from a server
                // For now, we'll just show a message
                this.textContent = 'No More Media';
                this.style.opacity = '0.5';
                this.style.cursor = 'not-allowed';
            }, 1500);
        });
    }
    
    // Initialize particles for gallery page
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 70,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: ["#4CAF50", "#2E7D32", "#8BC34A"]
                },
                opacity: {
                    value: 0.5,
                    random: true
                },
                size: {
                    value: 3,
                    random: true
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#4CAF50",
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "grab"
                    },
                    onclick: {
                        enable: true,
                        mode: "push"
                    }
                }
            }
        });
    }
    
    // Check URL for initial filter
    const urlHash = window.location.hash.substring(1);
    const validFilters = ['germination', 'vegetative', 'flowering', 'harvest', 'videos'];
    
    if (validFilters.includes(urlHash)) {
        const initialFilterBtn = document.querySelector(`.filter-btn[data-filter="${urlHash}"]`);
        if (initialFilterBtn) {
            initialFilterBtn.click();
        }
    }
    
    // Add hover effects to gallery items
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const overlay = this.querySelector('.media-overlay');
            if (overlay) {
                overlay.style.opacity = '1';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const overlay = this.querySelector('.media-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
            }
        });
    });
});

// Navbar scroll effect function
function initNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}