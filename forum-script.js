// forum-script.js - Complete with Supabase integration + localStorage fallback
// ALL original features preserved - Supabase is added as enhancement, not replacement

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌱 Space Vibe Garden Forum - Loading...');
    
    // Initialize leaf animation
    initLeafAnimation();
    
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
    
     // Initialize Supabase (if available)
    let supabase = null;
    let supabaseAvailable = false;
    
    try {
        // Check if Supabase client is already available globally
        if (typeof window !== 'undefined' && window.supabaseClient) {
            supabase = window.supabaseClient;
            supabaseAvailable = true;
            console.log('✅ Supabase connected successfully');
        } else if (typeof window !== 'undefined' && window.supabase) {
            supabase = window.supabase;
            supabaseAvailable = true;
            console.log('✅ Supabase connected successfully');
        } else {
            console.log('⚠️ Supabase not available, using localStorage only');
        }
    } catch (error) {
        console.log('⚠️ Supabase not available, using localStorage only');
        supabaseAvailable = false;
    }
    
    // Authentication State
    let currentUser = null;
    let forumPosts = [];
    let forumUsers = [];
    let currentFilter = 'newest';
    let currentCategory = 'all';
    let currentSearch = '';
    
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
    await checkUser();
    await loadInitialData();
    
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
        forumSearch.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            filterPosts();
        });
    }
    
    // Category filtering
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentCategory = this.getAttribute('data-category') || 'all';
            
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
            currentFilter = this.getAttribute('data-filter') || 'newest';
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterPosts();
        });
    });
    
    // Functions
    async function checkUser() {
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (user && !error) {
                    // Get user profile from database
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile) {
                        currentUser = {
                            id: profile.id,
                            email: profile.email,
                            username: profile.username,
                            avatar: profile.avatar || 'default',
                            postCount: profile.post_count || 0,
                            commentCount: profile.comment_count || 0
                        };
                        // Also save to localStorage as backup
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                    }
                }
            } catch (error) {
                console.log('Supabase auth check failed, using localStorage');
                // Fallback to localStorage
                const user = JSON.parse(localStorage.getItem('forum_current_user')) || null;
                if (user) currentUser = user;
            }
        } else {
            // Fallback to localStorage
            const user = JSON.parse(localStorage.getItem('forum_current_user')) || null;
            if (user) currentUser = user;
        }
        
        updateUserInterface();
    }
    
    async function loadInitialData() {
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                // Load users/profiles from Supabase
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*');
                
                if (profiles && !profilesError) {
                    forumUsers = profiles.map(profile => ({
                        id: profile.id,
                        email: profile.email,
                        username: profile.username,
                        avatar: profile.avatar || 'default',
                        join_date: profile.join_date || new Date().toISOString(),
                        post_count: profile.post_count || 0,
                        comment_count: profile.comment_count || 0
                    }));
                }
                
                // Load posts from Supabase
                const { data: posts, error: postsError } = await supabase
                    .from('posts')
                    .select('*, comments(*)')
                    .order('created_at', { ascending: false });
                
                if (posts && !postsError) {
                    forumPosts = posts.map(post => ({
                        id: post.id,
                        user_id: post.user_id,
                        title: post.title,
                        category: post.category,
                        content: post.content,
                        tags: post.tags || [],
                        created_at: post.created_at,
                        updated_at: post.updated_at,
                        likes: post.likes || 0,
                        views: post.views || 0,
                        comments: post.comments || []
                    }));
                }
            } catch (error) {
                console.log('Supabase load failed, using localStorage');
                // Fallback to localStorage
                loadFromLocalStorage();
            }
        } else {
            // Fallback to localStorage
            loadFromLocalStorage();
        }
        
        // If no data from Supabase, ensure we have localStorage data
        if (forumUsers.length === 0 || forumPosts.length === 0) {
            loadFromLocalStorage();
        }
        
        updateForumStats();
        filterPosts();
    }
    
    function loadFromLocalStorage() {
        // Load users from localStorage or create demo users
        const storedUsers = JSON.parse(localStorage.getItem('forum_users'));
        if (storedUsers && storedUsers.length > 0) {
            forumUsers = storedUsers;
        } else {
            // Create demo users
            forumUsers = createDemoUsers();
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
        }
        
        // Load posts from localStorage or create demo posts
        const storedPosts = JSON.parse(localStorage.getItem('forum_posts'));
        if (storedPosts && storedPosts.length > 0) {
            forumPosts = storedPosts;
        } else {
            // Create demo posts
            forumPosts = createDemoPosts();
            localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        }
    }
    
    function createDemoUsers() {
        return [
            {
                id: '1',
                email: 'admin@spacevibe.com',
                username: 'SpaceGardener',
                avatar: 'default',
                join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 5,
                comment_count: 12
            },
            {
                id: '2',
                email: 'canna@spacevibe.com',
                username: 'CannaMaster',
                avatar: 'default',
                join_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 8,
                comment_count: 25
            },
            {
                id: '3',
                email: 'led@spacevibe.com',
                username: 'LEDGrower',
                avatar: 'default',
                join_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 3,
                comment_count: 7
            },
            {
                id: '4',
                email: 'organic@spacevibe.com',
                username: 'OrganicQueen',
                avatar: 'default',
                join_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 2,
                comment_count: 4
            }
        ];
    }
    
    function createDemoPosts() {
        const demoPosts = [
            {
                id: generateId(),
                user_id: '1',
                title: 'First time grower - Need advice on nutrients',
                category: 'vegetative',
                content: "Hello everyone! I'm starting my first cannabis grow and could use some advice on nutrients. I'm growing in soil and currently in the vegetative stage. What nutrients have worked best for you? Any brands you recommend for beginners? I'm using a basic 3-part nutrient system but wondering if I should switch to organic.",
                tags: ['nutrients', 'vegetative', 'beginners', 'soil'],
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                likes: 12,
                views: 45,
                comments: [
                    {
                        id: generateId(),
                        user_id: '2',
                        username: 'CannaMaster',
                        content: 'Welcome to the community! For soil grows, I highly recommend organic nutrients like Biobizz or General Organics. Start with half the recommended dose and see how your plants respond.',
                        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: generateId(),
                        user_id: '4',
                        username: 'OrganicQueen',
                        content: 'I second the organic recommendation! The taste and smell are much better with organic nutes. Also make sure your pH is correct - that\'s more important than the brand!',
                        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: generateId(),
                user_id: '3',
                title: 'LED vs HPS - My 6 month comparison',
                category: 'equipment',
                content: "I've been running a side-by-side comparison for 6 months: 600W HPS vs 480W LED (Samsung LM301B). Results: LED produced 15% more yield, used 40% less electricity, and generated much less heat. The only downside was higher upfront cost. Would recommend LED for anyone starting fresh!",
                tags: ['led', 'hps', 'lighting', 'comparison', 'equipment'],
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                likes: 24,
                views: 78,
                comments: []
            },
            {
                id: generateId(),
                user_id: '4',
                title: 'Complete organic grow guide for beginners',
                category: 'general',
                content: "After 3 years of organic growing, here's my complete setup: \n\n1. Soil: 40% coco coir, 30% worm castings, 20% perlite, 10% biochar\n2. Nutrients: Compost tea every 2 weeks\n3. Pest control: Neem oil spray weekly\n4. Water: pH 6.2-6.8, always dechlorinated\n\nThe terpene profiles are incredible and the smoke is super smooth. Any questions, ask below!",
                tags: ['organic', 'guide', 'soil', 'beginners'],
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 42,
                views: 156,
                comments: [
                    {
                        id: generateId(),
                        user_id: '2',
                        username: 'CannaMaster',
                        content: 'Great guide! I\'ve been using a similar approach and the difference in flavor is incredible compared to synthetic nutes. Have you tried adding mycorrhizal fungi to your soil mix?',
                        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: generateId(),
                        user_id: '1',
                        username: 'SpaceGardener',
                        content: 'Thank you for this! As a new grower, this is exactly what I needed. Do you have any recommendations for organic nutrient brands available in Europe?',
                        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: generateId(),
                user_id: '2',
                title: 'How to deal with spider mites - Emergency!',
                category: 'problems',
                content: "Found spider mites on my flowering plants today! Need urgent advice. I'm in week 3 of flowering. What's safe to use at this stage? I've heard about neem oil but worried about buds. Anyone dealt with this before?",
                tags: ['spider-mites', 'pests', 'flowering', 'problems'],
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                likes: 8,
                views: 32,
                comments: [
                    {
                        id: generateId(),
                        user_id: '4',
                        username: 'OrganicQueen',
                        content: 'For flowering stage, use a mixture of water, soap, and isopropyl alcohol (70%). Spray under leaves daily for 3 days. Avoid neem oil in late flowering as it can affect taste.',
                        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: generateId(),
                user_id: '1',
                title: 'My Apple Fritter grow journal - Week by week',
                category: 'strains',
                content: "Starting a grow journal for Apple Fritter (50/50 hybrid). Setup: 4x4 tent, 480W LED, coco/perlite, Advanced Nutrients. \n\nWeek 1: Germinated 3 seeds, all popped\nWeek 2: Seedlings looking healthy\nWeek 3: Started LST training\n\nWill update weekly with photos!",
                tags: ['apple-fritter', 'grow-journal', 'strains', 'led'],
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                likes: 15,
                views: 67,
                comments: []
            }
        ];
        
        return demoPosts;
    }
    
    function updateForumStats() {
        if (totalPostsElement) {
            totalPostsElement.textContent = forumPosts.length;
        }
        
        if (totalUsersElement) {
            totalUsersElement.textContent = forumUsers.length;
        }
        
        if (totalCommentsElement) {
            const totalComments = forumPosts.reduce((total, post) => {
                return total + (post.comments ? post.comments.length : 0);
            }, 0);
            totalCommentsElement.textContent = totalComments;
        }
    }
    
    function updateUserInterface() {
        if (currentUser) {
            if (userWelcome) userWelcome.style.display = 'none';
            if (loggedInUser) {
                loggedInUser.style.display = 'flex';
                usernameDisplay.textContent = currentUser.username;
            }
        } else {
            if (userWelcome) userWelcome.style.display = 'block';
            if (loggedInUser) loggedInUser.style.display = 'none';
        }
    }
    
    function showLogin() {
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
        if (authSuccess) authSuccess.classList.remove('active');
        const authTitle = document.getElementById('auth-title');
        if (authTitle) authTitle.textContent = 'Login to Forum';
        
        // Auto-fill demo credentials
        document.getElementById('login-email').value = 'admin@spacevibe.com';
        document.getElementById('login-password').value = 'password123';
    }
    
    function showRegister() {
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (authSuccess) authSuccess.classList.remove('active');
        const authTitle = document.getElementById('auth-title');
        if (authTitle) authTitle.textContent = 'Create Account';
    }
    
    function closeAuthModal() {
        if (authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        // Clear form fields
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirm = document.getElementById('register-confirm');
        
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
        if (registerUsername) registerUsername.value = '';
        if (registerEmail) registerEmail.value = '';
        if (registerPassword) registerPassword.value = '';
        if (registerConfirm) registerConfirm.value = '';
    }
    
    async function handleLogin() {
        const email = document.getElementById('login-email')?.value.trim() || '';
        const password = document.getElementById('login-password')?.value.trim() || '';
        
        if (!email || !password) {
            showErrorMessage('Please fill in all fields');
            return;
        }
        
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (!error && data.user) {
                    // Get user profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();
                    
                    if (profile) {
                        currentUser = {
                            id: profile.id,
                            email: profile.email,
                            username: profile.username,
                            avatar: profile.avatar || 'default',
                            postCount: profile.post_count || 0,
                            commentCount: profile.comment_count || 0
                        };
                        
                        // Save to localStorage as backup
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                        
                        // Show success
                        if (loginForm) loginForm.classList.remove('active');
                        if (authSuccess) {
                            authSuccess.classList.add('active');
                            successMessage.textContent = 'Login Successful!';
                            successDetail.textContent = `Welcome back, ${currentUser.username}!`;
                        }
                        
                        updateUserInterface();
                        updateForumStats();
                        filterPosts();
                        return;
                    }
                }
            } catch (error) {
                console.log('Supabase login failed, trying localStorage');
            }
        }
        
        // Fallback to localStorage demo login
        const user = forumUsers.find(u => u.email === email);
        
        if (user) {
            currentUser = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                postCount: user.post_count,
                commentCount: user.comment_count
            };
            
            // Save to localStorage
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
            
            // Show success
            if (loginForm) loginForm.classList.remove('active');
            if (authSuccess) {
                authSuccess.classList.add('active');
                successMessage.textContent = 'Login Successful!';
                successDetail.textContent = `Welcome back, ${currentUser.username}!`;
            }
            
            updateUserInterface();
            updateForumStats();
            filterPosts();
            
        } else {
            showErrorMessage('User not found. Try: admin@spacevibe.com / password123');
        }
    }
    
    async function handleRegister() {
        const username = document.getElementById('register-username')?.value.trim() || '';
        const email = document.getElementById('register-email')?.value.trim() || '';
        const password = document.getElementById('register-password')?.value.trim() || '';
        const confirmPassword = document.getElementById('register-confirm')?.value.trim() || '';
        const agreeTerms = document.getElementById('agree-terms')?.checked || false;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            showErrorMessage('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showErrorMessage('Password must be at least 6 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            showErrorMessage('Passwords do not match');
            return;
        }
        
        if (!agreeTerms) {
            showErrorMessage('Please agree to the Terms and Privacy Policy');
            return;
        }
        
        // Validate username format
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showErrorMessage('Username can only contain letters, numbers, and underscores');
            return;
        }
        
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });
                
                if (!error && data.user) {
                    // Create profile
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                email: email,
                                username: username,
                                avatar: 'default',
                                join_date: new Date().toISOString(),
                                post_count: 0,
                                comment_count: 0
                            }
                        ]);
                    
                    if (!profileError) {
                        currentUser = {
                            id: data.user.id,
                            email: email,
                            username: username,
                            avatar: 'default',
                            postCount: 0,
                            commentCount: 0
                        };
                        
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                        
                        // Show success
                        if (registerForm) registerForm.classList.remove('active');
                        if (authSuccess) {
                            authSuccess.classList.add('active');
                            successMessage.textContent = 'Account Created!';
                            successDetail.textContent = `Welcome to the community, ${username}!`;
                        }
                        
                        updateUserInterface();
                        return;
                    }
                }
            } catch (error) {
                console.log('Supabase registration failed, trying localStorage');
            }
        }
        
        // Check if username or email already exists in localStorage
        if (forumUsers.some(u => u.username === username)) {
            showErrorMessage('Username already taken');
            return;
        }
        
        if (forumUsers.some(u => u.email === email)) {
            showErrorMessage('Email already registered');
            return;
        }
        
        try {
            // Create new user in localStorage
            const newUser = {
                id: generateId(),
                email: email,
                username: username,
                avatar: 'default',
                join_date: new Date().toISOString(),
                post_count: 0,
                comment_count: 0
            };
            
            forumUsers.push(newUser);
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
            
            currentUser = {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                avatar: newUser.avatar,
                postCount: newUser.post_count,
                commentCount: newUser.comment_count
            };
            
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
            
            // Show success
            if (registerForm) registerForm.classList.remove('active');
            if (authSuccess) {
                authSuccess.classList.add('active');
                successMessage.textContent = 'Account Created!';
                successDetail.textContent = `Welcome to the community, ${username}!`;
            }
            
            updateUserInterface();
            updateForumStats();
            
        } catch (error) {
            console.error('Registration error:', error);
            showErrorMessage('Error creating account: ' + error.message);
        }
    }
    
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('forum_current_user');
        updateUserInterface();
        showSuccessMessage('Logged out successfully!');
        filterPosts();
    }
    
    function showCreatePostModal() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        if (createPostModal) {
            createPostModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (postTitleInput) postTitleInput.focus();
        }
    }
    
    function closeCreatePostModal() {
        if (createPostModal) {
            createPostModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        if (postTitleInput) postTitleInput.value = '';
        if (postCategorySelect) postCategorySelect.value = '';
        if (postContentInput) postContentInput.value = '';
        if (postTagsInput) postTagsInput.value = '';
    }
    
    async function handleCreatePost() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        const title = postTitleInput?.value.trim() || '';
        const category = postCategorySelect?.value || '';
        const content = postContentInput?.value.trim() || '';
        const tags = postTagsInput?.value.split(',').map(tag => tag.trim()).filter(tag => tag) || [];
        
        if (!title || !category || !content) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        if (title.length < 5) {
            showErrorMessage('Title must be at least 5 characters long');
            return;
        }
        
        if (content.length < 10) {
            showErrorMessage('Content must be at least 10 characters long');
            return;
        }
        
        try {
            // Create new post object
            const newPost = {
                id: generateId(),
                user_id: currentUser.id,
                title: title,
                category: category,
                content: content,
                tags: tags.length > 0 ? tags : [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                likes: 0,
                views: 0,
                comments: []
            };
            
            // Try Supabase first if available
            if (supabaseAvailable && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('posts')
                        .insert([
                            {
                                id: newPost.id,
                                user_id: newPost.user_id,
                                title: newPost.title,
                                category: newPost.category,
                                content: newPost.content,
                                tags: newPost.tags,
                                created_at: newPost.created_at,
                                updated_at: newPost.updated_at,
                                likes: newPost.likes,
                                views: newPost.views
                            }
                        ])
                        .select();
                    
                    if (!error) {
                        // Update user's post count
                        const { error: updateError } = await supabase.rpc('increment_post_count', {
                            user_id: currentUser.id
                        });
                        
                        if (!updateError) {
                            currentUser.postCount++;
                            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                        }
                    }
                } catch (error) {
                    console.log('Supabase post creation failed, using localStorage');
                }
            }
            
            // Always save to localStorage as backup
            forumPosts.unshift(newPost);
            localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
            
            // Update user's post count in localStorage
            const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                forumUsers[userIndex].post_count++;
                localStorage.setItem('forum_users', JSON.stringify(forumUsers));
                
                // Update current user
                currentUser.postCount++;
                localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
            }
            
            // Create celebration leaves
            createCelebrationLeaves();
            
            closeCreatePostModal();
            filterPosts();
            updateForumStats();
            
            showSuccessMessage('Post published successfully!');
            
        } catch (error) {
            console.error('Error creating post:', error);
            showErrorMessage('Error creating post: ' + error.message);
        }
    }
    
    function filterPosts() {
        let filteredPosts = [...forumPosts];
        
        // Filter by category
        if (currentCategory !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
        }
        
        // Filter by search term
        if (currentSearch) {
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(currentSearch) ||
                post.content.toLowerCase().includes(currentSearch) ||
                (post.tags && Array.isArray(post.tags) && post.tags.some(tag => 
                    tag.toLowerCase().includes(currentSearch))) ||
                (post.username ? post.username.toLowerCase().includes(currentSearch) : false) ||
                getUserById(post.user_id)?.username.toLowerCase().includes(currentSearch)
            );
        }
        
        // Sort by filter
        switch (currentFilter) {
            case 'newest':
                filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'popular':
                filteredPosts.sort((a, b) => {
                    const aScore = (a.likes || 0) + (a.comments?.length || 0) + (a.views || 0);
                    const bScore = (b.likes || 0) + (b.comments?.length || 0) + (b.views || 0);
                    return bScore - aScore;
                });
                break;
            case 'trending':
                filteredPosts.sort((a, b) => {
                    const aScore = calculateTrendingScore(a);
                    const bScore = calculateTrendingScore(b);
                    return bScore - aScore;
                });
                break;
            case 'unanswered':
                filteredPosts = filteredPosts.filter(post => (!post.comments || post.comments.length === 0));
                filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        
        displayPosts(filteredPosts);
    }
    
    function calculateTrendingScore(post) {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const hoursOld = (now - postDate) / (1000 * 60 * 60);
        
        // Score decays over time, but boosted by engagement
        const timeDecay = Math.max(0, 1 - (hoursOld / 72)); // 72 hours = 3 days
        const engagement = (post.likes || 0) + ((post.comments?.length || 0) * 2) + (post.views || 0);
        
        return engagement * timeDecay;
    }
    
    function displayPosts(posts) {
        if (!postsContainer) return;
        
        postsContainer.innerHTML = '';
        
        if (posts.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Display posts
        posts.forEach((post, index) => {
            const postElement = createPostElement(post, index);
            postsContainer.appendChild(postElement);
        });
        
        // Show load more if there are more posts
        if (loadMoreContainer) {
            loadMoreContainer.style.display = posts.length > 10 ? 'block' : 'none';
        }
    }
    
    function createPostElement(post, index) {
        const postDate = new Date(post.created_at);
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
        
        const user = getUserById(post.user_id);
        const username = user ? user.username : 'Unknown User';
        
        const postDiv = document.createElement('div');
        postDiv.className = 'forum-post';
        postDiv.dataset.postId = post.id;
        postDiv.style.animationDelay = `${index * 0.05}s`;
        
        // Format tags
        let tagsHtml = '';
        if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
            tagsHtml = `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
            `;
        }
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <div class="post-user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="post-user-info">
                        <h4>${escapeHtml(username)}</h4>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <div class="post-category">${categoryNames[post.category] || post.category}</div>
            </div>
            <div class="post-content">
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                ${tagsHtml}
            </div>
            <div class="post-footer">
                <div class="post-stats">
                    <span class="post-stat">
                        <i class="fas fa-thumbs-up"></i>
                        ${post.likes || 0}
                    </span>
                    <span class="post-stat">
                        <i class="fas fa-comment"></i>
                        ${post.comments?.length || 0}
                    </span>
                    <span class="post-stat">
                        <i class="fas fa-eye"></i>
                        ${post.views || 0}
                    </span>
                </div>
                <div class="post-actions">
                    <button class="post-action-btn" data-action="like" title="Like this post">
                        <i class="fas fa-thumbs-up"></i> Like
                    </button>
                    <button class="post-action-btn" data-action="comment" title="Add a comment">
                        <i class="fas fa-comment"></i> Comment
                    </button>
                    <button class="post-action-btn" data-action="share" title="Share this post">
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
    
    function getUserById(userId) {
        return forumUsers.find(user => user.id === userId);
    }
    
    function viewPostDetails(postId) {
        const post = forumPosts.find(p => p.id === postId);
        if (!post) {
            showErrorMessage('Post not found');
            return;
        }
        
        // Increase view count
        post.views = (post.views || 0) + 1;
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        const user = getUserById(post.user_id);
        const username = user ? user.username : 'Unknown User';
        const comments = post.comments || [];
        
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
        
        // Build comments HTML
        let commentsHtml = '';
        if (comments.length > 0) {
            commentsHtml = comments.map(comment => {
                const commentUser = getUserById(comment.user_id);
                const commentUsername = commentUser ? commentUser.username : comment.username || 'Unknown';
                return `
                    <div class="comment-item">
                        <div class="comment-user">
                            <div class="comment-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="comment-user-info">
                                <h5>${escapeHtml(commentUsername)}</h5>
                                <span>${getTimeAgo(new Date(comment.created_at))}</span>
                            </div>
                        </div>
                        <div class="comment-content">
                            ${escapeHtml(comment.content).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            commentsHtml = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        }
        
        const detailHtml = `
            <div class="post-detail">
                <h2>${escapeHtml(post.title)}</h2>
                <div class="post-meta">
                    <span>By ${escapeHtml(username)}</span>
                    <span>•</span>
                    <span>${getTimeAgo(new Date(post.created_at))}</span>
                    <span>•</span>
                    <span>${categoryNames[post.category] || post.category}</span>
                </div>
                <div class="post-content-full">
                    ${escapeHtml(post.content).replace(/\n/g, '<br>')}
                </div>
                ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
                ` : ''}
                <div class="post-stats-detailed">
                    <span><i class="fas fa-thumbs-up"></i> ${post.likes || 0} likes</span>
                    <span><i class="fas fa-comment"></i> ${comments.length} comments</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0} views</span>
                </div>
            </div>
            <div class="comment-section">
                <h4>Comments (${comments.length})</h4>
                <div class="comments-list">
                    ${commentsHtml}
                </div>
                ${currentUser ? `
                <div class="add-comment">
                    <textarea id="detail-comment-input" placeholder="Add a comment..." rows="3"></textarea>
                    <button class="btn-primary btn-small submit-comment">Post Comment</button>
                </div>
                ` : `
                <p class="login-to-comment">
                    <a href="#" class="login-link">Login</a> to add a comment
                </p>
                `}
            </div>
        `;
        
        // Create a modal for post details
        showPostDetailModal(detailHtml, postId);
    }
    
    function showPostDetailModal(content, postId) {
        // Remove existing modal if any
        const existingModal = document.getElementById('post-detail-modal-custom');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'post-detail-modal-custom';
        modal.className = 'post-detail-modal-custom active';
        modal.innerHTML = `
            <div class="post-detail-modal-content">
                <div class="post-detail-modal-header">
                    <h3>Post Details</h3>
                    <button class="post-detail-modal-close">&times;</button>
                </div>
                <div class="post-detail-modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        const closeBtn = modal.querySelector('.post-detail-modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
        
        // Add comment functionality
        const submitCommentBtn = modal.querySelector('.submit-comment');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', async () => {
                const textarea = modal.querySelector('#detail-comment-input');
                const comment = textarea.value.trim();
                if (comment) {
                    await addComment(postId, comment);
                    // Refresh post details
                    viewPostDetails(postId);
                }
            });
        }
        
        const loginLink = modal.querySelector('.login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                modal.remove();
                showLogin();
            });
        }
    }
    
    async function handlePostAction(postId, action) {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        switch (action) {
            case 'like':
                await handleLike(postId);
                break;
                
            case 'comment':
                const comment = prompt('Enter your comment:');
                if (comment && comment.trim()) {
                    await addComment(postId, comment.trim());
                }
                break;
                
            case 'share':
                const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    showSuccessMessage('Link copied to clipboard!');
                } catch (error) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showSuccessMessage('Link copied to clipboard!');
                }
                break;
        }
    }
    
    async function handleLike(postId) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                const { error } = await supabase.rpc('increment_likes', {
                    post_id: postId
                });
                
                if (!error) {
                    post.likes = (post.likes || 0) + 1;
                }
            } catch (error) {
                console.log('Supabase like failed, using localStorage');
                post.likes = (post.likes || 0) + 1;
            }
        } else {
            post.likes = (post.likes || 0) + 1;
        }
        
        // Save to localStorage
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        showSuccessMessage('Post liked!');
        
        // Update display
        filterPosts();
    }
    
    async function addComment(postId, content) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        
        // Initialize comments array if needed
        if (!post.comments) {
            post.comments = [];
        }
        
        // Create new comment
        const newComment = {
            id: generateId(),
            user_id: currentUser.id,
            username: currentUser.username,
            content: content,
            created_at: new Date().toISOString()
        };
        
        post.comments.push(newComment);
        
        // Try Supabase first if available
        if (supabaseAvailable && supabase) {
            try {
                const { error } = await supabase
                    .from('comments')
                    .insert([
                        {
                            id: newComment.id,
                            post_id: postId,
                            user_id: newComment.user_id,
                            content: newComment.content,
                            created_at: newComment.created_at
                        }
                    ]);
                
                if (!error) {
                    // Update user's comment count
                    const { error: updateError } = await supabase.rpc('increment_comment_count', {
                        user_id: currentUser.id
                    });
                    
                    if (!updateError) {
                        currentUser.commentCount++;
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                    }
                }
            } catch (error) {
                console.log('Supabase comment failed, using localStorage');
            }
        }
        
        // Update user's comment count in localStorage
        const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            forumUsers[userIndex].comment_count++;
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
            
            // Update current user
            currentUser.commentCount++;
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
        }
        
        // Save to localStorage
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        updateForumStats();
        showSuccessMessage('Comment added successfully!');
    }
    
    function loadMorePosts() {
        // For now, just show a message since we're loading all posts at once
        showInfoMessage('All posts are loaded. Check back later for new posts!');
        if (loadMorePostsBtn) {
            loadMorePostsBtn.disabled = true;
            loadMorePostsBtn.textContent = 'All Posts Loaded';
            loadMorePostsBtn.style.opacity = '0.5';
        }
    }
    
    // Helper functions
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showErrorMessage(message) {
        showNotification(message, 'error');
    }
    
    function showSuccessMessage(message) {
        showNotification(message, 'success');
    }
    
    function showInfoMessage(message) {
        showNotification(message, 'info');
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.forum-notification');
        if (existingNotification) existingNotification.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `forum-notification forum-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Leaf Animation Functions
    function initLeafAnimation() {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        // Clear existing leaves
        leafContainer.innerHTML = '';
        
        // Create initial leaves
        const leafCount = 15;
        
        for (let i = 0; i < leafCount; i++) {
            setTimeout(() => createLeaf(i), i * 300);
        }
        
        // Create additional leaves randomly
        setInterval(() => {
            if (Math.random() > 0.7 && leafContainer.children.length < 25) {
                createLeaf(Date.now());
            }
        }, 8000);
        
        // Create leaves on mouse movement
        let mouseMoveTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                if (Math.random() > 0.9 && leafContainer.children.length < 30) {
                    createLeafAtPosition(e.clientX, e.clientY);
                }
            }, 100);
        });
        
        // Pause animation when page is not visible
        document.addEventListener('visibilitychange', () => {
            const leaves = document.querySelectorAll('.leaf');
            if (document.hidden) {
                leaves.forEach(leaf => {
                    leaf.style.animationPlayState = 'paused';
                });
            } else {
                leaves.forEach(leaf => {
                    leaf.style.animationPlayState = 'running';
                });
            }
        });
    }
    
    function createLeaf(id) {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.id = `leaf-${id}`;
        
        // Randomize properties
        const size = 15 + Math.random() * 30;
        const startPosition = Math.random() * 100;
        const animationDuration = 18 + Math.random() * 20;
        const sway = Math.random() > 0.6;
        const colorClass = getRandomLeafColor();
        const opacity = 0.5 + Math.random() * 0.4;
        
        // Apply styles
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${startPosition}%`;
        leaf.style.opacity = opacity;
        leaf.style.animationDuration = `${animationDuration}s`;
        leaf.style.animationDelay = `${Math.random() * 5}s`;
        
        if (sway) {
            leaf.classList.add('swing');
        }
        
        leaf.classList.add(colorClass);
        
        // Add interactive effects
        leaf.addEventListener('mouseenter', () => {
            leaf.style.animationPlayState = 'paused';
            leaf.style.transform = 'scale(1.4) rotate(10deg)';
            leaf.style.filter = 'drop-shadow(0 8px 16px rgba(76, 175, 80, 0.8)) brightness(1.4)';
            leaf.style.zIndex = '1000';
            leaf.style.transition = 'all 0.3s ease';
            
            // Create particle effect on hover
            createLeafParticles(leaf);
        });
        
        leaf.addEventListener('mouseleave', () => {
            leaf.style.animationPlayState = 'running';
            leaf.style.transform = '';
            leaf.style.filter = '';
            leaf.style.zIndex = '';
            leaf.style.transition = '';
        });
        
        // Remove leaf when animation completes and add new one
        leaf.addEventListener('animationend', () => {
            if (leaf.parentNode) {
                leaf.remove();
                // Create a new leaf after a random delay
                setTimeout(() => createLeaf(Date.now()), Math.random() * 8000);
            }
        });
        
        leafContainer.appendChild(leaf);
    }
    
    function createLeafAtPosition(x, y) {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer || leafContainer.children.length >= 35) return;
        
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.id = `leaf-mouse-${Date.now()}`;
        
        // Size and style
        const size = 10 + Math.random() * 25;
        const colorClass = getRandomLeafColor();
        const opacity = 0.4 + Math.random() * 0.3;
        
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${x}px`;
        leaf.style.top = `${y}px`;
        leaf.style.opacity = opacity;
        leaf.style.animationDuration = `${12 + Math.random() * 15}s`;
        leaf.style.position = 'fixed';
        leaf.style.zIndex = '999';
        
        leaf.classList.add(colorClass);
        if (Math.random() > 0.5) leaf.classList.add('swing');
        
        // Add to container
        leafContainer.appendChild(leaf);
        
        // Remove after animation
        setTimeout(() => {
            if (leaf.parentNode) {
                leaf.remove();
            }
        }, 20000);
    }
    
    function createCelebrationLeaves() {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        // Create burst of leaves from center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const leaf = document.createElement('div');
                leaf.className = 'leaf celebration-leaf';
                leaf.style.width = `${20 + Math.random() * 20}px`;
                leaf.style.height = leaf.style.width;
                leaf.style.left = `${centerX}px`;
                leaf.style.top = `${centerY}px`;
                leaf.style.position = 'fixed';
                leaf.style.opacity = '0.8';
                leaf.style.zIndex = '1001';
                leaf.style.animation = `celebrateLeaf 2s ease-out forwards`;
                leaf.style.animationDelay = `${i * 0.1}s`;
                
                // Add to container
                leafContainer.appendChild(leaf);
                
                // Remove after animation
                setTimeout(() => {
                    if (leaf.parentNode) {
                        leaf.remove();
                    }
                }, 2000);
                
            }, i * 100);
        }
    }
    
    function createLeafParticles(sourceLeaf) {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        const rect = sourceLeaf.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 3-5 small particles
        const particleCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'leaf-particle';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = 'radial-gradient(circle, #4CAF50, #2E7D32)';
            particle.style.borderRadius = '50%';
            particle.style.position = 'fixed';
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.zIndex = '1002';
            particle.style.pointerEvents = 'none';
            
            // Random animation
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const duration = 0.5 + Math.random() * 0.5;
            
            particle.style.animation = `
                particleFloat ${duration}s ease-out forwards,
                particleFade ${duration}s ease-out forwards
            `;
            
            particle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
            
            leafContainer.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, duration * 1000);
        }
    }
    
    function getRandomLeafColor() {
        const colors = ['green', 'light-green', 'dark-green'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Add CSS for celebration leaves, particles, and notifications
    const style = document.createElement('style');
    style.textContent = `
        .celebration-leaf {
            animation: celebrateLeaf 2s ease-out forwards !important;
        }
        
        @keyframes celebrateLeaf {
            0% {
                transform: translate(0, 0) scale(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            100% {
                transform: translate(var(--tx, calc((Math.random() - 0.5) * 200px)), 
                                    var(--ty, calc((Math.random() - 0.5) * 200px))) 
                           scale(1) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes particleFloat {
            to {
                transform: translate(var(--end-x, 0), var(--end-y, 0));
            }
        }
        
        @keyframes particleFade {
            0%, 70% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }
        
        .forum-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(30, 30, 30, 0.95);
            border-left: 4px solid #4CAF50;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease;
        }
        
        .forum-notification-error {
            border-left-color: #f44336;
        }
        
        .forum-notification-success {
            border-left-color: #4CAF50;
        }
        
        .forum-notification-info {
            border-left-color: #2196F3;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 10px;
        }
        
        .notification-close:hover {
            color: white;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .post-detail-modal-custom {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 2000;
            overflow-y: auto;
            display: none;
        }
        
        .post-detail-modal-custom.active {
            display: block;
        }
        
        .post-detail-modal-content {
            background: rgba(25, 25, 25, 0.98);
            min-height: 100vh;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
        }
        
        .post-detail-modal-header {
            position: sticky;
            top: 0;
            background: rgba(25, 25, 25, 0.98);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 1;
        }
        
        .post-detail-modal-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 2rem;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .post-detail-modal-body {
            padding: 30px;
        }
        
        .post-detail h2 {
            color: white;
            margin-bottom: 15px;
            font-size: 2rem;
        }
        
        .post-meta {
            color: #aaa;
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 25px;
            font-size: 0.9rem;
        }
        
        .post-content-full {
            color: #ccc;
            line-height: 1.8;
            font-size: 1.1rem;
            margin-bottom: 30px;
            white-space: pre-line;
        }
        
        .post-stats-detailed {
            display: flex;
            gap: 20px;
            margin: 25px 0;
            padding: 15px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: #aaa;
        }
        
        .post-stats-detailed i {
            color: #4CAF50;
            margin-right: 5px;
        }
        
        .comment-section {
            margin-top: 40px;
        }
        
        .comment-section h4 {
            color: white;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .comments-list {
            margin-bottom: 30px;
        }
        
        .comment-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .comment-user {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .comment-avatar {
            width: 30px;
            height: 30px;
            background: rgba(76, 175, 80, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4CAF50;
        }
        
        .comment-user-info h5 {
            color: white;
            margin: 0;
            font-size: 1rem;
        }
        
        .comment-user-info span {
            color: #666;
            font-size: 0.8rem;
        }
        
        .comment-content {
            color: #ccc;
            line-height: 1.6;
        }
        
        .no-comments, .login-to-comment {
            color: #666;
            text-align: center;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .login-to-comment a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        .add-comment textarea {
            width: 100%;
            padding: 15px;
            background: rgba(40, 40, 40, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            font-size: 1rem;
            font-family: inherit;
            resize: vertical;
            margin-bottom: 15px;
        }
        
        .btn-small {
            padding: 10px 20px;
            font-size: 0.9rem;
        }
        
        /* Loading animation */
        .loading-posts {
            text-align: center;
            padding: 60px 0;
        }
        
        .loading-spinner {
            font-size: 3rem;
            color: #4CAF50;
            margin-bottom: 20px;
            animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Check URL for post parameter
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
        setTimeout(() => viewPostDetails(postId), 1000);
    }
    
    console.log('🌱 Space Vibe Garden Forum - Ready!');
    console.log('✅ Supabase integration added - will try Supabase first, fallback to localStorage');
    console.log('Demo Credentials (localStorage mode):');
    console.log('1. Email: admin@spacevibe.com / Password: password123');
    console.log('2. Email: canna@spacevibe.com / Password: password123');
    console.log('3. Email: led@spacevibe.com / Password: password123');
    console.log('4. Email: organic@spacevibe.com / Password: password123');
});