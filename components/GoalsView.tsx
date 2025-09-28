
import React, { useState } from 'react';
import { Goal, Transaction } from '../types';
import { PlusIcon, SparklesIcon, LoadingSpinner, StarIcon } from './Icons';
import Modal from './Modal';
import { suggestGoals, createBudgetPlan, updateBudgetPlan } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';


interface GoalsViewProps {
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    addGoal: (goal: Omit<Goal, 'id' | 'isCompleted'>) => void;
    balance: number;
    financialSummary: { totalIncome: number; totalExpenses: number; balance: number };
    transactions: Transaction[];
}

const formInputClasses = "mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary bg-surface text-text-primary";

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

const GoalsView: React.FC<GoalsViewProps> = ({ goals, setGoals, addGoal, balance, financialSummary, transactions }) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isSuggestModalOpen, setSuggestModalOpen] = useState(false);
    
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestedGoals, setSuggestedGoals] = useState<{ name: string; targetAmount: number; }[]>([]);

    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalAmount, setNewGoalAmount] = useState('');

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        addGoal({ name: newGoalName, targetAmount: parseFloat(newGoalAmount) });
        setNewGoalName('');
        setNewGoalAmount('');
        setAddModalOpen(false);
    };

    const handleSuggestGoals = async () => {
        setIsLoadingSuggestions(true);
        setSuggestedGoals([]);
        const suggestions = await suggestGoals({
            income: financialSummary.totalIncome,
            expenses: financialSummary.totalExpenses,
            balance: financialSummary.balance
        });
        setSuggestedGoals(suggestions);
        setIsLoadingSuggestions(false);
    };

    const handleGenerateOrUpdatePlan = async (goal: Goal) => {
        setGoals(prevGoals => prevGoals.map(g => g.id === goal.id ? { ...g, planStatus: 'generating' } : g));

        try {
            const recentTransactions = transactions.slice(0, 20);
            let plan: string;
            if (goal.budgetPlan) {
                 plan = await updateBudgetPlan(goal, balance, recentTransactions, goal.budgetPlan);
            } else {
                 plan = await createBudgetPlan(goal, balance, recentTransactions);
            }
            setGoals(prevGoals => prevGoals.map(g => g.id === goal.id ? { ...g, budgetPlan: plan, planStatus: 'generated' } : g));
        } catch (error) {
            console.error("Error generating/updating plan:", error);
            setGoals(prevGoals => prevGoals.map(g => g.id === goal.id ? { ...g, planStatus: 'error' } : g));
        }
    };

    const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
        const progress = goal.isCompleted ? 100 : Math.min((balance / goal.targetAmount) * 100, 100);
        
        const getButtonText = () => {
            if (goal.planStatus === 'generating') return "Generating...";
            if (goal.planStatus === 'error') return "Error - Try Again";
            return goal.budgetPlan ? "Refresh Plan" : "Generate AI Budget Plan";
        };

        return (
            <div className="bg-surface p-6 rounded-xl shadow-md flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg text-text-primary">{goal.name}</h4>
                        <p className="text-text-secondary">Target: ${goal.targetAmount.toLocaleString()}</p>
                    </div>
                    {goal.isCompleted && (
                        <div className="flex items-center text-accent-text font-semibold bg-accent-light px-3 py-1 rounded-full text-sm">
                            <StarIcon className="w-5 h-5 mr-1 text-accent" />
                            Completed!
                        </div>
                    )}
                </div>
                {!goal.isCompleted && (
                    <div>
                        <ProgressBar progress={progress} />
                        <p className="text-right text-sm text-text-secondary mt-1">{progress.toFixed(0)}% Funded</p>
                    </div>
                )}
                {!goal.isCompleted && (
                    <button 
                        onClick={() => handleGenerateOrUpdatePlan(goal)}
                        disabled={goal.planStatus === 'generating'}
                        className="w-full flex items-center justify-center text-sm font-semibold text-primary py-2 px-3 border border-primary rounded-lg hover:bg-primary-light transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-wait"
                    >
                        {goal.planStatus === 'generating' ? <LoadingSpinner className="w-4 h-4 mr-2"/> : <SparklesIcon className="w-4 h-4 mr-2"/>}
                        {getButtonText()}
                    </button>
                )}
                 {(goal.planStatus === 'generating' && !goal.budgetPlan) && (
                    <div className="text-center p-4 bg-background rounded-md">
                        <p className="text-sm text-text-secondary">AI is crafting your plan...</p>
                    </div>
                )}
                {goal.budgetPlan && (
                    <div className="prose prose-sm max-w-none p-4 bg-background rounded-md border border-border">
                        <ReactMarkdown>{goal.budgetPlan}</ReactMarkdown>
                    </div>
                )}
                 {goal.planStatus === 'error' && (
                    <div className="text-center p-2 bg-danger-light text-danger-text rounded-md">
                        <p className="text-sm font-semibold">Failed to generate plan.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Your Savings Goals</h3>
                <div className="flex space-x-2">
                    <button onClick={() => {setSuggestModalOpen(true); handleSuggestGoals();}} className="flex items-center px-4 py-2 text-sm font-medium text-primary-text bg-secondary rounded-md hover:bg-secondary-hover">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Suggest Goals with AI
                    </button>
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-primary-text bg-primary rounded-md hover:bg-primary-hover">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Goal
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
            </div>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Set a New Goal">
                <form onSubmit={handleAddGoal} className="space-y-4">
                    <div>
                        <label htmlFor="goal-name" className="block text-sm font-medium text-text-secondary">Goal Name</label>
                        <input type="text" id="goal-name" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className={formInputClasses} required/>
                    </div>
                    <div>
                        <label htmlFor="goal-amount" className="block text-sm font-medium text-text-secondary">Target Amount</label>
                        <input type="number" id="goal-amount" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} className={formInputClasses} required step="0.01" />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-primary-text bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-hover">Set Goal</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isSuggestModalOpen} onClose={() => setSuggestModalOpen(false)} title="AI Goal Suggestions">
                {isLoadingSuggestions ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner className="w-10 h-10 text-primary" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {suggestedGoals.map((g, i) => (
                            <div key={i} className="p-4 bg-background rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-text-primary">{g.name}</p>
                                    <p className="text-sm text-text-secondary">${g.targetAmount.toLocaleString()}</p>
                                </div>
                                <button onClick={() => {addGoal(g); setSuggestModalOpen(false);}} className="px-3 py-1 text-sm font-medium text-primary bg-primary-light rounded-full hover:bg-primary hover:text-primary-text transition-colors">Add</button>
                            </div>
                        ))}
                         {suggestedGoals.length === 0 && !isLoadingSuggestions && (
                            <div className="text-center py-8 text-text-secondary">
                                <p>Could not generate suggestions. Please try again.</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default GoalsView;