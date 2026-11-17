import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  Search, Plus, Heart, MessageSquare, User, MapPin, Tag, ArrowLeftRight,
  CheckCircle2, XCircle, Send, Star, ShieldCheck, Database, LogOut,
  SlidersHorizontal, Package, Briefcase, Sparkles, X, Image as ImageIcon,
  Check, AlertCircle, RefreshCw, ArrowLeft, Upload
} from 'lucide-react';

const BW_CITIES = [
  'All Cities', 'Gaborone', 'Francistown', 'Maun', 'Serowe', 'Molepolole',
  'Kanye', 'Mahalapye', 'Mochudi', 'Palapye', 'Lobatse', 'Selibe Phikwe', 'Kasane'
];

const CATEGORIES = [
  'All', 'Food & Drinks', 'Electronics', 'Home & Garden', 'Vehicles & Parts', 
  'Fashion & Beauty', 'Professional Services', 'Manual Labor & Trades', 
  'Agriculture & Livestock', 'Books & Education'
];

export default function App() {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('bb_sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('bb_sb_key') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('bb_sb_url'));
  const [connError, setConnError] = useState('');

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Gaborone');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');

  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('good');
  const [newCategory, setNewCategory] = useState('Food & Drinks');
  const [newCity, setNewCity] = useState('Gaborone');
  const [newLookingFor, setNewLookingFor] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [listingError, setListingError] = useState('');

  const [offeredListingId, setOfferedListingId] = useState('');
  const [customOffer, setCustomOffer] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setFavorites([]);
        setProposals([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    fetchListings();
    if (session?.user) {
      fetchFavorites();
      fetchProposals();
    }
  }, [session]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('bb_sb_url', supabaseUrl.trim());
    localStorage.setItem('bb_sb_key', supabaseKey.trim());
    window.location.reload();
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchListings = async () => {
    if (!supabase) return;
    setLoadingData(true);
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(full_name, city, avatar_url, rating)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (data) setListings(data);
    setLoadingData(false);
  };

  const fetchFavorites = async () => {
    if (!session?.user || !supabase) return;
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', session.user.id);
    if (data) setFavorites(data.map((f) => f.listing_id));
  };

  const fetchProposals = async () => {
    if (!session?.user || !supabase) return;
    const { data } = await supabase
      .from('trade_proposals')
      .select(`
        *,
        sender:profiles!trade_proposals_sender_id_fkey(full_name, city),
        receiver:profiles!trade_proposals_receiver_id_fkey(full_name, city),
        target_listing:listings!trade_proposals_target_listing_id_fkey(id, title, image_url, type),
        offered_listing:listings!trade_proposals_offered_listing_id_fkey(id, title, image_url, type)
      `)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });
    if (data) setProposals(data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthMessage('');

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName, city }
        }
      });
      if (error) {
        setAuthMessage(error.message);
      } else {
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName || email.split('@')[0],
            city: city || 'Gaborone'
          });
        }
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (loginError) {
          setAuthMessage('Account created! Please sign in.');
        } else if (loginData?.session) {
          setSession(loginData.session);
          setActiveTab('explore');
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) {
        setAuthMessage(error.message);
      } else {
        if (data?.session) {
          setSession(data.session);
        }
        setActiveTab('explore');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setActiveTab('explore');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !supabase) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please select an image under 5MB.');
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload image: ' + uploadError.message);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      setNewImageUrl(data.publicUrl);
    }
    setUploadingImage(false);
  };

  const toggleFavorite = async (e, listingId) => {
    e.stopPropagation();
    if (!session?.user || !supabase) {
      setActiveTab('profile');
      return;
    }
    const isFav = favorites.includes(listingId);
    if (isFav) {
      setFavorites(favorites.filter((id) => id !== listingId));
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('listing_id', listingId);
    } else {
      setFavorites([...favorites, listingId]);
      await supabase.from('favorites').insert({ user_id: session.user.id, listing_id: listingId });
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!session?.user || !supabase) return;
    setSubmittingListing(true);
    setListingError('');

    const payload = {
      owner_id: session.user.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      category: newCategory,
      city: newCity,
      looking_for: newLookingFor.trim(),
      image_url: newImageUrl.trim() || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
      status: 'active'
    };

    const { error } = await supabase.from('listings').insert(payload);

    setSubmittingListing(false);
    if (!error) {
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewLookingFor('');
      setNewImageUrl('');
      setListingError('');
      fetchListings();
    } else {
      console.error('Supabase listing error:', error);
      setListingError(error.message);
    }
  };

  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!session?.user || !selectedListing || !supabase) return;
    if (!offeredListingId && !customOffer.trim()) {
      alert('Please select one of your listings or describe a custom offer.');
      return;
    }

    setSubmittingProposal(true);
    const { error } = await supabase.from('trade_proposals').insert({
      sender_id: session.user.id,
      receiver_id: selectedListing.owner_id,
      target_listing_id: selectedListing.id,
      offered_listing_id: offeredListingId || null,
      custom_offer: customOffer.trim() || null,
      status: 'pending'
    });

    setSubmittingProposal(false);
    if (!error) {
      setSelectedListing(null);
      setOfferedListingId('');
      setCustomOffer('');
      fetchProposals();
      setActiveTab('trades');
    } else {
      alert('Failed to send offer: ' + error.message);
    }
  };

  const handleUpdateProposalStatus = async (proposalId, status) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('trade_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', proposalId);

    if (!error) {
      fetchProposals();
      if (activeProposal?.id === proposalId) {
        setActiveProposal({ ...activeProposal, status });
      }
    }
  };

  const openChat = async (proposal) => {
    if (!supabase) return;
    setActiveProposal(proposal);
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name)')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeProposal || !session?.user || !supabase) return;
    const text = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ proposal_id: activeProposal.id, sender_id: session.user.id, content: text })
      .select('*, profiles(full_name)')
      .single();

    if (!error && data) setMessages([...messages, data]);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (activeTab === 'wishlist' && !favorites.includes(item.id)) return false;
      if (selectedCity !== 'All Cities' && item.city !== selectedCity) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (listingTypeFilter !== 'all' && item.type !== listingTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.title?.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q) && !item.looking_for?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [listings, activeTab, favorites, selectedCity, selectedCategory, listingTypeFilter, searchQuery]);

  const myListings = useMemo(() => {
    if (!session?.user) return [];
    return listings.filter((l) => l.owner_id === session.user.id);
  }, [listings, session]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>{supabase ? <span className="text-emerald-400 font-medium">● Connected to Supabase</span> : <span className="text-amber-300 font-medium">● Database Not Connected</span>}</span>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="underline text-sky-300 hover:text-white">
          {showConfig ? 'Hide Keys' : 'Configure Supabase'}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveConfig} className="bg-slate-800 text-white p-4 border-b border-slate-700">
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-xs text-slate-300">Paste your Supabase <strong>Project URL</strong> and <strong>Anon Public Key</strong>.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="url" required placeholder="https://your-project.supabase.co" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm text-white" />
              <input type="text" required placeholder="eyJhbGciOiJIUzI1Ni..." value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} className="px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm text-white" />
            </div>
            {connError && <p className="text-xs text-red-400">{connError}</p>}
            <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">Save & Connect</button>
          </div>
        </form>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeTab !== 'explore' && (
              <button onClick={() => setActiveTab('explore')} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Back to Dashboard">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 cursor-pointer" onClick={() => setActiveTab('explore')}>
                Barter<span className="text-sky-600">Box</span>
              </h1>
              <p className="text-[11px] text-slate-500">Botswana's Peer-to-Peer Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== 'explore' && (
              <button onClick={() => setActiveTab('explore')} className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl hidden sm:flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </button>
            )}
            {session ? (
              <button onClick={() => setShowCreateModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition">
                <Plus className="w-4 h-4" /><span>Post Item</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('profile')} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl">Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        {(activeTab === 'explore' || activeTab === 'wishlist') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input type="text" placeholder="Search food, smartphones, plumbing, furniture..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-sky-600 absolute left-3 top-3 pointer-events-none" />
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-500">
                    {BW_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <select value={listingTypeFilter} onChange={(e) => setListingTypeFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-500">
                  <option value="all">Goods & Services</option>
                  <option value="good">Goods Only</option>
                  <option value="service">Services Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${selectedCategory === cat ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>{cat}</button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <h2 className="font-bold text-base text-slate-800">{activeTab === 'wishlist' ? 'Saved Wishlist Items' : 'Available for Barter'}</h2>
              <button onClick={fetchListings} className="text-xs text-sky-600 flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
            </div>

            {!supabase ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Database className="w-8 h-8 text-sky-600 mx-auto" />
                <h3 className="font-semibold text-slate-800">Connect Your Supabase Backend</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">Enter your Project URL and Anon Key in the top banner.</p>
              </div>
            ) : loadingData ? (
              <div className="text-center py-12 text-sm text-slate-500">Loading Botswana marketplace...</div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">No listings found</p>
                <p className="text-xs text-slate-500">Try clearing filters or be the first to post an item!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((item) => {
                  const isFav = favorites.includes(item.id);
                  return (
                    <div key={item.id} onClick={() => setSelectedListing(item)} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col">
                      <div className="relative h-44 bg-slate-100">
                        <img src={item.image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          {item.type === 'service' ? <Briefcase className="w-3 h-3 text-amber-400" /> : <Package className="w-3 h-3 text-sky-400" />}
                          {item.type === 'service' ? 'Service' : 'Good'}
                        </span>
                        <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-105 transition">
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-600" /><span>{item.city}</span><span>•</span><span>{item.category}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 block">Looking For:</span>
                          <p className="text-xs font-medium text-slate-800 line-clamp-1 mt-0.5">{item.looking_for || 'Open to fair barter offers'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Your Barter Proposals & Chats</h2>
              <button onClick={() => setActiveTab('explore')} className="text-xs font-medium text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore
              </button>
            </div>
            {!session ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-sm text-slate-600">Sign in to view your incoming and outgoing barter offers.</p>
                <button onClick={() => setActiveTab('profile')} className="bg-sky-600 text-white text-sm font-medium px-5 py-2 rounded-xl">Go to Sign In</button>
              </div>
            ) : proposals.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-sm text-slate-500">No trade proposals yet. Browse items and make an offer!</p>
                <button onClick={() => setActiveTab('explore')} className="mt-3 bg-sky-600 text-white text-xs font-medium px-4 py-2 rounded-xl">Browse Marketplace</button>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((prop) => {
                  const isIncoming = prop.receiver_id === session.user.id;
                  return (
                    <div key={prop.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isIncoming ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                          {isIncoming ? `Offer from ${prop.sender?.full_name || 'Member'}` : `Sent to ${prop.receiver?.full_name || 'Member'}`}
                        </span>
                        <span className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${prop.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : prop.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          {prop.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                        <div><span className="text-slate-400 block">Target Item:</span><strong className="text-slate-800 text-sm">{prop.target_listing?.title}</strong></div>
                        <div><span className="text-slate-400 block">Offered in Exchange:</span><strong className="text-sky-700 text-sm">{prop.offered_listing?.title || prop.custom_offer}</strong></div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button onClick={() => openChat(prop)} className="text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Open Trade Chat</button>
                        {isIncoming && prop.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateProposalStatus(prop.id, 'accepted')} className="text-xs font-semibold bg-emerald-600 text-white px-3.5 py-2 rounded-xl flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Accept</button>
                            <button onClick={() => handleUpdateProposalStatus(prop.id, 'rejected')} className="text-xs font-semibold bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl flex items-center gap-1"><X className="w-3.5 h-3.5" /> Decline</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTab('explore')} className="text-xs font-medium text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </button>
            </div>
            {!session ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="text-center">
                  <h2 className="font-bold text-xl text-slate-900">
                    {authMode === 'login' ? 'Welcome Back to BarterBox' : 'Join BarterBox Botswana'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Zero fees. Direct peer-to-peer trading.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-3">
                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Full Name</label>
                        <input type="text" required placeholder="e.g. Kagiso Molefe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">City / Town</label>
                        <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                          {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-700">Email Address</label>
                    <input type="email" required placeholder="you@example.co.bw" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Password</label>
                    <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm" />
                  </div>

                  {authMessage && <p className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-lg">{authMessage}</p>}

                  <button type="submit" disabled={authLoading || !supabase} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50">
                    {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Free Account'}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-sky-600 font-medium hover:underline">
                    {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">{profile?.full_name || session.user.email}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-sky-600" /> {profile?.city || 'Botswana'}</p>
                  </div>
                  <button onClick={handleLogout} className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-2 rounded-xl flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Sign Out</button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm text-slate-800">My Active Listings ({myListings.length})</h3>
                  {myListings.length === 0 ? (
                    <p className="text-xs text-slate-500">You haven't posted any items or services yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {myListings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                          <div><p className="font-semibold text-slate-800">{item.title}</p><p className="text-slate-500">{item.city} • {item.category}</p></div>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LISTING DETAIL MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="relative h-52 bg-slate-100">
              <img src={selectedListing.image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80'} alt={selectedListing.title} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedListing(null)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full uppercase">{selectedListing.type}</span>
                    <span>{selectedListing.city}</span><span>•</span><span>Posted by {selectedListing.profiles?.full_name || 'Member'}</span>
                  </div>
                </div>
                <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedListing.title}</h2>
                <p className="text-sm text-slate-600 mt-2">{selectedListing.description}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-xs font-bold text-amber-800 block">Owner is looking for:</span>
                <p className="text-sm text-slate-800 mt-0.5">{selectedListing.looking_for || 'Open to offers'}</p>
              </div>
              {session?.user?.id === selectedListing.owner_id ? (
                <p className="text-xs text-center text-slate-500 bg-slate-100 py-2.5 rounded-xl">This is your own listing.</p>
              ) : !session ? (
                <button onClick={() => { setSelectedListing(null); setActiveTab('profile'); }} className="w-full bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-sm">Sign In to Propose a Trade</button>
              ) : (
                <form onSubmit={handleSendProposal} className="space-y-3 border-t border-slate-100 pt-3">
                  <h3 className="font-bold text-sm text-slate-900">Propose a Barter Offer</h3>
                  {myListings.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-700">Offer one of your listed items:</label>
                      <select value={offeredListingId} onChange={(e) => setOfferedListingId(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="">-- Select your item/service (optional) --</option>
                        {myListings.map((ml) => (<option key={ml.id} value={ml.id}>{ml.title}</option>))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-slate-700">Or describe a custom trade / skill offer:</label>
                    <textarea rows={2} placeholder="e.g. I can trade my Samsung tablet or 2 days of tiling work..." value={customOffer} onChange={(e) => setCustomOffer(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <button type="submit" disabled={submittingProposal} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />{submittingProposal ? 'Sending Offer...' : 'Send Barter Proposal'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">Post to BarterBox</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateListing} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setNewType('good')} className={`py-2 rounded-xl text-xs font-semibold border ${newType === 'good' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200'}`}>Physical Good</button>
                <button type="button" onClick={() => setNewType('service')} className={`py-2 rounded-xl text-xs font-semibold border ${newType === 'service' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200'}`}>Skill / Service</button>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Title</label>
                <input type="text" required placeholder="e.g. Homemade Seswaa, Fresh Eggs, or HP Laptop" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Location</label>
                  <select value={newCity} onChange={(e) => setNewCity(e.target.value)} className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Description & Condition</label>
                <textarea rows={2} required placeholder="Describe ingredients, quantity, or condition..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">What do you want in exchange?</label>
                <input type="text" required placeholder="e.g. Maize meal, charcoal, or smartphone" value={newLookingFor} onChange={(e) => setNewLookingFor(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Listing Photo (Upload from Device or Paste URL)</label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                  <input type="url" placeholder="Or paste image URL (https://...)" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                {newImageUrl && (
                  <div className="mt-2 relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {listingError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs">
                  <strong>Error:</strong> {listingError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submittingListing || uploadingImage} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {submittingListing ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVATE TRADE CHAT MODAL */}
      {activeProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full h-[75vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Trade Negotiation</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{activeProposal.target_listing?.title}</p>
              </div>
              <button onClick={() => setActiveProposal(null)} className="p-1.5 rounded-full hover:bg-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
              {messages.length === 0 ? (
                <p className="text-xs text-center text-slate-400 pt-8">Coordinate meetup spots or finalize trade details here.</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === session?.user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${isMe ? 'bg-sky-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input type="text" placeholder="Write a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500" />
              <button type="submit" className="bg-sky-600 text-white p-2.5 rounded-xl hover:bg-sky-700"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <button onClick={() => setActiveTab('explore')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium ${activeTab === 'explore' ? 'text-sky-600' : 'text-slate-500'}`}><Search className="w-5 h-5" /><span>Explore</span></button>
          <button onClick={() => setActiveTab('wishlist')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium ${activeTab === 'wishlist' ? 'text-sky-600' : 'text-slate-500'}`}><Heart className="w-5 h-5" /><span>Wishlist</span></button>
          <button onClick={() => setActiveTab('trades')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium relative ${activeTab === 'trades' ? 'text-sky-600' : 'text-slate-500'}`}>
            <ArrowLeftRight className="w-5 h-5" /><span>Trades</span>
            {proposals.filter((p) => p.status === 'pending' && p.receiver_id === session?.user?.id).length > 0 && (<span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-3" />)}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium ${activeTab === 'profile' ? 'text-sky-600' : 'text-slate-500'}`}><User className="w-5 h-5" /><span>{session ? 'Profile' : 'Sign In'}</span></button>
        </div>
      </nav>
    </div>
  );
}