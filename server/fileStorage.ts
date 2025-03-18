// server/fileStorage.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  users, parties, transactions, bills, activities, 
  type User, type InsertUser, type Party, type Transaction, 
  type Bill, type Activity 
} from "@shared/schema";
import { IStorage } from './storage';
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Set up directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PARTIES_FILE = path.join(DATA_DIR, 'parties.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const BILLS_FILE = path.join(DATA_DIR, 'bills.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');

// Helper functions
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

export class FileStorage implements IStorage {
  private users: Map<number, User>;
  private parties: Map<number, Party>;
  private transactions: Map<number, Transaction>;
  private bills: Map<number, Bill>;
  private activities: Map<number, Activity>;
  
  sessionStore: session.SessionStore;
  
  private userCounter: number;
  private partyCounter: number;
  private transactionCounter: number;
  private billCounter: number;
  private activityCounter: number;

  constructor() {
    // Initialize sessionStore
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Load or initialize counters
    const counters = readJsonFile(COUNTERS_FILE, {
      userCounter: 1,
      partyCounter: 1,
      transactionCounter: 1,
      billCounter: 1,
      activityCounter: 1
    });
    
    this.userCounter = counters.userCounter;
    this.partyCounter = counters.partyCounter;
    this.transactionCounter = counters.transactionCounter;
    this.billCounter = counters.billCounter;
    this.activityCounter = counters.activityCounter;
    
    // Load data from files or initialize with empty arrays
    const usersArray = readJsonFile<User[]>(USERS_FILE, []);
    const partiesArray = readJsonFile<Party[]>(PARTIES_FILE, []);
    const transactionsArray = readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
    const billsArray = readJsonFile<Bill[]>(BILLS_FILE, []);
    const activitiesArray = readJsonFile<Activity[]>(ACTIVITIES_FILE, []);
    
    // Convert arrays to maps
    this.users = new Map(usersArray.map(u => [u.id, u]));
    this.parties = new Map(partiesArray.map(p => [p.id, p]));
    this.transactions = new Map(transactionsArray.map(t => [t.id, t]));
    this.bills = new Map(billsArray.map(b => [b.id, b]));
    this.activities = new Map(activitiesArray.map(a => [a.id, a]));
    
    // If there's no data, initialize with sample data (optional)
    if (this.parties.size === 0) {
      this.initializeSampleData();
    }
  }
  
  // Save counters to persist the next ID values
  private saveCounters(): void {
    writeJsonFile(COUNTERS_FILE, {
      userCounter: this.userCounter,
      partyCounter: this.partyCounter,
      transactionCounter: this.transactionCounter,
      billCounter: this.billCounter,
      activityCounter: this.activityCounter
    });
  }
  
  // Save data to files
  private saveUsers(): void {
    writeJsonFile(USERS_FILE, Array.from(this.users.values()));
  }
  
  private saveParties(): void {
    writeJsonFile(PARTIES_FILE, Array.from(this.parties.values()));
  }
  
  private saveTransactions(): void {
    writeJsonFile(TRANSACTIONS_FILE, Array.from(this.transactions.values()));
  }
  
  private saveBills(): void {
    writeJsonFile(BILLS_FILE, Array.from(this.bills.values()));
  }
  
  private saveActivities(): void {
    writeJsonFile(ACTIVITIES_FILE, Array.from(this.activities.values()));
  }
  
  // Optional: Initialize with sample data
  private initializeSampleData(): void {
    // Sample parties
    const sampleParties = [
      {
        id: 1,
        name: "Acme Corporation",
        address: "123 Business Ave, Commerce City, 90210",
        contactPerson: "John Smith",
        phone: "555-123-4567",
        email: "john.smith@acme.com",
        balance: 0,
        lastActivityDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "TechSolutions Inc.",
        address: "456 Innovation Drive, Tech Valley, 94301",
        contactPerson: "Sarah Jones",
        phone: "555-987-6543",
        email: "sarah.jones@techsolutions.com",
        balance: 0,
        lastActivityDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add sample parties to the map
    sampleParties.forEach(party => {
      this.parties.set(party.id, party);
    });
    
    // Update counter
    this.partyCounter = 3;
    
    // Save to files
    this.saveParties();
    this.saveCounters();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.saveUsers();
    this.saveCounters();
    return user;
  }

  // Party operations
  async getParties(): Promise<Party[]> {
    return Array.from(this.parties.values());
  }

  async getParty(id: number): Promise<Party | undefined> {
    return this.parties.get(id);
  }

  async createParty(partyData: Omit<Party, "id" | "balance" | "lastActivityDate" | "createdAt" | "updatedAt">): Promise<Party> {
    const id = this.partyCounter++;
    const now = new Date();
    const party: Party = {
      ...partyData,
      id,
      balance: 0,
      lastActivityDate: undefined,
      createdAt: now,
      updatedAt: now
    };
    this.parties.set(id, party);
    
    // Log activity
    await this.createActivity({
      performedBy: "system",
      description: "Created new party",
      entityType: "PARTY",
      entityId: id,
      entityName: party.name,
      details: `Created party: ${party.name}`,
      timestamp: now
    });
    
    this.saveParties();
    this.saveCounters();
    return party;
  }

  async updateParty(id: number, partyData: Partial<Party>): Promise<Party | undefined> {
    const party = this.parties.get(id);
    if (!party) return undefined;
    
    const updatedParty = {
      ...party,
      ...partyData,
      updatedAt: new Date()
    };
    this.parties.set(id, updatedParty);
    
    // Log activity
    await this.createActivity({
      performedBy: "system",
      description: "Updated party",
      entityType: "PARTY",
      entityId: id,
      entityName: updatedParty.name,
      details: `Updated party: ${updatedParty.name}`,
      timestamp: new Date()
    });
    
    this.saveParties();
    return updatedParty;
  }

  async updatePartyBalance(id: number, amount: number, isCredit: boolean): Promise<Party | undefined> {
    const party = this.parties.get(id);
    if (!party) return undefined;
    
    const newBalance = isCredit 
      ? party.balance + amount 
      : party.balance - amount;
    
    const updatedParty = {
      ...party,
      balance: newBalance,
      lastActivityDate: new Date(),
      updatedAt: new Date()
    };
    
    this.parties.set(id, updatedParty);
    this.saveParties();
    return updatedParty;
  }

  async updatePartyLastActivity(id: number): Promise<void> {
    const party = this.parties.get(id);
    if (!party) return;
    
    const updatedParty = {
      ...party,
      lastActivityDate: new Date(),
      updatedAt: new Date()
    };
    
    this.parties.set(id, updatedParty);
    this.saveParties();
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values());
    
    return Promise.all(transactions.map(async (transaction) => {
      const party = await this.getParty(transaction.partyId);
      return {
        ...transaction,
        partyName: party?.name
      };
    }));
  }

  async getTransactionsByParty(partyId: number): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.partyId === partyId);
    
    const party = await this.getParty(partyId);
    
    return transactions.map(transaction => ({
      ...transaction,
      partyName: party?.name
    }));
  }

  async getRecentTransactions(limit: number = 7): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return Promise.all(transactions.map(async (transaction) => {
      const party = await this.getParty(transaction.partyId);
      return {
        ...transaction,
        partyName: party?.name
      };
    }));
  }

  async getCreditTransactionsWithoutBill(): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.type === "CREDIT" && !transaction.billId);
    
    return Promise.all(transactions.map(async (transaction) => {
      const party = await this.getParty(transaction.partyId);
      return {
        ...transaction,
        partyName: party?.name
      };
    }));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const party = await this.getParty(transaction.partyId);
    return {
      ...transaction,
      partyName: party?.name
    };
  }

  async createTransaction(transactionData: Omit<Transaction, "id" | "billId" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const id = this.transactionCounter++;
    const now = new Date();
    
    const transaction: Transaction = {
      ...transactionData,
      id,
      billId: undefined,
      createdAt: now,
      updatedAt: now
    };
    
    this.transactions.set(id, transaction);
    
    // Update party balance
    await this.updatePartyBalance(
      transaction.partyId, 
      transaction.amount, 
      transaction.type === "CREDIT"
    );
    
    // Log activity
    const party = await this.getParty(transaction.partyId);
    await this.createActivity({
      performedBy: "system",
      description: `Created ${transaction.type.toLowerCase()} entry`,
      entityType: "TRANSACTION",
      entityId: id,
      entityName: `${transaction.type} for ${party?.name}`,
      details: `Created ${transaction.type.toLowerCase()} entry of ₹${transaction.amount} for ${party?.name}`,
      timestamp: now
    });
    
    this.saveTransactions();
    this.saveCounters();
    
    return {
      ...transaction,
      partyName: party?.name
    };
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = {
      ...transaction,
      ...transactionData,
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    this.saveTransactions();
    
    // Log activity
    const party = await this.getParty(updatedTransaction.partyId);
    await this.createActivity({
      performedBy: "system",
      description: "Updated transaction",
      entityType: "TRANSACTION",
      entityId: id,
      entityName: `Transaction for ${party?.name}`,
      details: `Updated transaction for ${party?.name}`,
      timestamp: new Date()
    });
    
    return {
      ...updatedTransaction,
      partyName: party?.name
    };
  }

  // Bill operations
  async getBills(): Promise<Bill[]> {
    const bills = Array.from(this.bills.values());
    
    return Promise.all(bills.map(async (bill) => {
      let transactionReference;
      if (bill.transactionId) {
        const transaction = await this.getTransaction(bill.transactionId);
        transactionReference = transaction?.reference;
      }
      
      return {
        ...bill,
        transactionReference
      };
    }));
  }

  async getBillsByParty(partyId: number): Promise<Bill[]> {
    const bills = Array.from(this.bills.values())
      .filter(bill => bill.partyId === partyId);
    
    return Promise.all(bills.map(async (bill) => {
      let transactionReference;
      if (bill.transactionId) {
        const transaction = await this.getTransaction(bill.transactionId);
        transactionReference = transaction?.reference;
      }
      
      return {
        ...bill,
        transactionReference
      };
    }));
  }

  async getBill(id: number): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;
    
    let transactionReference;
    if (bill.transactionId) {
      const transaction = await this.getTransaction(bill.transactionId);
      transactionReference = transaction?.reference;
    }
    
    return {
      ...bill,
      transactionReference
    };
  }

  async createBill(billData: Omit<Bill, "id" | "createdAt">): Promise<Bill> {
    const id = this.billCounter++;
    const now = new Date();
    
    const bill: Bill = {
      ...billData,
      id,
      createdAt: now
    };
    
    this.bills.set(id, bill);
    
    // If the bill is associated with a transaction, update the transaction
    if (bill.transactionId) {
      await this.linkBillToTransaction(id, bill.transactionId);
    }
    
    // Log activity
    const party = await this.getParty(bill.partyId);
    await this.createActivity({
      performedBy: "system",
      description: "Uploaded bill",
      entityType: "BILL",
      entityId: id,
      entityName: `Bill for ${party?.name}`,
      details: `Uploaded bill: ${bill.filename} for ${party?.name}`,
      timestamp: now
    });
    
    this.saveBills();
    this.saveCounters();
    return bill;
  }

  async linkBillToTransaction(billId: number, transactionId: number): Promise<void> {
    // Update the transaction with the bill ID
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;
    
    const updatedTransaction = {
      ...transaction,
      billId,
      updatedAt: new Date()
    };
    
    this.transactions.set(transactionId, updatedTransaction);
    
    // Update the bill with the transaction ID if it's not already set
    const bill = this.bills.get(billId);
    if (!bill || bill.transactionId === transactionId) return;
    
    const updatedBill = {
      ...bill,
      transactionId
    };
    
    this.bills.set(billId, updatedBill);
    
    this.saveBills();
    this.saveTransactions();
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createActivity(activityData: Omit<Activity, "id">): Promise<Activity> {
    const id = this.activityCounter++;
    
    const activity: Activity = {
      ...activityData,
      id
    };
    
    this.activities.set(id, activity);
    this.saveActivities();
    this.saveCounters();
    return activity;
  }
}