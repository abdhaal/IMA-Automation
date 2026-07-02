// ==========================================
// 1. SUPABASE CLIENT SETTINGS
// ==========================================
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
});

// ==========================================
// 2. META / FACEBOOK SDK INITIALIZATION
// ==========================================
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1021418946936223', // உங்கள் மெட்டா App ID
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
    });
    console.log("Meta SDK initialized on Instagram Page.");
};

// Meta SDK-ஐ அசிங்க்ரோனஸாக லோடு செய்தல்
(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// ==========================================
// 3. LOAD USER & INSTAGRAM TOKEN STATUS
// ==========================================
async function loadUserInstagram() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "login.html";
        return;
    }

    const userEmailEl = document.getElementById("userEmail");
    if (userEmailEl) userEmailEl.innerText = data.session.user.email;

    const userUuid = data.session.user.id;

    // சுபாபேஸ் டேபிளில் இருந்து டோக்கன் விவரங்களை எடுத்தல்
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('instagram_access_token, instagram_user_id')
        .eq('id', userUuid);

    if (!profileError && profileData && profileData.length > 0) {
        const profile = profileData[0];
        if (profile.instagram_access_token) {
            const statusEl = document.getElementById("instagramStatus");
            if (statusEl) {
                statusEl.innerHTML = "Connected ✅";
                statusEl.style.color = "#22c55e";
            }
            const usernameEl = document.getElementById("instagramUsername");
            if (usernameEl && profile.instagram_user_id) {
                usernameEl.innerText = profile.instagram_user_id;
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", loadUserInstagram);

// ==========================================
// 4. CONNECT INSTAGRAM (META OAUTH FLOW)
// ==========================================
const connectInstaBtn = document.getElementById("connectInstagram");

if (connectInstaBtn) {
    connectInstaBtn.addEventListener("click", () => {
        if (typeof FB === 'undefined') {
            alert("Meta SDK is still loading... Please wait a moment.");
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
                document.getElementById("instagramUsername").innerText = userId;

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

// டோக்கனை சுபாபேஸ் 'profiles' டேபிளில் சேமித்தல்
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

        if (error) {
            alert("Database Error: " + error.message);
        } else {
            alert("Instagram connection data updated in database! 🎉");
        }
    }
}

// ==========================================
// 5. LOGOUT LOGIC
// ==========================================
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

