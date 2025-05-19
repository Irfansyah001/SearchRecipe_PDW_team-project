// Jalankan kode setelah seluruh konten HTML dimuat
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favorites-container"); // Tempat menampilkan resep favorit
  const mealDetails = document.getElementById("meal-details"); // Kontainer detail resep
  const mealDetailsContent = document.querySelector(".meal-details-content"); // Isi dari detail resep
  const backBtn = document.getElementById("back-btn"); // Tombol untuk kembali ke daftar favorit

  let favorites = JSON.parse(localStorage.getItem("favorites")) || []; 
  // Ambil data favorit dari localStorage dan ubah menjadi array (jika kosong, jadikan array kosong)

  if (favorites.length === 0) {
    // Jika belum ada resep disimpan
    container.innerHTML = `<p style="padding: 1rem;">You have no saved recipes yet.</p>`;
    return; // Keluar dari fungsi
  }

  container.innerHTML = ""; // Bersihkan isi kontainer sebelum ditambahkan ulang

  favorites.forEach((meal) => {
    // Tampilkan setiap resep favorit sebagai elemen HTML
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

  // Tambahkan event listener ke setiap tombol unsave
  document.querySelectorAll(".unsave-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Mencegah klik ke elemen resep agar tidak membuka detail

      const mealDiv = e.target.closest(".meal"); // Temukan elemen resep yang diklik
      const mealId = mealDiv.dataset.mealId; // Ambil ID resep

      // Hapus resep dari array favorites
      favorites = favorites.filter(meal => meal.idMeal !== mealId);

      // Simpan ulang ke localStorage setelah dihapus
      localStorage.setItem("favorites", JSON.stringify(favorites));

      // Hapus elemen dari tampilan
      mealDiv.remove();

      // Jika semua favorit dihapus, tampilkan pesan
      if (favorites.length === 0) {
        container.innerHTML = `<p style="padding: 1rem;">You have no saved recipes yet.</p>`;
      }
    });
  });

  // Tambahkan event listener untuk klik pada resep (untuk membuka detail)
  document.querySelectorAll(".meal").forEach(mealDiv => {
    mealDiv.addEventListener("click", async (e) => {
      // Abaikan klik jika yang diklik adalah tombol Unsave
      if (e.target.closest(".unsave-btn")) return;

      const mealId = mealDiv.dataset.mealId; // Ambil ID resep

      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();

        if (data.meals && data.meals[0]) {
          const meal = data.meals[0]; // Ambil objek resep dari API
          const ingredients = [];

          // Ambil semua bahan dan takarannya
          for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
              ingredients.push({
                ingredient: meal[`strIngredient${i}`],
                measure: meal[`strMeasure${i}`],
              });
            }
          }

          // Tampilkan konten detail resep
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

          // Tampilkan kontainer detail resep, dan sembunyikan daftar resep
          mealDetails.classList.remove("hidden");
          container.classList.add("hidden");

          // Scroll ke tampilan detail dengan smooth
          mealDetails.scrollIntoView({ behavior: "smooth" });
        }
      } catch (error) {
        alert("Could not load recipe details. Please try again later."); // Jika fetch gagal
      }
    });
  });

  // Fungsi tombol kembali untuk menutup detail dan menampilkan ulang daftar
  backBtn.addEventListener("click", () => {
    mealDetails.classList.add("hidden"); // Sembunyikan detail
    container.classList.remove("hidden"); // Tampilkan ulang daftar favorit
  });
});
