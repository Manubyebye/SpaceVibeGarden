// ============================================ //
// SPACE VIBE GARDEN FORUM - COMPLETE SCRIPT    //
// FIXED: Admin Controls + Comment Avatars      //
// ============================================ //

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌿 Space Vibe Garden Forum - Loading...');
    
    // ============================================ //
    // INITIALIZE SUPABASE                         //
    // ============================================ //
    
    let supabase = null;
    let supabaseAvailable = false;
    
    try {
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
    
    // ============================================ //
    // STATE MANAGEMENT                            //
    // ============================================ //
    
    let currentUser = null;
    let forumPosts = [];
    let forumUsers = [];
    let currentFilter = 'newest';
    let currentCategory = 'all';
    let currentSearch = '';
    
    // Messages state
    let conversations = [];
    let activeConversation = null;
    let messagesSubscription = null;
    let unreadCount = 0;
    
    // Calculator state
    let savedCalculations = [];
    
    // ============================================ //
    // DOM ELEMENTS                                //
    // ============================================ //
    
    // Auth elements
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
    
    // User elements
    const userWelcome = document.getElementById('user-welcome');
    const loggedInUser = document.getElementById('logged-in-user');
    const usernameDisplay = document.getElementById('username-display');
    const usernameText = document.getElementById('username-text');
    const userBadgeDisplay = document.getElementById('user-badge-display');
    const logoutBtn = document.getElementById('logout-btn');
    const createPostBtn = document.getElementById('create-post-btn');
    
    // Post elements
    const createPostModal = document.getElementById('create-post-modal');
    const createPostClose = document.querySelector('.create-post-close');
    const cancelPostBtn = document.getElementById('cancel-post');
    const submitPostBtn = document.getElementById('submit-post');
    const postTitleInput = document.getElementById('post-title');
    const postCategorySelect = document.getElementById('post-category');
    const postContentInput = document.getElementById('post-content');
    const postTagsInput = document.getElementById('post-tags');
    const postImageInput = document.getElementById('post-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    // Forum elements
    const postsContainer = document.getElementById('posts-container');
    const emptyState = document.getElementById('empty-state');
    const loadMoreContainer = document.querySelector('.load-more-container');
    const loadMorePostsBtn = document.getElementById('load-more-posts');
    const categoryLinks = document.querySelectorAll('.category-list a');
    const filterButtons = document.querySelectorAll('.filter-options .filter-btn');
    const forumSearch = document.getElementById('forum-search');
    
    // Stats elements
    const totalPostsElement = document.getElementById('total-posts');
    const totalUsersElement = document.getElementById('total-users');
    const totalCommentsElement = document.getElementById('total-comments');
    const totalMessagesElement = document.getElementById('total-messages');
    
    // ============================================ //
    // DARK MODE TOGGLE                            //
    // ============================================ //
    
    const themeToggle = document.getElementById('theme-toggle');
    
    function initTheme() {
        const savedTheme = localStorage.getItem('forum_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('forum_theme', newTheme);
        
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
        
        showSuccessMessage(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme} mode activated!`);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // ============================================ //
    // ADMIN CHECK - FIXED: MAKE YOURSELF ADMIN     //
    // ============================================ //
    
    function isAdmin() {
        if (!currentUser) return false;
        // ✅ SET YOUR ADMIN EMAIL HERE - CHANGE THIS TO YOUR EMAIL!
        const adminEmails = ['admin@spacevibe.com', 'manueljp1985@gmail.com'];
        return adminEmails.includes(currentUser.email) || currentUser.username === 'SpaceGardener';
    }
    
    // ============================================ //
    // ADMIN MODAL FOR DELETE/CONFIRMATION         //
    // ============================================ //
    
    function showDeleteConfirmModal(itemType, itemId, callback) {
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
    }
    
    // ============================================ //
    // ADMIN POST FUNCTIONS                        //
    // ============================================ //
    
    function addAdminControlsToPost(postElement, postId) {
        if (!isAdmin()) return;
        
        const postHeader = postElement.querySelector('.post-header');
        if (!postHeader) return;
        
        // Check if controls already exist
        if (postElement.querySelector('.admin-controls')) return;
        
        const adminControls = document.createElement('div');
        adminControls.className = 'admin-controls';
        adminControls.innerHTML = `
            <button class="admin-btn edit-btn" data-post-id="${postId}" title="Edit Post">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="admin-btn delete-btn" data-post-id="${postId}" title="Delete Post">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button class="admin-btn pin-btn" data-post-id="${postId}" title="Pin Post">
                <i class="fas fa-thumbtack"></i> Pin
            </button>
        `;
        
        postHeader.appendChild(adminControls);
        
        // Edit button
        adminControls.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showEditPostModal(postId);
        });
        
        // Delete button
        adminControls.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmModal('post', postId, () => {
                deletePost(postId);
            });
        });
        
        // Pin button
        adminControls.querySelector('.pin-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePinPost(postId);
        });
    }
    
    function showEditPostModal(postId) {
        const post = forumPosts.find(p => p.id === postId);
        if (!post) return;
        
        const modal = document.createElement('div');
        modal.className = 'edit-post-modal active';
        modal.innerHTML = `
            <div class="edit-post-content">
                <div class="edit-post-header">
                    <h2><i class="fas fa-edit"></i> Edit Post</h2>
                    <button class="edit-post-close">&times;</button>
                </div>
                <div class="edit-post-body">
                    <div class="form-group">
                        <input type="text" id="edit-post-title" value="${escapeHtml(post.title)}" placeholder="Post Title" required>
                    </div>
                    <div class="form-group">
                        <select id="edit-post-category">
                            <option value="germination" ${post.category === 'germination' ? 'selected' : ''}>Germination</option>
                            <option value="vegetative" ${post.category === 'vegetative' ? 'selected' : ''}>Vegetative</option>
                            <option value="flowering" ${post.category === 'flowering' ? 'selected' : ''}>Flowering</option>
                            <option value="harvest" ${post.category === 'harvest' ? 'selected' : ''}>Harvest</option>
                            <option value="equipment" ${post.category === 'equipment' ? 'selected' : ''}>Equipment</option>
                            <option value="problems" ${post.category === 'problems' ? 'selected' : ''}>Problems</option>
                            <option value="strains" ${post.category === 'strains' ? 'selected' : ''}>Strains</option>
                            <option value="general" ${post.category === 'general' ? 'selected' : ''}>General</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <textarea id="edit-post-content" placeholder="Content..." rows="8" required>${escapeHtml(post.content)}</textarea>
                    </div>
                    <div class="form-group">
                        <input type="text" id="edit-post-tags" value="${post.tags ? post.tags.join(', ') : ''}" placeholder="Tags (comma separated)">
                    </div>
                    <div class="edit-post-actions">
                        <button class="btn-secondary cancel-edit">Cancel</button>
                        <button class="btn-primary save-edit">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        };
        
        modal.querySelector('.edit-post-close').addEventListener('click', closeModal);
        modal.querySelector('.cancel-edit').addEventListener('click', closeModal);
        
        modal.querySelector('.save-edit').addEventListener('click', async () => {
            const updatedTitle = document.getElementById('edit-post-title').value.trim();
            const updatedCategory = document.getElementById('edit-post-category').value;
            const updatedContent = document.getElementById('edit-post-content').value.trim();
            const updatedTags = document.getElementById('edit-post-tags').value.split(',').map(t => t.trim()).filter(t => t);
            
            if (!updatedTitle || !updatedCategory || !updatedContent) {
                showErrorMessage('Please fill in all required fields');
                return;
            }
            
            await updatePost(postId, {
                title: updatedTitle,
                category: updatedCategory,
                content: updatedContent,
                tags: updatedTags,
                updated_at: new Date().toISOString()
            });
            
            closeModal();
            showSuccessMessage('Post updated successfully!');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    async function updatePost(postId, updatedData) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        forumPosts[postIndex] = { ...forumPosts[postIndex], ...updatedData };
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        if (supabaseAvailable && supabase) {
            try {
                await supabase
                    .from('posts')
                    .update(updatedData)
                    .eq('id', postId);
            } catch (error) {
                console.log('Supabase update failed:', error);
            }
        }
        
        filterPosts();
    }
    
    async function deletePost(postId) {
        forumPosts = forumPosts.filter(p => p.id !== postId);
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        if (supabaseAvailable && supabase) {
            try {
                await supabase
                    .from('posts')
                    .delete()
                    .eq('id', postId);
            } catch (error) {
                console.log('Supabase delete failed:', error);
            }
        }
        
        filterPosts();
        updateForumStats();
        showSuccessMessage('Post deleted successfully!');
    }
    
    async function togglePinPost(postId) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        forumPosts[postIndex].pinned = !forumPosts[postIndex].pinned;
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        if (supabaseAvailable && supabase) {
            try {
                await supabase
                    .from('posts')
                    .update({ pinned: forumPosts[postIndex].pinned })
                    .eq('id', postId);
            } catch (error) {
                console.log('Supabase pin toggle failed:', error);
            }
        }
        
        filterPosts();
        showSuccessMessage(forumPosts[postIndex].pinned ? 'Post pinned!' : 'Post unpinned!');
    }
    
    // ============================================ //
    // ADMIN COMMENT FUNCTIONS                     //
    // ============================================ //
    
    function addAdminControlsToComment(commentElement, postId, commentId) {
        if (!isAdmin()) return;
        
        const commentActions = commentElement.querySelector('.comment-actions');
        if (!commentActions) return;
        
        // Check if controls already exist
        if (commentElement.querySelector('.admin-btn')) return;
        
        const adminEditBtn = document.createElement('button');
        adminEditBtn.className = 'comment-action-btn edit-btn';
        adminEditBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        adminEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditCommentModal(postId, commentId);
        });
        
        const adminDeleteBtn = document.createElement('button');
        adminDeleteBtn.className = 'comment-action-btn delete-btn';
        adminDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        adminDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmModal('comment', commentId, () => {
                deleteComment(postId, commentId);
            });
        });
        
        commentActions.appendChild(adminEditBtn);
        commentActions.appendChild(adminDeleteBtn);
    }
    
    function showEditCommentModal(postId, commentId) {
        const post = forumPosts.find(p => p.id === postId);
        if (!post || !post.comments) return;
        
        const comment = post.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const modal = document.createElement('div');
        modal.className = 'edit-post-modal active';
        modal.innerHTML = `
            <div class="edit-post-content">
                <div class="edit-post-header">
                    <h2><i class="fas fa-edit"></i> Edit Comment</h2>
                    <button class="edit-post-close">&times;</button>
                </div>
                <div class="edit-post-body">
                    <div class="form-group">
                        <textarea id="edit-comment-content" placeholder="Edit comment..." rows="5" required>${escapeHtml(comment.content)}</textarea>
                    </div>
                    <div class="edit-post-actions">
                        <button class="btn-secondary cancel-edit">Cancel</button>
                        <button class="btn-primary save-edit">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        };
        
        modal.querySelector('.edit-post-close').addEventListener('click', closeModal);
        modal.querySelector('.cancel-edit').addEventListener('click', closeModal);
        
        modal.querySelector('.save-edit').addEventListener('click', async () => {
            const updatedContent = document.getElementById('edit-comment-content').value.trim();
            
            if (!updatedContent) {
                showErrorMessage('Comment cannot be empty');
                return;
            }
            
            await updateComment(postId, commentId, updatedContent);
            closeModal();
            showSuccessMessage('Comment updated successfully!');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    async function updateComment(postId, commentId, newContent) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        if (!post.comments) return;
        
        const commentIndex = post.comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) return;
        
        post.comments[commentIndex].content = newContent;
        post.comments[commentIndex].edited_at = new Date().toISOString();
        
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        if (supabaseAvailable && supabase) {
            try {
                await supabase
                    .from('comments')
                    .update({ content: newContent, edited_at: new Date().toISOString() })
                    .eq('id', commentId);
            } catch (error) {
                console.log('Supabase comment update failed:', error);
            }
        }
    }
    
    async function deleteComment(postId, commentId) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        if (post.comments) {
            post.comments = post.comments.filter(c => c.id !== commentId);
            localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        }
        
        if (supabaseAvailable && supabase) {
            try {
                await supabase
                    .from('comments')
                    .delete()
                    .eq('id', commentId);
            } catch (error) {
                console.log('Supabase comment delete failed:', error);
            }
        }
        
        showSuccessMessage('Comment deleted successfully!');
        
        // Refresh the post detail view if open
        const detailModal = document.getElementById('post-detail-modal-custom');
        if (detailModal) {
            viewPostDetails(postId);
        }
    }
    
    // ============================================ //
    // POST IMAGES - FEATURE 1                     //
    // ============================================ //
    
    let selectedImages = [];
    
    if (postImageInput) {
        postImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    showErrorMessage('Image too large. Max 5MB.');
                    return;
                }
                
                if (!file.type.startsWith('image/')) {
                    showErrorMessage('Please upload an image file.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImages.push({
                        file: file,
                        data: event.target.result,
                        name: file.name
                    });
                    renderImagePreviews();
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    function renderImagePreviews() {
        if (!imagePreviewContainer) return;
        
        imagePreviewContainer.innerHTML = '';
        
        selectedImages.forEach((image, index) => {
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
                selectedImages.splice(index, 1);
                renderImagePreviews();
            });
            
            imagePreviewContainer.appendChild(preview);
        });
    }
    
    function createImageGallery(images) {
        if (!images || images.length === 0) return '';
        
        let galleryHtml = '<div class="post-images">';
        images.forEach((image, index) => {
            galleryHtml += `
                <div class="post-image" onclick="openLightbox('${image}')">
                    <img src="${image}" alt="Post image ${index + 1}" loading="lazy">
                </div>
            `;
        });
        galleryHtml += '</div>';
        
        return galleryHtml;
    }
    
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
    // USER BADGES - FIXED: LEGEND BADGE!          //
    // ============================================ //
    
    function getUserBadge(postCount) {
        if (postCount >= 100) {
            return { name: 'Legend', icon: '👑', class: 'badge-legend' };
        } else if (postCount >= 50) {
            return { name: 'Master', icon: '🍃', class: 'badge-master' };
        } else if (postCount >= 10) {
            return { name: 'Grower', icon: '🌿', class: 'badge-grower' };
        } else if (postCount >= 1) {
            return { name: 'Seedling', icon: '🌱', class: 'badge-seedling' };
        } else {
            return { name: 'Seedling', icon: '🌱', class: 'badge-seedling' };
        }
    }
    
    function getNextRank(currentCount) {
        if (currentCount >= 100) return null;
        if (currentCount >= 50) return { name: 'Legend', needed: 100 - currentCount };
        if (currentCount >= 10) return { name: 'Master', needed: 50 - currentCount };
        if (currentCount >= 1) return { name: 'Grower', needed: 10 - currentCount };
        return { name: 'Grower', needed: 10 - currentCount };
    }
    
    function getRankProgress(currentCount) {
        if (currentCount >= 100) return 100;
        if (currentCount >= 50) return ((currentCount - 50) / 50) * 100;
        if (currentCount >= 10) return ((currentCount - 10) / 40) * 100;
        return (currentCount / 10) * 100;
    }
    
    function renderBadge(postCount) {
        const badge = getUserBadge(postCount);
        return `<span class="user-badge ${badge.class}">${badge.icon} ${badge.name}</span>`;
    }
    
    // ============================================ //
    // PROFILE MODAL ELEMENTS                      //
    // ============================================ //
    
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.querySelector('.profile-modal-close');
    const profileBtn = document.getElementById('profile-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileBio = document.getElementById('profile-bio');
    const profileLocation = document.getElementById('profile-location');
    const profilePostCount = document.getElementById('profile-post-count');
    const profileCommentCount = document.getElementById('profile-comment-count');
    const profileJoinDate = document.getElementById('profile-join-date');
    const saveProfileBtn = document.getElementById('save-profile');
    const cancelProfileBtn = document.getElementById('cancel-profile');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    
    // Badge elements
    const badgeIcon = document.getElementById('badge-icon');
    const badgeName = document.getElementById('badge-name');
    const nextRank = document.getElementById('next-rank');
    const rankProgress = document.getElementById('rank-progress');
    const currentPosts = document.getElementById('current-posts');
    const postsNeeded = document.getElementById('posts-needed');
    
    // ============================================ //
    // MESSAGING SYSTEM                            //
    // ============================================ //
    
    const messagesModal = document.getElementById('messages-modal');
    const messagesToggle = document.getElementById('messages-toggle');
    const messagesBtn = document.getElementById('messages-btn');
    const messagesClose = document.querySelector('.messages-modal-close');
    const unreadBadge = document.getElementById('unread-badge');
    const navUnreadBadge = document.getElementById('nav-unread-badge');
    const conversationsContainer = document.getElementById('conversations-container');
    const messagesContainer = document.getElementById('messages-container');
    const activeConversationHeader = document.getElementById('active-conversation-header');
    const conversationUsername = document.getElementById('conversation-username');
    const conversationAvatar = document.getElementById('conversation-avatar');
    const conversationBadge = document.getElementById('conversation-badge');
    const messageInputContainer = document.getElementById('message-input-container');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    
    const newMessageModal = document.getElementById('new-message-modal');
    const newMessageBtn = document.getElementById('new-message-btn');
    const newMessageClose = document.querySelector('.new-message-modal-close');
    const cancelNewMessage = document.getElementById('cancel-new-message');
    const sendNewMessage = document.getElementById('send-new-message');
    const messageRecipient = document.getElementById('message-recipient');
    const newMessageContent = document.getElementById('new-message-content');
    
    // ============================================ //
    // YIELD CALCULATOR                            //
    // ============================================ //
    
    const calculatorModal = document.getElementById('yield-calculator-modal');
    const calculatorNav = document.getElementById('calculator-nav');
    const footerCalculator = document.getElementById('footer-calculator');
    const calculatorClose = document.querySelector('.yield-calculator-close');
    
    const tentSize = document.getElementById('tent-size');
    const lightType = document.getElementById('light-type');
    const lightWattage = document.getElementById('light-wattage');
    const plantCount = document.getElementById('plant-count');
    const experienceLevel = document.getElementById('experience-level');
    const growingMedium = document.getElementById('growing-medium');
    
    const estimatedYield = document.getElementById('estimated-yield');
    const yieldPerPlant = document.getElementById('yield-per-plant');
    const yieldPerWatt = document.getElementById('yield-per-watt');
    const vegTime = document.getElementById('veg-time');
    const flowerTime = document.getElementById('flower-time');
    const totalTime = document.getElementById('total-time');
    
    const calculateBtn = document.getElementById('calculate-yield-btn');
    const saveCalculationBtn = document.getElementById('save-calculator-results');
    const savedCalculationsList = document.getElementById('saved-calculations-list');
    
    function loadSavedCalculations() {
        const saved = localStorage.getItem('forum_calculations');
        if (saved) {
            savedCalculations = JSON.parse(saved);
            renderSavedCalculations();
        }
    }
    
    function saveCalculation() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        const calculation = {
            id: generateId(),
            userId: currentUser.id,
            date: new Date().toISOString(),
            inputs: {
                tentSize: tentSize.value,
                lightType: lightType.value,
                lightWattage: lightWattage.value,
                plantCount: plantCount.value,
                experienceLevel: experienceLevel.value,
                growingMedium: growingMedium.value
            },
            results: {
                yield: estimatedYield.textContent,
                yieldPerPlant: yieldPerPlant.textContent,
                yieldPerWatt: yieldPerWatt.textContent
            }
        };
        
        savedCalculations.unshift(calculation);
        localStorage.setItem('forum_calculations', JSON.stringify(savedCalculations));
        renderSavedCalculations();
        showSuccessMessage('Calculation saved!');
    }
    
    function renderSavedCalculations() {
        if (!savedCalculationsList) return;
        
        if (savedCalculations.length === 0) {
            savedCalculationsList.innerHTML = '<p class="no-calculations">No saved calculations yet.</p>';
            return;
        }
        
        savedCalculationsList.innerHTML = savedCalculations
            .filter(calc => !currentUser || calc.userId === currentUser.id)
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
                            <button class="btn-icon" onclick="loadCalculation('${calc.id}')" title="Load">
                                <i class="fas fa-folder-open"></i>
                            </button>
                            <button class="btn-icon" onclick="deleteCalculation('${calc.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
    }
    
    window.loadCalculation = function(calcId) {
        const calc = savedCalculations.find(c => c.id === calcId);
        if (calc) {
            tentSize.value = calc.inputs.tentSize;
            lightType.value = calc.inputs.lightType;
            lightWattage.value = calc.inputs.lightWattage;
            plantCount.value = calc.inputs.plantCount;
            experienceLevel.value = calc.inputs.experienceLevel;
            growingMedium.value = calc.inputs.growingMedium;
            
            calculateYield();
            showSuccessMessage('Calculation loaded!');
        }
    };
    
    window.deleteCalculation = function(calcId) {
        savedCalculations = savedCalculations.filter(c => c.id !== calcId);
        localStorage.setItem('forum_calculations', JSON.stringify(savedCalculations));
        renderSavedCalculations();
        showSuccessMessage('Calculation deleted!');
    };
    
    function calculateYield() {
        const size = parseFloat(tentSize.value) || 16;
        const wattage = parseFloat(lightWattage.value) || 480;
        const plants = parseFloat(plantCount.value) || 4;
        const exp = experienceLevel.value;
        const medium = growingMedium.value;
        const light = lightType.value;
        
        let baseYieldPerSqFt = 35;
        
        if (light === 'led') baseYieldPerSqFt *= 1.2;
        if (light === 'hps') baseYieldPerSqFt *= 1.0;
        if (light === 'cmh') baseYieldPerSqFt *= 1.1;
        if (light === 'fluorescent') baseYieldPerSqFt *= 0.6;
        
        if (exp === 'beginner') baseYieldPerSqFt *= 0.7;
        if (exp === 'intermediate') baseYieldPerSqFt *= 1.0;
        if (exp === 'expert') baseYieldPerSqFt *= 1.3;
        
        if (medium === 'soil') baseYieldPerSqFt *= 1.0;
        if (medium === 'coco') baseYieldPerSqFt *= 1.2;
        if (medium === 'hydro') baseYieldPerSqFt *= 1.3;
        if (medium === 'aeroponics') baseYieldPerSqFt *= 1.4;
        
        const totalYield = Math.round(size * baseYieldPerSqFt);
        const perPlant = Math.round(totalYield / plants);
        const perWatt = (totalYield / wattage).toFixed(2);
        
        estimatedYield.textContent = totalYield;
        yieldPerPlant.textContent = perPlant;
        yieldPerWatt.textContent = perWatt;
        
        if (medium === 'soil') {
            vegTime.textContent = '4-6';
            flowerTime.textContent = '8-10';
            totalTime.textContent = '12-16';
        } else if (medium === 'coco') {
            vegTime.textContent = '3-5';
            flowerTime.textContent = '8-10';
            totalTime.textContent = '11-15';
        } else {
            vegTime.textContent = '2-4';
            flowerTime.textContent = '8-10';
            totalTime.textContent = '10-14';
        }
    }
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateYield);
    }
    
    if (saveCalculationBtn) {
        saveCalculationBtn.addEventListener('click', saveCalculation);
    }
    
    if (calculatorNav) {
        calculatorNav.addEventListener('click', function(e) {
            e.preventDefault();
            calculatorModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            calculateYield();
        });
    }
    
    if (footerCalculator) {
        footerCalculator.addEventListener('click', function(e) {
            e.preventDefault();
            calculatorModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            calculateYield();
        });
    }
    
    if (calculatorClose) {
        calculatorClose.addEventListener('click', function() {
            calculatorModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    // ============================================ //
    // MESSAGING FUNCTIONS                         //
    // ============================================ //
    
    async function initMessages() {
        if (!currentUser || !supabaseAvailable) return;
        await loadConversations();
        await subscribeToMessages();
        await updateUnreadCount();
    }
    
    async function loadConversations() {
        if (!supabaseAvailable || !currentUser) return;
        
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(id, username, avatar),
                    receiver:receiver_id(id, username, avatar)
                `)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const conversationMap = new Map();
            
            data.forEach(message => {
                const otherUser = message.sender_id === currentUser.id ? message.receiver : message.sender;
                const convId = otherUser.id;
                
                if (!conversationMap.has(convId)) {
                    conversationMap.set(convId, {
                        user: otherUser,
                        messages: [],
                        lastMessage: message,
                        unread: !message.is_read && message.receiver_id === currentUser.id
                    });
                }
                
                conversationMap.get(convId).messages.push(message);
                
                if (!message.is_read && message.receiver_id === currentUser.id) {
                    conversationMap.get(convId).unread = true;
                }
            });
            
            conversations = Array.from(conversationMap.values());
            renderConversations();
            
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }
    
    function renderConversations() {
        if (!conversationsContainer) return;
        
        if (conversations.length === 0) {
            conversationsContainer.innerHTML = '<div class="no-conversations">No conversations yet. Start by sending a message!</div>';
            return;
        }
        
        conversationsContainer.innerHTML = conversations.map(conv => {
            const badge = getUserBadge(conv.user.post_count || 0);
            const lastMessage = conv.lastMessage.content.substring(0, 30);
            const time = getTimeAgo(new Date(conv.lastMessage.created_at));
            const isActive = activeConversation && activeConversation.user.id === conv.user.id;
            
            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" onclick="selectConversation('${conv.user.id}')">
                    <div class="conversation-avatar">
                        <img src="${conv.user.avatar || getDefaultAvatar()}" alt="Avatar">
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-username">
                            ${conv.user.username}
                            <span class="user-badge ${badge.class}">${badge.icon}</span>
                        </div>
                        <div class="conversation-last-message">
                            ${escapeHtml(lastMessage)}...
                        </div>
                        <div class="conversation-time">${time}</div>
                    </div>
                    ${conv.unread ? '<span class="unread-indicator">New</span>' : ''}
                </div>
            `;
        }).join('');
    }
    
    window.selectConversation = async function(userId) {
        const conversation = conversations.find(c => c.user.id === userId);
        if (!conversation) return;
        
        activeConversation = conversation;
        renderActiveConversation();
        
        if (supabaseAvailable) {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', userId)
                .eq('receiver_id', currentUser.id)
                .eq('is_read', false);
        }
        
        await updateUnreadCount();
    };
    
    function renderActiveConversation() {
        if (!activeConversation) return;
        
        const user = activeConversation.user;
        const badge = getUserBadge(user.post_count || 0);
        
        activeConversationHeader.style.display = 'block';
        conversationUsername.textContent = user.username;
        conversationAvatar.src = user.avatar || getDefaultAvatar();
        conversationBadge.className = `user-badge ${badge.class}`;
        conversationBadge.textContent = `${badge.icon} ${badge.name}`;
        
        messageInputContainer.style.display = 'flex';
        
        messagesContainer.innerHTML = activeConversation.messages
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(msg => {
                const isSent = msg.sender_id === currentUser.id;
                const avatar = isSent ? currentUser.avatar : user.avatar;
                
                return `
                    <div class="message-item ${isSent ? 'sent' : 'received'}">
                        <div class="message-avatar">
                            <img src="${avatar || getDefaultAvatar()}" alt="Avatar">
                        </div>
                        <div class="message-content">
                            <div class="message-text">${escapeHtml(msg.content)}</div>
                            <div class="message-time">${getTimeAgo(new Date(msg.created_at))}</div>
                        </div>
                    </div>
                `;
            }).join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    async function subscribeToMessages() {
        if (!supabaseAvailable || !currentUser) return;
        
        if (messagesSubscription) {
            messagesSubscription.unsubscribe();
        }
        
        messagesSubscription = supabase
            .channel('messages-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${currentUser.id}`
            }, async (payload) => {
                await loadConversations();
                
                if (activeConversation && activeConversation.user.id === payload.new.sender_id) {
                    activeConversation.messages.push(payload.new);
                    renderActiveConversation();
                }
                
                await updateUnreadCount();
                showNotification('📬 New message received!', 'info');
            })
            .subscribe();
    }
    
    async function updateUnreadCount() {
        if (!supabaseAvailable || !currentUser) return;
        
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', currentUser.id)
                .eq('is_read', false);
            
            if (!error) {
                unreadCount = count || 0;
                
                if (unreadBadge) {
                    unreadBadge.style.display = unreadCount > 0 ? 'inline' : 'none';
                    unreadBadge.textContent = unreadCount;
                }
                
                if (navUnreadBadge) {
                    navUnreadBadge.style.display = unreadCount > 0 ? 'inline' : 'none';
                    navUnreadBadge.textContent = unreadCount;
                }
            }
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }
    
    async function sendMessage(receiverId, content) {
        if (!currentUser || !supabaseAvailable) {
            showErrorMessage('You must be logged in to send messages');
            return;
        }
        
        if (!content.trim()) {
            showErrorMessage('Message cannot be empty');
            return;
        }
        
        try {
            const newMessage = {
                id: generateId(),
                sender_id: currentUser.id,
                receiver_id: receiverId,
                content: content.trim(),
                is_read: false,
                created_at: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('messages')
                .insert([newMessage]);
            
            if (error) throw error;
            
            if (activeConversation && activeConversation.user.id === receiverId) {
                activeConversation.messages.push(newMessage);
                renderActiveConversation();
            }
            
            await loadConversations();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showErrorMessage('Failed to send message');
        }
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', async function() {
            if (activeConversation && messageInput) {
                await sendMessage(activeConversation.user.id, messageInput.value);
                messageInput.value = '';
            }
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageBtn.click();
            }
        });
    }
    
    function openMessagesModal() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        messagesModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        initMessages();
    }
    
    if (messagesToggle) {
        messagesToggle.addEventListener('click', openMessagesModal);
    }
    
    if (messagesBtn) {
        messagesBtn.addEventListener('click', openMessagesModal);
    }
    
    if (messagesClose) {
        messagesClose.addEventListener('click', function() {
            messagesModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', async function() {
            if (!currentUser) return;
            
            const select = messageRecipient;
            select.innerHTML = '<option value="">Select a user...</option>';
            
            forumUsers
                .filter(u => u.id !== currentUser.id)
                .forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.username} (${user.post_count || 0} posts)`;
                    select.appendChild(option);
                });
            
            newMessageModal.classList.add('active');
        });
    }
    
    if (newMessageClose) {
        newMessageClose.addEventListener('click', function() {
            newMessageModal.classList.remove('active');
        });
    }
    
    if (cancelNewMessage) {
        cancelNewMessage.addEventListener('click', function() {
            newMessageModal.classList.remove('active');
        });
    }
    
    if (sendNewMessage) {
        sendNewMessage.addEventListener('click', async function() {
            const receiverId = messageRecipient.value;
            const content = newMessageContent.value;
            
            if (!receiverId) {
                showErrorMessage('Please select a recipient');
                return;
            }
            
            await sendMessage(receiverId, content);
            
            newMessageModal.classList.remove('active');
            newMessageContent.value = '';
            messageRecipient.value = '';
            
            showSuccessMessage('Message sent!');
            openMessagesModal();
        });
    }
    
    // ============================================ //
    // INITIALIZATION                              //
    // ============================================ //
    
    initTheme();
    loadSavedCalculations();
    await checkUser();
    await loadInitialData();
    
    // ============================================ //
    // EVENT LISTENERS                             //
    // ============================================ //
    
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
    
    if (profileBtn) profileBtn.addEventListener('click', openProfileModal);
    if (userAvatarImg) userAvatarImg.addEventListener('click', openProfileModal);
    if (usernameDisplay) usernameDisplay.addEventListener('click', openProfileModal);
    if (profileClose) profileClose.addEventListener('click', closeProfileModal);
    if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeProfileModal);
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }
    
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', handleRemoveAvatar);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (e.target === createPostModal) closeCreatePostModal();
        if (e.target === profileModal) closeProfileModal();
        if (e.target === messagesModal) {
            messagesModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        if (e.target === newMessageModal) {
            newMessageModal.classList.remove('active');
        }
        if (e.target === calculatorModal) {
            calculatorModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    if (forumSearch) {
        forumSearch.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            filterPosts();
        });
    }
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentCategory = this.getAttribute('data-category') || 'all';
            
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            filterPosts();
        });
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.getAttribute('data-filter') || 'newest';
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterPosts();
        });
    });
    
    // ============================================ //
    // AUTH FUNCTIONS                              //
    // ============================================ //
    
    async function checkUser() {
        if (supabaseAvailable && supabase) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (user && !error) {
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
                            avatar: profile.avatar || getDefaultAvatar(),
                            bio: profile.bio || '',
                            location: profile.location || '',
                            postCount: profile.post_count || 0,
                            commentCount: profile.comment_count || 0,
                            join_date: profile.join_date || new Date().toISOString()
                        };
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                    }
                }
            } catch (error) {
                console.log('Supabase auth check failed, using localStorage');
                const user = JSON.parse(localStorage.getItem('forum_current_user')) || null;
                if (user) currentUser = user;
            }
        } else {
            const user = JSON.parse(localStorage.getItem('forum_current_user')) || null;
            if (user) currentUser = user;
        }
        
        updateUserInterface();
        if (currentUser) {
            initMessages();
        }
    }
    
    async function loadInitialData() {
        if (supabaseAvailable && supabase) {
            try {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*');
                
                if (profiles && !profilesError) {
                    forumUsers = profiles.map(profile => ({
                        id: profile.id,
                        email: profile.email,
                        username: profile.username,
                        avatar: profile.avatar || getDefaultAvatar(),
                        bio: profile.bio || '',
                        location: profile.location || '',
                        join_date: profile.join_date || new Date().toISOString(),
                        post_count: profile.post_count || 0,
                        comment_count: profile.comment_count || 0
                    }));
                }
                
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
                        images: post.images || [],
                        created_at: post.created_at,
                        updated_at: post.updated_at,
                        likes: post.likes || 0,
                        views: post.views || 0,
                        comments: post.comments || [],
                        pinned: post.pinned || false
                    }));
                }
            } catch (error) {
                console.log('Supabase load failed, using localStorage');
                loadFromLocalStorage();
            }
        } else {
            loadFromLocalStorage();
        }
        
        if (forumUsers.length === 0 || forumPosts.length === 0) {
            loadFromLocalStorage();
        }
        
        updateForumStats();
        filterPosts();
    }
    
    function loadFromLocalStorage() {
        const storedUsers = JSON.parse(localStorage.getItem('forum_users'));
        if (storedUsers && storedUsers.length > 0) {
            forumUsers = storedUsers;
        } else {
            forumUsers = createDemoUsers();
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
        }
        
        const storedPosts = JSON.parse(localStorage.getItem('forum_posts'));
        if (storedPosts && storedPosts.length > 0) {
            forumPosts = storedPosts;
        } else {
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
                avatar: getDefaultAvatar(),
                bio: 'Master grower with 10 years experience',
                location: 'Amsterdam',
                join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 105,
                comment_count: 312
            },
            {
                id: '2',
                email: 'canna@spacevibe.com',
                username: 'CannaMaster',
                avatar: getDefaultAvatar(),
                bio: 'Organic growing specialist',
                location: 'Barcelona',
                join_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 68,
                comment_count: 175
            },
            {
                id: '3',
                email: 'led@spacevibe.com',
                username: 'LEDGrower',
                avatar: getDefaultAvatar(),
                bio: 'LED lighting expert',
                location: 'Berlin',
                join_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 45,
                comment_count: 93
            },
            {
                id: '4',
                email: 'organic@spacevibe.com',
                username: 'OrganicQueen',
                avatar: getDefaultAvatar(),
                bio: 'Living soil advocate',
                location: 'Prague',
                join_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                post_count: 28,
                comment_count: 71
            }
        ];
    }
    
    function createDemoPosts() {
        return [
            {
                id: generateId(),
                user_id: '1',
                title: 'First time grower - Need advice on nutrients',
                category: 'vegetative',
                content: "Hello everyone! I'm starting my first cannabis grow and could use some advice on nutrients. I'm growing in soil and currently in the vegetative stage. What nutrients have worked best for you?",
                tags: ['nutrients', 'vegetative', 'beginners'],
                images: [],
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                likes: 12,
                views: 45,
                comments: [],
                pinned: true
            },
            {
                id: generateId(),
                user_id: '2',
                title: 'LED vs HPS - My 6 month comparison',
                category: 'equipment',
                content: "I've been running a side-by-side comparison for 6 months: 600W HPS vs 480W LED. Results: LED produced 15% more yield, used 40% less electricity.",
                tags: ['led', 'hps', 'lighting'],
                images: [],
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                likes: 24,
                views: 78,
                comments: [],
                pinned: false
            },
            {
                id: generateId(),
                user_id: '3',
                title: 'Complete organic grow guide',
                category: 'general',
                content: "After 3 years of organic growing, here's my complete setup: Soil: 40% coco coir, 30% worm castings, 20% perlite, 10% biochar. Nutrients: Compost tea every 2 weeks.",
                tags: ['organic', 'guide', 'soil'],
                images: [],
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 42,
                views: 156,
                comments: [],
                pinned: false
            },
            {
                id: generateId(),
                user_id: '4',
                title: 'Spider mites emergency!',
                category: 'problems',
                content: "Found spider mites on my flowering plants! In week 3 of flowering. What's safe to use at this stage?",
                tags: ['spider-mites', 'pests', 'flowering'],
                images: [],
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                likes: 8,
                views: 32,
                comments: [],
                pinned: false
            }
        ];
    }
    
    function getDefaultAvatar() {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%234CAF50"/><text x="50" y="70" font-size="40" text-anchor="middle" fill="white">🌿</text></svg>';
    }
    
    function updateForumStats() {
        if (totalPostsElement) totalPostsElement.textContent = forumPosts.length;
        if (totalUsersElement) totalUsersElement.textContent = forumUsers.length;
        if (totalMessagesElement) totalMessagesElement.textContent = unreadCount;
        
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
                if (usernameText) usernameText.textContent = currentUser.username;
                if (userAvatarImg) {
                    userAvatarImg.src = currentUser.avatar || getDefaultAvatar();
                }
                
                const badge = getUserBadge(currentUser.postCount || 0);
                if (userBadgeDisplay) {
                    userBadgeDisplay.className = `user-badge ${badge.class}`;
                    userBadgeDisplay.textContent = `${badge.icon} ${badge.name}`;
                }
                
                // Add admin badge if admin
                if (isAdmin()) {
                    userBadgeDisplay.className = `user-badge admin-badge`;
                    userBadgeDisplay.innerHTML = `<i class="fas fa-crown"></i> ADMIN`;
                }
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
    }
    
    async function handleLogin() {
        const email = document.getElementById('login-email')?.value.trim() || '';
        const password = document.getElementById('login-password')?.value.trim() || '';
        
        if (!email || !password) {
            showErrorMessage('Please fill in all fields');
            return;
        }
        
        if (supabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (!error && data.user) {
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
                            avatar: profile.avatar || getDefaultAvatar(),
                            bio: profile.bio || '',
                            location: profile.location || '',
                            postCount: profile.post_count || 0,
                            commentCount: profile.comment_count || 0,
                            join_date: profile.join_date || new Date().toISOString()
                        };
                        
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                        
                        if (loginForm) loginForm.classList.remove('active');
                        if (authSuccess) {
                            authSuccess.classList.add('active');
                            successMessage.textContent = 'Login Successful!';
                            successDetail.textContent = `Welcome back, ${currentUser.username}!`;
                        }
                        
                        updateUserInterface();
                        updateForumStats();
                        filterPosts();
                        initMessages();
                        return;
                    }
                }
            } catch (error) {
                console.log('Supabase login failed, trying localStorage');
            }
        }
        
        const user = forumUsers.find(u => u.email === email);
        if (user) {
            currentUser = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar || getDefaultAvatar(),
                bio: user.bio || '',
                location: user.location || '',
                postCount: user.post_count || 0,
                commentCount: user.comment_count || 0,
                join_date: user.join_date || new Date().toISOString()
            };
            
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
            
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
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showErrorMessage('Username can only contain letters, numbers, and underscores');
            return;
        }
        
        if (supabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: { username: username }
                    }
                });
                
                if (!error && data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: data.user.id,
                            email: email,
                            username: username,
                            avatar: getDefaultAvatar(),
                            bio: '',
                            location: '',
                            join_date: new Date().toISOString(),
                            post_count: 0,
                            comment_count: 0
                        }]);
                    
                    if (!profileError) {
                        currentUser = {
                            id: data.user.id,
                            email: email,
                            username: username,
                            avatar: getDefaultAvatar(),
                            bio: '',
                            location: '',
                            postCount: 0,
                            commentCount: 0,
                            join_date: new Date().toISOString()
                        };
                        
                        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                        
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
        
        if (forumUsers.some(u => u.username === username)) {
            showErrorMessage('Username already taken');
            return;
        }
        
        if (forumUsers.some(u => u.email === email)) {
            showErrorMessage('Email already registered');
            return;
        }
        
        const newUser = {
            id: generateId(),
            email: email,
            username: username,
            avatar: getDefaultAvatar(),
            bio: '',
            location: '',
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
            bio: newUser.bio,
            location: newUser.location,
            postCount: newUser.post_count,
            commentCount: newUser.comment_count,
            join_date: newUser.join_date
        };
        
        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
        
        if (registerForm) registerForm.classList.remove('active');
        if (authSuccess) {
            authSuccess.classList.add('active');
            successMessage.textContent = 'Account Created!';
            successDetail.textContent = `Welcome to the community, ${username}!`;
        }
        
        updateUserInterface();
        updateForumStats();
    }
    
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('forum_current_user');
        updateUserInterface();
        showSuccessMessage('Logged out successfully!');
        filterPosts();
        
        if (messagesSubscription) {
            messagesSubscription.unsubscribe();
        }
    }
    
    // ============================================ //
    // PROFILE FUNCTIONS                           //
    // ============================================ //
    
    function openProfileModal() {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        profileUsername.value = currentUser.username || '';
        profileEmail.value = currentUser.email || '';
        profileBio.value = currentUser.bio || '';
        profileLocation.value = currentUser.location || '';
        profilePostCount.textContent = currentUser.postCount || 0;
        profileCommentCount.textContent = currentUser.commentCount || 0;
        
        if (currentUser.join_date) {
            const joinDate = new Date(currentUser.join_date);
            profileJoinDate.textContent = joinDate.getFullYear();
        } else {
            profileJoinDate.textContent = '2026';
        }
        
        avatarPreview.src = currentUser.avatar || getDefaultAvatar();
        userAvatarImg.src = currentUser.avatar || getDefaultAvatar();
        
        if (currentUser.avatar && currentUser.avatar !== getDefaultAvatar()) {
            removeAvatarBtn.style.display = 'inline-block';
        } else {
            removeAvatarBtn.style.display = 'none';
        }
        
        const badge = getUserBadge(currentUser.postCount || 0);
        badgeIcon.textContent = badge.icon;
        badgeName.textContent = badge.name;
        badgeName.className = badge.class;
        
        const next = getNextRank(currentUser.postCount || 0);
        if (next) {
            nextRank.textContent = next.name;
            postsNeeded.textContent = next.needed;
        } else {
            nextRank.textContent = 'Legend';
            postsNeeded.textContent = '0';
        }
        
        currentPosts.textContent = currentUser.postCount || 0;
        rankProgress.style.width = `${getRankProgress(currentUser.postCount || 0)}%`;
        
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeProfileModal() {
        profileModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showErrorMessage('Image too large. Max 2MB.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showErrorMessage('Please upload an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const avatarData = event.target.result;
            avatarPreview.src = avatarData;
            userAvatarImg.src = avatarData;
            removeAvatarBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
    
    function handleRemoveAvatar() {
        const defaultAvatar = getDefaultAvatar();
        avatarPreview.src = defaultAvatar;
        userAvatarImg.src = defaultAvatar;
        removeAvatarBtn.style.display = 'none';
    }
    
    async function saveProfile() {
        if (!currentUser) return;
        
        currentUser.bio = profileBio.value.trim();
        currentUser.location = profileLocation.value.trim();
        currentUser.avatar = avatarPreview.src;
        
        localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
        
        const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            forumUsers[userIndex].bio = currentUser.bio;
            forumUsers[userIndex].location = currentUser.location;
            forumUsers[userIndex].avatar = currentUser.avatar;
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
        }
        
        if (supabaseAvailable && supabase) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        bio: currentUser.bio,
                        location: currentUser.location,
                        avatar: currentUser.avatar
                    })
                    .eq('id', currentUser.id);
                
                if (error) console.log('Supabase profile update failed:', error);
            } catch (error) {
                console.log('Supabase update failed, using localStorage only');
            }
        }
        
        showSuccessMessage('Profile updated successfully!');
        closeProfileModal();
        filterPosts();
    }
    
    // ============================================ //
    // POST FUNCTIONS                              //
    // ============================================ //
    
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
        
        selectedImages = [];
        renderImagePreviews();
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
        const images = selectedImages.map(img => img.data);
        
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
        
        const newPost = {
            id: generateId(),
            user_id: currentUser.id,
            title: title,
            category: category,
            content: content,
            tags: tags,
            images: images,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            likes: 0,
            views: 0,
            comments: [],
            pinned: false
        };
        
        if (supabaseAvailable && supabase) {
            try {
                const { error } = await supabase
                    .from('posts')
                    .insert([newPost]);
                
                if (!error) {
                    await supabase.rpc('increment_post_count', {
                        user_id: currentUser.id
                    });
                    
                    currentUser.postCount++;
                    localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                }
            } catch (error) {
                console.log('Supabase post creation failed, using localStorage');
            }
        }
        
        forumPosts.unshift(newPost);
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            forumUsers[userIndex].post_count++;
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
            currentUser.postCount++;
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
        }
        
        createCelebrationLeaves();
        closeCreatePostModal();
        filterPosts();
        updateForumStats();
        showSuccessMessage('Post published successfully!');
    }
    
    function filterPosts() {
        let filteredPosts = [...forumPosts];
        
        if (currentCategory !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
        }
        
        if (currentSearch) {
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(currentSearch) ||
                post.content.toLowerCase().includes(currentSearch) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(currentSearch))) ||
                getUserById(post.user_id)?.username.toLowerCase().includes(currentSearch)
            );
        }
        
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
                filteredPosts = filteredPosts.filter(post => !post.comments || post.comments.length === 0);
                filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        
        // Pinned posts at top
        filteredPosts.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
        
        displayPosts(filteredPosts);
    }
    
    function calculateTrendingScore(post) {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const hoursOld = (now - postDate) / (1000 * 60 * 60);
        const timeDecay = Math.max(0, 1 - (hoursOld / 72));
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
        
        posts.forEach((post, index) => {
            const postElement = createPostElement(post, index);
            postsContainer.appendChild(postElement);
        });
        
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
        const userAvatar = (user && user.avatar && user.avatar !== getDefaultAvatar()) 
            ? user.avatar 
            : getDefaultAvatar();
        const userBadge = user ? getUserBadge(user.post_count || 0) : { icon: '🌱', class: 'badge-seedling' };
        
        const postDiv = document.createElement('div');
        postDiv.className = `forum-post ${post.pinned ? 'pinned' : ''}`;
        postDiv.dataset.postId = post.id;
        postDiv.style.animationDelay = `${index * 0.05}s`;
        
        let tagsHtml = '';
        if (post.tags && post.tags.length > 0) {
            tagsHtml = `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
            `;
        }
        
        let imagesHtml = '';
        if (post.images && post.images.length > 0) {
            imagesHtml = createImageGallery(post.images);
        }
        
        const likeClass = localStorage.getItem(`liked_${post.id}`) ? 'liked' : '';
        
        let pinIndicator = '';
        if (post.pinned) {
            pinIndicator = '<span class="pin-indicator"><i class="fas fa-thumbtack"></i> Pinned</span>';
        }
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <div class="post-user-avatar">
                        <img src="${userAvatar}" alt="Avatar">
                    </div>
                    <div class="post-user-info">
                        <h4>
                            ${escapeHtml(username)}
                            ${isAdmin() && user && user.email === 'admin@spacevibe.com' ? '<span class="user-badge admin-badge"><i class="fas fa-crown"></i> ADMIN</span>' : `<span class="user-badge ${userBadge.class}">${userBadge.icon} ${userBadge.name}</span>`}
                            ${pinIndicator}
                        </h4>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <div class="post-category">${categoryNames[post.category] || post.category}</div>
            </div>
            <div class="post-content">
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
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
                </div>
            </div>
        `;
        
        postDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.post-action-btn') && !e.target.closest('.post-image')) {
                viewPostDetails(post.id);
            }
        });
        
        const actionButtons = postDiv.querySelectorAll('.post-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.getAttribute('data-action');
                const postId = this.getAttribute('data-post-id');
                handlePostAction(postId, action, this);
            });
        });
        
        // Add admin controls
        addAdminControlsToPost(postDiv, post.id);
        
        return postDiv;
    }
    
    function getUserById(userId) {
        return forumUsers.find(user => user.id === userId);
    }
    
    // ============================================ //
    // FIXED: POST DETAIL WITH AVATARS & BADGES    //
    // ============================================ //
    
    function viewPostDetails(postId) {
        const post = forumPosts.find(p => p.id === postId);
        if (!post) {
            showErrorMessage('Post not found');
            return;
        }
        
        post.views = (post.views || 0) + 1;
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        
        if (supabaseAvailable && supabase) {
            supabase
                .from('posts')
                .update({ views: post.views })
                .eq('id', postId)
                .then(({ error }) => {
                    if (error) console.error('Error updating views:', error);
                });
        }
        
        const user = getUserById(post.user_id);
        const username = user ? user.username : 'Unknown User';
        const userAvatar = user ? (user.avatar || getDefaultAvatar()) : getDefaultAvatar();
        const userBadge = user ? getUserBadge(user.post_count || 0) : { icon: '🌱', class: 'badge-seedling' };
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
        
        let commentsHtml = '';
        if (comments.length > 0) {
            commentsHtml = comments.map(comment => {
                const commentUser = getUserById(comment.user_id) || {
                    username: comment.username || 'Unknown',
                    avatar: comment.avatar || getDefaultAvatar(),
                    post_count: 0
                };
                
                const commentUsername = commentUser.username;
                const commentAvatar = commentUser.avatar || getDefaultAvatar();
                const commentBadge = getUserBadge(commentUser.post_count || 0);
                
                return `
                    <div class="comment-item" data-comment-id="${comment.id}">
                        <div class="comment-user">
                            <div class="comment-avatar">
                                <img src="${commentAvatar}" alt="Avatar" onerror="this.src='${getDefaultAvatar()}'">
                            </div>
                            <div class="comment-user-info">
                                <h5>
                                    ${escapeHtml(commentUsername)}
                                    ${isAdmin() && commentUser.email === 'admin@spacevibe.com' ? 
                                        '<span class="user-badge admin-badge"><i class="fas fa-crown"></i> ADMIN</span>' : 
                                        `<span class="user-badge ${commentBadge.class}">${commentBadge.icon} ${commentBadge.name}</span>`
                                    }
                                </h5>
                                <span><i class="fas fa-clock"></i> ${getTimeAgo(new Date(comment.created_at))}</span>
                            </div>
                        </div>
                        <div class="comment-content">
                            ${escapeHtml(comment.content).replace(/\n/g, '<br>')}
                        </div>
                        <div class="comment-actions">
                            ${currentUser && currentUser.id === comment.user_id ? `
                                <button class="comment-action-btn edit-comment-btn" onclick="editMyComment('${post.id}', '${comment.id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="comment-action-btn delete-comment-btn" onclick="deleteMyComment('${post.id}', '${comment.id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            commentsHtml = '<div class="no-comments"><i class="fas fa-comment-slash"></i><p>No comments yet. Be the first to comment!</p></div>';
        }
        
        let imagesHtml = '';
        if (post.images && post.images.length > 0) {
            imagesHtml = '<div class="post-images-grid">';
            post.images.slice(0, 4).forEach((image, index) => {
                imagesHtml += `
                    <div class="post-image-thumb" onclick="openLightbox('${image}')">
                        <img src="${image}" alt="Post image ${index + 1}">
                        ${index === 3 && post.images.length > 4 ? 
                            `<div class="more-images">+${post.images.length - 4}</div>` : ''}
                    </div>
                `;
            });
            imagesHtml += '</div>';
        }
        
        let adminBadgeHtml = '';
        if (isAdmin() && user && user.email === 'admin@spacevibe.com') {
            adminBadgeHtml = '<span class="user-badge admin-badge"><i class="fas fa-crown"></i> ADMIN</span>';
        } else {
            adminBadgeHtml = `<span class="user-badge ${userBadge.class}">${userBadge.icon} ${userBadge.name}</span>`;
        }
        
        const detailHtml = `
            <div class="post-detail">
                <div class="post-detail-header">
                    <h2>${escapeHtml(post.title)}</h2>
                    ${post.pinned ? '<span class="pin-indicator"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                </div>
                <div class="post-meta">
                    <div class="post-author">
                        <img src="${userAvatar}" alt="Avatar" class="author-avatar" onerror="this.src='${getDefaultAvatar()}'">
                        <div class="author-info">
                            <strong>${escapeHtml(username)}</strong>
                            ${adminBadgeHtml}
                        </div>
                    </div>
                    <span class="meta-separator">•</span>
                    <span class="post-time"><i class="fas fa-clock"></i> ${getTimeAgo(new Date(post.created_at))}</span>
                    <span class="meta-separator">•</span>
                    <span class="post-category-badge"><i class="fas fa-tag"></i> ${categoryNames[post.category] || post.category}</span>
                </div>
                <div class="post-content-full">
                    ${escapeHtml(post.content).replace(/\n/g, '<br>')}
                </div>
                ${imagesHtml}
                ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
                ` : ''}
                <div class="post-stats-detailed">
                    <span><i class="fas fa-thumbs-up"></i> <span class="like-count">${post.likes || 0}</span> likes</span>
                    <span><i class="fas fa-comment"></i> ${comments.length} comments</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0} views</span>
                </div>
            </div>
            <div class="comment-section">
                <h4><i class="fas fa-comments"></i> Comments (${comments.length})</h4>
                <div class="comments-list">
                    ${commentsHtml}
                </div>
                ${currentUser ? `
                <div class="add-comment">
                    <textarea id="detail-comment-input" placeholder="Share your thoughts..." rows="3"></textarea>
                    <button class="btn-primary submit-comment" data-post-id="${post.id}">
                        <i class="fas fa-paper-plane"></i> Post Comment
                    </button>
                </div>
                ` : `
                <div class="login-to-comment">
                    <i class="fas fa-lock"></i>
                    <p><a href="#" class="login-link">Login</a> to add a comment</p>
                </div>
                `}
            </div>
        `;
        
        showPostDetailModal(detailHtml, post.id);
    }
    
    // Make these functions available globally for comment editing
    window.editMyComment = function(postId, commentId) {
        showEditCommentModal(postId, commentId);
    };
    
    window.deleteMyComment = function(postId, commentId) {
        showDeleteConfirmModal('comment', commentId, () => {
            deleteComment(postId, commentId);
        });
    };
    
    function showPostDetailModal(content, postId) {
        const existingModal = document.getElementById('post-detail-modal-custom');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'post-detail-modal-custom';
        modal.className = 'post-detail-modal-custom active';
        modal.innerHTML = `
            <div class="post-detail-modal-content">
                <div class="post-detail-modal-header">
                    <h3><i class="fas fa-leaf"></i> Post Details</h3>
                    <button class="post-detail-modal-close">&times;</button>
                </div>
                <div class="post-detail-modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
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
        
        const submitCommentBtn = modal.querySelector('.submit-comment');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', async () => {
                const textarea = modal.querySelector('#detail-comment-input');
                const comment = textarea.value.trim();
                if (comment) {
                    await addComment(postId, comment);
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
        
        // Add admin controls to comments
        if (isAdmin()) {
            const commentItems = modal.querySelectorAll('.comment-item');
            commentItems.forEach(item => {
                const commentId = item.dataset.commentId;
                if (commentId) {
                    addAdminControlsToComment(item, postId, commentId);
                }
            });
        }
        
        const images = modal.querySelectorAll('.post-image-thumb');
        images.forEach(img => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                const imgElement = this.querySelector('img');
                if (imgElement) {
                    openLightbox(imgElement.src);
                }
            });
        });
    }
    
    async function handlePostAction(postId, action, button) {
        if (!currentUser) {
            showLogin();
            return;
        }
        
        switch (action) {
            case 'like':
                await handleLike(postId, button);
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
    
    async function handleLike(postId, button) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        const hasLiked = localStorage.getItem(`liked_${postId}`);
        
        if (hasLiked) {
            showErrorMessage('You already liked this post');
            return;
        }
        
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
        
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        localStorage.setItem(`liked_${postId}`, 'true');
        
        if (button) {
            button.classList.add('liked');
            setTimeout(() => {
                button.classList.remove('liked');
            }, 600);
        }
        
        const likeCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .like-count, .post-stats-detailed .like-count`);
        likeCountElements.forEach(el => {
            el.textContent = post.likes;
        });
        
        showSuccessMessage('Post liked!');
    }
    
    async function addComment(postId, content) {
        const postIndex = forumPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const post = forumPosts[postIndex];
        
        if (!post.comments) {
            post.comments = [];
        }
        
        const newComment = {
            id: generateId(),
            user_id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar,
            content: content,
            created_at: new Date().toISOString()
        };
        
        post.comments.push(newComment);
        
        if (supabaseAvailable && supabase) {
            try {
                const { error } = await supabase
                    .from('comments')
                    .insert([{
                        id: newComment.id,
                        post_id: postId,
                        user_id: newComment.user_id,
                        content: newComment.content,
                        created_at: newComment.created_at
                    }]);
                
                if (!error) {
                    await supabase.rpc('increment_comment_count', {
                        user_id: currentUser.id
                    });
                    
                    currentUser.commentCount++;
                    localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
                }
            } catch (error) {
                console.log('Supabase comment failed, using localStorage');
            }
        }
        
        const userIndex = forumUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            forumUsers[userIndex].comment_count++;
            localStorage.setItem('forum_users', JSON.stringify(forumUsers));
            currentUser.commentCount++;
            localStorage.setItem('forum_current_user', JSON.stringify(currentUser));
        }
        
        localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
        updateForumStats();
        showSuccessMessage('Comment added successfully!');
    }
    
    function loadMorePosts() {
        showInfoMessage('All posts are loaded. Check back later for new posts!');
        if (loadMorePostsBtn) {
            loadMorePostsBtn.disabled = true;
            loadMorePostsBtn.textContent = 'All Posts Loaded';
            loadMorePostsBtn.style.opacity = '0.5';
        }
    }
    
    // ============================================ //
    // HELPER FUNCTIONS                            //
    // ============================================ //
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    function getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
        if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        return 'Just now';
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
        const existingNotification = document.querySelector('.forum-notification');
        if (existingNotification) existingNotification.remove();
        
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
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // ============================================ //
    // LEAF ANIMATION - CANNABIS LEAVES! 🌿        //
    // ============================================ //
    
    function initLeafAnimation() {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        leafContainer.innerHTML = '';
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => createLeaf(i), i * 300);
        }
        
        setInterval(() => {
            if (Math.random() > 0.7 && leafContainer.children.length < 25) {
                createLeaf(Date.now());
            }
        }, 8000);
        
        let mouseMoveTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                if (Math.random() > 0.9 && leafContainer.children.length < 30) {
                    createLeafAtPosition(e.clientX, e.clientY);
                }
            }, 100);
        });
        
        document.addEventListener('visibilitychange', () => {
            const leaves = document.querySelectorAll('.leaf');
            if (document.hidden) {
                leaves.forEach(leaf => leaf.style.animationPlayState = 'paused');
            } else {
                leaves.forEach(leaf => leaf.style.animationPlayState = 'running');
            }
        });
    }
    
    function createLeaf(id) {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.id = `leaf-${id}`;
        
        const size = 15 + Math.random() * 30;
        const startPosition = Math.random() * 100;
        const animationDuration = 18 + Math.random() * 20;
        const sway = Math.random() > 0.6;
        const opacity = 0.5 + Math.random() * 0.4;
        
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${startPosition}%`;
        leaf.style.opacity = opacity;
        leaf.style.animationDuration = `${animationDuration}s`;
        leaf.style.animationDelay = `${Math.random() * 5}s`;
        
        if (sway) leaf.classList.add('swing');
        
        leaf.addEventListener('mouseenter', () => {
            leaf.style.animationPlayState = 'paused';
            leaf.style.transform = 'scale(1.4) rotate(10deg)';
            leaf.style.filter = 'drop-shadow(0 8px 16px rgba(76, 175, 80, 0.8)) brightness(1.4)';
            leaf.style.zIndex = '1000';
            leaf.style.transition = 'all 0.3s ease';
            createLeafParticles(leaf);
        });
        
        leaf.addEventListener('mouseleave', () => {
            leaf.style.animationPlayState = 'running';
            leaf.style.transform = '';
            leaf.style.filter = '';
            leaf.style.zIndex = '';
            leaf.style.transition = '';
        });
        
        leaf.addEventListener('animationend', () => {
            if (leaf.parentNode) {
                leaf.remove();
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
        
        const size = 10 + Math.random() * 25;
        const opacity = 0.4 + Math.random() * 0.3;
        
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${x}px`;
        leaf.style.top = `${y}px`;
        leaf.style.opacity = opacity;
        leaf.style.animationDuration = `${12 + Math.random() * 15}s`;
        leaf.style.position = 'fixed';
        leaf.style.zIndex = '999';
        
        if (Math.random() > 0.5) leaf.classList.add('swing');
        
        leafContainer.appendChild(leaf);
        
        setTimeout(() => {
            if (leaf.parentNode) leaf.remove();
        }, 20000);
    }
    
    function createCelebrationLeaves() {
        const leafContainer = document.getElementById('leaf-container');
        if (!leafContainer) return;
        
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
                
                leafContainer.appendChild(leaf);
                
                setTimeout(() => {
                    if (leaf.parentNode) leaf.remove();
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
        
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
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
            
            setTimeout(() => {
                if (particle.parentNode) particle.remove();
            }, duration * 1000);
        }
    }
    
    function getRandomLeafColor() {
        const colors = ['green', 'light-green', 'dark-green'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // ============================================ //
    // ADDITIONAL STYLES                           //
    // ============================================ //
    
    const style = document.createElement('style');
    style.textContent = `
        .celebration-leaf {
            animation: celebrateLeaf 2s ease-out forwards !important;
        }
        
        @keyframes celebrateLeaf {
            0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(var(--tx, 100px), var(--ty, -100px)) scale(1) rotate(360deg); opacity: 0; }
        }
        
        @keyframes particleFloat {
            to { transform: translate(var(--end-x, 0), var(--end-y, 0)); }
        }
        
        @keyframes particleFade {
            0%, 70% { opacity: 1; }
            100% { opacity: 0; }
        }
        
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
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-muted);
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
        
        .notification-close:hover { color: var(--text-primary); }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
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
        
        .post-detail-modal-custom.active { display: block; }
        
        .post-detail-modal-content {
            background: var(--bg-secondary);
            min-height: 100vh;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
        }
        
        .post-detail-modal-header {
            position: sticky;
            top: 0;
            background: var(--bg-secondary);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            z-index: 1;
        }
        
        .post-detail-modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 2rem;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .post-detail-modal-body { padding: 30px; }
        
        .post-author {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .author-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .author-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        
        .no-calculations {
            color: var(--text-muted);
            text-align: center;
            padding: 20px;
            background: var(--bg-tertiary);
            border-radius: 8px;
        }
        
        .no-conversations {
            color: var(--text-muted);
            text-align: center;
            padding: 40px 20px;
        }
        
        .no-comments {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-muted);
        }
        
        .no-comments i {
            font-size: 3rem;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        
        .login-to-comment {
            text-align: center;
            padding: 30px;
            background: var(--bg-tertiary);
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .login-to-comment i {
            font-size: 2rem;
            color: #4CAF50;
            margin-bottom: 10px;
            opacity: 0.7;
        }
        
        .login-to-comment a {
            color: #4CAF50;
            font-weight: 600;
            text-decoration: none;
        }
        
        .login-to-comment a:hover {
            text-decoration: underline;
        }
        
        .meta-separator {
            color: var(--text-muted);
            margin: 0 5px;
        }
        
        .post-time, .post-category-badge {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .post-category-badge i {
            margin-right: 5px;
            color: #4CAF50;
        }
        
        .post-images-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        
        .post-image-thumb {
            position: relative;
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
        }
        
        .post-image-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .more-images {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .admin-badge {
            background: linear-gradient(135deg, #ff9800, #f57c00) !important;
            color: white !important;
            box-shadow: 0 2px 8px rgba(255,152,0,0.3) !important;
        }
        
        .admin-badge i {
            margin-right: 4px;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize everything
    initLeafAnimation();
    
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
        setTimeout(() => viewPostDetails(postId), 1000);
    }
    
    console.log('%c🌿 SPACE VIBE GARDEN FORUM - ADMIN CONTROLS + FIXES! 🌿', 'font-size:16px; color:#4CAF50; font-weight:bold;');
    console.log('✅ FIXED: Post detail avatars and badges showing correctly');
    console.log('✅ FIXED: Legend badge now appears at 100+ posts');
    console.log('✅ ADDED: Admin controls (Edit/Delete/Pin) for posts');
    console.log('✅ ADDED: Admin controls (Edit/Delete) for comments');
    console.log('✅ ADDED: Admin badge with crown icon');
    console.log('✅ ADDED: Delete confirmation modal');
    console.log('⚠️ TO MAKE YOURSELF ADMIN: Change email in isAdmin() function');
    console.log('   Current admin emails: admin@spacevibe.com, your-email@gmail.com');
    console.log('✅ Current User: ' + (currentUser ? currentUser.username + ' (Admin: ' + isAdmin() + ')' : 'Not logged in'));
});