'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>Memuat Editor...</Box>
});

interface WysiwygEditorProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
}

export default function WysiwygEditor({ value, onChange, label }: WysiwygEditorProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
          {label}
        </Typography>
      )}
      <Box sx={{ 
        '& .ql-toolbar': { 
          borderTopLeftRadius: '8px', 
          borderTopRightRadius: '8px',
          bgcolor: '#f8fafc' 
        },
        '& .ql-container': { 
          borderBottomLeftRadius: '8px', 
          borderBottomRightRadius: '8px',
          minHeight: '150px',
          fontSize: '1rem'
        },
        '& .ql-editor': {
          minHeight: '150px'
        }
      }}>
        <ReactQuill 
          theme="snow" 
          value={value} 
          onChange={onChange}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{'list': 'ordered'}, {'list': 'bullet'}],
              ['clean']
            ],
          }}
        />
      </Box>
    </Box>
  );
}
