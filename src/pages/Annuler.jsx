import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import { transactionsAPI } from '../config/api';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

function Annuler() {
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAgent = user.typeUtilisateur === 'Agent';
  const isDistributeur = user.typeUtilisateur === 'Distributeur';

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [numeroTransaction, setNumeroTransaction] = useState('');
  const [foundTransaction, setFoundTransaction] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [raison, setRaison] = useState('');

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoadingList(true);
      
      if (isDistributeur) {
        const response = await transactionsAPI.getTransactionsAnnulables();
        setTransactions(response.transactions || []);
      } else if (isAgent) {
        // Agent : Récupérer TOUTES les transactions avec propriétaire
        const response = await transactionsAPI.getHistorique(200, 1);
        const transactionsNonAnnulees = (response.transactions || []).filter(
          t => t.statut === 'Validee' && !t.annulation?.estAnnulee
        );
        setTransactions(transactionsNonAnnulees);
      }
    } catch (err) {
      console.error('Erreur chargement transactions:', err);
      setMessage({ 
        text: 'Erreur lors du chargement des transactions', 
        type: 'error' 
      });
    } finally {
      setLoadingList(false);
    }
  };

  const handleSearch = async () => {
    if (!numeroTransaction) {
      setMessage({ text: 'Veuillez saisir un numéro de transaction', type: 'error' });
      return;
    }

    setLoading(true);
    setFoundTransaction(null);
    
    try {
      const response = await transactionsAPI.getTransaction(numeroTransaction);
      const transaction = response.transaction;
      
      if (transaction) {
        if (transaction.annulation?.estAnnulee) {
          setMessage({ 
            text: 'Cette transaction est déjà annulée', 
            type: 'error' 
          });
          setFoundTransaction(transaction);
        } else if (transaction.statut === 'Validee') {
          if (isDistributeur && 
              !['Depot', 'Retrait'].includes(transaction.typeTransaction)) {
            setMessage({ 
              text: 'Vous ne pouvez annuler que vos dépôts et retraits', 
              type: 'error' 
            });
          } else {
            setFoundTransaction(transaction);
            setMessage({ text: '', type: '' });
          }
        } else {
          setMessage({ 
            text: `Transaction non annulable (statut: ${transaction.statut})`, 
            type: 'warning' 
          });
          setFoundTransaction(transaction);
        }
      }
    } catch (err) {
      setMessage({ 
        text: err.message || 'Transaction non trouvée', 
        type: 'error' 
      });
      setFoundTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setRaison('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRaison('');
  };

  const handleAnnuler = async () => {
    if (!foundTransaction) return;

    setLoading(true);
    
    try {
      await transactionsAPI.annulerTransaction(
        foundTransaction.numeroTransaction, 
        raison || 'Annulation demandée'
      );

      setMessage({ 
        text: `Transaction ${foundTransaction.numeroTransaction} annulée avec succès`, 
        type: 'success' 
      });
      
      // Actualiser la liste des transactions
      await fetchTransactions();
      setFoundTransaction(null);
      setNumeroTransaction('');
      handleCloseDialog();
      
    } catch (err) {
      setMessage({ 
        text: err.message || 'Erreur lors de l\'annulation', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper pour afficher l'icône du type d'utilisateur
  const getUserTypeIcon = (type) => {
    switch(type) {
      case 'Client': return <PersonIcon fontSize="small" />;
      case 'Distributeur': return <StoreIcon fontSize="small" />;
      case 'Agent': return <AdminPanelSettingsIcon fontSize="small" />;
      default: return null;
    }
  };

  // Helper pour la couleur du type d'utilisateur
  const getUserTypeColor = (type) => {
    switch(type) {
      case 'Client': return 'primary';
      case 'Distributeur': return 'warning';
      case 'Agent': return 'secondary';
      default: return 'default';
    }
  };

  const canCancel = foundTransaction && 
                    foundTransaction.statut === 'Validee' && 
                    !foundTransaction.annulation?.estAnnulee &&
                    (isAgent || 
                     (isDistributeur && ['Depot', 'Retrait'].includes(foundTransaction.typeTransaction)));

  if (!isAgent && !isDistributeur) {
    return (
      <Box>
        <Alert severity="warning">
          Seuls les Agents et Distributeurs peuvent annuler des transactions.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Annuler une Transaction
      </Typography>

      

      {/* Liste des transactions annulables */}
      {loadingList ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
         
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow 
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.100'
                  }}
                >
                  <TableCell><strong>Numéro</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell align="right"><strong>Montant</strong></TableCell>
                  {isAgent && <TableCell><strong>Propriétaire</strong></TableCell>}
                  {isAgent && <TableCell><strong>Acteurs</strong></TableCell>}
                  <TableCell><strong>Statut</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAgent ? 7 : 5} align="center" sx={{ py: 3 }}>
                      Aucune transaction annulable
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 15).map((t) => (
                    <TableRow 
                      key={t.numeroTransaction} 
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setNumeroTransaction(t.numeroTransaction);
                        setFoundTransaction(t);
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {t.numeroTransaction}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {new Date(t.dateTransaction).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={t.typeTransaction} 
                          size="small"
                          color={
                            t.typeTransaction === 'Transfert' ? 'primary' :
                            t.typeTransaction === 'Depot' ? 'success' : 'info'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {t.montant.toLocaleString()} FCFA
                        </Typography>
                      </TableCell>
                      
                      {/* NOUVELLE COLONNE : Propriétaire (Agent uniquement) */}
                      {isAgent && (
                        <TableCell>
                          {t.proprietaire ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getUserTypeIcon(t.proprietaire.type)}
                              <Tooltip title={t.proprietaire.email}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {t.proprietaire.prenom} {t.proprietaire.nom}
                                </Typography>
                              </Tooltip>
                              <Chip 
                                label={t.proprietaire.type} 
                                size="small"
                                color={getUserTypeColor(t.proprietaire.type)}
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Non disponible
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* NOUVELLE COLONNE : Acteurs (Agent uniquement) */}
                      {isAgent && (
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {t.acteurs?.clientEmail && (
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                Client: {t.acteurs.clientEmail.split('@')[0]}
                              </Typography>
                            )}
                            {t.acteurs?.distributeurEmail && (
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                Dist: {t.acteurs.distributeurEmail.split('@')[0]}
                              </Typography>
                            )}
                            {t.acteurs?.agentEmail && (
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                Agent: {t.acteurs.agentEmail.split('@')[0]}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      )}

                      <TableCell>
                        <Chip 
                          label={t.statut} 
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Recherche par numéro */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Rechercher une transaction par numéro
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            label="Numéro de transaction"
            value={numeroTransaction}
            onChange={(e) => setNumeroTransaction(e.target.value)}
            placeholder="TRX..."
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !numeroTransaction}
            sx={{ minWidth: 150 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Rechercher'}
          </Button>
        </Box>
      </Paper>

      {/* Détails de la transaction trouvée */}
      {foundTransaction && (
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Détails de la transaction
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Numéro :</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {foundTransaction.numeroTransaction}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Date :</Typography>
                <Typography variant="body1">
                  {new Date(foundTransaction.dateTransaction).toLocaleString('fr-FR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Type :</Typography>
                <Chip 
                  label={foundTransaction.typeTransaction}
                  color={
                    foundTransaction.typeTransaction === 'Transfert' ? 'primary' :
                    foundTransaction.typeTransaction === 'Depot' ? 'success' : 'info'
                  }
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Montant :</Typography>
                <Typography variant="h6">{foundTransaction.montant.toLocaleString()} FCFA</Typography>
                {foundTransaction.frais > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    (Frais: {foundTransaction.frais} FCFA)
                  </Typography>
                )}
              </Box>
              
              {/* Afficher les comptes source/destination */}
              <Box>
                <Typography variant="body2" color="text.secondary">Comptes :</Typography>
                <Typography variant="body2">
                  De: {foundTransaction.compteSource}
                </Typography>
                <Typography variant="body2">
                  Vers: {foundTransaction.compteDestination}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Statut :</Typography>
                <Chip 
                  label={foundTransaction.statut}
                  color={
                    foundTransaction.statut === 'Validee' ? 'success' :
                    foundTransaction.statut === 'En_attente' ? 'warning' : 'error'
                  }
                />
              </Box>

              {foundTransaction.annulation?.estAnnulee && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Annulée le :</Typography>
                  <Typography variant="body1" color="error">
                    {new Date(foundTransaction.annulation.dateAnnulation).toLocaleString('fr-FR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Raison : {foundTransaction.annulation.raison}
                  </Typography>
                </Box>
              )}
            </Box>

            {canCancel ? (
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleOpenDialog}
                disabled={loading}
                startIcon={<CancelIcon />}
              >
                Annuler cette transaction
              </Button>
            ) : foundTransaction.annulation?.estAnnulee ? (
              <Alert severity="error">Transaction déjà annulée</Alert>
            ) : (
              <Alert severity="warning">
                Transaction non annulable
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer l'annulation</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible. Les fonds seront restitués.
          </Alert>
          {foundTransaction && foundTransaction.typeTransaction === 'Transfert' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Annulation d'un Transfert Client :
              </Typography>
              <Typography variant="body2">
                • L'expéditeur récupérera {foundTransaction.montantTotal} FCFA (montant + frais)
              </Typography>
              <Typography variant="body2">
                • Le destinataire sera débité de {foundTransaction.montant} FCFA
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleAnnuler} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmer l\'annulation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Annuler;