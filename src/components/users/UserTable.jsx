import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Tooltip,
  Checkbox,
  Typography,
  useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArchiveIcon from '@mui/icons-material/Archive';

function UserTable({ 
  users, 
  onDelete,        // Pour archiver (soft delete)
  onBlock,         // Pour bloquer/débloquer
  onEdit,          // Pour modifier
  onRestore,       // Pour restaurer depuis archives
  selectedUsers = [],
  onSelectUser,
  isArchived = false
}) {
  const theme = useTheme();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (onSelectUser) {
      selectedUsers.forEach(userId => onSelectUser(userId));
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    if (onSelectUser) {
      selectedUsers.forEach(userId => onSelectUser(userId));
    }
  };

  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const isSelected = (userId) => selectedUsers.includes(userId);
  // Empêcher la sélection uniquement du propre compte de l'agent
  const isSelectable = (user) => currentUser && user._id !== currentUser.id;

  const selectablePageUsers = paginatedUsers.filter(u => isSelectable(u));
  const allPageSelected = selectablePageUsers.length > 0 && 
    selectablePageUsers.every(u => isSelected(u._id));

  const handleSelectAllPage = (event) => {
    if (event.target.checked) {
      selectablePageUsers.forEach(user => {
        if (!isSelected(user._id)) {
          onSelectUser(user._id);
        }
      });
    } else {
      selectablePageUsers.forEach(user => {
        if (isSelected(user._id)) {
          onSelectUser(user._id);
        }
      });
    }
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow 
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.100'
              }}
            >
              <TableCell padding="checkbox" sx={{ py: 0.5, px: 0.5, width: 40 }}>
                <Checkbox
                  size="small"
                  indeterminate={
                    selectedUsers.filter(id => paginatedUsers.some(u => u._id === id)).length > 0 && 
                    !allPageSelected
                  }
                  checked={allPageSelected}
                  onChange={handleSelectAllPage}
                  disabled={selectablePageUsers.length === 0}
                />
              </TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>Nom</strong></TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>Email</strong></TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>Tél</strong></TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>N° Compte</strong></TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>Type</strong></TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}><strong>Solde</strong></TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}><strong>Statut</strong></TableCell>
              {isArchived && (
                <TableCell sx={{ py: 0.5, px: 1 }}><strong>Archivé le</strong></TableCell>
              )}
              <TableCell align="center" sx={{ py: 0.5, px: 1 }}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isArchived ? 10 : 9} align="center" sx={{ py: 3 }}>
                  {isArchived ? 'Aucun utilisateur archivé' : 'Aucun utilisateur trouvé'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const compte = user.comptes && user.comptes[0];
                const solde = compte ? compte.solde : 0;
                const numeroCompte = compte ? compte.numeroCompte : 'N/A';
                const statut = user.estActif ? 'Actif' : 'Bloqué';
                const selectable = isSelectable(user);
                const selected = isSelected(user._id);

                return (
                  <TableRow 
                    key={user._id} 
                    hover
                    selected={selected}
                    sx={{
                      bgcolor: selected ? 'action.selected' : 
                               isArchived ? 'action.hover' : 'inherit',
                      cursor: selectable ? 'pointer' : 'default'
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ py: 0.5, px: 0.5 }}>
                      <Checkbox
                        size="small"
                        checked={selected}
                        onChange={() => onSelectUser(user._id)}
                        disabled={!selectable}
                      />
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {user.prenom} {user.nom}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {user.email}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {user.tel || 'N/A'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.7rem' 
                        }}
                      >
                        {numeroCompte}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Chip 
                        label={user.typeUtilisateur} 
                        size="small"
                        color={
                          user.typeUtilisateur === 'Agent' ? 'secondary' :
                          user.typeUtilisateur === 'Client' ? 'primary' : 'warning'
                        }
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    
                    <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                        {solde.toLocaleString()} FCFA
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Chip 
                        label={statut}
                        size="small"
                        color={statut === 'Actif' ? 'success' : 'error'}
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </TableCell>

                    {isArchived && (
                      <TableCell sx={{ py: 0.5, px: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                          {user.dateSuppression 
                            ? new Date(user.dateSuppression).toLocaleDateString('fr-FR')
                            : 'N/A'
                          }
                        </Typography>
                      </TableCell>
                    )}
                    
                    <TableCell sx={{ py: 0.5, px: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                        {isArchived ? (
                          <Typography variant="caption" color="text.secondary">
                            Archivé
                          </Typography>
                        ) : (
                          <>
                            {/* Empêcher l'agent de modifier son propre compte */}
                            {currentUser && user._id !== currentUser.id ? (
                              <>
                                <Tooltip title="Modifier">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => onEdit(user)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                
                                {user.typeUtilisateur !== 'Agent' && (
                                  <>
                                    <Tooltip title={statut === 'Actif' ? 'Bloquer' : 'Débloquer'}>
                                      <IconButton 
                                        size="small" 
                                        color={statut === 'Actif' ? 'error' : 'success'}
                                        onClick={() => onBlock(user._id)}
                                        sx={{ p: 0.5 }}
                                      >
                                        {statut === 'Actif' ? 
                                          <BlockIcon sx={{ fontSize: 16 }} /> : 
                                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                                        }
                                      </IconButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Archiver">
                                      <IconButton 
                                        size="small" 
                                        color="warning"
                                        onClick={() => onDelete(user._id)}
                                        sx={{ p: 0.5 }}
                                      >
                                        <ArchiveIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Votre compte
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={users.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count}`
        }
        rowsPerPageOptions={[15, 25, 50, 100]}
        size="small"
      />
    </Paper>
  );
}

export default UserTable;