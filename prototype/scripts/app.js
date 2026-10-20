import { BATCH_0_FIXTURES } from '../data/batch0_fixtures.js';

// Application State
const state = {
  allRecipes: BATCH_0_FIXTURES,
  searchQuery: '',
  selectedRole: 'ALL',
  selectedMeal: null
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const filterChips = document.querySelectorAll('.chip[data-role]');
const recipeGrid = document.getElementById('recipeGrid');
const emptyState = document.getElementById('emptyState');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const filterStats = document.getElementById('filterStats');
const randomMealBtn = document.getElementById('randomMealBtn');
const mealSuggestionCard = document.getElementById('mealSuggestionCard');
const closeMealBtn = document.getElementById('closeMealBtn');
const reRandomMealBtn = document.getElementById('reRandomMealBtn');
const mealMain = document.getElementById('mealMain');
const mealSoup = document.getElementById('mealSoup');
const mealSide = document.getElementById('mealSide');

// Initialize
function init() {
  renderRecipes();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    searchClear.classList.toggle('visible', state.searchQuery.length > 0);
    renderRecipes();
  });

  // Clear search
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    renderRecipes();
  });

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedRole = chip.dataset.role;
      renderRecipes();
    });
  });

  // Reset filter button in empty state
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.remove('visible');
    state.selectedRole = 'ALL';
    filterChips.forEach(c => {
      c.classList.toggle('active', c.dataset.role === 'ALL');
    });
    renderRecipes();
  });

  // Random Meal Generator ("Hôm nay ăn gì?" - O7)
  randomMealBtn.addEventListener('click', generateRandomMeal);
  reRandomMealBtn.addEventListener('click', generateRandomMeal);
  closeMealBtn.addEventListener('click', () => {
    mealSuggestionCard.classList.remove('active');
  });
}

// Filter logic
function getFilteredRecipes() {
  return state.allRecipes.filter(recipe => {
    // Role filter
    const matchesRole = state.selectedRole === 'ALL' || recipe.role === state.selectedRole;
    
    // Search query
    let matchesSearch = true;
    if (state.searchQuery) {
      const q = state.searchQuery;
      const inName = recipe.name.toLowerCase().includes(q);
      const inAliases = recipe.aliases.some(a => a.toLowerCase().includes(q));
      const inIngredients = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(q));
      matchesSearch = inName || inAliases || inIngredients;
    }

    return matchesRole && matchesSearch;
  });
}

// Render Recipes to Grid
function renderRecipes() {
  const filtered = getFilteredRecipes();

  // Update counter
  filterStats.textContent = `Hiển thị ${filtered.length} món ăn`;

  // Handle Empty State
  if (filtered.length === 0) {
    recipeGrid.innerHTML = '';
    emptyState.classList.add('visible');
    return;
  }

  emptyState.classList.remove('visible');

  // Render cards
  recipeGrid.innerHTML = filtered.map(recipe => {
    let roleBadgeClass = 'badge-role-main';
    if (recipe.role === 'SOUP') roleBadgeClass = 'badge-role-soup';
    if (recipe.role === 'SIDE') roleBadgeClass = 'badge-role-side';

    return `
      <a href="recipe.html?id=${recipe.id}" class="recipe-card-link" style="text-decoration:none; color:inherit; display:flex;">
      <article class="recipe-card" data-id="${recipe.id}" style="width:100%;">
        <div class="card-image-wrapper">
          <img src="${recipe.image}" alt="${recipe.name}" class="card-image" loading="lazy">
          <div class="card-badges">
            <span class="badge ${roleBadgeClass}">${recipe.roleLabel}</span>
            ${recipe.isTested ? '<span class="badge badge-tested">✓ Đã nấu thử</span>' : ''}
          </div>
          <span class="badge-demo">[DEMO_FIXTURE]</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${recipe.name}</h3>
          <p class="card-desc">${recipe.description}</p>
          <div class="card-meta">
            <span class="meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${recipe.cookTime} phút
            </span>
            <span class="meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              ${recipe.baseServings} người
            </span>
            <span class="meta-item">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#2E7D32; margin-right:2px;"></span>
              ${recipe.difficulty}
            </span>
          </div>
        </div>
      </article>
      </a>
    `;
  }).join('');
}

// Generate Random 3-Dish Balanced Meal (O7: 1 Main + 1 Soup + 1 Side)
function generateRandomMeal() {
  const mains = state.allRecipes.filter(r => r.role === 'MAIN');
  const soups = state.allRecipes.filter(r => r.role === 'SOUP');
  const sides = state.allRecipes.filter(r => r.role === 'SIDE');

  const randomMain = mains[Math.floor(Math.random() * mains.length)];
  const randomSoup = soups[Math.floor(Math.random() * soups.length)];
  const randomSide = sides[Math.floor(Math.random() * sides.length)];

  state.selectedMeal = { main: randomMain, soup: randomSoup, side: randomSide };

  // Render suggestion items
  renderMealDish(mealMain, randomMain, 'Món mặn');
  renderMealDish(mealSoup, randomSoup, 'Món canh');
  renderMealDish(mealSide, randomSide, 'Rau / Món phụ');

  mealSuggestionCard.classList.add('active');
  mealSuggestionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderMealDish(container, dish, label) {
  container.innerHTML = `
    <a href="recipe.html?id=${dish.id}" style="display:flex; align-items:center; gap:var(--space-3); text-decoration:none; color:inherit; width:100%;">
      <img src="${dish.image}" alt="${dish.name}" class="meal-dish-thumb">
      <div class="meal-dish-info">
        <span>${label}</span>
        <h4>${dish.name}</h4>
      </div>
    </a>
  `;
}

// Run on load
init();
