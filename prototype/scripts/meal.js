import { BATCH_0_FIXTURES } from '../data/batch0_fixtures.js';
import { 
  getCurrentMeal, 
  saveCurrentMeal, 
  swapMealDish, 
  setMealServings, 
  getDishesForMeal 
} from './meal_state.js';

let currentSwapRole = null;

document.addEventListener('DOMContentLoaded', () => {
  initMealPage();
});

function initMealPage() {
  renderMeal();

  // Servings listeners
  const decBtn = document.getElementById('mealServingDec');
  const incBtn = document.getElementById('mealServingInc');
  
  if (decBtn) {
    decBtn.addEventListener('click', () => {
      const meal = getCurrentMeal();
      if (meal.servings > 1) {
        setMealServings(meal.servings - 1);
        renderMeal();
      }
    });
  }

  if (incBtn) {
    incBtn.addEventListener('click', () => {
      const meal = getCurrentMeal();
      if (meal.servings < 16) {
        setMealServings(meal.servings + 1);
        renderMeal();
      }
    });
  }

  // Randomize all meal
  const randBtn = document.getElementById('randomizeAllMealBtn');
  if (randBtn) {
    randBtn.addEventListener('click', () => {
      randomizeWholeMeal();
    });
  }

  // Swap dish buttons on cards
  document.querySelectorAll('.swap-dish-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.currentTarget.getAttribute('data-role');
      openSwapModal(role);
    });
  });

  // Modal close handlers
  const closeModalBtn = document.getElementById('closeModalBtn');
  const swapModal = document.getElementById('swapModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeSwapModal);
  }
  if (swapModal) {
    swapModal.addEventListener('click', (e) => {
      if (e.target === swapModal) {
        closeSwapModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSwapModal();
    }
  });
}

function renderMeal() {
  const meal = getCurrentMeal();
  const { main, soup, side } = getDishesForMeal(meal);

  // Update servings display
  const servingsEl = document.getElementById('mealServingsCount');
  if (servingsEl) {
    servingsEl.textContent = meal.servings;
  }

  // Render Slot 1: MAIN
  renderSlot('slotMain', main, meal.servings);

  // Render Slot 2: SOUP
  renderSlot('slotSoup', soup, meal.servings);

  // Render Slot 3: SIDE
  renderSlot('slotSide', side, meal.servings);
}

function renderSlot(prefix, dish, servings) {
  const imgEl = document.getElementById(`${prefix}Img`);
  const titleEl = document.getElementById(`${prefix}Title`);
  const descEl = document.getElementById(`${prefix}Desc`);
  const linkEl = document.getElementById(`${prefix}Link`);

  if (!dish) return;

  if (imgEl) {
    imgEl.src = dish.heroImage;
    imgEl.alt = dish.name;
  }
  if (titleEl) {
    titleEl.textContent = dish.name;
  }
  if (descEl) {
    descEl.textContent = dish.shortDescription;
  }
  if (linkEl) {
    linkEl.href = `recipe.html?id=${encodeURIComponent(dish.id)}&servings=${servings}`;
  }
}

function openSwapModal(role) {
  currentSwapRole = role;
  const modal = document.getElementById('swapModal');
  const modalTitle = document.getElementById('modalTitle');
  const optionsList = document.getElementById('modalOptionsList');

  const roleNames = {
    'MAIN': 'món mặn chính',
    'SOUP': 'món canh thanh mát',
    'SIDE': 'món rau / xào'
  };

  if (modalTitle) {
    modalTitle.textContent = `Chọn ${roleNames[role] || 'món thay thế'}`;
  }

  const meal = getCurrentMeal();
  const currentDishId = role === 'MAIN' ? meal.mainId : (role === 'SOUP' ? meal.soupId : meal.sideId);

  // Filter available dishes for this role
  const candidates = BATCH_0_FIXTURES.filter(d => d.role === role);

  if (optionsList) {
    optionsList.innerHTML = candidates.map(dish => {
      const isSelected = dish.id === currentDishId;
      return `
        <div class="swap-option-card ${isSelected ? 'is-selected' : ''}" style="${isSelected ? 'background-color: var(--color-surface-raised); border-color: var(--color-brand-primary);' : ''}">
          <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1;">
            <img src="${dish.heroImage}" alt="${dish.name}" style="width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: cover;">
            <div>
              <div style="font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin-bottom: 2px;">
                ${dish.name} ${isSelected ? '<span class="badge badge-tested" style="font-size: 11px; padding: 2px 6px;">Đang chọn</span>' : ''}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                ⏱ ${dish.cookTimeMinutes} phút • ${dish.caloriesPerServing} kcal/phần
              </div>
            </div>
          </div>
          <div>
            ${isSelected 
              ? `<span style="font-size: var(--font-size-xs); color: var(--color-brand-primary); font-weight: var(--font-weight-medium);">Đang trong mâm</span>` 
              : `<button class="btn btn-outline btn-sm select-dish-btn" data-dish-id="${dish.id}">Chọn món này</button>`}
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to select buttons
    optionsList.querySelectorAll('.select-dish-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dishId = e.currentTarget.getAttribute('data-dish-id');
        swapMealDish(currentSwapRole, dishId);
        closeSwapModal();
        renderMeal();
      });
    });
  }

  if (modal) {
    modal.classList.add('active');
  }
}

function closeSwapModal() {
  const modal = document.getElementById('swapModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentSwapRole = null;
}

function randomizeWholeMeal() {
  const mains = BATCH_0_FIXTURES.filter(d => d.role === 'MAIN');
  const soups = BATCH_0_FIXTURES.filter(d => d.role === 'SOUP');
  const sides = BATCH_0_FIXTURES.filter(d => d.role === 'SIDE');

  const current = getCurrentMeal();

  // Pick random different if possible
  const pickRandomOther = (list, currentId) => {
    const others = list.filter(d => d.id !== currentId);
    if (others.length === 0) return list[0]?.id || currentId;
    return others[Math.floor(Math.random() * others.length)].id;
  };

  const newMainId = pickRandomOther(mains, current.mainId);
  const newSoupId = pickRandomOther(soups, current.soupId);
  const newSideId = pickRandomOther(sides, current.sideId);

  const updated = {
    ...current,
    mainId: newMainId,
    soupId: newSoupId,
    sideId: newSideId
  };

  saveCurrentMeal(updated);
  renderMeal();
}
