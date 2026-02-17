// ============================================ //
// SPACE VIBE GARDEN FORUM - ULTIMATE FINAL     //
// SUPABASE ONLY - WORKING STATS               //
// EVERYTHING WORKS - POSTS, IMAGES, CHAT      //
// ============================================ //

// ============================================ //
// GLOBAL VARIABLES                            //
// ============================================ //

window.currentUser = null;
window.forumPosts = [];
window.forumUsers = [];
window.currentFilter = 'newest';
window.currentCategory = 'all';
window.currentSearch = '';
window.selectedImages = [];
window.conversations = [];
window.activeConversation = null;
window.messagesSubscription = null;
window.unreadCount = 0;
window.savedCalculations = [];

console.log('🚀 Forum script loading...');

// ============================================ //
// HELPER FUNCTIONS                           //
// ============================================ //

window.getDefaultAvatar = function() {
    return 'https://ui-avatars.com/api/?name=User&background=4CAF50&color=fff&size=100';
};

window.getUserBadge = function(postCount) {
    if (postCount >= 100) return { name: 'Legend', icon: '👑', class: 'badge-legend' };
    if (postCount >= 50) return { name: 'Master', icon: '🍃', class: 'badge-master' };
    if (postCount >= 10) return { name: 'Grower', icon: '🌿', class: 'badge-grower' };
    return { name: 'Seedling', icon: '🌱', class: 'badge-seedling' };
};

window.getNextRank = function(postCount) {
    if (postCount >= 100) return null;
    if (postCount >= 50) return { name: 'Legend', needed: 100 - postCount };
    if (postCount >= 10) return { name: 'Master', needed: 50 - postCount };
    return { name: 'Grower', needed: 10 - postCount };
};

window.getRankProgress = function(postCount) {
    if (postCount >= 100) return 100;
    if (postCount >= 50) return ((postCount - 50) / 50) * 100;
    if (postCount >= 10) return ((postCount - 10) / 40) * 100;
    return (postCount / 10) * 100;
};

window.isAdmin = function() {
    if (!window.currentUser) return false;
    const adminEmails = ['admin@spacevibe.com', 'manueljp1985@gmail.com'];
    return adminEmails.includes(window.currentUser.email);
};

window.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

window.getTimeAgo = function(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'now';
};

window.generateId = function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

window.showNotification = function(message, type = 'info') {
    const existing = document.querySelector('.forum-notification');
    if (existing) existing.remove();
    
    const notif = document.createElement('div');
    notif.className = `forum-notification forum-notification-${type}`;
    notif.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notif);
    notif.querySelector('.notification-close').addEventListener('click', () => notif.remove());
    setTimeout(() => notif.remove(), 5000);
};

window.showErrorMessage = (msg) => window.showNotification(msg, 'error');
window.showSuccessMessage = (msg) => window.showNotification(msg, 'success');
window.showInfoMessage = (msg) => window.showNotification(msg, 'info');

window.getUserById = function(userId) {
    return window.forumUsers.find(u => u.id === userId);
};

// ============================================ //
// LOAD USERS FROM SUPABASE                    //
// ============================================ //

window.loadUsersFromSupabase = async function() {
    if (!window.supabase) return;
    
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*');
        
        if (error) throw error;
        
        if (data) {
            window.forumUsers = data.map(profile => ({
                id: profile.id,
                email: profile.email,
                username: profile.username,
                avatar: profile.avatar || window.getDefaultAvatar(),
                bio: profile.bio || '',
                location: profile.location || '',
                join_date: profile.join_date || new Date().toISOString(),
                post_count: profile.post_count || 0,
                comment_count: profile.comment_count || 0
            }));
            console.log('✅ Loaded', window.forumUsers.length, 'users from Supabase');
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
    }
};

// ============================================ //
// LOAD POSTS FROM SUPABASE                    //
// ============================================ //

window.loadPostsFromSupabase = async function() {
    if (!window.supabase) return;
    
    try {
        const { data, error } = await window.supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
            window.forumPosts = data.map(post => ({
                ...post,
                comments: []
            }));
            console.log('✅ Loaded', window.forumPosts.length, 'posts from Supabase');
        }
    } catch (error) {
        console.error('❌ Error loading posts:', error);
    }
};

// ============================================ //
// LOAD COMMENTS FOR A POST                    //
// ============================================ //

window.loadCommentsForPost = async function(postId) {
    if (!window.supabase) return [];
    
    try {
        const { data, error } = await window.supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('❌ Error loading comments:', error);
        return [];
    }
};

// ============================================ //
// UPDATE FORUM STATS FROM SUPABASE            //
// ============================================ //

window.updateForumStats = async function() {
    if (!window.supabase) return;
    
    try {
        // Get total posts count
        const { count: postsCount, error: postsError } = await window.supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });
        
        if (postsError) throw postsError;
        
        // Get total users count
        const { count: usersCount, error: usersError } = await window.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Get total comments count
        const { count: commentsCount, error: commentsError } = await window.supabase
            .from('comments')
            .select('*', { count: 'exact', head: true });
        
        if (commentsError) throw commentsError;
        
        // Update the DOM
        const totalPostsEl = document.getElementById('total-posts');
        const totalUsersEl = document.getElementById('total-users');
        const totalCommentsEl = document.getElementById('total-comments');
        const totalMessagesEl = document.getElementById('total-messages');
        
        if (totalPostsEl) totalPostsEl.textContent = postsCount || 0;
        if (totalUsersEl) totalUsersEl.textContent = usersCount || 0;
        if (totalCommentsEl) totalCommentsEl.textContent = commentsCount || 0;
        if (totalMessagesEl) totalMessagesEl.textContent = window.unreadCount || 0;
        
        console.log('📊 Forum stats updated:', { postsCount, usersCount, commentsCount });
        
    } catch (error) {
        console.error('❌ Error updating forum stats:', error);
    }
};

// ============================================ //
// AUTH FUNCTIONS - SUPABASE ONLY              //
// ============================================ //

window.checkUser = async function() {
    if (!window.supabase) return;
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                window.currentUser = {
                    id: profile.id,
                    email: profile.email,
                    username: profile.username,
                    avatar: profile.avatar || window.getDefaultAvatar(),
                    bio: profile.bio || '',
                    location: profile.location || '',
                    postCount: profile.post_count || 0,
                    commentCount: profile.comment_count || 0,
                    join_date: profile.join_date || new Date().toISOString()
                };
                
                localStorage.setItem('forum_current_user', JSON.stringify(window.currentUser));
            }
        }
    } catch (e) {
        console.error('❌ Failed to check user:', e);
        const savedUser = localStorage.getItem('forum_current_user');
        if (savedUser) {
            try {
                window.currentUser = JSON.parse(savedUser);
            } catch (e) {}
        }
    }
    
    window.updateUserInterface();
};

window.handleLogin = async function() {
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    const email = document.getElementById('login-email')?.value.trim() || '';
    const password = document.getElementById('login-password')?.value.trim() || '';
    
    if (!email || !password) {
        window.showErrorMessage('Please fill in all fields');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            window.showErrorMessage('Login failed: ' + error.message);
            return;
        }
        
        if (data.user) {
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (profile) {
                window.currentUser = {
                    id: profile.id,
                    email: profile.email,
                    username: profile.username,
                    avatar: profile.avatar || window.getDefaultAvatar(),
                    bio: profile.bio || '',
                    location: profile.location || '',
                    postCount: profile.post_count || 0,
                    commentCount: profile.comment_count || 0,
                    join_date: profile.join_date || new Date().toISOString()
                };
                
                localStorage.setItem('forum_current_user', JSON.stringify(window.currentUser));
                
                document.getElementById('login-form')?.classList.remove('active');
                document.getElementById('auth-success')?.classList.add('active');
                document.getElementById('success-message').textContent = 'Login Successful!';
                document.getElementById('success-detail').textContent = `Welcome back, ${window.currentUser.username}!`;
                
                window.updateUserInterface();
                await window.loadPostsFromSupabase();
                await window.updateForumStats();
                window.filterPosts();
                window.showSuccessMessage(`Welcome back, ${window.currentUser.username}!`);
                
                setTimeout(() => {
                    document.getElementById('auth-modal')?.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }, 1500);
            }
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        window.showErrorMessage('Login failed. Please try again.');
    }
};

window.handleRegister = async function() {
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    const username = document.getElementById('register-username')?.value.trim() || '';
    const email = document.getElementById('register-email')?.value.trim() || '';
    const password = document.getElementById('register-password')?.value.trim() || '';
    const confirm = document.getElementById('register-confirm')?.value.trim() || '';
    const terms = document.getElementById('agree-terms')?.checked || false;
    
    if (!username || !email || !password || !confirm) {
        window.showErrorMessage('Please fill in all fields');
        return;
    }
    
    if (password !== confirm) {
        window.showErrorMessage('Passwords do not match');
        return;
    }
    
    if (!terms) {
        window.showErrorMessage('Please agree to the Terms');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        
        if (error) {
            window.showErrorMessage('Registration failed: ' + error.message);
            return;
        }
        
        if (data.user) {
            const { error: profileError } = await window.supabase
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    email,
                    username,
                    avatar: window.getDefaultAvatar(),
                    bio: '',
                    location: '',
                    join_date: new Date().toISOString(),
                    post_count: 0,
                    comment_count: 0
                }]);
            
            if (profileError) {
                console.error('❌ Profile creation error:', profileError);
                window.showErrorMessage('Failed to create profile');
                return;
            }
            
            window.currentUser = {
                id: data.user.id,
                email,
                username,
                avatar: window.getDefaultAvatar(),
                bio: '',
                location: '',
                postCount: 0,
                commentCount: 0,
                join_date: new Date().toISOString()
            };
            
            localStorage.setItem('forum_current_user', JSON.stringify(window.currentUser));
            
            document.getElementById('register-form')?.classList.remove('active');
            document.getElementById('auth-success')?.classList.add('active');
            document.getElementById('success-message').textContent = 'Account Created!';
            document.getElementById('success-detail').textContent = `Welcome, ${username}!`;
            
            window.updateUserInterface();
            await window.updateForumStats();
            window.showSuccessMessage(`Welcome, ${username}!`);
            
            setTimeout(() => {
                document.getElementById('auth-modal')?.classList.remove('active');
                document.body.style.overflow = 'auto';
            }, 1500);
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        window.showErrorMessage('Registration failed. Please try again.');
    }
};

window.handleLogout = async function() {
    if (window.supabase) {
        try { 
            await window.supabase.auth.signOut(); 
        } catch (e) {}
    }
    
    if (window.messagesSubscription) {
        window.messagesSubscription.unsubscribe();
        window.messagesSubscription = null;
    }
    
    window.currentUser = null;
    window.activeConversation = null;
    window.conversations = [];
    window.unreadCount = 0;
    window.forumPosts = [];
    
    localStorage.removeItem('forum_current_user');
    window.updateUserInterface();
    window.updateUnreadBadge();
    await window.updateForumStats();
    window.showSuccessMessage('Logged out!');
    window.filterPosts();
};

window.updateUserInterface = function() {
    const userWelcome = document.getElementById('user-welcome');
    const loggedInUser = document.getElementById('logged-in-user');
    const usernameText = document.getElementById('username-text');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userBadgeDisplay = document.getElementById('user-badge-display');
    
    if (window.currentUser) {
        if (userWelcome) userWelcome.style.display = 'none';
        if (loggedInUser) {
            loggedInUser.style.display = 'flex';
            if (usernameText) usernameText.textContent = window.currentUser.username;
            if (userAvatarImg) userAvatarImg.src = window.currentUser.avatar || window.getDefaultAvatar();
            
            const badge = window.getUserBadge(window.currentUser.postCount || 0);
            if (userBadgeDisplay) {
                if (window.isAdmin()) {
                    userBadgeDisplay.className = 'user-badge admin-badge';
                    userBadgeDisplay.innerHTML = '<i class="fas fa-crown"></i> ADMIN';
                } else {
                    userBadgeDisplay.className = `user-badge ${badge.class}`;
                    userBadgeDisplay.textContent = `${badge.icon} ${badge.name}`;
                }
            }
        }
    } else {
        if (userWelcome) userWelcome.style.display = 'block';
        if (loggedInUser) loggedInUser.style.display = 'none';
    }
};

// ============================================ //
// PROFILE FUNCTIONS - SUPABASE ONLY           //
// ============================================ //

window.openProfileModal = function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    console.log('📝 Opening profile modal');
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        window.populateProfileModal();
    }
};

window.populateProfileModal = function() {
    if (!window.currentUser) return;
    
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileBio = document.getElementById('profile-bio');
    const profileLocation = document.getElementById('profile-location');
    const avatarPreview = document.getElementById('avatar-preview');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const profilePostCount = document.getElementById('profile-post-count');
    const profileCommentCount = document.getElementById('profile-comment-count');
    const profileJoinDate = document.getElementById('profile-join-date');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    
    if (profileUsername) profileUsername.value = window.currentUser.username || '';
    if (profileEmail) profileEmail.value = window.currentUser.email || '';
    if (profileBio) profileBio.value = window.currentUser.bio || '';
    if (profileLocation) profileLocation.value = window.currentUser.location || '';
    if (profilePostCount) profilePostCount.textContent = window.currentUser.postCount || 0;
    if (profileCommentCount) profileCommentCount.textContent = window.currentUser.commentCount || 0;
    
    const joinDate = window.currentUser.join_date ? new Date(window.currentUser.join_date) : new Date();
    if (profileJoinDate) profileJoinDate.textContent = joinDate.getFullYear();
    
    const avatar = window.currentUser.avatar || window.getDefaultAvatar();
    if (avatarPreview) avatarPreview.src = avatar;
    if (userAvatarImg) userAvatarImg.src = avatar;
    
    if (removeAvatarBtn) {
        removeAvatarBtn.style.display = (window.currentUser.avatar && window.currentUser.avatar !== window.getDefaultAvatar()) ? 'inline-block' : 'none';
    }
    
    const badgeIcon = document.getElementById('badge-icon');
    const badgeName = document.getElementById('badge-name');
    const nextRank = document.getElementById('next-rank');
    const rankProgress = document.getElementById('rank-progress');
    const currentPosts = document.getElementById('current-posts');
    const postsNeeded = document.getElementById('posts-needed');
    
    const badge = window.getUserBadge(window.currentUser.postCount || 0);
    if (badgeIcon) badgeIcon.textContent = badge.icon;
    if (badgeName) {
        badgeName.textContent = badge.name;
        badgeName.className = badge.class;
    }
    
    const next = window.getNextRank(window.currentUser.postCount || 0);
    if (next) {
        if (nextRank) nextRank.textContent = next.name;
        if (postsNeeded) postsNeeded.textContent = next.needed;
    } else {
        if (nextRank) nextRank.textContent = 'Legend';
        if (postsNeeded) postsNeeded.textContent = '0';
    }
    
    if (currentPosts) currentPosts.textContent = window.currentUser.postCount || 0;
    if (rankProgress) rankProgress.style.width = `${window.getRankProgress(window.currentUser.postCount || 0)}%`;
};

window.closeProfileModal = function() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

window.handleAvatarUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        window.showErrorMessage('Image too large. Max 2MB.');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        window.showErrorMessage('Please upload an image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const avatarData = event.target.result;
        
        const avatarPreview = document.getElementById('avatar-preview');
        const userAvatarImg = document.getElementById('user-avatar-img');
        const removeAvatarBtn = document.getElementById('remove-avatar');
        
        if (avatarPreview) avatarPreview.src = avatarData;
        if (userAvatarImg) userAvatarImg.src = avatarData;
        if (removeAvatarBtn) removeAvatarBtn.style.display = 'inline-block';
        
        window.pendingAvatar = avatarData;
    };
    
    reader.readAsDataURL(file);
};

window.handleRemoveAvatar = function() {
    const defaultAvatar = window.getDefaultAvatar();
    
    const avatarPreview = document.getElementById('avatar-preview');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    
    if (avatarPreview) avatarPreview.src = defaultAvatar;
    if (userAvatarImg) userAvatarImg.src = defaultAvatar;
    if (removeAvatarBtn) removeAvatarBtn.style.display = 'none';
    
    window.pendingAvatar = defaultAvatar;
};

window.saveProfile = async function() {
    if (!window.currentUser) return;
    
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    const profileBio = document.getElementById('profile-bio');
    const profileLocation = document.getElementById('profile-location');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (profileBio) window.currentUser.bio = profileBio.value.trim();
    if (profileLocation) window.currentUser.location = profileLocation.value.trim();
    if (avatarPreview) window.currentUser.avatar = avatarPreview.src;
    if (window.pendingAvatar) {
        window.currentUser.avatar = window.pendingAvatar;
        delete window.pendingAvatar;
    }
    
    try {
        const { error } = await window.supabase
            .from('profiles')
            .update({
                bio: window.currentUser.bio,
                location: window.currentUser.location,
                avatar: window.currentUser.avatar
            })
            .eq('id', window.currentUser.id);
        
        if (error) throw error;
        
        localStorage.setItem('forum_current_user', JSON.stringify(window.currentUser));
        
        window.showSuccessMessage('Profile updated successfully!');
        window.closeProfileModal();
        window.updateUserInterface();
        
        await window.loadUsersFromSupabase();
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        window.showErrorMessage('Failed to save profile');
    }
};

// ============================================ //
// POST IMAGES - FULLY WORKING                 //
// ============================================ //

const postImageInput = document.getElementById('post-image');
if (postImageInput) {
    postImageInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                window.showErrorMessage('Image too large. Max 5MB.');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                window.showErrorMessage('Please upload an image file.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                window.selectedImages.push({
                    file: file,
                    data: event.target.result,
                    name: file.name
                });
                window.renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    });
}

window.renderImagePreviews = function() {
    const container = document.getElementById('image-preview-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    window.selectedImages.forEach((image, index) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${image.data}" alt="Preview">
            <button class="remove-image" data-index="${index}">&times;</button>
        `;
        
        const removeBtn = preview.querySelector('.remove-image');
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.selectedImages.splice(index, 1);
            window.renderImagePreviews();
        });
        
        container.appendChild(preview);
    });
};

// ============================================ //
// IMAGE GALLERY - FIXED VERSION               //
// ============================================ //

window.createImageGallery = function(images) {
    if (!images || images.length === 0) return '';
    
    // SHOW ONLY FIRST 4 IMAGES ON MAIN PAGE - NO "+" BOX
    const displayImages = images.slice(0, 4);
    
    let html = '<div class="post-images" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 15px 0;">';
    
    displayImages.forEach(image => {
        html += `
            <div class="post-image" onclick="event.stopPropagation(); window.openLightbox('${image}')" 
                 style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;">
                <img src="${image}" alt="Post image" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    });
    
    html += '</div>';
    return html;
};

window.openLightbox = function(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox active';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <div class="lightbox-content">
            <img src="${imageSrc}" alt="Full size">
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    const closeBtn = lightbox.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', () => {
        lightbox.remove();
        document.body.style.overflow = 'auto';
    });
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
            document.body.style.overflow = 'auto';
        }
    });
};

// ============================================ //
// CREATE POST - SUPABASE ONLY - NO LOCALSTORAGE
// ============================================ //

window.showCreatePostModal = function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    console.log('📝 Opening create post modal');
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('post-title')?.focus();
    }
};

window.closeCreatePostModal = function() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    const title = document.getElementById('post-title');
    const category = document.getElementById('post-category');
    const content = document.getElementById('post-content');
    const tags = document.getElementById('post-tags');
    
    if (title) title.value = '';
    if (category) category.value = '';
    if (content) content.value = '';
    if (tags) tags.value = '';
    
    window.selectedImages = [];
    window.renderImagePreviews();
};

window.handleCreatePost = async function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    const title = document.getElementById('post-title')?.value.trim();
    const category = document.getElementById('post-category')?.value;
    const content = document.getElementById('post-content')?.value.trim();
    const tags = document.getElementById('post-tags')?.value.split(',').map(t => t.trim()).filter(t => t) || [];
    const images = window.selectedImages.map(img => img.data);
    
    if (!title || !category || !content) {
        window.showErrorMessage('Please fill in all required fields');
        return;
    }
    
    if (title.length < 3) {
        window.showErrorMessage('Title must be at least 3 characters');
        return;
    }
    
    if (content.length < 10) {
        window.showErrorMessage('Content must be at least 10 characters');
        return;
    }
    
    const newPost = {
        id: window.generateId(),
        user_id: window.currentUser.id,
        title: title,
        category: category,
        content: content,
        tags: tags,
        images: images,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes: 0,
        views: 0,
        pinned: false
    };
    
    try {
        console.log('📤 Saving post to Supabase...');
        
        const { error } = await window.supabase
            .from('posts')
            .insert([newPost]);
        
        if (error) throw error;
        
        console.log('✅ Post saved to Supabase');
        
        try {
            await window.supabase.rpc('increment_post_count', { user_id: window.currentUser.id });
            console.log('✅ Post count updated in Supabase');
        } catch (e) {
            console.error('❌ Failed to update post count:', e);
        }
        
        window.currentUser.postCount = (window.currentUser.postCount || 0) + 1;
        localStorage.setItem('forum_current_user', JSON.stringify(window.currentUser));
        
        window.forumPosts.unshift({
            ...newPost,
            comments: []
        });
        
        window.closeCreatePostModal();
        await window.updateForumStats();
        window.filterPosts();
        window.showSuccessMessage('Post published successfully!');
        
        window.selectedImages = [];
        window.renderImagePreviews();
        
    } catch (error) {
        console.error('❌ Error creating post:', error);
        window.showErrorMessage('Failed to create post: ' + error.message);
    }
};

// ============================================ //
// POST DETAILS                                //
// ============================================ //

window.viewPostDetails = async function(postId) {
    window.currentPostId = postId; // Store for the more-images click
    const post = window.forumPosts.find(p => p.id === postId);
    if (!post) {
        window.showErrorMessage('Post not found');
        return;
    }
    
    post.views = (post.views || 0) + 1;
    
    if (window.supabase) {
        try {
            await window.supabase
                .from('posts')
                .update({ views: post.views })
                .eq('id', postId);
        } catch (e) {}
    }
    
    const comments = await window.loadCommentsForPost(postId);
    post.comments = comments;
    
    const user = window.getUserById(post.user_id) || {
        username: 'Unknown',
        avatar: window.getDefaultAvatar(),
        post_count: 0,
        email: ''
    };
    
    const badge = window.getUserBadge(user.post_count || 0);
    
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
    
    window.showPostDetailModal(post, user, badge, comments, categoryNames);
};

window.showPostDetailModal = function(post, user, badge, comments, categoryNames) {
    const authorHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${user.avatar || window.getDefaultAvatar()}" 
                 alt="Avatar" 
                 style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #4CAF50; object-fit: cover;">
            <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-weight: 600; color: var(--text-primary);">${window.escapeHtml(user.username)}</span>
                    ${window.isAdmin() && user.email === 'admin@spacevibe.com' 
                        ? '<span class="user-badge admin-badge" style="font-size: 0.7rem; padding: 2px 8px;"><i class="fas fa-crown"></i> ADMIN</span>' 
                        : `<span class="user-badge ${badge.class}" style="font-size: 0.7rem; padding: 2px 8px;">${badge.icon} ${badge.name}</span>`
                    }
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px; color: var(--text-muted); font-size: 0.8rem;">
                    <span><i class="fas fa-clock"></i> ${window.getTimeAgo(new Date(post.created_at))}</span>
                    <span>•</span>
                    <span><i class="fas fa-tag"></i> ${categoryNames[post.category] || post.category}</span>
                    ${post.pinned ? '<span style="color: #ff9800; margin-left: 4px;"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                </div>
            </div>
        </div>
    `;
    
    let commentsHTML = '';
    if (comments.length > 0) {
        commentsHTML = comments.map(c => {
            const cu = window.getUserById(c.user_id) || {
                username: c.username || 'Unknown',
                avatar: c.avatar || window.getDefaultAvatar(),
                post_count: 0
            };
            const cb = window.getUserBadge(cu.post_count || 0);
            
            return `
                <div class="comment-item" data-comment-id="${c.id}" style="background: var(--bg-tertiary); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <img src="${cu.avatar || window.getDefaultAvatar()}" 
                             alt="Avatar" 
                             style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid #4CAF50; object-fit: cover; flex-shrink: 0;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${window.escapeHtml(cu.username)}</span>
                                    <span class="user-badge ${cb.class}" style="font-size: 0.65rem; padding: 2px 6px;">${cb.icon}</span>
                                    <span style="color: var(--text-muted); font-size: 0.7rem;">${window.getTimeAgo(new Date(c.created_at))}</span>
                                </div>
                                ${window.currentUser && (window.currentUser.id === c.user_id || window.isAdmin()) ? `
                                <div style="display: flex; gap: 6px;">
                                    <button onclick="window.editComment('${post.id}', '${c.id}')" class="comment-action-btn edit-btn" style="background: none; border: 1px solid var(--border-color); color: var(--text-muted); padding: 4px 10px; border-radius: 16px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="window.deleteMyComment('${post.id}', '${c.id}')" class="comment-action-btn delete-btn" style="background: none; border: 1px solid var(--border-color); color: #f44336; padding: 4px 10px; border-radius: 16px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin-top: 8px;">
                                ${window.escapeHtml(c.content).replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        commentsHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-tertiary); border-radius: 12px;"><i class="fas fa-comment-slash" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i><p>No comments yet. Be the first to comment!</p></div>';
    }
    
    // SHOW ALL IMAGES IN DETAIL VIEW
    let imagesHTML = '';
    if (post.images && post.images.length > 0) {
        imagesHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">';
        post.images.forEach(img => {
            imagesHTML += `
                <div onclick="window.openLightbox('${img}')" 
                     style="border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; border: 2px solid #4CAF50; transition: transform 0.2s ease;">
                    <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="Post image">
                </div>
            `;
        });
        imagesHTML += '</div>';
    }
    
    const contentHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="color: var(--text-primary); font-size: 1.8rem; margin-bottom: 20px;">${window.escapeHtml(post.title)}</h2>
            
            ${authorHTML}
            
            <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 24px; margin: 24px 0; color: var(--text-secondary); line-height: 1.7; font-size: 1rem;">
                ${window.escapeHtml(post.content).replace(/\n/g, '<br>')}
            </div>
            
            ${imagesHTML}
            
            ${post.tags && post.tags.length ? `
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
                ${post.tags.map(t => `<span style="background: var(--bg-secondary); color: var(--text-muted); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; border: 1px solid var(--border-color);">#${window.escapeHtml(t)}</span>`).join('')}
            </div>
            ` : ''}
            
            <div style="display: flex; gap: 24px; padding: 16px 0; margin-bottom: 24px; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
                <span><i class="fas fa-thumbs-up" style="color: #4CAF50;"></i> <span class="like-count">${post.likes || 0}</span> likes</span>
                <span><i class="fas fa-comment" style="color: #4CAF50;"></i> ${comments.length} comments</span>
                <span><i class="fas fa-eye" style="color: #4CAF50;"></i> ${post.views || 0} views</span>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="color: var(--text-primary); font-size: 1.3rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-comments" style="color: #4CAF50;"></i> Comments (${comments.length})
                </h3>
                
                <div style="margin-bottom: 30px;">
                    ${commentsHTML}
                </div>
                
                ${window.currentUser ? `
                <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 20px;">
                    <div class="input-with-emoji">
                        <textarea id="comment-input-${post.id}" placeholder="Write a comment..." rows="3" style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.95rem; resize: vertical;"></textarea>
                    </div>
                    <button onclick="window.addComment('${post.id}')" style="background: #4CAF50; color: white; border: none; padding: 10px 24px; border-radius: 25px; font-size: 0.95rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; margin-top: 10px;">
                        <i class="fas fa-paper-plane"></i> Post Comment
                    </button>
                </div>
                ` : `
                <div style="text-align: center; padding: 30px; background: var(--bg-tertiary); border-radius: 12px;">
                    <i class="fas fa-lock" style="font-size: 2rem; color: #4CAF50; margin-bottom: 10px; opacity: 0.7;"></i>
                    <p style="color: var(--text-muted);"><a href="#" onclick="window.showLogin(); return false;" style="color: #4CAF50; font-weight: 600; text-decoration: none;">Login</a> to add a comment</p>
                </div>
                `}
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'post-detail-modal-custom';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 2000; overflow-y: auto; display: block;';
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); min-height: 100vh; max-width: 900px; margin: 0 auto; position: relative;">
            <div style="position: sticky; top: 0; background: var(--bg-secondary); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); z-index: 10;">
                <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-leaf" style="color: #4CAF50;"></i> Post Details
                </h3>
                <button onclick="document.getElementById('post-detail-modal-custom').remove(); document.body.style.overflow='auto';" style="background: none; border: none; color: var(--text-muted); font-size: 2rem; cursor: pointer; line-height: 1; padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            <div style="padding: 30px;">
                ${contentHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Add emoji button to comment input after modal is created
    setTimeout(() => {
        const commentInput = document.getElementById(`comment-input-${post.id}`);
        if (commentInput) {
            addEmojiButtonToInput(`comment-input-${post.id}`, 'input-with-emoji');
        }
    }, 500);
};

// ============================================ //
// COMMENTS - SUPABASE ONLY                    //
// ============================================ //

window.addComment = async function(postId) {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) {
        window.showErrorMessage('Comment cannot be empty');
        return;
    }
    
    const newComment = {
        id: window.generateId(),
        post_id: postId,
        user_id: window.currentUser.id,
        username: window.currentUser.username,
        avatar: window.currentUser.avatar,
        content: content,
        created_at: new Date().toISOString()
    };
    
    try {
        const { error } = await window.supabase
            .from('comments')
            .insert([newComment]);
        
        if (error) throw error;
        
        await window.supabase.rpc('increment_comment_count', { user_id: window.currentUser.id });
        
        window.showSuccessMessage('Comment added!');
        await window.updateForumStats();
        window.viewPostDetails(postId);
        
    } catch (error) {
        console.error('❌ Error adding comment:', error);
        window.showErrorMessage('Failed to add comment');
    }
};

window.editComment = async function(postId, commentId) {
    const post = window.forumPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (!window.isAdmin() && !window.currentUser) {
        window.showErrorMessage('You must be logged in');
        return;
    }
    
    const newContent = prompt('Edit your comment:');
    if (!newContent || !newContent.trim()) return;
    
    try {
        const { error } = await window.supabase
            .from('comments')
            .update({ 
                content: newContent.trim(),
                edited_at: new Date().toISOString()
            })
            .eq('id', commentId);
        
        if (error) throw error;
        
        window.showSuccessMessage('Comment updated!');
        window.viewPostDetails(postId);
        
    } catch (error) {
        console.error('❌ Error editing comment:', error);
        window.showErrorMessage('Failed to edit comment');
    }
};

window.deleteComment = async function(postId, commentId) {
    try {
        const { error } = await window.supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
        
        window.showSuccessMessage('Comment deleted!');
        await window.updateForumStats();
        window.viewPostDetails(postId);
        
    } catch (error) {
        console.error('❌ Error deleting comment:', error);
        window.showErrorMessage('Failed to delete comment');
    }
};

window.deleteMyComment = function(postId, commentId) {
    if (!window.isAdmin() && !window.currentUser) {
        window.showErrorMessage('You must be logged in');
        return;
    }
    
    window.showDeleteConfirmModal('comment', commentId, () => window.deleteComment(postId, commentId));
};

window.showDeleteConfirmModal = function(itemType, itemId, callback) {
    const modal = document.createElement('div');
    modal.className = 'delete-confirm-modal active';
    modal.innerHTML = `
        <div class="delete-confirm-content">
            <div class="delete-confirm-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Delete ${itemType}?</h3>
            <p>Are you sure you want to delete this ${itemType}? This action cannot be undone.</p>
            <div class="delete-confirm-actions">
                <button class="delete-confirm-btn cancel">Cancel</button>
                <button class="delete-confirm-btn danger">Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    };
    
    modal.querySelector('.cancel').addEventListener('click', closeModal);
    modal.querySelector('.delete-confirm-btn.danger').addEventListener('click', () => {
        callback();
        closeModal();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
};

// ============================================ //
// POST ACTIONS - LIKE, SHARE                  //
// ============================================ //

window.handlePostAction = async function(postId, action, button) {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    const post = window.forumPosts.find(p => p.id === postId);
    if (!post) return;
    
    switch (action) {
        case 'like':
            if (localStorage.getItem(`liked_${postId}`)) {
                window.showErrorMessage('You already liked this post');
                return;
            }
            
            post.likes = (post.likes || 0) + 1;
            localStorage.setItem(`liked_${postId}`, 'true');
            
            if (window.supabase) {
                try {
                    await window.supabase
                        .from('posts')
                        .update({ likes: post.likes })
                        .eq('id', postId);
                } catch (e) {}
            }
            
            if (button) {
                button.classList.add('liked');
                setTimeout(() => button.classList.remove('liked'), 600);
            }
            
            document.querySelectorAll(`[data-post-id="${postId}"] .like-count`).forEach(el => {
                el.textContent = post.likes;
            });
            
            window.showSuccessMessage('Post liked!');
            break;
            
        case 'comment':
            window.viewPostDetails(postId);
            setTimeout(() => {
                document.getElementById(`comment-input-${postId}`)?.focus();
            }, 500);
            break;
            
        case 'share':
            const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            try {
                await navigator.clipboard.writeText(shareUrl);
                window.showSuccessMessage('Link copied to clipboard!');
            } catch (error) {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                window.showSuccessMessage('Link copied to clipboard!');
            }
            break;
    }
};

window.deletePost = function(postId) {
    if (!window.isAdmin()) {
        window.showErrorMessage('Admin access required');
        return;
    }
    
    window.showDeleteConfirmModal('post', postId, async () => {
        try {
            const { error } = await window.supabase
                .from('posts')
                .delete()
                .eq('id', postId);
            
            if (error) throw error;
            
            window.forumPosts = window.forumPosts.filter(p => p.id !== postId);
            await window.updateForumStats();
            window.filterPosts();
            window.showSuccessMessage('Post deleted!');
            
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            window.showErrorMessage('Failed to delete post');
        }
    });
};

// ============================================ //
// FILTER POSTS                               //
// ============================================ //

window.filterPosts = function() {
    let filtered = [...window.forumPosts];
    
    if (window.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === window.currentCategory);
    }
    
    if (window.currentSearch) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(window.currentSearch) ||
            p.content.toLowerCase().includes(window.currentSearch) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(window.currentSearch))) ||
            window.getUserById(p.user_id)?.username.toLowerCase().includes(window.currentSearch)
        );
    }
    
    switch (window.currentFilter) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'popular':
            filtered.sort((a, b) => {
                const aScore = (a.likes || 0) + (a.comments?.length || 0) + (a.views || 0);
                const bScore = (b.likes || 0) + (b.comments?.length || 0) + (b.views || 0);
                return bScore - aScore;
            });
            break;
        case 'unanswered':
            filtered = filtered.filter(p => !p.comments || p.comments.length === 0);
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }
    
    filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });
    
    window.displayPosts(filtered);
};

window.displayPosts = function(posts) {
    const postsContainer = document.getElementById('posts-container');
    const emptyState = document.getElementById('empty-state');
    
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    posts.forEach((post, index) => {
        const postElement = window.createPostElement(post, index);
        postsContainer.appendChild(postElement);
    });
};

window.createPostElement = function(post, index) {
    const user = window.getUserById(post.user_id) || {
        username: 'Unknown',
        avatar: window.getDefaultAvatar(),
        post_count: 0,
        email: ''
    };
    
    const badge = window.getUserBadge(user.post_count || 0);
    
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
    postDiv.className = `forum-post ${post.pinned ? 'pinned' : ''}`;
    postDiv.dataset.postId = post.id;
    postDiv.style.animationDelay = `${index * 0.05}s`;
    
    let tagsHtml = '';
    if (post.tags && post.tags.length > 0) {
        tagsHtml = `
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="post-tag">#${window.escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
    }
    
    let imagesHtml = '';
    if (post.images && post.images.length > 0) {
        imagesHtml = window.createImageGallery(post.images);
    }
    
    const likeClass = localStorage.getItem(`liked_${post.id}`) ? 'liked' : '';
    
    let pinIndicator = '';
    if (post.pinned) {
        pinIndicator = '<span class="pin-indicator"><i class="fas fa-thumbtack"></i> Pinned</span>';
    }
    
    let userBadgeHtml = '';
    if (window.isAdmin() && user.email === 'admin@spacevibe.com') {
        userBadgeHtml = '<span class="user-badge admin-badge"><i class="fas fa-crown"></i> ADMIN</span>';
    } else {
        userBadgeHtml = `<span class="user-badge ${badge.class}">${badge.icon} ${badge.name}</span>`;
    }
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <div class="post-user-avatar">
                    <img src="${user.avatar || window.getDefaultAvatar()}" alt="Avatar" onerror="this.src='${window.getDefaultAvatar()}'">
                </div>
                <div class="post-user-info">
                    <h4>
                        ${window.escapeHtml(user.username)}
                        ${userBadgeHtml}
                        ${pinIndicator}
                    </h4>
                    <span>${window.getTimeAgo(new Date(post.created_at))}</span>
                </div>
            </div>
            <div class="post-category">${categoryNames[post.category] || post.category}</div>
        </div>
        <div class="post-content" onclick="window.viewPostDetails('${post.id}')">
            <h3>${window.escapeHtml(post.title)}</h3>
            <p>${window.escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
            ${tagsHtml}
            ${imagesHtml}
        </div>
        <div class="post-footer">
            <div class="post-stats">
                <span class="post-stat">
                    <i class="fas fa-thumbs-up"></i>
                    <span class="like-count">${post.likes || 0}</span>
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
                <button class="post-action-btn ${likeClass}" data-action="like" data-post-id="${post.id}">
                    <i class="fas fa-thumbs-up"></i> Like
                </button>
                <button class="post-action-btn" data-action="comment" data-post-id="${post.id}">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="post-action-btn" data-action="share" data-post-id="${post.id}">
                    <i class="fas fa-share"></i> Share
                </button>
                ${window.isAdmin() ? `
                <button class="post-action-btn" onclick="window.deletePost('${post.id}')" style="color: #f44336;">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    postDiv.querySelectorAll('.post-action-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.dataset.action;
            const postId = this.dataset.postId;
            if (action) {
                window.handlePostAction(postId, action, this);
            }
        });
    });
    
    return postDiv;
};

// ============================================ //
// CHAT / MESSAGING SYSTEM - FULL              //
// ============================================ //

window.updateUnreadBadge = function() {
    const unreadBadge = document.getElementById('unread-badge');
    const navUnreadBadge = document.getElementById('nav-unread-badge');
    
    if (unreadBadge) {
        unreadBadge.style.display = window.unreadCount > 0 ? 'inline' : 'none';
        unreadBadge.textContent = window.unreadCount;
    }
    
    if (navUnreadBadge) {
        navUnreadBadge.style.display = window.unreadCount > 0 ? 'inline' : 'none';
        navUnreadBadge.textContent = window.unreadCount;
    }
};

window.loadConversations = async function() {
    if (!window.currentUser || !window.supabase) return;
    
    try {
        const { data, error } = await window.supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar),
                receiver:receiver_id(id, username, avatar)
            `)
            .or(`sender_id.eq.${window.currentUser.id},receiver_id.eq.${window.currentUser.id}`)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const conversationMap = new Map();
        
        data.forEach(message => {
            const otherUser = message.sender_id === window.currentUser.id ? message.receiver : message.sender;
            if (!otherUser) return;
            
            const convId = otherUser.id;
            
            if (!conversationMap.has(convId)) {
                conversationMap.set(convId, {
                    user: otherUser,
                    messages: [],
                    lastMessage: message,
                    unread: !message.is_read && message.receiver_id === window.currentUser.id
                });
            }
            
            conversationMap.get(convId).messages.push(message);
            
            if (!message.is_read && message.receiver_id === window.currentUser.id) {
                conversationMap.get(convId).unread = true;
            }
        });
        
        window.conversations = Array.from(conversationMap.values());
        window.renderConversations();
        window.calculateUnreadCount();
        
    } catch (error) {
        console.error('❌ Error loading conversations:', error);
    }
};

window.renderConversations = function() {
    const container = document.getElementById('conversations-container');
    if (!container) return;
    
    if (!window.conversations || window.conversations.length === 0) {
        container.innerHTML = '<div class="no-conversations">No conversations yet. Start by sending a message!</div>';
        return;
    }
    
    container.innerHTML = window.conversations.map(conv => {
        const badge = window.getUserBadge(conv.user.post_count || 0);
        const lastMessage = conv.lastMessage?.content?.substring(0, 30) || 'No messages';
        const time = conv.lastMessage?.created_at ? window.getTimeAgo(new Date(conv.lastMessage.created_at)) : '';
        const isActive = window.activeConversation && window.activeConversation.user?.id === conv.user.id;
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" onclick="window.selectConversation('${conv.user.id}')">
                <div class="conversation-avatar">
                    <img src="${conv.user.avatar || window.getDefaultAvatar()}" alt="Avatar" onerror="this.src='${window.getDefaultAvatar()}'">
                </div>
                <div class="conversation-info">
                    <div class="conversation-username">
                        ${window.escapeHtml(conv.user.username)}
                        <span class="user-badge ${badge.class}">${badge.icon}</span>
                    </div>
                    <div class="conversation-last-message">
                        ${window.escapeHtml(lastMessage)}...
                    </div>
                    <div class="conversation-time">${time}</div>
                </div>
                ${conv.unread ? '<span class="unread-indicator">New</span>' : ''}
            </div>
        `;
    }).join('');
};

window.selectConversation = async function(userId) {
    const conversation = window.conversations.find(c => c.user?.id === userId);
    if (!conversation) return;
    
    window.activeConversation = conversation;
    window.renderActiveConversation();
    
    if (window.supabase && window.currentUser) {
        try {
            await window.supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', userId)
                .eq('receiver_id', window.currentUser.id)
                .eq('is_read', false);
        } catch (e) {}
    }
    
    conversation.unread = false;
    window.calculateUnreadCount();
    window.renderConversations();
};

window.renderActiveConversation = function() {
    if (!window.activeConversation) return;
    
    const user = window.activeConversation.user;
    if (!user) return;
    
    const badge = window.getUserBadge(user.post_count || 0);
    const header = document.getElementById('active-conversation-header');
    const username = document.getElementById('conversation-username');
    const avatar = document.getElementById('conversation-avatar');
    const badgeSpan = document.getElementById('conversation-badge');
    const inputContainer = document.getElementById('message-input-container');
    const messagesContainer = document.getElementById('messages-container');
    
    if (header) header.style.display = 'block';
    if (username) username.textContent = user.username || 'User';
    if (avatar) avatar.src = user.avatar || window.getDefaultAvatar();
    if (badgeSpan) {
        badgeSpan.className = `user-badge ${badge.class}`;
        badgeSpan.textContent = `${badge.icon} ${badge.name}`;
    }
    if (inputContainer) inputContainer.style.display = 'flex';
    
    if (messagesContainer) {
        if (!window.activeConversation.messages || window.activeConversation.messages.length === 0) {
            messagesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i><p>No messages yet. Say hello!</p></div>';
        } else {
            const sortedMessages = [...window.activeConversation.messages]
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            messagesContainer.innerHTML = sortedMessages.map(msg => {
                const isSent = msg.sender_id === window.currentUser?.id;
                const sender = isSent ? window.currentUser : user;
                
                return `
                    <div class="message-item ${isSent ? 'sent' : 'received'}">
                        <div class="message-avatar">
                            <img src="${sender?.avatar || window.getDefaultAvatar()}" alt="Avatar" onerror="this.src='${window.getDefaultAvatar()}'">
                        </div>
                        <div class="message-content">
                            <div class="message-text">${window.escapeHtml(msg.content)}</div>
                            <div class="message-time">${window.getTimeAgo(new Date(msg.created_at))}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
};

window.sendMessage = async function(receiverId, content) {
    if (!window.currentUser) {
        window.showErrorMessage('You must be logged in to send messages');
        return;
    }
    
    if (!window.supabase) {
        window.showErrorMessage('Supabase is not available');
        return;
    }
    
    if (!content || !content.trim()) {
        window.showErrorMessage('Message cannot be empty');
        return;
    }
    
    const newMessage = {
        id: window.generateId(),
        sender_id: window.currentUser.id,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString()
    };
    
    try {
        const { error } = await window.supabase
            .from('messages')
            .insert([newMessage]);
        
        if (error) throw error;
        
        let conversation = window.conversations.find(c => c.user?.id === receiverId);
        
        if (!conversation) {
            const receiver = window.forumUsers.find(u => u.id === receiverId);
            if (receiver) {
                conversation = {
                    user: receiver,
                    messages: [],
                    lastMessage: newMessage,
                    unread: false
                };
                window.conversations.unshift(conversation);
            }
        }
        
        if (conversation) {
            conversation.messages.push(newMessage);
            conversation.lastMessage = newMessage;
            
            if (window.activeConversation?.user?.id === receiverId) {
                window.renderActiveConversation();
            }
        }
        
        window.renderConversations();
        
        const input = document.getElementById('message-input');
        if (input) input.value = '';
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        window.showErrorMessage('Failed to send message');
    }
};

window.subscribeToMessages = function() {
    if (!window.supabase || !window.currentUser) return;
    
    if (window.messagesSubscription) {
        window.messagesSubscription.unsubscribe();
    }
    
    window.messagesSubscription = window.supabase
        .channel('messages-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${window.currentUser.id}`
        }, async (payload) => {
            const newMessage = payload.new;
            const sender = window.getUserById(newMessage.sender_id) || {
                id: newMessage.sender_id,
                username: 'User',
                avatar: window.getDefaultAvatar(),
                post_count: 0
            };
            
            let conversation = window.conversations.find(c => c.user?.id === sender.id);
            
            if (!conversation) {
                conversation = {
                    user: sender,
                    messages: [],
                    lastMessage: newMessage,
                    unread: true
                };
                window.conversations.unshift(conversation);
            } else {
                conversation.messages.push(newMessage);
                conversation.lastMessage = newMessage;
                conversation.unread = true;
            }
            
            window.renderConversations();
            window.calculateUnreadCount();
            window.showNotification(`📬 New message from ${sender.username}`, 'info');
            
            if (window.activeConversation?.user?.id === sender.id) {
                window.renderActiveConversation();
            }
        })
        .subscribe();
};

window.calculateUnreadCount = function() {
    window.unreadCount = window.conversations.reduce((total, conv) => {
        return total + (conv.unread ? 1 : 0);
    }, 0);
    
    window.updateUnreadBadge();
};

window.openMessagesModal = function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    const modal = document.getElementById('messages-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        window.loadConversations();
        
        if (window.supabase) {
            window.subscribeToMessages();
        }
    }
};

window.closeMessagesModal = function() {
    const modal = document.getElementById('messages-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

window.openNewMessageModal = function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    const select = document.getElementById('message-recipient');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a user...</option>';
    
    window.forumUsers
        .filter(u => u.id !== window.currentUser.id)
        .forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.post_count || 0} posts)`;
            select.appendChild(option);
        });
    
    const modal = document.getElementById('new-message-modal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeNewMessageModal = function() {
    const modal = document.getElementById('new-message-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    const select = document.getElementById('message-recipient');
    const textarea = document.getElementById('new-message-content');
    if (select) select.value = '';
    if (textarea) textarea.value = '';
};

window.sendNewMessage = async function() {
    const receiverId = document.getElementById('message-recipient')?.value;
    const content = document.getElementById('new-message-content')?.value.trim();
    
    if (!receiverId) {
        window.showErrorMessage('Please select a recipient');
        return;
    }
    
    if (!content) {
        window.showErrorMessage('Please enter a message');
        return;
    }
    
    await window.sendMessage(receiverId, content);
    
    window.closeNewMessageModal();
    window.showSuccessMessage('Message sent!');
    
    window.openMessagesModal();
    
    setTimeout(() => {
        window.selectConversation(receiverId);
    }, 300);
};

// ============================================ //
// AUTH MODAL FUNCTIONS                        //
// ============================================ //

window.showLogin = function() {
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authSuccess = document.getElementById('auth-success');
    
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (authSuccess) authSuccess.classList.remove('active');
    
    const title = document.getElementById('auth-title');
    if (title) title.textContent = 'Login to Forum';
};

window.showRegister = function() {
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authSuccess = document.getElementById('auth-success');
    
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (loginForm) loginForm.classList.remove('active');
    if (registerForm) registerForm.classList.add('active');
    if (authSuccess) authSuccess.classList.remove('active');
    
    const title = document.getElementById('auth-title');
    if (title) title.textContent = 'Create Account';
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
};

// ============================================ //
// YIELD CALCULATOR                           //
// ============================================ //

window.loadSavedCalculations = function() {
    const saved = localStorage.getItem('forum_calculations');
    if (saved) {
        try {
            window.savedCalculations = JSON.parse(saved);
        } catch (e) {
            window.savedCalculations = [];
        }
    }
    window.renderSavedCalculations();
};

window.renderSavedCalculations = function() {
    const list = document.getElementById('saved-calculations-list');
    if (!list) return;
    
    if (window.savedCalculations.length === 0) {
        list.innerHTML = '<p class="no-calculations">No saved calculations yet.</p>';
        return;
    }
    
    list.innerHTML = window.savedCalculations
        .filter(calc => !window.currentUser || calc.userId === window.currentUser.id)
        .map(calc => {
            const date = new Date(calc.date);
            return `
                <div class="saved-calculation-item">
                    <div class="calculation-info">
                        <span class="calculation-yield">${calc.results.yield}g</span>
                        <span class="calculation-details">${calc.inputs.plantCount} plants • ${calc.inputs.lightWattage}W</span>
                        <span class="calculation-date">${date.toLocaleDateString()}</span>
                    </div>
                    <div class="calculation-actions">
                        <button class="btn-icon" onclick="window.loadCalculation('${calc.id}')" title="Load">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="btn-icon" onclick="window.deleteCalculation('${calc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
};

window.loadCalculation = function(calcId) {
    const calc = window.savedCalculations.find(c => c.id === calcId);
    if (calc) {
        document.getElementById('tent-size').value = calc.inputs.tentSize;
        document.getElementById('light-type').value = calc.inputs.lightType;
        document.getElementById('light-wattage').value = calc.inputs.lightWattage;
        document.getElementById('plant-count').value = calc.inputs.plantCount;
        document.getElementById('experience-level').value = calc.inputs.experienceLevel;
        document.getElementById('growing-medium').value = calc.inputs.growingMedium;
        
        window.calculateYield();
        window.showSuccessMessage('Calculation loaded!');
    }
};

window.deleteCalculation = function(calcId) {
    window.savedCalculations = window.savedCalculations.filter(c => c.id !== calcId);
    localStorage.setItem('forum_calculations', JSON.stringify(window.savedCalculations));
    window.renderSavedCalculations();
    window.showSuccessMessage('Calculation deleted!');
};

window.calculateYield = function() {
    const size = parseFloat(document.getElementById('tent-size')?.value) || 16;
    const wattage = parseFloat(document.getElementById('light-wattage')?.value) || 480;
    const plants = parseFloat(document.getElementById('plant-count')?.value) || 4;
    const exp = document.getElementById('experience-level')?.value || 'intermediate';
    const medium = document.getElementById('growing-medium')?.value || 'soil';
    const light = document.getElementById('light-type')?.value || 'led';
    
    let base = 35;
    
    if (light === 'led') base *= 1.2;
    if (light === 'cmh') base *= 1.1;
    if (light === 'fluorescent') base *= 0.6;
    if (exp === 'beginner') base *= 0.7;
    if (exp === 'expert') base *= 1.3;
    if (medium === 'coco') base *= 1.2;
    if (medium === 'hydro') base *= 1.3;
    if (medium === 'aeroponics') base *= 1.4;
    
    const total = Math.round(size * base);
    
    document.getElementById('estimated-yield').textContent = total;
    document.getElementById('yield-per-plant').textContent = Math.round(total / plants);
    document.getElementById('yield-per-watt').textContent = (total / wattage).toFixed(2);
    
    if (medium === 'soil') {
        document.getElementById('veg-time').textContent = '4-6';
        document.getElementById('flower-time').textContent = '8-10';
        document.getElementById('total-time').textContent = '12-16';
    } else if (medium === 'coco') {
        document.getElementById('veg-time').textContent = '3-5';
        document.getElementById('flower-time').textContent = '8-10';
        document.getElementById('total-time').textContent = '11-15';
    } else {
        document.getElementById('veg-time').textContent = '2-4';
        document.getElementById('flower-time').textContent = '8-10';
        document.getElementById('total-time').textContent = '10-14';
    }
};

window.saveCalculation = function() {
    if (!window.currentUser) {
        window.showLogin();
        return;
    }
    
    const calculation = {
        id: window.generateId(),
        userId: window.currentUser.id,
        date: new Date().toISOString(),
        inputs: {
            tentSize: document.getElementById('tent-size').value,
            lightType: document.getElementById('light-type').value,
            lightWattage: document.getElementById('light-wattage').value,
            plantCount: document.getElementById('plant-count').value,
            experienceLevel: document.getElementById('experience-level').value,
            growingMedium: document.getElementById('growing-medium').value
        },
        results: {
            yield: document.getElementById('estimated-yield').textContent,
            yieldPerPlant: document.getElementById('yield-per-plant').textContent,
            yieldPerWatt: document.getElementById('yield-per-watt').textContent
        }
    };
    
    window.savedCalculations.unshift(calculation);
    localStorage.setItem('forum_calculations', JSON.stringify(window.savedCalculations));
    window.renderSavedCalculations();
    window.showSuccessMessage('Calculation saved!');
};

// ============================================ //
// THEME TOGGLE                                //
// ============================================ //

window.initTheme = function() {
    const savedTheme = localStorage.getItem('forum_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
};

window.toggleTheme = function() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('forum_theme', next);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) icon.className = next === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    window.showSuccessMessage(`${next === 'dark' ? '🌙' : '☀️'} mode activated!`);
};

// ============================================ //
// INITIALIZE EVERYTHING                       //
// ============================================ //

window.initializeForum = async function() {
    console.log('🚀 Initializing forum - SUPABASE ONLY MODE WITH STATS...');
    
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        window.showErrorMessage('Supabase connection failed. Please check your connection.');
        return;
    }
    
    window.initTheme();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', window.toggleTheme);
    }
    
    // Load users and posts from Supabase
    await window.loadUsersFromSupabase();
    await window.checkUser();
    await window.loadPostsFromSupabase();
    await window.updateForumStats();
    window.filterPosts();
    window.loadSavedCalculations();
    
    // Calculator listeners
    document.getElementById('calculate-yield-btn')?.addEventListener('click', window.calculateYield);
    document.getElementById('save-calculator-results')?.addEventListener('click', window.saveCalculation);
    
    // Calculator modal
    document.getElementById('calculator-nav')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('yield-calculator-modal')?.classList.add('active');
        document.body.style.overflow = 'hidden';
        window.calculateYield();
    });
    
    document.querySelector('.yield-calculator-close')?.addEventListener('click', function() {
        document.getElementById('yield-calculator-modal')?.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Chat listeners
    document.getElementById('messages-btn')?.addEventListener('click', window.openMessagesModal);
    document.querySelector('.messages-modal-close')?.addEventListener('click', window.closeMessagesModal);
    
    document.getElementById('new-message-btn')?.addEventListener('click', window.openNewMessageModal);
    document.querySelector('.new-message-modal-close')?.addEventListener('click', window.closeNewMessageModal);
    document.getElementById('cancel-new-message')?.addEventListener('click', window.closeNewMessageModal);
    document.getElementById('send-new-message')?.addEventListener('click', window.sendNewMessage);
    
    document.getElementById('send-message-btn')?.addEventListener('click', function() {
        if (window.activeConversation?.user?.id) {
            const input = document.getElementById('message-input');
            window.sendMessage(window.activeConversation.user.id, input?.value);
        }
    });
    
    document.getElementById('message-input')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (window.activeConversation?.user?.id) {
                window.sendMessage(window.activeConversation.user.id, this.value);
            }
        }
    });
    
    // Profile listeners
    document.getElementById('profile-btn')?.addEventListener('click', window.openProfileModal);
    document.getElementById('user-avatar-clickable')?.addEventListener('click', window.openProfileModal);
    document.getElementById('username-display')?.addEventListener('click', window.openProfileModal);
    document.querySelector('.profile-modal-close')?.addEventListener('click', window.closeProfileModal);
    document.getElementById('cancel-profile')?.addEventListener('click', window.closeProfileModal);
    document.getElementById('save-profile')?.addEventListener('click', window.saveProfile);
    document.getElementById('avatar-upload')?.addEventListener('change', window.handleAvatarUpload);
    document.getElementById('remove-avatar')?.addEventListener('click', window.handleRemoveAvatar);
    
    // Auth listeners
    document.getElementById('open-login')?.addEventListener('click', (e) => { e.preventDefault(); window.showLogin(); });
    document.getElementById('open-register')?.addEventListener('click', (e) => { e.preventDefault(); window.showRegister(); });
    document.querySelector('.auth-close')?.addEventListener('click', window.closeAuthModal);
    document.getElementById('show-register')?.addEventListener('click', window.showRegister);
    document.getElementById('show-login')?.addEventListener('click', window.showLogin);
    document.getElementById('login-btn')?.addEventListener('click', window.handleLogin);
    document.getElementById('register-btn')?.addEventListener('click', window.handleRegister);
    document.getElementById('continue-btn')?.addEventListener('click', window.closeAuthModal);
    document.getElementById('logout-btn')?.addEventListener('click', window.handleLogout);
    
    // Create post listeners
    document.getElementById('create-post-btn')?.addEventListener('click', window.showCreatePostModal);
    document.querySelector('.create-post-close')?.addEventListener('click', window.closeCreatePostModal);
    document.getElementById('cancel-post')?.addEventListener('click', window.closeCreatePostModal);
    document.getElementById('submit-post')?.addEventListener('click', window.handleCreatePost);
    
    // Search
    document.getElementById('forum-search')?.addEventListener('input', function() {
        window.currentSearch = this.value.toLowerCase();
        window.filterPosts();
    });
    
    // Category links
    document.querySelectorAll('.category-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.currentCategory = this.dataset.category || 'all';
            document.querySelectorAll('.category-list a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            window.filterPosts();
        });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-options .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            window.currentFilter = this.dataset.filter || 'newest';
            document.querySelectorAll('.filter-options .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.filterPosts();
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('auth-modal')) window.closeAuthModal();
        if (e.target === document.getElementById('create-post-modal')) window.closeCreatePostModal();
        if (e.target === document.getElementById('profile-modal')) window.closeProfileModal();
        if (e.target === document.getElementById('messages-modal')) window.closeMessagesModal();
        if (e.target === document.getElementById('new-message-modal')) window.closeNewMessageModal();
        if (e.target === document.getElementById('yield-calculator-modal')) {
            document.getElementById('yield-calculator-modal')?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    window.updateUnreadBadge();
    
    console.log('✅ Forum initialized - SUPABASE ONLY MODE WITH STATS');
    console.log('👤 Current user:', window.currentUser?.username || 'Not logged in');
    console.log('👑 Admin:', window.isAdmin() ? 'YES' : 'NO');
    console.log('📊 Stats: Updating from Supabase...');
};

// ============================================ //
// START THE FORUM                             //
// ============================================ //

document.addEventListener('DOMContentLoaded', window.initializeForum);

// ============================================ //
// PASSWORD RESET FUNCTIONS                       //
// ============================================ //

// Password reset modal elements
const resetPasswordModal = document.getElementById('reset-password-modal');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const resetClose = document.querySelector('.reset-password-close');
const backToLogin = document.getElementById('back-to-login');
const sendResetLink = document.getElementById('send-reset-link');
const resetForm = document.getElementById('reset-form');
const resetSuccess = document.getElementById('reset-success');
const resetContinue = document.getElementById('reset-continue');

// Open reset password modal
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (resetPasswordModal) {
            // Hide any open auth modal
            const authModalElem = document.getElementById('auth-modal');
            if (authModalElem) authModalElem.classList.remove('active');
            
            // Show reset modal
            resetPasswordModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset to form view
            if (resetForm) resetForm.style.display = 'block';
            if (resetSuccess) resetSuccess.style.display = 'none';
            const emailInput = document.getElementById('reset-email');
            if (emailInput) emailInput.value = '';
        }
    });
}

// Close reset modal
if (resetClose) {
    resetClose.addEventListener('click', () => {
        resetPasswordModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

// Back to login from reset modal
if (backToLogin) {
    backToLogin.addEventListener('click', () => {
        resetPasswordModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        // Reopen login modal
        const authModalElem = document.getElementById('auth-modal');
        if (authModalElem) {
            authModalElem.classList.add('active');
        }
    });
}

// Continue from success screen
if (resetContinue) {
    resetContinue.addEventListener('click', () => {
        resetPasswordModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        const authModalElem = document.getElementById('auth-modal');
        if (authModalElem) {
            authModalElem.classList.add('active');
        }
    });
}

// Send reset link
if (sendResetLink) {
    sendResetLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reset-email')?.value.trim();
        
        if (!email) {
            window.showErrorMessage('Please enter your email address');
            return;
        }
        
        // Disable button to prevent multiple clicks
        sendResetLink.disabled = true;
        sendResetLink.textContent = 'Sending...';
        
        try {
            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`,
            });
            
            if (error) throw error;
            
            // Show success message
            if (resetForm) resetForm.style.display = 'none';
            if (resetSuccess) resetSuccess.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Password reset error:', error);
            window.showErrorMessage(error.message || 'Failed to send reset link');
            
            // Re-enable button
            sendResetLink.disabled = false;
            sendResetLink.textContent = 'Send Reset Link';
        }
    });
}

// Close modal on outside click
if (resetPasswordModal) {
    resetPasswordModal.addEventListener('click', (e) => {
        if (e.target === resetPasswordModal) {
            resetPasswordModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// ============================================ //
// SIMPLE EMOJI PICKER - GUARANTEED TO WORK    //
// ============================================ //

// Simple emoji list (popular ones)
const simpleEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
    '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤',
    '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
    '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
    '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
    '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
    '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕',
    '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩',
    '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺',
    '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏',
    '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
    '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
    '👁', '👅', '👄', '💋', '🩸'
];

// Store active pickers
let activeEmojiPickerSimple = null;

// Function to add emoji picker to any input
function addSimpleEmojiPicker(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Don't add twice
    if (document.getElementById(`emoji-simple-${inputId}`)) return;
    
    console.log(`Adding simple emoji picker to: ${inputId}`);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'input-emoji-container';
    container.id = `emoji-container-${inputId}`;
    
    // Wrap the input
    input.parentNode.insertBefore(container, input);
    container.appendChild(input);
    
    // Create emoji button
    const btn = document.createElement('button');
    btn.id = `emoji-simple-${inputId}`;
    btn.className = 'emoji-btn';
    btn.type = 'button';
    btn.innerHTML = '😊';
    btn.title = 'Add emoji';
    container.appendChild(btn);
    
    // Create emoji picker
    const picker = document.createElement('div');
    picker.id = `emoji-picker-simple-${inputId}`;
    picker.className = 'emoji-picker-simple';
    
    // Add emojis to picker
    const grid = document.createElement('div');
    grid.className = 'emoji-grid-simple';
    
    simpleEmojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Insert emoji at cursor position
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            input.value = value.substring(0, start) + emoji + value.substring(end);
            
            // Move cursor
            input.selectionStart = input.selectionEnd = start + emoji.length;
            
            // Trigger input event
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Hide picker
            picker.classList.remove('active');
            activeEmojiPickerSimple = null;
        };
        grid.appendChild(span);
    });
    
    picker.appendChild(grid);
    container.appendChild(picker);
    
    // Toggle picker on button click
    btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Emoji button clicked for:', inputId);
        
        // Close any other open picker
        if (activeEmojiPickerSimple && activeEmojiPickerSimple !== picker) {
            activeEmojiPickerSimple.classList.remove('active');
        }
        
        // Toggle this picker
        picker.classList.toggle('active');
        activeEmojiPickerSimple = picker.classList.contains('active') ? picker : null;
    };
    
    // Close picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
            picker.classList.remove('active');
            if (activeEmojiPickerSimple === picker) {
                activeEmojiPickerSimple = null;
            }
        }
    });
}

// Initialize emoji pickers
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Setting up simple emoji pickers...');
    
    // Function to check and add emoji pickers
    function checkAndAddEmojiPickers() {
        // Profile bio
        if (document.getElementById('profile-bio') && !document.getElementById('emoji-container-profile-bio')) {
            addSimpleEmojiPicker('profile-bio');
        }
        
        // Message input
        if (document.getElementById('message-input') && !document.getElementById('emoji-container-message-input')) {
            addSimpleEmojiPicker('message-input');
        }
        
        // New message content
        if (document.getElementById('new-message-content') && !document.getElementById('emoji-container-new-message-content')) {
            addSimpleEmojiPicker('new-message-content');
        }
        
        // Post content
        if (document.getElementById('post-content') && !document.getElementById('emoji-container-post-content')) {
            addSimpleEmojiPicker('post-content');
        }
    }
    
    // Check every second for new inputs
    setInterval(checkAndAddEmojiPickers, 1000);
});

// Override showPostDetailModal to add emoji to comment inputs
const originalShowPostDetailModalSimple = window.showPostDetailModal;
window.showPostDetailModal = function(post, user, badge, comments, categoryNames) {
    originalShowPostDetailModalSimple(post, user, badge, comments, categoryNames);
    
    setTimeout(() => {
        const commentInput = document.getElementById(`comment-input-${post.id}`);
        if (commentInput && !document.getElementById(`emoji-container-comment-input-${post.id}`)) {
            addSimpleEmojiPicker(`comment-input-${post.id}`);
        }
    }, 500);
};

// Override openMessagesModal
const originalOpenMessagesModalSimple = window.openMessagesModal;
window.openMessagesModal = function() {
    originalOpenMessagesModalSimple();
    setTimeout(() => {
        if (document.getElementById('message-input') && !document.getElementById('emoji-container-message-input')) {
            addSimpleEmojiPicker('message-input');
        }
    }, 500);
};

// Override openNewMessageModal
const originalOpenNewMessageModalSimple = window.openNewMessageModal;
window.openNewMessageModal = function() {
    originalOpenNewMessageModalSimple();
    setTimeout(() => {
        if (document.getElementById('new-message-content') && !document.getElementById('emoji-container-new-message-content')) {
            addSimpleEmojiPicker('new-message-content');
        }
    }, 300);
};