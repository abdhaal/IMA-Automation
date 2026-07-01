// ===============================
// IMA Automation - index.js
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            e.preventDefault();

            const target = document.querySelector(this.getAttribute("href"));

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    });

    // Navbar Background on Scroll

    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 60) {

            navbar.style.background = "rgba(8,15,35,.95)";
            navbar.style.backdropFilter = "blur(20px)";
            navbar.style.boxShadow = "0 5px 20px rgba(0,0,0,.35)";

        } else {

            navbar.style.background = "rgba(8,15,35,.70)";
            navbar.style.boxShadow = "none";

        }

    });

    // Feature Card Hover Animation

    const cards = document.querySelectorAll(".feature-card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-10px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0px)";

        });

    });

    // Pricing Card Animation

    const pricing = document.querySelector(".pricing-card");

    if (pricing) {

        pricing.addEventListener("mouseenter", () => {

            pricing.style.transform = "scale(1.03)";

        });

        pricing.addEventListener("mouseleave", () => {

            pricing.style.transform = "scale(1)";

        });

    }

    // Counter Animation

    const counters = document.querySelectorAll(".stats h2");

    counters.forEach(counter => {

        const target = counter.innerText;

        const number = parseInt(target.replace(/\D/g, ""));

        const suffix = target.replace(/[0-9]/g, "");

        let count = 0;

        const speed = number / 100;

        function updateCounter() {

            if (count < number) {

                count += speed;

                counter.innerText = Math.floor(count) + suffix;

                requestAnimationFrame(updateCounter);

            } else {

                counter.innerText = target;

            }

        }

        updateCounter();

    });

    // Fade In Sections

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0px)";

            }

        });

    }, {

        threshold: 0.15

    });

    document.querySelectorAll("section").forEach(section => {

        section.style.opacity = "0";
        section.style.transform = "translateY(40px)";
        section.style.transition = ".8s";

        observer.observe(section);

    });

});
