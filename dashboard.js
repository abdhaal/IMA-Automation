// ===============================
// IMA Automation Dashboard
// ===============================

// ---------- Supabase ----------
const SUPABASE_URL = "https://psrdnqptvdcwthoquhst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmRucXB0dmRjd3Rob3F1aHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjI3NzcsImV4cCI6MjA5ODQ5ODc3N30.bTTEhxMhIEZMkxR-aZKx2Hj8xFJsUkyuSkfZ1DwdBvA";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ---------- Load User & Integrations ----------
async function loadUser() {
    // 1. பயனர் செஷனை எடுத்தல்
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.log(error);
        return;
    }

    if (!data.session) {
        window.location.href = "login.html";
        return;
    }

    // பயனரின் மின்னஞ்சல் விவரங்களைக் காட்டுதல்
    document.getElementById("userEmail").innerText = data.session.user.email;
    document.getElementById("userName").innerText = data.session.user.email.split("@")[0];

    // 2. 💡 டேட்டாபேஸில் இருந்து இந்த பயனரின் ப்ரொஃபைல்/டோக்கன் விவரங்களை எடுத்தல்
    const userUuid = data.session.user.id;
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('instagram_access_token, facebook_access_token')
        .eq('id', userUuid)
        .single();

    if (!profileError && profileData) {
        // இன்ஸ்டாகிராம் டோக்கன் ஏற்கனவே இருந்தால் "Connected" என்று காட்டும்
        if (profileData.instagram_access_token) {
            const instaStatus = document.getElementById("instagramStatus");
            if (instaStatus) {
                instaStatus.innerHTML = "Connected ✅";
                instaStatus.style.color = "#22c55e";
            }
        }

        // ஃபேஸ்புக் டோக்கன் ஏற்கனவே இருந்தால் "Connected" என்று காட்டும்
        if (profileData.facebook_access_token) {
            const fbStatus = document.getElementById("facebookStatus");
            if (fbStatus) {
                fbStatus.innerHTML = "Connected ✅";
                fbStatus.style.color = "#22c55e";
            }
        }
    }
}

loadUser();



// ---------- Logout ----------
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        if (confirm("Logout from your account?")) {
            // இங்கயும் supabaseClient-ன்னு மாத்தியாச்சு
            await supabaseClient.auth.signOut();

            window.location.href = "login.html";

        }

    });

}


// ==========================================
// ---------- Instagram / Meta OAuth ----------
// ==========================================

// 1. Meta SDK-ஐ இனிஷியலைஸ் செய்தல்
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1021418946936223', // உங்கள் Meta App ID-ஐ இங்கு போடவும்
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0' // தற்போதைய மெட்டா API வெர்ஷன்
    });
};
window.instaAsyncInit = function() {
    insta.init({
        appId      : '2068980717298522', // உங்கள் நிஜமான Meta App ID
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
    });
};

const instaBtn = document.getElementById("connectInstagram");

if (instaBtn) {

    instaBtn.addEventListener("click", () => {

        document.getElementById("instagramStatus").innerHTML = "Connecting...";

        // மெட்டா லாகின் விண்டோவை ஓபன் செய்தல்
        insta.login(function(response) {
            if (response.authResponse) {
                console.log('Welcome! Fetching your access token...', response);
                
                const accessToken = response.authResponse.accessToken;
                const userId = response.authResponse.userID;

                alert("Instagram Connected Successfully!");
                document.getElementById("instagramStatus").innerHTML = "Connected ✅";
                document.getElementById("instagramStatus").style.color = "#22c55e";

                // 💡 இந்த Access Token-ஐ உங்கள் சுபாபேஸ் டேபிளில் சேமிக்க வேண்டும் (பின்வரும் ஸ்டெப்பில் பார்க்கலாம்)
                saveInstagramToken(userId, accessToken);

            } else {
                alert('User cancelled login or did not fully authorize.');
                document.getElementById("instagramStatus").innerHTML = "Failed ❌";
                document.getElementById("instagramStatus").style.color = "#ef4444";
            }
        }, {
            // இன்ஸ்டாகிராம் ஆட்டோமேஷன் மற்றும் மெசேஜ் அனுப்ப தேவையான அனுமதிகள் (Permissions)
            scope: 'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,pages_messaging'
        });

    });

}

// ---------- Instagram டோக்கன் சேமிக்கும் பகுதி ----------
async function saveInstagramToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData && sessionData.session) {
        const userUuid = sessionData.session.user.id;

        // update-க்கு பதிலா upsert பயன்படுத்துகிறோம். இது டேட்டா இல்லைனா புதுசா உருவாக்கும்.
        const { error } = await supabaseClient
            .from('profiles')  
            .upsert({ 
                id: userUuid, // மிக முக்கியம்! பயனர் ஐடியை கொடுக்க வேண்டும்
                instagram_user_id: metaUserId,
                instagram_access_token: token,
                updated_at: new Date()
            });

        if (error) {
            alert("Database Error (Insta): " + error.message);
        } else {
            alert("Instagram data saved to Database! 🎉");
        }
    } else {
        alert("User session not found! Please login again.");
    }
}

// ==========================================
// ---------- Facebook OAuth ----------
// ==========================================

const fbBtn = document.getElementById("connectFacebook");

if (fbBtn) {

    fbBtn.addEventListener("click", () => {

        document.getElementById("facebookStatus").innerHTML = "Connecting...";

        // மெட்டா லாகின் விண்டோவை ஓபன் செய்தல்
        FB.login(function(response) {
            if (response.authResponse) {
                console.log('Facebook Login Successful!', response);
                
                const accessToken = response.authResponse.accessToken;
                const userId = response.authResponse.userID;

                alert("Facebook Connected Successfully!");
                document.getElementById("facebookStatus").innerHTML = "Connected ✅";
                document.getElementById("facebookStatus").style.color = "#22c55e";

                // லாகின் ஆன பிறகு இந்த டோக்கனை சுபாபேஸில் சேமிக்கலாம்
                saveFacebookToken(userId, accessToken);

            } else {
                alert('User cancelled login or did not fully authorize.');
                document.getElementById("facebookStatus").innerHTML = "Failed ❌";
                document.getElementById("facebookStatus").style.color = "#ef4444";
            }
        }, {
            // ஃபேஸ்புக் பக்கங்கள் மற்றும் மெசேஜ்களை நிர்வகிக்க தேவையான அனுமதிகள் (Scopes)
            scope: 'pages_manage_metadata,pages_messaging,pages_read_engagement,public_profile,email'
        });

    });

}

// ---------- Facebook டோக்கன் சேமிக்கும் பகுதி ----------
async function saveFacebookToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData && sessionData.session) {
        const userUuid = sessionData.session.user.id;

        // இங்கேயும் upsert பயன்படுத்துகிறோம்
        const { error } = await supabaseClient
            .from('profiles') 
            .upsert({ 
                id: userUuid, // மிக முக்கியம்!
                facebook_user_id: metaUserId,
                facebook_access_token: token,
                updated_at: new Date()
            });

        if (error) {
            alert("Database Error (FB): " + error.message);
        } else {
            alert("Facebook data saved to Database! 🎉");
        }
    } else {
        alert("User session not found! Please login again.");
    }
}



// ---------- Auto DM ----------
const autoDM = document.getElementById("autoDM");

if (autoDM) {

    autoDM.addEventListener("click", () => {

        alert("Auto DM Enabled");

    });

}


// ---------- Auto Reply ----------
const autoReply = document.getElementById("autoReply");

if (autoReply) {

    autoReply.addEventListener("click", () => {

        alert("Auto Reply Enabled");

    });

}


// ---------- Keywords ----------
const keywordBtn = document.getElementById("keywordBtn");

if (keywordBtn) {

    keywordBtn.addEventListener("click", () => {

        const keyword = prompt("Enter keyword");

        if (keyword) {

            alert("Keyword Saved : " + keyword);

        }

    });

}


// ---------- Automation Status ----------
const automationStatus = document.getElementById("automationStatus");

if (automationStatus) {

    automationStatus.innerHTML = "Running";

    automationStatus.style.color = "#22c55e";

}


// ---------- Dashboard Counter ----------
function random(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;

}

const numbers = document.querySelectorAll(".box h3");

numbers.forEach(item => {

    if (!item.innerText.includes("%")) {

        item.innerText = random(0, 50);

    }

});


// ---------- Toast ----------
function showToast(message) {

    const toast = document.getElementById("toast");

    const text = document.getElementById("toastText");

    if (!toast || !text) return;

    text.innerText = message;

    toast.style.display = "flex";

    setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}


// ---------- Welcome ----------
setTimeout(() => {

    showToast("Welcome to IMA Dashboard");

}, 1000);
