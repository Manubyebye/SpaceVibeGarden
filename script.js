// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const messageForm = document.getElementById('message-form');
const scrollIndicator = document.querySelector('.scroll-indicator');

// Slideshow elements
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.slideshow-prev');
const nextBtn = document.querySelector('.slideshow-next');
let currentSlide = 0;
let slideInterval;

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        // Update active link
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
    });
});

// Initialize Slideshow
function initSlideshow() {
    // Make sure we have slides
    if (slides.length === 0) return;
    
    // Initialize first slide
    slides[0].classList.add('active');
    if (dots.length > 0) dots[0].classList.add('active');
    
    // Start automatic slideshow
    startSlideShow();
    
    // Add event listeners for dots
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            goToSlide(slideIndex);
            resetInterval();
        });
    });
    
    // Add event listeners for arrows
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            resetInterval();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            resetInterval();
        });
    }
    
    // Pause slideshow on hover
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', pauseSlideShow);
        slideshowContainer.addEventListener('mouseleave', startSlideShow);
    }
}

// Show specific slide
function goToSlide(n) {
    // Hide current slide
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Update current slide index
    currentSlide = (n + slides.length) % slides.length;
    
    // Show new slide
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
    }
}

// Next slide
function nextSlide() {
    goToSlide(currentSlide + 1);
}

// Previous slide
function prevSlide() {
    goToSlide(currentSlide - 1);
}

// Start automatic slideshow
function startSlideShow() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

// Pause slideshow
function pauseSlideShow() {
    clearInterval(slideInterval);
}

// Reset interval after manual navigation
function resetInterval() {
    pauseSlideShow();
    startSlideShow();
}

// Gallery Tabs
if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabBtns.forEach(item => item.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show corresponding tab pane
            const tabId = btn.getAttribute('data-tab');
            const tabPane = document.getElementById(tabId);
            if (tabPane) {
                tabPane.classList.add('active');
            }
        });
    });
}

// Form Submission
if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = messageForm.querySelector('input[type="text"]').value;
        const email = messageForm.querySelector('input[type="email"]').value;
        const message = messageForm.querySelector('textarea').value;
        
        // In a real application, you would send this data to a server
        // For now, we'll just show a success message
        alert(`Thank you ${name}! Your message has been received. We'll contact you at ${email} soon.`);
        
        // Reset form
        messageForm.reset();
    });
}

// Scroll Indicator Animation
if (scrollIndicator) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.visibility = 'hidden';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.visibility = 'visible';
        }
    });
}

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
        navbar.style.padding = '15px 0';
    } else {
        navbar.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
        navbar.style.padding = '20px 0';
    }
});

// Set active nav link based on scroll position (for single page navigation)
if (document.querySelector('a[href^="#"]')) {
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.includes(current) && href.startsWith('#')) {
                link.classList.add('active');
            }
        });
    });
}

// Particle Background Effect
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js if the library is loaded
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: ["#4CAF50", "#2E7D32", "#8BC34A", "#CDDC39"]
                },
                shape: {
                    type: "circle",
                    stroke: {
                        width: 0,
                        color: "#000000"
                    }
                },
                opacity: {
                    value: 0.5,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 2,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#4CAF50",
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
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
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 140,
                        line_linked: {
                            opacity: 0.5
                        }
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }
    
    // Initialize slideshow if on homepage
    if (slides.length > 0 && document.querySelector('.hero-section')) {
        initSlideshow();
    }
    
    // Add subtle floating animation to strain cards
    const strainCards = document.querySelectorAll('.model-card');
    strainCards.forEach((card, index) => {
        card.style.setProperty('--animation-order', index);
        card.classList.add('float-animation');
    });
    
    // Add floating animation to features and gallery items
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        feature.style.setProperty('--animation-order', index);
        feature.classList.add('float-animation');
    });
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.setProperty('--animation-order', index);
        item.classList.add('float-animation');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        // Don't prevent default for external links
        if (href.includes('http') || href.includes('.html')) return;
        
        e.preventDefault();
        
        const targetElement = document.querySelector(href);
        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            window.scrollTo({
                top: targetElement.offsetTop - navbarHeight,
                behavior: 'smooth'
            });
        }
    });
});

// Optional: Add keyboard navigation for slideshow
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
        prevSlide();
        resetInterval();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
        resetInterval();
    }
});

// Auto-activate gallery tab based on URL parameter
if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (tabBtn) {
        setTimeout(() => {
            tabBtn.click();
        }, 100);
    }
}

// Newsletter form submission
const subscribeForm = document.getElementById('subscribe-form');
if (subscribeForm) {
    subscribeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        alert(`Thank you! You've been subscribed with email: ${email}`);
        this.reset();
    });
}

// Load more functionality for blog
const loadMoreBtn = document.querySelector('.load-more-btn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
        // Simulate loading more articles
        this.textContent = 'Loading...';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = 'No More Articles';
            this.style.opacity = '0.5';
            this.style.cursor = 'not-allowed';
        }, 1500);
    });
}

// Partners Carousel
document.addEventListener('DOMContentLoaded', function() {
    initPartnersCarousel();
});

function initPartnersCarousel() {
    const track = document.getElementById('partnersTrack');
    const prevBtn = document.querySelector('.partner-prev');
    const nextBtn = document.querySelector('.partner-next');
    const dots = document.querySelectorAll('.partner-dot');
    
    if (!track || !prevBtn || !nextBtn) return;
    
    let currentIndex = 0;
    const slides = document.querySelectorAll('.partner-slide');
    const totalSlides = document.querySelectorAll('.partner-slide').length / 2; // Because we duplicated for infinite effect
    const slidesToShow = getSlidesToShow();
    const slideWidth = 100 / slidesToShow;
    
    // Set initial position
    updateCarousel();
    
    // Auto-scroll functionality (optional)
    let autoScrollInterval;
    let isAutoScrolling = true;
    
    function startAutoScroll() {
        if (isAutoScrolling) {
            autoScrollInterval = setInterval(() => {
                nextSlide();
            }, 4000);
        }
    }
    
    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }
    
    function getSlidesToShow() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 992) return 2;
        return 3;
    }
    
    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
        } else {
            // Jump to first slide instantly for infinite loop
            currentIndex = 0;
            track.style.transition = 'none';
            updateCarousel();
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease-in-out';
            }, 50);
        }
        updateCarousel();
        updateDots();
    }
    
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            // Jump to last slide for infinite loop
            currentIndex = totalSlides - 1;
            track.style.transition = 'none';
            updateCarousel();
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease-in-out';
            }, 50);
        }
        updateCarousel();
        updateDots();
    }
    
    function updateCarousel() {
        const shiftPercentage = currentIndex * slideWidth;
        track.style.transform = `translateX(-${shiftPercentage}%)`;
    }
    
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Event listeners
    prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoScroll();
        startAutoScroll();
    });
    
    nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoScroll();
        startAutoScroll();
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
            updateDots();
            stopAutoScroll();
            startAutoScroll();
        });
    });
    
    // Pause auto-scroll on hover
    track.addEventListener('mouseenter', stopAutoScroll);
    track.addEventListener('mouseleave', startAutoScroll);
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newSlidesToShow = getSlidesToShow();
            if (newSlidesToShow !== slidesToShow) {
                location.reload(); // Simple solution: reload on resize
            }
        }, 250);
    });
    
    // Start auto-scroll
    startAutoScroll();
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoScroll();
    }, { passive: true });
    
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX) {
            nextSlide();
        } else if (touchEndX > touchStartX) {
            prevSlide();
        }
        startAutoScroll();
    }, { passive: true });
}



        // Theme Toggle
        document.addEventListener('DOMContentLoaded', function() {
            const themeToggle = document.getElementById('theme-toggle');
            const body = document.body;
            
            // Check for saved theme
            const savedTheme = localStorage.getItem('theme') || 'dark';
            body.setAttribute('data-theme', savedTheme);
            
            if (themeToggle) {
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
                }
                
                themeToggle.addEventListener('click', function() {
                    const currentTheme = body.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    
                    body.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                    
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
                    }
                });
            }
            
            // Mobile menu
            const hamburger = document.querySelector('.hamburger');
            const navMenu = document.querySelector('.nav-menu');
            
            if (hamburger && navMenu) {
                hamburger.addEventListener('click', function() {
                    hamburger.classList.toggle('active');
                    navMenu.classList.toggle('active');
                });
                
                // Close menu when clicking a link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', () => {
                        hamburger.classList.remove('active');
                        navMenu.classList.remove('active');
                    });
                });
            }
        });
    
        // Add this to your script.js or inside <script> tags
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});