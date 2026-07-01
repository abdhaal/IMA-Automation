// ===============================
// Meta Automation Dashboard JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // Automation Status
    const status = document.getElementById("automationStatus");

    if (status) {
        status.innerHTML = "🟢 Online";
        status.style.color = "#00ff88";
    }

    // Instagram Connect
    const instagram = document.getElementById("connectInstagram");

    if (instagram) {
        instagram.addEventListener("click", () => {

            alert("Instagram Graph API integration will be added in the next step.");

        });
    }

    // Facebook Connect
    const facebook = document.getElementById("connectFacebook");

    if (facebook) {
        facebook.addEventListener("click", () => {

            alert("Facebook Graph API integration will be added in the next step.");

        });
    }

    // Auto DM
    const autoDM = document.getElementById("autoDM");

    if (autoDM) {
        autoDM.addEventListener("click", () => {

            alert("Auto DM Enabled");

        });
    }

    // Auto Reply
    const autoReply = document.getElementById("autoReply");

    if (autoReply) {
        autoReply.addEventListener("click", () => {

            alert("Auto Reply Enabled");

        });
    }

    // Comment Automation
    const comment = document.getElementById("commentAutomation");

    if (comment) {
        comment.addEventListener("click", () => {

            alert("Comment Automation Enabled");

        });
    }

    // Logout
    const logout = document.getElementById("logoutBtn");

    if (logout) {

        logout.addEventListener("click", () => {

            if (confirm("Are you sure you want to logout?")) {

                localStorage.removeItem("user");

                window.location.href = "login.html";

            }

        });

    }

});
