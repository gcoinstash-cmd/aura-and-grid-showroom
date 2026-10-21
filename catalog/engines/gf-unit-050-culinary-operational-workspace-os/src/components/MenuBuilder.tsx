/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Plus, Edit, Trash2, Tag, Utensils, Clipboard, Star, EyeOff, Save, X, Layers, Image, AlertCircle } from "lucide-react";
import { MenuItem, CourseCategory, PrepComplexity } from "../types";

interface MenuBuilderProps {
  menuItems: MenuItem[];
  isClientView: boolean;
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onOpenQuickMenu: boolean; // Flag to force form open
  onResetQuickMenu: () => void;
}

export default function MenuBuilder({
  menuItems,
  isClientView,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onOpenQuickMenu,
  onResetQuickMenu,
}: MenuBuilderProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CourseCategory | "All">("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(menuItems[0] || null);
  const [isAdding, setIsAdding] = useState(onOpenQuickMenu);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: "",
    category: CourseCategory.Main,
    description: "",
    keyIngredients: [],
    complexity: PrepComplexity.Medium,
    costPerServing: 15,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  });

  const [ingredientInput, setIngredientInput] = useState("");

  // Handle forcing active quick addition from App
  if (onOpenQuickMenu && !isAdding) {
    setIsAdding(true);
    setFormData({
      id: "menu_" + Date.now(),
      name: "",
      category: CourseCategory.AmuseBouche,
      description: "",
      keyIngredients: [],
      complexity: PrepComplexity.High,
      costPerServing: 20.0,
      imageUrl: "https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=800&q=80",
    });
    setIngredientInput("");
    onResetQuickMenu();
  }

  const startAddNew = () => {
    setFormData({
      id: "menu_" + Date.now(),
      name: "",
      category: CourseCategory.Main,
      description: "",
      keyIngredients: [],
      complexity: PrepComplexity.Medium,
      costPerServing: 15.0,
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
    });
    setIngredientInput("");
    setIsAdding(true);
    setIsEditing(false);
  };

  const startEdit = (item: MenuItem) => {
    setFormData({ ...item });
    setIngredientInput(item.keyIngredients.join(", "));
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // Parse comma ingredients
    const parsedIngredients = ingredientInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const finalized: MenuItem = {
      id: (formData.id as string) || "menu_" + Date.now(),
      name: formData.name || "Bespoke Creation",
      category: (formData.category as CourseCategory) || CourseCategory.Main,
      description: formData.description || "",
      keyIngredients: parsedIngredients.length > 0 ? parsedIngredients : (formData.keyIngredients || []),
      complexity: (formData.complexity as PrepComplexity) || PrepComplexity.Medium,
      costPerServing: Number(formData.costPerServing) || 10,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    };

    if (isAdding) {
      onAddMenuItem(finalized);
      setSelectedItem(finalized);
    } else {
      onUpdateMenuItem(finalized);
      if (selectedItem?.id === finalized.id) {
        setSelectedItem(finalized);
      }
    }

    setIsAdding(false);
    setIsEditing(false);
  };

  // Filter menu items by active tab category
  const filteredItems = activeCategoryFilter === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategoryFilter);

  // Lookbook preset image options for easy choosing in form
  const PRESET_CULINARY_IMAGES = [
    { title: "Raw Oysters/Seafood", url: "https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=800&q=80" },
    { title: "Wagyu / Tenderloin Steak", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" },
    { title: "Verdant Green Plates", url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80" },
    { title: "White Citrus Sorbet", url: "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&w=800&q=80" },
    { title: "Decadent Soufflé", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80" },
    { title: "Delicate Pastries", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <div className="space-y-8">
      
      {/* Editorial Navigation Headers */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold-400">Curated Palette</span>
          <h2 className="text-3xl font-serif text-white tracking-tight mt-1">Bespoke Menu Builder</h2>
          <p className="text-xs text-neutral-400 mt-1">Crafting course progressions with detailed culinary notes and image boards.</p>
        </div>
        
        <button
          onClick={startAddNew}
          className="self-start md:self-auto flex items-center gap-1.5 px-5 py-3 min-h-[44px] bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] uppercase tracking-wider font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Lookbook Course
        </button>
      </div>

      {/* Category Multi-tab selectors */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 py-2 overflow-x-auto max-w-full">
        <button
          onClick={() => {
            setActiveCategoryFilter("All");
            setSelectedItem(null);
          }}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 border-b-2 ${
            activeCategoryFilter === "All"
              ? "border-gold-400 text-white font-medium"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          All Lookbook
        </button>
        {Object.values(CourseCategory).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategoryFilter(cat);
              const foundOne = menuItems.find((item) => item.category === cat);
              setSelectedItem(foundOne || null);
            }}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeCategoryFilter === cat
                ? "border-gold-400 text-white font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Lookbook (Canvas Gallery left, Details right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Looking Grid Core (8 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                  className={`group relative cursor-pointer overflow-hidden border transition-all duration-500 bg-[#0e0e0e] ${
                    isSelected
                      ? "border-gold-400/50 scale-[0.99] ring-1 ring-gold-400/20"
                      : "border-white/5 hover:border-white/20"
                  }`}
                >
                  {/* Large Lookbook Image Aspect Ratio */}
                  <div className="aspect-[4/5] overflow-hidden bg-neutral-900 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    {/* Shadow overlay gradient for texts */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
                    
                    {/* Course Category Badge top left */}
                    <span className="absolute top-4 left-4 font-mono text-[9px] uppercase tracking-[0.15em] bg-black/75 text-gold-300 px-2.5 py-1 border border-gold-400/20">
                      {item.category}
                    </span>

                    {/* Quick Cost display top right (unless Client View on) */}
                    {!isClientView && (
                      <span className="absolute top-4 right-4 font-mono text-xs font-semibold tracking-wider bg-gold-400 text-neutral-950 px-2 py-0.5 font-semibold">
                        ${item.costPerServing.toFixed(2)}
                      </span>
                    )}

                    {/* Hover Visual Line Border */}
                    <div className="absolute inset-4 border border-white/0 group-hover:border-white/10 transition-all duration-500 pointer-events-none" />

                    {/* Core Title and desc overlayed bottom */}
                    <div className="absolute bottom-5 left-5 right-5 text-left">
                      <h4 className="font-serif text-xl text-white group-hover:text-gold-400 transition-colors tracking-wide leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="sm:col-span-2 border border-dashed border-white/5 p-12 text-center text-neutral-500">
                <Utensils className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm">No lookbook offerings recorded in this progression category.</p>
                <button
                  onClick={startAddNew}
                  className="mt-2 text-base font-semibold min-h-[44px] text-gold-400 font-mono tracking-wider uppercase hover:underline"
                >
                  Create a Course Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS PANEL / ATTACHED DATABASE FORM (5 Columns) */}
        <div className="lg:col-span-5">
          {isAdding || isEditing ? (
            /* Create / Edit Form Card */
            <form onSubmit={handleSave} className="bg-[#121212] border border-white/5 p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-serif text-white tracking-tight">
                  {isAdding ? "Draft New Creation" : `Refine: ${formData.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                  Dish Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Belon Oysters with Caviar"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Category
                  </label>
                  <select
                    value={formData.category || CourseCategory.Main}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CourseCategory })}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-gold-400/50"
                  >
                    {Object.values(CourseCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Prep Complexity
                  </label>
                  <select
                    value={formData.complexity || PrepComplexity.Medium}
                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value as PrepComplexity })}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-gold-400/50"
                  >
                    {Object.values(PrepComplexity).map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                  Cost Per Serving ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="24.50"
                  value={formData.costPerServing || ""}
                  onChange={(e) => setFormData({ ...formData, costPerServing: Number(e.target.value) })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                  Dish Narrative / Editorial Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Narrative tracing matching notes, vineyard matches, temperature profile, and physical plating visual constraints..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-xs text-neutral-200 focus:outline-none focus:border-gold-400/50 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Key Ingredients
                  </label>
                  <span className="font-mono text-[9px] text-neutral-500">Comma separated</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="White Asparagus, Caviar, Lemon, Chive"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              {/* Lookbook Preset Selector for visuals */}
              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                  Select Portfolio Plating Cover
                </span>
                <div className="grid grid-cols-6 gap-2.5">
                  {PRESET_CULINARY_IMAGES.map((preset, idx) => {
                    const isSelected = formData.imageUrl === preset.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`aspect-square cursor-pointer overflow-hidden border relative ${
                          isSelected ? "border-gold-400 scale-[0.9] ring-1 ring-gold-400" : "border-white/5 opacity-60 hover:opacity-100"
                        }`}
                        title={preset.title}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-semibold tracking-wider text-neutral-500 leading-snug">
                  📌 Custom image assets are matched with safe placeholder portfolio links for seamless compilation.
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-[#161616] text-xs font-semibold font-mono uppercase tracking-widest text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] font-semibold uppercase tracking-widest font-semibold transition-colors"
                >
                  Publish Course
                </button>
              </div>
            </form>
          ) : selectedItem ? (
            /* View Lookbook Detail Card */
            <div className="bg-[#121212] border border-white/5 p-8 space-y-6">
              
              {/* Image Preview inside detail card */}
              <div className="aspect-[16/10] overflow-hidden bg-neutral-900 border border-white/5 relative group">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-black/85 text-gold-400 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-gold-400/10">
                  {selectedItem.category}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-2xl font-serif text-white tracking-tight">{selectedItem.name}</h3>
                  <span className="font-mono text-xs font-semibold tracking-wider tracking-wider text-neutral-400 uppercase block mt-1">
                    Database ID: {selectedItem.id}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => startEdit(selectedItem)}
                    className="p-1.5 border border-white/5 hover:border-gold-400/20 text-neutral-500 hover:text-gold-400 transition-all hover:bg-gold-400/5"
                    title="Edit Item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Archive lookbook item "${selectedItem.name}"?`)) {
                        onDeleteMenuItem(selectedItem.id);
                        setSelectedItem(menuItems.find((m) => m.id !== selectedItem.id) || null);
                      }
                    }}
                    className="p-1.5 border border-white/5 hover:border-red-500/20 text-neutral-500 hover:text-red-400 transition-all hover:bg-red-500/5"
                    title="Archive Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-5 text-left">
                <div>
                  <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block">
                    Complexity
                  </span>
                  {isClientView ? (
                    <span className="text-sm font-sans text-neutral-400 italic block mt-1 flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-neutral-600" /> Masked
                    </span>
                  ) : (
                    <span className={`text-sm font-semibold tracking-wider font-mono mt-1 block uppercase ${
                      selectedItem.complexity === PrepComplexity.High
                        ? "text-red-400"
                        : selectedItem.complexity === PrepComplexity.Medium
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}>
                      {selectedItem.complexity}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block">
                    Unit Plate Cost
                  </span>
                  {isClientView ? (
                    <span className="text-sm font-sans text-neutral-400 italic block mt-1 flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-neutral-600" /> Masked
                    </span>
                  ) : (
                    <span className="text-base font-mono font-medium text-gold-400 tracking-wider mt-1 block">
                      ${selectedItem.costPerServing.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Key Ingredients breakdown */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block">
                  Key Ingredients & Matrix Triggers
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.keyIngredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[#1a1a1a] text-xs font-semibold font-sans text-neutral-300 border border-white/5"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="border border-dashed border-white/5 h-[350px] flex items-center justify-center bg-[#121212]/30">
              <p className="text-neutral-500 text-sm">Select an exquisite course block to examine gastronomy detail.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
