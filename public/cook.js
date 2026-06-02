/* COOK IA — AI Cooking Mode (fully automated)
   Premium upgrades:
   - Cinematic transitions between steps
   - Step timeline (click to jump)
   - Step timer ring + countdown
   - Ingredient highlighting per step
   - Voice picker + speed
   - Captions bar toggle
   - Fullscreen toggle
*/

function qs(id){ return document.getElementById(id); }

const state = {
  recipeId: null,
  steps: [],
  stepIndex: 0,
  playing: false,
  voiceOn: true,
  captionsOn: true,
  rate: 1.0,
  timer: null,
  tick: null,
  utterance: null,
  voices: [],
  voiceURI: null,
  ingredients: [],
  stepDuration: 8,
  stepRemaining: 8,
};

const animMap = [
  { words: ["chop","dice","slice","mince","cut","julienne","cube","peel","trim"], emoji:"🔪", label:"Chop & prep" , cls:"anim-chop"},
  { words: ["mix","whisk","stir","combine","beat","fold","blend","knead"],  emoji:"🥣", label:"Mix it up"  , cls:"anim-mix"},
  { words: ["fry","saute","sauté","pan","skillet","sear","cook over","heat oil","brown"], emoji:"🍳", label:"Cook in the pan", cls:"anim-fry"},
  { words: ["boil","simmer","steam","poach","blanch","bring to a boil","reduce"], emoji:"🍲", label:"Simmer / boil", cls:"anim-boil"},
  { words: ["bake","roast","oven","preheat","broil","grill","toast"], emoji:"🔥", label:"Oven time", cls:"anim-bake"},
  { words: ["serve","garnish","plate","enjoy","top with","sprinkle"], emoji:"🍽️", label:"Plate & serve", cls:"anim-serve"},
];

function cleanText(s){
  if(!s) return "";
  return String(s).replace(/\s+/g," ").replace(/\(.*?\)/g,"").trim();
}

function pickAnim(text){
  const t = (text || "").toLowerCase();
  for(const a of animMap){
    for(const w of a.words){
      if(t.includes(w)) return a;
    }
  }
  return { emoji:"👩‍🍳", label:"Follow this step", cls:"anim-default" };
}

function stepsFromRecipe(recipe){
  const out = [];
  if(recipe && Array.isArray(recipe.analyzedInstructions) && recipe.analyzedInstructions.length){
    const block = recipe.analyzedInstructions[0];
    if(block && Array.isArray(block.steps)){
      for(const st of block.steps){
        const txt = cleanText(st.step);
        if(txt) out.push(txt);
      }
    }
  }
  if(out.length === 0 && recipe && recipe.instructions){
    const raw = cleanText(recipe.instructions);
    raw.split(/\.(\s+|$)|\n+/).map(x => cleanText(x)).filter(x => x.length > 4)
      .forEach(x => out.push(x.endsWith(".") ? x : x + "."));
  }
  if(out.length === 0){
    out.push("Gather your ingredients and set up your workspace.");
    out.push("Follow the on-screen instructions step by step.");
    out.push("Cook until done, then plate and enjoy!");
  }
  return out.map(s => s.replace(/^\d+\s*[)\.-]\s*/,""));
}

function uniq(arr){
  return Array.from(new Set(arr));
}

function extractIngredients(recipe){
  const list = (recipe && Array.isArray(recipe.extendedIngredients)) ? recipe.extendedIngredients : [];
  const names = [];
  for(const it of list){
    const n = (it && (it.nameClean || it.name)) ? String(it.nameClean || it.name) : "";
    if(n) names.push(n);
  }
  const normalized = uniq(names.map(n => n.toLowerCase().trim())).filter(Boolean);
  normalized.sort((a,b) => a.length - b.length);
  return normalized.slice(0, 60);
}

function buildIngredientChips(){
  const chips = qs("ingredientChips");
  chips.innerHTML = "";
  const show = state.ingredients.slice(0, 16);
  if(show.length === 0){
    const span = document.createElement("span");
    span.className = "cook-chip";
    span.textContent = "Ingredients not listed";
    chips.appendChild(span);
    return;
  }
  for(const n of show){
    const span = document.createElement("span");
    span.className = "cook-chip";
    span.textContent = n.charAt(0).toUpperCase() + n.slice(1);
    span.dataset.ing = n;
    chips.appendChild(span);
  }
}

function setBadges(recipe){
  const wrap = qs("recipeBadges");
  wrap.innerHTML = "";
  const items = [];
  if(recipe && recipe.readyInMinutes) items.push(`${recipe.readyInMinutes} min`);
  if(recipe && recipe.servings) items.push(`${recipe.servings} servings`);
  if(recipe && recipe.vegetarian) items.push("Vegetarian");
  if(recipe && recipe.vegan) items.push("Vegan");
  if(recipe && recipe.glutenFree) items.push("Gluten-free");

  for(const label of items.slice(0,4)){
    const b = document.createElement("span");
    b.className = "cook-badge";
    b.textContent = label;
    wrap.appendChild(b);
  }
}

function stopAll(){
  state.playing = false;
  clearTimeout(state.timer);
  clearInterval(state.tick);
  state.timer = null;
  state.tick = null;
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  state.utterance = null;
  qs("playPause").textContent = "Play";
}

function estimateDuration(stepText){
  const words = cleanText(stepText).split(" ").filter(Boolean).length;
  const sec = Math.min(18, 4 + words * 0.25);
  return Math.max(6, sec);
}

function setTimerRing(pct){
  const c = 2 * Math.PI * 50;
  const ring = qs("timerRing");
  ring.style.strokeDasharray = `${c}`;
  ring.style.strokeDashoffset = `${c * (1 - pct)}`;
}

function startCountdown(seconds){
  state.stepDuration = seconds;
  state.stepRemaining = seconds;

  qs("timerSecs").textContent = String(Math.ceil(state.stepRemaining));
  setTimerRing(1);

  clearInterval(state.tick);
  state.tick = setInterval(() => {
    if(!state.playing) return;
    state.stepRemaining -= 0.2;
    const rem = Math.max(0, state.stepRemaining);
    qs("timerSecs").textContent = String(Math.ceil(rem));
    const pct = state.stepDuration ? (rem / state.stepDuration) : 0;
    setTimerRing(pct);
  }, 200);
}

function highlightIngredientsForStep(stepText){
  const t = (stepText || "").toLowerCase();
  const chips = Array.from(document.querySelectorAll(".cook-chip[data-ing]"));
  let hit = 0;

  for(const el of chips){
    const ing = el.dataset.ing || "";
    const base = ing.replace(/s$/,"");
    const matched = ing && (t.includes(ing) || (base && t.includes(base)));
    el.classList.toggle("hit", !!matched);
    if(matched) hit += 1;
  }
  const hint = qs("ingredientHint");
  hint.textContent = hit > 0
    ? `Highlighted ${hit} ingredient${hit>1?"s":""} used in this step.`
    : "Ingredients mentioned in this step will highlight.";
}

function setCaptions(text){
  const bar = qs("captionBar");
  if(!state.captionsOn){
    bar.style.display = "none";
    return;
  }
  bar.style.display = "block";
  bar.textContent = text || "";
}

function speak(text){
  if(!state.voiceOn) return;
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = state.rate;
  u.pitch = 1.0;
  u.volume = 1.0;

  if(state.voiceURI){
    const v = state.voices.find(x => x.voiceURI === state.voiceURI);
    if(v) u.voice = v;
  }

  state.utterance = u;
  window.speechSynthesis.speak(u);
}

function renderTimeline(){
  const tl = qs("timeline");
  tl.innerHTML = "";
  const total = state.steps.length;
  for(let i=0;i<total;i++){
    const item = document.createElement("button");
    item.className = "cook-tl-item";
    item.type = "button";
    item.dataset.i = String(i);
    item.innerHTML = `<span class="cook-tl-num">${i+1}</span><span class="cook-tl-dot"></span>`;
    item.addEventListener("click", () => {
      stopAll();
      state.stepIndex = i;
      renderStep(true);
      speak(state.steps[state.stepIndex]);
    });
    tl.appendChild(item);
  }
}

function markTimelineActive(){
  const items = Array.from(document.querySelectorAll(".cook-tl-item"));
  for(const it of items){
    const i = parseInt(it.dataset.i || "0", 10);
    it.classList.toggle("active", i === state.stepIndex);
    it.classList.toggle("done", i < state.stepIndex);
  }
  const active = items[state.stepIndex];
  if(active){
    active.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
  }
}

function renderStep(withTransition){
  const total = state.steps.length;
  const i = state.stepIndex;
  const txt = state.steps[i] || "";

  qs("stepText").textContent = txt;
  qs("stepCount").textContent = `Step ${i+1}`;
  qs("progressHint").textContent = `${i+1} / ${total}`;

  const pct = total ? ((i+1)/total)*100 : 0;
  qs("progressFill").style.width = pct + "%";

  const anim = pickAnim(txt);
  const emoji = qs("animEmoji");
  const label = qs("animLabel");
  const area  = qs("animArea");

  if(withTransition){
    area.classList.remove("step-enter");
    void area.offsetWidth;
    area.classList.add("step-enter");
  }

  emoji.textContent = anim.emoji;
  label.textContent = anim.label;
  area.className = "cook-anim " + anim.cls + (withTransition ? " step-enter" : "");

  setCaptions(txt);
  highlightIngredientsForStep(txt);
  startCountdown(estimateDuration(txt) * (1.0 / state.rate));
  markTimelineActive();
}

function advance(){
  if(!state.playing) return;
  renderStep(true);
  speak(state.steps[state.stepIndex]);

  const dur = estimateDuration(state.steps[state.stepIndex]) * (1.0 / state.rate);
  clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    if(state.stepIndex < state.steps.length - 1){
      state.stepIndex += 1;
      advance();
    } else {
      stopAll();
    }
  }, dur * 1000);
}

function populateVoices(){
  if(!window.speechSynthesis) return;
  state.voices = window.speechSynthesis.getVoices() || [];
  const sel = qs("voiceSelect");
  sel.innerHTML = "";

  const voices = [...state.voices].sort((a,b) => {
    const ae = (a.lang || "").toLowerCase().startsWith("en") ? 0 : 1;
    const be = (b.lang || "").toLowerCase().startsWith("en") ? 0 : 1;
    if(ae !== be) return ae - be;
    return (a.name || "").localeCompare(b.name || "");
  });

  for(const v of voices){
    const opt = document.createElement("option");
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(opt);
  }

  const samantha = voices.find(v => 
    v.name.toLowerCase().includes("samantha") &&
    v.lang.toLowerCase().startsWith("en")
  );

  const chosen = samantha || 
                 voices.find(v => (v.lang || "").toLowerCase().startsWith("en")) || 
                 voices[0];

  if (chosen) {
    state.voiceURI = chosen.voiceURI;
    sel.value = chosen.voiceURI;
  }
}


function toggleFullscreen(){
  const el = document.documentElement;
  if(!document.fullscreenElement){
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function bindUI(){
  qs("prevStep").addEventListener("click", () => {
    stopAll();
    state.stepIndex = Math.max(0, state.stepIndex - 1);
    renderStep(true);
    speak(state.steps[state.stepIndex]);
  });

  qs("nextStep").addEventListener("click", () => {
    stopAll();
    state.stepIndex = Math.min(state.steps.length - 1, state.stepIndex + 1);
    renderStep(true);
    speak(state.steps[state.stepIndex]);
  });

  qs("playPause").addEventListener("click", () => {
    state.playing = !state.playing;
    if(state.playing){
      qs("playPause").textContent = "Pause";
      advance();
    } else {
      stopAll();
    }
  });

  qs("replayStep").addEventListener("click", () => {
    stopAll();
    renderStep(true);
    speak(state.steps[state.stepIndex]);
  });

  qs("voiceToggle").addEventListener("click", () => {
    state.voiceOn = !state.voiceOn;
    qs("voiceToggle").textContent = state.voiceOn ? "🔊" : "🔇";
    if(!state.voiceOn && window.speechSynthesis) window.speechSynthesis.cancel();
    if(state.voiceOn) speak(state.steps[state.stepIndex]);
  });

  qs("captionsToggle").addEventListener("click", () => {
    state.captionsOn = !state.captionsOn;
    qs("captionsToggle").classList.toggle("active", state.captionsOn);
    setCaptions(state.steps[state.stepIndex]);
  });

  qs("fullscreenToggle").addEventListener("click", toggleFullscreen);

  qs("speedSelect").addEventListener("change", (e) => {
    state.rate = parseFloat(e.target.value || "1.0");
    renderStep(true);
    if(state.playing){
      stopAll();
      state.playing = true;
      qs("playPause").textContent = "Pause";
      advance();
    }
  });

  qs("voiceSelect").addEventListener("change", (e) => {
    state.voiceURI = e.target.value || null;
    speak(state.steps[state.stepIndex]);
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === " "){
      e.preventDefault();
      qs("playPause").click();
    } else if(e.key === "ArrowRight"){
      qs("nextStep").click();
    } else if(e.key === "ArrowLeft"){
      qs("prevStep").click();
    } else if(e.key.toLowerCase() === "f"){
      toggleFullscreen();
    } else if(e.key.toLowerCase() === "m"){
      qs("voiceToggle").click();
    }
  });
}

async function init(){
  const params = new URLSearchParams(window.location.search);
  state.recipeId = params.get("recipeId");
  bindUI();

  if(window.speechSynthesis){
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  if(!state.recipeId){
    qs("recipeName").textContent = "No recipe selected";
    state.steps = ["Go back and open a recipe, then tap “Watch AI Cooking”."];
    renderTimeline();
    renderStep(false);
    return;
  }

  try{
    const res = await fetch(`/api/recipe/${encodeURIComponent(state.recipeId)}`);
    const recipe = await res.json();

    qs("recipeName").textContent = recipe.title || "Recipe";
    setBadges(recipe);

    state.ingredients = extractIngredients(recipe);
    buildIngredientChips();

    state.steps = stepsFromRecipe(recipe);
    state.stepIndex = 0;

    renderTimeline();
    renderStep(false);
    speak(state.steps[0]);
  } catch(err){
    qs("recipeName").textContent = "Couldn't load recipe";
    state.steps = ["Please check your server is running, then try again."];
    renderTimeline();
    state.stepIndex = 0;
    renderStep(false);
  }
}

document.addEventListener("DOMContentLoaded", init);
