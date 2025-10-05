import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Card,
  CardContent
} from '@mui/material';
import KPICard from '../components/dashboard/KPICard';
import RecentList from '../components/dashboard/RecentList';
import { usersAPI, transactionsAPI } from '../config/api';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';


function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDistributeurs: 0,
    totalClients: 0,
    totalAgents: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [ setTransactionStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les utilisateurs
      const usersResponse = await usersAPI.getAllUsers();
      
      // Compter par type
      const users = usersResponse.users || [];
      const statsData = {
        totalDistributeurs: users.filter(u => u.typeUtilisateur === 'Distributeur').length,
        totalClients: users.filter(u => u.typeUtilisateur === 'Client').length,
        totalAgents: users.filter(u => u.typeUtilisateur === 'Agent').length
      };
      setStats(statsData);

      // Récupérer l'historique des transactions récentes (y compris annulées)
      const transactionsResponse = await transactionsAPI.getHistorique(10, 1);
      setRecentTransactions(transactionsResponse.transactions || []);

      // Récupérer les statistiques de transactions (pour Agent)
      try {
        const statsResponse = await transactionsAPI.getStatistiques();
        setTransactionStats(statsResponse.statistiques);
      } catch (err) {
        // Si pas Agent, ignorer cette erreur
        console.log('Statistiques non disponibles');
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}
      >
        Tableau de Bord
      </Typography>

      {/* KPI Cards - Utilisateurs */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Nombre total de distributeurs"
            value={stats.totalDistributeurs}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Nombre total de clients"
            value={stats.totalClients}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Nombre total d'agents"
            value={stats.totalAgents}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Transactions récentes avec indicateurs d'annulation */}
      <Card elevation={3} sx={{ mb: { xs: 3, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            <TrendingDownIcon color="secondary" />
            Transactions Récentes
          </Typography>

          <RecentList transactions={recentTransactions} />
        </CardContent>
      </Card>

      {/* Message si pas de données */}
      {recentTransactions.length === 0 && (
        <Alert severity="info">
          Aucune transaction récente à afficher
        </Alert>
      )}
    </Box>
  );
}

export default Dashboard;