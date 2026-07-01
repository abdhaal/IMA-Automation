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


// ---------- Instagram ----------
const instaBtn = document.getElementById("connectInstagram");

if (instaBtn) {

    instaBtn.addEventListener("click", () => {

        alert("Instagram OAuth will be connected in the next step.");

        document.getElementById("instagramStatus").innerHTML =
            "Connecting...";

    });

}


// ---------- Facebook ----------
const fbBtn = document.getElementById("connectFacebook");

if (fbBtn) {

    fbBtn.addEventListener("click", () => {

        alert("Facebook OAuth will be connected in the next step.");

        document.getElementById("facebookStatus").innerHTML =
            "Connecting...";

    });

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
