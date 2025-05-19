// Ambil semua elemen DOM yang akan digunakan
const searchInput = document.getElementById("search-input"); // Input teks untuk pencarian resep
const searchBtn = document.getElementById("search-btn"); // Tombol untuk memulai pencarian
const mealsContainer = document.getElementById("meals"); // Kontainer hasil pencarian resep
const resultHeading = document.getElementById("result-heading"); // Judul hasil pencarian
const errorContainer = document.getElementById("error-container"); // Menampilkan pesan error
const mealDetails = document.getElementById("meal-details"); // Kontainer detail resep (awal disembunyikan)
const mealDetailsContent = document.querySelector(".meal-details-content"); // Tempat konten detail resep
const backBtn = document.getElementById("back-btn"); // Tombol kembali dari detail resep

// URL dasar dari API TheMealDB
const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`; // Endpoint untuk pencarian berdasarkan nama
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`; // Endpoint untuk mengambil detail berdasarkan ID

// Event listener ketika tombol cari diklik
searchBtn.addEventListener("click", searchMeals);

// Event listener ketika pengguna mengklik salah satu resep dari hasil pencarian
mealsContainer.addEventListener("click", handleMealClick);

// Event listener untuk tombol kembali dari detail resep
backBtn.addEventListener("click", () => mealDetails.classList.add("hidden"));

// Jalankan pencarian jika pengguna menekan tombol Enter di input
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMeals();
});

// Fungsi utama untuk mencari resep berdasarkan input pengguna
async function searchMeals() {
  const searchTerm = searchInput.value.trim(); // Ambil dan bersihkan input pencarian

  // Validasi input kosong
  if (!searchTerm) {
    errorContainer.textContent = "Please enter a search term"; // Tampilkan error
    errorContainer.classList.remove("hidden"); // Tampilkan kontainer error
    return;
  }

  try {
    // Tampilkan status pencarian
    resultHeading.textContent = `Searching for "${searchTerm}"...`;
    mealsContainer.innerHTML = ""; // Bersihkan hasil sebelumnya
    errorContainer.classList.add("hidden"); // Sembunyikan error

    // Fetch data dari API
    const response = await fetch(`${SEARCH_URL}${searchTerm}`);
    const data = await response.json();

    // Jika tidak ada hasil ditemukan
    if (data.meals === null) {
      resultHeading.textContent = ``;
      mealsContainer.innerHTML = "";
      errorContainer.textContent = `No recipes found for "${searchTerm}". Try another search term!`;
      errorContainer.classList.remove("hidden");
    } else {
      // Tampilkan hasil pencarian
      resultHeading.textContent = `Search results for "${searchTerm}":`;
      displayMeals(data.meals);
      searchInput.value = ""; // Reset input pencarian
    }
  } catch (error) {
    // Tampilkan error jika fetch gagal
    errorContainer.textContent = "Something went wrong. Please try again later.";
    errorContainer.classList.remove("hidden");
  }
}

// Fungsi untuk menampilkan daftar resep hasil pencarian
function displayMeals(meals) {
  mealsContainer.innerHTML = ""; // Bersihkan kontainer hasil

  meals.forEach((meal) => {
    // Tambahkan HTML untuk setiap resep
    mealsContainer.innerHTML += `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3 class="meal-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
          <button class="bookmark-btn" data-meal='${JSON.stringify(meal)}'>
            <i class="fas fa-star"></i> Save
          </button>
        </div>
      </div>
    `;
  });

  // Tambahkan event ke setiap tombol bookmark
  document.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Cegah membuka detail saat tombol Save diklik
      const meal = JSON.parse(this.dataset.meal); // Ambil data meal dari tombol
      saveToFavorites(meal); // Simpan ke favorit
    });
  });
}

// Fungsi untuk menangani klik pada salah satu resep
async function handleMealClick(e) {
  const mealEl = e.target.closest(".meal"); // Cari elemen .meal yang diklik
  if (!mealEl) return;

  const mealId = mealEl.getAttribute("data-meal-id"); // Ambil ID resep

  try {
    const response = await fetch(`${LOOKUP_URL}${mealId}`); // Fetch detail resep dari API
    const data = await response.json();

    if (data.meals && data.meals[0]) {
      const meal = data.meals[0]; // Ambil objek meal

      // Ambil daftar bahan dan ukurannya
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
          ingredients.push({
            ingredient: meal[`strIngredient${i}`],
            measure: meal[`strMeasure${i}`],
          });
        }
      }

      // Tampilkan detail resep
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
            ? `<a href="${meal.strYoutube}" target="_blank" class="youtube-link">
                 <i class="fab fa-youtube"></i> Watch Video
               </a>`
            : ""
        }
      `;

      // Cek apakah meal sudah ada di favorit
      let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      const isFavorite = favorites.some(fav => fav.idMeal === meal.idMeal);

      // Tambahkan tombol simpan / hapus favorit
      mealDetailsContent.innerHTML += `
        <button id="favorite-btn" class="favorite-btn">
          <i class="fas ${isFavorite ? "fa-star" : "fa-star-half-alt"}"></i> ${isFavorite ? "Unsave" : "Save"}
        </button>
      `;

      // Event tombol favorit (simpan atau hapus)
      const favoriteBtn = document.getElementById("favorite-btn");
      favoriteBtn.addEventListener("click", () => {
        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        const alreadyFavorite = favorites.some(fav => fav.idMeal === meal.idMeal);

        if (alreadyFavorite) {
          favorites = favorites.filter(fav => fav.idMeal !== meal.idMeal); // Hapus dari favorit
          favoriteBtn.innerHTML = `<i class="fas fa-star-half-alt"></i> Save`;
        } else {
          favorites.push({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            strCategory: meal.strCategory,
          });
          favoriteBtn.innerHTML = `<i class="fas fa-star"></i> Unsave`;
        }

        localStorage.setItem("favorites", JSON.stringify(favorites)); // Simpan ulang ke localStorage
      });

      // Tampilkan konten detail dan scroll ke bawah
      mealDetails.classList.remove("hidden");
      mealDetails.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    errorContainer.textContent = "Could not load recipe details. Please try again later.";
    errorContainer.classList.remove("hidden");
  }
}

// Fungsi untuk menyimpan resep ke localStorage sebagai favorit
function saveToFavorites(meal) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || []; // Ambil data dari localStorage
  const exists = favorites.some((fav) => fav.idMeal === meal.idMeal); // Cek apakah sudah ada

  if (!exists) {
    favorites.push(meal); // Tambahkan ke array
    localStorage.setItem("favorites", JSON.stringify(favorites)); // Simpan kembali
    alert(`"${meal.strMeal}" has been saved to favorites!`);
  } else {
    alert(`"${meal.strMeal}" is already in your favorites.`);
  }
}
