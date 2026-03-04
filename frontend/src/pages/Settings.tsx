import { Bell, Lock, User, Building, ShieldCheck, Mail, Save, X, ChevronRight, UploadCloud, UserCircle, Camera, Phone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpdatePasswordModal from '../components/UpdatePasswordModal';

export default function Settings() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [establishment, setEstablishment] = useState('Kof Company');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setEstablishment(user.establishment || 'Kof Company');
      if (user.avatar_url) {
        setAvatarPreview(`${import.meta.env.VITE_API_URL}${user.avatar_url}`);
      }
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setMessage(null);
    // This check will now be handled by the modal before calling this function
    // if (!passwordConfirm) {
    //   setMessage({ type: 'error', text: 'Veuillez saisir votre mot de passe pour confirmer les modifications.' });
    //   return;
    // }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          establishment: establishment,
          password: passwordConfirm // passwordConfirm will be set by the modal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la mise à jour du profil.');
      }

      const data = await response.json();
      let updatedUser = data.user_info;

      // 2. Upload Avatar si un fichier a été sélectionné
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const avatarResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Ne pas mettre de Content-Type avec FormData, le navigateur gère le boundary Multipart
          },
          body: formData
        });

        if (!avatarResponse.ok) {
          throw new Error("Le profil a été mis à jour mais l'image a échoué.");
        }

        const avatarData = await avatarResponse.json();
        updatedUser.avatar_url = avatarData.avatar_url;
      }

      // Mettre à jour le contexte global 
      if (token) {
        login(token, updatedUser, false);
      }

      setShowPasswordModal(false);
      setPasswordConfirm('');
      setSelectedFile(null);
      setMessage(null);
      setShowSuccessModal(true);

      // Auto-fermeture du success modal après 2.5s (optionnel)
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2500);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in text-left">

      {/* HEADER PRINCIPAL */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
          Paramètre <span className="font-semibold text-slate-900 dark:text-white">du compte</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Gérez votre compte, votre sécurité et vos préférences d'application.
        </p>
      </div>

      {message && !showPasswordModal && (
        <div className={`p-4 mb-8 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-16">

        {/* SECTION PROFIL : TEXTE À GAUCHE / INPUTS À DROITE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Profil</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Vos informations publiques et l'adresse email utilisée pour les communications officielles.
              {user?.role === 'ANALYST' && (
                <span className="block mt-2 text-rose-500/80 font-bold">
                  En tant qu'analyste, veuillez contacter un Administrateur pour modifier votre nom ou adresse email.
                </span>
              )}
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Photo de profil</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG ou WEBP. 1MB max.</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={user?.role === 'ANALYST'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={user?.role === 'ANALYST'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={user?.role === 'ANALYST'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden p-6 gap-4 flex items-center">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Droits de votre compte</h3>
                <p className="text-xs text-slate-500 font-medium">Vous êtes actuellement connecté en tant que <span className="text-blue-600 font-bold uppercase">{user?.role === 'SUPER_ADMIN' ? 'Super Administrateur' : user?.role === 'ADMIN' ? 'Administrateur' : 'Analyste'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION NOTIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Préférences</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Contrôlez les notifications et les rapports que vous recevez.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Alertes d'IA</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Rapports Hebdo</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION SÉCURITÉ & ORGANISATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Accès & Sécurité</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Sécurisez votre compte et gérez l'affiliation de votre établissement.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">Établissement</h3>
              <input
                type="text"
                value={establishment}
                onChange={(e) => setEstablishment(e.target.value)}
                disabled={user?.role !== 'SUPER_ADMIN'}
                className="w-full mb-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Licence Pro
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-tighter">Mot de passe</h3>
              <p className="text-xs text-slate-500 mb-4">La sécurité de votre compte est primordiale.</p>
              <button
                onClick={() => setShowUpdatePasswordModal(true)}
                className="flex items-center justify-between w-full text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                title="Sera redirigé vers l'écran de modification."
              >
                Modifier maintenant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ACTION BAR : FLOTTANTE OU FIXE EN BAS */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
        <button
          onClick={() => {
            if (user) {
              setFirstName(user.first_name || '');
              setLastName(user.last_name || '');
              setEmail(user.email || '');
              setEstablishment(user.establishment || 'Kof Company');
            }
            setMessage(null);
          }}
          className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
        >
          Annuler
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="px-8 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg font-bold text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Enregistrer les changements
        </button>
      </div>

      {/* MODAL : CONFIRMATION MOT DE PASSE */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Confirmation de sécurité
              </h3>
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordConfirm(''); setMessage(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Veuillez saisir votre mot de passe pour enregistrer ces modifications de profil en toute sécurité.
              </p>

              {message && message.type === 'error' && (
                <div className="p-3 mb-4 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {message.text}
                </div>
              )}

              <input
                type="password"
                placeholder="Votre mot de passe"
                value={passwordConfirm}
                autoFocus
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveProfile();
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordConfirm(''); setMessage(null); }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading || !passwordConfirm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? 'Vérification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : SUCCÈS */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-8 text-center animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Profil mis à jour</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Vos informations ont été enregistrées avec succès.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* MODAL : UPDATE PASSWORD MANUALLY */}
      <UpdatePasswordModal
        isOpen={showUpdatePasswordModal}
        onClose={() => setShowUpdatePasswordModal(false)}
      />
    </div>
  );
}