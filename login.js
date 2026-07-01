// ==============================
// IMA Automation Login.js
// ==============================

// Supabase Configuration
const SUPABASE_URL = "https://jrjigvhzkicmgketrmbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyamlndmh6a2ljbWdrZXRybWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzYyODEsImV4cCI6MjA5ODE1MjI4MX0.4FHwDGywcybt_tu52Dv5e2YEgCN3uKbKI0l844RA3Og";

// global window object-ல் உள்ள 'supabase'-ஐ பயன்படுத்தி 'supabaseClient' உருவாக்கப்பட்டுள்ளது
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// HTML Elements
const authForm = document.getElementById("authForm");
const email = document.getElementById("email");
const password = document.getElementById("password");

const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");

const submitBtn = document.getElementById("submitBtn");

const switchMode = document.getElementById("switchMode");
const switchText = document.getElementById("switchText");

const forgotPassword = document.getElementById("forgotPassword");

const googleLogin = document.getElementById("googleLogin");

const togglePassword = document.getElementById("togglePassword");

let signupMode = false;

// =========================
// Password Toggle (Password-ஐ காட்டி/மறைக்க)
// =========================
if (togglePassword) {

    togglePassword.addEventListener("click", function () {

        if (password.type === "password") {

            password.type = "text";
            this.classList.remove("fa-eye");
            this.classList.add("fa-eye-slash");

        } else {

            password.type = "password";
            this.classList.remove("fa-eye-slash");
            this.classList.add("fa-eye");

        }

    });

}

// =========================
// Login / Signup Switch (பக்கத்தை மாற்றுதல்)
// =========================
switchMode.addEventListener("click", function (e) {

    e.preventDefault();

    signupMode = !signupMode;

    if (signupMode) {

        title.textContent = "Create Account";
        subtitle.textContent = "Create your automation account";

        submitBtn.textContent = "Sign Up";

        switchText.textContent = "Already have an account?";
        switchMode.textContent = "Sign In";

        forgotPassword.style.display = "none";

    } else {

        title.textContent = "Welcome Back";
        subtitle.textContent = "Sign in to continue";

        submitBtn.textContent = "Sign In";

        switchText.textContent = "Don't have an account?";
        switchMode.textContent = "Sign Up";

        forgotPassword.style.display = "block";

    }

});

// =========================
// Login / Signup Form Submit
// =========================
authForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerText = "Please Wait...";

    try {

        if (signupMode) {

            const { error } = await supabaseClient.auth.signUp({
                email: email.value,
                password: password.value
            });

            if (error) throw error;

            alert("Account Created Successfully!");

            signupMode = false;
            location.reload();

        } else {

            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email.value,
                password: password.value
            });

            if (error) throw error;

            alert("Login Successful");

            window.location.href = "dashboard.html";

        }

    } catch (err) {
    console.error("Full Error:", err); // கன்சோலிலும் எரர் தெரியும்
    
    // எரர் மெசேஜ் இருந்தால் அதை காட்டும், இல்லையென்றால் ஆப்ஜெக்ட்டை டெக்ஸ்ட்டாக மாற்றி காட்டும்
    if (err.message) {
        alert(err.message);
    } else {
        alert(JSON.stringify(err));
    }
}


    submitBtn.disabled = false;
    submitBtn.innerText = signupMode ? "Sign Up" : "Sign In";

});

// =========================
// Forgot Password (கடவுச்சொல் மறதி)
// =========================
forgotPassword.addEventListener("click", async function (e) {

    e.preventDefault();

    if (email.value === "") {

        alert("Enter your email first.");
        return;

    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email.value);

    if (error) {

        alert(error.message);

    } else {

        alert("Password Reset Email Sent");

    }

});

// =========================
// Google Login
// =========================
googleLogin.addEventListener("click", async function () {

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google"
    });

    if (error) {

        alert(error.message);

    }

});

// =========================
// Auto Login (ஏற்கனவே லாகின் செய்திருந்தால்)
// =========================
(async () => {

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {

        window.location.href = "dashboard.html";

    }

})();
