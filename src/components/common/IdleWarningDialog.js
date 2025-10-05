/**
 * ============================================
 * DIALOGUE D'AVERTISSEMENT D'INACTIVITÉ
 * ============================================
 * Affiche un avertissement avant la déconnexion automatique
 * et permet à l'utilisateur de rester connecté
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const IdleWarningDialog = ({ 
  open, 
  onStayActive, 
  onLogout, 
  warningTime = 60 // Temps en secondes avant déconnexion
}) => {
  const [timeLeft, setTimeLeft] = useState(warningTime);

  useEffect(() => {
    if (!open) {
      setTimeLeft(warningTime);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, warningTime, onLogout]);

  const progress = ((warningTime - timeLeft) / warningTime) * 100;

  return (
    <Dialog 
      open={open} 
      onClose={onStayActive}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Inactivité détectée
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Vous allez être déconnecté dans <strong>{timeLeft} secondes</strong> pour cause d'inactivité.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
          Cliquez sur "Rester connecté" pour continuer votre session.
        </Typography>

        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color="warning"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onLogout} color="error">
          Se déconnecter
        </Button>
        <Button onClick={onStayActive} variant="contained" color="primary" autoFocus>
          Rester connecté
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdleWarningDialog;
