
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { Transaction, Goal } from '../types.ts';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this project, we assume it's always available.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ReceiptScanResult {
  merchant?: string;
  total?: number;
  date?: string; // YYYY-MM-DD
}

export const scanReceipt = async (base64ImageData: string): Promise<ReceiptScanResult> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData,
      },
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
          imagePart, 
          { text: 'Analyze this receipt image. Extract merchant name, total amount (as a number), and date (in YYYY-MM-DD format).' }
        ] 
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            total: { type: Type.NUMBER },
            date: { type: Type.STRING },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ReceiptScanResult;
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return {};
  }
};

export const suggestCategory = async (description: string, existingCategories: string[]): Promise<string> => {
  try {
    const prompt = `Given the transaction description "${description}", suggest the most likely category. Prioritize categories from this list: [${existingCategories.join(', ')}]. If none fit well, suggest a new, appropriate, single-word category. Respond with only the category name, without any extra text or punctuation.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    return '';
  }
};

interface FinancialSnapshot {
    income: number;
    expenses: number;
    balance: number;
    goals: Goal[];
}

export const analyzeScenario = async (scenario: string, financials: FinancialSnapshot): Promise<string> => {
    try {
        const prompt = `A user wants to know the impact of a financial scenario. 
        Current Financials:
        - Monthly Income: $${financials.income.toFixed(2)}
        - Monthly Expenses: $${financials.expenses.toFixed(2)}
        - Current Balance: $${financials.balance.toFixed(2)}
        - Savings Goals: ${financials.goals.map(g => `${g.name} ($${g.targetAmount})`).join(', ')}

        Scenario: "${scenario}"

        Analyze the impact of this scenario on their balance and savings goals. Provide a concise summary and updated timelines for their goals. Respond in simple markdown format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are a helpful financial advisor providing "what-if" scenario analysis.'
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error analyzing scenario:', error);
        return 'Sorry, I was unable to analyze that scenario. Please try again.';
    }
};

interface GoalSuggestion {
    name: string;
    targetAmount: number;
}

export const suggestGoals = async (financials: { income: number, expenses: number, balance: number }): Promise<GoalSuggestion[]> => {
    try {
        const prompt = `Based on the user's financials (Monthly Income: $${financials.income}, Monthly Expenses: $${financials.expenses}, Current Balance: $${financials.balance}), suggest three distinct and realistic savings goals with appropriate target amounts.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            targetAmount: { type: Type.NUMBER },
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Error suggesting goals:', error);
        return [];
    }
};

export const createBudgetPlan = async (goal: Goal, balance: number, transactions: Transaction[]): Promise<string> => {
    try {
        const simplifiedTransactions = transactions.map(t => `${t.type} of $${t.amount} for ${t.description} (${t.category}) on ${t.date}`).join('\n');
        
        const prompt = `A user wants a budget plan to save for their goal: "${goal.name}" which has a target of $${goal.targetAmount}. Their current balance is $${balance}. Here are their 20 most recent transactions to understand their spending habits:\n${simplifiedTransactions}\n\nCreate a simple, actionable budget plan in markdown.
    
    The plan MUST start with a "Summary" section inside a markdown blockquote (>). This summary should give a one-sentence overview of the projected timeline and the single most important action they should take.
    
    After the summary, include these sections:
    - **Projected Timeline:** A realistic estimate of how long it will take to reach the goal.
    - **Spending Limits:** Specific monthly spending limits for 2-3 key expense categories based on their history.
    - **Personalized Savings Tips:** Two actionable tips based on their transactions.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                systemInstruction: "You are a friendly budget planner creating simple, motivational financial plans."
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error creating budget plan:', error);
        return 'Sorry, I was unable to create a budget plan. Please try again.';
    }
};

export const updateBudgetPlan = async (goal: Goal, balance: number, transactions: Transaction[], previousPlan: string): Promise<string> => {
    try {
        const simplifiedTransactions = transactions.map(t => `${t.type} of $${t.amount} for ${t.description} (${t.category}) on ${t.date}`).join('\n');

        const prompt = `A user wants to update their budget plan for the goal: "${goal.name}" (Target: $${goal.targetAmount}). Their current balance is $${balance}.

        Here is their **previous plan**:
        ---
        ${previousPlan}
        ---
        
        Here are their **20 most recent transactions** to analyze their latest spending habits:
        ---
        ${simplifiedTransactions}
        ---
        
        Analyze their progress and recent spending. Generate an **updated, complete budget plan** in markdown.
        - The new plan should replace the old one entirely.
        - **Crucially, identify any significant "unplanned" spending** that deviates from the previous plan's suggestions and mention how to get back on track.
        - Start with an updated "Summary" blockquote.
        - Include updated Timeline, Spending Limits, and Savings Tips sections.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a friendly budget planner updating a user's financial plan."
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error updating budget plan:', error);
        return 'Sorry, I was unable to update the budget plan. Please try again.';
    }
};