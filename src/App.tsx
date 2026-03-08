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
  MessageCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- API HELPERS ---
const API_URL = '';
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// --- COMPONENTS ---

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
            <span>{wedding.wedding_date || 'Data não definida'}</span>
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

  useEffect(() => {
    fetch('/api/gifts', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setGifts);
  }, []);

  const addGift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/gifts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) {
      setShowAdd(false);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Lista de Presentes</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-600 transition-colors"
        >
          <Plus size={18} />
          Adicionar Presente
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
          <form onSubmit={addGift} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome do Presente</label>
              <input name="name" required className="w-full px-4 py-2 rounded-lg border" placeholder="Ex: Jogo de Panelas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço Sugerido (R$)</label>
              <input name="price" type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL da Imagem (opcional)</label>
              <input name="image_url" className="w-full px-4 py-2 rounded-lg border" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-zinc-100 text-zinc-600 px-6 py-2 rounded-lg font-bold">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map((gift, i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <img 
              src={gift.image_url || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=400'} 
              className="w-full h-40 object-cover"
              alt={gift.name}
            />
            <div className="p-4">
              <h4 className="font-bold mb-1">{gift.name}</h4>
              <p className="text-rose-500 font-bold">R$ {Number(gift.price || 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeddingInvitations = ({ wedding, onUpdate }: { wedding: any, onUpdate: () => void }) => {
  const templates = [
    { id: 1, name: 'Clássico Elegante', bg: 'bg-stone-50', text: 'text-stone-900', font: 'font-serif' },
    { id: 2, name: 'Moderno Minimalista', bg: 'bg-white', text: 'text-zinc-900', font: 'font-sans' },
    { id: 3, name: 'Rústico Floral', bg: 'bg-emerald-50', text: 'text-emerald-900', font: 'font-serif' },
    { id: 4, name: 'Noite Estelar', bg: 'bg-indigo-950', text: 'text-white', font: 'font-serif' },
  ];

  const selectTemplate = async (id: number) => {
    const res = await fetch('/api/wedding', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...wedding, invitation_template_id: id })
    });
    if (res.ok) {
      onUpdate();
      alert('Modelo selecionado com sucesso!');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((tpl) => (
          <div 
            key={tpl.id}
            className={`relative group cursor-pointer rounded-2xl overflow-hidden border-4 transition-all ${
              wedding.invitation_template_id === tpl.id ? 'border-rose-500' : 'border-transparent hover:border-rose-200'
            }`}
            onClick={() => selectTemplate(tpl.id)}
          >
            <div className={`aspect-[3/4] p-6 flex flex-col items-center justify-center text-center ${tpl.bg} ${tpl.text} ${tpl.font}`}>
              <div className="border border-current p-4 w-full h-full flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest mb-2">Convidamos para o casamento de</p>
                <h4 className="text-xl font-bold mb-2">{wedding.couple_names}</h4>
                <div className="w-8 h-px bg-current my-2" />
                <p className="text-sm italic">{wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('pt-BR') : 'Data a definir'}</p>
                <p className="text-[10px] mt-4">{wedding.location || 'Local a definir'}</p>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-white/90 p-3 text-center">
              <span className="font-bold text-sm">{tpl.name}</span>
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
              <input name="wedding_date" type="date" defaultValue={wedding.wedding_date} className="w-full px-4 py-2 rounded-lg border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Limite RSVP</label>
              <input name="rsvp_deadline" type="date" defaultValue={wedding.rsvp_deadline} className="w-full px-4 py-2 rounded-lg border" />
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
          <div>
            <label className="block text-sm font-medium mb-1">Cor do Tema</label>
            <input name="theme_color" type="color" defaultValue={wedding.theme_color} className="w-16 h-10 rounded border p-1" />
          </div>
          
          <div className="pt-8 border-t border-zinc-100">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Mail className="text-rose-500" /> Configuração de E-mail de Envio (SMTP)
            </h4>
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

  const nextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-serif selection:bg-rose-100">
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
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-white"
        >
          <p className="text-xl uppercase tracking-[0.3em] mb-4">Bem-vindos ao nosso casamento</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-6">{wedding.couple_names}</h1>
          <div className="w-16 h-px bg-white mx-auto mb-6" />
          <p className="text-2xl italic">{wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Em breve'}</p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="py-24 max-w-3xl mx-auto px-4 text-center">
        <Heart className="mx-auto text-rose-400 mb-8" size={32} />
        <h2 className="text-4xl font-bold mb-8">Nossa História</h2>
        <p className="text-xl leading-relaxed text-stone-600 italic">
          {wedding.story || "Ainda estamos escrevendo nossa história..."}
        </p>
      </section>

      {/* Event Info */}
      <section className="py-24 bg-stone-100">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          <div className="bg-white p-12 rounded-3xl shadow-sm text-center">
            <Calendar className="mx-auto text-rose-400 mb-4" size={32} />
            <h3 className="text-2xl font-bold mb-4">Quando</h3>
            <p className="text-stone-600">{wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'A definir'}</p>
          </div>
          <div className="bg-white p-12 rounded-3xl shadow-sm text-center">
            <MapPin className="mx-auto text-rose-400 mb-4" size={32} />
            <h3 className="text-2xl font-bold mb-4">Onde</h3>
            <p className="text-stone-600">{wedding.location || 'Local a definir'}</p>
          </div>
        </div>
      </section>

      {/* Gifts */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <Gift className="mx-auto text-rose-400 mb-4" size={32} />
          <h2 className="text-4xl font-bold mb-4">Lista de Presentes</h2>
          <p className="text-stone-600">Sua presença é nosso maior presente, mas se desejar nos presentear...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {gifts.map((gift: any, i: number) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100"
            >
              <img src={gift.image_url || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=400'} className="w-full h-48 object-cover" alt={gift.name} />
              <div className="p-6 text-center">
                <h4 className="font-bold mb-2">{gift.name}</h4>
                <p className="text-rose-500 font-bold mb-4">R$ {Number(gift.price || 0).toFixed(2)}</p>
                <button className="w-full border border-rose-500 text-rose-500 py-2 rounded-full hover:bg-rose-500 hover:text-white transition-all">Presentear</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {photos && photos.length > 0 && (
        <section className="py-24 bg-stone-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Camera className="mx-auto text-rose-400 mb-4" size={32} />
              <h2 className="text-4xl font-bold mb-4">Momentos</h2>
              <p className="text-stone-600 italic">Alguns registros do nosso grande dia.</p>
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((photo: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  onClick={() => setSelectedPhotoIndex(i)}
                  className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:ring-4 hover:ring-rose-200 transition-all"
                >
                  <img src={photo.url} className="w-full h-auto" alt="Wedding moment" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      {isRsvpOpen() && (
        <section className="py-24 bg-rose-50">
          <div className="max-w-xl mx-auto px-4 bg-white p-12 rounded-3xl shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Confirmar Presença</h2>
              <p className="text-stone-500">Por favor, insira seu código de convidado para confirmar.</p>
            </div>
            {rsvpStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <p className="text-xl font-bold">Obrigado por confirmar!</p>
              </div>
            ) : (
              <form onSubmit={handleRSVP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Código do Convidado (Token)</label>
                  <input name="token" required placeholder="Ex: A1B2C3" className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-200 uppercase" />
                </div>
                <input name="name" required placeholder="Confirme seu nome completo" className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-200" />
                <input name="email" type="email" placeholder="Seu e-mail" className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-200" />
                <input name="phone" placeholder="Seu telefone" className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-200" />
                <select name="status" className="w-full px-4 py-3 rounded-xl border border-stone-100 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-200">
                  <option value="confirmed">Vou com certeza!</option>
                  <option value="declined">Infelizmente não poderei ir</option>
                </select>
                {rsvpError && <p className="text-rose-500 text-sm text-center">{rsvpError}</p>}
                <button 
                  disabled={rsvpStatus === 'loading'}
                  className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                >
                  {rsvpStatus === 'loading' ? 'Enviando...' : 'Confirmar Presença'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

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
