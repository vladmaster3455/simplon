// src/config/api.js - VERSION CORRIGÉE
import { API_CONFIG } from './config';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper pour les requêtes avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Helper pour gérer les erreurs
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(error.message || error.error || 'Erreur réseau');
  }
  return response.json();
};

// API Authentication et photo de profil
export const authAPI = {
  login: async (email, motDePasse) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse })
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateProfile: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  },

  updateProfilePhoto: async (photoFile) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await fetch(`${API_BASE_URL}/auth/profile/photo`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  },

  deleteProfilePhoto: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile/photo`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// API Utilisateurs
export const usersAPI = {
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getClients: async () => {
    const response = await fetch(`${API_BASE_URL}/users/clients`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getDistributeurs: async () => {
    const response = await fetch(`${API_BASE_URL}/users/distributeurs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUserById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createClient: async (clientData) => {
    const response = await fetch(`${API_BASE_URL}/users/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData)
    });
    return handleResponse(response);
  },

  createDistributeur: async (distributeurData) => {
    const response = await fetch(`${API_BASE_URL}/users/distributeurs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(distributeurData)
    });
    return handleResponse(response);
  },

  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  toggleUserStatus: async (userId, estActif) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estActif })
    });
    return handleResponse(response);
  },

  archiveUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  archiveMultiple: async (userIds) => {
    const response = await fetch(`${API_BASE_URL}/users/bulk`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds })
    });
    return handleResponse(response);
  },

  getArchivedUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/deleted/list`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  restoreUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  restoreMultiple: async (userIds) => {
    const response = await fetch(`${API_BASE_URL}/users/bulk/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds })
    });
    return handleResponse(response);
  },

  permanentDelete: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/permanent`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirmation: 'SUPPRIMER_DEFINITIVEMENT' })
    });
    return handleResponse(response);
  },

  blockMultiple: async (userIds, estActif) => {
    const response = await fetch(`${API_BASE_URL}/users/bulk/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds, estActif })
    });
    return handleResponse(response);
  },

  crediterCompte: async (userId, montant) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/credit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ montant })
    });
    return handleResponse(response);
  }
};

// API Transactions
export const transactionsAPI = {
  // Dépôt
  depot: async (montant, numeroCompte_destination) => {
    const response = await fetch(`${API_BASE_URL}/transactions/depot`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ montant, numeroCompte_destination })
    });
    return handleResponse(response);
  },

  // Retrait
  retrait: async (montant, numeroCompte_source) => {
    const response = await fetch(`${API_BASE_URL}/transactions/retrait`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ montant, numeroCompte_source })
    });
    return handleResponse(response);
  },

  // Transfert
  transfert: async (montant, numeroCompte_destination, telephone_destinataire) => {
    const response = await fetch(`${API_BASE_URL}/transactions/transfert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ montant, numeroCompte_destination, telephone_destinataire })
    });
    return handleResponse(response);
  },

  // Vérifier téléphone
  verifierTelephone: async (telephone) => {
    const response = await fetch(`${API_BASE_URL}/transactions/verifier-telephone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ telephone })
    });
    return handleResponse(response);
  },

  // Historique
  getHistorique: async (limit = 50, page = 1) => {
    const response = await fetch(`${API_BASE_URL}/transactions/historique?limit=${limit}&page=${page}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Détails transaction - CORRIGÉ: ajout de await
  getTransaction: async (numeroTransaction) => {
    const response = await fetch(`${API_BASE_URL}/transactions/transaction/${numeroTransaction}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Annuler transaction - CORRIGÉ: ajout de await
  annulerTransaction: async (numeroTransaction, raison) => {
    const response = await fetch(`${API_BASE_URL}/transactions/annuler/${numeroTransaction}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ raison })
    });
    return handleResponse(response);
  },

  // Consulter solde
  getSolde: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions/solde`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Statistiques (Agent uniquement)
  getStatistiques: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions/statistiques`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Transactions annulables (Distributeur)
  getTransactionsAnnulables: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions/annulables`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

const api = {
  authAPI,
  usersAPI,
  transactionsAPI
};

export default api;