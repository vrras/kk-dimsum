import prisma from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { AddToCartButton, FloatingCart } from '@/components/AddToCartButton'
import SearchInput from '@/components/SearchInput'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import StoreStatusBanner from '@/components/StoreStatusBanner'

export const dynamic = 'force-dynamic'

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const { category, search } = searchParams;

  // Build query
  const where: { isAvailable: boolean; category?: { name: string }; name?: { contains: string } } = { isAvailable: true };
  if (category) {
    where.category = { name: category };
  }
  if (search) {
    where.name = { contains: search };
  }

  const [menus, categories, settings] = await Promise.all([
    prisma.menu.findMany({
      where,
      include: { category: true },
      orderBy: { categoryId: 'asc' }
    }),
    prisma.category.findMany(),
    prisma.settings.findFirst()
  ]);

  const storeName = settings?.storeName || 'Nama Toko';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 10 }}>
      {/* Hero Section */}
      <Box 
        component="header"
        sx={{ 
          background: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 40%, #db2777 100%)', 
          color: 'white',
          pt: 8,
          pb: 12,
          px: 2,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative elements behind text */}
        <Box sx={{
          position: 'absolute', top: -50, right: -50, width: 200, height: 200, 
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)'
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, 
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)'
        }} />

        {/* Lacak Pesanan Button */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <Button
            component={Link}
            href="/cek-pesanan"
            variant="text"
            startIcon={<ReceiptLongIcon />}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
              borderRadius: 8,
              fontWeight: 700,
              px: { xs: 2, sm: 3 },
              py: 1,
              textTransform: 'none',
            }}
          >
            Lacak Pesanan
          </Button>
        </Box>
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 900, 
              mb: 1.5, 
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.75rem' }
            }}
          >
            {storeName}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.95, 
              fontWeight: 500, 
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Sajikan kehangatan dimsum favorit Anda di rumah dengan resep otentik.
          </Typography>
          
          <StoreStatusBanner variant="hero" />
        </Container>
      </Box>

      {/* Floating Search Bar */}
      <Container maxWidth="md" sx={{ mt: { xs: -3, sm: -4 }, position: 'relative', zIndex: 10, mb: { xs: 3, sm: 4 } }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 0.5, sm: 0.75 }, 
            borderRadius: { xs: 3, sm: 4 }, 
            boxShadow: '0 8px 30px rgba(219, 39, 119, 0.12)',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'white'
          }}
        >
          <SearchInput initialSearch={search || ''} category={category} />
        </Paper>
      </Container>

      <Container maxWidth="lg">
        {/* Horizontal Categories */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Stack 
            direction="row" 
            spacing={1.5} 
            sx={{ 
              overflowX: 'auto', 
              pb: 2,
              px: { xs: 1, md: 0 },
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            <Button
              component={Link}
              href="/"
              variant={!category ? 'contained' : 'text'}
              disableElevation
              sx={{ 
                borderRadius: 20, 
                whiteSpace: 'nowrap', 
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 700,
                color: !category ? 'white' : 'text.secondary',
                bgcolor: !category ? 'primary.main' : '#f5f5f5',
                '&:hover': {
                  bgcolor: !category ? 'primary.dark' : '#eeeeee',
                }
              }}
            >
              Semua Menu
            </Button>
            {categories.map((c: { id: string; name: string }) => (
              <Button
                key={c.id}
                component={Link}
                href={`/?category=${c.name}${search ? `&search=${search}` : ''}`}
                variant={category === c.name ? 'contained' : 'text'}
                disableElevation
                sx={{ 
                  borderRadius: 20, 
                  whiteSpace: 'nowrap', 
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 700,
                  color: category === c.name ? 'white' : 'text.secondary',
                  bgcolor: category === c.name ? 'primary.main' : '#f5f5f5',
                  '&:hover': {
                    bgcolor: category === c.name ? 'primary.dark' : '#eeeeee',
                  }
                }}
              >
                {c.name}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Menu Grid */}
        {menus.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>
              Menu tidak ditemukan.
            </Typography>
            <Typography variant="body1" color="text.disabled" sx={{ mt: 1 }}>
              Coba gunakan kata kunci lain.
            </Typography>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, 1fr)', 
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)', 
                lg: 'repeat(4, 1fr)' 
              }, 
              gap: { xs: 1.5, sm: 2, md: 3 } 
            }}
          >
            {menus.map((menu: { id: string; name: string; price: number; imageUrl: string | null; description: string | null; category?: { name: string } | null }) => (
              <Card key={menu.id} sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: { xs: 3, sm: 4 },
                border: 'none',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px -10px rgba(219, 39, 119, 0.15)'
                }
              }}>
                <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                  {menu.imageUrl ? (
                    <CardMedia
                      component="img"
                      image={menu.imageUrl}
                      alt={menu.name}
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography color="primary.light" variant="button" fontWeight={800} sx={{ letterSpacing: { xs: 0, sm: 2 }, fontSize: { xs: '0.65rem', sm: '0.875rem' }, opacity: 0.6 }}>
                        {storeName.toUpperCase()}
                      </Typography>
                    </Box>
                  )}
                  {/* Price tag over image */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: { xs: 4, sm: 10 },
                    right: { xs: 4, sm: 10 },
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    color: 'primary.main',
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 0.25, sm: 0.5 },
                    borderRadius: { xs: 2, sm: 4 },
                    fontWeight: 900,
                    fontSize: { xs: '0.7rem', sm: '0.9rem' },
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {formatCurrency(menu.price)}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.25, sm: 2 }, pb: { xs: 1.25, sm: 2 }, display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0 } }}>
                  <Box sx={{ mb: 'auto' }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, lineHeight: 1.2, mb: { xs: 0.5, sm: 0.5 }, color: 'text.primary', fontSize: { xs: '0.8rem', sm: '1.1rem' } }}>
                      {menu.name}
                    </Typography>
                    
                    {menu.category && (
                      <Chip 
                        label={menu.category.name} 
                        size="small" 
                        sx={{ 
                          mb: { xs: 0.5, sm: 1.5 }, 
                          bgcolor: '#fdf2f8', 
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: { xs: '0.55rem', sm: '0.7rem' },
                          height: { xs: 16, sm: 24 },
                          border: '1px solid #fbcfe8'
                        }} 
                      />
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: { xs: 1.2, sm: 1.5 }, fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                      {menu.description || 'Sajian dimsum lezat siap menemani.'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 'auto', pt: { xs: 1, sm: 1.5 }, borderTop: '1px solid', borderColor: 'divider' }}>
                    <AddToCartButton menu={menu} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
      
      <FloatingCart />
    </Box>
  )
}
