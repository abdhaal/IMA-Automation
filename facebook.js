document.addEventListener("DOMContentLoaded", () => {
    // உங்க உண்மையான Page ID மற்றும் Long-Lived Token இணைக்கப்பட்டுள்ளது
    const FB_PAGE_ID = "162377383635798"; 
    const ACCESS_TOKEN = "EAAWLTQRidAIBR8iZCZBw7lnVKHpqwlxP1YvzGga3vSbU60U1fuWdoOnb5dWZCkYRKXuGly1mkBZCmW5FfRZCZAlfgyCY0gL7DSrnZBfYKCxXopL5tWrkEyIi1hrqpJIyNGBLMP4WRZBZB7UXgLq0QfP0NhZAVMzlg6BMiN3bEtZCpA7J11qvWNMZCZCf4OlGwcJkVwUSTtYYZD";

    const fbFeedContainer = document.querySelector(".facebook-feed") || document.getElementById("facebookFeedGrid");

    async function fetchRealFacebookPosts() {
        if (!fbFeedContainer) return;
        fbFeedContainer.innerHTML = "<p style='text-align:center; width: 100%;'>Loading live Facebook posts...</p>";

        try {
            const apiUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed?fields=id,message,created_time,full_picture,likes.summary(true),comments.summary(true)&access_token=${ACCESS_TOKEN}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                fbFeedContainer.innerHTML = `<p style="color:red; text-align:center; width: 100%;">Facebook API Error: ${data.error.message}</p>`;
                return;
            }

            if (!data.data || data.data.length === 0) {
                fbFeedContainer.innerHTML = "<p style='text-align:center; width: 100%;'>No posts found on this Facebook page yet.</p>";
                return;
            }

            renderFBPosts(data.data);
        } catch (error) {
            fbFeedContainer.innerHTML = "<p style='color:red; text-align:center; width: 100%;'>Failed to load Facebook posts.</p>";
        }
    }

    function renderFBPosts(posts) {
        fbFeedContainer.innerHTML = ""; 
        
        posts.forEach(post => {
            const feedCard = document.createElement("div");
            feedCard.className = "fb-feed-card";
            feedCard.style.background = "#ffffff";
            feedCard.style.padding = "20px";
            feedCard.style.marginBottom = "20px";
            feedCard.style.borderRadius = "10px";
            feedCard.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";

            const likesCount = post.likes ? post.likes.summary.total_count : 0;
            const commentsCount = post.comments ? post.comments.summary.total_count : 0;
            const postDate = new Date(post.created_time).toLocaleDateString();

            feedCard.innerHTML = `
                <div class="fb-post-header" style="display:flex; align-items:center; margin-bottom: 12px;">
                    <div style="width:40px; height:40px; background:#1877f2; color:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; margin-right:10px;">FB</div>
                    <div>
                        <h4 style="margin:0; font-size:15px;">IMA Shopping Centre</h4>
                        <span style="font-size:12px; color:gray;">${postDate}</span>
                    </div>
                </div>
                <p style="font-size:14px; margin-bottom:12px; line-height:1.4;">${post.message || ""}</p>
                ${post.full_picture ? `<img src="${post.full_picture}" style="width:100%; max-height:350px; object-fit:cover; border-radius:8px; margin-bottom:12px;">` : ""}
                <div class="fb-post-stats" style="display:flex; justify-content:space-between; font-size:13px; color:gray; padding-top:10px; border-top: 1px solid #eee;">
                    <span><i class="fa-solid fa-thumbs-up" style="color:#1877f2;"></i> ${likesCount} Likes</span>
                    <span style="cursor:pointer; color:#1877f2; font-weight:bold;" class="setup-trigger"><i class="fa-solid fa-robot"></i> Automate (${commentsCount} Comments)</span>
                </div>
            `;

            const triggerBtn = feedCard.querySelector(".setup-trigger");
            triggerBtn.addEventListener("click", () => {
                alert(`⚡ Facebook Automation Trigger activated for Real Post ID: ${post.id}`);
            });

            fbFeedContainer.appendChild(feedCard);
        });
    }

    fetchRealFacebookPosts();
});
