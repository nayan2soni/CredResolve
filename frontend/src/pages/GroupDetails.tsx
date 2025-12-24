import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import api from '../lib/axios';

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
    const [showSettleModal, setShowSettleModal] = useState(false);

    // Expense State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT, PERCENT
    const [splits, setSplits] = useState<any[]>([]); // { userId, amount/percent }

    // Settlement State
    const [settlePayeeId, setSettlePayeeId] = useState('');
    const [settleAmount, setSettleAmount] = useState('');

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id && session) {
            fetchData();
        }
    }, [id, session]);

    // Initialize splits when modal opens or members change
    useEffect(() => {
        if (group?.members) {
            const initialSplits = group.members.map((m: Member) => ({
                userId: m.userId,
                username: m.user.username,
                amount: '',
                percent: ''
            }));
            setSplits(initialSplits);
        }
    }, [group, showModal]);

    const fetchData = async () => {
        try {
            // Fetch Group Info
            const { data: groupData } = await api.get(`/groups/${id}`);

            // Fetch Expenses
            const { data: expenseData } = await api.get(`/expenses/group/${id}`);

            if (groupData.status === 'success') setGroup(groupData.data.group);
            if (expenseData.status === 'success') setExpenses(expenseData.data.expenses);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSplitChange = (index: number, field: string, value: string) => {
        const newSplits = [...splits];
        newSplits[index][field] = value;
        setSplits(newSplits);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Validate Splits
            const numericAmount = parseFloat(amount);
            let finalSplits = [];

            if (splitType === 'EQUAL') {
                finalSplits = group.members.map((m: Member) => m.userId);
            } else if (splitType === 'EXACT') {
                const total = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                if (Math.abs(total - numericAmount) > 0.01) {
                    alert(`Splits sum (${total}) must match expense amount (${numericAmount})`);
                    setSubmitting(false);
                    return;
                }
                finalSplits = splits.map(s => ({ userId: s.userId, amount: parseFloat(s.amount) }));
            } else if (splitType === 'PERCENT') {
                const total = splits.reduce((sum, s) => sum + (parseFloat(s.percent) || 0), 0);
                if (Math.abs(total - 100) > 0.1) {
                    alert(`Percentages sum (${total}%) must equal 100%`);
                    setSubmitting(false);
                    return;
                }
                finalSplits = splits.map(s => ({ userId: s.userId, percent: parseFloat(s.percent) }));
            }

            const { data: responseData } = await api.post('/expenses', {
                groupId: id,
                amount: numericAmount,
                description,
                splitType,
                payerId: session?.user.id,
                splits: finalSplits
            });

            if (responseData.status === 'success') {
                setShowModal(false);
                setAmount('');
                setDescription('');
                setSplitType('EQUAL');
                fetchData();
            } else {
                alert(responseData.message || 'Failed to add expense');
            }
        } catch (e: any) {
            alert(e.response?.data?.message || 'Error adding expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettleUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: responseData } = await api.post('/settlements', {
                groupId: id,
                payeeId: settlePayeeId,
                amount: parseFloat(settleAmount)
            });

            if (responseData.status === 'success') {
                setShowSettleModal(false);
                setSettleAmount('');
                setSettlePayeeId('');
                alert('Settlement recorded successfully!');
                // No direct UI update needed for settlements usually, but ideally we show it in the list or just refresh
                fetchData();
            } else {
                alert(responseData.message || 'Failed to settle up');
            }
        } catch (e: any) {
            alert(e.response?.data?.message || 'Error settling up');
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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowSettleModal(true)}
                        className="btn"
                        style={{ border: '1px solid var(--border-color)' }}
                    >
                        Settle Up
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={16} /> Add Expense
                    </button>
                </div>
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
                                    <span style={{ fontWeight: 500 }}>{exp.payer.username}</span> paid <span style={{ fontSize: '0.8em', background: '#eee', padding: '2px 4px', borderRadius: '4px' }}>{exp.splitType}</span>
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
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
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

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="text-sm">Split By</label>
                                <select
                                    className="input"
                                    value={splitType}
                                    onChange={e => setSplitType(e.target.value)}
                                >
                                    <option value="EQUAL">Equally</option>
                                    <option value="EXACT">Exact Amounts</option>
                                    <option value="PERCENT">Percentages</option>
                                </select>
                            </div>

                            {splitType !== 'EQUAL' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="text-sm">Split Details</label>
                                    {splits.map((split, index) => (
                                        <div key={split.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span>{split.username}</span>
                                            <input
                                                type="number"
                                                className="input"
                                                style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                                                placeholder={splitType === 'EXACT' ? 'Amount' : '%'}
                                                value={splitType === 'EXACT' ? split.amount : split.percent}
                                                onChange={e => handleSplitChange(index, splitType === 'EXACT' ? 'amount' : 'percent', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {splitType === 'EQUAL' && (
                                <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                                    Split equally between <strong>{group.members.length} people</strong>.
                                </p>
                            )}

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

            {/* Settle Up Modal */}
            {showSettleModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Settle Up</h3>
                        <form onSubmit={handleSettleUp}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="text-sm">Pay To</label>
                                <select
                                    className="input"
                                    value={settlePayeeId}
                                    onChange={e => setSettlePayeeId(e.target.value)}
                                    required
                                >
                                    <option value="">Select person</option>
                                    {group.members
                                        .filter((m: Member) => m.userId !== session?.user.id)
                                        .map((m: Member) => (
                                            <option key={m.userId} value={m.userId}>{m.user.username}</option>
                                        ))}
                                </select>
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
                                        value={settleAmount}
                                        onChange={e => setSettleAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowSettleModal(false)} className="btn">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Processing...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
