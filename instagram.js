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

// ==========================================
// 2. DYNAMIC INSTAGRAM STREAM ENGINE
// ==========================================
async function loadInstagramPageData() {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) {
            window.location.href = "login.html";
            return;
        }

        const user = data.session.user;
        currentUserUuid = user.id;
        
        // ப்ரொஃபைல் கார்டில் பயனர் மின்னஞ்சல் மற்றும் பெயரைப் புதுப்பித்தல்
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

        // 🎯 சாண்ட்பாக்ஸ் லைவ் டேட்டா: அசல் போஸ்ட்கள் மற்றும் ரீல்ஸ்கள் போலவே பியூட்டிஃபுல்லாக ரெண்டர் செய்கிறோம்
        const mockInstagramPosts = [
            { id: "ig_reel_101", type: "video", title: "🚀 Instagram Growth Reel #01", date: "June 29, 2026", color: "linear-gradient(135deg, #ec4899, #7c3aed)" },
            { id: "ig_post_102", type: "image", title: "🎯 Business Promo Post #02", date: "June 27, 2026", color: "linear-gradient(135deg, #f43f5e, #f59e0b)" },
            { id: "ig_reel_103", type: "video", title: "🛍️ New Collection Launch Reel #03", date: "July 02, 2026", color: "linear-gradient(135deg, #10b981, #3b82f6)" }
        ];

        postsContainer.innerHTML = ""; // கண்டெய்னரை சுத்தம் செய்தல்

        mockInstagramPosts.forEach(post => {
            const icon = post.type === "video" ? "fa-video" : "fa-image";
            
            const postRow = document.createElement("div");
            postRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 4px;";
            postRow.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; background: ${post.color}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid ${icon}" style="margin:0; font-size: 16px; color: #fff;"></i>
                    </div>
                    <div style="text-align: left;">
                        <h4 style="font-size: 15px; font-weight: 600; margin: 0; color: #fff;">${post.title}</h4>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Published: ${post.date}</p>
                    </div>
                </div>
                <button class="link-insta-btn" data-post-id="${post.id}" style="width: auto; padding: 8px 20px; font-size: 13px; margin: 0; background: linear-gradient(135deg, #ec4899, #7c3aed); border:none; color:#fff; border-radius:8px; cursor:pointer; font-weight:600;">Link</button>
            `;
            postsContainer.appendChild(postRow);
        });

        // ⚡ பட்டன் கிளிக்குகளை ஏபிஐ கார்டுடன் இணைத்தல்
        bindLinkButtons(user.id);

    } catch (gErr) { 
        console.error(gErr); 
    }
}

// ==========================================
// 3. AUTOMATION CARD CONTROLS
// ==========================================
function bindLinkButtons(userUuid) {
    document.querySelectorAll(".link-insta-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const postId = btn.getAttribute("data-post-id");
            const title = btn.parentElement.querySelector("h4").innerText;
            openAutomationOptions(postId, title, userUuid);
        });
    });
}

async function openAutomationOptions(postId, postTitle, userUuid) {
    currentActivePostId = postId;
    const titleEl = document.getElementById("selectedPostTitle");
    if (titleEl) titleEl.innerText = "Link Settings: " + postTitle;
    
    const optionsCard = document.getElementById("automationOptionsCard");
    if (optionsCard) {
        optionsCard.style.display = "block";
        optionsCard.scrollIntoView({ behavior: 'smooth' });
    }
}

// க்ளோஸ் மற்றும் கீவேர்ட்ஸ் டாக்ஃகுள் லாஜிக்
document.addEventListener("DOMContentLoaded", () => {
    loadInstagramPageData();

    const closeBtn = document.getElementById("closeOptionsBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const card = document.getElementById("automationOptionsCard");
            if (card) card.style.display = "none";
        });
    }

    const triggerMechanism = document.getElementById("triggerMechanism");
    if (triggerMechanism) {
        triggerMechanism.addEventListener("change", () => {
            const wrapper = document.getElementById("keywordInputWrapper");
            if (wrapper) wrapper.style.display = (triggerMechanism.value === "keywords") ? "block" : "none";
        });
    }
});

// ==========================================
// 4. ACTION SAVE TO SUPABASE
// ==========================================
const savePostAutomationBtn = document.getElementById("savePostAutomationBtn");
if (savePostAutomationBtn) {
    savePostAutomationBtn.addEventListener("click", async () => {
        if (!currentUserUuid) return;

        const mechanismEl = document.getElementById("triggerMechanism");
        const targetKeywordsEl = document.getElementById("targetKeywords");
        const excludeEl = document.getElementById("excludeKeywords");
        const commentCheckEl = document.getElementById("commentAutoReplyCheck");
        const dmCheckEl = document.getElementById("sendDMCheck");
        const delayEl = document.getElementById("delayTime");
        const btnTitleEl = document.getElementById("templateBtnTitle");
        const urlEl = document.getElementById("templateUrl");
        const descEl = document.getElementById("templateDescription");

        // இன்ஸ்டாகிராம் ஆட்டோமேஷன் விதிகளை சுபாபேஸில் சேமித்தல் (ig_ columns)
        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: currentUserUuid,
                ig_active_post_id: currentActivePostId,
                ig_trigger_type: mechanismEl ? mechanismEl.value : "all",
                ig_target_keywords: targetKeywordsEl ? targetKeywordsEl.value.trim() : "",
                ig_exclude_keywords: excludeEl ? excludeEl.value.trim() : "",
                ig_comment_reply_active: commentCheckEl ? commentCheckEl.checked : false,
                ig_dm_active: dmCheckEl ? dmCheckEl.checked : false,
                ig_delay: delayEl ? delayEl.value.trim() : "",
                ig_btn_title: btnTitleEl ? btnTitleEl.value.trim() : "",
                ig_url: urlEl ? urlEl.value.trim() : "",
                ig_desc: descEl ? descEl.value.trim() : "",
                updated_at: new Date()
            });

        if (error) {
            alert("Instagram Sync Failed: " + error.message);
        } else {
            alert(`Automation Linked for ${currentActivePostId} Successfully! 🚀🎉`);
            const card = document.getElementById("automationOptionsCard");
            if (card) card.style.display = "none";
        }
    });
}

// NAVIGATION
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
