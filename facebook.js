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

// ==========================================
// 2. LIFECYCLE INITIALIZER & DYNAMIC INTERACTION
// ==========================================
async function loadFacebookPage() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
        window.location.href = "login.html";
        return;
    }

    if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = data.session.user.email;
    if (document.getElementById("userName")) document.getElementById("userName").innerText = data.session.user.email.split("@")[0];

    // லிங்க் பட்டன்களுக்கான கிளிக் நிகழ்வுகளை இணைத்தல்
    const linkButtons = document.querySelectorAll(".link-post-btn");
    linkButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const postId = btn.getAttribute("data-post-id");
            const postTitle = btn.parentElement.querySelector("h4").innerText;
            
            openAutomationOptions(postId, postTitle, data.session.user.id);
        });
    });

    // க்ளோஸ் பட்டன் கிளிக் நிகழ்வு
    const closeBtn = document.getElementById("closeOptionsBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("automationOptionsCard").style.display = "none";
        });
    }

    const triggerMechanism = document.getElementById("triggerMechanism");
    if (triggerMechanism) {
        triggerMechanism.addEventListener("change", toggleKeywordInput);
    }
}

// ஆப்ஷன்ஸ் கார்டை ஓப்பன் செய்யும் மெத்தட்
async function openAutomationOptions(postId, postTitle, userUuid) {
    currentActivePostId = postId;
    document.getElementById("selectedPostTitle").innerText = "Link Settings: " + postTitle;
    
    // குறிப்பிட்ட போஸ்டிற்கான பழைய டேட்டா ஏதேனும் இருந்தால் சுபாபேஸிலிருந்து எடுத்தல்
    const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('fb_trigger_type, fb_exclude_keywords, fb_comment_reply_active, fb_dm_active, fb_delay, fb_btn_title, fb_url, fb_desc')
        .eq('id', userUuid);

    if (profileData && profileData.length > 0) {
        const config = profileData[0];
        document.getElementById("triggerMechanism").value = config.fb_trigger_type || "all";
        document.getElementById("excludeKeywords").value = config.fb_exclude_keywords || "";
        document.getElementById("commentAutoReplyCheck").checked = config.fb_comment_reply_active || false;
        document.getElementById("sendDMCheck").checked = config.fb_dm_active || false;
        document.getElementById("delayTime").value = config.fb_delay || "";
        document.getElementById("templateBtnTitle").value = config.fb_btn_title || "";
        document.getElementById("templateUrl").value = config.fb_url || "";
        document.getElementById("templateDescription").value = config.fb_desc || "";
    }

    toggleKeywordInput();
    
    // ஆப்ஷன் கார்டை திரையில் காண்பித்தல்
    const optionsCard = document.getElementById("automationOptionsCard");
    optionsCard.style.display = "block";
    optionsCard.scrollIntoView({ behavior: 'smooth' });
}

function toggleKeywordInput() {
    const mechanism = document.getElementById("triggerMechanism").value;
    const wrapper = document.getElementById("keywordInputWrapper");
    if (wrapper) {
        wrapper.style.display = (mechanism === "keywords") ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", loadFacebookPage);

// ==========================================
// 3. DATA SAVE HANDLER
// ==========================================
const savePostAutomationBtn = document.getElementById("savePostAutomationBtn");
if (savePostAutomationBtn) {
    savePostAutomationBtn.addEventListener("click", async () => {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData || !sessionData.session) return;

        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: sessionData.session.user.id,
                fb_trigger_type: document.getElementById("triggerMechanism").value,
                fb_exclude_keywords: document.getElementById("excludeKeywords").value.trim(),
                fb_comment_reply_active: document.getElementById("commentAutoReplyCheck").checked,
                fb_dm_active: document.getElementById("sendDMCheck").checked,
                fb_delay: document.getElementById("delayTime").value.trim(),
                fb_btn_title: document.getElementById("templateBtnTitle").value.trim(),
                fb_url: document.getElementById("templateUrl").value.trim(),
                fb_desc: document.getElementById("templateDescription").value.trim(),
                updated_at: new Date()
            });

        if (error) {
            alert("Sync Failed: " + error.message);
        } else {
            alert("Automation Flow Linked Successfully to Post! 🎉");
            document.getElementById("automationOptionsCard").style.display = "none";
        }
    });
}

// ==========================================
// 4. CORE NAVIGATION
// ==========================================
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
        if (btn) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = link.url;
            });
        }
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (confirm("Logout from account?")) {
                await supabaseClient.auth.signOut();
                window.location.href = "login.html";
            }
        });
    }
});
