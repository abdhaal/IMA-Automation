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


// ---------- Load User ----------
async function loadUser() {
    // இங்க supabaseClient-ன்னு மாத்தியாச்சு
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.log(error);
        return;
    }

    if (!data.session) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("userEmail").innerText =
        data.session.user.email;

    document.getElementById("userName").innerText =
        data.session.user.email.split("@")[0];

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

const instaBtn = document.getElementById("connectInstagram");

if (instaBtn) {

    instaBtn.addEventListener("click", () => {

        document.getElementById("instagramStatus").innerHTML = "Connecting...";

        // மெட்டா லாகின் விண்டோவை ஓபன் செய்தல்
        FB.login(function(response) {
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

// சுபாபேஸ் டேபிளில் டோக்கனைச் சேமிக்கும் ஃபங்க்ஷன்
async function saveInstagramToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData.session) {
        const userUuid = sessionData.session.user.id;

        // உங்கள் 'profiles' அல்லது புதிய 'integrations' டேபிளில் சேமிக்கலாம்
        const { error } = await supabaseClient
            .from('profiles') 
            .update({ 
                instagram_user_id: metaUserId,
                instagram_access_token: token 
            })
            .eq('id', userUuid);

        if (error) console.error("Error saving token:", error);
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

// சுபாபேஸ் டேபிளில் பேஸ்புக் டோக்கனைச் சேமிக்கும் ஃபங்க்ஷன்
async function saveFacebookToken(metaUserId, token) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData.session) {
        const userUuid = sessionData.session.user.id;

        // ப்ரொஃபைல் டேபிளில் பேஸ்புக் விவரங்களை அப்டேட் செய்தல்
        const { error } = await supabaseClient
            .from('profiles') 
            .update({ 
                facebook_user_id: metaUserId,
                facebook_access_token: token 
            })
            .eq('id', userUuid);

        if (error) console.error("Error saving FB token:", error);
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
