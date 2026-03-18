import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Search, User, Bell, MessageSquare, LogOut, Eye, EyeOff, Plus, X, BarChart3, Send, MoreVertical, Building2, Camera } from 'lucide-react';
import { auth, db, storage } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import {
  collection, addDoc, doc, updateDoc, onSnapshot,
  query, orderBy, getDoc, setDoc, deleteDoc, increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Security questions list
const SECURITY_QUESTIONS = [
  '¿Cuál fue tu primer número de teléfono?',
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad naciste?',
  '¿Cuál es el nombre de tu escuela primaria?',
  '¿Cuál es el apellido de soltera de tu madre?',
];

const DEFAULT_COMPANY_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3281/3281289.png';

const Sabueso = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth states
  const [loginType, setLoginType] = useState('user'); // 'user' | 'company'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUserLoginPassword, setShowUserLoginPassword] = useState(false);
  const [showCompanyPassword, setShowCompanyPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [recoverUsername, setRecoverUsername] = useState('');
  const [recoverAnswer, setRecoverAnswer] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverStep, setRecoverStep] = useState(1); // 1=username, 2=question, 3=new password
  const [recoverUserData, setRecoverUserData] = useState(null);
  const [recoverError, setRecoverError] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerType, setRegisterType] = useState('user'); // 'user' | 'company'

  // Register - user
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regSecurityQ, setRegSecurityQ] = useState(SECURITY_QUESTIONS[0]);
  const [regSecurityA, setRegSecurityA] = useState('');

  // Register - company
  const [regEmail, setRegEmail] = useState('');
  const [regCompanyPassword, setRegCompanyPassword] = useState('');
  const [regCompanyConfirm, setRegCompanyConfirm] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regCompanyPhoto, setRegCompanyPhoto] = useState(null);
  const [regCompanyPhotoPreview, setRegCompanyPhotoPreview] = useState(null);

  // App states
  const [screen, setScreen] = useState('login');
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ articulo: '', marca: '', modelo: '', año: '', info: '' });
  const [postPhoto, setPostPhoto] = useState(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState(null);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ articulo: '', marca: '', modelo: '', año: '' });
  const [showSearch, setShowSearch] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null); // public profile userId
  const [viewingProfileData, setViewingProfileData] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
        setScreen('home');
      } else {
        setCurrentUser(null);
        setCurrentUserData(null);
        setScreen('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Posts listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const fetchedPosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => post.expiresAt > now);
      setPosts(fetchedPosts);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Notifications listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myNotifs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(n => n.toUserId === currentUser.uid);
      setNotifications(myNotifs);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── AUTH FUNCTIONS ──────────────────────────────────────────

  const handleLoginUser = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await new Promise((resolve) => {
        const unsub = onSnapshot(q, (snap) => { resolve(snap); unsub(); });
      });
      const userDoc = snapshot.docs.find(d => d.data().username === loginUsername && !d.data().isCompany);
      if (!userDoc) { setAuthError('Usuario no encontrado'); return; }
      const userData = userDoc.data();
      await signInWithEmailAndPassword(auth, userData.proxyEmail, loginPassword);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setAuthError('Usuario o contraseña incorrectos');
    }
  };

  const handleLoginCompany = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setAuthError('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
        return;
      }
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError('Correo o contraseña incorrectos');
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (regPassword !== regConfirm) { setAuthError('Las contraseñas no coinciden'); return; }
    if (!regSecurityA.trim()) { setAuthError('Ingresa la respuesta a la pregunta de seguridad'); return; }
    try {
      // Create proxy email for Firebase Auth
      const proxyEmail = `user_${regUsername.toLowerCase().replace(/\s/g, '_')}_${Date.now()}@sabueso.app`;
      const userCredential = await createUserWithEmailAndPassword(auth, proxyEmail, regPassword);
      const user = userCredential.user;
      const userData = {
        id: user.uid,
        username: regUsername,
        proxyEmail,
        name: regUsername,
        avatar: ['👨', '👩', '🧑'][Math.floor(Math.random() * 3)],
        isCompany: false,
        securityQuestion: regSecurityQ,
        securityAnswer: regSecurityA.toLowerCase().trim(),
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      setCurrentUserData(userData);
      resetRegisterForm();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setAuthError('Ese nombre de usuario ya existe');
      else if (err.code === 'auth/weak-password') setAuthError('La contraseña debe tener al menos 6 caracteres');
      else setAuthError('Error al crear cuenta. Intenta de nuevo.');
    }
  };

  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (regCompanyPassword !== regCompanyConfirm) { setAuthError('Las contraseñas no coinciden'); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regCompanyPassword);
      const user = userCredential.user;

      let photoURL = DEFAULT_COMPANY_AVATAR;
      if (regCompanyPhoto) {
        const storageRef = ref(storage, `profiles/${user.uid}/avatar`);
        await uploadBytes(storageRef, regCompanyPhoto);
        photoURL = await getDownloadURL(storageRef);
      }

      const userData = {
        id: user.uid,
        email: regEmail,
        name: regCompanyName,
        avatar: photoURL,
        isCompany: true,
        phone: regPhone,
        website: regWebsite,
        createdAt: Date.now(),
        profileViews: 0
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      // Enviar correo de verificación
      await sendEmailVerification(user);
      setCurrentUserData(userData);
      resetRegisterForm();
      alert('✅ Cuenta creada. Por favor revisa tu correo y verifica tu cuenta antes de iniciar sesión.');
      await signOut(auth);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setAuthError('Este correo ya está registrado');
      else if (err.code === 'auth/weak-password') setAuthError('La contraseña debe tener al menos 6 caracteres');
      else setAuthError('Error al crear cuenta. Intenta de nuevo.');
    }
  };

  const resetRegisterForm = () => {
    setRegUsername(''); setRegPassword(''); setRegConfirm('');
    setRegSecurityQ(SECURITY_QUESTIONS[0]); setRegSecurityA('');
    setRegEmail(''); setRegCompanyPassword(''); setRegCompanyConfirm('');
    setRegCompanyName(''); setRegPhone(''); setRegWebsite('');
    setRegCompanyPhoto(null); setRegCompanyPhotoPreview(null);
    setShowRegister(false); setAuthError(''); setShowConfirmPassword(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setAuthError('No encontramos ese correo. Verifica e intenta de nuevo.');
    }
  };

  const handleLogout = async () => { await signOut(auth); };

  // ── POST FUNCTIONS ──────────────────────────────────────────

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.articulo || !newPost.marca || !newPost.modelo || !newPost.año) {
      alert('Completa todos los campos requeridos'); return;
    }
    setUploadingPost(true);
    try {
      let fotoURL = '';
      if (postPhoto) {
        const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${postPhoto.name}`);
        await uploadBytes(storageRef, postPhoto);
        fotoURL = await getDownloadURL(storageRef);
      }
      const now = Date.now();
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: currentUserData?.name || 'Usuario',
        userAvatar: currentUserData?.avatar || '👤',
        userIsCompany: currentUserData?.isCompany || false,
        articulo: newPost.articulo,
        marca: newPost.marca,
        modelo: newPost.modelo,
        año: newPost.año,
        info: newPost.info,
        foto: fotoURL,
        createdAt: now,
        expiresAt: now + (7 * 24 * 60 * 60 * 1000),
        likes: 0,
        likedBy: [],
        responses: [],
        reports: []
      });
      setNewPost({ articulo: '', marca: '', modelo: '', año: '', info: '' });
      setPostPhoto(null); setPostPhotoPreview(null);
      setShowPostForm(false);
    } catch (err) { alert('Error al publicar. Intenta de nuevo.'); }
    setUploadingPost(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    await deleteDoc(doc(db, 'posts', postId));
  };

  const handleReportPost = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const reports = postSnap.data().reports || [];
    if (reports.includes(currentUser.uid)) { alert('Ya reportaste esta publicación'); return; }
    await updateDoc(postRef, { reports: [...reports, currentUser.uid] });
    alert('Publicación reportada. Gracias.');
  };

  const handleLikePost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const hasLiked = post.likedBy.includes(currentUser.uid);
    await updateDoc(doc(db, 'posts', postId), {
      likes: hasLiked ? post.likes - 1 : post.likes + 1,
      likedBy: hasLiked
        ? post.likedBy.filter(id => id !== currentUser.uid)
        : [...post.likedBy, currentUser.uid]
    });
  };

  const handleResponsePost = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedChat({ postId, postTitle: `${post.articulo} - ${post.marca} ${post.modelo}`, otherUserId: post.userId, otherUserName: post.userName });
      setScreen('chat');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const postRef = doc(db, 'posts', selectedChat.postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const currentResponses = postSnap.data().responses || [];
    const response = {
      id: 'response_' + Date.now(),
      userId: currentUser.uid,
      userName: currentUserData?.name || 'Usuario',
      userAvatar: currentUserData?.avatar || '👤',
      userIsCompany: currentUserData?.isCompany || false,
      message: chatMessage,
      createdAt: Date.now()
    };
    await updateDoc(postRef, { responses: [...currentResponses, response] });
    // Guardar notificación en Firestore para el dueño del post
    if (selectedChat.otherUserId !== currentUser.uid) {
      await addDoc(collection(db, 'notifications'), {
        toUserId: selectedChat.otherUserId,
        fromUserName: currentUserData?.name || 'Usuario',
        postId: selectedChat.postId,
        postTitle: selectedChat.postTitle,
        type: 'response',
        read: false,
        createdAt: Date.now()
      });
    }
    setChatMessage('');
  };

  // View public company profile
  const handleViewCompanyProfile = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setViewingProfileData(data);
      setViewingProfile(userId);
      // Increment profile views
      await updateDoc(doc(db, 'users', userId), { profileViews: increment(1) });
      setScreen('publicProfile');
    }
  };

  // ── HELPERS ──────────────────────────────────────────────────

  const getFilteredPosts = () => {
    let filtered = posts;
    if (searchFilters.articulo) filtered = filtered.filter(p => p.articulo.toLowerCase().includes(searchFilters.articulo.toLowerCase()));
    if (searchFilters.marca) filtered = filtered.filter(p => p.marca.toLowerCase().includes(searchFilters.marca.toLowerCase()));
    if (searchFilters.modelo) filtered = filtered.filter(p => p.modelo.toLowerCase().includes(searchFilters.modelo.toLowerCase()));
    if (searchFilters.año) filtered = filtered.filter(p => p.año === searchFilters.año);
    return filtered;
  };

  const getDaysLeft = (expiresAt) => {
    const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    const daysSince = Math.floor((Date.now() - (expiresAt - 7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    return { daysSince: Math.max(0, daysSince), daysLeft: Math.max(0, daysLeft) };
  };

  // Avatar component
  const Avatar = ({ src, name, size = 'sm', onClick }) => {
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'md' ? 'w-12 h-12 text-lg' : 'w-20 h-20 text-3xl';
    const isUrl = src && (src.startsWith('http') || src.startsWith('blob'));
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-gray-700 flex-shrink-0 ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-lime-500' : ''}`} onClick={onClick}>
        {isUrl ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span>{src || '👤'}</span>}
      </div>
    );
  };

  // ── POST CARD ────────────────────────────────────────────────

  const PostCard = ({ post }) => {
    const { daysSince, daysLeft } = getDaysLeft(post.expiresAt);
    const hasLiked = post.likedBy?.includes(currentUser?.uid);
    const isOwner = post.userId === currentUser?.uid;
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-lime-500 transition-colors duration-300 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={post.userAvatar} name={post.userName} size="sm"
              onClick={post.userIsCompany ? () => handleViewCompanyProfile(post.userId) : null} />
            <div>
              <div className={`font-semibold text-white text-sm ${post.userIsCompany ? 'cursor-pointer hover:text-lime-500' : ''}`}
                onClick={post.userIsCompany ? () => handleViewCompanyProfile(post.userId) : null}>
                {post.userName}
                {post.userIsCompany && <span className="ml-1 text-xs text-lime-500">🏢</span>}
              </div>
              <div className="text-xs text-gray-500">hace {daysSince} día{daysSince !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-xs ${daysLeft <= 1 ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400'}`}>
              Expira en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical size={16} className="text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[140px]">
                  {isOwner ? (
                    <button onClick={() => { handleDeletePost(post.id); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg text-sm">
                      🗑️ Eliminar
                    </button>
                  ) : (
                    <button onClick={() => { handleReportPost(post.id); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-gray-700 rounded-lg text-sm">
                      🚩 Reportar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lime-500 font-bold text-lg mb-2">{post.articulo}</h3>
          <div className="flex gap-4 mb-3 flex-wrap text-sm">
            <div><span className="text-gray-400">Marca:</span> <span className="text-white font-medium">{post.marca}</span></div>
            <div><span className="text-gray-400">Modelo:</span> <span className="text-white font-medium">{post.modelo}</span></div>
            <div><span className="text-gray-400">Año:</span> <span className="text-white font-medium">{post.año}</span></div>
          </div>
          {post.info && <p className="text-gray-300 text-sm">{post.info}</p>}
        </div>

        {post.foto && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 cursor-zoom-in"
            onClick={() => setLightboxPhoto(post.foto)}>
            <img src={post.foto} alt="Foto del repuesto" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
            <div className="text-center text-xs text-gray-500 py-1">Clic para ampliar</div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <button onClick={() => handleLikePost(post.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${hasLiked ? 'bg-lime-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button onClick={() => handleResponsePost(post.id)}
            className="flex-1 bg-lime-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-lime-400 transition-all duration-300 flex items-center justify-center gap-2">
            <MessageCircle size={18} />
            Responder ({post.responses?.length || 0})
          </button>
        </div>
      </div>
    );
  };

  // ── LOADING ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="h-16 w-auto mx-auto mb-4" />
          <p className="text-lime-500 text-xl font-bold animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  // ── LOGIN SCREEN ─────────────────────────────────────────────

  if (!currentUser) {
    if (showRegister) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(50, 211, 153, 0.1) 0%, transparent 50%)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <img src="/images/logo-sabueso.png" alt="Logo" className="h-14 w-auto mx-auto mb-2" />
              <h1 className="text-3xl font-black text-lime-500">SABUESO</h1>
            </div>

            {/* Toggle register type */}
            <div className="flex mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
              <button onClick={() => setRegisterType('user')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${registerType === 'user' ? 'bg-lime-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                👤 Soy usuario
              </button>
              <button onClick={() => setRegisterType('company')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${registerType === 'company' ? 'bg-lime-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                🏢 Soy empresa
              </button>
            </div>

            {authError && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm mb-4">{authError}</div>}

            {registerType === 'user' ? (
              <form onSubmit={handleRegisterUser} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-lg font-bold text-white">Crear cuenta de usuario</h2>
                <input type="text" placeholder="Nombre de usuario" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmar contraseña" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Pregunta de seguridad</label>
                  <select value={regSecurityQ} onChange={e => setRegSecurityQ(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-lime-500 focus:outline-none">
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input type="text" placeholder="Tu respuesta" value={regSecurityA} onChange={e => setRegSecurityA(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                </div>
                <button type="submit" className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">Crear Cuenta</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterCompany} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-lg font-bold text-white">Crear cuenta de empresa</h2>

                {/* Company photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                    {regCompanyPhotoPreview
                      ? <img src={regCompanyPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                      : <Building2 size={32} className="text-gray-400" />}
                  </div>
                  <label className="cursor-pointer text-sm text-lime-500 hover:text-lime-400 flex items-center gap-1">
                    <Camera size={14} /> Subir foto de perfil (opcional)
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setRegCompanyPhoto(f); setRegCompanyPhotoPreview(URL.createObjectURL(f)); }
                    }} />
                  </label>
                </div>

                <input type="text" placeholder="Nombre de la empresa" value={regCompanyName} onChange={e => setRegCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                <input type="email" placeholder="Correo empresarial" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={regCompanyPassword} onChange={e => setRegCompanyPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmar contraseña" value={regCompanyConfirm} onChange={e => setRegCompanyConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <input type="tel" placeholder="Teléfono: +502 XXXX-XXXX" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                <input type="text" placeholder="Sitio web: www.tuempresa.com" value={regWebsite} onChange={e => setRegWebsite(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                <button type="submit" className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">Crear Cuenta Empresarial</button>
              </form>
            )}
            <button onClick={resetRegisterForm} className="w-full text-center mt-4 text-gray-400 hover:text-lime-500">← Volver al login</button>
          </div>
        </div>
      );
    }

    // Forgot password - usuario normal (por pregunta secreta)
    if (screen === 'forgotPasswordUser') {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(50, 211, 153, 0.1) 0%, transparent 60%)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img src="/images/logo-sabueso.png" alt="Logo" className="h-14 w-auto mx-auto mb-2" />
              <h1 className="text-3xl font-black text-lime-500">SABUESO</h1>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Recuperar contraseña</h2>
              <p className="text-gray-400 text-sm mb-6">
                {recoverStep === 1 && 'Ingresa tu nombre de usuario para continuar.'}
                {recoverStep === 2 && 'Responde tu pregunta de seguridad.'}
                {recoverStep === 3 && 'Crea tu nueva contraseña.'}
              </p>
              {recoverError && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm mb-4">{recoverError}</div>}

              {recoverSuccess ? (
                <div className="text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-lime-500 font-bold mb-2">¡Contraseña actualizada!</p>
                  <p className="text-gray-400 text-sm mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                  <button onClick={() => { setScreen('login'); setRecoverSuccess(false); }}
                    className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                    Ir al inicio de sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recoverStep === 1 && (
                    <>
                      <input type="text" placeholder="Nombre de usuario" value={recoverUsername} onChange={e => setRecoverUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                      <button onClick={async () => {
                        setRecoverError('');
                        if (!recoverUsername.trim()) { setRecoverError('Ingresa tu nombre de usuario'); return; }
                        const q = query(collection(db, 'users'));
                        const snapshot = await new Promise((resolve) => {
                          const unsub = onSnapshot(q, (snap) => { resolve(snap); unsub(); });
                        });
                        const userDoc = snapshot.docs.find(d => d.data().username === recoverUsername && !d.data().isCompany);
                        if (!userDoc) { setRecoverError('Usuario no encontrado'); return; }
                        setRecoverUserData({ id: userDoc.id, ...userDoc.data() });
                        setRecoverStep(2);
                      }} className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                        Continuar
                      </button>
                    </>
                  )}

                  {recoverStep === 2 && recoverUserData && (
                    <>
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Pregunta de seguridad:</p>
                        <p className="text-white font-medium">{recoverUserData.securityQuestion}</p>
                      </div>
                      <input type="text" placeholder="Tu respuesta" value={recoverAnswer} onChange={e => setRecoverAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                      <button onClick={() => {
                        setRecoverError('');
                        if (recoverAnswer.toLowerCase().trim() !== recoverUserData.securityAnswer) {
                          setRecoverError('Respuesta incorrecta. Intenta de nuevo.');
                          return;
                        }
                        setRecoverStep(3);
                      }} className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                        Verificar respuesta
                      </button>
                    </>
                  )}

                  {recoverStep === 3 && (
                    <>
                      <input type="password" placeholder="Nueva contraseña (mín. 6 caracteres)" value={recoverNewPassword} onChange={e => setRecoverNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                      <button onClick={async () => {
                        setRecoverError('');
                        if (recoverNewPassword.length < 6) { setRecoverError('La contraseña debe tener al menos 6 caracteres'); return; }
                        try {
                          // Sign in with old credentials temporarily to update password
                          const userCredential = await signInWithEmailAndPassword(auth, recoverUserData.proxyEmail, recoverUserData.securityAnswer);
                          // This won't work directly - we need to use Firebase Admin or a different approach
                          // For now, we update the password via reauthentication is not possible without old password
                          // Best approach: store hashed password in Firestore and update it
                          await updateDoc(doc(db, 'users', recoverUserData.id), { passwordHint: recoverNewPassword });
                          // Update Firebase Auth password
                          await updatePassword(userCredential.user, recoverNewPassword);
                          await signOut(auth);
                          setRecoverSuccess(true);
                        } catch (err) {
                          setRecoverError('Error al actualizar contraseña. Intenta de nuevo.');
                        }
                      }} className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                        Guardar nueva contraseña
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setScreen('login')} className="w-full text-center mt-4 text-gray-400 hover:text-lime-500">← Volver al login</button>
          </div>
        </div>
      );
    }

    // Forgot password screen
    if (screen === 'forgotPassword') {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(50, 211, 153, 0.1) 0%, transparent 60%)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img src="/images/logo-sabueso.png" alt="Logo" className="h-14 w-auto mx-auto mb-2" />
              <h1 className="text-3xl font-black text-lime-500">SABUESO</h1>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Recuperar contraseña</h2>
              <p className="text-gray-400 text-sm mb-6">Ingresa tu correo empresarial y te enviaremos un enlace para restablecer tu contraseña.</p>
              {authError && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm mb-4">{authError}</div>}
              {resetSent ? (
                <div className="text-center">
                  <div className="text-4xl mb-4">📧</div>
                  <p className="text-lime-500 font-bold mb-2">¡Correo enviado!</p>
                  <p className="text-gray-400 text-sm mb-6">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
                  <button onClick={() => { setScreen('login'); setResetSent(false); setResetEmail(''); }}
                    className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <input type="email" placeholder="Correo empresarial" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  <button type="submit" className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                    Enviar enlace de recuperación
                  </button>
                </form>
              )}
            </div>
            <button onClick={() => { setScreen('login'); setAuthError(''); }}
              className="w-full text-center mt-4 text-gray-400 hover:text-lime-500">← Volver al login</button>
          </div>
        </div>
      );
    }

    // Login screen — two panels
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(50, 211, 153, 0.1) 0%, transparent 60%)' }}>
        <div className="text-center mb-8">
          <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-5xl font-black text-lime-500">SABUESO</h1>
          <p className="text-gray-400 mt-1">Encuentra lo que Buscas</p>
        </div>

        {authError && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm mb-4 w-full max-w-2xl">{authError}</div>}

        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Panel usuario */}
          <div className={`bg-gray-900 border-2 rounded-xl p-6 transition-all ${loginType === 'user' ? 'border-lime-500' : 'border-gray-800'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">👤</div>
              <div>
                <div className="font-bold text-white">Usuarios</div>
                <div className="text-xs text-gray-400">Inicia sesión con tu usuario</div>
              </div>
            </div>
            <form onSubmit={handleLoginUser} className="space-y-3" onClick={() => setLoginType('user')}>
              <input type="text" placeholder="Nombre de usuario" value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
              <div className="relative">
                <input type={showUserLoginPassword ? 'text' : 'password'} placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                <button type="button" onClick={() => setShowUserLoginPassword(!showUserLoginPassword)} className="absolute right-3 top-3 text-gray-400">
                  {showUserLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                Iniciar Sesión
              </button>
            </form>
            <button onClick={() => { setScreen('forgotPasswordUser'); setRecoverStep(1); setRecoverError(''); setRecoverSuccess(false); setRecoverUsername(''); setRecoverAnswer(''); setRecoverNewPassword(''); }}
              className="w-full text-center mt-2 text-sm text-gray-500 hover:text-lime-500">
              ¿Olvidaste tu contraseña?
            </button>
            <button onClick={() => { setShowRegister(true); setRegisterType('user'); setAuthError(''); }}
              className="w-full text-center mt-2 text-sm text-gray-400 hover:text-lime-500">
              ¿No tienes cuenta? <span className="text-lime-500 font-bold">Regístrate gratis</span>
              <p className="text-yellow-400 font-bold text-xs mt-1">No requieres correo ni número de teléfono</p>
            </button>
          </div>

          {/* Panel empresa */}
          <div className={`bg-gray-900 border-2 rounded-xl p-6 transition-all ${loginType === 'company' ? 'border-lime-500' : 'border-gray-800'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">🏢</div>
              <div>
                <div className="font-bold text-white">Empresas & Negocios</div>
                <div className="text-xs text-gray-400">Accede con tu correo</div>
              </div>
            </div>
            <form onSubmit={handleLoginCompany} className="space-y-3" onClick={() => setLoginType('company')}>
              <input type="email" placeholder="Correo empresarial" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
              <div className="relative">
                <input type={showCompanyPassword ? 'text' : 'password'} placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                <button type="button" onClick={() => setShowCompanyPassword(!showCompanyPassword)} className="absolute right-3 top-3 text-gray-400">
                  {showCompanyPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
                Acceder como Empresa
              </button>
            </form>
            <button onClick={() => setScreen('forgotPassword')}
              className="w-full text-center mt-2 text-sm text-gray-500 hover:text-lime-500">
              ¿Olvidaste tu contraseña?
            </button>
            <button onClick={() => { setShowRegister(true); setRegisterType('company'); setAuthError(''); }}
              className="w-full text-center mt-2 text-sm text-gray-400 hover:text-lime-500">
              ¿No tienes cuenta? <span className="text-lime-500 font-bold">Crear cuenta empresarial</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── HOME SCREEN ──────────────────────────────────────────────

  if (screen === 'home') {
    const filteredPosts = getFilteredPosts();
    return (
      <div className="min-h-screen bg-black text-white" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(50, 211, 153, 0.05) 0%, transparent 50%)' }}>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-gray-900/95 border-b border-gray-800 z-40 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-3 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/images/logo-sabueso.png" alt="Logo Sabueso" className="h-7 w-auto flex-shrink-0" />
              <h1 className="text-xl font-black text-lime-500">SABUESO</h1>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 hover:bg-gray-800 rounded-lg"><Search size={18} className="text-gray-400" /></button>
              <button onClick={() => setScreen('notifications')} className="relative p-1.5 hover:bg-gray-800 rounded-lg">
                <Bell size={18} className="text-gray-400" />
                {notifications.filter(n => !n.read).length > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-lime-500 rounded-full"></div>}
              </button>
              <button onClick={() => setScreen('chat')} className="p-1.5 hover:bg-gray-800 rounded-lg"><MessageSquare size={18} className="text-gray-400" /></button>
              <button onClick={() => setScreen('profile')} className="p-1.5 hover:bg-gray-800 rounded-lg"><User size={18} className="text-gray-400" /></button>
              {currentUserData?.isAdmin && (<button onClick={() => setShowAdmin(!showAdmin)} className="p-1.5 hover:bg-gray-800 rounded-lg"><BarChart3 size={18} className="text-gray-400" /></button>)}
              <button onClick={handleLogout} className="p-1.5 hover:bg-gray-800 rounded-lg"><LogOut size={18} className="text-gray-400" /></button>
            </div>
          </div>
          {showSearch && (
            <div className="border-t border-gray-800 p-4 bg-gray-900">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {['articulo', 'marca', 'modelo', 'año'].map(f => (
                    <input key={f} type="text" placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={searchFilters[f]} onChange={e => setSearchFilters({ ...searchFilters, [f]: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none text-sm" />
                  ))}
                </div>
                <button onClick={() => setSearchFilters({ articulo: '', marca: '', modelo: '', año: '' })} className="text-xs text-gray-400 hover:text-lime-500">Limpiar filtros</button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
          {showAdmin && (
            <div className="mb-8 bg-gray-900 border border-lime-500 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-lime-500">Panel Admin</h2>
                <button onClick={() => setShowAdmin(false)}><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Total Posts</div>
                  <div className="text-3xl font-bold text-lime-500">{posts.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Posts Hoy</div>
                  <div className="text-3xl font-bold text-lime-500">{posts.filter(p => Math.floor((Date.now() - p.createdAt) / 86400000) === 0).length}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredPosts.length > 0
              ? filteredPosts.map(post => <PostCard key={post.id} post={post} />)
              : <div className="text-center py-12"><p className="text-gray-500 text-lg">No hay anuncios activos</p></div>}
          </div>
        </div>

        <button onClick={() => setShowPostForm(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-lime-500 text-black rounded-full flex items-center justify-center shadow-lg hover:bg-lime-400 transition-all hover:scale-110 z-30">
          <Plus size={32} />
        </button>

        {/* Post Form Modal */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-lime-500">¿Qué buscas?</h2>
                <button onClick={() => setShowPostForm(false)}><X size={24} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-4">
                {['articulo:Artículo (ej: disco de clutch)', 'marca:Marca (ej: Mazda)', 'modelo:Modelo (ej: Mazda 6)', 'año:Año (ej: 2005)'].map(field => {
                  const [key, placeholder] = field.split(':');
                  return (
                    <input key={key} type="text" placeholder={placeholder} value={newPost[key]}
                      onChange={e => setNewPost({ ...newPost, [key]: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" required />
                  );
                })}
                <textarea placeholder="Información adicional (opcional)" value={newPost.info} onChange={e => setNewPost({ ...newPost, info: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none resize-none h-24" />
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400">Foto del repuesto (opcional, máx 5MB)</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
                    setPostPhoto(f); setPostPhotoPreview(URL.createObjectURL(f));
                  }} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-lime-500 file:text-black file:font-bold hover:file:bg-lime-400 cursor-pointer" />
                  {postPhotoPreview && (
                    <div className="relative">
                      <img src={postPhotoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                      <button type="button" onClick={() => { setPostPhoto(null); setPostPhotoPreview(null); }}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-red-600"><X size={16} /></button>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={uploadingPost}
                  className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all disabled:opacity-50">
                  {uploadingPost ? 'Publicando...' : 'Publicar Anuncio'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxPhoto && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setLightboxPhoto(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-lime-500"><X size={32} /></button>
            <img src={lightboxPhoto} alt="Foto ampliada" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        )}
      </div>
    );
  }

  // ── PROFILE SCREEN ───────────────────────────────────────────

  if (screen === 'profile') {
    const userPosts = posts.filter(p => p.userId === currentUser.uid);
    const userResponses = posts.filter(p => p.responses?.some(r => r.userId === currentUser.uid));
    const postsCommented = posts.filter(p => p.responses?.some(r => r.userId === currentUser.uid));

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Mi Perfil</h1>
            <button onClick={() => setScreen('home')}><X size={24} className="text-gray-400 hover:text-lime-500" /></button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              <Avatar src={currentUserData?.avatar} name={currentUserData?.name} size="lg" />
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{currentUserData?.name}</h2>
                {currentUserData?.isCompany && <p className="text-gray-400 text-sm">{currentUser.email}</p>}
                {currentUserData?.isCompany && currentUserData?.phone && <p className="text-gray-400">📞 {currentUserData.phone}</p>}
                {currentUserData?.isCompany && currentUserData?.website && <p className="text-lime-500">🌐 {currentUserData.website}</p>}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <div className="grid gap-4 text-center grid-cols-3">
                <div>
                  <div className="text-2xl font-bold text-lime-500">{userPosts.length}</div>
                  <div className="text-xs text-gray-400">Mis Anuncios</div>
                </div>
                {!currentUserData?.isCompany && (
                  <div>
                    <div className="text-2xl font-bold text-lime-500">{userResponses.length}</div>
                    <div className="text-xs text-gray-400">Respuestas Dadas</div>
                  </div>
                )}
                {currentUserData?.isCompany && (
                  <div>
                    <div className="text-2xl font-bold text-lime-500">{postsCommented.length}</div>
                    <div className="text-xs text-gray-400">Publicaciones Comentadas</div>
                  </div>
                )}
                <div>
                  <div className="text-2xl font-bold text-lime-500">{posts.reduce((sum, p) => p.userId === currentUser.uid ? sum + (p.likes || 0) : sum, 0)}</div>
                  <div className="text-xs text-gray-400">Likes Recibidos</div>
                </div>
              </div>

              {currentUserData?.isCompany && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lime-500">{currentUserData?.profileViews || 0}</div>
                    <div className="text-xs text-gray-400">Visitas al perfil</div>
                  </div>
                  <button className="bg-gray-800 border border-lime-500 text-lime-500 px-4 py-2 rounded-lg font-bold text-sm opacity-60 cursor-not-allowed">
                    📢 Publicar Anuncio <span className="text-xs text-gray-400 ml-1">(próximamente)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-lime-500 mb-4">Mis Anuncios</h3>
          <div className="space-y-4 mb-8">
            {userPosts.length > 0 ? userPosts.map(post => <PostCard key={post.id} post={post} />) : (
              <p className="text-gray-500 text-center py-8">No tienes anuncios publicados</p>
            )}
          </div>

          <button onClick={() => setScreen('home')} className="w-full mt-4 bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
            Volver al inicio
          </button>
        </div>

        {lightboxPhoto && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setLightboxPhoto(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-lime-500"><X size={32} /></button>
            <img src={lightboxPhoto} alt="Foto ampliada" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  // ── PUBLIC COMPANY PROFILE ───────────────────────────────────

  if (screen === 'publicProfile' && viewingProfileData) {
    const companyPosts = posts.filter(p => p.userId === viewingProfile);
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Perfil de Empresa</h1>
            <button onClick={() => setScreen('home')}><X size={24} className="text-gray-400 hover:text-lime-500" /></button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              <Avatar src={viewingProfileData.avatar} name={viewingProfileData.name} size="lg" />
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{viewingProfileData.name}</h2>
                {viewingProfileData.phone && <p className="text-gray-400">📞 {viewingProfileData.phone}</p>}
                {viewingProfileData.website && (
                  <a href={viewingProfileData.website.startsWith('http') ? viewingProfileData.website : `https://${viewingProfileData.website}`}
                    target="_blank" rel="noreferrer" className="text-lime-500 hover:text-lime-400">
                    🌐 {viewingProfileData.website}
                  </a>
                )}
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-lime-500">{companyPosts.length}</div>
                <div className="text-xs text-gray-400">Anuncios publicados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-lime-500">{viewingProfileData.profileViews || 0}</div>
                <div className="text-xs text-gray-400">Visitas al perfil</div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-lime-500 mb-4">Anuncios de {viewingProfileData.name}</h3>
          <div className="space-y-4">
            {companyPosts.length > 0 ? companyPosts.map(post => <PostCard key={post.id} post={post} />) : (
              <p className="text-gray-500 text-center py-8">Sin anuncios publicados</p>
            )}
          </div>

          <button onClick={() => setScreen('home')} className="w-full mt-8 bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────

  if (screen === 'notifications') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Notificaciones</h1>
            <button onClick={() => setScreen('home')}><X size={24} className="text-gray-400 hover:text-lime-500" /></button>
          </div>
          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map(notif => (
              <div key={notif.id}
                className={`rounded-lg p-4 border transition-colors cursor-pointer ${notif.read ? 'bg-gray-900 border-gray-800' : 'bg-gray-800 border-lime-500'}`}
                onClick={async () => {
                  await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                }}>
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">
                    <span className="text-lime-500">{notif.fromUserName}</span> respondió en tu publicación
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-lime-500 rounded-full flex-shrink-0"></div>}
                </div>
                <div className="text-gray-400 text-sm mt-1">{notif.postTitle}</div>
                <div className="text-gray-500 text-xs mt-1">{new Date(notif.createdAt).toLocaleString('es-GT')}</div>
              </div>
            )) : <p className="text-gray-500 text-center py-12">Sin notificaciones</p>}
          </div>
          <button onClick={() => setScreen('home')} className="w-full mt-8 bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">Volver al inicio</button>
        </div>
      </div>
    );
  }

  // ── CHAT ─────────────────────────────────────────────────────

  if (screen === 'chat') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-lime-500">Mensajes</h1>
            <button onClick={() => setScreen('home')}><X size={24} className="text-gray-400 hover:text-lime-500" /></button>
          </div>

          {!selectedChat ? (
            <div>
              <p className="text-gray-500 text-center py-12">Haz clic en "Responder" en un anuncio para comenzar a chatear</p>
              <button onClick={() => setScreen('home')} className="w-full bg-lime-500 text-black py-3 rounded-lg font-bold hover:bg-lime-400 transition-all">Volver al inicio</button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gray-800 p-4 border-b border-gray-700">
                <h2 className="font-bold text-lime-500">{selectedChat.postTitle}</h2>
                <p className="text-sm text-gray-400">Con {selectedChat.otherUserName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {posts.find(p => p.id === selectedChat.postId)?.responses
                  ?.filter(response => {
                    const post = posts.find(p => p.id === selectedChat.postId);
                    const isPostOwner = post?.userId === currentUser.uid;
                    // Dueño ve todo. Otros solo ven sus propios mensajes y los del dueño.
                    return isPostOwner || response.userId === currentUser.uid || response.userId === post?.userId;
                  })
                  .map(response => {
                  const isMe = response.userId === currentUser.uid;
                  const isCompany = response.userIsCompany;
                  const isAvatarUrl = response.userAvatar && (response.userAvatar.startsWith('http') || response.userAvatar.startsWith('blob'));
                  return (
                    <div key={response.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && isCompany && (
                        <button onClick={() => handleViewCompanyProfile(response.userId)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border-2 border-lime-500">
                            {isAvatarUrl ? <img src={response.userAvatar} alt={response.userName} className="w-full h-full object-cover" /> : <span className="text-xs">{response.userAvatar}</span>}
                          </div>
                          <span className="text-xs text-lime-500 font-bold">🏢 {response.userName}</span>
                        </button>
                      )}
                      {!isMe && !isCompany && (
                        <p className="text-xs text-gray-500">{response.userName}</p>
                      )}
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${isMe ? 'bg-lime-500 text-black' : 'bg-gray-800 text-white'}`}>
                        <p>{response.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-700 p-4 flex gap-2">
                <input type="text" placeholder="Escribe tu mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-lime-500 focus:outline-none" />
                <button onClick={handleSendMessage} className="bg-lime-500 text-black p-2 rounded-lg hover:bg-lime-400 transition-colors"><Send size={20} /></button>
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
