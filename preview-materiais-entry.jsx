import React from 'react';
import { createRoot } from 'react-dom/client';
import Materiais from './src/pages/Materiais.jsx';
import './src/styles.css';

createRoot(document.getElementById('root')).render(
  <Materiais onBack={() => {}} />,
);
