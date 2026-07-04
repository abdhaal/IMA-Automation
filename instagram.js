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

// 🎯 ACCORDION CONTROLLERS
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
            
            // மொபைல் ப்ரிவியூ படத்தைப் புதுப்பித்தல்
            const imgSlot = document.querySelector(".preview-img-slot");
            if (imgSlot) imgSlot.innerHTML = `<img src="${postImg}" style="width:100%; height:100%; object-fit:cover;">`;

            document.getElementById("automationOptionsCard").style.display = "grid";
            document.getElementById("automationOptionsCard").scrollIntoView({ behavior: 'smooth' });
            
            window.toggleAccordion('triggerAcc');
        });
    });
}

// 🎯 REAL-TIME MIRROR ENGINE (உடனுக்குடன் மொபைல் திரையில் மாறும் லேபிள்)
document.addEventListener("DOMContentLoaded", () => {
    loadInstagramPageData();

    document.getElementById("closeOptionsBtn")?.addEventListener("click", () => {
        document.getElementById("automationOptionsCard").style.display = "none";
    });

    document.getElementById("triggerMechanism")?.addEventListener("change", (e) => {
        document.getElementById("keywordInputWrapper").style.display = (e.target.value === "keywords") ? "block" : "none";
    });

    // Inputs-களை மொபைல் மிரருடன் இணைத்தல்
    const headlineInput = document.getElementById("templateHeadline");
    const descInput = document.getElementById("templateDescription");
    const btnTitleInput = document.getElementById("templateBtnTitle");

    headlineInput?.addEventListener("input", (e) => {
        document.getElementById("livePreviewHeadline").innerText = e.target.value || "Card Headline";
    });

    descInput?.addEventListener("input", (e) => {
        document.getElementById("livePreviewDesc").innerText = e.target.value || "Template Description text goes here...";
    });

    btnTitleInput?.addEventListener("input", (e) => {
        document.getElementById("livePreviewBtn").innerText = e.target.value || "Button Title";
    });
});

// SAVE TO SUPABASE DB
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
            ig_comment_reply_active: document.getElementById("commentAutoReplyCheck").checked,
            ig_dm_active: document.getElementById("sendDMCheck").checked,
            ig_delay: document.getElementById("delayTime").value.trim(),
            ig_btn_title: document.getElementById("templateBtnTitle").value.trim(),
            ig_headline: document.getElementById("templateHeadline")?.value.trim() || "",
            ig_url: document.getElementById("templateUrl").value.trim(),
            ig_desc: document.getElementById("templateDescription").value.trim(),
            updated_at: new Date()
        });

    if (error) {
        alert("Instagram Sync Failed: " + error.message);
    } else {
        alert("Configuration Linked with Live Preview Mockup Successfully! 🚀🎉");
        document.getElementById("automationOptionsCard").style.display = "none";
    }
});
