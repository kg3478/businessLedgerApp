import { users, parties, transactions, bills, activities, type User, type InsertUser, type Party, type Transaction, type Bill, type Activity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Party operations
  getParties(): Promise<Party[]>;
  getParty(id: number): Promise<Party | undefined>;
  createParty(party: Omit<Party, "id" | "balance" | "lastActivityDate" | "createdAt" | "updatedAt">): Promise<Party>;
  updateParty(id: number, party: Partial<Party>): Promise<Party | undefined>;
  updatePartyBalance(id: number, amount: number, isCredit: boolean): Promise<Party | undefined>;
  updatePartyLastActivity(id: number): Promise<void>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByParty(partyId: number): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  getCreditTransactionsWithoutBill(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: Omit<Transaction, "id" | "billId" | "createdAt" | "updatedAt">): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Bill operations
  getBills(): Promise<Bill[]>;
  getBillsByParty(partyId: number): Promise<Bill[]>;
  getBill(id: number): Promise<Bill | undefined>;
  createBill(bill: Omit<Bill, "id" | "createdAt">): Promise<Bill>;
  linkBillToTransaction(billId: number, transactionId: number): Promise<void>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  createActivity(activity: Omit<Activity, "id">): Promise<Activity>;
  
  // Session storage
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
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
    this.users = new Map();
    this.parties = new Map();
    this.transactions = new Map();
    this.bills = new Map();
    this.activities = new Map();
    
    this.userCounter = 1;
    this.partyCounter = 1;
    this.transactionCounter = 1;
    this.billCounter = 1;
    this.activityCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
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
      performedBy: "system", // This should be updated to use the current user when available
      description: "Created new party",
      entityType: "PARTY",
      entityId: id,
      entityName: party.name,
      details: `Created party: ${party.name}`,
      timestamp: now
    });
    
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
    
    return updatedParty;
  }

  async updatePartyBalance(id: number, amount: number, isCredit: boolean): Promise<Party | undefined> {
    const party = this.parties.get(id);
    if (!party) return undefined;
    
    // For credit entries, add to balance (increasing debt)
    // For deposits, subtract from balance (decreasing debt)
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
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values());
    
    // Add party name to each transaction for convenience
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
    
    // Add party name to each transaction
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
    
    // Add party name to each transaction
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
    return activity;
  }
}

export const storage = new MemStorage();
