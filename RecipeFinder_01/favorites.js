document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favorites-container");
  const mealDetails = document.getElementById("meal-details");
  const mealDetailsContent = document.querySelector(".meal-details-content");
  const backBtn = document.getElementById("back-btn");

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.length === 0) {
    container.innerHTML = `<p style="padding: 1rem;">You have no saved recipes yet.</p>`;
    return;
  }

  container.innerHTML = ""; // clear container before appending

  favorites.forEach((meal) => {
    container.innerHTML += `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3 class="meal-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
          <button class="unsave-btn"><i class="fas fa-star"></i> Unsave</button>
        </div>
      </div>
    `;
  });

  // Add event listeners to all unsave buttons
  document.querySelectorAll(".unsave-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering the meal block click event

      const mealDiv = e.target.closest(".meal");
      const mealId = mealDiv.dataset.mealId;

      // Remove meal from favorites array and update localStorage
      favorites = favorites.filter(meal => meal.idMeal !== mealId);
      localStorage.setItem("favorites", JSON.stringify(favorites));

      // Remove meal element from DOM
      mealDiv.remove();

      // Show message if no favorites left
      if (favorites.length === 0) {
        container.innerHTML = `<p style="padding: 1rem;">You have no saved recipes yet.</p>`;
      }
    });
  });

  // Add event listeners to each whole meal block for showing details
  document.querySelectorAll(".meal").forEach(mealDiv => {
    mealDiv.addEventListener("click", async (e) => {
      // Ignore clicks on the unsave button inside the meal block
      if (e.target.closest(".unsave-btn")) return;

      const mealId = mealDiv.dataset.mealId;

      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();

        if (data.meals && data.meals[0]) {
          const meal = data.meals[0];
          const ingredients = [];

          for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
              ingredients.push({
                ingredient: meal[`strIngredient${i}`],
                measure: meal[`strMeasure${i}`],
              });
            }
          }

          mealDetailsContent.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
            <h2 class="meal-details-title">${meal.strMeal}</h2>
            <div class="meal-details-category">
              <span>${meal.strCategory || "Uncategorized"}</span>
            </div>
            <div class="meal-details-instructions">
              <h3>Instructions</h3>
              <p>${meal.strInstructions}</p>
            </div>
            <div class="meal-details-ingredients">
              <h3>Ingredients</h3>
              <ul class="ingredients-list">
                ${ingredients
                  .map(item => `<li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>`)
                  .join("")}
              </ul>
            </div>
            ${
              meal.strYoutube
                ? `
              <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
                <i class="fab fa-youtube"></i> Watch Video
              </a>
            `
                : ""
            }
          `;

          mealDetails.classList.remove("hidden");
          container.classList.add("hidden");
          mealDetails.scrollIntoView({ behavior: "smooth" });
        }
      } catch (error) {
        alert("Could not load recipe details. Please try again later.");
      }
    });
  });

  // Back button logic
  backBtn.addEventListener("click", () => {
    mealDetails.classList.add("hidden");
    container.classList.remove("hidden");
  });
});
