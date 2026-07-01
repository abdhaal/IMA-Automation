// =========================
// IMA Automation Auth
// =========================

// 🔹 Replace with your Supabase details
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

// --------------------
// Password Toggle
// --------------------

togglePassword.onclick = () => {

if(password.type==="password"){

password.type="text";

togglePassword.className="fa-solid fa-eye-slash";

}else{

password.type="password";

togglePassword.className="fa-solid fa-eye";

}

};

// --------------------
// Switch Login / Signup
// --------------------

switchMode.onclick=(e)=>{

e.preventDefault();

signupMode=!signupMode;

if(signupMode){

title.innerText="Create Account";

subtitle.innerText="Start your automation";

submitBtn.innerText="Sign Up";

switchText.innerText="Already have an account?";

switchMode.innerText="Sign In";

forgotPassword.style.display="none";

}else{

title.innerText="Welcome Back";

subtitle.innerText="Sign in to continue";

submitBtn.innerText="Sign In";

switchText.innerText="Don't have an account?";

switchMode.innerText="Sign Up";

forgotPassword.style.display="block";

}

};

// --------------------
// Email Auth
// --------------------

authForm.addEventListener("submit",async(e)=>{

e.preventDefault();

submitBtn.disabled=true;

submitBtn.innerText="Please Wait...";

if(signupMode){

const {error}=await supabase.auth.signUp({

email:email.value,

password:password.value

});

if(error){

alert(error.message);

}else{

alert("Account Created Successfully.");

signupMode=false;

location.reload();

}

}else{

const {error}=await supabase.auth.signInWithPassword({

email:email.value,

password:password.value

});

if(error){

alert(error.message);

}else{

window.location.href="dashboard.html";

}

}

submitBtn.disabled=false;

submitBtn.innerText=signupMode?"Sign Up":"Sign In";

});

// --------------------
// Forgot Password
// --------------------

forgotPassword.onclick=async(e)=>{

e.preventDefault();

if(email.value==""){

alert("Enter Email First");

return;

}

const {error}=await supabase.auth.resetPasswordForEmail(

email.value,

{

redirectTo:window.location.origin+"/reset.html"

}

);

if(error){

alert(error.message);

}else{

alert("Password Reset Email Sent");

}

};

// --------------------
// Google Login
// --------------------

googleLogin.onclick=async()=>{

await supabase.auth.signInWithOAuth({

provider:"google",

options:{

redirectTo:window.location.origin+"/dashboard.html"

}

});

};

// --------------------
// Auto Session
// --------------------

(async()=>{

const {data}=await supabase.auth.getSession();

if(data.session){

window.location.href="dashboard.html";

}

})();
