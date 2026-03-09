import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Search, User, Bell, MessageSquare, LogOut, Eye, EyeOff, Plus, X, BarChart3, Send } from 'lucide-react';

const Sabueso = () => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('sabueso_users');
    return saved ? JSON.parse(saved) : {
      'user1': { id: 'user1', email: 'demo@example.com', password: 'demo123', name: 'Juan Pérez', avatar: '👨', isCompany: false, phone: '', website: '', createdAt: Date.now() },
      'user2': { id: 'user2', email: 'repuestos@example.com', password: 'demo123', name: 'RepuestosGT', avatar: '🏢', isCompany: true, phone: '+502-7777-0001', website: 'www.repuestosgt.com', createdAt: Date.now() }
    };
  });

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('sabueso_posts');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sabueso_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [screen, setScreen] = useState('login');
  const [loginEmail, setLoginEmail] = useState('demo@example.com');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerIsCompany, setRegisterIsCompany] = useState(false);
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerWebsite, setRegisterWebsite] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ articulo: '', marca: '', modelo: '', año: '', info: '', foto: '' });
  const [searchFilters, setSearchFilters] = useState({ articulo: '', marca: '', modelo: '', año: '' });
  const [showSearch, setShowSearch] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  // Persistencia
  useEffect(() => {
    localStorage.setItem('sabueso_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sabueso_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('sabueso_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Funciones de autenticación
  const handleLogin = (e) => {
    e.preventDefault();
    const user = Object.values(users).find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setScreen('home');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerPassword !== registerConfirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    const newUser = {
      id: 'user_' + Date.now(),
      email: registerEmail,
      password: registerPassword,
      name: registerName,
      avatar: registerIsCompany ? '🏢' : ['👨', '👩'][Math.floor(Math.random() * 2)],
      isCompany: registerIsCompany,
      phone: registerPhone,
      website: registerWebsite,
      createdAt: Date.now(),
      emailVerified: false
    };
    setUsers({ ...users, [newUser.id]: newUser });
    setShowRegister(false);
    alert('¡Cuenta creada! Se envió un correo de verificación. (Simulado)');
    resetRegisterForm();
  };

  const resetRegisterForm = () => {
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirm('');
    setRegisterName('');
    setRegisterIsCompany(false);
    setRegisterPhone('');
    setRegisterWebsite('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen('login');
  };

  // Funciones de posts
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPost.articulo || !newPost.marca || !newPost.modelo || !newPost.año) {
      alert('Completa todos los campos requeridos');
      return;
    }
    const post = {
      id: 'post_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      articulo: newPost.articulo,
      marca: newPost.marca,
      modelo: newPost.modelo,
      año: newPost.año,
      info: newPost.info,
      foto: newPost.foto,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      likes: 0,
      likedBy: [],
      responses: []
    };
    setPosts([post, ...posts]);
    setNewPost({ articulo: '', marca: '', modelo: '', año: '', info: '', foto: '' });
    setShowPostForm(false);
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likedBy.includes(currentUser.id);
        return {
          ...p,
          likes: hasLiked ? p.likes - 1 : p.likes + 1,
          likedBy: hasLiked ? p.likedBy.filter(id => id !== currentUser.id) : [...p.likedBy, currentUser.id]
        };
      }
      return p;
    }));
  };

  const handleResponsePost = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedChat({ postId, postTitle: `${post.articulo} - ${post.marca} ${post.modelo}`, otherUserId: post.userId, otherUserName: post.userName });
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const response = {
      id: 'response_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      message: chatMessage,
      createdAt: Date.now()
    };
    setPosts(posts.map(p => {
      if (p.id === selectedChat.postId) {
        return { ...p, responses: [...(p.responses || []), response] };
      }
      return p;
    }));
    setNotifications([...notifications, { id: Date.now(), type: 'response', postId: selectedChat.postId, fromUser: currentUser.name }]);
    setChatMessage('');
  };

  // Filtrado de posts
  const getFilteredPosts = () => {
    let filtered = posts;
    if (searchFilters.articulo) filtered = filtered.filter(p => p.articulo.toLowerCase().includes(searchFilters.articulo.toLowerCase()));
    if (searchFilters.marca) filtered = filtered.filter(p => p.marca.toLowerCase().includes(searchFilters.marca.toLowerCase()));
    if (searchFilters.modelo) filtered = filtered.filter(p => p.modelo.toLowerCase().includes(searchFilters.modelo.toLowerCase()));
    if (searchFilters.año) filtered = filtered.filter(p => p.año === searchFilters.año);
    return filtered;
  };

  // Calcular días restantes
  const getDaysLeft = (expiresAt) => {
    const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    const daysSince = Math.floor((Date.now() - (expiresAt - 7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    return { daysSince: Math.max(0, daysSince), daysLeft: Math.max(0, daysLeft) };
  };

  // Stats para admin
  const getAdminStats = () => {
    const companies = Object.values(users).filter(u => u.isCompany);
    const activeUsers = Object.values(users).filter(u => posts.some(p => p.userId === u.id));
    const totalPosts = posts.length;
    const todayPosts = posts.filter(p => {
      const daysDiff = Math.floor((Date.now() - p.createdAt) / (24 * 60 * 60 * 1000));
      return daysDiff === 0;
    }).length;
    return { companies, activeUsers, totalPosts, todayPosts };
  };

  // UI Renders
  const PostCard = ({ post }) => {
    const { daysSince, daysLeft } = getDaysLeft(post.expiresAt);
    const hasLiked = post.likedBy.includes(currentUser?.id);

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-lime-500 transition-colors duration-300 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{post.userAvatar}</div>
            <div>
              <div className="font-semibold text-white text-sm">{post.userName}</div>
              <div className="text-xs text-gray-500">hace {daysSince} día{daysSince !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`px-2 py-1 rounded ${daysLeft <= 1 ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400'}`}>
              Expira en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lime-500 font-bold text-lg mb-2">{post.articulo}</h3>
          <div className="flex gap-4 mb-3 flex-wrap text-sm">
            <div className="cursor-pointer hover:text-lime-500 transition-colors">
              <span className="text-gray-400">Marca:</span> <span className="text-white font-medium">{post.marca}</span>
            </div>
            <div className="cursor-pointer hover:text-lime-500 transition-colors">
              <span className="text-gray-400">Modelo:</span> <span className="text-white font-medium">{post.modelo}</span>
            </div>
            <div className="cursor-pointer hover:text-lime-500 transition-colors">
              <span className="text-gray-400">Año:</span> <span className="text-white font-medium">{post.año}</span>
            </div>
          </div>
          {post.info && <p className="text-gray-300 text-sm">{post.info}</p>}
        </div>

        {post.foto && (
          <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gray-800 flex items-center justify-center border border-gray-700">
            <div className="text-4xl">{post.foto}</div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={() => handleLikePost(post.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              hasLiked ? 'bg-lime-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button
            onClick={() => handleResponsePost(post.id)}
            className="flex-1 bg-lime-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-lime-400 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            Responder ({post.responses?.length || 0})
          </button>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    if (showRegister) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(50, 211, 153, 0.1) 0%, transparent 50%)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="w-24 h-24"/>
              </div>
              <h1 className="text-4xl font-black text-lime-500 mb-2">SABUESO</h1>
              <p className="text-gray-400">Crea tu cuenta</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
              <input
                type="text"
                placeholder="Nombre completo"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-lime-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                required
              />

              <div className="border-t border-gray-700 pt-4">
                <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={registerIsCompany}
                    onChange={(e) => setRegisterIsCompany(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded bg-gray-800 border-gray-600 text-lime-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-white font-medium text-sm">Soy empresa o negocio</div>
                    <div className="text-xs text-gray-500 italic">tranquilo, no preguntamos para cobrar ;) es que si eres empresa habilitaremos la opción de agregar número de teléfono y link a tu página web</div>
                  </div>
                </label>
              </div>

              {registerIsCompany && (
                <div className="space-y-3 bg-gray-800 p-3 rounded border border-gray-700">
                  <input
                    type="tel"
                    placeholder="+502 XXXX-XXXX"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                  <input
                    type="url"
                    placeholder="www.tuempresa.com"
                    value={registerWebsite}
                    onChange={(e) => setRegisterWebsite(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300 mt-4"
              >
                Crear Cuenta
              </button>
            </form>
            <button
              onClick={() => { setShowRegister(false); resetRegisterForm(); }}
              className="w-full text-center mt-4 text-gray-400 hover:text-lime-500 transition-colors"
            >
              Volver al login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(50, 211, 153, 0.1) 0%, transparent 50%)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="h-16 w-auto" />
            </div>
            <h1 className="text-5xl font-black text-lime-500 mb-2">SABUESO</h1>
            <p className="text-gray-400 text-lg">Tu pides, ellos ofertan</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none transition-colors"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-lime-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300"
            >
              Iniciar Sesión
            </button>
          </form>
          <p className="text-center mt-6 text-gray-400">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="text-lime-500 font-bold hover:text-lime-400 transition-colors"
            >
              Regístrate aquí
            </button>
          </p>
          <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-2">Demo - Usa estas credenciales:</p>
            <p className="text-xs text-gray-400">Email: <span className="text-lime-500">demo@example.com</span></p>
            <p className="text-xs text-gray-400">Pass: <span className="text-lime-500">demo123</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Home screen
  if (screen === 'home') {
    const filteredPosts = getFilteredPosts();

    return (
      <div className="min-h-screen bg-black text-white" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(50, 211, 153, 0.05) 0%, transparent 50%)' }}>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-gray-900/95 border-b border-gray-800 z-40 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="h-8 w-auto" />
              <h1 className="text-2xl font-black text-lime-500">SABUESO</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Buscar"
              >
                <Search size={20} className="text-gray-400 hover:text-lime-500" />
              </button>
              <button
                onClick={() => setScreen('notifications')}
                className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Notificaciones"
              >
                <Bell size={20} className="text-gray-400 hover:text-lime-500" />
                {notifications.length > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-lime-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setScreen('chat')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Mensajes"
              >
                <MessageSquare size={20} className="text-gray-400 hover:text-lime-500" />
              </button>
              <button
                onClick={() => setScreen('profile')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Mi perfil"
              >
                <User size={20} className="text-gray-400 hover:text-lime-500" />
              </button>
              {currentUser.email === 'demo@example.com' && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Admin"
                >
                  <BarChart3 size={20} className="text-gray-400 hover:text-lime-500" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="border-t border-gray-800 p-4 bg-gray-900">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Artículo (ej: disco de clutch)"
                    value={searchFilters.articulo}
                    onChange={(e) => setSearchFilters({ ...searchFilters, articulo: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Marca"
                    value={searchFilters.marca}
                    onChange={(e) => setSearchFilters({ ...searchFilters, marca: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Modelo"
                    value={searchFilters.modelo}
                    onChange={(e) => setSearchFilters({ ...searchFilters, modelo: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Año"
                    value={searchFilters.año}
                    onChange={(e) => setSearchFilters({ ...searchFilters, año: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm"
                  />
                </div>
                <button
                  onClick={() => setSearchFilters({ articulo: '', marca: '', modelo: '', año: '' })}
                  className="text-xs text-gray-400 hover:text-lime-500"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
          {/* Admin Dashboard */}
          {showAdmin && (
            <div className="mb-8 bg-gray-900 border border-lime-500 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-lime-500">Panel de Administrador</h2>
                <button
                  onClick={() => setShowAdmin(false)}
                  className="text-gray-400 hover:text-lime-500"
                >
                  <X size={24} />
                </button>
              </div>

              {(() => {
                const stats = getAdminStats();
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1">Total de Posts</div>
                      <div className="text-3xl font-bold text-lime-500">{stats.totalPosts}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1">Posts Hoy</div>
                      <div className="text-3xl font-bold text-lime-500">{stats.todayPosts}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1">Usuarios Activos</div>
                      <div className="text-3xl font-bold text-lime-500">{stats.activeUsers.length}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1">Empresas</div>
                      <div className="text-3xl font-bold text-lime-500">{stats.companies.length}</div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <h3 className="text-lime-500 font-bold mb-3">Empresas Registradas</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(() => {
                    const stats = getAdminStats();
                    return stats.companies.length > 0 ? (
                      stats.companies.map(company => (
                        <div key={company.id} className="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
                          <div className="font-semibold text-white">{company.name}</div>
                          <div className="text-gray-400 text-xs">{company.email}</div>
                          {company.phone && <div className="text-gray-400 text-xs">📞 {company.phone}</div>}
                          {company.website && <div className="text-lime-500 text-xs">🌐 {company.website}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm italic">Sin empresas registradas</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay anuncios que coincidan con tu búsqueda</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowPostForm(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-lime-500 text-black rounded-full flex items-center justify-center shadow-lg hover:bg-lime-400 transition-all duration-300 hover:scale-110 font-bold text-2xl z-30"
        >
          <Plus size={32} />
        </button>

        {/* Post Form Modal */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-lime-500">¿Qué buscas?</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="text-gray-400 hover:text-lime-500"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <input
                  type="text"
                  placeholder="Artículo (ej: disco de clutch)"
                  value={newPost.articulo}
                  onChange={(e) => setNewPost({ ...newPost, articulo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Marca (ej: Mazda)"
                  value={newPost.marca}
                  onChange={(e) => setNewPost({ ...newPost, marca: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Modelo (ej: Mazda 6)"
                  value={newPost.modelo}
                  onChange={(e) => setNewPost({ ...newPost, modelo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Año (ej: 2005)"
                  value={newPost.año}
                  onChange={(e) => setNewPost({ ...newPost, año: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                  required
                />
                <textarea
                  placeholder="Información adicional (opcional)"
                  value={newPost.info}
                  onChange={(e) => setNewPost({ ...newPost, info: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none resize-none h-24"
                />
                <input
                  type="text"
                  placeholder="Foto (emoji o URL)"
                  value={newPost.foto}
                  onChange={(e) => setNewPost({ ...newPost, foto: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300"
                >
                  Publicar Anuncio
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="fixed bottom-8 left-8 p-3 bg-gray-900 border border-gray-800 hover:border-lime-500 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={20} className="text-gray-400 hover:text-lime-500" />
        </button>
      </div>
    );
  }

  // Profile screen
  if (screen === 'profile') {
    const userPosts = posts.filter(p => p.userId === currentUser.id);
    const userResponses = posts.filter(p => p.responses?.some(r => r.userId === currentUser.id));

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Mi Perfil</h1>
            <button
              onClick={() => setScreen('home')}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={24} className="text-gray-400 hover:text-lime-500" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-6xl">{currentUser.avatar}</div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{currentUser.name}</h2>
                <p className="text-gray-400">{currentUser.email}</p>
                {currentUser.isCompany && (
                  <>
                    {currentUser.phone && <p className="text-gray-400">📞 {currentUser.phone}</p>}
                    {currentUser.website && <p className="text-lime-500">🌐 {currentUser.website}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-lime-500">{userPosts.length}</div>
                  <div className="text-xs text-gray-400">Mis Anuncios</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-lime-500">{userResponses.length}</div>
                  <div className="text-xs text-gray-400">Respuestas Dadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-lime-500">{posts.reduce((sum, p) => p.userId === currentUser.id ? sum + (p.likes || 0) : sum, 0)}</div>
                  <div className="text-xs text-gray-400">Likes Recibidos</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Posts */}
          <h3 className="text-xl font-bold text-lime-500 mb-4">Mis Anuncios</h3>
          <div className="space-y-4 mb-8">
            {userPosts.length > 0 ? (
              userPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-gray-500 text-center py-8">No tienes anuncios publicados</p>
            )}
          </div>

          {/* My Responses */}
          <h3 className="text-xl font-bold text-lime-500 mb-4">Mis Respuestas</h3>
          <div className="space-y-4">
            {userResponses.map(post => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-lime-500 font-bold mb-2">{post.articulo} - {post.marca} {post.modelo}</div>
                <div className="text-gray-400 text-sm">
                  Respondiste a {post.userName}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setScreen('home')}
            className="w-full mt-8 bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Notifications screen
  if (screen === 'notifications') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Notificaciones</h1>
            <button
              onClick={() => setScreen('home')}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={24} className="text-gray-400 hover:text-lime-500" />
            </button>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-lime-500 transition-colors">
                  <div className="text-white">{notif.fromUser} respondió a tu publicación</div>
                  <div className="text-gray-400 text-sm mt-1">hace unos momentos</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-12">Sin notificaciones</p>
            )}
          </div>

          <button
            onClick={() => setScreen('home')}
            className="w-full mt-8 bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Chat screen
  if (screen === 'chat') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Mensajes</h1>
            <button
              onClick={() => setScreen('home')}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={24} className="text-gray-400 hover:text-lime-500" />
            </button>
          </div>

          {!selectedChat ? (
            <div>
              <p className="text-gray-500 text-center py-12">Haz clic en "Responder" en un anuncio para comenzar a chatear</p>
              <button
                onClick={() => setScreen('home')}
                className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all duration-300"
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gray-800 p-4 border-b border-gray-700">
                <h2 className="font-bold text-lime-500">{selectedChat.postTitle}</h2>
                <p className="text-sm text-gray-400">Con {selectedChat.otherUserName}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {posts.find(p => p.id === selectedChat.postId)?.responses?.map(response => (
                  <div key={response.id} className={`flex ${response.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      response.userId === currentUser.id
                        ? 'bg-lime-500 text-black'
                        : 'bg-gray-800 text-white'
                    }`}>
                      <p className="text-xs opacity-75 mb-1">{response.userName}</p>
                      <p>{response.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 p-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-lime-500 text-black p-2 rounded-lg hover:bg-lime-400 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Sabueso;
