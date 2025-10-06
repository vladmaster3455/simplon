import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Logout,
  Edit,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../config/api';
import { API_CONFIG } from '../config/config';

const DRAWER_WIDTH = 240;
const API_BASE_URL = API_CONFIG.ASSETS_URL;// URL de base du backend MongoDB

function Header({ onLogout, sidebarOpen, toggleTheme, mode }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Charger la photo si elle existe
    if (user.photo) {
      setPhotoUrl(`${API_BASE_URL}${user.photo}`);
    }
  }, [user.photo]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleMenuClose();
    
    try {
      await authAPI.logout();
    } catch (err) {
      console.log('Erreur déconnexion:', err);
    }
    
    onLogout();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: 'margin-left 0.3s ease, width 0.3s ease',
        marginLeft: { xs: 0, md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
        width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' }
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            display: { xs: 'none', sm: 'block' }
          }}
        >
          Dashboard Agent
        </Typography>

        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: '1rem',
            display: { xs: 'block', sm: 'none' }
          }}
        >
          Agent
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            <IconButton 
              onClick={toggleTheme} 
              color="inherit"
              size="small"
              sx={{ 
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Typography 
            variant="body1"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontSize: { sm: '0.875rem', md: '1rem' }
            }}
          >
            {user.prenom} {user.nom}
          </Typography>
          
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            size="small"
          >
            <Avatar 
              src={photoUrl}
              sx={{ 
                width: { xs: 28, sm: 32 }, 
                height: { xs: 28, sm: 32 }, 
                bgcolor: 'secondary.main',
                border: '2px solid',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {!photoUrl && `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfile}>
              <Edit sx={{ mr: 1 }} fontSize="small" />
              Modifier le Profil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} fontSize="small" />
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;