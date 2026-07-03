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
// 2. FETCH LIVE FACEBOOK PAGE POSTS & REELS
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
        if (document.getElementById("userEmail")) document.getElementById("userEmail").innerText = user.email;
        if (document.getElementById("userName")) document.getElementById("userName").innerText = user.email.split("@")[0];

        // Profiles டேபிளில் இருந்து டோக்கன் மற்றும் பேஜ் ஐடியை எடுத்தல்
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('facebook_access_token, facebook_user_id')
            .eq('id', user.id);

        if (profileError) {
            postsContainer.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px 0;">Database Access Error.</div>`;
            return;
        }

        if (profileData && profileData.length > 0 && profileData[0].facebook_access_token) {
            const token = profileData[0].facebook_access_token;
            
            // 💡 ஒருவேளை டேட்டாபேஸில் facebook_user_id இருந்தால் அதை எடுக்கும், இல்லையெனில் 'me' என்றுFallback ஆகும்
            const targetPageId = profileData[0].facebook_user_id && profileData[0].facebook_user_id.trim() !== "" 
                ? profileData[0].facebook_user_id 
                : "me";

            try {
                // ⚡ மாஸ் அப்டேட்: /me/feed-க்கு பதிலாக பக்கத்தின் குறிப்பிட்ட /posts எண்ட் பாயிண்ட்டைப் பயன்படுத்துகிறோம்
                const response = await fetch(`https://graph.facebook.com/v20.0/${targetPageId}/posts?fields=id,message,created_time,full_picture&access_token=${token}`);
                let resData = await response.json();

                // 💡 ஒருவேளை பக்கத்தின் ID-ல் எர்ரர் வந்தால், பாதுகாப்பிற்காக பர்சனல் ஃபீடைத் தேடும்
                if (resData.error) {
                    console.warn("Page specific fetch failed, retrying with global feed...", resData.error);
                    const fallbackResponse = await fetch(`https://graph.facebook.com/v20.0/me/feed?fields=id,message,created_time,full_picture&access_token=${token}`);
                    resData = await fallbackResponse.json();
                }

                if (resData && resData.data && Array.isArray(resData.data) && resData.data.length > 0) {
                    postsContainer.innerHTML = ""; 
                    
                    resData.data.forEach(post => {
                        if (!post) return;
                        const postMessage = post.message ? post.message.substring(0, 50) + "..." : "Facebook Post / Reel Content";
                        const postDate = post.created_time ? new Date(post.created_time).toLocaleDateString() : "N/A";
                        const postImg = post.full_picture || "";

                        const postRow = document.createElement("div");
                        postRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;";
                        
                        postRow.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                ${postImg ? `<img src="${postImg}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">` : 
                                `<div style="width: 50px; height: 50px; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-video" style="margin:0; font-size: 16px; color: #fff;"></i></div>`}
                                <div style="text-align: left;">
                                    <h4 class="post-title-text" style="font-size: 15px; font-weight: 600; margin: 0;">${postMessage}</h4>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Published: ${postDate}</p>
                                </div>
                            </div>
                            <button class="link-post-btn" data-post-id="${post.id}" style="width: auto; padding: 8px 20px; font-size: 13px; margin: 0; background: linear-gradient(135deg, #2563eb, #1d4ed8);">Link</button>
                        `;
                        postsContainer.appendChild(postRow);
                    });

                    bindLinkButtons(user.id);

                } else {
                    postsContainer.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px 0;"><i class="fa-solid fa-circle-info" style="font-size:20px; margin-bottom:8px; color:#3b82f6;"></i><p>No active posts found on this Facebook page feed.</p></div>`;
                }
            } catch (err) {
                postsContainer.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px 0;">Failed to fetch live feed. Verify Meta Graph token.</div>`;
            }
        } else {
            postsContainer.innerHTML = `
                <div style="text-align: center; color: #f59e0b; padding: 30px 10px; background: rgba(245,158,11,0.05); border-radius:12px; border:1px dashed rgba(245,158,11,0.2);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 26px; margin-bottom: 10px;"></i>
                    <h4 style="color:#fff; font-size:16px; margin-bottom:4px;">Facebook Page Not Connected</h4>
                    <p style="font-size:13px; color:#94a3b8; max-width:400px; margin:0 auto 15px auto;">Connect your Facebook Page inside Settings first.</p>
                </div>`;
        }

    } catch (globalErr) {
        console.error("Global crash logic handled:", globalErr);
    }

    // க்ளோஸ் சிஸ்டம்
    const closeBtn = document.getElementById("closeOptionsBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const card = document.getElementById("automationOptionsCard");
            if (card) card.style.display = "none";
        });
    }

    const triggerMechanism = document.getElementById("triggerMechanism");
    if (triggerMechanism) {
        triggerMechanism.addEventListener("change", toggleKeywordInput);
    }
}

function bindLinkButtons(userUuid) {
    const linkButtons = document.querySelectorAll(".link-post-btn");
    linkButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const postId = btn.getAttribute("data-post-id");
            const titleEl = btn.parentElement.querySelector(".post-title-text");
            const postTitle = titleEl ? titleEl.innerText : "Linked Post";
            openAutomationOptions(postId, postTitle, userUuid);
        });
    });
}

async function openAutomationOptions(postId, postTitle, userUuid) {
    currentActivePostId = postId;
    const titleEl = document.getElementById("selectedPostTitle");
    if (titleEl) titleEl.innerText = "Link Settings: " + postTitle;
    
    const optionsCard = document.getElementById("automationOptionsCard");
    if (optionsCard) {
        optionsCard.style.display = "block";
        optionsCard.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleKeywordInput() {
    const mechanismEl = document.getElementById("triggerMechanism");
    const wrapper = document.getElementById("keywordInputWrapper");
    if (mechanismEl && wrapper) {
        wrapper.style.display = (mechanismEl.value === "keywords") ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", loadFacebookPageData);

// ==========================================
// 3. ACTION SAVE STATE
// ==========================================
const savePostAutomationBtn = document.getElementById("savePostAutomationBtn");
if (savePostAutomationBtn) {
    savePostAutomationBtn.addEventListener("click", async () => {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData || !sessionData.session) return;

        const mechanismEl = document.getElementById("triggerMechanism");
        const excludeEl = document.getElementById("excludeKeywords");
        const commentCheckEl = document.getElementById("commentAutoReplyCheck");
        const dmCheckEl = document.getElementById("sendDMCheck");
        const delayEl = document.getElementById("delayTime");
        const btnTitleEl = document.getElementById("templateBtnTitle");
        const urlEl = document.getElementById("templateUrl");
        const descEl = document.getElementById("templateDescription");

        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: sessionData.session.user.id,
                fb_trigger_type: mechanismEl ? mechanismEl.value : "all",
                fb_exclude_keywords: excludeEl ? excludeEl.value.trim() : "",
                fb_comment_reply_active: commentCheckEl ? commentCheckEl.checked : false,
                fb_dm_active: dmCheckEl ? dmCheckEl.checked : false,
                fb_delay: delayEl ? delayEl.value.trim() : "",
                fb_btn_title: btnTitleEl ? btnTitleEl.value.trim() : "",
                fb_url: urlEl ? urlEl.value.trim() : "",
                fb_desc: descEl ? descEl.value.trim() : "",
                updated_at: new Date()
            });

        if (error) {
            alert("Sync Failed: " + error.message);
        } else {
            alert("Automation Flow Linked Successfully! 🎉");
            const card = document.getElementById("automationOptionsCard");
            if (card) card.style.display = "none";
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
        if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); window.location.href = link.url; });
    });
});
            
