
import { useEffect, useState } from 'react';
import { LogOut, Users, CreditCard, DollarSign, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthProvider';

type Group = {
    id: string;
    name: string;
    _count: { expenses: number };
    members: { user: { username: string } }[];
};

type UserResult = {
    id: string;
    username: string;
    email: string;
};

export default function Dashboard() {
    const { session, signOut } = useAuth();
    const navigate = useNavigate();

    const [groups, setGroups] = useState<Group[]>([]);
    const [balances, setBalances] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Create Group Modal State
    const [showModal, setShowModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<UserResult[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [session]);

    const fetchData = async () => {
        if (!session) return;
        try {
            // We need to use the token from Supabase session for our backend (handled by axios interceptor)
            const { data: groupsData } = await api.get('/groups');
            if (groupsData.status === 'success') {
                setGroups(groupsData.data.groups);
            }
            // Fetch Balances
            const { data: balData } = await api.get('/balances/summary');
            if (balData.status === 'success') {
                setBalances(balData.data);
            }
        } catch (e) {
            console.error("Failed to fetch data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUsers = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const { data } = await api.get(`/users/search?q=${q}`);
            // Filter out already selected users
            const results = data.data.users.filter((u: UserResult) =>
                !selectedMembers.find(selected => selected.id === u.id)
            );
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddMember = (user: UserResult) => {
        setSelectedMembers([...selectedMembers, user]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleRemoveMember = (id: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== id));
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/groups', {
                name: newGroupName,
                members: selectedMembers.map(m => m.id)
            });

            setShowModal(false);
            setNewGroupName('');
            setSelectedMembers([]);
            fetchData(); // Refresh list
        } catch (e: any) {
            console.error('Create group failed:', e);
            alert(e.response?.data?.message || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem' }}>CredResolve</h1>
                    <p className="text-muted text-sm">Financial harmony for groups</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={16} />
                        New Group
                    </button>
                    <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    icon={<Users size={24} color="#60a5fa" />}
                    label="Active Groups"
                    value={groups.length}
                />
                {/* Placeholder Balance Stats - Backend aggregation needed for real values */}
                <StatCard
                    icon={<DollarSign size={24} color="#34d399" />}
                    label="You are Owed"
                    value={`₹${balances?.totalOwed?.toFixed(2) || '0.00'}`}
                    highlight={true}
                />
                <StatCard
                    icon={<CreditCard size={24} color="#f87171" />}
                    label="You Owe"
                    value={`₹${balances?.totalDebt?.toFixed(2) || '0.00'}`}
                />
            </div>

            <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Your Groups</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {loading ? <p>Loading groups...</p> : groups.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p className="text-muted">No groups yet. Create one to get started!</p>
                        </div>
                    ) : groups.map(group => (
                        <div
                            key={group.id}
                            className="card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/group/${group.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.125rem' }}>{group.name}</h3>
                                <Users size={16} className="text-muted" />
                            </div>
                            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                                {group.members.length} Members
                            </p>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {group.members.slice(0, 3).map((m: any, i) => (
                                    <div key={i} style={{
                                        width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {m.user.username[0].toUpperCase()}
                                    </div>
                                ))}
                                {group.members.length > 3 && <span className="text-sm text-muted">+{group.members.length - 3}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Create Group Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Create New Group</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateGroup}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Group Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Goa Trip"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Add Members</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        className="input"
                                        placeholder="Search by username or email..."
                                        value={searchQuery}
                                        onChange={e => handleSearchUsers(e.target.value)}
                                    />
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
                                        {searchResults.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => handleAddMember(u)}
                                                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.username}</div>
                                                <div style={{ fontSize: '0.75rem' }} className="text-muted">{u.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Members */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selectedMembers.map(m => (
                                        <div key={m.id} style={{
                                            backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
                                        }}>
                                            <span>{m.username}</span>
                                            <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveMember(m.id)} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, sub, highlight }: any) {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">{label}</span>
                {icon}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: highlight ? 'var(--success)' : 'inherit' }}>
                {value}
            </div>
            {sub && <div className="text-sm text-muted">{sub}</div>}
        </div>
    )
}
