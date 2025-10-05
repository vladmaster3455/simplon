import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Alert, Snackbar, CircularProgress,
  Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Chip, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UserTable from '../components/users/UserTable';
import UserSearch from '../components/users/UserSearch';
import CreateUserDialog from '../components/users/CreateUserDialog';
import EditUserDialog from '../components/users/EditUserDialog';
import { usersAPI } from '../config/api';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ Ajout pour garder le terme de recherche
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    type: '', 
    message: '' 
  });

  useEffect(() => {
    fetchUsers();
    fetchArchivedUsers();
  }, []);

  // ✅ Mise à jour automatique de filteredUsers quand users, archivedUsers ou currentTab change
  useEffect(() => {
    const dataSource = currentTab === 0 ? users : archivedUsers;
    applySearch(searchTerm, dataSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, archivedUsers, currentTab, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      const usersData = response.users || [];
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const fetchArchivedUsers = async () => {
    try {
      const response = await usersAPI.getArchivedUsers();
      setArchivedUsers(response.users || []);
    } catch (err) {
      console.log('Pas d\'utilisateurs archivés ou erreur:', err.message);
      setArchivedUsers([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSelectedUsers([]);
    setSearchTerm(''); // Réinitialiser la recherche lors du changement d'onglet
  };

  // ✅ Fonction améliorée pour appliquer la recherche
  const applySearch = (term, dataSource) => {
    if (!term) {
      setFilteredUsers(dataSource);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = dataSource.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user._id.toString().includes(searchLower) ||
      (user.comptes && user.comptes[0]?.numeroCompte.toLowerCase().includes(searchLower)) ||
      user.nom.toLowerCase().includes(searchLower) ||
      user.prenom.toLowerCase().includes(searchLower) ||
      (user.tel && user.tel.includes(searchLower))
    );
    setFilteredUsers(filtered);
  };

  const handleSearch = (term) => {
    setSelectedUsers([]);
    setSearchTerm(term);
    const dataSource = currentTab === 0 ? users : archivedUsers;
    applySearch(term, dataSource);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkArchive = async () => {
    try {
      const response = await usersAPI.archiveMultiple(selectedUsers);
      setSuccessMessage(response.message || `${selectedUsers.length} utilisateur(s) archivé(s)`);
      setSelectedUsers([]);
      await fetchUsers();
      await fetchArchivedUsers();
      setConfirmDialog({ open: false, type: '', message: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'archivage');
      setConfirmDialog({ open: false, type: '', message: '' });
    }
  };

  const handleBulkRestore = async () => {
    try {
      const response = await usersAPI.restoreMultiple(selectedUsers);
      setSuccessMessage(response.message || `${selectedUsers.length} utilisateur(s) restauré(s)`);
      setSelectedUsers([]);
      await fetchUsers();
      await fetchArchivedUsers();
      setConfirmDialog({ open: false, type: '', message: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de la restauration');
      setConfirmDialog({ open: false, type: '', message: '' });
    }
  };

  const handlePermanentDelete = async () => {
    try {
      for (const userId of selectedUsers) {
        await usersAPI.permanentDelete(userId);
      }
      setSuccessMessage(`${selectedUsers.length} utilisateur(s) supprimé(s) définitivement`);
      setSelectedUsers([]);
      await fetchArchivedUsers();
      setConfirmDialog({ open: false, type: '', message: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression définitive');
      setConfirmDialog({ open: false, type: '', message: '' });
    }
  };

  const handleBulkBlock = async (estActif) => {
    try {
      const response = await usersAPI.blockMultiple(selectedUsers, estActif);
      setSuccessMessage(response.message || `${selectedUsers.length} utilisateur(s) ${estActif ? 'débloqué(s)' : 'bloqué(s)'}`);
      setSelectedUsers([]);
      await fetchUsers();
      setConfirmDialog({ open: false, type: '', message: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de statut');
      setConfirmDialog({ open: false, type: '', message: '' });
    }
  };

  const openConfirmDialog = (type) => {
    const messages = {
      archive: `Êtes-vous sûr de vouloir archiver ${selectedUsers.length} utilisateur(s) ? Ils pourront être restaurés plus tard.`,
      restore: `Êtes-vous sûr de vouloir restaurer ${selectedUsers.length} utilisateur(s) archivé(s) ?`,
      permanentDelete: `⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ${selectedUsers.length} utilisateur(s) ? Cette action est IRRÉVERSIBLE !`,
      block: `Êtes-vous sûr de vouloir bloquer ${selectedUsers.length} utilisateur(s) ?`,
      unblock: `Êtes-vous sûr de vouloir débloquer ${selectedUsers.length} utilisateur(s) ?`
    };
    setConfirmDialog({ open: true, type, message: messages[type] });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'archive') {
      handleBulkArchive();
    } else if (confirmDialog.type === 'restore') {
      handleBulkRestore();
    } else if (confirmDialog.type === 'permanentDelete') {
      handlePermanentDelete();
    } else if (confirmDialog.type === 'block') {
      handleBulkBlock(false);
    } else if (confirmDialog.type === 'unblock') {
      handleBulkBlock(true);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleUpdate = async (userId, updatedData) => {
    try {
      await usersAPI.updateUser(userId, updatedData);
      setSuccessMessage('Utilisateur modifié avec succès');
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    }
  };

  const handleArchive = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir archiver cet utilisateur ?')) {
      try {
        await usersAPI.archiveUser(userId);
        setSuccessMessage('Utilisateur archivé avec succès');
        await fetchUsers();
        await fetchArchivedUsers();
      } catch (err) {
        setError(err.message || 'Erreur lors de l\'archivage');
      }
    }
  };

  const handleRestore = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer cet utilisateur ?')) {
      try {
        await usersAPI.restoreUser(userId);
        setSuccessMessage('Utilisateur restauré avec succès');
        await fetchUsers();
        await fetchArchivedUsers();
      } catch (err) {
        setError(err.message || 'Erreur lors de la restauration');
      }
    }
  };

  const handleBlock = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      const newStatus = !user.estActif;
      
      await usersAPI.toggleUserStatus(userId, newStatus);
      
      setSuccessMessage(
        newStatus 
          ? 'Compte débloqué avec succès' 
          : 'Compte bloqué avec succès'
      );
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleCreateUser = async (newUserData) => {
    try {
      const apiCall = newUserData.type === 'Client' 
        ? usersAPI.createClient 
        : usersAPI.createDistributeur;
      
      const dataToSend = {
        nom: newUserData.nom,
        prenom: newUserData.prenom,
        email: newUserData.email,
        telephone: newUserData.tel,
        motDePasse: newUserData.motDePasse || 'passer',
        nCarteIdentite: newUserData.NcarteIdentite,
        adresse: newUserData.adresse,
        dateNaissance: newUserData.dateNaissance
      };

      await apiCall(dataToSend);
      
      setSuccessMessage(
        `Compte ${newUserData.type} créé avec succès pour ${newUserData.prenom} ${newUserData.nom}`
      );
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100vw', overflow: 'hidden', px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Gestion des Utilisateurs
          </Typography>
          {selectedUsers.length > 0 && (
            <Chip 
              label={`${selectedUsers.length} sélectionné${selectedUsers.length > 1 ? 's' : ''}`}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          size="large"
          fullWidth={window.innerWidth < 600}
        >
          Créer un compte
        </Button>
      </Box>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab 
          label={`Utilisateurs actifs (${users.length})`} 
          icon={<CheckCircleIcon />} 
          iconPosition="start"
        />
        <Tab 
          label={`Utilisateurs archivés (${archivedUsers.length})`} 
          icon={<ArchiveIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {selectedUsers.length > 0 && (
        <Box sx={{ 
          mb: 2, 
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'primary.main', 
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 2 },
          boxShadow: 2
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              flexGrow: 1, 
              color: 'white', 
              fontWeight: 500,
              mb: { xs: 1, sm: 0 },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {selectedUsers.length} utilisateur(s) sélectionné(s)
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' }
          }}>
            {currentTab === 0 ? (
              <>
                <Tooltip title="Bloquer la sélection">
                  <Button 
                    variant="contained"
                    color="warning"
                    startIcon={<BlockIcon />}
                    onClick={() => openConfirmDialog('block')}
                    size="small"
                  >
                    Bloquer
                  </Button>
                </Tooltip>

                <Tooltip title="Débloquer la sélection">
                  <Button 
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openConfirmDialog('unblock')}
                    size="small"
                  >
                    Débloquer
                  </Button>
                </Tooltip>

                <Tooltip title="Archiver la sélection">
                  <Button 
                    variant="contained"
                    color="error"
                    startIcon={<ArchiveIcon />}
                    onClick={() => openConfirmDialog('archive')}
                    size="small"
                  >
                    Archiver
                  </Button>
                </Tooltip>
              </>
            ) : null}

            <Button 
              variant="outlined" 
              onClick={() => setSelectedUsers([])}
              size="small"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Annuler
            </Button>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <UserSearch onSearch={handleSearch} />

      <UserTable 
        users={filteredUsers}
        onEdit={handleEdit}
        onDelete={currentTab === 0 ? handleArchive : null}
        onRestore={currentTab === 1 ? handleRestore : null}
        onBlock={currentTab === 0 ? handleBlock : null}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        isArchived={currentTab === 1}
      />

      <CreateUserDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onCreate={handleCreateUser}
      />

      <EditUserDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onUpdate={handleUpdate}
        user={selectedUser}
      />

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: '', message: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.type === 'permanentDelete' ? '⚠️ Attention : Suppression définitive' : 'Confirmation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
          {confirmDialog.type === 'permanentDelete' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Cette action supprimera définitivement les utilisateurs de la base de données. 
              Cette opération est IRRÉVERSIBLE.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: '', message: '' })}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color={confirmDialog.type === 'permanentDelete' ? 'error' : 'primary'}
            variant="contained"
            autoFocus
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UsersManagement;