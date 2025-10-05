import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { transactionsAPI } from '../config/api';

function Historique() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filter, setFilter] = useState('all');
  
  // Récupérer le type d'utilisateur connecté
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAgent = user.typeUtilisateur === 'Agent';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getHistorique(500, 1);
      setTransactions(response.transactions || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.statut === filter;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Historique des Transactions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        
          <TextField
            select
            label="Filtrer par statut"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="Validee">Validées</MenuItem>
            <MenuItem value="En_attente">En attente</MenuItem>
            <MenuItem value="Annulee">Annulées</MenuItem>
          </TextField>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
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
                <TableCell align="right"><strong>Frais</strong></TableCell>
                <TableCell align="right"><strong>Bonus</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                {isAgent && <TableCell><strong>Propriétaire</strong></TableCell>}
                <TableCell><strong>Acteurs</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAgent ? 9 : 8} align="center" sx={{ py: 3 }}>
                    Aucune transaction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.numeroTransaction || transaction._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {transaction.numeroTransaction}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.dateTransaction).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.typeTransaction}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <strong>{transaction.montant.toLocaleString()}</strong> FCFA
                    </TableCell>
                    <TableCell align="right">{transaction.frais || 0} FCFA</TableCell>
                    <TableCell align="right">
                      {transaction.bonus ? (
                        <Typography variant="body2" color="success.main">
                          +{transaction.bonus} FCFA
                        </Typography>
                      ) : (
                        '0 FCFA'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.statut}
                        size="small"
                        color={
                          transaction.statut === 'Validee' ? 'success' :
                          transaction.statut === 'En_attente' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    {isAgent && transaction.proprietaire && (
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.proprietaire.prenom} {transaction.proprietaire.nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({transaction.proprietaire.type})
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {transaction.acteurs?.agentEmail && `Agent: ${transaction.acteurs.agentEmail}`}
                        {transaction.acteurs?.clientEmail && (
                          <>
                            <br />Client: {transaction.acteurs.clientEmail}
                          </>
                        )}
                        {transaction.acteurs?.distributeurEmail && (
                          <>
                            <br />Dist: {transaction.acteurs.distributeurEmail}
                          </>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredTransactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count}`
          }
        />
      </Paper>
    </Box>
  );
}

export default Historique;