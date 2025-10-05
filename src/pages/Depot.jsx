import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip
} from '@mui/material';
import { usersAPI } from '../config/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

function Depot() {
  const [formData, setFormData] = useState({
    numeroCompte: '',
    montant: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [selectedMontant, setSelectedMontant] = useState(null);

  // Montants prédéfinis
  const montantsRapides = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

  // Vérifier le compte en temps réel
  const handleNumeroCompteChange = async (value) => {
    setFormData({
      ...formData,
      numeroCompte: value
    });
    setMessage({ text: '', type: '' });
    setFoundUser(null);

    if (value.length >= 5) {
      setVerifying(true);
      try {
        const response = await usersAPI.getAllUsers();
        const users = response.users || [];
        const user = users.find(u => 
          u.comptes && u.comptes[0]?.numeroCompte === value
        );
        
        if (user) {
          setFoundUser(user);
          
          // Message selon le type
          if (user.typeUtilisateur !== 'Distributeur') {
            setMessage({
              text: `⚠️ Ce compte est un ${user.typeUtilisateur}. Seuls les Distributeurs peuvent être crédités par un Agent.`,
              type: 'warning'
            });
          } else if (!user.estActif) {
            setMessage({
              text: '❌ Ce compte est bloqué',
              type: 'error'
            });
          }
        } else {
          setMessage({
            text: 'Aucun compte trouvé avec ce numéro',
            type: 'error'
          });
        }
      } catch (err) {
        console.log('Erreur vérification:', err);
        setMessage({
          text: 'Erreur lors de la vérification du compte',
          type: 'error'
        });
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'numeroCompte') {
      handleNumeroCompteChange(value);
    } else if (name === 'montant') {
      setFormData({
        ...formData,
        [name]: value
      });
      setSelectedMontant(null); // Désélectionner les boutons rapides
      setMessage({ text: '', type: '' });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      setMessage({ text: '', type: '' });
    }
  };

  // Sélectionner un montant rapide
  const handleMontantRapide = (montant) => {
    setFormData({
      ...formData,
      montant: montant.toString()
    });
    setSelectedMontant(montant);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numeroCompte || !formData.montant) {
      setMessage({ text: '❌ Tous les champs sont requis', type: 'error' });
      return;
    }

    if (parseFloat(formData.montant) < 100) {
      setMessage({ text: '❌ Montant minimum : 100 FCFA', type: 'error' });
      return;
    }

    if (!foundUser) {
      setMessage({ text: '❌ Numéro de compte introuvable', type: 'error' });
      return;
    }

    // ⚠️ RESTRICTION : Accepter UNIQUEMENT les Distributeurs
    if (foundUser.typeUtilisateur !== 'Distributeur') {
      setMessage({ 
        text: `❌ Impossible de créditer un ${foundUser.typeUtilisateur}. Seuls les Distributeurs peuvent être crédités par un Agent.`, 
        type: 'error' 
      });
      return;
    }

    if (!foundUser.estActif) {
      setMessage({ text: '❌ Ce compte est bloqué', type: 'error' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await usersAPI.crediterCompte(foundUser._id, parseFloat(formData.montant));

      setMessage({ 
        text: `✅ Crédit de ${formData.montant} FCFA effectué avec succès pour le Distributeur ${foundUser.prenom} ${foundUser.nom}. Transaction: ${response.transaction.numeroTransaction}`, 
        type: 'success' 
      });
      
      // Réinitialiser le formulaire
      setFormData({ numeroCompte: '', montant: '' });
      setFoundUser(null);
      setSelectedMontant(null);
    } catch (err) {
      setMessage({ 
        text: err.message || 'Erreur lors du crédit. Vérifiez que la route /users/:id/credit existe dans l\'API backend.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = foundUser && 
                    foundUser.typeUtilisateur === 'Distributeur' && 
                    foundUser.estActif && 
                    !loading && 
                    !verifying &&
                    formData.montant >= 100;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Créditer un Distributeur
      </Typography>

      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Créditer un compte Distributeur
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Numéro de compte Distributeur"
                name="numeroCompte"
                value={formData.numeroCompte}
                onChange={handleChange}
                placeholder="DIS123456..."
                disabled={loading}
              />
              
              {verifying && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Vérification en cours...</Typography>
                </Box>
              )}

              {foundUser && !verifying && (
                <Card sx={{ 
                  mt: 2, 
                  bgcolor: foundUser.typeUtilisateur === 'Distributeur' && foundUser.estActif
                    ? 'success.light' 
                    : 'error.light',
                  color: foundUser.typeUtilisateur === 'Distributeur' && foundUser.estActif
                    ? 'success.contrastText'
                    : 'error.contrastText'
                }}>
                  <CardContent sx={{ py: 2 }}>
                    {foundUser.typeUtilisateur === 'Distributeur' && foundUser.estActif ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircleIcon sx={{ mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Distributeur trouvé
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          <strong>Nom :</strong> {foundUser.prenom} {foundUser.nom}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email :</strong> {foundUser.email}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Solde actuel :</strong> {foundUser.comptes[0].solde.toLocaleString()} FCFA
                        </Typography>
                        <Chip 
                          label="Distributeur" 
                          color="warning" 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <ErrorIcon sx={{ mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Compte non autorisé
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Ce compte est un <strong>{foundUser.typeUtilisateur}</strong>
                          {!foundUser.estActif && ' et est bloqué'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                          Seuls les Distributeurs actifs peuvent être crédités
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Montants rapides :
              </Typography>
              <Grid container spacing={1}>
                {montantsRapides.map((montant) => (
                  <Grid item xs={6} sm={3} key={montant}>
                    <Button
                      fullWidth
                      variant={selectedMontant === montant ? 'contained' : 'outlined'}
                      color={selectedMontant === montant ? 'primary' : 'inherit'}
                      onClick={() => handleMontantRapide(montant)}
                      disabled={loading}
                      sx={{ 
                        py: 1.5,
                        fontSize: '0.9rem',
                        fontWeight: selectedMontant === montant ? 'bold' : 'normal'
                      }}
                    >
                      {montant.toLocaleString()}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant (FCFA)"
                name="montant"
                type="number"
                value={formData.montant}
                onChange={handleChange}
                inputProps={{ min: 100, step: 100 }}
                helperText="Montant minimum : 100 FCFA ou choisissez un montant rapide ci-dessus"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                    Traitement en cours...
                  </>
                ) : (
                  'Créditer le Distributeur'
                )}
              </Button>
            </Grid>
          </Grid>
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

export default Depot;