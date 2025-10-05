import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import { APP_CONFIG } from '../../config/config';

function CreateUserDialog({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    adresse: '',
    type: 'Client',
    dateNaissance: '',
    NcarteIdentite: '',
    motDePasse: APP_CONFIG.DEFAULT_PASSWORD // CORRIGÉ: utilise 'passer'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation en temps réel pour certains champs
    if (name === 'tel') {
      // Accepter uniquement les chiffres et certains caractères
      const cleaned = value.replace(/[^\d\s\-+()]/g, '');
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === 'email') {
      // Convertir en minuscules et supprimer les espaces
      setFormData({ ...formData, [name]: value.toLowerCase().trim() });
    } else if (name === 'nom' || name === 'prenom') {
      // Première lettre en majuscule
      setFormData({ ...formData, [name]: value.charAt(0).toUpperCase() + value.slice(1) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    setError('');
  };

  const handleSubmit = () => {
    // Validation des champs obligatoires
    if (!formData.nom || !formData.prenom || !formData.email) {
      setError('Le nom, prénom et email sont obligatoires');
      return;
    }

    if (!formData.NcarteIdentite || formData.NcarteIdentite.trim() === '') {
      setError('Le numéro de carte d\'identité est obligatoire');
      return;
    }

    if (!formData.dateNaissance) {
      setError('La date de naissance est obligatoire');
      return;
    }

    if (!formData.tel || formData.tel.trim() === '') {
      setError('Le numéro de téléphone est obligatoire');
      return;
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format d\'email Invalide');
      return;
    }

    // Validation téléphone (au moins 9 chiffres)
    const phoneDigits = formData.tel.replace(/\D/g, '');
    if (phoneDigits.length < APP_CONFIG.MIN_PHONE_LENGTH) {
      setError(`Le numéro de téléphone doit contenir au moins ${APP_CONFIG.MIN_PHONE_LENGTH} chiffres`);
      return;
    }

    // Validation carte d'identité (au moins 5 caractères)
    if (formData.NcarteIdentite.trim().length < 5) {
      setError('Le numéro de carte d\'identité doit contenir au moins 5 caractères');
      return;
    }

    // Validation date de naissance (pas dans le futur)
    const birthDate = new Date(formData.dateNaissance);
    const today = new Date();
    if (birthDate > today) {
      setError('La date de naissance ne peut pas être dans le futur');
      return;
    }

    // Validation âge minimum (au moins 18 ans)
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      setError('L\'utilisateur doit avoir au moins 18 ans');
      return;
    }

    onCreate(formData);
    
    // Réinitialiser le formulaire
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      tel: '',
      adresse: '',
      type: 'Client',
      dateNaissance: '',
      NcarteIdentite: '',
      motDePasse: APP_CONFIG.DEFAULT_PASSWORD
    });
    setError('');
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      tel: '',
      adresse: '',
      type: 'Client',
      dateNaissance: '',
      NcarteIdentite: '',
      motDePasse: APP_CONFIG.DEFAULT_PASSWORD
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>Créer un nouveau compte</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nom *"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prénom *"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Numéro Carte d'Identité *"
              name="NcarteIdentite"
              value={formData.NcarteIdentite}
              onChange={handleChange}
              placeholder="Ex: CNI2025001"
              helperText="Au moins 5 caractères"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Téléphone *"
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              placeholder="Ex: 771234567"
              helperText="Au moins 9 chiffres"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date de naissance *"
              name="dateNaissance"
              type="date"
              value={formData.dateNaissance}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              helperText="Minimum 18 ans"
              inputProps={{
                max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Type de compte *"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <MenuItem value="Client">Client</MenuItem>
              <MenuItem value="Distributeur">Distributeur</MenuItem>
              <MenuItem value="Agent">Agent</MenuItem>
            </TextField>
          </Grid>

        

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Créer le compte
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateUserDialog;