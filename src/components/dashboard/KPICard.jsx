import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

function KPICard({ title, value, color }) {
  return (
    <Card elevation={3}  sx={{
        borderRadius: "50%",   
        width: 200,          
        height: 200,           
        display: "flex",       
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"    
      }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom variant="h6">
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3" sx={{ color, fontWeight: 'bold' }}>
           &nbsp;&nbsp;&nbsp;&nbsp; {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default KPICard;