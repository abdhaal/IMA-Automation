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
// 2. FETCH AND RENDER REAL INSTAGRAM POSTS & REELS
// ==========================================
async function loadInstagramPageData() {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        // Auth session validation check
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) {
            window.location.href = "login.html";
            return;
        }

        const user = data.session.user;
        currentUserUuid = user.id;
        
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

        postsContainer.innerHTML = "<p style='color:#94a3b8; font-size:14px; text-align:center; width:100%; padding:20px;'><i class='fa-solid fa-spinner fa-spin'></i> Syncing your live Instagram posts and reels...</p>";

        // 🎯 REAL API TO FETCH POSTS (சுபாபேஸில் சேமிக்கப்பட்டுள்ள Meta Access Token மூலமாக அசல் போஸ்ட்களை எடுக்கிறது)
        const { data: profileData, error: dbErr } = await supabaseClient
            .from('profiles')
            .select('instagram_access_token, instagram_business_id')
            .eq('id', currentUserUuid)
            .single();

        // உங்க அக்கவுண்ட் இன்னும் மெட்டாவில் லிங்க் ஆகவில்லை என்றால், சாண்ட்பாக்ஸ் மாடல் போஸ்ட்களைக் காட்டும்
        if (dbErr || !profileData || !profileData.instagram_access_token) {
            console.log("No active Meta token found, loading local interactive sandbox streams.");
            loadSandboxFallbackPosts();
            return;
        }

        // Meta Graph API integration channel endpoint
        const metaApiUrl = `https://graph.facebook.com/v20.0/${profileData.instagram_business_id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,comments_count,like_count&access_token=${profileData.instagram_access_token}`;
        
        const response = await fetch(metaApiUrl);
        const metaJson = await response.json();

        if (!metaJson.data || metaJson.data.length === 0) {
            postsContainer.innerHTML = "<p style='color:#94a3b8; text-align:center; width:100%;'>No active posts found on your Instagram feed.</p>";
            return;
        }

        postsContainer.innerHTML = "";
        metaJson.data.forEach(post => {
            // Video / Reel Fallback thumbnail logic
            const mediaThumb = (post.media_type === "VIDEO") ? "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400" : post.media_url;
            const captionText = post.caption ? post.caption.substring(0, 50) + "..." : "Instagram Feed Media Stream";
            const formattedDate = new Date(post.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <img src="${mediaThumb}" class="post-thumb" alt="thumb">
                <div class="post-meta-badges">
                    <span class="meta-badge"><i class="fa-solid fa-comment" style="color:#ec4899;"></i> ${post.comments_count || 0}</span>
                    <span class="meta-badge"><i class="fa-solid fa-heart" style="color:#f43f5e;"></i> ${post.like_count || 0}</span>
                </div>
                <div class="post-details">
                    <div>
                        <h4>${captionText}</h4>
                        <p><i class="fa-solid fa-clock"></i> ${formattedDate}</p>
                    </div>
                    <button class="replyrush-btn" data-post-id="${post.id}" data-img="${mediaThumb}">
                        <i class="fa-solid fa-link"></i> Link Post Setup
                    </button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

        bindLinkButtons();

    } catch (gErr) { 
        console.error(gErr);
        loadSandboxFallbackPosts(); 
    }
}

// FALLBACK SANDBOX DATA ENGINE
function loadSandboxFallbackPosts() {
    const postsContainer = document.getElementById("postsContainer");
    const mockInstagramPosts = [
        { id: "ig_01", title: "Smart Solar Step Lights for Stairs & Walls! 🔥", date: "04 Jul 2026", img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80", comments: "48", likes: "2.4k" },
        { id: "ig_02", title: "Stop Dust, Insects & AC Cooling Loss with This!", date: "04 Jul 2026", img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80", comments: "12", likes: "840" },
        { id: "ig_03", title: "High Power 3-in-1 Mini Vacuum Cleaner for Car 🚗", date: "03 Jul 2026", img: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80", comments: "93", likes: "4.1k" }
    ];

    postsContainer.innerHTML = "";
    mockInstagramPosts.forEach(post => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
            <img src="${post.img}" class="post-thumb" alt="thumb">
            <div class="post-meta-badges">
                <span class="meta-badge"><i class="fa-solid fa-comment" style="color:#ec4899;"></i> ${post.comments}</span>
                <span class="meta-badge"><i class="fa-solid fa-heart" style="color:#f43f5e;"></i> ${post.likes}</span>
            </div>
            <div class="post-details">
                <div>
                    <h4>${post.title}</h4>
                    <p><i class="fa-solid fa-clock"></i> ${post.date}</p>
                </div>
                <button class="replyrush-btn" data-post-id="${post.id}" data-img="${post.img}">
                    <i class="fa-solid fa-link"></i> Link Post Setup
                </button>
            </div>
        `;
        postsContainer.appendChild(card);
    });
    bindLinkButtons();
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
            
            document.getElementById("selectedPostTitle").innerText = "Link Settings: " + title;
            base64CustomUploadedImage = postImg; 

            const imgSlot = document.getElementById("previewImageSlot");
            if (imgSlot) { imgSlot.innerHTML = `<img src="${postImg}" style="width:100%; height:100%; object-fit:cover;" id="actualPreviewedImageSrc">`; }

            document.getElementById("automationOptionsCard").style.display = "grid";
            document.getElementById("automationOptionsCard").scrollIntoView({ behavior: 'smooth' });
            
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

    if (!hBlock || !dBlock || !bBlock || !uBlock || !richCard || !imgSlot || !bodyContent || !liveBtn || !mSourceBlock || !autoRadioLabel) return;

    hBlock.style.display = "block";
    dBlock.style.display = "block";
    bBlock.style.display = "block";
    uBlock.style.display = "block";
    mSourceBlock.style.display = "block";
    autoRadioLabel.style.display = "flex";
    richCard.style.display = "flex";
    imgSlot.style.display = "flex";
    bodyContent.style.display = "block";
    liveBtn.style.display = "block";

    if (type === "media") {
        // Keeps all blocks visible
    } else if (type === "attach") {
        autoRadioLabel.style.display = "none";
        const manualRadio = document.querySelector("input[name='imageSourceToggle'][value='manual']");
        if (manualRadio) {
            manualRadio.checked = true;
            document.getElementById("manualUploadWrapper").style.display = "block";
            document.getElementById("autoFetchWrapper").style.display = "none";
        }
        hBlock.style.display = "none";
        dBlock.style.display = "none";
        bBlock.style.display = "none";
        uBlock.style.display = "none";
        bodyContent.style.display = "none";
        liveBtn.style.display = "none";
    } else if (type === "text") {
        hBlock.style.display = "none";
        bBlock.style.display = "none";
        uBlock.style.display = "none";
        mSourceBlock.style.display = "none";
        imgSlot.style.display = "none";
        liveBtn.style.display = "none";
    } else if (type === "quick" || type === "button") {
        imgSlot.style.display = "none";
        mSourceBlock.style.display = "none";
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

    if (!liveHeadline || !liveDesc || !liveBtn) return;

    if (currentSelectedTemplateType === "text") {
        liveDesc.innerText = document.getElementById("templateDescription")?.value || "Text Message flow placeholder...";
        liveHeadline.innerText = "";
    } else {
        liveHeadline.innerText = headlineValue;
        liveDesc.innerText = descValue;
        liveBtn.innerText = btnTitleValue;
    }
}

// ==========================================
// 5. INPUT ACTION LISTENERS CONTROL SETUP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadInstagramPageData();

    document.getElementById("closeOptionsBtn")?.addEventListener("click", () => {
        document.getElementById("automationOptionsCard").style.display = "none";
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
            if (e.target.value === "manual") {
                document.getElementById("manualUploadWrapper").style.display = "block";
                document.getElementById("autoFetchWrapper").style.display = "none";
            } else {
                document.getElementById("manualUploadWrapper").style.display = "none";
                document.getElementById("autoFetchWrapper").style.display = "block";
                const activeUrl = document.getElementById("templateUrl").value.trim();
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
            const fallbackSrc = currentActivePostBtn ? currentActivePostBtn.getAttribute("data-img") : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
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
// 6. SAVE HANDLER TO SUPABASE DB
// ==========================================
document.getElementById("savePostAutomationBtn")?.addEventListener("click", async () => {
    if (!currentUserUuid) return;

    const selectedImageSource = document.querySelector("input[name='imageSourceToggle']:checked")?.value || "manual";

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: currentUserUuid,
            ig_active_post_id: currentActivePostId,
            ig_trigger_type: document.getElementById("triggerMechanism")?.value || "all",
            ig_target_keywords: document.getElementById("targetKeywords")?.value.trim() || "",
            ig_exclude_keywords: document.getElementById("excludeKeywords")?.value.trim() || "",
            
            ig_comment_reply_active: document.getElementById("commentAutoReplyCheck")?.checked || false,
            ig_custom_comment_text: document.getElementById("customCommentReplyText")?.value.trim() || "",
            ig_dm_active: document.getElementById("sendDMCheck")?.checked || false,
            ig_custom_engagement_text: document.getElementById("customEngagementText")?.value.trim() || "",
            
            ig_delay: document.getElementById("delayTime")?.value.trim() || "",
            ig_template_type: currentSelectedTemplateType,
            ig_image_source_mode: selectedImageSource,
            ig_custom_image_data: base64CustomUploadedImage, 
            
            ig_btn_title: document.getElementById("templateBtnTitle")?.value.trim() || "",
            ig_headline: document.getElementById("templateHeadline")?.value.trim() || "",
            ig_url: document.getElementById("templateUrl")?.value.trim() || "",
            ig_desc: document.getElementById("templateDescription")?.value.trim() || "",
            updated_at: new Date()
        });

    if (error) {
        alert("Instagram Sync Failed: " + error.message);
    } else {
        alert("Configuration Saved and Real-time Media Flows Synced Successfully! 🚀🎉");
        const optionsCard = document.getElementById("automationOptionsCard");
        if (optionsCard) optionsCard.style.display = "none";
    }
});

// CORE NAVIGATION
document.addEventListener("DOMContentLoaded", () => {
    const navLinks = [
        { id: "dashboardBtn", url: "dashboard.html" },
        { id: "instagramBtn", url: "instagram.html" },
        { id: "facebookBtn", url: "facebook.html" },
        { id: "automationBtn", url: "automation.html" },
        { id: "commentsBtn", url: "comments.html" },
        { id: "autodmBtn", url: "autodm.html" },
        { id: "keywordsBtn", url: "keywords.html" },
        { id: "analyticsBtn", url: "analytics.html" },
        { id: "settingsBtn", url: "settings.html" }
    ];
    navLinks.forEach(link => {
        const btn = document.getElementById(link.id);
        if (btn) btn.addEventList
