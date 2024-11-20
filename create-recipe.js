document.addEventListener("DOMContentLoaded", function () {
    const recipeId = new URLSearchParams(window.location.search).get("recipeId"); // Cambiar "id" por "recipeId" si corresponde
    const isEditMode = !!recipeId;
    const pageTitle = document.getElementById("page-title");
    const submitButton = document.getElementById("submit-button");
    const recipeForm = document.getElementById("recipe-form");
    const fileInput = document.getElementById("image");
    const imagePreview = document.getElementById("image-preview");

    if (isEditMode) {
        pageTitle.textContent = "Edit Recipe";
        submitButton.textContent = "Update Recipe";
        loadRecipeData(recipeId);
    } else {
        pageTitle.textContent = "Create Recipe";
    }

    document.getElementById("image").addEventListener("change", function (event) {
        const file = event.target.files[0];
        const preview = document.getElementById("image-preview");
    
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = "";
        }
    });
    

    recipeForm.addEventListener("submit", async function (event) {
        event.preventDefault();
    
        const file = fileInput.files[0];
        let imageBase64 = "";
    
        if (file) {
            // Convertir nueva imagen a Base64
            const reader = new FileReader();
            imageBase64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } else if (isEditMode) {
            // Usar la imagen actual si no se selecciona una nueva
            const imagePreview = document.getElementById("image-preview");
            imageBase64 = imagePreview.src.includes("base64") 
                ? imagePreview.src.split(",")[1] 
                : null; // Si no hay imagen previa, enviar null
        }
    
        const recipeData = {
            name: document.getElementById("name").value,
            description: document.getElementById("description").value,
            ingredients: document.getElementById("ingredients").value.split(",").map(i => i.trim()),
            steps: document.getElementById("steps").value.split(",").map(i => i.trim()),
            preparationTime: parseInt(document.getElementById("preparationTime").value),
            cookingTime: parseInt(document.getElementById("cookingTime").value),
            servings: parseInt(document.getElementById("servings").value),
            category: document.getElementById("category").value,
            imageBase64: imageBase64 || null, // Enviar null si no hay imagen
        };
    
        const url = isEditMode 
            ? `https://recipeapi.somee.com/api/Recipes/${recipeId}`
            : "https://recipeapi.somee.com/api/Recipes";
        const method = isEditMode ? "PUT" : "POST";
    
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
                },
                body: JSON.stringify(recipeData),
            });
    
            if (response.ok) {
                alert(isEditMode ? "Recipe updated successfully!" : "Recipe created successfully!");
                window.location.href = "index.html";
            } else {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                alert(errorData.title || "An error occurred. Please try again.");
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert("An error occurred. Please try again.");
        }
    });
    
    

    fileInput.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = "block";
            };

            reader.readAsDataURL(this.files[0]);
        } else {
            imagePreview.src = "";
            imagePreview.style.display = "none";
        }
    });

    async function loadRecipeData(recipeId) {
        try {
            const response = await fetch(`https://recipeapi.somee.com/api/Recipes/${recipeId}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
                }
            });
    
            if (response.ok) {
                const recipe = await response.json();
                document.getElementById("name").value = recipe.name;
                document.getElementById("description").value = recipe.description;
                document.getElementById("ingredients").value = recipe.ingredients.join(",");
                document.getElementById("steps").value = recipe.steps.join(",");
                document.getElementById("preparationTime").value = recipe.preparationTime;
                document.getElementById("cookingTime").value = recipe.cookingTime;
                document.getElementById("servings").value = recipe.servings;
                document.getElementById("category").value = recipe.category;
    
                // Mostrar la imagen si existe
                if (recipe.imageBase64) {
                    const imagePreview = document.getElementById("image-preview");
                    imagePreview.src = `data:image/jpeg;base64,${recipe.imageBase64}`; // Convertir base64 a src
                    imagePreview.style.display = "block";
                }
            } else {
                const errorData = await response.json();
                console.error("Error:", errorData);
                alert(errorData.message || "Failed to load recipe data.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while loading the recipe data.");
        }
    }
    
    
});
