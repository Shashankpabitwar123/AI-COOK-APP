import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  console.error("Missing SPOONACULAR_API_KEY in .env");
  process.exit(1);
}

app.use(express.static("public"));

// Small helper: build Spoonacular URL safely
function spoonacularUrl(path, params = {}) {
  const url = new URL(`https://api.spoonacular.com${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  url.searchParams.set("apiKey", API_KEY);
  return url.toString();
}

// Search recipes endpoint
// /api/search?ingredients=chicken,tomato&mealType=dinner&cuisine=indian&diet=vegetarian&maxReadyTime=30
app.get("/api/search", async (req, res) => {
  try {
    const ingredientsRaw = (req.query.ingredients || "").toString();
    const mealType = (req.query.mealType || "").toString();
    const cuisine = (req.query.cuisine || "").toString();
    const diet = (req.query.diet || "").toString();
    const maxReadyTime = (req.query.maxReadyTime || "").toString();

    const ingredients = ingredientsRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 12); // cap

    if (ingredients.length === 0) {
      return res.status(400).json({ error: "Please provide at least one ingredient." });
    }

    const url = spoonacularUrl("/recipes/complexSearch", {
      includeIngredients: ingredients.join(","),
      type: mealType || undefined,
      cuisine: cuisine || undefined,
      diet: diet || undefined,
      maxReadyTime: maxReadyTime || undefined,
      addRecipeInformation: true,
      fillIngredients: true,
      instructionsRequired: true,
      sort: "max-used-ingredients",
      number: 12
    });

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.message || "Spoonacular error" });
    }

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
});

// Recipe details endpoint
app.get("/api/recipe/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = spoonacularUrl(`/recipes/${encodeURIComponent(id)}/information`, {
      includeNutrition: false
    });

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.message || "Spoonacular error" });
    }

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`AI Cook running on http://localhost:${PORT}`);
});
