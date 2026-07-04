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
let currentSelectedTemplateType = "media";

// RENDERING REPLY RUSH FEED CARDS
async function loadInstagramPageData() {
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

        const mockInstagramPosts = [
            { id: "ig_01", title: "Smart Solar Step Lights for Stairs & Walls! 🔥", date: "04 Jul 2026", img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80", comments: "48", likes: "2.4k" },
            { id: "ig_02", title: "Stop Dust, Insects & AC Cooling Loss with This!", date: "04 Jul 2026", img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80", comments: "12", likes: "840" },
            { id: "ig_03", title: "High Power 3-in-1 Mini Vacuum Cleaner for Car 🚗", date: "03 Jul 2026", img: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80", comments: "93", likes: "4.1k" }
        ];

        postsContainer.innerHTML = "";
        mockInstagramPosts.forEach(post => {
            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <img src="${post.img}" class="post-thumb" alt="thumb">
                <div class="post-meta-badges">
                    <span class="meta-badge"><i class="fa-solid fa-comment" style="color:#ec4899;"></i> ${post.comments}</span>
                    <span class="meta-badge"><i class="fa-solid fa-heart" style="color:#f43f5e;"></i> ${post.likes}</span>
                </div>
                <div class="post-details">
                    <div>
                        <h4>${post.title}</h4>
                        <p><i class="fa-solid fa-clock"></i> ${post.date}</p>
                    </div>
                    <button class="replyrush-btn" data-post-id="${post.id}" data-img="${post.img}">
                        <i class="fa-solid fa-link"></i> Link Post Setup
                    </button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

        bindLinkButtons(user.id);

    } catch (gErr) { console.error(gErr); }
}

// ACCORDION CONTROLLERS
window.toggleAccordion = function(accId) {
    const content = document.getElementById(accId);
    if (!content) return;
    const isVisible = content.style.display === "block";
    
    document.querySelectorAll(".accordion-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".accordion-header i").forEach(el => el.className = "fa-solid fa-chevron-down");
    
    if (!isVisible) {
        content.style.display = "block";
        const header = content.previousElementSibling;
        if (header && header.querySelector("i")) header.querySelector("i").className = "fa-solid fa-chevron-up";
    }
};

function bindLinkButtons(userUuid) {
    document.querySelectorAll(".replyrush-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            currentActivePostId = btn.getAttribute("data-post-id");
            const title = btn.closest(".post-card").querySelector("h4").innerText;
            const postImg = btn.getAttribute("data-img");
            
            document.getElementById("selectedPostTitle").innerText = "Link Settings: " + title;
            
            // Set image to mock smartphone card slots
            const imgSlot = document.getElementById("previewImageSlot");
            if (imgSlot) imgSlot.innerHTML = `<img src="${postImg}" style="width:100%; height:100%; object-fit:cover;" id="actualPreviewedImageSrc">`;

            document.getElementById("automationOptionsCard").style.display = "grid";
            document.getElementById("automationOptionsCard").scrollIntoView({ behavior: 'smooth' });
            
            window.toggleAccordion('triggerAcc');
        });
    });
}

// 🎯 REAL-TIME TEMPLATE SWITCHER ENGINE
function handleTemplateTypeSwitch(type) {
    currentSelectedTemplateType = type;
    
    const hBlock = document.getElementById("headlineFieldBlock");
    const dBlock = document.getElementById("descriptionFieldBlock");
    const bBlock = document.getElementById("buttonTitleFieldBlock");
    const uBlock = document.getElementById("urlFieldBlock");
    
    const richCard = document.getElementById("previewRichCardContainer");
    const imgSlot = document.getElementById("previewImageSlot");
    const bodyContent = document.getElementById("previewCardBodyContent");
    const liveBtn = document.getElementById("livePreviewBtn");

    // Standard baseline reset
    hBlock.style.display = "block";
    dBlock.style.display = "block";
    bBlock.style.display = "block";
    uBlock.style.display = "block";
    richCard.style.display = "flex";
    imgSlot.style.display = "flex";
    bodyContent.style.display = "block";
    liveBtn.style.display = "block";

    if (type === "media") {
        // Media template shows everything
    } else if (type === "text") {
        // Text template only shows description text inside a single bubble chat layout
        hBlock.style.display = "none";
        bBlock.style.display = "none";
        uBlock.style.display = "none";
        imgSlot.style.display = "none";
        bodyContent.style.display = "block";
        liveBtn.style.display = "none";
    } else if (type === "quick" || type === "button") {
        // Quick reply / Button layouts omit top hero imagery mapping
        imgSlot.style.display = "none";
    } else if (type === "attach") {
        // Attachments only mirror content streams without text blocks
        hBlock.style.display = "none";
        dBlock.style.display = "none";
        bBlock.style.display = "none";
        uBlock.style.display = "none";
        bodyContent.style.display = "none";
        liveBtn.style.display = "none";
    }
    
    // Refresh mirror elements manually to sync placeholder states properly
    triggerLiveMirrorUpdate();
}

function triggerLiveMirrorUpdate() {
    const headlineValue = document.getElementById("templateHeadline").value || "Card Headline";
    const descValue = document.getElementById("templateDescription").value || "Template Description text goes here...";
    const btnTitleValue = document.getElementById("templateBtnTitle").value || "Button Title";

    const liveHeadline = document.getElementById("livePreviewHeadline");
    const liveDesc = document.getElementById("livePreviewDesc");
    const liveBtn = document.getElementById("livePreviewBtn");

    if (currentSelectedTemplateType === "text") {
        liveDesc.innerText = document.getElementById("templateDescription").value || "Text Message flow placeholder...";
        liveHeadline.innerText = "";
    } else {
        liveHeadline.innerText = headlineValue;
        liveDesc.innerText = descValue;
        liveBtn.innerText = btnTitleValue;
    }
}

// DOM LISTENERS INTERACTION ENGINE
document.addEventListener("DOMContentLoaded", () => {
    loadInstagramPageData();

    document.getElementById("closeOptionsBtn")?.addEventListener("click", () => {
        document.getElementById("automationOptionsCard").style.display = "none";
    });

    document.getElementById("triggerMechanism")?.addEventListener("change", (e) => {
        document.getElementById("keywordInputWrapper").style.display = (e.target.value === "keywords") ? "block" : "none";
    });

    // Toggle Input boxes based on checkboxes state
    document.getElementById("commentAutoReplyCheck")?.addEventListener("change", (e) => {
        document.getElementById("commentTextInputWrapper").style.display = e.target.checked ? "block" : "none";
    });

    document.getElementById("sendDMCheck")?.addEventListener("change", (e) => {
        document.getElementById("engagementTextInputWrapper").style.display = e.target.checked ? "block" : "none";
        document.getElementById("previewEngagementBubble").style.display = e.target.checked ? "block" : "none";
    });

    // Real-time listen input streams mirror text
    document.getElementById("customEngagementText")?.addEventListener("input", (e) => {
        document.getElementById("previewEngagementBubble").innerText = e.target.value || "Hi there! Thanks for your interest! 👋";
    });

    document.getElementById("templateHeadline")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("templateDescription")?.addEventListener("input", triggerLiveMirrorUpdate);
    document.getElementById("templateBtnTitle")?.addEventListener("input", triggerLiveMirrorUpdate);

    // Template Selector Type Buttons bindings
    document.querySelectorAll(".template-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".template-type-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            handleTemplateTypeSwitch(btn.getAttribute("data-type"));
        });
    });
});

// SUBMIT SAVE FLOW RULE TARGETING
document.getElementById("savePostAutomationBtn")?.addEventListener("click", async () => {
    if (!currentUserUuid) return;

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: currentUserUuid,
            ig_active_post_id: currentActivePostId,
            ig_trigger_type: document.getElementById("triggerMechanism").value,
            ig_target_keywords: document.getElementById("targetKeywords")?.value.trim() || "",
            ig_exclude_keywords: document.getElementById("excludeKeywords").value.trim(),
            
            // Checkboxes & Text Values Saved to Database
            ig_comment_reply_active: document.getElementById("commentAutoReplyCheck").checked,
            ig_custom_comment_text: document.getElementById("customCommentReplyText")?.value.trim() || "",
            ig_dm_active: document.getElementById("sendDMCheck").checked,
            ig_custom_engagement_text: document.getElementById("customEngagementText")?.value.trim() || "",
            
            ig_delay: document.getElementById("delayTime").value.trim(),
            ig_template_type: currentSelectedTemplateType,
            ig_btn_title: document.getElementById("templateBtnTitle").value.trim(),
            ig_headline: document.getElementById("templateHeadline")?.value.trim() || "",
            ig_url: document.getElementById("templateUrl").value.trim(),
            ig_desc: document.getElementById("templateDescription").value.trim(),
            updated_at: new Date()
        });

    if (error) {
        alert("Instagram Sync Failed: " + error.message);
    } else {
        alert("Configuration Saved and Real-time Flows Synced Successfully! 🚀🎉");
        document.getElementById("automationOptionsCard").style.display = "none";
    }
});
