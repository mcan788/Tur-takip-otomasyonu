import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Search, Plus, Send, Paperclip, ChevronRight, MessageSquare, Tag, Clock, Hash, Headphones, Trash2, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
const isProd = window.location.hostname === 'zyronova.com';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://zyronova.com/api' : `http://${window.location.hostname}:3000/api`);

const SupportPage = () => {
  const role = localStorage.getItem('role');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState('Teknik Destek');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newAttachment, setNewAttachment] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const chatEndRef = useRef(null);
  const isMaster = role === 'SUPERADMIN' || role === 'Admin';

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const endpoint = isMaster ? '/support/master' : '/support/agency';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticket) => {
    try {
      const res = await api.get(`/support/ticket/${ticket.id}/messages`);
      if (res.data.success) {
        setMessages(res.data.messages);
        setSelectedTicket(ticket);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;
    try {
      const formData = new FormData();
      formData.append('subject', newSubject);
      formData.append('message', newMessage);
      formData.append('category', newCategory);
      formData.append('priority', newPriority);
      if (newAttachment) {
        formData.append('attachment', newAttachment);
      }
      
      const res = await api.post('/support/agency', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setShowNewModal(false);
        setNewSubject('');
        setNewMessage('');
        setNewAttachment(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to create ticket', err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if ((!replyMessage && !replyAttachment) || !selectedTicket) return;
    try {
      const formData = new FormData();
      if (replyMessage) formData.append('message', replyMessage);
      if (replyAttachment) formData.append('attachment', replyAttachment);
      
      if (isMaster) {
        formData.append('status', 'Yanıtlandı'); // Default for master
      }
      
      const res = await api.post(`/support/ticket/${selectedTicket.id}/reply`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setReplyMessage('');
        setReplyAttachment(null);
        loadTicketMessages(selectedTicket);
        fetchTickets();
      } else {
        alert(res.data.message || 'Yanıt gönderilirken bir hata oluştu.');
        fetchTickets(); // Refresh tickets to sync status
      }
    } catch (err) {
      console.error('Failed to send reply', err);
      alert(err.response?.data?.message || 'Yanıt gönderilirken bir hata oluştu.');
      fetchTickets();
    }
  };

  const handleStatusChange = async (status) => {
    if (!isMaster || !selectedTicket) return;
    try {
      await api.post(`/support/ticket/${selectedTicket.id}/reply`, {
        message: 'Durum güncellendi: ' + status,
        status: status
      });
      loadTicketMessages(selectedTicket);
      fetchTickets();
    } catch (err) {
      console.error('Failed to change status', err);
    }
  }

  const handleDeleteTicket = async () => {
    if (!isMaster || !selectedTicket) return;
    if (!window.confirm('Bu destek talebini tamamen silmek istediğinize emin misiniz?')) return;
    
    try {
      const res = await api.delete(`/support/master/ticket/${selectedTicket.id}`);
      if (res.data.success) {
        setSelectedTicket(null);
        setMessages([]);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to delete ticket', err);
      alert('Talep silinirken hata oluştu.');
    }
  };


  const filterTabs = ['Tümü', 'Açık', 'Yanıtlandı', 'Kapalı'];

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.agencyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === 'Tümü' || t.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const statusStyle = (status) => {
    if (status === 'Açık') return { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' };
    if (status === 'Yanıtlandı') return { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' };
    return { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };
  };

  const getDisplayStatus = (status, isMaster) => {
    if (status === 'Yanıtlandı' && !isMaster) return 'Yanıtınızı Bekliyor';
    if (status === 'Açık' && isMaster) return 'Müşteri Yanıtladı (Açık)';
    return status;
  };

  const priorityBadge = (priority) => {
    if (priority === 'Acil') return { bg: '#fee2e2', color: '#dc2626', label: '🔴 Acil' };
    if (priority === 'Yüksek') return { bg: '#ffedd5', color: '#ea580c', label: '🟠 Yüksek' };
    if (priority === 'Düşük') return { bg: '#f0fdf4', color: '#16a34a', label: '🟢 Düşük' };
    return null;
  };

  return (
    <div className="page-layout">
      <Sidebar type={isMaster ? 'super' : 'agency'} />
      <main className="page-main" style={{ display: 'flex', flexDirection: 'column', padding: '30px', gap: '0', overflow: 'hidden', height: '100vh' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Headphones size={28} color="var(--accent-color)" />
              Destek Talepleri
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              {isMaster ? 'Tüm acente destek talepleri' : 'Talepleriniz ve sistem mesajları'}
            </p>
          </div>
          {!isMaster && (
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px' }}
            >
              <Plus size={18} /> Yeni Talep
            </button>
          )}
        </div>

        {/* Split Panel */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT: Ticket List */}
          <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Talep ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '12px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'white', fontSize: '14px', margin: 0, width: '100%' }}
              />
            </div>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: activeFilter === tab ? 'var(--accent-color)' : '#f1f5f9',
                    color: activeFilter === tab ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab}
                  <span style={{ marginLeft: '5px', opacity: 0.8 }}>
                    {tab === 'Tümü' ? tickets.length : tickets.filter(t => t.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
            {/* Ticket Cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {filteredTickets.length === 0 && !loading && (
                <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px' }}>Talep bulunamadı.</p>
                </div>
              )}
              {filteredTickets.map(ticket => {
                const st = statusStyle(ticket.status);
                const pb = priorityBadge(ticket.priority);
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => loadTicketMessages(ticket)}
                    className="glass card-hover"
                    style={{
                      padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                      borderLeft: `4px solid ${isSelected ? 'var(--accent-color)' : st.dot}`,
                      background: isSelected ? 'rgba(59,130,246,0.04)' : 'white',
                      boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.2)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, flex: 1 }}>
                        {ticket.subject}
                      </h3>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                        {getDisplayStatus(ticket.status, isMaster)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {pb && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: pb.bg, color: pb.color, padding: '1px 7px', borderRadius: '4px' }}>{pb.label}</span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Tag size={10} /> {ticket.category || 'Genel'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {new Date(ticket.updatedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {isMaster && ticket.agencyName && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-color)', fontWeight: 700 }}>
                        🏢 {ticket.agencyName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Chat Panel */}
          <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', minWidth: 0 }}>
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedTicket.subject}
                      </h2>
                      {(() => { const st = statusStyle(selectedTicket.status); return (
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />{getDisplayStatus(selectedTicket.status, isMaster)}
                        </span>
                      ); })()}
                      {priorityBadge(selectedTicket.priority) && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: priorityBadge(selectedTicket.priority).bg, color: priorityBadge(selectedTicket.priority).color, padding: '2px 8px', borderRadius: '4px' }}>
                          {priorityBadge(selectedTicket.priority).label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Hash size={10} /> TKT-{(selectedTicket.id || '').slice(0,8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Tag size={10} /> {selectedTicket.category || 'Genel Destek'}
                      </span>
                    </div>
                  </div>
                  {isMaster && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {selectedTicket.status !== 'Kapalı' && (
                        <button onClick={() => handleStatusChange('Kapalı')} className="btn" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <XCircle size={14} /> Kapat
                        </button>
                      )}
                      {selectedTicket.status === 'Kapalı' && (
                        <button onClick={() => handleStatusChange('Açık')} className="btn" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle size={14} /> Yeniden Aç
                        </button>
                      )}
                      <button onClick={handleDeleteTicket} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Trash2 size={14} /> Sil
                      </button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '14px' }}>
                      Henüz mesaj yok.
                    </div>
                  )}
                  {messages.map(msg => {
                    const isOwn = isMaster ? msg.isMaster : !msg.isMaster;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {msg.isMaster
                            ? <><span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>SİSTEM YÖN.</span></>
                            : <span style={{ fontWeight: 600 }}>{msg.senderName || msg.senderId}</span>
                          }
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{
                          maxWidth: '75%', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.6,
                          background: isOwn ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'white',
                          color: isOwn ? 'white' : 'var(--text-main)',
                          borderBottomRightRadius: isOwn ? '4px' : '16px',
                          borderBottomLeftRadius: !isOwn ? '4px' : '16px',
                          boxShadow: isOwn ? '0 4px 12px rgba(59,130,246,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                          border: isOwn ? 'none' : '1px solid var(--border-color)'
                        }}>
                          {msg.message}
                          {msg.attachmentPath && (
                            <a href={`${API_BASE_URL.replace('/api', '')}${msg.attachmentPath}`} target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${isOwn ? 'rgba(255,255,255,0.3)' : 'var(--border-color)'}`, color: isOwn ? 'rgba(255,255,255,0.9)' : 'var(--accent-color)', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
                              <Paperclip size={12} /> Eki Görüntüle
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== 'Kapalı' ? (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'white', flexShrink: 0 }}>
                    <form onSubmit={handleReply}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={replyMessage}
                            onChange={e => setReplyMessage(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            style={{ margin: 0, borderRadius: '12px', padding: '12px 16px', fontSize: '14px', border: '1px solid var(--border-color)', width: '100%' }}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: '#f1f5f9', cursor: 'pointer', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                          <Paperclip size={18} color="var(--text-muted)" />
                          <input type="file" style={{ display: 'none' }} onChange={e => setReplyAttachment(e.target.files[0])} />
                        </label>
                        <button type="submit" className="btn btn-primary" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Send size={18} />
                        </button>
                      </div>
                      {replyAttachment && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={12} /> {replyAttachment.name}
                          <button type="button" onClick={() => setReplyAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}>✕</button>
                        </div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Bu talep kapatılmıştır. Yeni bir mesaj göndermek için talebi yeniden açın.
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '3rem', background: '#f8fafc' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <MessageSquare size={36} color="var(--accent-color)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Bir Talep Seçin</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '260px', lineHeight: 1.6 }}>
                    Sol panelden bir destek talebi seçerek konuşmayı görüntüleyin.
                  </p>
                </div>
                {!isMaster && (
                  <button onClick={() => setShowNewModal(true)} className="btn btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                    <Plus size={16} /> İlk Talebinizi Oluşturun
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '20px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Yeni Destek Talebi</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Sorununuzu detaylıca açıklayın, size yardımcı olalım.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Konu *</label>
                <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Talebinizin konusunu yazın" required style={{ margin: 0, borderRadius: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Departman</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ margin: 0, borderRadius: '10px' }}>
                    <option value="Teknik Destek">Teknik Destek</option>
                    <option value="Muhasebe / Faturalandırma">Muhasebe / Faturalandırma</option>
                    <option value="Lisans İşlemleri">Lisans İşlemleri</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Öncelik</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ margin: 0, borderRadius: '10px' }}>
                    <option value="Düşük">🟢 Düşük</option>
                    <option value="Normal">🔵 Normal</option>
                    <option value="Yüksek">🟠 Yüksek</option>
                    <option value="Acil">🔴 Acil</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Mesajınız *</label>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows="4" placeholder="Sorununuzu veya isteğinizi detaylıca açıklayın..." required style={{ margin: 0, borderRadius: '10px', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Paperclip size={16} color="var(--accent-color)" />
                  {newAttachment ? <span style={{ color: 'var(--accent-color)' }}>{newAttachment.name}</span> : 'Dosya ekle (isteğe bağlı)'}
                  <input type="file" style={{ display: 'none' }} onChange={e => setNewAttachment(e.target.files[0])} />
                </label>
                {newAttachment && (
                  <button type="button" onClick={() => setNewAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>✕ Kaldır</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700 }}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={16} /> Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;

