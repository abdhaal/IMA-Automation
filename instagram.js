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
// 2. FETCH LIVE INSTAGRAM POSTS & REELS (FACEBOOK HUB STYLE BYPASS)
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
        
        // டாப் ப்ரொஃபைல் விவரங்களை அப்டேட் செய்தல்
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];
        
        // "User Loading..." டெக்ஸ்ட் இருந்தால் அதை மாற்றுதல்
        const loadingTextEl = Array.from(document.querySelectorAll("span, p, div")).find(el => el.textContent.includes("Loading..."));
        if (loadingTextEl) {
            loadingTextEl.innerHTML = `<span style="font-weight:600; color:#fff;">${user.email.split("@")[0]}</span><br><span style="font-size:11px; color:#94a3b8;">${user.email}</span>`;
        }

        // 🎯 மெட்டா டோக்கன் சிக்கல்களைத் தவிர்க்க, ஃபேஸ்புக் பக்கம் மாதிரியே நேரடி மேனுவல் இன்ஸ்டன்ட் பட்டன்!
        postsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 15px; background: rgba(236,72,153,0.05); border-radius:12px; border:1px dashed rgba(236,72,153,0.3); margin-top: 15px;">
                <i class="fa-brands fa-instagram" style="font-size: 40px; margin-bottom: 12px; color: #ec4899;"></i>
                <h4 style="color:#fff; font-size:17px; margin-bottom:6px;">@imashoppingcentre - Instagram Automation</h4>
                <p style="font-size:13px; color:#94a3b8; max-width:400px; margin:0 auto 20px auto;">Meta Advanced Access is pending activation (24h cooldown). Use the quick link option below to open configuration rules.</p>
                <button id="instaBypassConnectBtn" style="background: linear-gradient(135deg, #ec4899, #7c3aed); color:#fff; padding:12px 35px; border:none; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 4px 14px rgba(236,72,153,0.3);">
                    🚀 Connect Instagram Instantly
                </button>
            </div>`;
        
        document.getElementById("instaBypassConnectBtn").addEventListener("click", (e) => {
            e.preventDefault();
            // மாதிரி ஐடியை அனுப்பி இன்ஸ்டா ஆட்டோமேஷன் செட்டிங்ஸை ஓப்பன் செய்கிறது
            openAutomationOptions("insta_override_post_2026", "@imashoppingcentre Live Automation Flow", user.id);
        });

    } catch (gErr) { 
        console.error(gErr); 
    }
}

// ==========================================
// 3. POST SAVE & AUTOMATION CARD CONTROLS
// ==========================================
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

        // இன்ஸ்டாகிராம் ஆட்டோமேஷன் விதிகளை சுபாபேஸில் சேமித்தல் (ig_ columns)
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
