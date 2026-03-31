/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

const Holding = IDL.Record({
  symbol: IDL.Text,
  quantity: IDL.Float64,
  avgBuyPrice: IDL.Float64,
});

const Trade = IDL.Record({
  symbol: IDL.Text,
  action: IDL.Text,
  quantity: IDL.Float64,
  price: IDL.Float64,
  timestamp: IDL.Int,
});

const Profile = IDL.Record({
  balance: IDL.Float64,
});

const TradeResult = IDL.Record({
  ok: IDL.Bool,
  message: IDL.Text,
});

const LeaderboardEntry = IDL.Record({
  userId: IDL.Text,
  displayName: IDL.Text,
  balance: IDL.Float64,
  portfolioValue: IDL.Float64,
});

export const idlService = IDL.Service({
  initUser: IDL.Func([], [], []),
  setDisplayName: IDL.Func([IDL.Text], [], []),
  reportPortfolioValue: IDL.Func([IDL.Float64], [], []),
  getProfile: IDL.Func([], [Profile], []),
  getPortfolio: IDL.Func([], [IDL.Vec(Holding)], []),
  getTradeHistory: IDL.Func([], [IDL.Vec(Trade)], []),
  getWatchlist: IDL.Func([], [IDL.Vec(IDL.Text)], []),
  addToWatchlist: IDL.Func([IDL.Text], [], []),
  removeFromWatchlist: IDL.Func([IDL.Text], [], []),
  buyStock: IDL.Func([IDL.Text, IDL.Float64, IDL.Float64], [TradeResult], []),
  sellStock: IDL.Func([IDL.Text, IDL.Float64, IDL.Float64], [TradeResult], []),
  getLeaderboard: IDL.Func([], [IDL.Vec(LeaderboardEntry)], []),
  fetchYahooPrices: IDL.Func([IDL.Text], [IDL.Text], ['query']),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const Holding = IDL.Record({
    symbol: IDL.Text,
    quantity: IDL.Float64,
    avgBuyPrice: IDL.Float64,
  });
  const Trade = IDL.Record({
    symbol: IDL.Text,
    action: IDL.Text,
    quantity: IDL.Float64,
    price: IDL.Float64,
    timestamp: IDL.Int,
  });
  const Profile = IDL.Record({
    balance: IDL.Float64,
  });
  const TradeResult = IDL.Record({
    ok: IDL.Bool,
    message: IDL.Text,
  });
  const LeaderboardEntry = IDL.Record({
    userId: IDL.Text,
    displayName: IDL.Text,
    balance: IDL.Float64,
    portfolioValue: IDL.Float64,
  });
  return IDL.Service({
    initUser: IDL.Func([], [], []),
    setDisplayName: IDL.Func([IDL.Text], [], []),
    reportPortfolioValue: IDL.Func([IDL.Float64], [], []),
    getProfile: IDL.Func([], [Profile], []),
    getPortfolio: IDL.Func([], [IDL.Vec(Holding)], []),
    getTradeHistory: IDL.Func([], [IDL.Vec(Trade)], []),
    getWatchlist: IDL.Func([], [IDL.Vec(IDL.Text)], []),
    addToWatchlist: IDL.Func([IDL.Text], [], []),
    removeFromWatchlist: IDL.Func([IDL.Text], [], []),
    buyStock: IDL.Func([IDL.Text, IDL.Float64, IDL.Float64], [TradeResult], []),
    sellStock: IDL.Func([IDL.Text, IDL.Float64, IDL.Float64], [TradeResult], []),
    getLeaderboard: IDL.Func([], [IDL.Vec(LeaderboardEntry)], []),
    fetchYahooPrices: IDL.Func([IDL.Text], [IDL.Text], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
