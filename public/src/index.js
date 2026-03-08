import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**2.20** Presiona `Ctrl + S`

---

### **Archivo 7: .gitignore**

**2.21** Haz clic derecho en SABUESO → "New File"

**2.22** Escribe: `.gitignore`

**2.23** Copia y pega esto:
```
node_modules/
.env
.env.local
.DS_Store
build/
dist/
```

**2.24** Presiona `Ctrl + S`

---

## **PASO 3: Verifica la estructura**

Tu explorador en VSCode debe verse así:
```
SABUESO
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   └── index.js
├── sabueso-app.jsx (el original, puedes borrarlo luego)
├── package.json
└── .gitignore