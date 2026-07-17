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
let currentSelectedTemplateType = "media";
let base64CustomUploadedImage = ""; 

// ==========================================
// 2. FETCH AND RENDER REAL FACEBOOK POSTS
// ==========================================
async function loadFacebookPageData() {
    // உங்க facebook.html-ல் இருக்கும் ஃபீட் கன்டைனர் ID
    const postsContainer = document.getElementById("postsContainer") || document.getElementById("facebookFeedGrid");
    if (!postsContainer) return;

    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) {
            window.location.href = "login.html";
            return;
        }

        const user = data.session.user;
        currentUserUuid = user.id;
        
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

        postsContainer.innerHTML = "<p style='color:#94a3b8; font-size:14px; text-align:center; width:100%; padding:20px;'><i class='fa-solid fa-spinner fa-spin'></i> Fetching your live Facebook page posts...</p>";

        // சுபாபேஸ் டேட்டாபேஸில் இருந்து உங்க அசல் மெட்டா டோக்கனை எடுக்கிறது (Profiles Table)
        const { data: profileData, error: dbErr } = await supabaseClient
            .from('profiles')
            .select('instagram_access_token, facebook_page_id') // இங்க உங்க டோக்கன் மற்றும் FB Page ID-ஐ எடுக்கிறோம்
            .eq('id', currentUserUuid)
            .maybeSingle();

        // டோக்கன் அல்லது ஃபேஸ்புக் பேஜ் ஐடி இல்லை என்றால் அலர்ட் காட்டும்
        if (dbErr || !profileData || !profileData.instagram_access_token || !profileData.facebook_page_id) {
            postsContainer.innerHTML = `
                <div style='text-align:center; width:100%; padding:40px; color:#94a3b8;'>
                    <i class="fa-brands fa-facebook" style="font-size: 40px; color: #1877f2; margin-bottom: 15px;"></i>
                    <p style="font-size:15px; margin-bottom:15px;">Your Facebook Page is not linked yet.</p>
                    <p style="font-size:13px; color:#64748b;">Please connect your Facebook Page in Settings to view your live feed.</p>
                </div>`;
            return;
        }

        // Meta Graph API Facebook Page Feed Endpoint Connection
        const metaApiUrl = `https://graph.facebook.com/v20.0/${profileData.facebook_page_id}/feed?fields=id,message,created_time,full_picture,likes.summary(true),comments.summary(true)&access_token=${profileData.instagram_access_token}`;
        
        const response = await fetch(metaApiUrl);
        const metaJson = await response.json();

        if (metaJson.error) {
            postsContainer.innerHTML = `<p style='color:#ef4444; text-align:center; width:100%; padding:20px;'>Meta API Error: ${metaJson.error.message}</p>`;
            return;
        }

        if (!metaJson.data || metaJson.data.length === 0) {
            postsContainer.innerHTML = "<p style='color:#94a3b8; text-align:center; width:100%; padding:20px;'>No posts found on your active Facebook Page profile.</p>";
            return;
        }

        postsContainer.innerHTML = "";
        metaJson.data.forEach(post => {
            // ஃபேஸ்புக் போஸ்டில் படம் இருந்தால் அதை எடுக்கும், இல்லை என்றால் டீஃபால்ட் பிசினஸ் படம்
            const mediaThumb = post.full_picture || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400";
            const captionText = post.message ? post.message.substring(0, 55) + "..." : "Facebook Wall Post";
            const formattedDate = new Date(post.created_time).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const likesCount = post.likes ? post.likes.summary.total_count : 0;
            const commentsCount = post.comments ? post.comments.summary.total_count : 0;

            const card = document.createElement("div");
            card.className = "post-card";
            card.style.background = "#ffffff";
            card.style.padding = "15px";
            card.style.borderRadius = "10px";
            card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
            
            card.innerHTML = `
                <img src="${mediaThumb}" class="post-thumb" alt="thumb" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
                <div class="post-meta-badges" style="margin-top:10px; display:flex; gap:10px;">
                    <span class="meta-badge"><i class="fa-solid fa-comment" style="color:#1877f2;"></i> ${commentsCount}</span>
                    <span class="meta-badge"><i class="fa-solid fa-thumbs-up" style="color:#1877f2;"></i> ${likesCount}</span>
                </div>
                <div class="post-details" style="margin-top:10px;">
                    <div>
                        <h4 style="margin:0 0 5px 0; font-size:14px;">${captionText}</h4>
                        <p style="margin:0 0 10px 0; font-size:12px; color:gray;"><i class="fa-solid fa-clock"></i> ${formattedDate}</p>
                    </div>
                    <button class="replyrush-btn" data-post-id="${post.id}" data-img="${mediaThumb}" style="width:100%; padding:8px; border:none; background:#1877f2; color:white; border-radius:6px; cursor:pointer;">
                        <i class="fa-solid fa-link"></i> Link Post Setup
                    </button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

        bindLinkButtons();

    } catch (gErr) { 
        console.error(gErr);
        postsContainer.innerHTML = "<p style='color:#ef4444; text-align:center; width:100%; padding:20px;'>Failed to load live Facebook feed. Please check connection.</p>";
    }
}

// ==========================================
// 3. ACCORDION VIEW CONTROLLERS
// ==========================================
window.toggleAccordion = function(accId) {
    const content = document.getElementById(accId);
    if (!content) return;
    const isVisible = content.style.display === "block";
    
    document.querySelectorAll(".accordion-content").forEach(el => { el.style.display = "none"; });
    document.querySelectorAll(".accordion-header i").forEach(el => { el.className = "fa-solid fa-chevron-down"; });
    
    if (!isVisible) {
        content.style.display = "block";
        const header = content.previousElementSibling;
        if (header && header.querySelector("i")) { header.querySelector("i").className = "fa-solid fa-chevron-up"; }
    }
};

function bindLinkButtons() {
    document.querySelectorAll(".replyrush-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            currentActivePostId = btn.getAttribute("data-post-id");
            const title = btn.closest(".post-card").querySelector("h4").innerText;
            const postImg = btn.getAttribute("data-img");
            
            const titleEl = document.getElementById("selectedPostTitle");
            if (titleEl) titleEl.innerText = "Facebook Link Settings: " + title;
            
            base64CustomUploadedImage = postImg; 

            const imgSlot = document.getElementById("previewImageSlot");
            if (imgSlot) { imgSlot.innerHTML = `<img src="${postImg}" style="width:100%; height:100%; object-fit:cover;" id="actualPreviewedImageSrc">`; }

            const optionsCard = document.getElementById("automationOptionsCard");
            if (optionsCard) {
                optionsCard.style.display = "grid";
                optionsCard.scrollIntoView({ behavior: 'smooth' });
            }
            
            window.toggleAccordion('triggerAcc');
        });
    });
}

// ==========================================
// 4. REAL-TIME MULTI-TEMPLATE CONTROLLER
// ==========================================
function handleTemplateTypeSwitch(type) {
    currentSelectedTemplateType = type;
    
    const hBlock = document.getElementById("headlineFieldBlock");
    const dBlock = document.getElementById("descriptionFieldBlock");
    const bBlock = document.getElementById("buttonTitleFieldBlock");
    const uBlock = document.getElementById("urlFieldBlock");
    const mSourceBlock = document.getElementById("mediaSourceSelectionBlock");
    const autoRadioLabel = document.getElementById("autoFetchRadioLabel");
    
    const richCard = document.getElementById("previewRichCardContainer");
    const imgSlot = document.getElementById("previewImageSlot");
    const bodyContent = document.getElementById("previewCardBodyContent");
    const liveBtn = document.getElementById("livePreviewBtn");

    if (hBlock) hBlock.style.display = "block";
    if (dBlock) dBlock.style.display = "block";
    if (bBlock) bBlock.style.display = "block";
    if (uBlock) uBlock.style.display = "block";
    if (mSourceBlock) mSourceBlock.style.display = "block";
    if (autoRadioLabel) autoRadioLabel.style.display = "flex";
    if (richCard) richCard.style.display = "flex";
    if (imgSlot) imgSlot.style.display = "flex";
    if (bodyContent) bodyContent.style.display = "block";
    if (liveBtn) liveBtn.style.display = "block";

    if (type === "media") {
        // Keeps all blocks visible
    } else if (type === "attach") {
        if (autoRadioLabel) autoRadioLabel.style.display = "none";
        const manualRadio = document.querySelector("input[name='imageSourceToggle'][value='manual']");
        if (manualRadio) {
            manualRadio.checked = true;
            const manWrap = document.getElementById("manualUploadWrapper");
            const autoWrap = document.getElementById("autoFetchWrapper");
            if (manWrap) manWrap.style.display = "block";
            if (autoWrap) autoWrap.style.display = "none";
        }
        if (hBlock) hBlock.style.display = "none";
        if (dBlock) dBlock.style.display = "none";
        if (bBlock) bBlock.style.display = "none";
        if (uBlock) uBlock.style.display = "none";
        if (bodyContent) bodyContent.style.display = "none";
        if (liveBtn) liveBtn.style.display = "none";
    } else if (type === "text") {
        if (hBlock) hBlock.style.display = "none";
        if (bBlock) bBlock.style.display = "none";
        if (uBlock) uBlock.style.display = "none";
        if (mSourceBlock) mSourceBlock.style.display = "none";
        if (imgSlot) imgSlot.style.display = "none";
        if (liveBtn) liveBtn.style.display = "none";
    } else if (type === "quick" || type === "button") {
        if (imgSlot) imgSlot.style.display = "none";
        if (mSourceBlock) mSourceBlock.style.display = "none";
    }
    
    triggerLiveMirrorUpdate();
}

function triggerLiveMirrorUpdate() {
    const headlineValue = document.getElementById("templateHeadline")?.value || "Card Headline";
    const descValue = document.getElementById("templateDescription")?.value || "Template Description text goes here...";
    const btnTitleValue = document.getElementById("templateBtnTitle")?.value || "Button Title";

    const liveHeadline = document.getElementById("livePreviewHeadline");
    const liveDesc = document.getElementById("livePreviewDesc");
    const liveBtn = document.getElementById("livePreviewBtn");

    if (currentSelectedTemplateType === "text") {
        if (liveDesc) liveDesc.innerText = document.getElementById("templateDescription")?.value || "Text Message flow placeholder...";
        if (liveHeadline) liveHeadline.innerText = "";
    } else {
        if (liveHeadline) liveHeadline.innerText = headlineValue;
        if (liveDesc) liveDesc.innerText = descValue;
        if (liveBtn) {
            liveBtn.style.display = "block";
            liveBtn.innerText = btnTitleValue;
        }
    }
}

// ==========================================
// 5. INPUT ACTION LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadFacebookPageData();

    document.getElementById("closeOptionsBtn")?.addEventListener("click", () => {
        const optionsCard = document.getElementById("automationOptionsCard");
        if (optionsCard) optionsCard.style.display = "none";
    });

    document.getElementById("triggerMechanism")?.addEventListener("change", (e) => {
        const wrapper = document.getElementById("keywordInputWrapper");
        if (wrapper) wrapper.style.display = (e.target.value === "keywords") ? "block" : "none";
    });

    document.getElementById("commentAutoReplyCheck")?.addEventListener("change", (e) => {
        const wrapper = document.getElementById("commentTextInputWrapper");
        if (wrapper) wrapper.style.display = e.target.checked ? "block" : "none";
    });

    document.getElementById("sendDMCheck")?.addEventListener("change", (e) => {
        const wrapper = document.getElementById("engagementTextInputWrapper");
        const bubble = document.getElementById("previewEngagementBubble");
        if (wrapper) wrapper.style.display = e.target.checked ? "block" : "none";
        if (bubble) bubble.style.display = e.target.checked ? "block" : "none";
    });

    document.getElementById("customEngagementText")?.addEventListener("input", (e) => {
        const bubble = document.getElementById("previewEngagementBubble");
        if (bubble) bubble.innerText = e.target.value || "Hi there! Thanks for your interest! 👋";
    });

    document.getElementById("templateHeadline")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("templateDescription")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("templateBtnTitle")?.addEventListener("input", triggerLiveMirrorUpdate);

    document.querySelectorAll("input[name='imageSourceToggle']").forEach(radio => {
        radio.addEventListener("change", (e) => {
            const manWrap = document.getElementById("manualUploadWrapper");
            const autoWrap = document.getElementById("autoFetchWrapper");
            if (e.target.value === "manual") {
                if (manWrap) manWrap.style.display = "block";
                if (autoWrap) autoWrap.style.display = "none";
            } else {
                if (manWrap) manWrap.style.display = "none";
                if (autoWrap) autoWrap.style.display = "block";
                const activeUrl = document.getElementById("templateUrl")?.value.trim();
                if (activeUrl && activeUrl.startsWith("http")) { processSmartAutoImageFetch(activeUrl); }
            }
        });
    });

    document.getElementById("manualImageFileInput")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                base64CustomUploadedImage = event.target.result;
                updatePreviewImage(base64CustomUploadedImage);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("templateUrl")?.addEventListener("input", (e) => {
        const targetUrl = e.target.value.trim();
        const selectedRadio = document.querySelector("input[name='imageSourceToggle']:checked")?.value;
        if (selectedRadio === "auto" && targetUrl.startsWith("http")) {
            processSmartAutoImageFetch(targetUrl);
        }
    });

    function processSmartAutoImageFetch(urlStr) {
        if (urlStr.match(/\.(jpeg|jpg|gif|png|webp)/i) != null) {
            base64CustomUploadedImage = urlStr;
            updatePreviewImage(urlStr);
        } else {
            const currentActivePostBtn = document.querySelector(`.replyrush-btn[data-post-id='${currentActivePostId}']`);
            const fallbackSrc = currentActivePostBtn ? currentActivePostBtn.getAttribute("data-img") : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400";
            base64CustomUploadedImage = fallbackSrc;
            updatePreviewImage(fallbackSrc);
        }
    }

    function updatePreviewImage(srcPath) {
        const imgSlot = document.getElementById("previewImageSlot");
        if (imgSlot) {
            imgSlot.innerHTML = `<img src="${srcPath}" style="width:100%; height:100%; object-fit:cover;" id="actualPreviewedImageSrc">`;
        }
    }

    document.querySelectorAll(".template-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".template-type-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            handleTemplateTypeSwitch(btn.getAttribute("data-type"));
        });
    });
});

// ==========================================
// 6. SAVE HANDLER TO SUPABASE DB (FACEBOOK AUTOMS)
// ==========================================
document.getElementById("savePostAutomationBtn")?.addEventListener("click", async () => {
    if (!currentUserUuid) return;

    const selectedImageSource = document.querySelector("input[name='imageSourceToggle']:checked")?.value || "manual";

    // ஃபேஸ்புக் ஆட்டோமேஷன் ரூல்களை பாதுகாப்பாக சுபாபேஸ் ப்ரொஃபைலில் அப்சர்ட் செய்கிறோம்
    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: currentUserUuid,
            fb_active_post_id: currentActivePostId, // Facebook Active Post Id 
            fb_trigger_type: document.getElementById("triggerMechanism")?.value || "all",
            fb_target_keywords: document.getElementById("targetKeywords")?.value.trim() || "",
            fb_exclude_keywords: document.getElementById("excludeKeywords")?.value.trim() || "",
            
            fb_comment_reply_active: document.getElementById("commentAutoReplyCheck")?.checked || false,
            fb_custom_comment_text: document.getElementById("customCommentReplyText")?.value.trim() || "",
            fb_dm_active: document.getElementById("sendDMCheck")?.checked || false,
            fb_custom_engagement_text: document.getElementById("customEngagementText")?.value.trim() || "",
            
            fb_delay: document.getElementById("delayTime")?.value.trim() || "",
            fb_template_type: currentSelectedTemplateType,
            fb_image_source_mode: selectedImageSource,
            fb_custom_image_data: base64CustomUploadedImage, 
            
            fb_btn_title: document.getElementById("templateBtnTitle")?.value.trim() || "",
            fb_headline: document.getElementById("templateHeadline")?.value.trim() || "",
            fb_url: document.getElementById("templateUrl")?.value.trim() || "",
            fb_desc: document.getElementById("templateDescription")?.value.trim() || "",
            updated_at: new Date()
        });

    if (error) {
        alert("Facebook Sync Failed: " + error.message);
    } else {
        alert("Facebook Configuration Saved and Real-time Media Flows Synced Successfully! 🚀🎉");
        const optionsCard = document.getElementById("automationOptionsCard");
        if (optionsCard) optionsCard.style.display = "none";
    }
});

// CORE NAVIGATION
document.addEventListener("DOMContentLoaded", () => {
    const navLinks = [
        { id: "dashboardBtn", url: "dashboard.html" },
        { id: "instagramBtn", url: "instagram.html" },
        { id: "facebookBtn"
