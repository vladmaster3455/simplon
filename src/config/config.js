


// src/config/config.js
// Configuration centralisée de l'application

/**
 * Fonction helper pour extraire l'URL de base sans le path /serge
 * Gère les cas: localhost, Render, Vercel, etc.
 * 
 * @param {string} apiUrl - URL complète de l'API (ex: https://minibank-api.onrender.com/serge)
 * @returns {string} URL de base sans path (ex: https://minibank-api.onrender.com)
 */
const getAssetsUrl = (apiUrl) => {
  // Si pas d'URL fournie, utiliser localhost par défaut
  if (!apiUrl) {
    return 'http://localhost:5000';
  }
  
  try {
    // Utiliser l'API URL pour parser correctement l'URL
    const url = new URL(apiUrl);
    // Retourne l'origine (protocol + host + port) sans le pathname
    return url.origin;
  } catch (error) {
    // Fallback si l'URL n'est pas valide
    console.warn('URL invalide dans REACT_APP_API_URL:', apiUrl);
    // Essayer de nettoyer manuellement
    return apiUrl.replace('/serge', '').replace(/\/+$/, '');
  }
};

/**
 * Configuration des URLs de l'API
 */
export const API_CONFIG = {

  
  // URL pour les assets statiques (images, fichiers) - sans /serge
  ASSETS_URL: getAssetsUrl(process.env.REACT_APP_API_URL),
  
  // Timeout pour les requêtes HTTP (en millisecondes)
  TIMEOUT: parseInt(process.env.REACT_APP_TIMEOUT, 10) || 30000,
  
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 seconde
};

/**
 * Configuration générale de l'application
 */
export const APP_CONFIG = {
  // Mot de passe par défaut lors de la création d'utilisateurs
  DEFAULT_PASSWORD: 'passer',
  
  // Contraintes de validation
  MIN_PASSWORD_LENGTH: 6,
  MIN_PHONE_LENGTH: 9,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Configuration de la pagination
  PAGINATION: {
    DEFAULT_ROWS_PER_PAGE: 10,
    ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50, 100]
  },
  
  // Gestion de l'inactivité
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  SHOW_IDLE_MESSAGE: true,
  
  // Formats de fichiers autorisés
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  
  // Messages
  DEFAULT_ERROR_MESSAGE: 'Une erreur est survenue. Veuillez réessayer.',
  DEFAULT_SUCCESS_MESSAGE: 'Opération réussie',
  
  // Durée d'affichage des notifications (en millisecondes)
  NOTIFICATION_DURATION: 5000,
};

/**
 * Types d'utilisateurs dans le système
 */
export const USER_TYPES = {
  AGENT: 'Agent',
  CLIENT: 'Client',
  DISTRIBUTEUR: 'Distributeur'
};

/**
 * Rôles et permissions
 */
export const USER_ROLES = {
  AGENT: {
    label: 'Agent',
    permissions: ['manage_users', 'view_all_transactions', 'manage_transactions', 'view_statistics']
  },
  CLIENT: {
    label: 'Client',
    permissions: ['view_own_transactions', 'make_deposits', 'make_withdrawals']
  },
  DISTRIBUTEUR: {
    label: 'Distributeur',
    permissions: ['view_own_transactions', 'make_transfers', 'cancel_transactions']
  }
};

/**
 * Types de transactions
 */
export const TRANSACTION_TYPES = {
  DEPOT: 'Depot',
  RETRAIT: 'Retrait',
  TRANSFERT: 'Transfert'
};

/**
 * Libellés des types de transactions
 */
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.DEPOT]: 'Dépôt',
  [TRANSACTION_TYPES.RETRAIT]: 'Retrait',
  [TRANSACTION_TYPES.TRANSFERT]: 'Transfert'
};

/**
 * Statuts des transactions
 */
export const TRANSACTION_STATUS = {
  VALIDEE: 'Validee',
  EN_ATTENTE: 'En_attente',
  ANNULEE: 'Annulee'
};

/**
 * Libellés des statuts de transaction
 */
export const TRANSACTION_STATUS_LABELS = {
  [TRANSACTION_STATUS.VALIDEE]: 'Validée',
  [TRANSACTION_STATUS.EN_ATTENTE]: 'En attente',
  [TRANSACTION_STATUS.ANNULEE]: 'Annulée'
};

/**
 * Couleurs des statuts de transaction
 */
export const TRANSACTION_STATUS_COLORS = {
  [TRANSACTION_STATUS.VALIDEE]: 'success',
  [TRANSACTION_STATUS.EN_ATTENTE]: 'warning',
  [TRANSACTION_STATUS.ANNULEE]: 'error'
};

/**
 * Statuts des comptes utilisateur
 */
export const ACCOUNT_STATUS = {
  ACTIF: 'Actif',
  BLOQUE: 'Bloqué',
  ARCHIVE: 'Archivé'
};

/**
 * Libellés des statuts de compte
 */
export const ACCOUNT_STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIF]: 'Actif',
  [ACCOUNT_STATUS.BLOQUE]: 'Bloqué',
  [ACCOUNT_STATUS.ARCHIVE]: 'Archivé'
};

/**
 * Couleurs des statuts de compte
 */
export const ACCOUNT_STATUS_COLORS = {
  [ACCOUNT_STATUS.ACTIF]: 'success',
  [ACCOUNT_STATUS.BLOQUE]: 'error',
  [ACCOUNT_STATUS.ARCHIVE]: 'default'
};

/**
 * Limites de transaction par défaut
 */
export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 1000000,
  MAX_DAILY_AMOUNT: 5000000
};

/**
 * Configuration des dates
 */
export const DATE_CONFIG = {
  DEFAULT_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  TIME_FORMAT: 'HH:mm:ss',
  API_DATE_FORMAT: 'YYYY-MM-DD'
};

/**
 * Messages de validation
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_EMAIL: 'Format d\'email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${APP_CONFIG.MIN_PASSWORD_LENGTH} caractères`,
  PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas',
  INVALID_AMOUNT: 'Montant invalide',
  AMOUNT_TOO_LOW: `Le montant minimum est de ${TRANSACTION_LIMITS.MIN_AMOUNT} FCFA`,
  AMOUNT_TOO_HIGH: `Le montant maximum est de ${TRANSACTION_LIMITS.MAX_AMOUNT} FCFA`,
  FILE_TOO_LARGE: 'Le fichier est trop volumineux (max 5MB)',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé'
};

/**
 * Routes de l'application
 */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  PROFILE: '/profile',
  DEPOT: '/depot',
  RETRAIT: '/retrait',
  TRANSFERT: '/transfert',
  ANNULER: '/annuler',
  HISTORIQUE: '/historique'
};

/**
 * Configuration du localStorage
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};

/**
 * Export par défaut de toutes les configurations
 */
const config = {
  API_CONFIG,
  APP_CONFIG,
  USER_TYPES,
  USER_ROLES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
  TRANSACTION_LIMITS,
  DATE_CONFIG,
  VALIDATION_MESSAGES,
  ROUTES,
  STORAGE_KEYS
};

export default config;

// Log de la configuration au démarrage (uniquement en développement)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuration loaded:');
  console.log('   API Base URL:', API_CONFIG.BASE_URL);
  console.log('   Assets URL:', API_CONFIG.ASSETS_URL);
  console.log('   Environment:', process.env.NODE_ENV);
}