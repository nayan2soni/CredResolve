
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, User, Calendar, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

type Member = { userId: string, user: { id: string, username: string, email: string } };
type Expense = {
    id: string;
    description: string;
    amount: number;
    payer: { username: string };
    createdAt: string;
    splitType: string;
};

export default function GroupDetails() {
    const { id } = useParams();
    const { session } = useAuth();
    const navigate = useNavigate();

    const [group, setGroup] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id && session) {
            fetchData();
        }
    }, [id, session]);

    const fetchData = async () => {
        try {
            const { access_token } = session!;
            // Fetch Group Info
            const groupRes = await fetch(`/api/groups/${id}`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const groupData = await groupRes.json();

            // Fetch Expenses
            const expenseRes = await fetch(`/api/expenses/group/${id}`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const expenseData = await expenseRes.json();

            if (groupData.status === 'success') setGroup(groupData.data.group);
            if (expenseData.status === 'success') setExpenses(expenseData.data.expenses);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { access_token } = session!;
            // Default split logic: EQUAL among all members
            const memberIds = group.members.map((m: Member) => m.userId);

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    groupId: id,
                    amount: parseFloat(amount),
                    description,
                    splitType: 'EQUAL',
                    payerId: session?.user.id, // Current user pays
                    splits: memberIds // Everyone splits
                })
            });

            const data = await res.json();
            if (data.status === 'success') {
                setShowModal(false);
                setAmount('');
                setDescription('');
                fetchData(); // Refresh
            } else {
                alert(data.message || 'Failed to add expense');
            }
        } catch (e) {
            alert('Error adding expense');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (!group) return <div className="p-4">Group not found</div>;

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/dashboard')} className="btn" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{group.name}</h1>
                    <p className="text-muted text-sm">{group.members.length} members</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ marginLeft: 'auto' }}
                >
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            {/* Expenses List */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Expenses</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {expenses.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No expenses yet. Add one above!
                    </div>
                ) : (
                    expenses.map(exp => (
                        <div key={exp.id} style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Receipt size={20} color="var(--accent-primary)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{exp.description}</div>
                                <div className="text-sm text-muted">
                                    <span style={{ fontWeight: 500 }}>{exp.payer.username}</span> paid related to {group.name}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    ₹{exp.amount}
                                </div>
                                <div className="text-sm text-muted">
                                    {new Date(exp.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Add New Expense</h3>
                        <form onSubmit={handleAddExpense}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="text-sm">Description</label>
                                <input
                                    className="input"
                                    placeholder="What was this for?"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-sm">Amount</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                                    <input
                                        type="number"
                                        className="input"
                                        style={{ paddingLeft: '2rem' }}
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                                Split equally between <strong>{group.members.length} people</strong>.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
