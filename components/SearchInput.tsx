'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchInput({ initialSearch, category }: { initialSearch: string; category?: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState(initialSearch);
  
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (searchTerm) params.set('search', searchTerm);
      router.push(`/?${params.toString()}`);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category, router]);

  return (
    <TextField
      fullWidth
      value={searchTerm}
      placeholder="Cari menu favoritmu..."
      variant="standard"
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <InputAdornment position="start" sx={{ pl: { xs: 0.5, sm: 1 } }}>
            <SearchIcon color="action" fontSize="small" />
          </InputAdornment>
        ),
        sx: { fontSize: { xs: '0.9rem', sm: '1.05rem' }, py: 0 }
      }}
    />
  );
}
