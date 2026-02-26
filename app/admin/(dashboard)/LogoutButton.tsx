'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

import Button from '@mui/material/Button';

export default function LogoutButton() {
  return (
    <Button 
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      variant="text"
      color="error"
      fullWidth
      startIcon={<LogOut size={20} />}
      sx={{ 
        justifyContent: 'flex-start',
        cursor: 'pointer',
        px: 2, 
        py: 1.5,
        fontWeight: 600,
        bgcolor: 'rgba(219, 39, 119, 0.04)',
        '&:hover': {
          bgcolor: 'rgba(219, 39, 119, 0.08)',
        }
      }}
    >
      Logout
    </Button>
  );
}
