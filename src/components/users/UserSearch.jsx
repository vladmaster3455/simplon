import React, { useState } from 'react';
import { Paper, TextField, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function UserSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon color="action" />
        <TextField
          fullWidth
          placeholder="Rechercher par Email, ID ou Numéro de compte..."
          value={searchTerm}
          onChange={handleChange}
          variant="standard"
        />
      </Box>
    </Paper>
  );
}

export default UserSearch;