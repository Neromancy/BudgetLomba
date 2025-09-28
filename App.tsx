
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Goal, View, TransactionType, Category } from './types.ts';
import { DashboardIcon, TransactionsIcon, GoalsIcon, SparklesIcon, StarIcon } from './components/Icons.tsx';
import { DEFAULT_CATEGORIES, POINTS_FOR_TRANSACTION, POINTS_FOR_NEW_GOAL, POINTS_FOR_COMPLETING_GOAL } from './constants.ts';
import Modal from './components/Modal.tsx';
// Import Views
import Dashboard from './components/Dashboard.tsx';
import TransactionsView from './components/TransactionsView.tsx';
import GoalsView from './components/GoalsView.tsx';

// Sample Data
const sampleTransactions: Transaction[] = [
    { id: '1', description: 'Monthly Salary', amount: 3500, date: new Date().toISOString().split('T')[0], type: TransactionType.INCOME, category: 'Salary' },
    { id: '2', description: 'Groceries', amount: 150.75, date: '2023-10-28', type: TransactionType.EXPENSE, category: 'Groceries' },
    { id: '3', description: 'Dinner with friends', amount: 65.50, date: '2023-10-27', type: TransactionType.EXPENSE, category: 'Dining Out' },
    { id: '4', description: 'Rent', amount: 1200, date: '2023-11-01', type: TransactionType.EXPENSE, category: 'Rent' },
];

const sampleGoals: Goal[] = [
    { id: 'g1', name: 'New Laptop', targetAmount: 1500, isCompleted: false, planStatus: 'idle' },
    { id: 'g2', name: 'Vacation Fund', targetAmount: 2000, isCompleted: false, planStatus: 'idle' },
    { id: 'g3', name: 'Emergency Fund', targetAmount: 500, isCompleted: true, planStatus: 'idle' },
];

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
    const [goals, setGoals] = useState<Goal[]>(sampleGoals);
    const [points, setPoints] = useState<number>(125);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

    const { totalIncome, totalExpenses, balance } = useMemo(() => {
        const income = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
    }, [transactions]);

    useEffect(() => {
        const newlyCompletedGoalIds = new Set<string>();
        goals.forEach(goal => {
            if (!goal.isCompleted && balance >= goal.targetAmount) {
                newlyCompletedGoalIds.add(goal.id);
            }
        });

        if (newlyCompletedGoalIds.size > 0) {
            setGoals(prevGoals =>
                prevGoals.map(g =>
                    newlyCompletedGoalIds.has(g.id) ? { ...g, isCompleted: true } : g
                )
            );
            setPoints(prev => prev + (POINTS_FOR_COMPLETING_GOAL * newlyCompletedGoalIds.size));
        }
    }, [balance, goals]);


    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: new Date().toISOString() };
        setTransactions(prev => [newTransaction, ...prev]);
        setPoints(prev => prev + POINTS_FOR_TRANSACTION);
        if (!categories.includes(transaction.category)) {
            setCategories(prev => [...prev, transaction.category]);
        }
    };
    
    const addGoal = (goal: Omit<Goal, 'id' | 'isCompleted'>) => {
        const newGoal = { ...goal, id: new Date().toISOString(), isCompleted: false, planStatus: 'idle' as const };
        setGoals(prev => [newGoal, ...prev]);
        // FIX: Corrected typo in constant name.
        setPoints(prev => prev + POINTS_FOR_NEW_GOAL);
    };

    const updateGoal = (updatedGoal: Goal) => {
        setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    };

    const deleteTransaction = (id: string) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const renderView = () => {
        const financialSummary = { totalIncome, totalExpenses, balance };
        switch (view) {
            case 'transactions':
                return <TransactionsView transactions={transactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction} categories={categories} isPremium={isPremium} />;
            case 'goals':
                return <GoalsView goals={goals} setGoals={setGoals} addGoal={addGoal} balance={balance} financialSummary={financialSummary} transactions={transactions} />;
            case 'dashboard':
            default:
                return <Dashboard summary={financialSummary} goals={goals} isPremium={isPremium} />;
        }
    };
    
    const NavItem: React.FC<{ targetView: View; icon: React.ReactNode; label: string }> = ({ targetView, icon, label }) => (
        <button
            onClick={() => setView(targetView)}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                view === targetView
                    ? 'bg-primary text-primary-text shadow-md'
                    : 'text-text-secondary hover:bg-primary-light hover:text-primary'
            }`}
        >
            {icon}
            <span className="ml-3 font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-background font-sans text-text-primary">
            {/* Sidebar */}
            <aside className="w-64 bg-surface p-4 flex flex-col border-r border-border">
                <div className="flex items-center mb-8">
                    <div className="bg-brand text-white p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold ml-3 text-brand">Zenith</h1>
                </div>
                <nav className="flex flex-col space-y-2">
                    <NavItem targetView="dashboard" icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" />
                    <NavItem targetView="transactions" icon={<TransactionsIcon className="w-6 h-6" />} label="Transactions" />
                    <NavItem targetView="goals" icon={<GoalsIcon className="w-6 h-6" />} label="Goals" />
                </nav>
                <div className="mt-auto">
                   <div className="bg-warning-light border-l-4 border-warning text-warning-text p-4 rounded-lg">
                     <p className="font-bold">Gamification</p>
                     <p className="text-sm">Earn points for managing your finances well!</p>
                   </div>
                </div>
            </aside>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-surface border-b border-border p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold capitalize">{view}</h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-primary-light text-primary font-bold py-2 px-4 rounded-full">
                            <StarIcon className="w-5 h-5 mr-2 text-warning" />
                            {points} Points
                        </div>
                        <button 
                          onClick={() => setUpgradeModalOpen(true)}
                          className="flex items-center bg-gradient-to-r from-primary to-indigo-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-200"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isPremium ? 'Premium User' : 'Upgrade to Premium'}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {renderView()}
                </main>
            </div>

            <Modal title="Upgrade to Zenith Premium" isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)}>
                <div className="space-y-4">
                    <p className="text-text-secondary">Unlock powerful AI features to supercharge your financial journey.</p>
                    <ul className="list-disc list-inside space-y-2 text-text-primary">
                        <li><span className="font-semibold">AI Receipt Scanning:</span> Instantly log expenses by taking a photo of your receipts.</li>
                        <li><span className="font-semibold">AI "What If?" Scenario Planner:</span> Simulate financial changes and see their impact on your goals.</li>
                    </ul>
                    {isPremium ? (
                        <p className="text-center font-semibold text-accent-text p-3 bg-accent-light rounded-lg">You are already a Premium member!</p>
                    ) : (
                        <button
                            onClick={() => {
                                setIsPremium(true);
                                setUpgradeModalOpen(false);
                            }}
                            className="w-full bg-primary text-primary-text font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors"
                        >
                            Subscribe Now
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default App;