# COOK IA

COOK IA is an AI-style cooking assistant that turns available ingredients into recipe ideas, filters them by cuisine, diet, meal type, and prep time, then guides the user through an interactive cooking mode.

## Highlights

- Ingredient-based recipe discovery powered by Spoonacular
- Filters for cuisine, diet, meal type, maximum ready time, and selected-ingredients-only mode
- Polished landing experience with a premium culinary visual style
- Recipe cards with used/missing ingredient counts and recipe metadata
- Detailed recipe modal with ingredients and instructions
- Interactive cooking mode with step timeline, automated progression, voice narration, captions, timers, and ingredient highlighting
- Static demo fallback for GitHub Pages-style hosting
- Express API proxy for server-side Spoonacular requests

## Tech Stack

- JavaScript, HTML, CSS
- Node.js and Express
- Spoonacular API
- Web Speech API for guided cooking narration
- Browser localStorage/sessionStorage for selected recipe flow

## Project Structure

```text
public/
  index.html       Landing page
  recipes.html     Recipe search and filtering UI
  cook.html        Guided cooking mode
  app.js           Landing and recipe-search logic
  cook.js          Step-by-step cooking mode
  styles.css       Responsive visual design
server.js          Express server and Spoonacular API proxy
```

## Run Locally

```bash
npm install
cp .env.example .env
# Add SPOONACULAR_API_KEY=your_key_here
npm start
```

Then open `http://localhost:3000`.

## Demo Behavior

When hosted as a static site, COOK IA can fall back to built-in demo recipes so the UI and guided cooking mode remain reviewable without a server. For full recipe search, run the Express server with a Spoonacular API key.

## What I Built

I built the frontend recipe experience, filtering flow, server-side API proxy, static demo fallback, and guided cooking mode with timers, narration, captions, and animated step transitions. The project demonstrates API integration, interactive UI state, and product-focused frontend engineering.
