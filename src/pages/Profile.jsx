import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { authAPI } from '../config/api';
import { API_CONFIG } from '../config/config';

// ✅ URL de base dynamique depuis la config
const API_BASE_URL = API_CONFIG.ASSETS_URL;

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [photoUrl, setPhotoUrl] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    adresse: '',
    dateNaissance: '',
    motDePasse: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await authAPI.getProfile();
      const userData = data.user;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        email: userData.email || '',
        tel: userData.tel || '',
        adresse: userData.adresse || '',
        dateNaissance: userData.dateNaissance 
          ? new Date(userData.dateNaissance).toISOString().split('T')[0] 
          : '',
        motDePasse: ''
      });

      // ✅ AMÉLIORATION : Ajouter un timestamp pour forcer le rechargement
      if (userData.photo) {
        const timestamp = new Date().getTime();
        setPhotoUrl(`${API_BASE_URL}${userData.photo}?t=${timestamp}`);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Erreur fetchProfile:', err);
      setMessage({ 
        text: err.message || 'Erreur lors du chargement du profil', 
        type: 'error' 
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tel') {
      const cleaned = value.replace(/[^\d\s\-+()]/g, '');
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === 'email') {
      setFormData({ ...formData, [name]: value.toLowerCase().trim() });
    } else if (name === 'nom' || name === 'prenom') {
      setFormData({ ...formData, [name]: value.charAt(0).toUpperCase() + value.slice(1) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    setMessage({ text: '', type: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📷 Fichier sélectionné:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'La photo ne doit pas dépasser 5MB', type: 'error' });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: 'Seules les images (JPEG, JPG, PNG, GIF, WEBP) sont autorisées', type: 'error' });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage({ text: '', type: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email) {
      setMessage({ text: 'Le nom, prénom et email sont obligatoires', type: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ text: 'Format d\'email invalide', type: 'error' });
      return;
    }

    if (formData.tel) {
      const phoneDigits = formData.tel.replace(/\D/g, '');
      if (phoneDigits.length < 9) {
        setMessage({ text: 'Le numéro de téléphone doit contenir au moins 9 chiffres', type: 'error' });
        return;
      }
    }

    if (formData.motDePasse && formData.motDePasse.length > 0 && formData.motDePasse.length < 6) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 6 caractères', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // ✅ Ajout de logs pour debug
      console.log('📤 Envoi du formulaire avec:', {
        hasPhoto: !!selectedFile,
        photoName: selectedFile?.name,
        fields: Object.keys(formData)
      });

      Object.keys(formData).forEach(key => {
        if (formData[key] && key !== 'motDePasse') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (formData.motDePasse && formData.motDePasse.length > 0) {
        formDataToSend.append('motDePasse', formData.motDePasse);
      }

      if (selectedFile) {
        formDataToSend.append('photo', selectedFile);
        console.log('📷 Photo ajoutée au FormData');
      }

      const data = await authAPI.updateProfile(formDataToSend);
      console.log('✅ Réponse serveur:', data);
      
      const updatedUser = data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // ✅ Forcer le rechargement de l'image avec timestamp
      if (updatedUser.photo) {
        const timestamp = new Date().getTime();
        const newPhotoUrl = `${API_BASE_URL}${updatedUser.photo}?t=${timestamp}`;
        console.log('🖼️ Nouvelle URL photo:', newPhotoUrl);
        setPhotoUrl(newPhotoUrl);
      }

      setSelectedFile(null);
      setPreviewUrl(null);
      setFormData(prev => ({ ...prev, motDePasse: '' }));

      setMessage({ 
        text: 'Profil mis à jour avec succès', 
        type: 'success' 
      });

      // ✅ Recharger le profil après 500ms
      setTimeout(() => {
        fetchProfile();
      }, 500);

    } catch (err) {
      console.error('❌ Erreur updateProfile:', err);
      setMessage({ 
        text: err.message || 'Erreur lors de la mise à jour', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      return;
    }

    setLoadingPhoto(true);

    try {
      await authAPI.deleteProfilePhoto();

      const updatedUser = { ...user, photo: undefined };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);

      setMessage({ 
        text: 'Photo supprimée avec succès', 
        type: 'success' 
      });

    } catch (err) {
      console.error('❌ Erreur deletePhoto:', err);
      setMessage({ 
        text: err.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    } finally {
      setLoadingPhoto(false);
    }
  };

  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Profil
      </Typography>

      <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Card elevation={2} sx={{ mb: 4, bgcolor: 'background.default' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Photo de profil
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center', 
              gap: 3 
            }}>
              <Avatar 
                src={previewUrl || photoUrl}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'primary.main', 
                  fontSize: 48,
                  border: '4px solid',
                  borderColor: 'primary.light'
                }}
              >
                {!photoUrl && !previewUrl && `${formData.prenom?.[0] || ''}${formData.nom?.[0] || ''}`}
              </Avatar>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="photo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    disabled={loading || loadingPhoto}
                  >
                    {selectedFile ? 'Changer la photo' : 'Ajouter une photo'}
                  </Button>
                </label>

                {(photoUrl || previewUrl) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={loadingPhoto ? <CircularProgress size={20} /> : <DeleteIcon />}
                    onClick={handleDeletePhoto}
                    disabled={loading || loadingPhoto}
                  >
                    Supprimer la photo
                  </Button>
                )}

                {selectedFile && (
                  <Typography variant="caption" color="text.secondary">
                    Nouvelle photo sélectionnée: {selectedFile.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Informations personnelles
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom *"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom *"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                name="tel"
                value={formData.tel}
                onChange={handleChange}
                disabled={loading}
              />
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
                disabled={loading}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
          </Button>
        </form>

        {message.text && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default Profile;