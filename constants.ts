
import { Category } from './types.ts';

export const DEFAULT_CATEGORIES: Category[] = [
  'Groceries',
  'Dining Out',
  'Transport',
  'Utilities',
  'Rent',
  'Entertainment',
  'Shopping',
  'Health',
  'Salary',
  'Freelance',
  'Other',
];

export const POINTS_FOR_TRANSACTION = 10;
export const POINTS_FOR_NEW_GOAL = 25;
export const POINTS_FOR_COMPLETING_GOAL = 100;

// Mock base64 image for receipt scanning simulation
export const MOCK_RECEIPT_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAARgAAAEYCAIAAAC/gL+PAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVHja7cEBDQAAAMIg+6e2xweMCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GEAATwAAVsm3wAAAABJRU5ErkJggg==';