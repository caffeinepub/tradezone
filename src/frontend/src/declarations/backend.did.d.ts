/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}
export interface Trade {
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  timestamp: bigint;
}
export interface Profile {
  balance: number;
}
export interface TradeResult {
  ok: boolean;
  message: string;
}
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  balance: number;
  portfolioValue: number;
}
export interface _SERVICE {
  initUser: ActorMethod<[], undefined>;
  setDisplayName: ActorMethod<[string], undefined>;
  reportPortfolioValue: ActorMethod<[number], undefined>;
  getProfile: ActorMethod<[], Profile>;
  getPortfolio: ActorMethod<[], Holding[]>;
  getTradeHistory: ActorMethod<[], Trade[]>;
  getWatchlist: ActorMethod<[], string[]>;
  addToWatchlist: ActorMethod<[string], undefined>;
  removeFromWatchlist: ActorMethod<[string], undefined>;
  buyStock: ActorMethod<[string, number, number], TradeResult>;
  sellStock: ActorMethod<[string, number, number], TradeResult>;
  getLeaderboard: ActorMethod<[], LeaderboardEntry[]>;
  fetchYahooPrices: ActorMethod<[string], string>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
