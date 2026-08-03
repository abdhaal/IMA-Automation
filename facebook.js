// ==========================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";
const part1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
const part2 = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.";
const part3 = "bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";
const SUPABASE_ANON_KEY = part1 + part2 + part3;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
});

let currentActivePostId = "";
let currentUserUuid = "";
let currentFacebookPageId = ""; 
let currentSelectedTemplateType = "media";
let base64CustomUploadedImage = ""; 

// 🔥 PAGINATION CURSORS (புதுசா சேர்த்தது)
let nextLiveCursor = null;
let prevLiveCursor = null;

// ==========================================
// 2. DYNAMIC STATE BUILDERS
// ==========================================
let mediaCards = [{ image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", headline: "Card 1 Headline", desc: "Template Description text goes here...", btnTitle: "Link 🔗", url: "" }];
let activeCardIndex = 0;
let buttonTemplateText = "Please select an option below:";
let buttonTemplateBtns = [{ title: "Button 1", url: "" }];

// ==========================================
// 3. FETCH AND RENDER POSTS (With Pagination 🚀)
// ==========================================
async function loadFacebookPageData(direction = 'init') {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) { window.location.href = "login.html"; return; }

        currentUserUuid = data.session.user.id;
        
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = data.session.user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = data.session.user.email.split("@")[0];

        // Grid-க்கு ஏற்றபடி 100% அகலத்தில் Loading காட்ட grid-column சேர்க்கப்பட்டுள்ளது
        postsContainer.innerHTML = "<p style='color:#94a3b8; font-size:14px; text-align:center; width:100%; padding:20px; grid-column: 1 / -1;'><i class='fa-solid fa-spinner fa-spin'></i> Loading Facebook posts...</p>";

        const { data: profileData, error: dbErr } = await supabaseClient
            .from('profiles').select('facebook_page_access_token, facebook_page_id').eq('id', currentUserUuid).maybeSingle();

        if (dbErr || !profileData || !profileData.facebook_page_id) {
            postsContainer.innerHTML = `<div style='text-align:center; width:100%; padding:40px; color:#94a3b8; grid-column: 1 / -1;'><i class="fa-brands fa-facebook" style="font-size: 40px; color: #1877f2; margin-bottom: 15px;"></i><p>Your Facebook Page is not linked yet.</p></div>`;
            return;
        }

        currentFacebookPageId = profileData.facebook_page_id;

        // 🔥 PAGINATION API SETUP (ஒரு பேஜுக்கு 12 போஸ்ட்கள் மட்டும்)
        let livePostsUrl = `https://graph.facebook.com/v20.0/${profileData.facebook_page_id}/posts?fields=id,message,full_picture,picture,attachments,created_time,comments.summary(total_count),likes.summary(total_count)&limit=12&access_token=${profileData.facebook_page_access_token}`;

        // Next / Prev பட்டன் அழுத்தும்போது URL-ல் Cursor-ஐ இணைக்கிறோம்
        if (direction === 'next' && nextLiveCursor) livePostsUrl += `&after=${nextLiveCursor}`;
        if (direction === 'prev' && prevLiveCursor) livePostsUrl += `&before=${prevLiveCursor}`;

        // Scheduled Posts-ஐ முதல் பக்கத்தில் மட்டும் காட்டினால் போதும்
        let scheduledPostsUrl = `https://graph.facebook.com/v20.0/${profileData.facebook_page_id}/scheduled_posts?fields=id,message,full_picture,picture,attachments,created_time,scheduled_publish_time&limit=50&access_token=${profileData.facebook_page_access_token}`;

        const fetchPromises = [fetch(livePostsUrl)];
        if (direction === 'init') fetchPromises.push(fetch(scheduledPostsUrl));

        const responses = await Promise.all(fetchPromises);
        const liveJson = await responses[0].json();
        
        let schedJson = { data: [] };
        if (responses[1]) schedJson = await responses[1].json();

        let allCombinedPosts = [];

        // Scheduled போஸ்ட்களை முதலில் சேர்க்கிறோம்
        if (schedJson.data && Array.isArray(schedJson.data)) {
            schedJson.data.forEach(p => { p.is_scheduled = true; allCombinedPosts.push(p); });
        }

        // Live போஸ்ட்களை சேர்க்கிறோம்
        if (liveJson.data && Array.isArray(liveJson.data)) {
            liveJson.data.forEach(p => { p.is_scheduled = false; allCombinedPosts.push(p); });
        }

        // 🔥 FB API கொடுக்கும் அடுத்த பக்கத்திற்கான (Next Page) Cursors-ஐ சேமிக்கிறோம்
        if (liveJson.paging && liveJson.paging.cursors) {
            nextLiveCursor = liveJson.paging.cursors.after || null;
            prevLiveCursor = liveJson.paging.cursors.before || null;
        } else {
            nextLiveCursor = null;
            prevLiveCursor = null;
        }

        postsContainer.innerHTML = "";
        
        if (allCombinedPosts.length === 0) {
            postsContainer.innerHTML = `<p style='color:#94a3b8; text-align:center; padding:20px; grid-column: 1 / -1;'>No posts found.</p>`;
            return;
        }

        allCombinedPosts.forEach(post => {
            let mediaThumb = post.full_picture || post.picture;

            if (!mediaThumb && post.attachments && post.attachments.data && post.attachments.data.length > 0) {
                const attachData = post.attachments.data[0];
                if (attachData.media && attachData.media.image && attachData.media.image.src) {
                    mediaThumb = attachData.media.image.src;
                }
            }

            if (!mediaThumb) {
                mediaThumb = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500"; 
            }

            const captionText = post.message ? post.message.substring(0, 55) + "..." : (post.is_scheduled ? "Scheduled Post" : "Facebook Page Post");
            const rawDate = post.is_scheduled ? post.scheduled_publish_time : post.created_time;
            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recent";
            
            const commentsCount = post.comments?.summary?.total_count || 0;
            const likesCount = post.likes?.summary?.total_count || 0;

            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <img src="${mediaThumb}" class="post-thumb" alt="thumb">
                <div class="post-meta-badges">
                    ${post.is_scheduled ? '<span class="meta-badge" style="background:#f59e0b; color:#fff; font-weight:bold;"><i class="fa-solid fa-clock"></i> Scheduled</span>' : `
                        <span class="meta-badge"><i class="fa-solid fa-comment" style="color:#1877f2;"></i> ${commentsCount}</span>
                        <span class="meta-badge"><i class="fa-solid fa-thumbs-up" style="color:#1877f2;"></i> ${likesCount}</span>
                    `}
                </div>
                <div class="post-details">
                    <div><h4>${captionText}</h4><p><i class="fa-solid fa-calendar"></i> ${formattedDate}</p></div>
                    <button class="replyrush-btn" data-post-id="${post.id}" data-img="${mediaThumb}"><i class="fa-solid fa-link"></i> Link Post Setup</button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

        // ==========================================
        // 🔥 APPEND PAGINATION BUTTONS (Prev & Next)
        // ==========================================
        const paginationDiv = document.createElement("div");
        paginationDiv.style.cssText = "display: flex; justify-content: center; gap: 15px; margin-top: 30px; margin-bottom: 20px; width: 100%; grid-column: 1 / -1;";

        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Previous`;
        prevBtn.className = "replyrush-btn"; // Styles taken from your existing button class
        prevBtn.style.padding = "10px 25px";
        prevBtn.disabled = !prevLiveCursor || direction === 'init';
        if (prevBtn.disabled) prevBtn.style.opacity = "0.5";
        prevBtn.onclick = () => loadFacebookPageData('prev');

        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = `Next <i class="fa-solid fa-arrow-right"></i>`;
        nextBtn.className = "replyrush-btn";
        nextBtn.style.padding = "10px 25px";
        nextBtn.disabled = !nextLiveCursor;
        if (nextBtn.disabled) nextBtn.style.opacity = "0.5";
        nextBtn.onclick = () => loadFacebookPageData('next');

        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(nextBtn);
        
        postsContainer.appendChild(paginationDiv);

        bindLinkButtons();
    } catch (gErr) { console.error(gErr); }
}

function bindLinkButtons() {
    // ... [இதற்கு கீழே உள்ள பழைய கோடு (4. UI BUILDERS-லிருந்து) அப்படியே இருக்கும், எந்த மாற்றமும் தேவையில்லை] ...
    

// ==========================================
// 4. UI BUILDERS (Tabs logic)
// ==========================================
function handleTemplateTypeSwitch(type) {
    currentSelectedTemplateType = type;
    
    document.getElementById("mediaTemplateWrapper").style.display = (type === 'media') ? "block" : "none";
    document.getElementById("buttonTemplateWrapper").style.display = (type === 'button') ? "block" : "none";
    
    const otherWrapper = document.getElementById("otherTemplatesWrapper");
    const oMedia = document.getElementById("otherMediaSourceBlock");
    const oQuick = document.getElementById("otherQuickReplyBlock");
    
    if (type === 'media' || type === 'button') {
        otherWrapper.style.display = "none";
    } else {
        otherWrapper.style.display = "flex";
        if (type === 'text') {
            oMedia.style.display = "none";
            oQuick.style.display = "none";
        } else if (type === 'quick') {
            oMedia.style.display = "none";
            oQuick.style.display = "block";
        } else if (type === 'attach') {
            oMedia.style.display = "block";
            oQuick.style.display = "none";
        }
    }
    triggerLiveMirrorUpdate();
}

function renderCarouselUI() {
    document.getElementById('cardCount').innerText = mediaCards.length;
    document.getElementById('carouselTabsContainer').innerHTML = mediaCards.map((c, i) => `
        <div class="card-tab ${i === activeCardIndex ? 'active' : ''}" onclick="switchCard(${i})">
            Card ${i+1} ${mediaCards.length > 1 ? `<i class="fa-solid fa-circle-xmark" style="color:#ef4444; margin-left:5px;" onclick="removeCard(${i}, event)"></i>` : ''}
        </div>
    `).join('');

    const active = mediaCards[activeCardIndex];
    document.getElementById('cardHeadline').value = active.headline;
    document.getElementById('cardDesc').value = active.desc;
    document.getElementById('cardBtnTitle').value = active.btnTitle;
    document.getElementById('cardUrl').value = active.url;
    triggerLiveMirrorUpdate();
}

window.switchCard = function(index) { activeCardIndex = index; renderCarouselUI(); }
window.removeCard = function(index, event) { event.stopPropagation(); mediaCards.splice(index, 1); if(activeCardIndex >= mediaCards.length) activeCardIndex = mediaCards.length - 1; renderCarouselUI(); }
document.getElementById('addCardBtn')?.addEventListener('click', () => {
    if(mediaCards.length >= 10) return alert("Maximum 10 cards allowed!");
    mediaCards.push({ image: mediaCards[0].image, headline: `Card ${mediaCards.length + 1} Headline`, desc: "Template Description...", btnTitle: "Link 🔗", url: "" });
    activeCardIndex = mediaCards.length - 1;
    renderCarouselUI();
});

['cardHeadline', 'cardDesc', 'cardBtnTitle', 'cardUrl'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
        const keyMap = { 'cardHeadline': 'headline', 'cardDesc': 'desc', 'cardBtnTitle': 'btnTitle', 'cardUrl': 'url' };
        mediaCards[activeCardIndex][keyMap[id]] = e.target.value;
        triggerLiveMirrorUpdate();
    });
});

function renderButtonTemplateUI() {
    document.getElementById('btnCount').innerText = buttonTemplateBtns.length;
    document.getElementById('btnTemplateText').value = buttonTemplateText;
    document.getElementById('btnTemplateList').innerHTML = buttonTemplateBtns.map((b, i) => `
        <div class="dynamic-btn-row">
            <input type="text" placeholder="Button Title" value="${b.title}" oninput="updateBtnTitle(${i}, this.value)">
            <input type="url" placeholder="URL Link" value="${b.url}" oninput="updateBtnUrl(${i}, this.value)">
            ${buttonTemplateBtns.length > 1 ? `<button onclick="removeBtn(${i})"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
    `).join('');
    triggerLiveMirrorUpdate();
}

document.getElementById('btnTemplateText')?.addEventListener('input', (e) => { buttonTemplateText = e.target.value; triggerLiveMirrorUpdate(); });
document.getElementById('addTemplateBtn')?.addEventListener('click', () => {
    if(buttonTemplateBtns.length >= 3) return alert("Maximum 3 buttons allowed!");
    buttonTemplateBtns.push({ title: `Button ${buttonTemplateBtns.length + 1}`, url: "" });
    renderButtonTemplateUI();
});
window.updateBtnTitle = function(i, val) { buttonTemplateBtns[i].title = val; triggerLiveMirrorUpdate(); }
window.updateBtnUrl = function(i, val) { buttonTemplateBtns[i].url = val; }
window.removeBtn = function(i) { buttonTemplateBtns.splice(i, 1); renderButtonTemplateUI(); }

// ==========================================
// 5. IMAGE UPLOAD & LIVE PREVIEW
// ==========================================
function triggerLiveMirrorUpdate() {
    const bubble = document.getElementById("previewEngagementBubble");
    if (bubble) {
        bubble.innerHTML = `${document.getElementById("customEngagementText")?.value || "Hi 👋 Thanks for your comment!"}<br><br><div style="background:#e2e8f0; color:#1e293b; padding:8px; border-radius:6px; text-align:center; font-weight:600; font-size:12px; border:1px solid #cbd5e1;">${document.getElementById("engagementBtnTitle")?.value || "Send Link Now"}</div>`;
    }

    const carouselContainer = document.getElementById("previewCarouselContainer");
    const btnContainer = document.getElementById("previewButtonTemplateContainer");
    const simpleContainer = document.getElementById("previewSimpleContainer");

    if (currentSelectedTemplateType === 'media') {
        carouselContainer.style.display = "flex"; btnContainer.style.display = "none"; simpleContainer.style.display = "none";
        carouselContainer.innerHTML = mediaCards.map(c => `
            <div class="preview-carousel-card" style="scroll-snap-align: center;">
                <div style="height: 140px; width: 100%; background: #1e293b;"><img src="${c.image}" style="width:100%; height:100%; object-fit:cover;"></div>
                <div style="padding: 12px;">
                    <h5 style="margin: 0 0 5px 0; color: #fff; font-size: 14px;">${c.headline || 'Headline'}</h5>
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">${c.desc || 'Description'}</p>
                    <div style="text-align: center; color: #1877f2; font-weight: 600; font-size: 13px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">${c.btnTitle || 'Button'}</div>
                </div>
            </div>`).join('');
    } else if (currentSelectedTemplateType === 'button') {
        carouselContainer.style.display = "none"; btnContainer.style.display = "flex"; simpleContainer.style.display = "none";
        document.getElementById("previewBtnTextBubble").innerText = buttonTemplateText || "Select an option:";
        document.getElementById("previewBtnList").innerHTML = buttonTemplateBtns.map(b => `<div style="background: rgba(255,255,255,0.05); color: #1877f2; padding: 10px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 13px; border: 1px solid rgba(255,255,255,0.1);">${b.title || 'Button'}</div>`).join('');
    } else {
        carouselContainer.style.display = "none"; btnContainer.style.display = "none"; simpleContainer.style.display = "flex";
        document.getElementById("previewSimpleTextBubble").innerText = document.getElementById("otherDesc")?.value || "Your text message goes here...";
        
        const imgSlot = document.getElementById("previewSimpleImgSlot");
        if (currentSelectedTemplateType === 'attach') {
            imgSlot.style.display = "block";
            imgSlot.innerHTML = `<img src="${base64CustomUploadedImage}" style="width:100%; height:100%; object-fit:cover;">`;
        } else imgSlot.style.display = "none";
        
        const quickBtn = document.getElementById("previewSimpleQuickBtn");
        if (currentSelectedTemplateType === 'quick') {
            quickBtn.style.display = "block";
            quickBtn.innerText = document.getElementById("otherQuickReplyBtn")?.value || "Quick Reply";
        } else quickBtn.style.display = "none";
    }
}

document.getElementById("cardUrl")?.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (document.querySelector("input[name='imageSourceToggle']:checked")?.value === "auto" && url.startsWith("http")) processSmartAutoImageFetch(url);
});

document.getElementById("manualImageFileInput")?.addEventListener("change", (e) => {
    if (e.target.files[0]) {
        uploadImageToSupabase(e.target.files[0], (publicUrl) => {
            mediaCards[activeCardIndex].image = publicUrl;
            triggerLiveMirrorUpdate();
        });
    }
});

document.getElementById("otherImageFileInput")?.addEventListener("change", (e) => {
    if (e.target.files[0]) {
        uploadImageToSupabase(e.target.files[0], (publicUrl) => {
            base64CustomUploadedImage = publicUrl;
            triggerLiveMirrorUpdate();
        });
    }
});

async function uploadImageToSupabase(file, callback) {
    const btn = document.getElementById("savePostAutomationBtn");
    const originalText = btn.innerHTML;
    
    btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Uploading Image to Server...";
    btn.disabled = true;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `${currentUserUuid}/${fileName}`; 

        const { data, error } = await supabaseClient.storage
            .from('automation_images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrlData } = supabaseClient.storage
            .from('automation_images')
            .getPublicUrl(filePath);

        callback(publicUrlData.publicUrl);
    } catch (err) {
        alert("Image Upload Failed! ⚠️ Did you create the 'automation_images' storage bucket? Error: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function processSmartAutoImageFetch(urlStr) {
    if (urlStr.match(/\.(jpeg|jpg|gif|png|webp)/i) != null) { mediaCards[activeCardIndex].image = urlStr; triggerLiveMirrorUpdate(); } 
    else {
        try {
            const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(urlStr)}&prerender=true`);
            const data = await res.json();
            if (data.status === 'success' && data.data.image && data.data.image.url) { mediaCards[activeCardIndex].image = data.data.image.url; triggerLiveMirrorUpdate(); }
            else throw new Error("No image");
        } catch(e) { console.log("⚠️ Cannot extract image automatically."); }
    }
}

// ==========================================
// 6. DOM LISTENERS & SAVE LOGIC (Swapped Title & Desc Correctly)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadFacebookPageData();

    document.querySelectorAll("input[name='imageSourceToggle']").forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "manual") {
                document.getElementById("manualUploadWrapper").style.display = "block";
                document.getElementById("autoFetchWrapper").style.display = "none";
            } else {
                document.getElementById("manualUploadWrapper").style.display = "none";
                document.getElementById("autoFetchWrapper").style.display = "block";
                const activeUrl = document.getElementById("cardUrl").value.trim();
                if (activeUrl && activeUrl.startsWith("http")) {
                    processSmartAutoImageFetch(activeUrl);
                }
            }
        });
    });

    document.getElementById("closeOptionsBtn")?.addEventListener("click", () => { document.getElementById("automationOptionsCard").style.display = "none"; });
    document.getElementById("triggerMechanism")?.addEventListener("change", (e) => { document.getElementById("keywordInputWrapper").style.display = (e.target.value === "keywords") ? "block" : "none"; });
    document.getElementById("commentAutoReplyCheck")?.addEventListener("change", (e) => { document.getElementById("commentTextInputWrapper").style.display = e.target.checked ? "block" : "none"; });
    document.getElementById("sendDMCheck")?.addEventListener("change", (e) => { document.getElementById("engagementTextInputWrapper").style.display = e.target.checked ? "block" : "none"; document.getElementById("previewEngagementBubble").style.display = e.target.checked ? "block" : "none"; });
    document.getElementById("customEngagementText")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("engagementBtnTitle")?.addEventListener("input", triggerLiveMirrorUpdate); 
    document.getElementById("otherDesc")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("otherQuickReplyBtn")?.addEventListener("input", triggerLiveMirrorUpdate);

    document.querySelectorAll(".template-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".template-type-btn").forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            handleTemplateTypeSwitch(btn.getAttribute('data-type'));
        });
    });

    // ==========================================
    // SAVE CONFIGURATION TO DB (SWAPPED TITLE & DESC)
    // ==========================================
    document.getElementById("savePostAutomationBtn")?.addEventListener("click", async () => {
        if (!currentActivePostId || !currentFacebookPageId) {
            alert("⚠️ Please select a post first!");
            return;
        }

        const btn = document.getElementById("savePostAutomationBtn");
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Saving Config...";
        btn.disabled = true;

        try {
            const templateType = currentSelectedTemplateType;
            let customImageData = base64CustomUploadedImage;
            let headline = "";
            let desc = "";
            let secondBtnTitle = "";
            let url = "";
            let quickReplyTitle = "";

            if (templateType === 'media') {
                // 🔥 SWAPPED TO MATCH YOUR EXACT DB REQUIREMENT:
                // mediaCards[0].desc goes to fb_headline (Title in Card)
                // mediaCards[0].headline goes to fb_desc (Description in Card)
                headline = mediaCards[0]?.desc || ""; 
                desc = mediaCards[0]?.headline || "";     
                secondBtnTitle = mediaCards[0]?.btnTitle || "";
                url = mediaCards[0]?.url || "";
                customImageData = mediaCards[0]?.image || ""; 
            } else {
                desc = document.getElementById("otherDesc")?.value || "";
                if (templateType === 'quick') {
                    quickReplyTitle = document.getElementById("otherQuickReplyBtn")?.value || "";
                }
            }

            const payload = {
                profile_id: currentUserUuid,
                facebook_page_id: currentFacebookPageId,
                fb_active_post_id: currentActivePostId,
                
                fb_trigger_type: document.getElementById("triggerMechanism")?.value || 'all',
                fb_target_keywords: document.getElementById("targetKeywords")?.value || "",
                fb_exclude_keywords: document.getElementById("excludeKeywords")?.value || "",
                
                fb_comment_reply_active: document.getElementById("commentAutoReplyCheck")?.checked || false,
                fb_custom_comment_text: document.getElementById("customCommentText")?.value || "",
                fb_dm_active: document.getElementById("sendDMCheck")?.checked || false,
                fb_custom_engagement_text: document.getElementById("customEngagementText")?.value || "",
                fb_btn_title: document.getElementById("engagementBtnTitle")?.value || "",
                
                fb_template_type: templateType,
                fb_carousel_data: mediaCards,
                fb_image_source_mode: document.querySelector("input[name='imageSourceToggle']:checked")?.value || "manual",
                fb_custom_image_data: customImageData,
                fb_headline: headline,
                fb_desc: desc,
                fb_second_btn_title: secondBtnTitle,
                fb_url: url,
                
                fb_quick_reply_title: quickReplyTitle,
                fb_button_data: buttonTemplateBtns
            };

            const { data: existing } = await supabaseClient
                .from('facebook_posts_automation')
                .select('id')
                .eq('facebook_page_id', currentFacebookPageId)
                .eq('fb_active_post_id', currentActivePostId)
                .maybeSingle();

            let saveErr;
            if (existing) {
                const { error: uErr } = await supabaseClient.from('facebook_posts_automation').update(payload).eq('id', existing.id);
                saveErr = uErr;
            } else {
                const { error: iErr } = await supabaseClient.from('facebook_posts_automation').insert([payload]);
                saveErr = iErr;
            }

            if (saveErr) throw saveErr;

            alert("Facebook automation saved successfully! 🚀");
            document.getElementById("automationOptionsCard").style.display = "none";
            
        } catch (err) {
            console.error("Save Error:", err);
            alert("Error saving configuration: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});
