// ---- Landing buttons ----
function goToRecipes() {
  // open the recipe app page
  window.location.href = "./recipes.html";
}

function scrollToExperience() {
  const exp = document.getElementById("experience");
  if (exp) exp.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.addEventListener("DOMContentLoaded", () => {
  const go1 = document.getElementById("goAppBtn");
  const go2 = document.getElementById("goAppBtnTop");
  const go3 = document.getElementById("goAppBtnCta");
  const ex1 = document.getElementById("exploreBtn");
  const ex2 = document.getElementById("exploreBtnTop");
  const gal = document.getElementById("viewGalleryBtn");

  if (go1) go1.addEventListener("click", goToRecipes);
  if (go2) go2.addEventListener("click", goToRecipes);
  if (go3) go3.addEventListener("click", goToRecipes);

  if (ex1) ex1.addEventListener("click", scrollToExperience);
  if (ex2) ex2.addEventListener("click", scrollToExperience);

  if (gal) gal.addEventListener("click", () => {
    const how = document.getElementById("how");
    if (how) how.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  initRecipesPage();
});

function initRecipesPage() {
  const el = (id) => document.getElementById(id);

  const ingredientsInput = el("ingredientsInput");
  const addIngredientBtn = el("addIngredientBtn");
  const chipsEl = el("chips");
  const searchBtn = el("searchBtn");
  const clearBtn = el("clearBtn");
  const statusEl = el("status");
  const cardsEl = el("cards");
  const skeletonsEl = el("skeletons");
  const emptyStateEl = el("emptyState");
  const resultsMetaEl = el("resultsMeta");

  const mealTypeEl = el("mealType");
  const cuisineEl = el("cuisine");
  const dietEl = el("diet");
  const maxReadyTimeEl = el("maxReadyTime");
  const surpriseBtn = el("surpriseBtn");
  const onlySelectedEl = el("onlySelected");

  const modalOverlay = el("modalOverlay");
  const modalClose = el("modalClose");
  const modalContent = el("modalContent");

  let ingredients = [];
  let vibe = "chef"; // cozy | chef | fast
  const PUBLIC_SPOONACULAR_API_KEY = "4d0fa0dd5c0545479a92c4462185e561";

  const demoRecipes = [
    {
      id: "demo-rice-egg",
      title: "Golden Egg Fried Rice",
      image: "./assets/hero.jpg",
      readyInMinutes: 25,
      servings: 2,
      cuisines: ["Chinese"],
      dishTypes: ["main course"],
      sourceUrl: "https://www.spoonacular.com/",
      summary: "A quick demo recipe for GitHub Pages using rice, egg, soy sauce, and spring onion.",
      usedIngredientCount: 2,
      missedIngredientCount: 3,
      extendedIngredients: [
        { name: "rice", original: "2 cups cooked rice" },
        { name: "egg", original: "2 eggs, beaten" },
        { name: "soy sauce", original: "1 tablespoon soy sauce" },
        { name: "spring onion", original: "2 spring onions, sliced" },
        { name: "oil", original: "1 tablespoon neutral oil" }
      ],
      analyzedInstructions: [{ steps: [
        { step: "Heat oil in a skillet over medium-high heat." },
        { step: "Add beaten eggs and scramble until just set." },
        { step: "Stir in cooked rice and soy sauce." },
        { step: "Fold in spring onion, cook for one more minute, and serve hot." }
      ] }]
    },
    {
      id: "demo-chicken-tomato",
      title: "Tomato Garlic Chicken Skillet",
      image: "./assets/hero.jpg",
      readyInMinutes: 35,
      servings: 4,
      cuisines: ["Mediterranean"],
      dishTypes: ["dinner"],
      sourceUrl: "https://www.spoonacular.com/",
      summary: "A simple demo skillet dinner with chicken, tomato, onion, and garlic.",
      usedIngredientCount: 2,
      missedIngredientCount: 3,
      extendedIngredients: [
        { name: "chicken", original: "1 pound chicken pieces" },
        { name: "tomato", original: "2 tomatoes, chopped" },
        { name: "onion", original: "1 onion, sliced" },
        { name: "garlic", original: "3 garlic cloves, minced" },
        { name: "olive oil", original: "2 tablespoons olive oil" }
      ],
      analyzedInstructions: [{ steps: [
        { step: "Season chicken with salt and pepper." },
        { step: "Sear chicken in olive oil until browned." },
        { step: "Add onion, garlic, and tomato, then simmer until the chicken is cooked through." },
        { step: "Serve with rice, bread, or salad." }
      ] }]
    },
    {
      id: "demo-pasta-tomato",
      title: "Garlic Tomato Pasta",
      image: "./assets/hero.jpg",
      readyInMinutes: 30,
      servings: 3,
      cuisines: ["Italian"],
      dishTypes: ["main course"],
      sourceUrl: "https://www.spoonacular.com/",
      summary: "A GitHub Pages demo pasta recipe with tomato, garlic, olive oil, and herbs.",
      usedIngredientCount: 2,
      missedIngredientCount: 3,
      extendedIngredients: [
        { name: "pasta", original: "8 ounces pasta" },
        { name: "tomato", original: "2 cups chopped tomatoes" },
        { name: "garlic", original: "3 garlic cloves, minced" },
        { name: "olive oil", original: "2 tablespoons olive oil" },
        { name: "basil", original: "Fresh basil to finish" }
      ],
      analyzedInstructions: [{ steps: [
        { step: "Boil pasta until al dente." },
        { step: "Cook garlic in olive oil until fragrant." },
        { step: "Add tomatoes and simmer into a light sauce." },
        { step: "Toss pasta with sauce and finish with basil." }
      ] }]
    }
  ];

  function useStaticRecipeDemo(){
    return window.location.hostname.endsWith("github.io");
  }

  function spoonacularUrl(path, params = {}){
    const url = new URL(`https://api.spoonacular.com${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    url.searchParams.set("apiKey", PUBLIC_SPOONACULAR_API_KEY);
    return url.toString();
  }

  async function fetchSearchFromSpoonacular(){
    const url = spoonacularUrl("/recipes/complexSearch", {
      includeIngredients: ingredients.join(","),
      type: mealTypeEl.value || undefined,
      cuisine: cuisineEl.value || undefined,
      diet: dietEl.value || undefined,
      maxReadyTime: (maxReadyTimeEl.value || "").trim() || undefined,
      addRecipeInformation: true,
      fillIngredients: true,
      instructionsRequired: true,
      sort: "max-used-ingredients",
      number: 12
    });
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || data?.error || "Spoonacular search failed");
    return data;
  }

  async function fetchRecipeFromSpoonacular(id){
    const url = spoonacularUrl(`/recipes/${encodeURIComponent(id)}/information`, {
      includeNutrition: false
    });
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || data?.error || "Failed to load recipe");
    return data;
  }

  function searchDemoRecipes(){
    const selected = ingredients.map(s => s.toLowerCase());
    const cuisine = (cuisineEl.value || "").toLowerCase();
    const mealType = (mealTypeEl.value || "").toLowerCase();
    const maxTime = parseInt((maxReadyTimeEl.value || "").trim(), 10);

    let results = demoRecipes.filter(recipe => {
      const recipeWords = [
        recipe.title,
        ...(recipe.cuisines || []),
        ...(recipe.dishTypes || []),
        ...(recipe.extendedIngredients || []).map(ing => ing.name || "")
      ].join(" ").toLowerCase();

      const ingredientMatch = selected.length === 0 || selected.some(ing => recipeWords.includes(ing));
      const cuisineMatch = !cuisine || (recipe.cuisines || []).some(c => c.toLowerCase() === cuisine);
      const mealMatch = !mealType || (recipe.dishTypes || []).some(t => t.toLowerCase().includes(mealType));
      const timeMatch = !Number.isFinite(maxTime) || !recipe.readyInMinutes || recipe.readyInMinutes <= maxTime;

      return ingredientMatch && cuisineMatch && mealMatch && timeMatch;
    });

    if (results.length === 0) results = demoRecipes;

    return {
      totalResults: results.length,
      results: results.map(recipe => ({
        ...recipe,
        usedIngredientCount: selected.filter(ing => {
          const names = (recipe.extendedIngredients || []).map(item => (item.name || "").toLowerCase());
          return names.some(name => name.includes(ing) || ing.includes(name));
        }).length,
        missedIngredientCount: Math.max(0, (recipe.extendedIngredients || []).length - selected.length)
      }))
    };
  }

  function findDemoRecipe(id){
    return demoRecipes.find(recipe => String(recipe.id) === String(id)) || demoRecipes[0];
  }

  // --- Vibe buttons ---
  document.querySelectorAll(".recipes-vibeCard").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".recipes-vibeCard").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      vibe = btn.dataset.vibe;
      applyVibeDefaults();
    });
  });

  function applyVibeDefaults(){
    // Tiny “AI-ish” behavior without using AI:
    // adjust max time + meal type suggestion
    if (vibe === "fast") {
      if (!maxReadyTimeEl.value) maxReadyTimeEl.value = "25";
    } else if (vibe === "cozy") {
      if (!maxReadyTimeEl.value) maxReadyTimeEl.value = "45";
    } else {
      // chef mode
      // leave as-is
    }
  }

  // --- Ingredient chips ---
  function renderChips(){
    chipsEl.innerHTML = "";
    ingredients.forEach((ing, idx) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.innerHTML = `
        <span>🧺 ${escapeHtml(ing)}</span>
        <button class="x" type="button" aria-label="Remove ${escapeHtml(ing)}">✕</button>
      `;
      chip.querySelector(".x").addEventListener("click", () => {
        ingredients.splice(idx, 1);
        renderChips();
      });
      chipsEl.appendChild(chip);
    });
  }

  function addIngredientsFromText(text){
    const parts = text
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    let added = 0;
    for (const p of parts) {
      if (ingredients.length >= 12) break;
      if (!ingredients.includes(p.toLowerCase())) {
        ingredients.push(p.toLowerCase());
        added++;
      }
    }
    if (added > 0) renderChips();
  }

  addIngredientBtn.addEventListener("click", () => {
    addIngredientsFromText(ingredientsInput.value);
    ingredientsInput.value = "";
    ingredientsInput.focus();
  });

  ingredientsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredientsFromText(ingredientsInput.value);
      ingredientsInput.value = "";
    }
  });

  // --- Surprise me ---
  const surpriseSets = [
    ["eggs", "bread", "cheese", "butter"],
    ["chicken", "onion", "garlic", "tomato"],
    ["potato", "olive oil", "paprika", "salt"],
    ["rice", "soy sauce", "egg", "spring onion"],
    ["pasta", "tomato", "garlic", "olive oil"],
    ["paneer", "onion", "tomato", "spices"],
    ["yogurt", "cucumber", "mint", "salt"]
  ];

  surpriseBtn.addEventListener("click", () => {
    const pick = surpriseSets[Math.floor(Math.random() * surpriseSets.length)];
    ingredients = Array.from(new Set(pick.map(s => s.toLowerCase()))).slice(0, 12);
    renderChips();

    // suggest a cuisine lightly
    const cuisineSuggestions = {
      paneer: "indian",
      soy: "chinese",
      pasta: "italian",
      yogurt: "mediterranean"
    };
    const joined = ingredients.join(" ");
    if (joined.includes("paneer")) cuisineEl.value = "indian";
    else if (joined.includes("soy")) cuisineEl.value = "chinese";
    else if (joined.includes("pasta")) cuisineEl.value = "italian";
    else if (joined.includes("yogurt")) cuisineEl.value = "mediterranean";

    if (!mealTypeEl.value) mealTypeEl.value = "dinner";
    if (!maxReadyTimeEl.value) maxReadyTimeEl.value = vibe === "fast" ? "25" : "35";

    toast("Surprise ingredients loaded. Now hit “Find recipes”.");
  });

  // --- Search ---
  clearBtn.addEventListener("click", () => {
    ingredients = [];
    renderChips();
    ingredientsInput.value = "";
    mealTypeEl.value = "";
    cuisineEl.value = "";
    dietEl.value = "";
    maxReadyTimeEl.value = "";
    cardsEl.innerHTML = "";
    resultsMetaEl.textContent = "No search yet.";
    emptyStateEl.classList.remove("hidden");
    statusEl.textContent = "";
  });

  searchBtn.addEventListener("click", () => runSearch());

  async function runSearch(){
    statusEl.textContent = "";
    if (ingredients.length === 0) {
      emptyStateEl.classList.remove("hidden");
      statusEl.textContent = "Add at least one ingredient.";
      statusEl.style.color = "var(--danger)";
      return;
    }
    statusEl.style.color = "";

    emptyStateEl.classList.add("hidden");
    cardsEl.innerHTML = "";
    showSkeletons(true);

    const params = new URLSearchParams();

    const onlySelected = !!(onlySelectedEl && onlySelectedEl.checked);
    if (ingredients.length > 0) {
      params.set("ingredients", ingredients.join(","));
    } else if (onlySelected) {
      statusEl.textContent = "Add at least one ingredient (or turn off Only use selected ingredients).";
      statusEl.style.color = "var(--danger)";
      showSkeletons(false);
      emptyStateEl.classList.remove("hidden");
      return;
    }
    if (mealTypeEl.value) params.set("mealType", mealTypeEl.value);
    if (cuisineEl.value) params.set("cuisine", cuisineEl.value);
    if (dietEl.value) params.set("diet", dietEl.value);

    const maxTime = (maxReadyTimeEl.value || "").trim();
    if (maxTime && /^\d{1,3}$/.test(maxTime)) params.set("maxReadyTime", maxTime);

    try {
      let data;
      if (useStaticRecipeDemo()) {
        data = await fetchSearchFromSpoonacular();
      } else {
        const r = await fetch(`/api/search?${params.toString()}`);
        data = await r.json();

        if (!r.ok) throw new Error(data?.error || "Search failed");
      }

      const total = data?.totalResults ?? data?.results?.length ?? 0;
      if (ingredients.length > 0) {
        resultsMetaEl.textContent = `Found ${Math.min(total, data.results.length)} recipe(s) using: ${ingredients.join(", ")}.`;
      } else {
        resultsMetaEl.textContent = `Found ${Math.min(total, data.results.length)} recipe(s).`;
      }

      renderCards(data.results || []);

      if ((data.results || []).length === 0) {
        emptyStateEl.classList.remove("hidden");
        resultsMetaEl.textContent = "No recipes found. Try fewer ingredients or remove diet filters.";
      } else {
        emptyStateEl.classList.add("hidden");
      }

      toast("Recipes ready. Click any card to open full instructions.");
    } catch (e) {
      statusEl.textContent = `Error: ${e.message}`;
      statusEl.style.color = "var(--danger)";
      resultsMetaEl.textContent = "Search failed.";
      emptyStateEl.classList.remove("hidden");
    } finally {
      showSkeletons(false);
    }
  }

  // --- Cards ---
  function renderCards(items){
    cardsEl.innerHTML = "";
    items.forEach(item => {
      const used = item?.usedIngredientCount ?? null;
      const missed = item?.missedIngredientCount ?? null;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img class="img" src="${escapeAttr(item.image || "")}" alt="${escapeAttr(item.title || "Recipe")}">
        <div class="body">
          <div class="title">${escapeHtml(item.title || "Untitled")}</div>
          <div class="badges">
            ${item.readyInMinutes ? `<div class="badge">⏱ ${item.readyInMinutes} min</div>` : ""}
            ${item.servings ? `<div class="badge">🍽 ${item.servings} servings</div>` : ""}
            ${used !== null ? `<div class="badge">✅ uses ${used}</div>` : ""}
            ${missed !== null ? `<div class="badge">➕ needs ${missed}</div>` : ""}
          </div>
        </div>
      `;

      card.addEventListener("click", () => openRecipe(item.id));
      cardsEl.appendChild(card);
    });
  }

  // --- Modal details ---
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) closeModal();
  });

  async function openRecipe(id){
    modalOverlay.classList.remove("hidden");
    modalOverlay.setAttribute("aria-hidden", "false");
    modalContent.innerHTML = makeModalLoading();

    try {
      let data;
      if (useStaticRecipeDemo()) {
        data = await fetchRecipeFromSpoonacular(id);
      } else {
        const r = await fetch(`/api/recipe/${encodeURIComponent(id)}`);
        data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load recipe");
      }

      modalContent.innerHTML = makeModalHtml(data);
    } catch (e) {
      modalContent.innerHTML = `
        <div class="section">
          <h3>Couldn’t load recipe</h3>
          <div style="color: var(--muted); line-height:1.5;">${escapeHtml(e.message)}</div>
        </div>
      `;
    }
  }

  function closeModal(){
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
  }

  function makeModalLoading(){
    return `
      <div class="section">
        <h3>Loading recipe…</h3>
        <div style="color: var(--muted);">Fetching ingredients, steps, and images.</div>
      </div>
    `;
  }

  function makeModalHtml(r){
    const title = r.title || "Untitled";
    const image = r.image || "";
    const summary = stripHtml(r.summary || "");
    const sourceUrl = r.sourceUrl || r.spoonacularSourceUrl || "";

    const pills = [];
    if (r.readyInMinutes) pills.push(`⏱ ${r.readyInMinutes} min`);
    if (r.servings) pills.push(`🍽 ${r.servings} servings`);
    if (r.cuisines?.length) pills.push(`🌍 ${r.cuisines[0]}`);
    if (r.dishTypes?.length) pills.push(`🥗 ${r.dishTypes[0]}`);
    if (r.cheap) pills.push("💸 budget");
    if (r.veryHealthy) pills.push("🥦 healthy");

    const ingredientsHtml = (r.extendedIngredients || []).slice(0, 30).map(ing => {
      const img = ing.image
        ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}`
        : "";
      const name = ing.original || ing.name || "Ingredient";
      return `
        <div class="ing">
          ${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(ing.name || "ingredient")}">` : `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" style="opacity:.15">`}
          <div style="display:flex; flex-direction:column; gap:2px;">
            <div style="font-weight:700;">${escapeHtml(ing.name || "Ingredient")}</div>
            <div style="color: var(--muted2); font-size:12px;">${escapeHtml(name)}</div>
          </div>
        </div>
      `;
    }).join("");

    const steps = extractSteps(r);
    const stepsHtml = steps.length
      ? `<ol class="steps">${steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
      : `<div style="color: var(--muted); line-height:1.5;">No structured steps found. Open source link for full instructions.</div>`;

    return `
      <div class="modal-hero">
        <img src="${escapeAttr(image)}" alt="${escapeAttr(title)}">
        <div>
          <div class="modal-title">${escapeHtml(title)}</div>
          <div class="modal-sub">${escapeHtml(summary.slice(0, 280))}${summary.length > 280 ? "…" : ""}</div>
          <div class="kv">
            ${pills.map(p => `<div class="pill">${escapeHtml(p)}</div>`).join("")}
          </div>
          ${sourceUrl ? `<div style="margin-top:12px;"><a class="link" href="${escapeAttr(sourceUrl)}" target="_blank" rel="noreferrer">Open original recipe ↗</a></div>` : ""}
          ${r.id ? `<div class="modal-actions"><button class="btn cook-cta aiCookBtn" type="button" data-recipe-id="${escapeAttr(r.id)}">🎬 Watch AI Cooking</button></div>` : ""}
        </div>
      </div>

      <div class="cols">
        <div class="section">
          <h3>Ingredients</h3>
          <div class="ing-list">${ingredientsHtml || `<div style="color:var(--muted);">No ingredients found.</div>`}</div>
        </div>

        <div class="section">
          <h3>Instructions</h3>
          ${stepsHtml}
        </div>
      </div>
    `;
  }

  // Extract best possible steps
  function extractSteps(r){
    // Spoonacular often returns analyzedInstructions[0].steps
    const ai = r.analyzedInstructions;
    if (Array.isArray(ai) && ai.length > 0 && Array.isArray(ai[0].steps)) {
      return ai[0].steps.map(s => s.step).filter(Boolean);
    }

    // fallback: strip from instructions HTML-ish string
    const instr = stripHtml(r.instructions || "");
    if (!instr) return [];
    // split on periods if it’s one paragraph
    const rough = instr.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    return rough.length > 1 ? rough : [instr.trim()];
  }

  // --- Skeletons ---
  function showSkeletons(show){
    skeletonsEl.classList.toggle("hidden", !show);
    skeletonsEl.setAttribute("aria-hidden", show ? "false" : "true");

    if (show) {
      skeletonsEl.innerHTML = "";
      for (let i = 0; i < 6; i++) {
        const s = document.createElement("div");
        s.className = "skel";
        s.innerHTML = `
          <div class="skel-img"></div>
          <div class="skel-body">
            <div class="line"></div>
            <div class="line short"></div>
            <div class="line"></div>
          </div>
        `;
        skeletonsEl.appendChild(s);
      }
    } else {
      skeletonsEl.innerHTML = "";
    }
  }

  // --- Helpers ---
  function toast(msg){
    statusEl.style.color = "";
    statusEl.textContent = msg;
    // fade-ish effect by clearing later
    const t = setTimeout(() => {
      if (statusEl.textContent === msg) statusEl.textContent = "";
      clearTimeout(t);
    }, 4500);
  }

  function stripHtml(html){
    return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeAttr(s){ return escapeHtml(s).replaceAll("`", "&#096;"); }

  // Initial UI
  renderChips();
  emptyStateEl.classList.remove("hidden");
  applyVibeDefaults();

}


/* AI Cooking Mode button (auto tutorial + voice) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".aiCookBtn");
  if(!btn) return;
  const id = btn.getAttribute("data-recipe-id");
  if(id){
    window.location.href = `./cook.html?recipeId=${encodeURIComponent(id)}`;
  }
});
