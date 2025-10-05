import React, { useState, useEffect } from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, onLogout, toggleTheme, mode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar 
        open={sidebarOpen} 
        onClose={toggleSidebar} 
        mode={mode}
      />
      
      {/* Bouton menu hamburger - visible sur mobile ou quand sidebar fermée sur desktop */}
      {(!sidebarOpen || isMobile) && (
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed',
            top: { xs: 8, sm: 16 },
            left: { xs: 8, sm: 16 },
            zIndex: (theme) => theme.zIndex.drawer + 2,
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark'
            },
            boxShadow: 3,
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Header 
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          toggleTheme={toggleTheme}
          mode={mode}
        />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1.5, sm: 2, md: 3 },
            mt: { xs: '56px', sm: '64px' },
            transition: 'margin-left 0.3s ease',
            maxWidth: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            height: 'calc(100vh - 64px)'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;