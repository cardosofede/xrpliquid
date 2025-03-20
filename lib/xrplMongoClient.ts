import { MongoClient, Collection, Db, Document, WithId } from 'mongodb';
import mongoose, { Schema, model, Model } from 'mongoose';
import { MONGODB } from './config';

/**
 * XRPL MongoDB Client
 * 
 * This specialized MongoDB client is designed specifically for working with XRPL data.
 * It provides domain-specific methods and models that match the structure of XRPL data.
 * 
 * Architecture:
 * - lib/db.ts: General MongoDB connector for basic operations and data analysis
 * - This file: Domain-specific implementation for XRPL data structures
 * - More specialized clients can be added for different data sources in the future
 *
 * Note: This client maintains its own connections to MongoDB to provide specialized
 * functionality while keeping the core database operations simple.
 */

// MongoDB connection string from centralized config
const MONGODB_URI = MONGODB.URI;
const MONGODB_DB = MONGODB.DB_NAME;

// Mongoose Schema Definitions
// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  wallets: [{ type: String }],
}, { timestamps: true });

// Transaction Schema
const TransactionSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  ledger_index: { type: Number, required: true },
  Account: { type: String, required: true },
  Destination: { type: String },
  user_id: { type: String, required: true },
  TransactionType: { type: String, required: true },
  trades: { type: Array },
}, { timestamps: true, strict: false });

// Open Order Schema
const OpenOrderSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  account: { type: String, required: true },
  sequence: { type: Number, required: true },
  created_ledger_index: { type: Number, required: true },
  status: { type: String, required: true },
  user_id: { type: String, required: true },
}, { timestamps: true, strict: false });

// Filled Order Schema
const FilledOrderSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  account: { type: String, required: true },
  sequence: { type: Number, required: true },
  created_ledger_index: { type: Number, required: true },
  resolved_ledger_index: { type: Number, required: true },
  user_id: { type: String, required: true },
  status: { type: String, required: true },
}, { timestamps: true, strict: false });

// Deposits/Withdrawals Schema
const DepositWithdrawalSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  ledger_index: { type: Number, required: true },
  from_address: { type: String, required: true },
  to_address: { type: String, required: true },
  user_id: { type: String, required: true },
  type: { type: String, required: true, enum: ['deposit', 'withdrawal'] },
}, { timestamps: true, strict: false });

// Trade Schema
const TradeSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  ledger_index: { type: Number, required: true },
  taker_address: { type: String, required: true },
  maker_address: { type: String, required: true },
  user_id: { type: String, required: true },
  related_offer_sequence: { type: Number },
  related_offer_hash: { type: String },
}, { timestamps: true, strict: false });

// Canceled Order Schema
const CanceledOrderSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  account: { type: String, required: true },
  sequence: { type: Number, required: true },
  created_ledger_index: { type: Number, required: true },
  canceled_ledger_index: { type: Number, required: true },
  user_id: { type: String, required: true },
  cancel_tx_hash: { type: String, required: true },
}, { timestamps: true, strict: false });

// Interface for shared methods
interface DatabaseOperations {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getCollections(): Promise<string[]>;
}

// Type Definitions
export interface User {
  id: string;
  wallets: string[];
}

export interface Transaction extends Document {
  hash: string;
  ledger_index: number;
  Account: string;
  Destination?: string;
  user_id: string;
  TransactionType: string;
  trades?: any[];
  [key: string]: any;
}

export interface OpenOrder extends Document {
  hash: string;
  account: string;
  sequence: number;
  created_ledger_index: number;
  status: string;
  user_id: string;
  [key: string]: any;
}

export interface FilledOrder extends Document {
  hash: string;
  account: string;
  sequence: number;
  created_ledger_index: number;
  resolved_ledger_index: number;
  user_id: string;
  status: string;
  [key: string]: any;
}

export interface DepositWithdrawal extends Document {
  hash: string;
  ledger_index: number;
  from_address: string;
  to_address: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  [key: string]: any;
}

export interface Trade extends Document {
  hash: string;
  ledger_index: number;
  taker_address: string;
  maker_address: string;
  user_id: string;
  related_offer_sequence?: number;
  related_offer_hash?: string;
  [key: string]: any;
}

export interface CanceledOrder extends Document {
  hash: string;
  account: string;
  sequence: number;
  created_ledger_index: number;
  canceled_ledger_index: number;
  user_id: string;
  cancel_tx_hash: string;
  [key: string]: any;
}

/**
 * MongoDB client for XRPL data - Read-only consumer for data produced by xrpl-tag-streamer
 */
export class XRPLMongoDB implements DatabaseOperations {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private mongoose = mongoose;

  // Native MongoDB Collections
  private _transactions: Collection | null = null;
  private _users: Collection | null = null;
  private _openOrders: Collection | null = null;
  private _filledOrders: Collection | null = null;
  private _depositsWithdrawals: Collection | null = null;
  private _trades: Collection | null = null;
  private _canceledOrders: Collection | null = null;

  // Mongoose Models
  private _userModel: Model<User & Document> | null = null;
  private _transactionModel: Model<Transaction> | null = null;
  private _openOrderModel: Model<OpenOrder> | null = null;
  private _filledOrderModel: Model<FilledOrder> | null = null;
  private _depositWithdrawalModel: Model<DepositWithdrawal> | null = null;
  private _tradeModel: Model<Trade> | null = null;
  private _canceledOrderModel: Model<CanceledOrder> | null = null;

  /**
   * Initialize the MongoDB client
   */
  constructor(private mongodb_uri: string = MONGODB_URI, private db_name: string = MONGODB_DB) {}

  /**
   * Connect to MongoDB and set up collections and models
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    // Connect with native MongoDB driver
    this.client = new MongoClient(this.mongodb_uri);
    await this.client.connect();
    this.db = this.client.db(this.db_name);

    // Set up collections
    this._transactions = this.db.collection('transactions');
    this._users = this.db.collection('users');
    this._openOrders = this.db.collection('open_orders');
    this._filledOrders = this.db.collection('filled_orders');
    this._depositsWithdrawals = this.db.collection('deposits_withdrawals');
    this._trades = this.db.collection('trades');
    this._canceledOrders = this.db.collection('canceled_orders');

    // Connect with Mongoose
    await this.mongoose.connect(this.mongodb_uri);

    // Initialize Mongoose models
    this._userModel = mongoose.models.User || mongoose.model<User & Document>('User', UserSchema);
    this._transactionModel = mongoose.models.Transaction || mongoose.model<Transaction>('Transaction', TransactionSchema);
    this._openOrderModel = mongoose.models.OpenOrder || mongoose.model<OpenOrder>('OpenOrder', OpenOrderSchema);
    this._filledOrderModel = mongoose.models.FilledOrder || mongoose.model<FilledOrder>('FilledOrder', FilledOrderSchema);
    this._depositWithdrawalModel = mongoose.models.DepositWithdrawal || mongoose.model<DepositWithdrawal>('DepositWithdrawal', DepositWithdrawalSchema);
    this._tradeModel = mongoose.models.Trade || mongoose.model<Trade>('Trade', TradeSchema);
    this._canceledOrderModel = mongoose.models.CanceledOrder || mongoose.model<CanceledOrder>('CanceledOrder', CanceledOrderSchema);
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  /**
   * Get all collection names
   */
  async getCollections(): Promise<string[]> {
    if (!this.db) await this.connect();
    const collections = await this.db?.listCollections().toArray();
    return collections?.map(c => c.name) || [];
  }

  // User Operations - Read Only
  async getUsers(): Promise<User[]> {
    if (!this._users) await this.connect();
    const users = await this._users?.find({}).toArray();
    return users?.map(doc => ({
      id: doc.id,
      wallets: doc.wallets
    })) || [];
  }

  // Transaction Operations - Read Only
  async getTransactions(
    userId?: string, 
    wallet?: string, 
    limit: number = 100
  ): Promise<Transaction[]> {
    if (!this._transactions) await this.connect();
    
    const query: any = {};
    if (userId) {
      query.user_id = userId;
    }
    if (wallet) {
      query.$or = [
        { "Account": wallet },
        { "Destination": wallet }
      ];
    }
    
    const transactions = await this._transactions?.find(query)
      .sort({ ledger_index: -1 })
      .limit(limit)
      .toArray();
      
    return transactions as unknown as Transaction[];
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    if (!this._transactions) await this.connect();
    const tx = await this._transactions?.findOne({ hash: txHash });
    return tx as unknown as Transaction | null;
  }

  // Open Order Operations - Read Only
  async getOpenOrders(
    account?: string, 
    status?: string, 
    userId?: string
  ): Promise<OpenOrder[]> {
    if (!this._openOrders) await this.connect();
    
    const query: any = {};
    if (account) query.account = account;
    if (status) query.status = status;
    if (userId) query.user_id = userId;
    
    const openOrders = await this._openOrders?.find(query).toArray();
    return openOrders as unknown as OpenOrder[];
  }

  async getOpenOrderBySequence(
    account: string, 
    sequence: number
  ): Promise<OpenOrder | null> {
    if (!this._openOrders) await this.connect();
    const order = await this._openOrders?.findOne({ 
      account, 
      sequence 
    });
    return order as unknown as OpenOrder | null;
  }

  // Filled Order Operations - Read Only
  async getFilledOrders(
    account?: string, 
    status?: string, 
    userId?: string, 
    limit: number = 100
  ): Promise<FilledOrder[]> {
    if (!this._filledOrders) await this.connect();
    
    const query: any = {};
    if (account) query.account = account;
    if (status) query.status = status;
    if (userId) query.user_id = userId;
    
    const filledOrders = await this._filledOrders?.find(query)
      .sort({ resolved_ledger_index: -1 })
      .limit(limit)
      .toArray();
      
    return filledOrders as unknown as FilledOrder[];
  }

  // Deposit/Withdrawal Operations - Read Only
  async getDepositsWithdrawals(
    userId?: string, 
    txType?: 'deposit' | 'withdrawal', 
    limit: number = 100
  ): Promise<DepositWithdrawal[]> {
    if (!this._depositsWithdrawals) await this.connect();
    
    const query: any = {};
    if (userId) query.user_id = userId;
    if (txType) query.type = txType;
    
    const dws = await this._depositsWithdrawals?.find(query)
      .sort({ ledger_index: -1 })
      .limit(limit)
      .toArray();
      
    return dws as unknown as DepositWithdrawal[];
  }

  // Trade Operations - Read Only
  async getTrades(
    userId?: string, 
    relatedOfferHash?: string, 
    limit: number = 100
  ): Promise<Trade[]> {
    if (!this._trades) await this.connect();
    
    const query: any = {};
    if (userId) query.user_id = userId;
    if (relatedOfferHash) query.related_offer_hash = relatedOfferHash;
    
    const trades = await this._trades?.find(query)
      .sort({ ledger_index: -1 })
      .limit(limit)
      .toArray();
      
    return trades as unknown as Trade[];
  }

  // Canceled Order Operations - Read Only
  async getCanceledOrders(
    account?: string, 
    userId?: string, 
    limit: number = 100
  ): Promise<CanceledOrder[]> {
    if (!this._canceledOrders) await this.connect();
    
    const query: any = {};
    if (account) query.account = account;
    if (userId) query.user_id = userId;
    
    const canceledOrders = await this._canceledOrders?.find(query)
      .sort({ canceled_ledger_index: -1 })
      .limit(limit)
      .toArray();
      
    return canceledOrders as unknown as CanceledOrder[];
  }

  // Utility functions
  async getMinOpenOrderLedger(account: string): Promise<number | null> {
    if (!this._openOrders) await this.connect();
    
    const pipeline = [
      { $match: { account } },
      { $group: { _id: null, min_ledger: { $min: "$created_ledger_index" } } }
    ];
    
    const result = await this._openOrders?.aggregate(pipeline).toArray();
    
    if (result && result.length > 0 && result[0].min_ledger) {
      return result[0].min_ledger;
    }
    
    return null;
  }
  
  // Convenience method to get collection information
  async getCollectionInfo(): Promise<any[]> {
    if (!this.db) await this.connect();
    
    const collections = await this.db?.listCollections().toArray() || [];
    const collectionInfo = [];
    
    for (const collection of collections) {
      const name = collection.name;
      const coll = this.db?.collection(name);
      const count = await coll?.countDocuments() || 0;
      const sample = await coll?.find().limit(1).toArray() || [];
      
      collectionInfo.push({
        name,
        count,
        schema: sample.length > 0 ? Object.keys(sample[0]) : [],
        sampleDocument: sample.length > 0 ? sample[0] : null
      });
    }
    
    return collectionInfo;
  }
}

// Singleton instance
let dbInstance: XRPLMongoDB | null = null;

/**
 * Get the MongoDB client instance (singleton)
 */
export function getXRPLMongoClient(): XRPLMongoDB {
  if (!dbInstance) {
    dbInstance = new XRPLMongoDB();
  }
  return dbInstance;
}

// Re-export Mongoose models for direct use if needed
export const UserModel = mongoose.models.User || model<User & Document>('User', UserSchema);
export const TransactionModel = mongoose.models.Transaction || model<Transaction>('Transaction', TransactionSchema);
export const OpenOrderModel = mongoose.models.OpenOrder || model<OpenOrder>('OpenOrder', OpenOrderSchema);
export const FilledOrderModel = mongoose.models.FilledOrder || model<FilledOrder>('FilledOrder', FilledOrderSchema);
export const DepositWithdrawalModel = mongoose.models.DepositWithdrawal || model<DepositWithdrawal>('DepositWithdrawal', DepositWithdrawalSchema);
export const TradeModel = mongoose.models.Trade || model<Trade>('Trade', TradeSchema);
export const CanceledOrderModel = mongoose.models.CanceledOrder || model<CanceledOrder>('CanceledOrder', CanceledOrderSchema); 