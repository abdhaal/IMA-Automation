// ==============================
// IMA Automation Login.js
// ==============================

// Supabase
const SUPABASE_URL = "https://jrjigvhzkicmgketrmbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyamlndmh6a2ljbWdrZXRybWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzYyODEsImV4cCI6MjA5ODE1MjI4MX0.4FHwDGywcybt_tu52Dv5e2YEgCN3uKbKI0l844RA3Og";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Elements
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
// Password Toggle
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
// Login / Signup Switch
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
// Login / Signup
// =========================

authForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerText = "Please Wait...";

    try {

        if (signupMode) {

            const { error } = await supabase.auth.signUp({

                email: email.value,
                password: password.value

            });

            if (error) throw error;

            alert("Account Created Successfully!");

            signupMode = false;
            location.reload();

        } else {

            const { error } = await supabase.auth.signInWithPassword({

                email: email.value,
                password: password.value

            });

            if (error) throw error;

            alert("Login Successful");

            window.location.href = "dashboard.html";

        }

    } catch (err) {

        alert(err.message);

    }

    submitBtn.disabled = false;
    submitBtn.innerText = signupMode ? "Sign Up" : "Sign In";

});

// =========================
// Forgot Password
// =========================

forgotPassword.addEventListener("click", async function (e) {

    e.preventDefault();

    if (email.value === "") {

        alert("Enter your email first.");
        return;

    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.value);

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

    const { error } = await supabase.auth.signInWithOAuth({

        provider: "google"

    });

    if (error) {

        alert(error.message);

    }

});

// =========================
// Auto Login
// =========================

(async () => {

    const { data } = await supabase.auth.getSession();

    if (data.session) {

        window.location.href = "dashboard.html";

    }

})();
