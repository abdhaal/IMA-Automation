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

let currentActiveInstaPostId = "";

// ==========================================
// 2. LIFECYCLE INITIALIZER & DYNAMIC INTERACTION
// ==========================================
async function loadInstagramPage() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
        window.location.href = "login.html";
        return;
    }

    if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = data.session.user.email;
    if (document.getElementById("userName")) document.getElementById("userName").innerText = data.session.user.email.split("@")[0];

    // லிங்க் பட்டன்களுக்கான கிளிக் நிகழ்வுகளை இணைத்தல்
    const linkButtons = document.querySelectorAll(".link-insta-btn");
    linkButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const postId = btn.getAttribute("data-post-id");
            const postTitle = btn.parentElement.querySelector("h4").innerText;
            
            openInstaAutomationOptions(postId, postTitle, data.session.user.id);
        });
    });

    // க்ளோஸ் பட்டன் கிளிக் நிகழ்வு
    const closeBtn = document.getElementById("closeInstaOptionsBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("instaOptionsCard").style.display = "none";
        });
    }

    const triggerMechanism = document.getElementById("instaTriggerMechanism");
    if (triggerMechanism) {
        triggerMechanism.addEventListener("change", toggleInstaKeywordInput);
    }
}

// ஆப்ஷன்ஸ் கார்டை ஓப்பன் செய்யும் மெத்தட்
async function openInstaAutomationOptions(postId, postTitle, userUuid) {
    currentActiveInstaPostId = postId;
    document.getElementById("selectedInstaTitle").innerText = "Link Settings: " + postTitle;
    
    // குறிப்பிட்ட போஸ்டிற்கான பழைய டேட்டா ஏதேனும் இருந்தால் சுபாபேஸிலிருந்து எடுத்தல்
    const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('insta_trigger_type, insta_exclude_keywords, insta_comment_active, insta_dm_active, insta_delay, insta_btn_title, insta_url, insta_desc')
        .eq('id', userUuid);

    if (profileData && profileData.length > 0) {
        const config = profileData[0];
        document.getElementById("instaTriggerMechanism").value = config.insta_trigger_type || "all";
        document.getElementById("instaExcludeKeywords").value = config.insta_exclude_keywords || "";
        document.getElementById("instaCommentCheck").checked = config.insta_comment_active || false;
        document.getElementById("instaDmCheck").checked = config.insta_dm_active || false;
        document.getElementById("instaDelayTime").value = config.insta_delay || "";
        document.getElementById("instaBtnTitle").value = config.insta_btn_title || "";
        document.getElementById("instaUrl").value = config.insta_url || "";
        document.getElementById("instaDescription").value = config.insta_desc || "";
    }

    toggleInstaKeywordInput();
    
    // ஆப்ஷன் கார்டை திரையில் காண்பித்தல்
    const optionsCard = document.getElementById("instaOptionsCard");
    optionsCard.style.display = "block";
    optionsCard.scrollIntoView({ behavior: 'smooth' });
}

function toggleInstaKeywordInput() {
    const mechanism = document.getElementById("instaTriggerMechanism").value;
    const wrapper = document.getElementById("instaKeywordWrapper");
    if (wrapper) {
        wrapper.style.display = (mechanism === "keywords") ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", loadInstagramPage);

// ==========================================
// 3. DATA SAVE HANDLER
// ==========================================
const saveInstaAutomationBtn = document.getElementById("saveInstaAutomationBtn");
if (saveInstaAutomationBtn) {
    saveInstaAutomationBtn.addEventListener("click", async () => {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData || !sessionData.session) return;

        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: sessionData.session.user.id,
                insta_trigger_type: document.getElementById("instaTriggerMechanism").value,
                insta_exclude_keywords: document.getElementById("instaExcludeKeywords").value.trim(),
                insta_comment_active: document.getElementById("instaCommentCheck").checked,
                insta_dm_active: document.getElementById("instaDmCheck").checked,
                insta_delay: document.getElementById("instaDelayTime").value.trim(),
                insta_btn_title: document.getElementById("instaBtnTitle").value.trim(),
                insta_url: document.getElementById("instaUrl").value.trim(),
                insta_desc: document.getElementById("instaDescription").value.trim(),
                updated_at: new Date()
            });

        if (error) {
            alert("Sync Failed: " + error.message);
        } else {
            alert("Instagram Automation Flow Linked Successfully to Post! 🎉");
            document.getElementById("instaOptionsCard").style.display = "none";
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
