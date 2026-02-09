// Blog-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Blog post hover effects
    const blogPosts = document.querySelectorAll('.blog-post');
    
    blogPosts.forEach((post, index) => {
        // Add animation delay for staggered entrance
        post.style.animationDelay = `${index * 0.1}s`;
        
        // Add hover effect for images
        const postImage = post.querySelector('.blog-post-image img');
        if (postImage) {
            post.addEventListener('mouseenter', () => {
                postImage.style.transform = 'scale(1.1)';
            });
            
            post.addEventListener('mouseleave', () => {
                postImage.style.transform = 'scale(1)';
            });
        }
    });
    
    // Featured post image hover effect
    const featuredPost = document.querySelector('.featured-post');
    if (featuredPost) {
        const featuredImage = featuredPost.querySelector('.featured-post-image img');
        
        featuredPost.addEventListener('mouseenter', () => {
            if (featuredImage) {
                featuredImage.style.transform = 'scale(1.05)';
            }
        });
        
        featuredPost.addEventListener('mouseleave', () => {
            if (featuredImage) {
                featuredImage.style.transform = 'scale(1)';
            }
        });
    }
    
    // Read more button effects
    const readMoreLinks = document.querySelectorAll('.read-more');
    readMoreLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'translateX(5px)';
            }
        });
        
        link.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'translateX(0)';
            }
        });
    });
    
    // Category filtering simulation
    const categoryBadges = document.querySelectorAll('.post-category-badge');
    categoryBadges.forEach(badge => {
        badge.addEventListener('click', function(e) {
            e.stopPropagation();
            const category = this.textContent;
            alert(`Would filter to show only "${category}" articles`);
        });
    });
    
    // Newsletter form submission
    const subscribeForm = document.getElementById('subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (email && email.includes('@')) {
                // Show success message
                const originalText = this.querySelector('button[type="submit"]').textContent;
                this.querySelector('button[type="submit"]').textContent = 'Subscribed!';
                this.querySelector('button[type="submit"]').style.background = '#2E7D32';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    this.querySelector('button[type="submit"]').textContent = originalText;
                    this.querySelector('button[type="submit"]').style.background = '';
                    emailInput.value = '';
                }, 2000);
            }
        });
    }
    
    // Add parallax effect to blog hero
    const blogHero = document.querySelector('.blog-hero-section');
    if (blogHero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            blogHero.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Initialize particles for blog page
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 60,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: ["#4CAF50", "#2E7D32"]
                },
                opacity: {
                    value: 0.4,
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
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 0.8,
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
                    }
                }
            }
        });
    }
});