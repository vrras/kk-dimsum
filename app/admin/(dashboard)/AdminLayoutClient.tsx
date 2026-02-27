'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Utensils, ShoppingBag, Ticket, Settings, Menu } from 'lucide-react';
import LogoutButton from './LogoutButton';

const drawerWidth = 264;

export default function AdminLayoutClient({ children, session }: { children: React.ReactNode, session: { user?: { name?: string | null } } | null }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [storeName, setStoreName] = React.useState('Nama Toko');

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.storeName) setStoreName(data.storeName);
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        height: { xs: 56, sm: 64 }, 
        display: 'flex', 
        alignItems: 'center', 
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 2
      }}>
        <Box>
          <Typography 
            variant="h6" 
            color="primary.dark" 
            sx={{ 
              fontWeight: 900, 
              letterSpacing: -0.5,
              textTransform: 'uppercase',
              lineHeight: 1.2
            }}
          >
            {storeName.toUpperCase()}
          </Typography>
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            <Box component="span" sx={{ bgcolor: 'primary.light', color: 'primary.main', px: 1, py: 0.25, borderRadius: 1, fontWeight: 'bold', fontSize: '0.65rem' }}>
              ADMIN PANEL
            </Box>
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 2, flex: 1, pt: 2 }}>
        {[
          { text: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
          { text: 'Kelola Pesanan', icon: <ShoppingBag size={20} />, href: '/admin/orders' },
          { text: 'Menu & Kategori', icon: <Utensils size={20} />, href: '/admin/menu' },
          { text: 'Kode Promo', icon: <Ticket size={20} />, href: '/admin/promo' },
          { text: 'Pengaturan', icon: <Settings size={20} />, href: '/admin/settings' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={Link} 
              href={item.href}
              selected={pathname.startsWith(item.href)}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{ 
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&.Mui-selected': { 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' }
                },
                '& .MuiListItemIcon-root': { 
                  color: pathname.startsWith(item.href) ? 'inherit' : 'text.secondary',
                  minWidth: 40 
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                slotProps={{ primary: { fontWeight: 600, fontSize: '0.95rem' } }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <LogoutButton />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: 'primary.main',
          boxShadow: '0 2px 10px rgba(219, 39, 119, 0.08)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <Menu size={24} />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
              Selamat datang, {session?.user?.name || 'Admin'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'secondary.main', 
              color: '#fff', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem'
            }}>AD</Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 10, sm: 11 }, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          overflowX: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
