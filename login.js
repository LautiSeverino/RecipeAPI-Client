document.addEventListener("DOMContentLoaded", function () {
    const formTitle = document.getElementById("form-title");
    const emailLabel = document.getElementById("email-label");
    const emailInput = document.getElementById("email");
    const submitButton = document.getElementById("submitButton");
    const toggleFormLink = document.getElementById("toggleForm");
    const rememberMeSection = document.getElementById("remember-me-section");
    const authForm = document.getElementById("auth-form");

    let isLogin = true;

    // Alternar entre Login y Register
    toggleFormLink.addEventListener("click", function () {
        if (isLogin) {
            formTitle.textContent = "Register";
            emailLabel.classList.remove("hidden");
            emailInput.classList.remove("hidden");
            submitButton.textContent = "Sing Up";
            toggleFormLink.textContent = "Log In";
            rememberMeSection.classList.add("hidden");
        } else {
            formTitle.textContent = "Log In";
            emailLabel.classList.add("hidden");
            emailInput.classList.add("hidden");
            submitButton.textContent = "Sign In";
            toggleFormLink.textContent = "Register";
            rememberMeSection.classList.remove("hidden");
        }
        isLogin = !isLogin;
    });

    // Enviar el formulario para Login o Register
    authForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Configurar la URL y el cuerpo de la solicitud dependiendo del modo
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
                    // Guardar el token en localStorage y redirigir si es necesario
                    localStorage.setItem("jwtToken", result.token);
                    alert("Login successful!");
                    window.location.href = "index.html"; // Cambia esto a la URL de tu página principal
                } else {
                    alert("Registration successful! You can now log in.");
                    toggleFormLink.click(); // Cambia a la vista de Login
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
