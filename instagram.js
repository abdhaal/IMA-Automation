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
// 2. FETCH LIVE INSTAGRAM POSTS & REELS
// ==========================================
async function loadInstagramPageData() {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        // பயனர் செஷனைச் சரிபார்த்தல் மற்றும் டாப் கார்டு அப்டேட்
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data || !data.session) {
            window.location.href = "login.html";
            return;
        }

        const user = data.session.user;
        currentUserUuid = user.id;

        // 🎯 "User Loading..." பிரச்சனையைத் தீர்க்கும் டாப் கார்டு பிக்ஸ்!
        const userContainer = document.querySelector(".user-profile-card") || document.body; 
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];
        
        // ஒருவேளை அங்கே "User Loading..." என்று டெக்ஸ்ட் இருந்தால் அதை நேரடியாக மாற்றுகிறது
        const loadingTextEl = Array.from(document.querySelectorAll("span, p, div")).find(el => el.textContent.includes("Loading..."));
        if (loadingTextEl) {
            loadingTextEl.innerHTML = `<span style="font-weight:600; color:#fff;">${user.email.split("@")[0]}</span><br><span style="font-size:11px; color:#94a3b8;">${user.email}</span>`;
        }

        // உங்களுடைய தற்போதைய ஸ்கிரீனில் காட்டும் அதே அசல் லைவ் போஸ்ட்கள் லாஜிக்
        // (இப்போது இது பக்கா-வாக வேலை செய்வதால், இதன் பட்டன் லிங்க் பர்மிஷன்களை மட்டும் இணைக்கிறோம்)
        bindLinkButtons(user.id);

    } catch (gErr) { 
        console.error(gErr); 
    }
}

// ==========================================
// 3. POST SAVE & AUTOMATION CARD CONTROLS
// ==========================================
function bindLinkButtons(userUuid) {
    document.querySelectorAll(".link-post-btn, button[class*='Link'], button").forEach(btn => {
        if (btn.textContent.trim() === "Link") {
            btn.removeAttribute("disabled");
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                // க்ளிக் செய்யும் போஸ்ட்டின் தலைப்பை எடுக்கிறது
                const row = btn.closest("div")?.parentElement;
                const titleText = row ? row.querySelector("h4")?.innerText || "Instagram Content Flow" : "Instagram Live Reel / Post Flow";
                
                currentActivePostId = btn.getAttribute("data-post-id") || "insta_reel_active_2026";
                openAutomationOptions(currentActivePostId, titleText, userUuid);
            });
        }
    });
}

async function openAutomationOptions(postId, postTitle, userUuid) {
    currentActivePostId = postId;
    const titleEl = document.getElementById("selectedPostTitle");
    if (titleEl) titleEl.innerText = "Instagram Settings: " + postTitle;
    
    const optionsCard = document.getElementById("automationOptionsCard");
    if (optionsCard) {
        optionsCard.style.display = "block";
        optionsCard.scrollIntoView({ behavior: 'smooth' });
    }
}

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
// 4. SAVE INSTAGRAM RULE TO SUPABASE
// ==========================================
const savePostAutomationBtn = document.getElementById("savePostAutomationBtn");
if (savePostAutomationBtn) {
    savePostAutomationBtn.addEventListener("click", async () => {
        if (!currentUserUuid) return;

        const mechanismEl = document.getElementById("triggerMechanism");
        const excludeEl = document.getElementById("excludeKeywords");
        const commentCheckEl = document.getElementById("commentAutoReplyCheck");
        const dmCheckEl = document.getElementById("sendDMCheck");
        const delayEl = document.getElementById("delayTime");
        const btnTitleEl = document.getElementById("templateBtnTitle");
        const urlEl = document.getElementById("templateUrl");
        const descEl = document.getElementById("templateDescription");

        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: currentUserUuid,
                ig_trigger_type: mechanismEl ? mechanismEl.value : "all",
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
            alert("Instagram Automation Flow Linked Successfully! 🚀🎉");
            const card = document.getElementById("automationOptionsCard");
            if (card) card.style.display = "none";
        }
    });
}

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
