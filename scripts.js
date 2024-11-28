document.addEventListener("DOMContentLoaded", function () {
    //const apiUrl = "https://recipeapi.somee.com/api/Recipes/GetRecipesWithComments";
    const apiUrl = "https://localhost:7176/api/Recipes/GetRecipes";
    const recipeContainer = document.getElementById("recipe-container");
    const modal = document.getElementById("recipeModal");
    const authButton = document.getElementById("auth-button");

    document.getElementById("search-btn").addEventListener("click", searchRecipes);
    document.getElementById("create-recipe-link").addEventListener("click", function (event) {
        event.preventDefault();

        const jwtToken = localStorage.getItem("jwtToken");
        if (jwtToken) {
            try {

                const payload = JSON.parse(atob(jwtToken.split(".")[1]));
                const currentTime = Math.floor(Date.now() / 1000);

                if (payload.exp && payload.exp > currentTime) {

                    window.location.href = "create-recipe.html";
                    return;
                }
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }


        window.location.href = "login.html";
    });

    updateAuthButton();


    function updateAuthButton() {
        const token = localStorage.getItem("jwtToken");
        if (token && !isTokenExpired(token)) {
            authButton.innerHTML = `<i class="fa fa-sign-out auth-icon" title="Cerrar Sesión"></i>`;
            authButton.querySelector('.auth-icon').addEventListener("click", function () {
                localStorage.removeItem("jwtToken");
                window.location.href = "login.html";
            });
        } else {
            authButton.innerHTML = `<i class="fa fa-sign-in auth-icon" title="Iniciar Sesión / Registrarse"></i>`;
            authButton.querySelector('.auth-icon').addEventListener("click", function () {
                window.location.href = "login.html";
            });
        }
    }

    // Cargar recetas iniciales
    fetchRecipes(apiUrl);

    async function fetchRecipes(url) {
        fetch(url)
            .then(response => response.json())
            .then(recipes => {
                displayRecipes(recipes);
            })
            .catch(error => {
                console.error("Error fetching recipes:", error);
                recipeContainer.innerHTML = "<p>Error al cargar las recetas.</p>";
            });
    }

    async function searchRecipes() {
        const searchCriteria = document.getElementById("search-criteria").value;
        const searchValue = document.getElementById("search-input").value.trim();
        const urlBase = "https://recipeapi.somee.com/api/Recipes";
        let url = `${urlBase}/AdvancedSearch`;


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
                if (!response.ok) throw new Error("No se encontraron recetas.");
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
        recipeContainer.innerHTML = "";
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
        recipeContainer.innerHTML = `<p class="no-results">No se encontraron recetas. Revisa tu busqueda.</p>`;
    }

    function createRecipeCard(recipe) {
        const card = document.createElement("div");
        card.classList.add("card");

        const imageSrc = recipe.imageBase64
            ? `data:image/jpeg;base64,${recipe.imageBase64}`
            : "ruta/default/image.jpg";

        card.innerHTML = `
            <img src="${imageSrc}" alt="${recipe.name}" class="card-img">
            <div class="card-body">
                <h2 class="card-title">${recipe.name}</h2>
                <h4 class="card-author">Por ${recipe.createdByName}</h4>
                <h5 class="card-category">${recipe.category}</h5>
                <p class="card-preparation-time">Tiempo de Preparación: ${recipe.preparationTime} mins</p>
            </div>
        `;

        card.addEventListener("click", function () {
            showRecipeDetails(recipe);
            loadComments(recipe.id);
        });

        return card;
    }



    function showRecipeDetails(recipe) {
        const userId = getUserIdFromToken();

        // Verifica si el modal existe antes de continuar
        const modal = document.getElementById("recipeModal");
        if (!modal) {
            console.error("Modal no encontrado");
            return; // Salir si el modal no se encuentra
        }

        // Establecer el contenido del modal
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

        // Mostrar ingredientes y pasos
        document.getElementById("modal-ingredients").innerHTML = recipe.ingredients
            .map(ingredient => `<p>${ingredient}</p>`)
            .join("");
        document.getElementById("modal-steps").innerHTML = recipe.steps
            .map(step => `<p>${step}</p>`)
            .join("");

        // Asignar el recipeId al modal
        modal.setAttribute("data-recipe-id", recipe.id); // Ahora debe funcionar

        const editButton = document.getElementById("edit-recipe-btn");
        if (editButton) {
            if (userId && userId === recipe.createdBy) {
                editButton.style.display = "block";
                editButton.onclick = function () {
                    localStorage.setItem("recipeToEdit", JSON.stringify(recipe));
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

        const addCommentButton = document.getElementById("add-comment-btn");
        if (addCommentButton) {
            // Elimina cualquier listener anterior
            const newButton = addCommentButton.cloneNode(true);
            addCommentButton.parentNode.replaceChild(newButton, addCommentButton);

            newButton.addEventListener("click", function () {
                const commentInput = document.getElementById("comment-input");
                const commentContent = commentInput.value.trim();
                const userId = getUserIdFromToken();

                if (!userId) {
                    window.location.href = "login.html";
                    return;
                }

                if (commentContent) {
                    const recipeId = modal.getAttribute("data-recipe-id");

                    if (!recipeId) {
                        console.error("recipeId no está definido");
                        return;
                    }

                    // Llamada a la función que maneja la creación del comentario
                    createComment(recipeId, commentContent, localStorage.getItem("jwtToken"));
                }
            });
        }


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


    function addCommentToDOM(comment, recipe) {
        const commentsList = document.getElementById("comments-list");

        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");

        // Obtener el userId actual del token
        const userId = getUserIdFromToken();

        // Calcular permisos si no están definidos
        comment.isOwner = comment.userId === userId;
        const isRecipeOwner = recipe.createdBy === userId;

        // Crear el HTML de los comentarios
        commentElement.innerHTML = `
            <p>${comment.content}</p>
            <small>Publicado el ${new Date(comment.date).toLocaleString()}</small>
            <div class="comment-buttons">
                ${comment.isOwner ? `<i class="fas fa-pencil-alt edit-comment-btn" title="Editar"></i>` : ""}
                ${(isRecipeOwner || comment.isOwner) ? `<i class="fas fa-trash delete-comment-btn" title="Eliminar"></i>` : ""}
            </div>
        `;

        // Asignar eventos a los botones
        const editBtn = commentElement.querySelector(".edit-comment-btn");
        if (editBtn) {
            editBtn.addEventListener("click", function () {
                enableCommentEditMode(commentElement, comment, comment.id);
            });
        }

        const deleteBtn = commentElement.querySelector(".delete-comment-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", function () {
                deleteComment(comment.id, commentElement);
            });
        }

        commentsList.appendChild(commentElement);
    }



    function enableCommentEditMode(commentElement, comment, commentId) {
        const originalContent = comment.content;

        // Agrega la clase de edición
        commentElement.classList.add("edit-mode");

        // Crear el input para edición
        const input = document.createElement("input");
        input.type = "text";
        input.value = originalContent;
        input.classList.add("edit-input");

        // Determina el propietario del comentario y la receta
        const userId = getUserIdFromToken(); // Asegúrate de que esta función existe y retorna el userId
        const isOwner = userId === comment.userId;
        const isRecipeOwner = comment.recipeCreatedBy && userId === comment.recipeCreatedBy;

        // Crear el botón Guardar
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Guardar";
        saveBtn.classList.add("save-edit-btn");

        saveBtn.addEventListener("click", function () {
            const newContent = input.value.trim();
            if (newContent && newContent !== originalContent) {
                updateComment(commentId, newContent)
                    .then(() => {
                        comment.content = newContent; // Actualiza el contenido localmente
                        restoreOriginalView(isOwner, isRecipeOwner); // Pasa las variables a la función
                    })
                    .catch(error => console.error("Error al actualizar el comentario:", error));
            } else {
                restoreOriginalView(isOwner, isRecipeOwner); // Pasa las variables aunque no haya cambios
            }
        });

        // Crear el botón Cancelar
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancelar";
        cancelBtn.classList.add("cancel-edit-btn");
        cancelBtn.addEventListener("click", () => restoreOriginalView(isOwner, isRecipeOwner));

        const buttonsContainer = commentElement.querySelector(".comment-buttons");
        buttonsContainer.innerHTML = "";
        buttonsContainer.appendChild(saveBtn);
        buttonsContainer.appendChild(cancelBtn);

        // Reemplazar el texto con el input
        commentElement.replaceChild(input, commentElement.querySelector("p"));

        // Modificar restoreOriginalView para aceptar isOwner e isRecipeOwner como parámetros
        function restoreOriginalView(isOwner, isRecipeOwner) {
            // Restaura el texto del comentario
            const commentText = document.createElement("p");
            commentText.textContent = comment.content;

            // Reemplaza el input con el texto del comentario
            commentElement.replaceChild(commentText, input);

            // Restaura los botones originales
            buttonsContainer.innerHTML = `
                ${isOwner ? `<i class="fas fa-pencil-alt edit-comment-btn" title="Editar"></i>` : ""}
                ${(isRecipeOwner || isOwner) ? `<i class="fas fa-trash delete-comment-btn" title="Eliminar"></i>` : ""}
            `;

            // Reasigna los eventos a los botones restaurados
            const editBtn = buttonsContainer.querySelector(".edit-comment-btn");
            if (editBtn) {
                editBtn.addEventListener("click", function () {
                    enableCommentEditMode(commentElement, comment, commentId);
                });
            }

            const deleteBtn = buttonsContainer.querySelector(".delete-comment-btn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", function () {
                    deleteComment(commentId, commentElement);
                });
            }

            // Remover la clase de edición
            commentElement.classList.remove("edit-mode");
        }
    }



    async function loadComments(recipeId) {
        // Hacer la solicitud para obtener la receta
        fetch(`https://localhost:7176/api/Recipes/${recipeId}`)
            .then(response => {
                if (!response.ok) throw new Error("Error al cargar la receta");
                return response.json();
            })
            .then(recipe => {
                // Luego de obtener la receta, hacer la solicitud de los comentarios
                fetch(`https://localhost:7176/api/Comments/byRecipe/${recipeId}`)
                    .then(response => {
                        if (!response.ok) throw new Error("Error al cargar los comentarios");
                        return response.json();
                    })
                    .then(comments => {
                        const commentsList = document.getElementById("comments-list");
                        commentsList.innerHTML = ""; // Limpiar comentarios previos
                        // Ahora pasamos tanto el comentario como la receta
                        comments.forEach(comment => addCommentToDOM(comment, recipe));
                    })
                    .catch(error => console.error("Error al cargar comentarios:", error));
            })
            .catch(error => console.error("Error al cargar la receta:", error));
    }

    function createComment(recipeId, commentContent, jwtToken) {
        // Aseguramos que commentInput esté definido
        const commentInput = document.getElementById("comment-input");

        if (!commentInput) {
            console.error("No se encontró el campo de comentario");
            return;
        }

        fetch("https://localhost:7176/api/Comments/Create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                recipeId: recipeId,
                content: commentContent
            })
        })
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es exitosa, intentamos obtener un mensaje de error
                    return response.text().then(err => {
                        throw new Error(`Error al agregar el comentario: ${err || 'Sin mensaje de error'}`);
                    });
                }

                // Si la respuesta tiene un cuerpo
                if (response.status !== 204) { // No es 204 (sin contenido)
                    return response.json(); // Intentamos parsear el JSON solo si tiene cuerpo
                }

                // Si la respuesta es 204 (sin contenido), lo consideramos como éxito
                return null;
            })
            .then(() => {
                loadComments(recipeId); // Recarga los comentarios
                commentInput.value = ""; // Limpia el campo de texto
            })
            .catch(error => {
                console.error("Error al agregar comentario:", error);
            });
    }





    async function updateComment(commentId, newContent) {
        const jwtToken = localStorage.getItem("jwtToken");

        // Devuelve la Promise generada por fetch
        return fetch(`https://localhost:7176/api/Comments/${commentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ content: newContent })
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al actualizar el comentario");
                console.log("Comentario actualizado con éxito");
            })
            .catch(error => {
                console.error("Error al actualizar comentario:", error);
                throw error; // Permite que el error sea capturado más arriba si es necesario
            });
    }





    function deleteComment(commentId, commentElement) {
        const jwtToken = localStorage.getItem("jwtToken");

        fetch(`https://localhost:7176/api/Comments/${commentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${jwtToken}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al eliminar el comentario");
                commentElement.remove(); // Eliminar del DOM
            })
            .catch(error => console.error("Error al eliminar comentario:", error));
    }




    function deleteRecipe(recipeId) {
        const token = localStorage.getItem("jwtToken");

        fetch(`https://recipeapi.somee.com/api/Recipes/${recipeId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.ok) {
                    modal.style.display = "none";
                    overlay.style.display = "none";
                    location.reload();
                } else {
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
