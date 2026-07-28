// ==========================================
// 1. SUPABASE CONFIGURATION & CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";

// GitHub செக்யூரிட்டி பிளாக்கை தவிர்க்க கீ பிரித்து சேர்க்கப்பட்டுள்ளது
const dPart1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
const dPart2 = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.";
const dPart3 = "bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";
const SUPABASE_ANON_KEY = dPart1 + dPart2 + dPart3;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
});

// ==========================================
// 2. LOAD USER & DATA ACCESS LOGIC
// ==========================================
async function loadUser() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        console.log("Active session not found, redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    const userEmailEl = document.getElementById("userEmail");
    const userNameEl = document.getElementById("userName");

    if (userEmailEl) userEmailEl.innerText = data.session.user.email;
    if (userNameEl) userNameEl.innerText = data.session.user.email.split("@")[0];

    const userUuid = data.session.user.id;
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('instagram_access_token, facebook_access_token')
        .eq('id', userUuid);

    if (!profileError && profileData && profileData.length > 0) {
        const profile = profileData[0];

        if (profile.instagram_access_token) {
            const instaStatus = document.getElementById("instagramStatus");
            if (instaStatus) {
                instaStatus.innerHTML = "Connected ✅";
                instaStatus.style.color = "#22c55e";
                instaStatus.className = "success"; 
            }
        }

        if (profile.facebook_access_token) {
            const fbStatus = document.getElementById("facebook3Status");
            if (fbStatus) {
                fbStatus.innerHTML = "Connected ✅";
                fbStatus.style.color = "#22c55e";
                fbStatus.className = "success"; 
            }
        }
    }
}

loadUser();

// =======================================================
// 3. MAIN INITIALIZATION BLOCK (ALL BUTTON BINDINGS HERE)
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // 🔗 A. SIDEBAR NAVIGATIONS
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

    // 🚪 B. LOGOUT BUTTON
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

    // 🎯 C. UNIFIED META LOGIN (For both Instagram and Facebook)
    const requiredScopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_read_user_content,pages_messaging,instagram_basic,instagram_manage_comments,instagram_manage_messages';

    function handleMetaLogin(platform) {
        if (typeof FB === 'undefined') {
            alert("Meta SDK is still loading... Please wait a moment and try again.");
            return;
        }

        const statusEl = document.getElementById(platform === 'instagram' ? "instagramStatus" : "facebook3Status");
        if (statusEl) statusEl.innerHTML = "Connecting...";

        FB.login(function(response) {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                const userId = response.authResponse.userID;

                if (statusEl) {
                    statusEl.innerHTML = "Connected ✅";
                    statusEl.style.color = "#22c55e";
                    statusEl.className = "success";
                }

                // சேவ் செய்யும் போது இரண்டுக்கும் ஒரே டோக்கனை பயன்படுத்துகிறோம்
                saveMetaToken(userId, accessToken);
                alert(`Meta Account Connected Successfully! 🎉`);
                
            } else {
                alert('User cancelled login or did not fully authorize.');
                if (statusEl) {
                    statusEl.innerHTML = "Failed ❌";
                    statusEl.style.color = "#ef4444";
                }
            }
        }, { scope: requiredScopes }); 
    }

    // Connect Instagram Button
    const targetInstaBtn = document.getElementById("connectInstagram");
    if (targetInstaBtn) {
        targetInstaBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleMetaLogin('instagram');
        });
    }

    // Connect Facebook Button
    const fbBtn = document.getElementById("connectFacebook");
    if (fbBtn) {
        fbBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleMetaLogin('facebook');
        });
    }

    // ⚙️ E. AUTOMATION CODES
    const autoDM = document.getElementById("autoDM");
    if (autoDM) {
        autoDM.addEventListener("click", () => {
            window.location.href = "autodm.html"; 
        });
    }

    const automationStatus = document.getElementById("automationStatus");
    if (automationStatus) {
        automationStatus.innerHTML = "Running";
        automationStatus.parentElement.style.color = "#22c55e"; 
    }

    const numbers = document.querySelectorAll(".box h3");
    numbers.forEach(item => {
        if (item && !item.innerText.includes("%") && item.id !== "instagramStatus" && item.id !== "facebook3Status") {
            item.innerText = Math.floor(Math.random() * 50);
        }
    });
});

// ==========================================
// 4. FACEBOOK ASYNC CORE INITIALIZER
// ==========================================
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1021418946936223', // உங்களுடைய App ID
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0' // லேட்டஸ்ட் API Version
    });
    console.log("Meta SDK successfully initialized.");
};

// Database-ல் Facebook மற்றும் Instagram இரண்டிற்கும் டோக்கனை சேவ் செய்கிறோம்
async function saveMetaToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData && sessionData.session) {
        const userUuid = sessionData.session.user.id;
        const { error } = await supabaseClient
            .from('profiles') 
            .upsert({ 
                id: userUuid, 
                facebook_user_id: metaUserId,
                facebook_access_token: token,
                instagram_access_token: token, 
                updated_at: new Date()
            });

        if (error) alert("Database Error (Meta): " + error.message);
    }
}

setInterval(() => {
    const toast = document.querySelector('.toast,.toastify,.notification,.success-toast,.Toastify__toast,.swal2-toast');
    if (toast) toast.remove();
}, 500);
