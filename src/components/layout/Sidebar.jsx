import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalance as DepotIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import AnimatedLogo from '../common/AnimatedLogo';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Gestion des Utilisateurs', icon: <PeopleIcon />, path: '/users' },
  { text: 'Dépôt', icon: <DepotIcon />, path: '/depot' },
  { text: 'Annuler', icon: <CancelIcon />, path: '/annuler' },
  { text: 'Historique', icon: <HistoryIcon />, path: '/historique' }
];

const DRAWER_WIDTH = 240;

function Sidebar({ open, onClose, mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const textColor = mode === 'dark' ? '#fff' : '#000';
  const hoverBg = mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 2 }}>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: textColor,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Box sx={{ textAlign: 'center', py: 2 }}>
        <AnimatedLogo />
      </Box>

      <List sx={{ px: 1, mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                color: textColor,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    backgroundColor: mode === 'dark' 
                      ? 'rgba(25, 118, 210, 0.4)' 
                      : 'rgba(25, 118, 210, 0.3)',
                  }
                },
                '&:hover': { backgroundColor: hoverBg }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: textColor }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#fff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            transition: 'transform 0.3s ease',
            transform: open ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
            overflowX: 'hidden',
            border: 'none',
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#fff',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;