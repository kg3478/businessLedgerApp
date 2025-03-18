import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertPartySchema, insertTransactionSchema, insertBillSchema } from "@shared/schema";
import multer from "multer";
import { uploadConfig } from "./multerConfig";
import path from "path";
import fs from "fs";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Setup file upload middleware
  const upload = multer(uploadConfig);

  // PARTY ROUTES
  
  // Get all parties
  app.get("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });
  
  // Get a single party
  app.get("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }
      
      const party = await storage.getParty(id);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      
      res.json(party);
    } catch (error) {
      console.error("Error fetching party:", error);
      res.status(500).json({ message: "Failed to fetch party" });
    }
  });
  
  // Create a new party
  app.post("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPartySchema.parse(req.body);
      const party = await storage.createParty(validatedData);
      res.status(201).json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid party data", errors: error.errors });
      }
      console.error("Error creating party:", error);
      res.status(500).json({ message: "Failed to create party" });
    }
  });
  
  // Update a party
  app.patch("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }
      
      const existingParty = await storage.getParty(id);
      if (!existingParty) {
        return res.status(404).json({ message: "Party not found" });
      }
      
      const validatedData = insertPartySchema.partial().parse(req.body);
      const updatedParty = await storage.updateParty(id, validatedData);
      res.json(updatedParty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid party data", errors: error.errors });
      }
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });
  
  // TRANSACTION ROUTES
  
  // Get all transactions
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      // If partyId is provided in query params, get transactions for that party
      if (req.query.partyId) {
        const partyId = parseInt(req.query.partyId as string);
        if (isNaN(partyId)) {
          return res.status(400).json({ message: "Invalid party ID" });
        }
        const transactions = await storage.getTransactionsByParty(partyId);
        return res.json(transactions);
      }
      
      // Otherwise get all transactions
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Get recent transactions
  app.get("/api/transactions/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 7;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });
  
  // Get credit transactions without bills
  app.get("/api/transactions/credit-without-bill", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getCreditTransactionsWithoutBill();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching credit transactions:", error);
      res.status(500).json({ message: "Failed to fetch credit transactions" });
    }
  });
  
  // Get transactions for a specific party
  app.get("/api/transactions/:partyId", isAuthenticated, async (req, res) => {
    try {
      const partyId = parseInt(req.params.partyId);
      if (isNaN(partyId)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }
      
      const transactions = await storage.getTransactionsByParty(partyId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching party transactions:", error);
      res.status(500).json({ message: "Failed to fetch party transactions" });
    }
  });
  
  // Create a new transaction
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      // Ensure date is properly converted to Date object before validation
      let transactionData = req.body;
      if (typeof transactionData.date === 'string') {
        transactionData = {
          ...transactionData,
          date: new Date(transactionData.date)
        };
      }
      
      const validatedData = insertTransactionSchema.parse(transactionData);
      
      // Verify party exists
      const party = await storage.getParty(validatedData.partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  // Update an existing transaction
  app.patch("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Check if transaction exists
      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Ensure date is properly converted
      let transactionData = req.body;
      if (typeof transactionData.date === 'string') {
        transactionData = {
          ...transactionData,
          date: new Date(transactionData.date)
        };
      }
      
      // Update the transaction
      const updatedTransaction = await storage.updateTransaction(id, transactionData);
      
      // Create activity log
      const username = req.user?.username || "system";
      await storage.createActivity({
        performedBy: username,
        description: "Updated transaction",
        entityType: "TRANSACTION",
        entityId: id,
        entityName: `Transaction for ${updatedTransaction?.partyName}`,
        details: `Transaction ${id} updated by ${username}`,
        timestamp: new Date()
      });
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  
  // BILL ROUTES
  
  // Get all bills
  app.get("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });
  
  // Get bills for a specific party
  app.get("/api/bills/:partyId", isAuthenticated, async (req, res) => {
    try {
      const partyId = parseInt(req.params.partyId);
      if (isNaN(partyId)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }
      
      const bills = await storage.getBillsByParty(partyId);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching party bills:", error);
      res.status(500).json({ message: "Failed to fetch party bills" });
    }
  });
  
  // Upload a bill
  app.post("/api/bills/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const partyId = parseInt(req.body.partyId);
      if (isNaN(partyId)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }
      
      // Verify party exists
      const party = await storage.getParty(partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      
      // Create bill record
      const billData = {
        partyId,
        filename: req.file.originalname,
        filepath: req.file.path,
        uploadDate: new Date(),
        reference: req.body.billReference,
        amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
        transactionId: req.body.transactionId ? parseInt(req.body.transactionId) : undefined
      };
      
      const bill = await storage.createBill(billData);
      
      // Create a credit transaction if no transaction ID was provided
      if (!req.body.transactionId && req.body.amount) {
        const transactionData = {
          partyId,
          type: "CREDIT" as const,
          amount: parseFloat(req.body.amount),
          date: new Date(),
          reference: req.body.billReference || `Bill-${bill.id}`,
          notes: `Auto-created from bill upload: ${req.file.originalname}`
        };
        
        const transaction = await storage.createTransaction(transactionData);
        
        // Link the bill to the new transaction
        await storage.linkBillToTransaction(bill.id, transaction.id);
        
        bill.transactionId = transaction.id;
      }
      
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error uploading bill:", error);
      res.status(500).json({ message: "Failed to upload bill" });
    }
  });
  
  // Upload a bill for a specific transaction
  app.post("/api/bills/upload/:transactionId", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const transactionId = parseInt(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Verify transaction exists and is a credit type without an existing bill
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.type !== "CREDIT") {
        return res.status(400).json({ message: "Bills can only be attached to credit transactions" });
      }
      
      if (transaction.billId) {
        return res.status(400).json({ message: "Transaction already has a bill attached" });
      }
      
      // Create bill record
      const billData = {
        partyId: transaction.partyId,
        transactionId,
        filename: req.file.originalname,
        filepath: req.file.path,
        uploadDate: new Date(),
        reference: req.body.billReference || transaction.reference,
        amount: transaction.amount
      };
      
      const bill = await storage.createBill(billData);
      
      // Link the bill to the transaction
      await storage.linkBillToTransaction(bill.id, transactionId);
      
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error uploading bill for transaction:", error);
      res.status(500).json({ message: "Failed to upload bill for transaction" });
    }
  });
  
  // Download a bill
  app.get("/api/bills/download/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bill ID" });
      }
      
      const bill = await storage.getBill(id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      res.download(bill.filepath, bill.filename);
    } catch (error) {
      console.error("Error downloading bill:", error);
      res.status(500).json({ message: "Failed to download bill" });
    }
  });
  
  // ACTIVITY ROUTES
  
  // Get all activities
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
