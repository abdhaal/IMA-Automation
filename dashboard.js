// ==========================================
// 1. SUPABASE CONFIGURATION & CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    },
    global: {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
});

// ==========================================
// 2. LOAD USER & DATA ACCESS LOGIC (406 FIXED)
// ==========================================
async function loadUser() {
    // பயனர் செஷனை எடுத்தல்
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        console.log("Active session not found, redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    // HTML Elements செக் மற்றும் இமெயில் விவரங்களை நிரப்புதல்
    const userEmailEl = document.getElementById("userEmail");
    const userNameEl = document.getElementById("userName");

    if (userEmailEl) userEmailEl.innerText = data.session.user.email;
    if (userNameEl) userNameEl.innerText = data.session.user.email.split("@")[0];

    // டேட்டாபேஸில் இருந்து ப்ரொஃபைல் விவரங்களை எடுத்தல்
    const userUuid = data.session.user.id;
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('instagram_access_token, facebook_access_token')
        .eq('id', userUuid); // 💡 406 எர்ரர் வராமல் தடுக்க Array வடிவில் செக் செய்கிறோம்

    if (!profileError && profileData && profileData.length > 0) {
        const profile = profileData[0];

        // இன்ஸ்டாகிராம் டோக்கன் செக்
        if (profile.instagram_access_token) {
            const instaStatus = document.getElementById("instagramStatus");
            if (instaStatus) {
                instaStatus.innerHTML = "Connected ✅";
                instaStatus.style.color = "#22c55e";
            }
        }

        // ஃபேஸ்புக் டோக்கன் செக்
        if (profile.facebook_access_token) {
            const fbStatus = document.getElementById("facebookStatus");
            if (fbStatus) {
                fbStatus.innerHTML = "Connected ✅";
                fbStatus.style.color = "#22c55e";
            }
        }
    }
}

// பக்கம் ஓபன் ஆனவுடன் யூசரை லோடு செய்தல்
loadUser();

// ==========================================
// 3. SIDEBAR BUTTONS NAVIGATION LOGIC (ID BASED)
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

    // Logout பட்டன் லாஜிக்
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

// ==========================================
// 4. FACEBOOK / INSTAGRAM META OAUTH FLOW
// ==========================================

window.fbAsyncInit = function() {
    FB.init({
        appId      : '1021418946936223', 
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
    });
    console.log("Meta SDK successfully initialized.");
};

// Instagram OAuth
const instaBtn = document.getElementById("connectInstagram");
if (instaBtn) {
    instaBtn.addEventListener("click", () => {
        if (typeof FB === 'undefined') {
            alert("Meta SDK is still loading... Please wait a moment and try again.");
            return;
        }

        document.getElementById("instagramStatus").innerHTML = "Connecting...";

        FB.login(function(response) {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                const userId = response.authResponse.userID;

                alert("Instagram Connected Successfully!");
                document.getElementById("instagramStatus").innerHTML = "Connected ✅";
                document.getElementById("instagramStatus").style.color = "#22c55e";

                saveInstagramToken(userId, accessToken);
            } else {
                alert('User cancelled login or did not fully authorize.');
                document.getElementById("instagramStatus").innerHTML = "Failed ❌";
                document.getElementById("instagramStatus").style.color = "#ef4444";
            }
        }, {
            scope: 'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,pages_messaging'
        });
    });
}

async function saveInstagramToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData && sessionData.session) {
        const userUuid = sessionData.session.user.id;
        const { error } = await supabaseClient
            .from('profiles')  
            .upsert({ 
                id: userUuid, 
                instagram_user_id: metaUserId,
                instagram_access_token: token,
                updated_at: new Date()
            });

        if (error) alert("Database Error (Insta): " + error.message);
    }
}

// Facebook OAuth
const fbBtn = document.getElementById("connectFacebook");
if (fbBtn) {
    fbBtn.addEventListener("click", () => {
        if (typeof FB === 'undefined') {
            alert("Meta SDK is still loading... Please wait a moment and try again.");
            return;
        }

        document.getElementById("facebookStatus").innerHTML = "Connecting...";

        FB.login(function(response) {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                const userId = response.authResponse.userID;

                alert("Facebook Connected Successfully!");
                document.getElementById("facebookStatus").innerHTML = "Connected ✅";
                document.getElementById("facebookStatus").style.color = "#22c55e";

                saveFacebookToken(userId, accessToken);
            } else {
                alert('User cancelled login or did not fully authorize.');
                document.getElementById("facebookStatus").innerHTML = "Failed ❌";
                document.getElementById("facebookStatus").style.color = "#ef4444";
            }
        }, {
            scope: 'pages_manage_metadata,pages_messaging,pages_read_engagement,public_profile,email'
        });
    });
}

async function saveFacebookToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData && sessionData.session) {
        const userUuid = sessionData.session.user.id;
        const { error } = await supabaseClient
            .from('profiles') 
            .upsert({ 
                id: userUuid, 
                facebook_user_id: metaUserId,
                facebook_access_token: token,
                updated_at: new Date()
            });

        if (error) alert("Database Error (FB): " + error.message);
    }
}

// ==========================================
// 5. AUTOMATION INTERACTION LOGIC & MOCK COUNTERS
// ==========================================

const autoDM = document.getElementById("autoDM");
if (autoDM) {
    autoDM.addEventListener("click", () => alert("Auto DM Enabled"));
}

const autoReply = document.getElementById("autoReply");
if (autoReply) {
    autoReply.addEventListener("click", () => alert("Auto Reply Enabled"));
}

const keywordBtn = document.getElementById("keywordBtn");
if (keywordBtn) {
    keywordBtn.addEventListener("click", () => {
        const keyword = prompt("Enter keyword");
        if (keyword) alert("Keyword Saved : " + keyword);
    });
}

const automationStatus = document.getElementById("automationStatus");
if (automationStatus) {
    automationStatus.innerHTML = "Running";
    automationStatus.style.color = "#22c55e";
}

// Randomizer Counter
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const numbers = document.querySelectorAll(".box h3");
numbers.forEach(item => {
    if (!item.innerText.includes("%")) {
        item.innerText = random(0, 50);
    }
});

// Auto Clear Success Toast Overlay Fix
setInterval(() => {
    const toast = document.querySelector('.toast,.toastify,.notification,.success-toast,.Toastify__toast,.swal2-toast');
    if (toast) toast.remove();
}, 500);
                                         
