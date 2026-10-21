# Heritage & Honey | Premium Restaurant Template Customization Guide

Welcome to your new premium website template. This site has been architected for high-end hospitality brands with a focus on soul food and modern dining.

## 📁 Key File Locations
All the content for this website is centralized in one file to make your customization process as fast as possible.

- **Main Content & Data:** `src/data/templateData.ts`
- **Branding & Colors:** `src/index.css`
- **Site Structure:** `src/App.tsx`

---

## 🎨 Professional Styling Tips

### 1. Changing Your Brand Colors
Open `src/index.css` and locate the `@theme` block. Update the hex codes for:
- `--color-brand-cream`: Your background color.
- `--color-brand-burgundy`: Your primary accent (logo, borders).
- `--color-brand-gold`: Your secondary accent (hover states, highlights).

### 2. Updating Typography
We use Google Fonts (Inter and Playfair Display). If you wish to change these:
1. Go to [fonts.google.com](https://fonts.google.com) and select a Serif and a Sans Serif font.
2. Replace the `@import` URL at the top of `src/index.css`.
3. Update the `--font-sans` and `--font-serif` variables in the `@theme` block.

---

## 🍽 Managing Your Menu & Copy
Open `src/data/templateData.ts`. You will find a large object named `templateData`. 

- **Menu Items:** Find the `menu` object. You can add or remove items from the `items` array inside each category.
- **Images:** Replace the Unsplash URLs with your own high-resolution food photography.
- **Testimonials:** Update the `testimonials` array with real quotes from your patrons.

---

## 🖼 Image Specification Guide
For the best visual results, use the following aspect ratios:
- **Hero Image:** 16:9 (Landscape)
- **Featured Dishes:** 4:3 or 4:5 (Portrait/Still)
- **Chef/About Image:** 3:4 (Portrait)
- **Gallery:** 1:1 (Square)

---

## 🚀 Deployment
This template is built with **React & Vite**.
1. Run `npm install` to install dependencies.
2. Run `npm run build` to create a production-ready folder.
3. Upload the contents of the `dist/` folder to your hosting provider (Vercel, Netlify, or HostGator).

---

*Thank you for choosing Heritage & Honey. If you love this template, please consider leaving a review on Etsy!*
