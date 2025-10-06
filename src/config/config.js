// src/config/config.js
// Configuration centralisée de l'application

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/serge',
  
  // URL pour les assets (images, fichiers) - sans /serge
  ASSETS_URL: process.env.REACT_APP_API_URL 
    ? process.env.REACT_APP_API_URL.replace('/serge', '')
    : 'http://localhost:5000',
  
  TIMEOUT: parseInt(process.env.REACT_APP_TIMEOUT) || 30000
};

export const APP_CONFIG = {
  DEFAULT_PASSWORD: 'passer',
  MIN_PASSWORD_LENGTH: 6,
  MIN_PHONE_LENGTH: 9,
  PAGINATION: {
    DEFAULT_ROWS_PER_PAGE: 10,
    ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50, 100]
  },
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  SHOW_IDLE_MESSAGE: true,
};

export const USER_TYPES = {
  AGENT: 'Agent',
  CLIENT: 'Client',
  DISTRIBUTEUR: 'Distributeur'
};

export const TRANSACTION_TYPES = {
  DEPOT: 'Depot',
  RETRAIT: 'Retrait',
  TRANSFERT: 'Transfert'
};

export const TRANSACTION_STATUS = {
  VALIDEE: 'Validee',
  EN_ATTENTE: 'En_attente',
  ANNULEE: 'Annulee'
};

export const ACCOUNT_STATUS = {
  ACTIF: 'Actif',
  BLOQUE: 'Bloqué'
};

const config = {
  API_CONFIG,
  APP_CONFIG,
  USER_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  ACCOUNT_STATUS
};

export default config;