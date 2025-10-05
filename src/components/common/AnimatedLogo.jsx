import React from 'react';
import { Box, keyframes } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

function AnimatedLogo() {
  return (
    <Box
      sx={{
        display: 'inline-block',
        animation: `${bounce} 2s ease-in-out infinite`
      }}
    >
      <AccountBalanceIcon 
        sx={{ 
          fontSize: 60,
          color: 'primary.main',
          '&:hover': {
            animation: `${rotate} 0.5s ease-in-out`
          }
        }} 
      />
    </Box>
  );
}

export default AnimatedLogo;