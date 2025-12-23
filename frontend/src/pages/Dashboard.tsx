
import { useEffect, useState } from 'react';
import { LogOut, Users, CreditCard, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ groups: 0, owes: 1200, owed: 1500 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetching data from backend
        // fetch('/api/groups')...
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem' }}>CredResolve</h1>
                    <p className="text-muted text-sm">Financial harmony for groups</p>
                </div>
                <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
                    <LogOut size={16} />
                    Sign Out
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    icon={<Users size={24} color="#60a5fa" />}
                    label="Active Groups"
                    value="1"
                    sub="Goa Trip 2025"
                />
                <StatCard
                    icon={<DollarSign size={24} color="#34d399" />}
                    label="You are Owed"
                    value="₹1,500"
                    highlight={true}
                />
                <StatCard
                    icon={<CreditCard size={24} color="#f87171" />}
                    label="You Owe"
                    value="₹300"
                />
            </div>

            <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
                <div className="card">
                    <ActivityItem
                        user="Alice"
                        action="paid for"
                        item="Flight Tickets"
                        amount="₹3,000"
                        date="2 mins ago"
                    />
                    <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                    <ActivityItem
                        user="Bob"
                        action="paid for"
                        item="Hotel Stay"
                        amount="₹1,500"
                        date="5 mins ago"
                    />
                    <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                    <ActivityItem
                        user="Charlie"
                        action="paid for"
                        item="Dinner"
                        amount="₹600"
                        date="10 mins ago"
                    />
                </div>
            </section>
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

function ActivityItem({ user, action, item, amount, date }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {user[0]}
                </div>
                <div>
                    <p className="text-sm">
                        <span style={{ fontWeight: 600 }}>{user}</span> {action} <strong>{item}</strong>
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>{date}</p>
                </div>
            </div>
            <div style={{ fontWeight: 600 }}>{amount}</div>
        </div>
    )
}
