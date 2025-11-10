// store/shirtCache.js - Memory-only cache that clears on refresh

import { subscribe } from "valtio";
import state from "./index";

class ShirtCacheManager {
  constructor() {
    // In-memory cache ONLY - no localStorage/sessionStorage
    this.memoryCache = null;
    this.saveTimer = null;
    this.SAVE_DELAY = 500;
    this.isRestoring = false;
    this.hasUnsavedChanges = false;
    this.isSaved = false;
  }

  // Get cached design from memory
  loadCache() {
    if (this.memoryCache) {
      console.log("✅ Loaded cached design from memory");
      return this.memoryCache;
    }
    return null;
  }

  // Save design to memory only
  saveCache(designData) {
    if (this.isRestoring) return;

    clearTimeout(this.saveTimer);

    this.saveTimer = setTimeout(() => {
      this.memoryCache = {
        color: designData.color,
        logoDecal: designData.logoDecal,
        fullDecal: designData.fullDecal,
        isLogoTexture: designData.isLogoTexture,
        isFullTexture: designData.isFullTexture,
        shirtType: designData.shirtType,
        logo: designData.logo,
        timestamp: Date.now(),
      };

      // Mark as unsaved
      this.hasUnsavedChanges = true;
      this.isSaved = false;

      console.log("💾 Cached to memory");
    }, this.SAVE_DELAY);
  }

  // Restore cached design to Valtio state
  restoreToState() {
    const cached = this.loadCache();
    if (!cached) return false;

    this.isRestoring = true;

    try {
      if (cached.color) state.color = cached.color;
      if (cached.logoDecal) state.logoDecal = cached.logoDecal;
      if (cached.fullDecal) state.fullDecal = cached.fullDecal;
      if (cached.shirtType) state.shirtType = cached.shirtType;
      if (cached.logo) state.logo = cached.logo;

      state.isLogoTexture = cached.isLogoTexture ?? false;
      state.isFullTexture = cached.isFullTexture ?? false;

      console.log("🔄 Restored design from memory");
      return true;
    } catch (error) {
      console.error("❌ Error restoring cache:", error);
      return false;
    } finally {
      setTimeout(() => {
        this.isRestoring = false;
      }, 100);
    }
  }

  // Clear cache
  clearCache() {
    this.memoryCache = null;
    this.hasUnsavedChanges = false;
    this.isSaved = false;
    console.log("🗑️ Cleared memory cache");
  }

  // Mark design as saved
  markAsSaved() {
    this.isSaved = true;
    this.hasUnsavedChanges = false;
    console.log("✅ Design marked as saved");
  }

  // Check if there are unsaved changes
  checkUnsavedChanges() {
    return this.memoryCache !== null && !this.isSaved;
  }

  // Start watching Valtio state for changes
  startAutoSave() {
    const unsubscribe = subscribe(state, () => {
      const designData = {
        color: state.color,
        logoDecal: state.logoDecal,
        fullDecal: state.fullDecal,
        isLogoTexture: state.isLogoTexture,
        isFullTexture: state.isFullTexture,
        shirtType: state.shirtType,
        logo: state.logo,
      };

      this.saveCache(designData);
    });

    console.log("👀 Auto-save enabled (memory only)");
    return unsubscribe;
  }

  // Setup beforeunload warning
  setupUnloadWarning() {
    const handleBeforeUnload = (e) => {
      if (this.checkUnsavedChanges()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved designs. They will be lost if you leave without saving.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }
}

// Singleton instance
export const shirtCache = new ShirtCacheManager();

// Export utility functions
export const setupShirtCache = () => {
  const unsubscribeAutoSave = shirtCache.startAutoSave();
  const unsubscribeWarning = shirtCache.setupUnloadWarning();

  return () => {
    if (unsubscribeAutoSave) unsubscribeAutoSave();
    if (unsubscribeWarning) unsubscribeWarning();
  };
};

export const restoreCachedShirt = () => shirtCache.restoreToState();
export const clearShirtCache = () => shirtCache.clearCache();
export const markDesignAsSaved = () => shirtCache.markAsSaved();
export const hasCachedShirt = () => shirtCache.loadCache() !== null;
export const hasUnsavedChanges = () => shirtCache.checkUnsavedChanges();
