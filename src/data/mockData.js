export const mockData = {
  users: [
    { id: 1, nom: 'Diop', prenom: 'Amadou', email: 'amadou.diop@mail.com', numeroCompte: 'CLI123456', type: 'Client', solde: 150000, statut: 'Actif' },
    { id: 2, nom: 'Ndiaye', prenom: 'Fatou', email: 'fatou.ndiaye@mail.com', numeroCompte: 'DIS234567', type: 'Distributeur', solde: 500000, statut: 'Actif' },
    { id: 3, nom: 'Sow', prenom: 'Moussa', email: 'moussa.sow@mail.com', numeroCompte: 'CLI345678', type: 'Client', solde: 75000, statut: 'Actif' },
    { id: 4, nom: 'Fall', prenom: 'Aissatou', email: 'aissatou.fall@mail.com', numeroCompte: 'DIS456789', type: 'Distributeur', solde: 800000, statut: 'Bloqué' },
    { id: 5, nom: 'Sy', prenom: 'Ibrahima', email: 'ibrahima.sy@mail.com', numeroCompte: 'AGT567890', type: 'Agent', solde: 0, statut: 'Actif' },
    { id: 6, nom: 'Sarr', prenom: 'Mariama', email: 'mariama.sarr@mail.com', numeroCompte: 'CLI678901', type: 'Client', solde: 250000, statut: 'Actif' },
    { id: 7, nom: 'Gueye', prenom: 'Ousmane', email: 'ousmane.gueye@mail.com', numeroCompte: 'DIS789012', type: 'Distributeur', solde: 1200000, statut: 'Actif' },
    { id: 8, nom: 'Mbaye', prenom: 'Khadija', email: 'khadija.mbaye@mail.com', numeroCompte: 'CLI890123', type: 'Client', solde: 45000, statut: 'Actif' },
    { id: 9, nom: 'Ba', prenom: 'Abdoulaye', email: 'abdoulaye.ba@mail.com', numeroCompte: 'CLI901234', type: 'Client', solde: 320000, statut: 'Actif' },
    { id: 10, nom: 'Kane', prenom: 'Awa', email: 'awa.kane@mail.com', numeroCompte: 'DIS012345', type: 'Distributeur', solde: 950000, statut: 'Actif' }
  ],

  transactions: [
    { id: 1, date: '2025-01-15T10:30:00', type: 'Dépôt', montant: 50000, frais: 0, statut: 'Validee', client: 'Amadou Diop' },
    { id: 2, date: '2025-01-15T11:45:00', type: 'Retrait', montant: 25000, frais: 500, statut: 'En_cours', client: 'Fatou Ndiaye' },
    { id: 3, date: '2025-01-15T14:20:00', type: 'Transfert', montant: 100000, frais: 1000, statut: 'Validee', client: 'Moussa Sow' },
    { id: 4, date: '2025-01-14T09:15:00', type: 'Dépôt', montant: 75000, frais: 0, statut: 'En_cours', client: 'Mariama Sarr' },
    { id: 5, date: '2025-01-14T16:30:00', type: 'Retrait', montant: 30000, frais: 600, statut: 'Annulee', client: 'Khadija Mbaye' },
    { id: 6, date: '2025-01-13T10:00:00', type: 'Transfert', montant: 150000, frais: 1500, statut: 'Validee', client: 'Abdoulaye Ba' },
    { id: 7, date: '2025-01-13T13:45:00', type: 'Dépôt', montant: 200000, frais: 0, statut: 'Validee', client: 'Ousmane Gueye' },
    { id: 8, date: '2025-01-12T11:20:00', type: 'Retrait', montant: 45000, frais: 900, statut: 'Validee', client: 'Amadou Diop' },
    { id: 9, date: '2025-01-12T15:30:00', type: 'Transfert', montant: 80000, frais: 800, statut: 'Validee', client: 'Awa Kane' },
    { id: 10, date: '2025-01-11T09:45:00', type: 'Dépôt', montant: 120000, frais: 0, statut: 'En_cours', client: 'Fatou Ndiaye' },
    { id: 11, date: '2025-01-11T14:10:00', type: 'Retrait', montant: 60000, frais: 1200, statut: 'En_cours', client: 'Moussa Sow' },
    { id: 12, date: '2025-01-10T10:30:00', type: 'Transfert', montant: 95000, frais: 950, statut: 'Annulee', client: 'Mariama Sarr' },
    { id: 13, date: '2025-01-10T16:00:00', type: 'Dépôt', montant: 85000, frais: 0, statut: 'Validee', client: 'Khadija Mbaye' },
    { id: 14, date: '2025-01-09T11:15:00', type: 'Retrait', montant: 40000, frais: 800, statut: 'Validee', client: 'Abdoulaye Ba' },
    { id: 15, date: '2025-01-09T15:45:00', type: 'Transfert', montant: 110000, frais: 1100, statut: 'Validee', client: 'Ousmane Gueye' }
  ]
};