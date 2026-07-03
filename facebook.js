// ==========================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";

const part1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
const part2 = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.";
const part3 = "bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";
const SUPABASE_ANON_KEY = part1 + part2 + part3;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
});

// ==========================================
// 2. LIFECYCLE LOADER (INITIAL DATA INJECTION)
// ==========================================
async function loadFacebookAutomationPage() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "login.html";
        return;
    }

    const user = data.session.user;
    if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
    if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

    // தற்போதைய ரூல்ஸ் ஏதேனும் டேட்டாபேஸில் இருந்தால் லோடு செய்தல்
    const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('fb_trigger_type, fb_exclude_keywords, fb_comment_reply_active, fb_dm_active, fb_delay, fb_btn_title, fb_url, fb_desc')
        .eq('id', user.id);

    if (profileData && profileData.length > 0) {
        const config = profileData[0];
        if (config.fb_trigger_type) document.getElementById("triggerMechanism").value = config.fb_trigger_type;
        if (config.fb_exclude_keywords) document.getElementById("excludeKeywords").value = config.fb_exclude_keywords;
        document.getElementById("commentAutoReplyCheck").checked = config.fb_comment_reply_active || false;
        document.getElementById("sendDMCheck").checked = config.fb_dm_active || false;
        if (config.fb_delay) document.getElementById("delayTime").value = config.fb_delay;
        if (config.fb_btn_title) document.getElementById("templateBtnTitle").value = config.fb_btn_title;
        if (config.fb_url) document.getElementById("templateUrl").value = config.fb_url;
        if (config.fb_desc) document.getElementById("templateDescription").value = config.fb_desc;
        
        // கீவேர்ட் விண்டோ விசிபிலிட்டி செக்
        toggleKeywordInput();
    }
}

function toggleKeywordInput() {
    const mechanism = document.getElementById("triggerMechanism").value;
    const wrapper = document.getElementById("keywordInputWrapper");
    if (wrapper) {
        wrapper.style.display = (mechanism === "keywords") ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadFacebookAutomationPage();
    const triggerMechanism = document.getElementById("triggerMechanism");
    if (triggerMechanism) {
        triggerMechanism.addEventListener("change", toggleKeywordInput);
    }
});

// ==========================================
// 3. ACTIONS CONTROLLER (SAVE DATA HOOK)
// ==========================================
const savePostAutomationBtn = document.getElementById("savePostAutomationBtn");
if (savePostAutomationBtn) {
    savePostAutomationBtn.addEventListener("click", async () => {
        const triggerType = document.getElementById("triggerMechanism").value;
        const excludeKeys = document.getElementById("excludeKeywords").value.trim();
        const commentActive = document.getElementById("commentAutoReplyCheck").checked;
        const dmActive = document.getElementById("sendDMCheck").checked;
        const delay = document.getElementById("delayTime").value.trim();
        const btnTitle = document.getElementById("templateBtnTitle").value.trim();
        const destinationUrl = document.getElementById("templateUrl").value.trim();
        const description = document.getElementById("templateDescription").value.trim();

        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (sessionData && sessionData.session) {
            const userUuid = sessionData.session.user.id;

            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: userUuid,
                    fb_trigger_type: triggerType,
                    fb_exclude_keywords: excludeKeys,
                    fb_comment_reply_active: commentActive,
                    fb_dm_active: dmActive,
                    fb_delay: delay,
                    fb_btn_title: btnTitle,
                    fb_url: destinationUrl,
                    fb_desc: description,
                    updated_at: new Date()
                });

            if (error) {
                alert("Database Sync Failed: " + error.message);
            } else {
                alert("Facebook Advanced Post Automation Saved Successfully! 🎉");
            }
        }
    });
}

// ==========================================
// 4. CORE NAVIGATION DISPATCHER
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
            if (confirm("Logout from your account?")) {
                await supabaseClient.auth.signOut();
                window.location.href = "login.html";
            }
        });
    }
});
