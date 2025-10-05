import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip
} from '@mui/material';

function RecentList({ transactions }) {
  const getStatusColor = (status) => {
    const colors = {
      'Validee': 'success',
      'En_attente': 'warning',
      'Annulee': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Transactions Récentes
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Montant</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucune transaction récente
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.numeroTransaction}>
                  <TableCell>{transaction.numeroTransaction}</TableCell>
                  <TableCell>
                    {new Date(transaction.dateTransaction).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{transaction.typeTransaction}</TableCell>
                  <TableCell align="right">{transaction.montant} FCFA</TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.statut} 
                      color={getStatusColor(transaction.statut)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default RecentList;