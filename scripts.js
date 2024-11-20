document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "https://recipeapi.somee.com/api/Recipes/GetRecipesWithComments";
    const recipeContainer = document.getElementById("recipe-container");
    const modal = document.getElementById("recipeModal");
    const authButton = document.getElementById("auth-button");

    document.getElementById("search-btn").addEventListener("click", searchRecipes);
    updateAuthButton();

    function updateAuthButton() {
        const token = localStorage.getItem("jwtToken");
        if (token && !isTokenExpired(token)) {
            authButton.innerHTML = `<i class="fa fa-sign-out auth-icon" title="Log Out"></i>`;
            authButton.querySelector('.auth-icon').addEventListener("click", function () {
                localStorage.removeItem("jwtToken");
                window.location.href = "login.html";
            });
        } else {
            authButton.innerHTML = `<i class="fa fa-sign-in auth-icon" title="Log In / Register"></i>`;
            authButton.querySelector('.auth-icon').addEventListener("click", function () {
                window.location.href = "login.html";
            });
        }
    }

    // Cargar recetas iniciales
    fetchRecipes(apiUrl);

    function fetchRecipes(url) {
        fetch(url)
            .then(response => response.json())
            .then(recipes => {
                displayRecipes(recipes);
            })
            .catch(error => {
                console.error("Error fetching recipes:", error);
                recipeContainer.innerHTML = "<p>Failed to load recipes.</p>";
            });
    }

    function searchRecipes() {
        const searchCriteria = document.getElementById("search-criteria").value;
        const searchValue = document.getElementById("search-input").value.trim();
        const urlBase = "https://recipeapi.somee.com/api/Recipes";
        let url = `${urlBase}/AdvancedSearch`;
    
        // Construir URL en función del criterio seleccionado
        if (searchCriteria === "name") {
            url += `?name=${searchValue}`;
        } else if (searchCriteria === "category") {
            url += `?category=${searchValue}`;
        } else if (searchCriteria === "prepTime") {
            url += `?prepTime=${searchValue}`;
        } else if (searchCriteria === "cookTime") {
            url += `?cookTime=${searchValue}`;
        }
    
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("No recipes found.");
                return response.json();
            })
            .then(recipes => {
                displayRecipes(recipes);
            })
            .catch(error => {
                console.error("Error in search:", error);
                displayNoResults();
            });
    }
    

    function displayRecipes(recipes) {
        recipeContainer.innerHTML = ""; // Limpia el contenedor antes de mostrar resultados
        if (recipes.length === 0) {
            displayNoResults();
            return;
        }

        recipes.forEach(recipe => {
            const recipeCard = createRecipeCard(recipe);
            recipeContainer.appendChild(recipeCard);
        });
    }

    function displayNoResults() {
        recipeContainer.innerHTML = `<p class="no-results">No recipes found. Try adjusting your search.</p>`;
    }

    function createRecipeCard(recipe) {
        const card = document.createElement("div");
        card.classList.add("card");

        const imageSrc = recipe.imageBase64
            ? `data:image/jpeg;base64,${recipe.imageBase64}`
            : "ruta/default/image.jpg"; // Imagen por defecto si no hay imagen

        card.innerHTML = `
            <img src="${imageSrc}" alt="${recipe.name}" class="card-img">
            <div class="card-body">
                <h2 class="card-title">${recipe.name}</h2>
                <h4 class="card-subtitle">Por ${recipe.createdByName}</h4>
                <h5 class="card-category">${recipe.category}</h5>
                <p class="card-preparation-time">Prep Time: ${recipe.preparationTime} mins</p>
            </div>
        `;

        card.addEventListener("click", function () {
            showRecipeDetails(recipe);
        });

        return card;
    }

    function toggleMenu() {
        const navLinks = document.getElementById("nav-links");
        navLinks.classList.toggle("active");
    }
    

    function showRecipeDetails(recipe) {
        const userId = getUserIdFromToken();
    
        document.getElementById("modal-recipe-name").textContent = recipe.name;
        document.getElementById("modal-recipe-author").textContent = "Por " + recipe.createdByName;
        document.getElementById("modal-recipe-category").textContent = recipe.category;
        document.getElementById("modal-prep-time").textContent = recipe.preparationTime;
        document.getElementById("modal-description").textContent = recipe.description;
        document.getElementById("modal-cook-time").textContent = recipe.cookingTime;
        document.getElementById("modal-servings").textContent = recipe.servings;
    
        const imageSrc = recipe.imageBase64
            ? `data:image/jpeg;base64,${recipe.imageBase64}`
            : "ruta/default/image.jpg";
        document.getElementById("modal-recipe-img").src = imageSrc;
    
        // Mostrar ingredientes separados por líneas
        document.getElementById("modal-ingredients").innerHTML = recipe.ingredients
            .map(ingredient => `<p>${ingredient}</p>`)
            .join("");
    
        // Mostrar pasos separados por líneas
        document.getElementById("modal-steps").innerHTML = recipe.steps
            .map(step => `<p>${step}</p>`)
            .join("");
    
       // Configuración de botones de edición y eliminación
const editButton = document.getElementById("edit-recipe-btn");
if (editButton) {
    if (userId && userId === recipe.createdBy) {
        editButton.style.display = "block";
        editButton.onclick = function () {
            // Guardar datos de la receta en localStorage antes de redirigir
            localStorage.setItem("recipeToEdit", JSON.stringify(recipe));
            // Redirigir a la página de edición
            window.location.href = `create-recipe.html?recipeId=${recipe.id}`;

        };
    } else {
        editButton.style.display = "none";
    }
}

    
        const deleteButton = document.getElementById("delete-recipe-btn");
        if (deleteButton) {
            if (userId && userId === recipe.createdBy) {
                deleteButton.style.display = "block";
                deleteButton.onclick = function () {
                    deleteRecipe(recipe.id);
                };
            } else {
                deleteButton.style.display = "none";
            }
        }
    
        const commentsContainer = document.getElementById("modal-comments");
        commentsContainer.innerHTML = "";
        recipe.comments.forEach(comment => {
            const commentElement = document.createElement("div");
            commentElement.classList.add("comment");
            commentElement.innerHTML = `
                <p><strong>${comment.content}</strong></p>
                <p><em>Publicado el ${new Date(comment.date).toLocaleDateString()}</em></p>
            `;
            commentsContainer.appendChild(commentElement);
        });
    
        modal.style.display = "block";
        overlay.style.display = "block";
    }
    
    function getUserIdFromToken() {
        const token = localStorage.getItem("jwtToken");
        if (!token) return null;

        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        return decodedPayload["nameid"];
    }

    function deleteRecipe(recipeId) {
        const token = localStorage.getItem("jwtToken");

        fetch(`http://localhost:5101/api/Recipes/${recipeId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                alert("Recipe deleted successfully!");
                modal.style.display = "none";
                overlay.style.display = "none";
                location.reload();
            } else {
                alert("Error deleting recipe.");
            }
        })
        .catch(error => console.error("Error:", error));
    }

    overlay.addEventListener("click", function () {
        modal.style.display = "none";
        overlay.style.display = "none";
    });

    document.querySelector(".modal-close").addEventListener("click", function () {
        modal.style.display = "none";
        overlay.style.display = "none";
    });

    document.querySelector(".start-btn").addEventListener("click", function () {
        const token = localStorage.getItem("jwtToken");
        if (token) {
            if (!isTokenExpired(token)) {
                window.location.href = "create-recipe.html";
            } else {
                localStorage.removeItem("jwtToken");
                window.location.href = "login.html";
            }
        } else {
            window.location.href = "login.html";
        }
    });

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const exp = decodedPayload.exp * 1000;

        return Date.now() >= exp;
    }
});
