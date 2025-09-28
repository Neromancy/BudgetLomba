
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Goal } from '../types';
import Modal from './Modal';
import { analyzeScenario } from '../services/geminiService';
import { LoadingSpinner, SparklesIcon } from './Icons';
import ReactMarkdown from 'react-markdown';


interface DashboardProps {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  goals: Goal[];
  isPremium: boolean;
}

const StatCard: React.FC<{ title: string; amount: number; colorClass: string }> = ({ title, amount, colorClass }) => (
  <div className="bg-surface p-6 rounded-xl shadow-md flex-1">
    <h3 className="text-md font-medium text-text-secondary">{title}</h3>
    <p className={`text-3xl font-bold ${colorClass}`}>
      ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ summary, goals, isPremium }) => {
    const [isPlannerOpen, setPlannerOpen] = useState(false);
    const [scenario, setScenario] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { totalIncome, totalExpenses, balance } = summary;
    const spentPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    const chartData = [
        { name: 'Spent', value: totalExpenses },
        { name: 'Remaining', value: totalIncome > totalExpenses ? totalIncome - totalExpenses : 0 },
    ];
    const COLORS = ['#ef4444', '#10b981'];

    const handleAnalyzeScenario = async () => {
        if (!scenario) return;
        setIsLoading(true);
        setAnalysis('');
        const result = await analyzeScenario(scenario, {
            income: totalIncome,
            expenses: totalExpenses,
            balance: balance,
            goals: goals,
        });
        setAnalysis(result);
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-8">
                <StatCard title="Total Income" amount={totalIncome} colorClass="text-accent" />
                <StatCard title="Total Expenses" amount={totalExpenses} colorClass="text-danger" />
                <StatCard title="Current Balance" amount={balance} colorClass="text-primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-text-primary">Budget Breakdown</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-text-primary">
                                    {spentPercentage.toFixed(0)}%
                                </text>
                                <text x="50%" y="50%" dy="25" textAnchor="middle" className="text-md fill-text-secondary">
                                    of income spent
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl shadow-md flex flex-col">
                    <h3 className="text-xl font-bold mb-4 text-text-primary">Scenario Planner</h3>
                    <p className="text-text-secondary mb-4 flex-grow">
                        Explore how financial changes could impact your goals with our AI-powered planner.
                    </p>
                    <button
                        onClick={() => setPlannerOpen(true)}
                        disabled={!isPremium}
                        className={`w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg transition-colors ${
                            isPremium
                                ? 'bg-primary text-primary-text hover:bg-primary-hover'
                                : 'bg-gray-200 text-text-muted cursor-not-allowed'
                        }`}
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        What If?
                    </button>
                    {!isPremium && <p className="text-center text-sm text-text-muted mt-2">Premium Feature</p>}
                </div>
            </div>
            
            <Modal title="AI 'What If?' Scenario Planner" isOpen={isPlannerOpen} onClose={() => setPlannerOpen(false)}>
                <div className="space-y-4">
                    <p className="text-text-secondary">
                        Enter a hypothetical change to your finances. For example: "What if my income increases by $300 a month, but my rent goes up by $100?"
                    </p>
                    <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        className="w-full h-24 p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary bg-surface"
                        placeholder="Type your scenario here..."
                    />
                    <button
                        onClick={handleAnalyzeScenario}
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-text font-bold py-2 px-4 rounded-lg hover:bg-primary-hover flex justify-center items-center disabled:bg-gray-400"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : 'Analyze Scenario'}
                    </button>
                    {analysis && (
                         <div className="prose max-w-none p-4 bg-background rounded-md border border-border">
                           <ReactMarkdown>{analysis}</ReactMarkdown>
                         </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;