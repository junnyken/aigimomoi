import { 
  getCurrentMeal, 
  getDishesForMeal, 
  aggregateIngredients, 
  getCheckedShoppingItems, 
  saveCheckedShoppingItem 
} from './meal_state.js';

document.addEventListener('DOMContentLoaded', () => {
  initShoppingPage();
});

function initShoppingPage() {
  renderShoppingPage();

  const resetBtn = document.getElementById('resetShoppingBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại trạng thái đã mua của danh sách đi chợ?')) {
        localStorage.removeItem('angimom_shopping_checked_v1');
        renderShoppingPage();
      }
    });
  }
}

function renderShoppingPage() {
  const meal = getCurrentMeal();
  const { main, soup, side } = getDishesForMeal(meal);
  const { aggregated, seasonings } = aggregateIngredients(meal);
  const checkedSet = getCheckedShoppingItems();

  // Servings and dishes summary
  const servingsEl = document.getElementById('shoppingServingsText');
  if (servingsEl) {
    servingsEl.textContent = `${meal.servings} người`;
  }

  const chipsEl = document.getElementById('shoppingDishesChips');
  if (chipsEl) {
    chipsEl.innerHTML = [
      { role: 'Mặn', dish: main },
      { role: 'Canh', dish: soup },
      { role: 'Rau', dish: side }
    ].map(item => `
      <a href="recipe.html?id=${encodeURIComponent(item.dish.id)}&servings=${meal.servings}" class="dish-pill" style="text-decoration: none;" title="Xem công thức ${item.dish.name}">
        <strong>${item.role}:</strong> ${item.dish.name} ↗
      </a>
    `).join('');
  }

  // Render Section 1: Fresh Aggregated Ingredients
  const freshContainer = document.getElementById('freshIngredientsList');
  const freshBadge = document.getElementById('freshCountBadge');
  if (freshBadge) freshBadge.textContent = `${aggregated.length} món`;

  if (freshContainer) {
    freshContainer.innerHTML = aggregated.map(item => {
      const itemKey = `fresh__${item.name}__${item.unit}`;
      const isChecked = checkedSet.has(itemKey);

      // Build trace hint string
      const tracesText = item.traces.map(t => {
        const prep = t.preparation ? ` (${t.preparation})` : '';
        return `${t.dishName}: ${formatTraceAmount(t.amount)} ${t.unit}${prep}`;
      }).join(' • ');

      return `
        <div class="shopping-item-card ${isChecked ? 'is-bought' : ''}" data-item-key="${itemKey}">
          <div class="item-left">
            <input type="checkbox" class="shopping-checkbox" ${isChecked ? 'checked' : ''} aria-label="Đã mua ${item.name}">
            <div>
              <div class="item-title">${item.name}</div>
              <span class="trace-hint">Nguồn: ${tracesText}</span>
            </div>
          </div>
          <div class="item-amount-tag">
            ${item.formattedTotal} ${item.unit}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Section 2: Seasonings & Staples
  const seasoningsContainer = document.getElementById('seasoningsList');
  const seasoningsBadge = document.getElementById('seasoningsCountBadge');
  if (seasoningsBadge) seasoningsBadge.textContent = `${seasonings.length} loại`;

  if (seasoningsContainer) {
    seasoningsContainer.innerHTML = seasonings.map(item => {
      const itemKey = `seasoning__${item.name}`;
      const isChecked = checkedSet.has(itemKey);

      const tracesText = item.traces.map(t => t.dishName).filter((v, i, a) => a.indexOf(v) === i).join(', ');

      return `
        <div class="shopping-item-card ${isChecked ? 'is-bought' : ''}" data-item-key="${itemKey}">
          <div class="item-left">
            <input type="checkbox" class="shopping-checkbox" ${isChecked ? 'checked' : ''} aria-label="Đã có ${item.name}">
            <div>
              <div class="item-title">${item.name}</div>
              <span class="trace-hint">Dùng trong: ${tracesText}</span>
            </div>
          </div>
          <div class="item-amount-tag" style="background-color: var(--color-surface-raised); color: var(--color-text-secondary); font-weight: normal;">
            Gia vị nêm nếm
          </div>
        </div>
      `;
    }).join('');
  }

  // Attach click listeners on cards & checkboxes
  document.querySelectorAll('.shopping-item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const checkbox = card.querySelector('.shopping-checkbox');
      const itemKey = card.getAttribute('data-item-key');

      // If user clicked directly on checkbox, keep its state; if on card, toggle checkbox
      let newChecked = !checkbox.checked;
      if (e.target === checkbox) {
        newChecked = checkbox.checked;
      } else {
        checkbox.checked = newChecked;
      }

      saveCheckedShoppingItem(itemKey, newChecked);
      if (newChecked) {
        card.classList.add('is-bought');
      } else {
        card.classList.remove('is-bought');
      }

      updateProgressBar(aggregated.length + seasonings.length);
    });
  });

  // Initial progress update
  updateProgressBar(aggregated.length + seasonings.length);
}

function updateProgressBar(totalItems) {
  const checkedSet = getCheckedShoppingItems();
  const checkedCount = checkedSet.size;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const barFill = document.getElementById('progressBarFill');
  const summaryText = document.getElementById('progressSummaryText');

  if (barFill) {
    barFill.style.width = `${Math.min(100, pct)}%`;
  }
  if (summaryText) {
    summaryText.textContent = `${checkedCount} / ${totalItems} món (${pct}%)`;
  }
}

function formatTraceAmount(amount) {
  if (Number.isInteger(amount)) return amount.toString();
  return (Math.round(amount * 10) / 10).toString().replace('.', ',');
}
