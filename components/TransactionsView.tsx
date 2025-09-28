
import React, { useState, useMemo, ChangeEvent } from 'react';
import { Transaction, TransactionType, Category } from '../types.ts';
import { PlusIcon, CameraIcon, SparklesIcon, LoadingSpinner } from './Icons.tsx';
import Modal from './Modal.tsx';
import { suggestCategory, scanReceipt } from '../services/geminiService.ts';
import { MOCK_RECEIPT_IMAGE_BASE64 } from '../constants.ts';

interface TransactionsViewProps {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    categories: Category[];
    isPremium: boolean;
}

const formInputClasses = "mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary bg-surface text-text-primary";

const TransactionForm: React.FC<{
    onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
    onClose: () => void;
    categories: Category[];
    initialData?: Partial<Transaction>;
}> = ({ onSubmit, onClose, categories, initialData }) => {
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
    const [category, setCategory] = useState(initialData?.category || '');
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleDescriptionBlur = async () => {
        if (description && !category) {
            setIsSuggesting(true);
            const suggested = await suggestCategory(description, categories);
            if (suggested) {
                setCategory(suggested);
            }
            setIsSuggesting(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ description, amount: parseFloat(amount), date, type, category });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary">Type</label>
                <div className="mt-1 flex rounded-md">
                    <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 px-4 py-2 text-sm font-medium border border-border rounded-l-md ${type === TransactionType.EXPENSE ? 'bg-primary text-primary-text' : 'bg-surface text-text-primary hover:bg-gray-50'}`}>Expense</button>
                    <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b border-r border-border rounded-r-md ${type === TransactionType.INCOME ? 'bg-accent text-primary-text' : 'bg-surface text-text-primary hover:bg-gray-50'}`}>Income</button>
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
                <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={handleDescriptionBlur} className={formInputClasses} required />
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-text-secondary">Amount</label>
                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={formInputClasses} required step="0.01" />
            </div>
             <div className="relative">
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Category</label>
                <input list="categories" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={formInputClasses} required />
                <datalist id="categories">
                    {categories.map(c => <option key={c} value={c} />)}
                </datalist>
                {isSuggesting && <LoadingSpinner className="w-5 h-5 absolute right-2 top-9 text-primary" />}
                {!isSuggesting && !category && description && <SparklesIcon className="w-5 h-5 absolute right-2 top-9 text-warning" title="Category will be suggested" />}
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Date</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={formInputClasses} required />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-primary-text bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-hover">Add Transaction</button>
            </div>
        </form>
    );
};

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, addTransaction, deleteTransaction, categories, isPremium }) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isScanModalOpen, setScanModalOpen] = useState(false);
    const [isLoadingScan, setIsLoadingScan] = useState(false);
    const [scannedData, setScannedData] = useState<Partial<Transaction> | null>(null);

    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => filterType === 'all' || t.type === filterType)
            .filter(t => filterCategory === 'all' || t.category === filterCategory);
    }, [transactions, filterType, filterCategory]);
    
    const handleScanReceipt = async () => {
      setIsLoadingScan(true);
      // In a real app, you would use navigator.mediaDevices.getUserMedia to get camera input
      // and capture an image. Here, we simulate this process.
      const result = await scanReceipt(MOCK_RECEIPT_IMAGE_BASE64);
      setIsLoadingScan(false);

      if (result.total) {
          const prefillData: Partial<Transaction> = {
              description: result.merchant || 'Scanned Receipt',
              amount: result.total,
              date: result.date || new Date().toISOString().split('T')[0],
              type: TransactionType.EXPENSE,
          };
          setScannedData(prefillData);
          setScanModalOpen(false);
          setAddModalOpen(true);
      } else {
          alert("Could not extract details from the receipt. Please try again.");
      }
    };


    return (
        <div className="bg-surface p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-primary">Transaction History</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setScanModalOpen(true)}
                        disabled={!isPremium}
                        className="flex items-center px-4 py-2 text-sm font-medium text-primary-text bg-secondary rounded-md hover:bg-secondary-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <CameraIcon className="w-5 h-5 mr-2" />
                        Scan Receipt
                    </button>
                    <button onClick={() => { setScannedData(null); setAddModalOpen(true); }} className="flex items-center px-4 py-2 text-sm font-medium text-primary-text bg-primary rounded-md hover:bg-primary-hover">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4 mb-4">
                <div>
                    <label htmlFor="type-filter" className="text-sm font-medium text-text-secondary">Type</label>
                    <select id="type-filter" value={filterType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)} className={formInputClasses}>
                        <option value="all">All</option>
                        <option value={TransactionType.INCOME}>Income</option>
                        <option value={TransactionType.EXPENSE}>Expense</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="cat-filter" className="text-sm font-medium text-text-secondary">Category</label>
                     <select id="cat-filter" value={filterCategory} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)} className={formInputClasses}>
                        <option value="all">All</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                        {filteredTransactions.map((t, index) => (
                            <tr key={t.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-background'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{t.description}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${t.type === TransactionType.INCOME ? 'text-accent' : 'text-danger'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-light text-primary">{t.category}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{t.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => deleteTransaction(t.id)} className="text-danger hover:text-danger-text">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredTransactions.length === 0 && <p className="text-center py-8 text-text-secondary">No transactions found.</p>}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Transaction">
                <TransactionForm onSubmit={addTransaction} onClose={() => setAddModalOpen(false)} categories={categories} initialData={scannedData || {}} />
            </Modal>
            <Modal isOpen={isScanModalOpen} onClose={() => setScanModalOpen(false)} title="Scan Receipt (Premium)">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">Simulating camera view. Click below to "capture" a receipt image and let AI extract the details.</p>
                    <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
                        <CameraIcon className="w-16 h-16 text-text-muted" />
                    </div>
                    <button onClick={handleScanReceipt} disabled={isLoadingScan} className="w-full bg-primary text-primary-text font-bold py-2 px-4 rounded-lg hover:bg-primary-hover flex justify-center items-center">
                        {isLoadingScan ? <LoadingSpinner className="w-5 h-5"/> : 'Capture & Scan'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default TransactionsView;