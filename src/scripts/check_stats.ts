import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const recipes = await db.execute(sql`SELECT count(*)::int as count FROM recipes`);
  const pub = await db.execute(sql`SELECT count(*)::int as count FROM recipes WHERE status = 'PUBLISHED'`);
  const dishes = await db.execute(sql`SELECT count(*)::int as count FROM dishes`);
  const ingredients = await db.execute(sql`SELECT count(*)::int as count FROM ingredients`);
  const taxonomies = await db.execute(sql`SELECT count(*)::int as count FROM taxonomies`);
  const users = await db.execute(sql`SELECT count(*)::int as count FROM users`);

  console.log('DB STATS:', {
    recipes: recipes[0]?.count,
    publishedRecipes: pub[0]?.count,
    dishes: dishes[0]?.count,
    ingredients: ingredients[0]?.count,
    taxonomies: taxonomies[0]?.count,
    users: users[0]?.count,
  });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
