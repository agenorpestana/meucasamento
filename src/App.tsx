import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  Gift, 
  Settings, 
  Layout as LayoutIcon, 
  LogOut, 
  Plus, 
  Calendar, 
  MapPin, 
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  QrCode,
  Trash2,
  Upload,
  ArrowLeft,
  Mail,
  MessageCircle,
  CreditCard,
  Sparkles,
  Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, Type } from "@google/genai";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatDateForDisplay = (dateStr: string | null) => {
  if (!dateStr) return 'Data a definir';
  // Avoid timezone shift by splitting and using parts
  const [year, month, day] = dateStr.split(/[-/T]/);
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

const formatDateForInput = (dateStr: string | null) => {
  if (!dateStr) return '';
  // Ensure it's in YYYY-MM-DD format for the input
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr.split('T')[0];
  return date.toISOString().split('T')[0];
};

// --- API HELPERS ---
const API_URL = '';
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// --- COMPONENTS ---

const WeddingInvitation = ({ wedding, templateId, invitationText, onRsvpClick, onGiftsClick }: { 
  wedding: any, 
  templateId: number, 
  invitationText: string,
  onRsvpClick?: () => void,
  onGiftsClick?: () => void
}) => {
  const templates = [
    { id: 1, name: 'Clássico Elegante', bg: 'bg-stone-50', text: 'text-stone-900', font: 'font-serif', border: 'border-stone-200' },
    { id: 2, name: 'Moderno Minimalista', bg: 'bg-white', text: 'text-zinc-900', font: 'font-sans', border: 'border-zinc-100' },
    { id: 3, name: 'Rústico Floral', bg: 'bg-emerald-50', text: 'text-emerald-900', font: 'font-serif', border: 'border-emerald-100' },
    { id: 4, name: 'Noite Estelar', bg: 'bg-indigo-950', text: 'text-white', font: 'font-serif', border: 'border-indigo-800' },
    { id: 5, name: 'Praia Tropical', bg: 'bg-sky-50', text: 'text-cyan-900', font: 'font-serif', border: 'border-sky-200', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
    { id: 6, name: 'Luxo Black', bg: 'bg-zinc-900', text: 'text-amber-400', font: 'font-serif', border: 'border-amber-900/50' },
    { id: 7, name: 'Clean Light', bg: 'bg-zinc-50', text: 'text-zinc-500', font: 'font-sans', border: 'border-zinc-200' },
  ];

  const tpl = templates.find(t => Number(t.id) === Number(templateId)) || templates[0];

  return (
    <div className={cn(
      "w-full max-w-md mx-auto min-h-[550px] md:aspect-[9/16] p-4 md:p-8 flex flex-col items-center justify-center text-center relative shadow-2xl rounded-3xl overflow-hidden",
      tpl.bg, tpl.text, tpl.font
    )}>
      {tpl.bgImage && (
        <div className="absolute inset-0 opacity-30 z-0">
          <img src={tpl.bgImage} className="w-full h-full object-cover" alt="bg" />
        </div>
      )}
      <div className={cn(
        "relative z-10 border-2 border-current p-4 md:p-8 w-full h-full flex flex-col items-center justify-center rounded-2xl",
        tpl.border
      )}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center w-full"
        >
          <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] mb-2 md:mb-4 opacity-70">Convite de Casamento</p>
          <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 leading-tight">{wedding.couple_names}</h1>
          <div className="w-12 h-px bg-current my-2 md:my-4 opacity-50" />
          <p className="text-sm md:text-lg mb-4 md:mb-8 italic leading-relaxed px-2 md:px-4">
            {invitationText || 'Juntamente com suas famílias convidam para o seu casamento a ser realizado dia'}
          </p>
          <p className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
            {formatDateForDisplay(wedding.wedding_date)}
          </p>
          <p className="text-[10px] md:text-sm opacity-80 mb-6 md:mb-12">{wedding.location || 'Local a definir'}</p>
          
          <div className="flex flex-col gap-2 md:gap-3 w-full px-2 md:px-4">
            <button 
              onClick={onGiftsClick}
              style={{ borderColor: wedding.theme_color || undefined }}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-6 rounded-full border-2 font-bold transition-all text-sm",
                tpl.id === 4 || tpl.id === 6 
                  ? "hover:bg-white hover:text-zinc-900" 
                  : "hover:bg-rose-500 hover:text-white hover:border-rose-500",
                !wedding.theme_color && tpl.border
              )}
            >
              <Gift size={18} />
              Lista de Presentes
            </button>
            <button 
              onClick={onRsvpClick}
              style={{ backgroundColor: wedding.theme_color || undefined }}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold transition-all text-sm shadow-md",
                tpl.id === 4 || tpl.id === 6 
                  ? "bg-white text-zinc-900 hover:bg-zinc-100" 
                  : "bg-rose-500 text-white hover:bg-rose-600"
              )}
            >
              <CheckCircle size={18} />
              Confirmar Presença
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <Heart className="fill-current" />
          <span>MeuCasamento</span>
        </Link>
        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link to="/dashboard" className="text-zinc-600 hover:text-rose-500 transition-colors">Painel</Link>
              <button onClick={logout} className="flex items-center gap-1 text-zinc-600 hover:text-rose-500 transition-colors">
                <LogOut size={18} />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-zinc-600 hover:text-rose-500 transition-colors">Entrar</Link>
              <Link to="/register" className="bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600 transition-colors">Criar Site</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- PAGES ---

const LandingPage = () => (
  <div className="pt-16">
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-20"
          alt="Wedding background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>
      <div className="relative z-10 text-center max-w-3xl px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif font-bold text-zinc-900 mb-6"
        >
          Seu casamento merece um site <span className="text-rose-500 italic">encantador</span>.
        </motion.h1>
        <p className="text-xl text-zinc-600 mb-8">
          Crie seu site personalizado, gerencie convidados e sua lista de presentes em um só lugar.
        </p>
        <Link to="/register" className="bg-rose-500 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-200">
          Começar agora gratuitamente
        </Link>
      </div>
    </section>

    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
        {[
          { icon: LayoutIcon, title: "Design Moderno", desc: "Templates elegantes e responsivos para todos os estilos." },
          { icon: Gift, title: "Lista de Presentes", desc: "Receba presentes em dinheiro de forma simples e segura." },
          { icon: Users, title: "Gestão de Convidados", desc: "Confirmação de presença (RSVP) online e lista de convidados." }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
            <feature.icon className="text-rose-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-zinc-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const AuthPage = ({ type }: { type: 'login' | 'register' }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
        <div className="text-center mb-8">
          <Heart className="mx-auto text-rose-500 mb-2" size={40} />
          <h2 className="text-3xl font-serif font-bold">{type === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-rose-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-rose-500 outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-rose-500 outline-none"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          {error && <p className="text-rose-500 text-sm">{error}</p>}
          <button className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors">
            {type === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <p className="text-center mt-6 text-zinc-600">
          {type === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          <Link to={type === 'login' ? '/register' : '/login'} className="text-rose-500 font-bold ml-1">
            {type === 'login' ? 'Cadastre-se' : 'Faça login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [wedding, setWedding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const fetchWedding = () => {
    fetch('/api/wedding/me', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setWedding(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWedding();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  if (!wedding) {
    return (
      <div className="pt-24 max-w-2xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 text-center">
          <Heart className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-4">Crie seu site de casamento</h2>
          <p className="text-zinc-600 mb-8">Você ainda não tem um site criado. Vamos começar agora?</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const res = await fetch('/api/wedding', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(Object.fromEntries(formData))
            });
            if (res.ok) window.location.reload();
          }} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Casal</label>
              <input name="couple_names" required placeholder="Ex: Maria & João" className="w-full px-4 py-2 rounded-lg border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL Personalizada (slug)</label>
              <div className="flex items-center">
                <span className="bg-zinc-100 px-3 py-2 border border-r-0 rounded-l-lg text-zinc-500 text-sm">meucasamento.com/</span>
                <input name="slug" required placeholder="maria-e-joao" className="w-full px-4 py-2 rounded-r-lg border outline-none" />
              </div>
            </div>
            <button className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold">Criar meu site</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          {[
            { id: 'overview', icon: LayoutIcon, label: 'Visão Geral' },
            { id: 'guests', icon: Users, label: 'Convidados' },
            { id: 'invitation', icon: Mail, label: 'Convite' },
            { id: 'gifts', icon: Gift, label: 'Presentes' },
            { id: 'gallery', icon: ImageIcon, label: 'Galeria' },
            { id: 'settings', icon: Settings, label: 'Configurações' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === item.id ? "bg-rose-500 text-white shadow-lg shadow-rose-100" : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <a 
            href={`/w/${wedding.slug}`} 
            target="_blank" 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium"
          >
            <ExternalLink size={20} />
            Ver Site Público
          </a>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'overview' && <DashboardOverview wedding={wedding} />}
          {activeTab === 'guests' && <GuestManager wedding={wedding} />}
          {activeTab === 'invitation' && <WeddingInvitations wedding={wedding} onUpdate={fetchWedding} />}
          {activeTab === 'gifts' && <GiftManager wedding={wedding} />}
          {activeTab === 'gallery' && <PhotoManager wedding={wedding} />}
          {activeTab === 'settings' && <WeddingSettings wedding={wedding} />}
        </div>
      </div>
    </div>
  );
};

const DashboardOverview = ({ wedding }: { wedding: any }) => {
  const [stats, setStats] = useState({ guests: 0, confirmed: 0, gifts: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/guests', { headers: getAuthHeaders() }).then(r => r.json()),
      fetch('/api/gifts', { headers: getAuthHeaders() }).then(r => r.json())
    ]).then(([guests, gifts]) => {
      setStats({
        guests: guests.length,
        confirmed: guests.filter((g: any) => g.status === 'confirmed').length,
        gifts: gifts.length
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <p className="text-zinc-500 text-sm font-medium mb-1">Total de Convidados</p>
          <p className="text-3xl font-bold">{stats.guests}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <p className="text-zinc-500 text-sm font-medium mb-1">Confirmados (RSVP)</p>
          <p className="text-3xl font-bold text-emerald-500">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <p className="text-zinc-500 text-sm font-medium mb-1">Itens na Lista</p>
          <p className="text-3xl font-bold text-rose-500">{stats.gifts}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
        <h3 className="text-xl font-bold mb-4">Seu Casamento: {wedding.couple_names}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-zinc-600">
              <Calendar size={18} />
              <span>{formatDateForDisplay(wedding.wedding_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
              <MapPin size={18} />
              <span>{wedding.location || 'Local não definido'}</span>
            </div>
          </div>
      </div>
    </div>
  );
};

const GuestManager = ({ wedding }: { wedding: any }) => {
  const [guests, setGuests] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const fetchGuests = () => {
    fetch('/api/guests', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setGuests);
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleAddGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) {
      setShowAdd(false);
      fetchGuests();
    }
  };

  const sendWhatsApp = (guest: any) => {
    const message = `Olá ${guest.name}! Você foi convidado para o nosso casamento. Veja o convite e confirme sua presença aqui: ${window.location.origin}/w/${wedding.slug}. Seu código de acesso é: ${guest.token}`;
    const url = `https://api.whatsapp.com/send?phone=${guest.phone?.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendEmail = async (guest: any) => {
    if (!wedding.smtp_host) {
      alert('Por favor, configure o e-mail de envio nas configurações primeiro.');
      return;
    }
    const res = await fetch(`/api/guests/${guest.id}/send-email`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      alert('E-mail enviado com sucesso!');
    } else {
      const data = await res.json();
      alert(`Erro ao enviar e-mail: ${data.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Lista de Convidados</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-600 transition-colors"
        >
          <Plus size={18} />
          Adicionar Convidado
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
          <form onSubmit={handleAddGuest} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input name="name" required className="w-full px-4 py-2 rounded-lg border" placeholder="Nome do convidado" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail (opcional)</label>
              <input name="email" type="email" className="w-full px-4 py-2 rounded-lg border" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone (opcional)</label>
              <input name="phone" className="w-full px-4 py-2 rounded-lg border" placeholder="(00) 00000-0000" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold">Gerar Convite</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-zinc-100 text-zinc-600 px-6 py-2 rounded-lg font-bold">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Token (Código)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {guests.map((guest, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium">{guest.name}</td>
                  <td className="px-6 py-4">
                    <code className="bg-zinc-100 px-2 py-1 rounded text-rose-600 font-bold">{guest.token}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      guest.status === 'confirmed' ? "bg-emerald-100 text-emerald-600" :
                      guest.status === 'declined' ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'declined' ? 'Recusado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{guest.phone || guest.email || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => sendWhatsApp(guest)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button 
                        onClick={() => sendEmail(guest)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Enviar por E-mail"
                      >
                        <Mail size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Nenhum convidado adicionado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GiftManager = ({ wedding }: { wedding: any }) => {
  const [gifts, setGifts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [genFilters, setGenFilters] = useState({
    category: 'all',
    minPrice: 0,
    maxPrice: 10000,
    quantity: 10
  });

  const fetchGifts = () => {
    fetch('/api/gifts', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setGifts);
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === gifts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(gifts.map(g => g.id));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) return;

    try {
      const res = await fetch('/api/gifts', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchGifts();
      }
    } catch (err) {
      alert('Erro ao excluir itens');
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Sugestões de presentes de casamento na categoria ${genFilters.category} com preço entre R$ ${genFilters.minPrice} e R$ ${genFilters.maxPrice}. Retorne ${genFilters.quantity} itens.
      Retorne APENAS um JSON no formato: [{"name": "string", "price": number, "description": "string"}]`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "price", "description"]
            }
          }
        }
      });

      const rawGifts = JSON.parse(result.text);
      const giftsWithImages = rawGifts.map((g: any) => ({
        ...g,
        image_url: `https://picsum.photos/seed/${encodeURIComponent(g.name)}/400/400`
      }));

      // Bulk add the suggestions
      const bulkRes = await fetch('/api/gifts/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gifts: giftsWithImages })
      });
      if (bulkRes.ok) {
        setShowGenOptions(false);
        fetchGifts();
      } else {
        const bulkData = await bulkRes.json();
        alert(bulkData.error || 'Erro ao salvar sugestões');
      }
    } catch (err: any) {
      console.error('Erro na geração Gemini:', err);
      alert('Erro ao gerar sugestões: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setGenerating(false);
    }
  };

  const searchExternalGifts = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Você é um assistente de lista de presentes de casamento. 
      O usuário quer buscar por: "${searchQuery}".
      Retorne uma lista de 6 sugestões de presentes reais que poderiam ser encontrados em grandes lojas brasileiras (Mercado Livre, Magalu, Casas Bahia, Amazon Brasil).
      Para cada item, forneça: nome, preço aproximado em reais (apenas o número), e uma descrição curta.
      Importante: Tente sugerir itens que façam sentido para um casamento.
      Retorne APENAS um JSON no formato: [{"name": "string", "price": number, "description": "string"}]`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "price", "description"]
            }
          }
        }
      });

      const rawGifts = JSON.parse(result.text);
      const giftsWithImages = rawGifts.map((g: any) => ({
        ...g,
        image_url: `https://picsum.photos/seed/${encodeURIComponent(g.name)}/400/400`
      }));
      setSearchResults(giftsWithImages);
    } catch (err: any) {
      console.error('Erro na busca Gemini:', err);
      alert('Erro na busca: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSearching(false);
    }
  };

  const addGiftFromSearch = async (gift: any) => {
    try {
      const res = await fetch('/api/gifts/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gifts: [gift] })
      });
      if (res.ok) {
        setSearchResults(prev => prev.filter(g => g.name !== gift.name));
        fetchGifts();
      }
    } catch (err) {
      alert('Erro ao adicionar presente');
    }
  };

  const handleGiftSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const url = editingGift ? `/api/gifts/${editingGift.id}` : '/api/gifts';
    const method = editingGift ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setShowAdd(false);
      setEditingGift(null);
      fetchGifts();
    }
  };

  const deleteGift = async (id: number) => {
    if (!confirm('Deseja excluir este presente?')) return;
    const res = await fetch(`/api/gifts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) fetchGifts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">Lista de Presentes</h3>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={bulkDelete}
              className="bg-rose-100 text-rose-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-200 transition-colors"
            >
              <Trash2 size={18} />
              Excluir Selecionados ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => setShowGenOptions(true)}
            className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <Sparkles size={18} className="text-rose-500" />
            Sugestões Inteligentes
          </button>
          <button 
            onClick={() => { setEditingGift(null); setShowAdd(true); }}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-600 transition-colors"
          >
            <Plus size={18} />
            Adicionar Presente
          </button>
        </div>
      </div>

      {/* Busca Externa */}
      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
          <Search size={16} className="text-blue-500" /> Buscar em Grandes Lojas (ML, Magalu, Amazon...)
        </h4>
        <div className="flex gap-2">
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchExternalGifts()}
            placeholder="Ex: Jogo de panelas Tramontina, Smart TV 50 polegadas..."
            className="flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={searchExternalGifts}
            disabled={searching}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? 'Buscando...' : <><Search size={18} /> Buscar</>}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col shadow-sm">
                <img src={result.image_url} className="w-full h-32 object-cover rounded-lg mb-3" alt={result.name} />
                <h4 className="font-bold text-sm mb-1 line-clamp-1">{result.name}</h4>
                <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{result.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-blue-600">R$ {result.price.toLocaleString('pt-BR')}</span>
                  <button 
                    onClick={() => addGiftFromSearch(result)}
                    className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Geração */}
      <AnimatePresence>
        {showGenOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full"
            >
              <h4 className="text-xl font-bold mb-6">Opções de Geração</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select 
                    value={genFilters.category}
                    onChange={e => setGenFilters({...genFilters, category: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="eletrodomesticos">Eletrodomésticos</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="cama_mesa_banho">Cama, Mesa e Banho</option>
                    <option value="decoracao">Decoração</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Mín (R$)</label>
                    <input 
                      type="number" 
                      value={genFilters.minPrice}
                      onChange={e => setGenFilters({...genFilters, minPrice: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Máx (R$)</label>
                    <input 
                      type="number" 
                      value={genFilters.maxPrice}
                      onChange={e => setGenFilters({...genFilters, maxPrice: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade de Itens</label>
                  <input 
                    type="number" 
                    min="1"
                    max="50"
                    value={genFilters.quantity}
                    onChange={e => setGenFilters({...genFilters, quantity: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border"
                  />
                </div>
                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={generateSuggestions}
                    disabled={generating}
                    className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {generating ? 'Gerando...' : 'Gerar Agora'}
                  </button>
                  <button 
                    onClick={() => setShowGenOptions(false)}
                    className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(showAdd || editingGift) && (
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingGift ? 'Editar Presente' : 'Novo Presente'}</h4>
          <form onSubmit={handleGiftSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome do Presente</label>
              <input name="name" required defaultValue={editingGift?.name} className="w-full px-4 py-2 rounded-lg border" placeholder="Ex: Jogo de Panelas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço Sugerido (R$)</label>
              <input name="price" type="number" step="0.01" defaultValue={editingGift?.price} className="w-full px-4 py-2 rounded-lg border" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL da Imagem (opcional)</label>
              <input name="image_url" defaultValue={editingGift?.image_url} className="w-full px-4 py-2 rounded-lg border" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
              <button type="button" onClick={() => { setShowAdd(false); setEditingGift(null); }} className="bg-zinc-100 text-zinc-600 px-6 py-2 rounded-lg font-bold">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {gifts.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <input 
            type="checkbox" 
            checked={selectedIds.length === gifts.length}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-zinc-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm font-medium text-zinc-600">Selecionar Todos</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map((gift, i) => (
          <div key={i} className={cn(
            "bg-white rounded-2xl border transition-all overflow-hidden relative group",
            selectedIds.includes(gift.id) ? "border-rose-500 ring-2 ring-rose-100" : "border-zinc-100 shadow-sm"
          )}>
            <div className="absolute top-2 left-2 z-10">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(gift.id)}
                onChange={() => toggleSelect(gift.id)}
                className="w-5 h-5 rounded border-zinc-300 text-rose-500 focus:ring-rose-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <img 
              src={gift.image_url || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=400'} 
              className="w-full h-40 object-cover"
              alt={gift.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=400';
              }}
            />
            <div className="p-4">
              <h4 className="font-bold mb-1">{gift.name}</h4>
              <p className="text-rose-500 font-bold">R$ {Number(gift.price || 0).toFixed(2)}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => setEditingGift(gift)}
                className="bg-white/90 p-2 rounded-full text-zinc-600 hover:bg-zinc-100 transition-all shadow-sm"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={() => deleteGift(gift.id)}
                className="bg-white/90 p-2 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {gifts.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            Nenhum presente na lista ainda. Use o botão acima para gerar sugestões ou adicione manualmente.
          </div>
        )}
      </div>
    </div>
  );
};

const WeddingInvitations = ({ wedding, onUpdate }: { wedding: any, onUpdate: () => void }) => {
  const templates = [
    { id: 1, name: 'Clássico Elegante', bg: 'bg-stone-50', text: 'text-stone-900', font: 'font-serif', border: 'border-stone-200' },
    { id: 2, name: 'Moderno Minimalista', bg: 'bg-white', text: 'text-zinc-900', font: 'font-sans', border: 'border-zinc-100' },
    { id: 3, name: 'Rústico Floral', bg: 'bg-emerald-50', text: 'text-emerald-900', font: 'font-serif', border: 'border-emerald-100' },
    { id: 4, name: 'Noite Estelar', bg: 'bg-indigo-950', text: 'text-white', font: 'font-serif', border: 'border-indigo-800' },
    { id: 5, name: 'Praia Tropical', bg: 'bg-sky-50', text: 'text-cyan-900', font: 'font-serif', border: 'border-sky-200', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
    { id: 6, name: 'Luxo Black', bg: 'bg-zinc-900', text: 'text-amber-400', font: 'font-serif', border: 'border-amber-900/50' },
    { id: 7, name: 'Clean Light', bg: 'bg-zinc-50', text: 'text-zinc-500', font: 'font-sans', border: 'border-zinc-200' },
  ];

  const [invitationText, setInvitationText] = useState(wedding.invitation_text || 'Juntamente com suas famílias convidam para o seu casamento a ser realizado dia');

  const saveText = async () => {
    const res = await fetch('/api/wedding', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invitation_text: invitationText })
    });
    if (res.ok) {
      onUpdate();
      alert('Texto do convite salvo!');
    }
  };

  const selectTemplate = async (id: number) => {
    const res = await fetch('/api/wedding', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invitation_template_id: id })
    });
    if (res.ok) {
      onUpdate();
      alert('Modelo selecionado com sucesso!');
    }
  };

  const currentTemplate = templates.find(t => t.id === wedding.invitation_template_id) || templates[0];

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Personalizar Texto do Convite</h3>
            <div className="space-y-4">
              <textarea 
                value={invitationText}
                onChange={(e) => setInvitationText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border min-h-[150px] font-serif italic"
                placeholder="Digite o texto do convite..."
              />
              <button 
                onClick={saveText}
                className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-600 transition-colors"
              >
                Salvar Texto
              </button>
            </div>
          </div>

          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <h3 className="text-lg font-bold text-rose-900 mb-2">Dica do MeuCasamento</h3>
            <p className="text-rose-700 text-sm">
              O modelo escolhido aqui será aplicado automaticamente ao seu site público e aos convites enviados por e-mail e WhatsApp.
              Os nomes e a data são atualizados automaticamente a partir das suas configurações.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-widest">Pré-visualização do Convite</p>
          <div className="scale-75 origin-top">
            <WeddingInvitation 
              wedding={wedding} 
              templateId={wedding.invitation_template_id} 
              invitationText={invitationText}
            />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mt-12 mb-6">Escolha um Modelo</h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((tpl) => (
          <div 
            key={tpl.id}
            className={`relative group cursor-pointer rounded-2xl overflow-hidden border-4 transition-all ${
              wedding.invitation_template_id === tpl.id ? 'border-rose-500' : 'border-transparent hover:border-rose-200'
            }`}
            onClick={() => selectTemplate(tpl.id)}
          >
            <div className={`aspect-[3/4] p-4 flex flex-col items-center justify-center text-center relative ${tpl.bg} ${tpl.text} ${tpl.font}`}>
              {tpl.bgImage && (
                <div className="absolute inset-0 opacity-20 z-0">
                  <img src={tpl.bgImage} className="w-full h-full object-cover" alt="bg" />
                </div>
              )}
              <div className={`relative z-10 border border-current p-4 w-full h-full flex flex-col items-center justify-center ${tpl.border}`}>
                <p className="text-[8px] uppercase tracking-widest mb-1 opacity-70">Convite</p>
                <h4 className="text-sm font-bold mb-1 leading-tight">{wedding.couple_names}</h4>
                <div className="w-6 h-px bg-current my-1 opacity-50" />
                <p className="text-[10px] font-bold">{formatDateForDisplay(wedding.wedding_date)}</p>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2 text-center">
              <span className="font-bold text-[10px]">{tpl.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
        <h3 className="text-xl font-bold text-rose-900 mb-2">Dica do MeuCasamento</h3>
        <p className="text-rose-700">
          O modelo escolhido aqui será aplicado automaticamente ao seu site público e aos convites enviados por e-mail e WhatsApp.
          Os nomes e a data são atualizados automaticamente a partir das suas configurações.
        </p>
      </div>
    </div>
  );
};

const WeddingSettings = ({ wedding }: { wedding: any }) => {
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/wedding', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) alert('Configurações salvas!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
        <h3 className="text-xl font-bold mb-6">Editar Conteúdo do Site</h3>
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Casal</label>
              <input name="couple_names" defaultValue={wedding.couple_names} className="w-full px-4 py-2 rounded-lg border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data do Casamento</label>
              <input name="wedding_date" type="date" defaultValue={formatDateForInput(wedding.wedding_date)} className="w-full px-4 py-2 rounded-lg border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Limite RSVP</label>
              <input name="rsvp_deadline" type="date" defaultValue={formatDateForInput(wedding.rsvp_deadline)} className="w-full px-4 py-2 rounded-lg border" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Local do Evento</label>
            <input name="location" defaultValue={wedding.location} className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nossa História</label>
            <textarea name="story" defaultValue={wedding.story} rows={5} className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cor do Tema (Destaque)</label>
              <input name="theme_color" type="color" defaultValue={wedding.theme_color} className="w-16 h-10 rounded border p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estilo Visual (Tema)</label>
              <select name="theme" defaultValue={wedding.theme || 'light'} className="w-full px-4 py-2 rounded-lg border">
                <option value="light">Clássico (Light)</option>
                <option value="dark">Elegante (Dark)</option>
                <option value="praia">Praia (Tropical)</option>
                <option value="noturno">Noturno (Estelar)</option>
                <option value="verao">Verão (Vibrante)</option>
                <option value="inverno">Inverno (Sereno)</option>
              </select>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Mail className="text-rose-500" /> Configuração de E-mail de Envio (SMTP)
              </h4>
              <button 
                type="button"
                onClick={async () => {
                  const formData = new FormData(document.querySelector('form') as HTMLFormElement);
                  const data = Object.fromEntries(formData);
                  try {
                    const res = await fetch('/api/test-email', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify(data)
                    });
                    const result = await res.json();
                    if (res.ok) alert('E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.');
                    else alert('Erro ao enviar teste: ' + result.error);
                  } catch (e) {
                    alert('Erro de conexão ao testar e-mail');
                  }
                }}
                className="text-sm bg-zinc-100 text-zinc-600 px-3 py-1 rounded hover:bg-zinc-200 transition-colors"
              >
                Testar Configuração
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Servidor SMTP (ex: smtp.gmail.com)</label>
                <input name="smtp_host" defaultValue={wedding.smtp_host} className="w-full px-4 py-2 rounded-lg border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Porta (ex: 465 ou 587)</label>
                <input name="smtp_port" type="number" defaultValue={wedding.smtp_port} className="w-full px-4 py-2 rounded-lg border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usuário/E-mail</label>
                <input name="smtp_user" defaultValue={wedding.smtp_user} className="w-full px-4 py-2 rounded-lg border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha (ou Senha de App)</label>
                <input name="smtp_pass" type="password" defaultValue={wedding.smtp_pass} className="w-full px-4 py-2 rounded-lg border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail de Exibição (From)</label>
                <input name="smtp_from" defaultValue={wedding.smtp_from} className="w-full px-4 py-2 rounded-lg border" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-2 italic">
              * Para Gmail, use uma "Senha de App". A porta 465 usa SSL/TLS.
            </p>
          </div>

          <div className="pt-8 border-t border-zinc-100">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="text-blue-500" /> Integração Mercado Pago
            </h4>
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Access Token (Produção)</label>
                <input name="mercadopago_access_token" defaultValue={wedding.mercadopago_access_token} type="password" placeholder="APP_USR-..." className="w-full px-4 py-2 rounded-lg border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Public Key</label>
                <input name="mercadopago_public_key" defaultValue={wedding.mercadopago_public_key} placeholder="APP_USR-..." className="w-full px-4 py-2 rounded-lg border" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-2 italic">
              * Obtenha suas credenciais no painel do Mercado Pago Developers.
            </p>
          </div>

          <button className="bg-rose-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

const PhotoManager = ({ wedding }: { wedding: any }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchPhotos = () => {
    fetch('/api/photos', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setPhotos);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetch('/api/photos', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ url: data.url })
        });
        fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: number) => {
    if (!confirm('Deseja excluir esta foto?')) return;
    const res = await fetch(`/api/photos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) fetchPhotos();
  };

  const shareUrl = `${window.location.origin}/w/${wedding.slug}/share`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Galeria de Fotos</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowQR(true)}
            className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <QrCode size={18} />
            QR Code para Convidados
          </button>
          <label className="bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-600 transition-colors cursor-pointer">
            <Camera size={18} />
            {uploading ? 'Enviando...' : 'Adicionar Foto'}
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-3xl max-w-sm w-full text-center"
          >
            <h4 className="text-xl font-bold mb-4">QR Code para Fotos</h4>
            <p className="text-zinc-500 text-sm mb-6">Imprima este QR Code e coloque nas mesas! Seus convidados poderão tirar fotos e elas aparecerão direto na galeria.</p>
            <div className="bg-zinc-50 p-6 rounded-2xl inline-block mb-6">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
            <div className="text-xs text-zinc-400 break-all mb-6">{shareUrl}</div>
            <button 
              onClick={() => setShowQR(false)}
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
            <img src={photo.url} className="w-full h-full object-cover" alt="Wedding" />
            {photo.is_guest_photo === 1 && (
              <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                CONVIDADO
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => deletePhoto(photo.id)}
                className="bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            Nenhuma foto na galeria ainda.
          </div>
        )}
      </div>
    </div>
  );
};

// --- PUBLIC WEDDING SITE ---

const PublicWeddingSite = () => {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [rsvpError, setRsvpError] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/public/wedding/${slug}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center h-screen font-serif italic text-rose-500 text-2xl">Carregando convite...</div>;
  if (!data?.wedding) return <div className="flex items-center justify-center h-screen">Casamento não encontrado.</div>;

  const { wedding, gifts, photos } = data;

  const themes: any = {
    light: {
      bg: 'bg-stone-50',
      text: 'text-stone-900',
      card: 'bg-white',
      accent: wedding.theme_color || '#e11d48',
      font: 'font-serif'
    },
    dark: {
      bg: 'bg-zinc-950',
      text: 'text-zinc-100',
      card: 'bg-zinc-900',
      accent: wedding.theme_color || '#fbbf24',
      font: 'font-serif'
    },
    praia: {
      bg: 'bg-[#fdf5e6]', // Old Lace
      text: 'text-[#2f4f4f]', // Dark Slate Gray
      card: 'bg-white/80 backdrop-blur-sm',
      accent: wedding.theme_color || '#20b2aa', // Light Sea Green
      font: 'font-serif'
    },
    noturno: {
      bg: 'bg-[#0c0c1d]', // Deep Night Blue
      text: 'text-blue-50',
      card: 'bg-blue-950/40 backdrop-blur-md border border-blue-900/30',
      accent: wedding.theme_color || '#94a3b8', // Slate 400
      font: 'font-serif'
    },
    verao: {
      bg: 'bg-[#fffaf0]', // Floral White
      text: 'text-orange-950',
      card: 'bg-white',
      accent: wedding.theme_color || '#f97316', // Orange 500
      font: 'font-sans'
    },
    inverno: {
      bg: 'bg-[#f0f8ff]', // Alice Blue
      text: 'text-slate-900',
      card: 'bg-white/90',
      accent: wedding.theme_color || '#38bdf8', // Sky 400
      font: 'font-serif'
    }
  };

  const theme = themes[wedding.theme] || themes.light;

  const isRsvpOpen = () => {
    if (!wedding.rsvp_deadline) return true;
    const deadline = new Date(wedding.rsvp_deadline);
    deadline.setHours(23, 59, 59, 999);
    return new Date() <= deadline;
  };

  const handleRSVP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isRsvpOpen()) {
      setRsvpError('O prazo para confirmação de presença já se encerrou.');
      return;
    }
    setRsvpStatus('loading');
    setRsvpError('');
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/public/rsvp/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const result = await res.json();
      if (res.ok) {
        setRsvpStatus('success');
      } else {
        setRsvpError(result.error || 'Erro ao confirmar presença');
        setRsvpStatus('idle');
      }
    } catch (err) {
      setRsvpError('Erro de conexão');
      setRsvpStatus('idle');
    }
  };

  const handleGiftPayment = async (gift: any) => {
    if (!wedding.mercadopago_access_token) {
      alert('Este casal ainda não configurou o pagamento online. Por favor, entre em contato com eles.');
      return;
    }

    try {
      console.log(`Solicitando pagamento para o presente ${gift.id}...`);
      const res = await fetch(`/api/public/gifts/${gift.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      });
      const data = await res.json();
      if (res.ok && data.init_point) {
        console.log(`Redirecionando para: ${data.init_point}`);
        window.location.href = data.init_point;
      } else {
        console.error('Erro no pagamento:', data.error);
        alert(data.error || 'Erro ao processar pagamento');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro ao conectar com o servidor de pagamento');
    }
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} ${theme.font} selection:bg-rose-100`}>
      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 text-white hover:text-rose-400 transition-colors"
            >
              <XCircle size={40} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-6 text-white hover:text-rose-400 transition-colors p-2"
            >
              <ArrowLeft size={48} />
            </button>

            <motion.img 
              key={selectedPhotoIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={photos[selectedPhotoIndex].url} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              alt="Wedding moment"
            />

            <button 
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-6 text-white hover:text-rose-400 transition-colors p-2 rotate-180"
            >
              <ArrowLeft size={48} />
            </button>

            <div className="absolute bottom-8 text-white/60 text-sm">
              {selectedPhotoIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={wedding.banner_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"} 
            className="w-full h-full object-cover"
            alt="Hero"
          />
          <div className={`absolute inset-0 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-black/60' : 'bg-black/30'}`} />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-white"
        >
          <p className="text-xl uppercase tracking-[0.3em] mb-4 drop-shadow-md">Bem-vindos ao nosso casamento</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 drop-shadow-lg">{wedding.couple_names}</h1>
          <div className="w-16 h-px bg-white mx-auto mb-6" />
          <p className="text-2xl italic drop-shadow-md">{formatDateForDisplay(wedding.wedding_date)}</p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="py-24 max-w-3xl mx-auto px-4 text-center">
        <Heart className="mx-auto mb-8" style={{ color: theme.accent }} size={32} />
        <h2 className="text-4xl font-bold mb-8">Nossa História</h2>
        <p className={`text-xl leading-relaxed italic ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'text-zinc-300' : 'text-stone-600'}`}>
          {wedding.story || "Ainda estamos escrevendo nossa história..."}
        </p>
      </section>

      {/* Event Info */}
      <section className={`py-24 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-zinc-900/50' : 'bg-stone-100'}`}>
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          <div className={`${theme.card} p-12 rounded-3xl shadow-sm text-center border border-black/5`}>
            <Calendar className="mx-auto mb-4" style={{ color: theme.accent }} size={32} />
            <h3 className="text-2xl font-bold mb-4">Quando</h3>
            <p className="opacity-70">{formatDateForDisplay(wedding.wedding_date)}</p>
          </div>
          <div className={`${theme.card} p-12 rounded-3xl shadow-sm text-center border border-black/5`}>
            <MapPin className="mx-auto mb-4" style={{ color: theme.accent }} size={32} />
            <h3 className="text-2xl font-bold mb-4">Onde</h3>
            <p className="opacity-70">{wedding.location || 'Local a definir'}</p>
          </div>
        </div>
      </section>

      {/* Gifts */}
      <section id="gifts" className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <Gift className="mx-auto mb-4" style={{ color: theme.accent }} size={32} />
          <h2 className="text-4xl font-bold mb-4">Lista de Presentes</h2>
          <p className="opacity-60">Sua presença é nosso maior presente, mas se desejar nos presentear...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {gifts.map((gift: any, i: number) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className={`${theme.card} rounded-2xl shadow-sm overflow-hidden border border-black/5 flex flex-col h-full`}
            >
              <div className="relative">
                <img src={gift.image_url || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=400'} className="w-full h-48 object-cover" alt={gift.name} />
                {gift.is_purchased === 1 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-1 rounded-full font-bold text-xs transform -rotate-12">GANHAMOS!</span>
                  </div>
                )}
              </div>
              <div className="p-6 text-center flex flex-col flex-grow">
                <h4 className="font-bold mb-2">{gift.name}</h4>
                <p className="text-2xl font-bold mb-4 mt-auto" style={{ color: theme.accent }}>
                  R$ {Number(gift.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {gift.is_purchased === 0 && (
                  <button 
                    onClick={() => handleGiftPayment(gift)}
                    className="w-full text-white py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: theme.accent }}
                  >
                    Presentear
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {photos && photos.length > 0 && (
        <section className={`py-24 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-zinc-900/50' : 'bg-stone-100'}`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Camera className="mx-auto mb-4" style={{ color: theme.accent }} size={32} />
              <h2 className="text-4xl font-bold mb-4">Momentos</h2>
              <p className="opacity-60 italic">Alguns registros do nosso grande dia.</p>
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((photo: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  onClick={() => setSelectedPhotoIndex(i)}
                  className={`break-inside-avoid rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:ring-4 transition-all`}
                  style={{ '--tw-ring-color': theme.accent + '33' } as any}
                >
                  <img src={photo.url} className="w-full h-auto" alt="Wedding moment" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Invitation & RSVP Section (Moved to the end) */}
      <section id="rsvp" className={`py-24 flex items-center justify-center p-4 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <WeddingInvitation 
              wedding={wedding} 
              templateId={wedding.invitation_template_id}
              invitationText={wedding.invitation_text}
              onRsvpClick={() => document.getElementById('rsvp-form')?.scrollIntoView({ behavior: 'smooth' })}
              onGiftsClick={() => document.getElementById('gifts')?.scrollIntoView({ behavior: 'smooth' })}
            />
          </div>
          
          <div id="rsvp-form" className={`${theme.card} p-8 md:p-12 rounded-3xl shadow-xl border border-black/5`}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Confirmar Presença</h2>
              <p className="opacity-50 text-sm">Por favor, insira seu código de convidado para confirmar.</p>
            </div>
            
            {rsvpStatus === 'success' ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={64} />
                <p className="text-2xl font-bold">Obrigado por confirmar!</p>
                <p className="opacity-60 mt-2">Sua presença é muito importante para nós.</p>
              </div>
            ) : (
              <form onSubmit={handleRSVP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Código do Convidado (Token)</label>
                  <input name="token" required placeholder="Ex: A1B2C3" className={`w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 uppercase font-bold ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-white/5 text-rose-400' : 'bg-stone-50 text-rose-600'}`} style={{ '--tw-ring-color': theme.accent + '33' } as any} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input name="name" required placeholder="Nome completo" className={`w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-white/5' : 'bg-stone-50'}`} style={{ '--tw-ring-color': theme.accent + '33' } as any} />
                  <input name="email" type="email" placeholder="Seu e-mail" className={`w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-white/5' : 'bg-stone-50'}`} style={{ '--tw-ring-color': theme.accent + '33' } as any} />
                </div>
                <input name="phone" placeholder="Seu telefone" className={`w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-white/5' : 'bg-stone-50'}`} style={{ '--tw-ring-color': theme.accent + '33' } as any} />
                <select name="status" className={`w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 font-medium ${wedding.theme === 'dark' || wedding.theme === 'noturno' ? 'bg-zinc-800' : 'bg-stone-50'}`} style={{ '--tw-ring-color': theme.accent + '33' } as any}>
                  <option value="confirmed">Vou com certeza!</option>
                  <option value="declined">Infelizmente não poderei ir</option>
                </select>
                {rsvpError && <p className="text-rose-500 text-sm text-center font-medium">{rsvpError}</p>}
                <button 
                  disabled={rsvpStatus === 'loading'}
                  style={{ backgroundColor: theme.accent }}
                  className="w-full text-white py-4 rounded-xl font-bold transition-all shadow-lg text-lg mt-4 disabled:opacity-50"
                >
                  {rsvpStatus === 'loading' ? 'Enviando...' : 'Confirmar Presença'}
                </button>
                {!isRsvpOpen() && (
                  <p className="text-rose-500 text-xs text-center mt-2 italic">
                    O prazo para confirmação já se encerrou.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>



      <footer className="py-12 text-center text-stone-400 text-sm border-t border-stone-200">
        <p>Feito com ❤️ por MeuCasamento</p>
      </footer>
    </div>
  );
};

const GuestPhotoUpload = () => {
  const { slug } = useParams();
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`/api/public/photos/${slug}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl">
        <Camera className="mx-auto text-rose-500 mb-6" size={64} />
        <h2 className="text-3xl font-serif font-bold mb-4">Compartilhe sua foto!</h2>
        <p className="text-zinc-500 mb-8">Tire uma foto agora ou escolha da sua galeria para aparecer no site do casamento.</p>
        
        {success ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl font-bold">
              Foto enviada com sucesso! ❤️
            </div>
            <button 
              onClick={() => setSuccess(false)}
              className="text-rose-500 font-bold flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Enviar outra foto
            </button>
          </motion.div>
        ) : (
          <label className={cn(
            "w-full flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-rose-200 rounded-2xl cursor-pointer transition-all hover:bg-rose-50",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <Upload className="text-rose-300" size={48} />
            <span className="font-bold text-rose-500">
              {uploading ? 'Enviando...' : 'Tirar ou Escolher Foto'}
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              capture="environment" 
              onChange={handleUpload} 
              disabled={uploading} 
            />
          </label>
        )}
        
        <Link to={`/w/${slug}`} className="mt-8 flex items-center justify-center gap-2 text-zinc-400 hover:text-rose-500 transition-colors">
          <ArrowLeft size={18} />
          Voltar para o site
        </Link>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans text-zinc-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />
          <Route path="/w/:slug" element={<PublicWeddingSite />} />
          <Route path="/w/:slug/share" element={<GuestPhotoUpload />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <><Navbar /><Dashboard /></>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};
