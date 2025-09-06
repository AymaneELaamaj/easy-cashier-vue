// src/config/posFlags.ts
// Petits “feature flags” pour le POS (pilotables via variables d’environnement Vite).

// Helpers ---------------------------------------------------------------
const toBool = (v: unknown, def = false): boolean => {
    if (v === undefined || v === null) return def;
    const s = String(v).trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on'].includes(s);
  };
  
  const toInt = (v: unknown, def = 0): number => {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : def;
  };
  
  const env = import.meta.env;
  
  // Types -----------------------------------------------------------------
  export interface PosFlags {
    /** Valider automatiquement l’achat juste après la validation du badge */
    autoValidateAfterBadge: boolean;
    /** Exiger que l’API soit en ligne pour auto-valider (sinon laisser passer en offline) */
    requireOnlineForAutoValidate: boolean;
    /** Montant minimum du panier pour déclencher l’auto-validation (0 = pas de seuil) */
    minCartTotalForAutoValidate: number;
    /** Délai (ms) avant de lancer l’auto-validation */
    autoValidateDelayMs: number;
    /** Sécurité : si userOverride ≠ currentUser, bloquer l’auto-validation */
    guardUserMismatch: boolean;
    /** Masquer le bouton “Valider l’achat” quand l’auto-validation est active */
    hideManualValidateButton: boolean;
  
    /** Imprimer automatiquement le ticket après succès de la transaction */
    autoPrintTicket: boolean;
    /** Délai (ms) avant l’impression auto (laisse le DOM respirer) */
    printDelayMs: number;
  }
  
  // Flags (avec valeurs par défaut) --------------------------------------
  const POS_FLAGS: PosFlags = {
    autoValidateAfterBadge: toBool(env.VITE_POS_AUTO_VALIDATE, true),
    requireOnlineForAutoValidate: toBool(env.VITE_POS_REQUIRE_ONLINE, false),
    minCartTotalForAutoValidate: toInt(env.VITE_POS_AUTO_VALIDATE_MIN_TOTAL, 0),
    autoValidateDelayMs: toInt(env.VITE_POS_AUTO_VALIDATE_DELAY_MS, 250),
    guardUserMismatch: toBool(env.VITE_POS_GUARD_USER_MISMATCH, true),
    hideManualValidateButton: toBool(env.VITE_POS_HIDE_MANUAL_BUTTON, true),
  
    autoPrintTicket: toBool(env.VITE_POS_AUTO_PRINT_TICKET, true),
    printDelayMs: toInt(env.VITE_POS_PRINT_DELAY_MS, 150),
  };
  
  export default POS_FLAGS;
  