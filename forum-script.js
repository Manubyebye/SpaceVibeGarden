// Forum JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles for forum page
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
                    value: ["#4CAF50", "#2E7D32", "#8BC34A"]
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
    
    // Authentication State
    let currentUser = JSON.parse(localStorage.getItem('forum_user')) || null;
    let forumPosts = JSON.parse(localStorage.getItem('forum_posts')) || generateInitialPosts();
    let forumUsers = JSON.parse(localStorage.getItem('forum_users')) || generateInitialUsers();
    
    // DOM Elements
    const authModal = document.getElementById('auth-modal');
    const authClose = document.querySelector('.auth-close');
    const openLoginBtn = document.getElementById('open-login');
    const openRegisterBtn = document.getElementById('open-register');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const continueBtn = document.getElementById('continue-btn');
    const authSuccess = document.getElementById('auth-success');
    const successMessage = document.getElementById('success-message');
    const successDetail = document.getElementById('success-detail');
    
    const userWelcome = document.getElementById('user-welcome');
    const loggedInUser = document.getElementById('logged-in-user');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const createPostBtn = document.getElementById('create-post-btn');
    
    const createPostModal = document.getElementById('create-post-modal');
    const createPostClose = document.querySelector('.create-post-close');
    const cancelPostBtn = document.getElementById('cancel-post');
    const submitPostBtn = document.getElementById('submit-post');
    
    const postTitleInput = document.getElementById('post-title');
    const postCategorySelect = document.getElementById('post-category');
    const postContentInput = document.getElementById('post-content');
    const postTagsInput = document.getElementById('post-tags');
    
    const postsContainer = document.getElementById('posts-container');
    const emptyState = document.getElementById('empty-state');
    const loadMoreContainer = document.querySelector('.load-more-container');
    const loadMorePostsBtn = document.getElementById('load-more-posts');
    
    const categoryLinks = document.querySelectorAll('.category-list a');
    const filterButtons = document.querySelectorAll('.filter-options .filter-btn');
    const forumSearch = document.getElementById('forum-search');
    
    const totalPostsElement = document.getElementById('total-posts');
    const totalUsersElement = document.getElementById('total-users');
    const totalCommentsElement = document.getElementById('total-comments');
    
    // Initialize forum
    updateUserInterface();
    updateForumStats();
    loadPosts();
    
    // Event Listeners
    if (openLoginBtn) openLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    if (authClose) authClose.addEventListener('click', closeAuthModal);
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (continueBtn) continueBtn.addEventListener('click', closeAuthModal);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (createPostBtn) createPostBtn.addEventListener('click', showCreatePostModal);
    if (createPostClose) createPostClose.addEventListener('click', closeCreatePostModal);
    if (cancelPostBtn) cancelPostBtn.addEventListener('click', closeCreatePostModal);
    if (submitPostBtn) submitPostBtn.addEventListener('click', handleCreatePost);
    
    if (loadMorePostsBtn) loadMorePostsBtn.addEventListener('click', loadMorePosts);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (e.target === createPostModal) closeCreatePostModal();
    });
    
    // Search functionality
    if (forumSearch) {
        forumSearch.addEventListener('input', filterPosts);
    }
    
    // Category filtering
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            // Update active category
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Filter posts
            filterPosts();
        });
    });
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterPosts();
        });
    });
    
    // Functions
    function updateUserInterface() {
        if (currentUser) {
            userWelcome.style.display = 'none';
            loggedInUser.style.display = 'flex';
            usernameDisplay.textContent = currentUser.username;
        } else {
            userWelcome.style.display = 'block';
            loggedInUser.style.display = 'none';
        }
    }
    
    function updateForumStats() {
        if (totalPostsElement) {
            totalPostsElement.textContent = forumPosts.length;
        }
        
        if (totalUsersElement) {
            totalUsersElement.textContent = forumUsers.length;
        }
        
        if (totalCommentsElement) {
            const totalComments = forumPosts.reduce((total, post) => total + (post.comments ? post.comments.length : 0), 0);
            totalCommentsElement.textContent = totalComments;
        }
    }
    
    function showLogin() {
        authModal.classList.add('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        authSuccess.classList.remove('active');
        document.getElementById('auth-title').textContent = 'Login to Forum';
    }
    
    function showRegister() {
        authModal.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        authSuccess.classList.remove('active');
        document.getElementById('auth-title').textContent = 'Create Account';
    }
    
    function closeAuthModal() {
        authModal.classList.remove('active');
        // Clear form fields
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
    }
    
    function handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        // Find user
        const user = forumUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('forum_user', JSON.stringify(user));
            
            // Show success
            loginForm.classList.remove('active');
            authSuccess.classList.add('active');
            successMessage.textContent = 'Login Successful!';
            successDetail.textContent = `Welcome back, ${user.username}!`;
            
            updateUserInterface();
            updateForumStats();
        } else {
            alert('Invalid email or password');
        }
    }
    
    function handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm').value.trim();
        const agreeTerms = document.getElementById('agree-terms').checked;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        if (!agreeTerms) {
            alert('Please agree to the Terms and Privacy Policy');
            return;
        }
        
        if (forumUsers.some(u => u.email === email)) {
            alert('Email already registered');
            return;
        }
        
        if (forumUsers.some(u => u.username === username)) {
            alert('Username already taken');
            return;
        }
        
        // Create new user
        const newUser = {
            id: generateId(),
            username,
            email,
            password,
            avatar: 'default',
            joinDate: new Date().toISOString(),
            postCount: 0,
            commentCount: 0
        };
        
        forumUsers.push(newUser);
        currentUser = newUser;
        
        // Save to localStorage
        localStorage.setItem('forum_users', JSON.stringify(forumUsers));
        localStorage.setItem('forum_user', JSON.stringify(newUser));
        
        // Show success
        registerForm.classList.remove('active');
        authSuccess.classList.add('active');
        successMessage.textContent = 'Account Created!';
        successDetail.textContent = `Welcome to the community, ${username}!`;
        
        updateUserInterface();
        updateForumStats();
    }
    
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('forum_user');
        updateUserInterface();
    }
    
    function showCreatePostModal() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        createPostModal.classList.add('active');
        postTitleInput.focus();
    }
    
    function closeCreatePostModal() {
        createPostModal.classList.remove('active');
        postTitleInput.value = '';
        postCategorySelect.value = '';
        postContentInput.value = '';
        postTagsInput.value = '';
    }
    
    function handleCreatePost() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        const title = postTitleInput.value.trim();
        const category = postCategorySelect.value;
        const content = postContentInput.value.trim();
        const tags = postTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!title || !category || !content) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create new post
        const newPost = {
            id: generateId(),
            userId: currentUser.id,
            username: currentUser.username,
            title,
            category,
            content,
            tags,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: [],
            views: 0
        };
        
        forumPosts.unshift(newPost);
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        // Update user post count
        const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            forumUsers[userIndex].postCount++;
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
        }
        
        closeCreatePostModal();
        loadPosts();
        updateForumStats();
        
        // Show success message
        alert('Post published successfully!');
    }
    
    function loadPosts() {
        const loadingElement = postsContainer.querySelector('.loading-posts');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        filterPosts();
    }
    
    function filterPosts() {
        const activeCategory = document.querySelector('.category-list a.active')?.getAttribute('data-category') || 'all';
        const searchTerm = forumSearch?.value.toLowerCase() || '';
        const activeFilter = document.querySelector('.filter-options .filter-btn.active')?.getAttribute('data-filter') || 'newest';
        
        let filteredPosts = [...forumPosts];
        
        // Filter by category
        if (activeCategory !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === activeCategory);
        }
        
        // Filter by search term
        if (searchTerm) {
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                post.username.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort by filter
        switch (activeFilter) {
            case 'newest':
                filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'popular':
                filteredPosts.sort((a, b) => (b.likes + b.comments.length) - (a.likes + a.comments.length));
                break;
            case 'trending':
                // Simple trending algorithm (recent + popular)
                filteredPosts.sort((a, b) => {
                    const aScore = calculateTrendingScore(a);
                    const bScore = calculateTrendingScore(b);
                    return bScore - aScore;
                });
                break;
            case 'unanswered':
                filteredPosts = filteredPosts.filter(post => post.comments.length === 0);
                filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
        }
        
        displayPosts(filteredPosts);
    }
    
    function calculateTrendingScore(post) {
        const postDate = new Date(post.timestamp);
        const now = new Date();
        const hoursOld = (now - postDate) / (1000 * 60 * 60);
        
        // Score decays over time, but boosted by engagement
        const timeDecay = Math.max(0, 1 - (hoursOld / 72)); // 72 hours = 3 days
        const engagement = post.likes + (post.comments.length * 2) + post.views;
        
        return engagement * timeDecay;
    }
    
    function displayPosts(posts) {
        postsContainer.innerHTML = '';
        
        if (posts.length === 0) {
            emptyState.style.display = 'block';
            loadMoreContainer.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Display first 10 posts
        const postsToShow = posts.slice(0, 10);
        
        postsToShow.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
        
        // Show load more if there are more posts
        if (posts.length > 10) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
    
    function createPostElement(post) {
        const postDate = new Date(post.timestamp);
        const timeAgo = getTimeAgo(postDate);
        const categoryNames = {
            germination: 'Germination',
            vegetative: 'Vegetative',
            flowering: 'Flowering',
            harvest: 'Harvest',
            equipment: 'Equipment',
            problems: 'Problems',
            strains: 'Strains',
            general: 'General'
        };
        
        const postDiv = document.createElement('div');
        postDiv.className = 'forum-post';
        postDiv.dataset.postId = post.id;
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <div class="post-user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="post-user-info">
                        <h4>${post.username}</h4>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <div class="post-category">${categoryNames[post.category] || post.category}</div>
            </div>
            <div class="post-content">
                <h3>${post.title}</h3>
                <p>${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}</p>
                ${post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
                </div>
                ` : ''}
            </div>
            <div class="post-footer">
                <div class="post-stats">
                    <span class="post-stat">
                        <i class="fas fa-thumbs-up"></i>
                        ${post.likes}
                    </span>
                    <span class="post-stat">
                        <i class="fas fa-comment"></i>
                        ${post.comments.length}
                    </span>
                    <span class="post-stat">
                        <i class="fas fa-eye"></i>
                        ${post.views}
                    </span>
                </div>
                <div class="post-actions">
                    <button class="post-action-btn" data-action="like">
                        <i class="fas fa-thumbs-up"></i> Like
                    </button>
                    <button class="post-action-btn" data-action="comment">
                        <i class="fas fa-comment"></i> Comment
                    </button>
                    <button class="post-action-btn" data-action="share">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
        
        // Add click event to view post details
        postDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.post-action-btn')) {
                viewPostDetails(post.id);
            }
        });
        
        // Add action button events
        const actionButtons = postDiv.querySelectorAll('.post-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.getAttribute('data-action');
                handlePostAction(post.id, action);
            });
        });
        
        return postDiv;
    }
    
    function viewPostDetails(postId) {
        const post = forumPosts.find(p => p.id === postId);
        if (!post) return;
        
        // Increase view count
        post.views++;
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        // In a real implementation, you would show a detailed view
        // For now, we'll just alert with the full content
        alert(`Post: ${post.title}\n\n${post.content}\n\nBy: ${post.username}`);
    }
    
    function handlePostAction(postId, action) {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        switch (action) {
            case 'like':
                // Toggle like
                // In a real app, you'd track which users liked which posts
                forumPosts[postIndex].likes++;
                localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
                filterPosts(); // Refresh display
                break;
                
            case 'comment':
                const comment = prompt('Enter your comment:');
                if (comment && comment.trim()) {
                    if (!forumPosts[postIndex].comments) {
                        forumPosts[postIndex].comments = [];
                    }
                    
                    forumPosts[postIndex].comments.push({
                        id: generateId(),
                        userId: currentUser.id,
                        username: currentUser.username,
                        content: comment.trim(),
                        timestamp: new Date().toISOString()
                    });
                    
                    // Update user comment count
                    const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
                    if (userIndex !== -1) {
                        forumUsers[userIndex].commentCount++;
                        localStorage.setItem('forum_users', JSON.stringify(forumUsers));
                    }
                    
                    localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
                    updateForumStats();
                    filterPosts();
                    alert('Comment added!');
                }
                break;
                
            case 'share':
                const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Link copied to clipboard!');
                });
                break;
        }
    }
    
    function loadMorePosts() {
        // In a real implementation, this would load more posts from server
        // For now, we'll just show a message
        loadMorePostsBtn.textContent = 'No More Posts';
        loadMorePostsBtn.disabled = true;
        loadMorePostsBtn.style.opacity = '0.5';
    }
    
    // Helper functions
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    function getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else {
            return 'Just now';
        }
    }
    
    // Generate initial demo data
    function generateInitialPosts() {
        return [
            {
                id: '1',
                userId: 'admin1',
                username: 'GreenThumb',
                title: 'First time grower - Need advice on nutrients',
                category: 'vegetative',
                content: "Hello everyone! I'm starting my first cannabis grow and could use some advice on nutrients. I'm growing in soil and currently in the vegetative stage. What nutrients have worked best for you? Any brands you recommend?",
                tags: ['nutrients', 'vegetative', 'beginners'],
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                likes: 12,
                comments: [
                    {
                        id: 'c1',
                        userId: 'user2',
                        username: 'CannaMaster',
                        content: 'Welcome to the community! For soil grows, I highly recommend organic nutrients like Biobizz or General Organics. Start with half the recommended dose and see how your plants respond.',
                        timestamp: new Date(Date.now() - 1800000).toISOString()
                    }
                ],
                views: 45
            },
            {
                id: '2',
                userId: 'user3',
                username: 'LEDGrower',
                title: 'Comparison: LED vs HPS for flowering',
                category: 'equipment',
                content: "I've been using HPS lights for years but considering switching to LED. Has anyone made the switch? What differences did you notice in yield, quality, and electricity costs?",
                tags: ['led', 'hps', 'lighting', 'flowering'],
                timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                likes: 24,
                comments: [],
                views: 78
            },
            {
                id: '3',
                userId: 'user4',
                username: 'OrganicQueen',
                title: 'Complete organic grow guide',
                category: 'general',
                content: "Sharing my complete organic grow setup and schedule. This has given me amazing terpene profiles and clean smoke. Includes soil recipe, nutrient teas, and pest prevention methods.",
                tags: ['organic', 'guide', 'soil'],
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                likes: 42,
                comments: [
                    {
                        id: 'c2',
                        userId: 'user5',
                        username: 'SoilLover',
                        content: 'Great guide! Ive been using a similar approach and the difference in flavor is incredible compared to synthetic nutes.',
                        timestamp: new Date(Date.now() - 43200000).toISOString()
                    },
                    {
                        id: 'c3',
                        userId: 'user6',
                        username: 'BeginnerBob',
                        content: 'Thank you for this! As a new grower, this is exactly what I needed.',
                        timestamp: new Date(Date.now() - 21600000).toISOString()
                    }
                ],
                views: 156
            }
        ];
    }
    
    function generateInitialUsers() {
        return [
            {
                id: 'admin1',
                username: 'GreenThumb',
                email: 'admin@example.com',
                password: 'password123',
                avatar: 'default',
                joinDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
                postCount: 5,
                commentCount: 12
            },
            {
                id: 'user2',
                username: 'CannaMaster',
                email: 'canna@example.com',
                password: 'password123',
                avatar: 'default',
                joinDate: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
                postCount: 8,
                commentCount: 25
            },
            {
                id: 'user3',
                username: 'LEDGrower',
                email: 'led@example.com',
                password: 'password123',
                avatar: 'default',
                joinDate: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
                postCount: 3,
                commentCount: 7
            },
            {
                id: 'user4',
                username: 'OrganicQueen',
                email: 'organic@example.com',
                password: 'password123',
                avatar: 'default',
                joinDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
                postCount: 2,
                commentCount: 4
            }
        ];
    }
});