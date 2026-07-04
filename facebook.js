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
// 2. INITIALIZE FACEBOOK LOGIN SDK
// ==========================================
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1021418946936223', // உங்களுடைய அசல் Meta App ID
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
    });
};

// ⚡ மெட்டா எஸ்டிகே லோடிங்
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// ==========================================
// 3. REPLY RUSH STYLE 1-CLICK CONNECTION LOGIC
// ==========================================
function connectFacebookPageDirectly() {
    FB.login(function(response) {
        if (response.authResponse) {
            // பர்சனல் டோக்கன் கிடைத்தவுடன் பக்கங்களின் பட்டியலை எடுத்தல்
            const userToken = response.authResponse.accessToken;
            
            fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}`)
                .then(res => res.json())
                .then(async data => {
                    if (data && data.data && data.data.length > 0) {
                        // 🎯 பட்டியலில் உள்ள முதல் பக்கத்தின் அசல் Page Access Token & ID
                        const pageToken = data.data[0].access_token;
                        const pageId = data.data[0].id;
                        
                        // சுபாபேஸ் டேட்டாபேஸில் 1-க்ளிக் ஆட்டோ-சேவ்
                        const { error } = await supabaseClient
                            .from('profiles')
                            .update({
                                facebook_access_token: pageToken,
                                facebook_user_id: pageId,
                                updated_at: new Date()
                            })
                            .eq('id', currentUserUuid);

                        if (!error) {
                            alert("Facebook Page Connected Successfully like Reply Rush! 🎉");
                            loadFacebookPageData(); // பக்கத்தை ரீலோடு செய்தல்
                        } else {
                            alert("Sync failed: " + error.message);
                        }
                    } else {
                        alert("No pages associated with this Facebook account.");
                    }
                });
        } else {
            alert('User cancelled login or did not fully authorize.');
        }
    }, {scope: 'pages_read_user_content,pages_manage_posts,pages_show_list'});
}

// ==========================================
// 4. FETCH LIVE FACEBOOK PAGE POSTS
// ==========================================
async function loadFacebookPageData() {
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
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('facebook_access_token, facebook_user_id')
            .eq('id', user.id);

        if (profileData && profileData.length > 0 && profileData[0].facebook_access_token) {
            const token = profileData[0].facebook_access_token;
            const targetPageId = profileData[0].facebook_user_id;

            try {
                const response = await fetch(`https://graph.facebook.com/v20.0/${targetPageId}/posts?fields=id,message,created_time,full_picture&access_token=${token}`);
                const resData = await response.json();

                if (resData && resData.data && resData.data.length > 0) {
                    postsContainer.innerHTML = ""; 
                    resData.data.forEach(post => {
                        if (!post) return;
                        const postMessage = post.message ? post.message.substring(0, 50) + "..." : "Facebook Content Feed";
                        const postImg = post.full_picture || "";

                        const postRow = document.createElement("div");
                        postRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 8px;";
                        postRow.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                ${postImg ? `<img src="${postImg}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">` : `<div style="width:50px; height:50px; background:linear-gradient(135deg,#2563eb,#7c3aed); border-radius:8px;"></div>`}
                                <div style="text-align: left;">
                                    <h4 class="post-title-text" style="font-size: 15px; margin: 0;">${postMessage}</h4>
                                </div>
                            </div>
                            <button class="link-post-btn" data-post-id="${post.id}" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding:8px 20px; border-radius:8px; border:none; color:#fff; cursor:pointer;">Link</button>
                        `;
                        postsContainer.appendChild(postRow);
                    });
                    bindLinkButtons(user.id);
                } else {
                    showConnectUI(postsContainer);
                }
            } catch (err) {
                showConnectUI(postsContainer);
            }
        } else {
            showConnectUI(postsContainer);
        }
    } catch (gErr) { console.error(gErr); }
}

function showConnectUI(container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; background: rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
            <i class="fa-brands fa-facebook" style="font-size: 40px; color: #1877f2; margin-bottom: 12px;"></i>
            <h4 style="color:#fff; margin-bottom:6px;">Connect Your Facebook Page</h4>
            <p style="font-size:13px; color:#94a3b8; margin-bottom:20px;">Link your creator or business page instantly like Reply Rush.</p>
            <button id="fbConnectActionBtn" style="background:#1877f2; color:#fff; padding:12px 30px; border:none; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(24,119,242,0.3);">
                🚀 Continue with Facebook
            </button>
        </div>`;
    
    document.getElementById("fbConnectActionBtn").addEventListener("click", connectFacebookPageDirectly);
}

// ==========================================
// 5. POST SAVE & NAVIGATION CONTROLS
// ==========================================
function bindLinkButtons(userUuid) {
    document.querySelectorAll(".link-post-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentActivePostId = btn.getAttribute("data-post-id");
            const title = btn.parentElement.querySelector(".post-title-text").innerText;
            document.getElementById("selectedPostTitle").innerText = "Link Settings: " + title;
            document.getElementById("automationOptionsCard").style.display = "block";
        });
    });
}

document.addEventListener("DOMContentLoaded", loadFacebookPageData);
