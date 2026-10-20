import { BATCH_0_FIXTURES } from '../data/batch0_fixtures.js';

const MEAL_STORAGE_KEY = 'angimom_current_meal_v1';
const SHOPPING_CHECKED_KEY = 'angimom_shopping_checked_v1';

// Default initial 3-course meal (4 servings)
const DEFAULT_MEAL = {
  servings: 4,
  mainId: 'thit-ba-chi-kho-tieu',
  soupId: 'canh-rau-ngot-thit-bam',
  sideId: 'rau-muong-xao-toi'
};

export function getCurrentMeal() {
  try {
    const raw = localStorage.getItem(MEAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MEAL };
    return { ...DEFAULT_MEAL, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_MEAL };
  }
}

export function saveCurrentMeal(meal) {
  localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(meal));
}

export function swapMealDish(role, newDishId) {
  const meal = getCurrentMeal();
  if (role === 'MAIN') meal.mainId = newDishId;
  if (role === 'SOUP') meal.soupId = newDishId;
  if (role === 'SIDE') meal.sideId = newDishId;
  saveCurrentMeal(meal);
  return meal;
}

export function setMealServings(servings) {
  const meal = getCurrentMeal();
  meal.servings = Math.max(1, Math.min(16, servings));
  saveCurrentMeal(meal);
  return meal;
}

export function getDishesForMeal(meal = getCurrentMeal()) {
  const main = BATCH_0_FIXTURES.find(d => d.id === meal.mainId) || BATCH_0_FIXTURES[0];
  const soup = BATCH_0_FIXTURES.find(d => d.id === meal.soupId) || BATCH_0_FIXTURES[3];
  const side = BATCH_0_FIXTURES.find(d => d.id === meal.sideId) || BATCH_0_FIXTURES[5];
  return { main, soup, side };
}

// Invariants §5.4: Ingredient Aggregation Engine
export function aggregateIngredients(meal = getCurrentMeal()) {
  const { main, soup, side } = getDishesForMeal(meal);
  const dishes = [main, soup, side];
  
  // Map key: `${name}__${unit}__${scalePolicy}`
  const aggregatedMap = new Map();
  const seasoningsMap = new Map();

  dishes.forEach(dish => {
    const ratio = meal.servings / dish.baseServings;

    dish.ingredients.forEach(ing => {
      // Manual adjust seasonings are grouped separately
      if (ing.scalePolicy === 'MANUAL_ADJUST') {
        const key = ing.name;
        if (!seasoningsMap.has(key)) {
          seasoningsMap.set(key, {
            name: ing.name,
            unit: ing.unit,
            scalePolicy: 'MANUAL_ADJUST',
            traces: []
          });
        }
        seasoningsMap.get(key).traces.push({
          dishName: dish.name,
          amount: ing.amount,
          unit: ing.unit,
          preparation: ing.preparation
        });
        return;
      }

      // Linear or Fixed items
      const key = `${ing.name}__${ing.unit}`;
      const scaledAmount = ing.scalePolicy === 'LINEAR' ? (ing.amount * ratio) : ing.amount;

      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          name: ing.name,
          unit: ing.unit,
          scalePolicy: ing.scalePolicy,
          totalAmount: 0,
          traces: []
        });
      }

      const entry = aggregatedMap.get(key);
      entry.totalAmount += scaledAmount;
      entry.traces.push({
        dishName: dish.name,
        amount: scaledAmount,
        baseAmount: ing.amount,
        unit: ing.unit,
        preparation: ing.preparation
      });
    });
  });

  // Convert to clean list
  const aggregatedList = Array.from(aggregatedMap.values()).map(item => ({
    ...item,
    formattedTotal: formatAmount(item.totalAmount)
  }));

  const seasoningsList = Array.from(seasoningsMap.values());

  return {
    aggregated: aggregatedList,
    seasonings: seasoningsList
  };
}

function formatAmount(amount) {
  if (Number.isInteger(amount)) return amount.toString();
  return (Math.round(amount * 10) / 10).toString().replace('.', ',');
}

// Shopping Checklist Storage (Checked vs To Buy)
export function getCheckedShoppingItems() {
  try {
    const raw = localStorage.getItem(SHOPPING_CHECKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

export function saveCheckedShoppingItem(itemKey, isChecked) {
  const set = getCheckedShoppingItems();
  if (isChecked) {
    set.add(itemKey);
  } else {
    set.delete(itemKey);
  }
  localStorage.setItem(SHOPPING_CHECKED_KEY, JSON.stringify(Array.from(set)));
  return set;
}
