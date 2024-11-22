document.addEventListener("DOMContentLoaded", function () {
    const formTitle = document.getElementById("form-title");
    const emailLabel = document.getElementById("email-label");
    const emailInput = document.getElementById("email");
    const submitButton = document.getElementById("submitButton");
    const toggleFormLink = document.getElementById("toggleForm");
    const rememberMeSection = document.getElementById("remember-me-section");
    const authForm = document.getElementById("auth-form");

    let isLogin = true;

    
    toggleFormLink.addEventListener("click", function () {
        if (isLogin) {
            formTitle.textContent = "Registrarse";
            emailLabel.classList.remove("hidden");
            emailInput.classList.remove("hidden");
            submitButton.textContent = "Registrarse";
            toggleFormLink.textContent = "Iniciar Sesión";
            rememberMeSection.classList.add("hidden");
        } else {
            formTitle.textContent = "Iniciar Sesión";
            emailLabel.classList.add("hidden");
            emailInput.classList.add("hidden");
            submitButton.textContent = "Registrarse";
            toggleFormLink.textContent = "Iniciar Sesión";
            rememberMeSection.classList.remove("hidden");
        }
        isLogin = !isLogin;
    });

    
    authForm.addEventListener("submit", async function (event) {
        event.preventDefault();

    
        const url = isLogin 
            ? "https://recipeapi.somee.com/api/Auth/Login" 
            : "https://recipeapi.somee.com/api/Auth/Register";
        const data = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        };

        if (!isLogin) {
            data.email = document.getElementById("email").value;
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                if (isLogin) {
                    
                    localStorage.setItem("jwtToken", result.token);
                    alert("Login successful!");
                    window.location.href = "index.html";
                } else {
                    alert("Registration successful! You can now log in.");
                    toggleFormLink.click(); 
                }
            } else {
                alert(result || "An error occurred. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        }
    });
});
