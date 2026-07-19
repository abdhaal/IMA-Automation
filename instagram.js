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
// 2. FETCH AND RENDER REAL INSTAGRAM POSTS
// ==========================================
async function loadInstagramPageData() {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) { window.location.href = "login.html"; return; }

        currentUserUuid = data.session.user.id;
        
        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('instagram_access_token, instagram_business_id')
            .eq('id', currentUserUuid)
            .maybeSingle();

        if (!profileData) return;

        const metaApiUrl = `https://graph.facebook.com/v20.0/${profileData.instagram_business_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count&access_token=${profileData.instagram_access_token}`;
        
        const response = await fetch(metaApiUrl);
        const metaJson = await response.json();

        postsContainer.innerHTML = "";
        metaJson.data.forEach(post => {
            // 💡 VIDEO/REELS Thumbnail fix
            const mediaThumb = (post.media_type === "VIDEO" || post.media_type === "REELS") ? (post.thumbnail_url || post.media_url) : post.media_url;
            
            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <img src="${mediaThumb}" class="post-thumb" alt="thumb">
                <div class="post-details">
                    <h4>${post.caption ? post.caption.substring(0, 30) + "..." : "Instagram Post"}</h4>
                    <button class="replyrush-btn" data-post-id="${post.id}" data-img="${mediaThumb}">Link Post Setup</button>
                </div>
            `;
            postsContainer.appendChild(card);
        });
        bindLinkButtons();
    } catch (gErr) { console.error(gErr); }
}

function bindLinkButtons() {
    document.querySelectorAll(".replyrush-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentActivePostId = btn.getAttribute("data-post-id");
            base64CustomUploadedImage = btn.getAttribute("data-img");
            updatePreviewImage(base64CustomUploadedImage);
            document.getElementById("automationOptionsCard").style.display = "grid";
            window.toggleAccordion('triggerAcc');
            triggerLiveMirrorUpdate();
        });
    });
}

// ==========================================
// 4. REAL-TIME LIVE PREVIEW CONTROLLER
// ==========================================
function triggerLiveMirrorUpdate() {
    // 💡 First Message Text & Button Title
    const firstMsgText = document.getElementById("customEngagementText")?.value || "Hi 👋 Thanks for your comment!";
    const firstMsgBtnTitle = document.getElementById("engagementBtnTitle")?.value || "Send Link Now";

    // 💡 Second Message Card
    const headlineValue = document.getElementById("templateHeadline")?.value || "Card Headline";
    const descValue = document.getElementById("templateDescription")?.value || "Template Description...";

    // Update First Bubble
    const bubble = document.getElementById("previewEngagementBubble");
    if (bubble) {
        bubble.innerHTML = `${firstMsgText}<br><br><div style="background:#e2e8f0; color:#1e293b; padding:8px; border-radius:6px; text-align:center; font-weight:600; font-size:12px; border:1px solid #cbd5e1; cursor:pointer;">${firstMsgBtnTitle}</div>`;
    }

    // Update Second Card
    const liveHeadline = document.getElementById("livePreviewHeadline");
    const liveDesc = document.getElementById("livePreviewDesc");
    const liveBtn = document.getElementById("livePreviewBtn");

    if (liveHeadline) liveHeadline.innerText = headlineValue;
    if (liveDesc) liveDesc.innerText = descValue;
    if (liveBtn) liveBtn.innerText = "🛍️ Buy"; // Card button fixed to Buy
}

// ==========================================
// 5. INPUT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadInstagramPageData();
    
    // Add listeners for every text input to auto-update preview
    ["customEngagementText", "engagementBtnTitle", "templateHeadline", "templateDescription"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", triggerLiveMirrorUpdate);
    });

    // Product Link Image Update
    document.getElementById("templateUrl")?.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (document.querySelector("input[name='imageSourceToggle']:checked")?.value === "auto" && url.startsWith("http")) {
            base64CustomUploadedImage = url;
            updatePreviewImage(url);
        }
    });

    document.getElementById("manualImageFileInput")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                base64CustomUploadedImage = ev.target.result;
                updatePreviewImage(base64CustomUploadedImage);
            };
            reader.readAsDataURL(file);
        }
    });
});

function updatePreviewImage(srcPath) {
    const imgSlot = document.getElementById("previewImageSlot");
    if (imgSlot) imgSlot.innerHTML = `<img src="${srcPath}" style="width:100%; height:100%; object-fit:cover;">`;
}

// ==========================================
// 6. SAVE HANDLER
// ==========================================
document.getElementById("savePostAutomationBtn")?.addEventListener("click", async () => {
    if (!currentUserUuid) return;

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: currentUserUuid,
            ig_active_post_id: currentActivePostId,
            ig_custom_engagement_text: document.getElementById("customEngagementText")?.value.trim() || "",
            ig_btn_title: document.getElementById("engagementBtnTitle")?.value.trim() || "", // First button
            ig_headline: document.getElementById("templateHeadline")?.value.trim() || "",
            ig_desc: document.getElementById("templateDescription")?.value.trim() || "",
            ig_url: document.getElementById("templateUrl")?.value.trim() || "",
            ig_custom_image_data: base64CustomUploadedImage,
            updated_at: new Date()
        });

    if (error) {
        alert("Sync Failed: " + error.message);
    } else {
        alert("Configuration Saved Successfully! 🚀");
        document.getElementById("automationOptionsCard").style.display = "none";
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
        if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); window.location.href = link.url; });
    });
});
