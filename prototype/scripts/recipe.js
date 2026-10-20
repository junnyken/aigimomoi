import { BATCH_0_FIXTURES } from '../data/batch0_fixtures.js';

// Get Recipe ID from URL
const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get('id') || 'thit-ba-chi-kho-tieu';
const recipe = BATCH_0_FIXTURES.find(r => r.id === recipeId) || BATCH_0_FIXTURES[0];

// State
const state = {
  recipe: recipe,
  currentServings: recipe.baseServings,
  checkedIngredients: new Set(),
  currentStepIndex: 0,
  timerSecondsRemaining: 0,
  timerTotalSeconds: 0,
  timerInterval: null,
  isTimerRunning: false
};

// Elements
const heroImage = document.getElementById('heroImage');
const heroTitle = document.getElementById('heroTitle');
const heroAliases = document.getElementById('heroAliases');
const heroDesc = document.getElementById('heroDesc');
const roleBadge = document.getElementById('roleBadge');
const testedBadge = document.getElementById('testedBadge');
const prepTimeSpec = document.getElementById('prepTimeSpec');
const cookTimeSpec = document.getElementById('cookTimeSpec');
const servingsSpec = document.getElementById('servingsSpec');
const authorSpec = document.getElementById('authorSpec');

const servingCount = document.getElementById('servingCount');
const servingBaseHint = document.getElementById('servingBaseHint');
const btnDecreaseServing = document.getElementById('btnDecreaseServing');
const btnIncreaseServing = document.getElementById('btnIncreaseServing');
const ingredientsList = document.getElementById('ingredientsList');

const stepsList = document.getElementById('stepsList');
const startCookBtn = document.getElementById('startCookBtn');

// Cooking Mode Elements
const cookingOverlay = document.getElementById('cookingOverlay');
const exitCookingBtn = document.getElementById('exitCookingBtn');
const cookingProgressText = document.getElementById('cookingProgressText');
const cookingStepBadge = document.getElementById('cookingStepBadge');
const cookingStepTitle = document.getElementById('cookingStepTitle');
const cookingStepDesc = document.getElementById('cookingStepDesc');
const timerBox = document.getElementById('timerBox');
const timerDigits = document.getElementById('timerDigits');
const btnToggleTimer = document.getElementById('btnToggleTimer');
const btnResetTimer = document.getElementById('btnResetTimer');
const btnPrevStep = document.getElementById('btnPrevStep');
const btnNextStep = document.getElementById('btnNextStep');
const btnOpenIngredients = document.getElementById('btnOpenIngredients');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const ingredientsDrawer = document.getElementById('ingredientsDrawer');
const drawerIngredientsList = document.getElementById('drawerIngredientsList');

// Initialize
function init() {
  document.title = `${state.recipe.name} — ĂN GÌ MOM`;
  renderHero();
  renderIngredients();
  renderSteps();
  setupEventListeners();
}

function renderHero() {
  heroImage.src = state.recipe.image;
  heroImage.alt = state.recipe.name;
  heroTitle.textContent = state.recipe.name;
  heroAliases.textContent = `Tên gọi khác: ${state.recipe.aliases.join(', ')}`;
  heroDesc.textContent = state.recipe.description;

  roleBadge.textContent = state.recipe.roleLabel;
  if (state.recipe.role === 'MAIN') roleBadge.className = 'badge badge-role-main';
  if (state.recipe.role === 'SOUP') roleBadge.className = 'badge badge-role-soup';
  if (state.recipe.role === 'SIDE') roleBadge.className = 'badge badge-role-side';

  testedBadge.style.display = state.recipe.isTested ? 'inline-flex' : 'none';

  prepTimeSpec.textContent = `${state.recipe.prepTime} phút`;
  cookTimeSpec.textContent = `${state.recipe.cookTime} phút`;
  servingsSpec.textContent = `${state.recipe.baseServings} người`;
  authorSpec.textContent = state.recipe.author;
}

// Serving adjustment engine
function formatAmount(amount) {
  if (Number.isInteger(amount)) return amount.toString();
  return (Math.round(amount * 10) / 10).toString().replace('.', ',');
}

function calculateScaledAmount(ingredient) {
  const ratio = state.currentServings / state.recipe.baseServings;
  if (ingredient.scalePolicy === 'FIXED') {
    return { display: formatAmount(ingredient.amount), note: '' };
  }
  if (ingredient.scalePolicy === 'MANUAL_ADJUST') {
    return { display: formatAmount(ingredient.amount), note: '(tùy khẩu vị)' };
  }
  // LINEAR
  const scaled = ingredient.amount * ratio;
  return { display: formatAmount(scaled), note: '' };
}

function renderIngredients() {
  servingCount.textContent = `${state.currentServings} người`;
  servingBaseHint.textContent = `(Gốc: ${state.recipe.baseServings} người)`;

  ingredientsList.innerHTML = state.recipe.ingredients.map((ing, idx) => {
    const isChecked = state.checkedIngredients.has(ing.name);
    const scaled = calculateScaledAmount(ing);

    return `
      <div class="ingredient-item ${isChecked ? 'checked' : ''}" data-idx="${idx}">
        <div class="ingredient-left">
          <input type="checkbox" class="ingredient-checkbox" ${isChecked ? 'checked' : ''}>
          <div>
            <span class="ingredient-name" style="${isChecked ? 'text-decoration:line-through; opacity:0.6;' : ''}">
              ${ing.name}
            </span>
            ${ing.preparation ? `<span class="ingredient-prep">${ing.preparation}</span>` : ''}
          </div>
        </div>
        <div class="ingredient-amount-badge">
          ${scaled.display} ${ing.unit} ${scaled.note}
        </div>
      </div>
    `;
  }).join('');

  // Also update quick drawer list
  drawerIngredientsList.innerHTML = ingredientsList.innerHTML;
}

function renderSteps() {
  stepsList.innerHTML = state.recipe.steps.map(step => `
    <div class="step-card">
      <div class="step-num-badge">${step.order}</div>
      <div class="step-content-box">
        <div class="step-phase-title">${step.phase}</div>
        <p class="step-text">${step.content}</p>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  // Serving selector
  btnDecreaseServing.addEventListener('click', () => {
    if (state.currentServings > 1) {
      state.currentServings -= 1;
      renderIngredients();
    }
  });

  btnIncreaseServing.addEventListener('click', () => {
    if (state.currentServings < 16) {
      state.currentServings += 1;
      renderIngredients();
    }
  });

  // Checkbox toggling
  ingredientsList.addEventListener('click', (e) => {
    const item = e.target.closest('.ingredient-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    const ingName = state.recipe.ingredients[idx].name;
    if (state.checkedIngredients.has(ingName)) {
      state.checkedIngredients.delete(ingName);
    } else {
      state.checkedIngredients.add(ingName);
    }
    renderIngredients();
  });

  // Launch cooking mode
  startCookBtn.addEventListener('click', openCookingMode);
  exitCookingBtn.addEventListener('click', closeCookingMode);

  // Cooking navigation
  btnPrevStep.addEventListener('click', () => {
    if (state.currentStepIndex > 0) {
      state.currentStepIndex--;
      renderCookingStep();
    }
  });

  btnNextStep.addEventListener('click', () => {
    if (state.currentStepIndex < state.recipe.steps.length - 1) {
      state.currentStepIndex++;
      renderCookingStep();
    } else {
      // Completed last step
      celebrateCompletion();
    }
  });

  // Quick Ingredients Drawer
  btnOpenIngredients.addEventListener('click', () => {
    ingredientsDrawer.classList.add('open');
  });
  closeDrawerBtn.addEventListener('click', () => {
    ingredientsDrawer.classList.remove('open');
  });

  // Timer controls
  btnToggleTimer.addEventListener('click', toggleTimer);
  btnResetTimer.addEventListener('click', resetTimer);
}

// Cooking Mode Logic
function openCookingMode() {
  state.currentStepIndex = 0;
  cookingOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCookingStep();
}

function closeCookingMode() {
  clearInterval(state.timerInterval);
  state.isTimerRunning = false;
  cookingOverlay.classList.remove('active');
  ingredientsDrawer.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCookingStep() {
  clearInterval(state.timerInterval);
  state.isTimerRunning = false;
  btnToggleTimer.textContent = 'Bắt đầu';

  const step = state.recipe.steps[state.currentStepIndex];
  const total = state.recipe.steps.length;

  cookingProgressText.textContent = `BƯỚC ${step.order} / ${total}`;
  cookingStepBadge.textContent = step.phase;
  cookingStepTitle.textContent = `Giai đoạn: ${step.phase}`;
  cookingStepDesc.textContent = step.content;

  // Navigation buttons
  btnPrevStep.disabled = state.currentStepIndex === 0;
  btnPrevStep.style.opacity = state.currentStepIndex === 0 ? '0.4' : '1';

  if (state.currentStepIndex === total - 1) {
    btnNextStep.innerHTML = `<span>✓ Hoàn thành món</span>`;
    btnNextStep.className = 'btn btn-accent';
  } else {
    btnNextStep.innerHTML = `<span>Bước tiếp theo →</span>`;
    btnNextStep.className = 'btn btn-primary';
  }

  // Setup timer if step has duration (estimate 5m default if none)
  const durationMinutes = (step.durationMinutes && step.durationMinutes > 0) ? step.durationMinutes : 5;
  state.timerTotalSeconds = durationMinutes * 60;
  state.timerSecondsRemaining = state.timerTotalSeconds;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(state.timerSecondsRemaining / 60);
  const s = state.timerSecondsRemaining % 60;
  timerDigits.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function toggleTimer() {
  if (state.isTimerRunning) {
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    btnToggleTimer.textContent = 'Tiếp tục';
  } else {
    state.isTimerRunning = true;
    btnToggleTimer.textContent = 'Tạm dừng';
    state.timerInterval = setInterval(() => {
      if (state.timerSecondsRemaining > 0) {
        state.timerSecondsRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(state.timerInterval);
        state.isTimerRunning = false;
        btnToggleTimer.textContent = 'Hết giờ!';
        // Guardrail: Does NOT auto advance step!
        alert(`⏱️ Bước ${state.currentStepIndex + 1} đã hết thời gian nấu! Vui lòng kiểm tra độ chín.`);
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.isTimerRunning = false;
  btnToggleTimer.textContent = 'Bắt đầu';
  state.timerSecondsRemaining = state.timerTotalSeconds;
  updateTimerDisplay();
}

function celebrateCompletion() {
  closeCookingMode();
  alert(`🎉 CHÚC MỪNG!\nBạn đã hoàn thành món "${state.recipe.name}". Mời cả nhà cùng thưởng thức bữa cơm ấm cúng!`);
}

// Run
init();
