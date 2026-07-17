document.addEventListener("DOMContentLoaded", () => {
    // ⚠️ கீழே உள்ள YOUR_INSTAGRAM_ACCOUNT_ID_HERE-ஐ மட்டும் மாற்றுங்கள்
    const IG_ACCOUNT_ID = "17841463993777074"; 
    
    // உங்க Long-Lived Token இணைக்கப்பட்டுள்ளது
    const ACCESS_TOKEN = "EAAWLTQRidAIBR8iZCZBw7lnVKHpqwlxP1YvzGga3vSbU60U1fuWdoOnb5dWZCkYRKXuGly1mkBZCmW5FfRZCZAlfgyCY0gL7DSrnZBfYKCxXopL5tWrkEyIi1hrqpJIyNGBLMP4WRZBZB7UXgLq0QfP0NhZAVMzlg6BMiN3bEtZCpA7J11qvWNMZCZCf4OlGwcJkVwUSTtYYZD";

    const postsGrid = document.querySelector(".posts-grid") || document.getElementById("instagramPostsGrid");

    async function fetchRealInstagramPosts() {
        if (!postsGrid) return;
        postsGrid.innerHTML = "<p style='text-align:center; width:100%;'>Loading live posts from Instagram...</p>";

        try {
            const apiUrl = `https://graph.facebook.com/v18.0/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,like_count,comments_count,permalink&access_token=${ACCESS_TOKEN}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                console.error("Meta API Error:", data.error.message);
                postsGrid.innerHTML = `<p style="color:red; text-align:center; width:100%;">API Error: ${data.error.message}</p>`;
                return;
            }

            if (!data.data || data.data.length === 0) {
                postsGrid.innerHTML = "<p style='text-align:center; width:100%;'>No Instagram posts found yet.</p>";
                return;
            }

            renderPosts(data.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            postsGrid.innerHTML = "<p style='color:red; text-align:center; width:100%;'>Failed to load posts. Check your internet connection.</p>";
        }
    }

    function renderPosts(posts) {
        postsGrid.innerHTML = ""; 

        posts.forEach(post => {
            const postCard = document.createElement("div");
            postCard.className = "post-card";
            postCard.style.position = "relative";
            postCard.style.cursor = "pointer";
            
            const imageUrl = (post.media_type === "VIDEO") ? post.thumbnail_url : post.media_url;
            const isReel = (post.media_type === "VIDEO") ? `<i class="fa-solid fa-play" style="position:absolute; top:10px; right:10px; color:white; font-size:20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);"></i>` : "";

            postCard.innerHTML = `
                <img src="${imageUrl}" alt="IG Post" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px;">
                ${isReel}
                <div class="post-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); opacity: 0; display:flex; justify-content:center; align-items:center; color:white; border-radius: 8px; transition: opacity 0.3s; flex-direction:column; padding:10px; text-align:center;">
                    <div style="margin-bottom:10px;">
                        <span style="margin-right: 15px;"><i class="fa-solid fa-heart"></i> ${post.like_count || 0}</span>
                        <span><i class="fa-solid fa-comment"></i> ${post.comments_count || 0}</span>
                    </div>
                    <p style="font-size:12px; line-height:1.2; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;">${post.caption || ""}</p>
                </div>
            `;

            postCard.addEventListener("mouseenter", () => postCard.querySelector(".post-overlay").style.opacity = "1");
            postCard.addEventListener("mouseleave", () => postCard.querySelector(".post-overlay").style.opacity = "0");

            postCard.addEventListener("click", () => {
                alert(`⚡ Select Automation Type for Real Post ID: ${post.id}\n\n1. Comment Reply Setup\n2. DM Trigger Setup`);
                const featureModal = document.getElementById("automationModal"); 
                if (featureModal) featureModal.style.display = "block";
            });

            postsGrid.appendChild(postCard);
        });
    }

    fetchRealInstagramPosts();
});
