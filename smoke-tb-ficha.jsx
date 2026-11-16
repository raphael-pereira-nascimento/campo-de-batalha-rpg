import React from 'react';
import { createRoot } from 'react-dom/client';
import TableBattle from './src/pages/TableBattle.jsx';
import FichaForm from './src/components/FichaForm.jsx';

const erros = [];
window.addEventListener('error', (e) => erros.push(String(e.message)));

function App() {
  return (
    <div>
      <TableBattle onBack={() => {}} characters={[]} gameData={{}} />
      <FichaForm
        player={{ id: 'smoke', name: 'Teste' }}
        gameData={{}}
        onCreated={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
window.__SMOKE_ERROS__ = erros;
