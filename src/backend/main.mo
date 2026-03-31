import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Blob "mo:core/Blob";

actor {

  type Holding = {
    symbol : Text;
    quantity : Float;
    avgBuyPrice : Float;
  };

  type Trade = {
    symbol : Text;
    action : Text;
    quantity : Float;
    price : Float;
    timestamp : Int;
  };

  // UserData stays unchanged to preserve stable variable compatibility
  type UserData = {
    userId : Text;
    balance : Float;
    holdings : [Holding];
    history : [Trade];
    watchlist : [Text];
  };

  type NameEntry = { userId : Text; name : Text };

  type Profile = { balance : Float };
  type TradeResult = { ok : Bool; message : Text };
  type LeaderboardEntry = { userId : Text; displayName : Text; balance : Float; portfolioValue : Float };

  type HttpHeader = { name : Text; value : Text };

  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : { #get; #head; #post };
    transform : ?{
      function : shared ({ response : HttpResponsePayload; context : [Nat8] }) -> async HttpResponsePayload;
      context : [Nat8];
    };
  };

  type HttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  type IC = actor {
    http_request : HttpRequestArgs -> async HttpResponsePayload;
  };

  let ic : IC = actor ("aaaaa-aa");

  var users : [UserData] = [];

  // Separate stable var for display names — adding a new stable var is always backward compatible
  var userNames : [NameEntry] = [];

  func findUser(id : Text) : ?UserData {
    users.find(func u { u.userId == id });
  };

  func upsertUser(updated : UserData) {
    switch (users.find(func u { u.userId == updated.userId })) {
      case null { users := users.concat([updated]) };
      case (?_) {
        users := users.map(func u {
          if (u.userId == updated.userId) updated else u
        });
      };
    };
  };

  func newUser(id : Text) : UserData {
    {
      userId = id;
      balance = 1_000_000.0;
      holdings = [];
      history = [];
      watchlist = [];
    };
  };

  func getUser(id : Text) : UserData {
    switch (findUser(id)) { case (?u) u; case null newUser(id) };
  };

  func lookupName(id : Text) : Text {
    switch (userNames.find(func e { e.userId == id })) {
      case (?(entry)) entry.name;
      case null "";
    };
  };

  public shared (msg) func initUser() : async () {
    let id = msg.caller.toText();
    if (findUser(id) == null) { upsertUser(newUser(id)) };
  };

  public shared (msg) func setDisplayName(name : Text) : async () {
    let id = msg.caller.toText();
    // Ensure user exists
    if (findUser(id) == null) { upsertUser(newUser(id)) };
    switch (userNames.find(func e { e.userId == id })) {
      case null {
        userNames := userNames.concat([{ userId = id; name = name }]);
      };
      case (?_) {
        userNames := userNames.map(func e {
          if (e.userId == id) { { userId = id; name = name } } else e
        });
      };
    };
  };

  public shared (msg) func getProfile() : async Profile {
    { balance = getUser(msg.caller.toText()).balance };
  };

  public shared (msg) func getPortfolio() : async [Holding] {
    getUser(msg.caller.toText()).holdings;
  };

  public shared (msg) func getTradeHistory() : async [Trade] {
    getUser(msg.caller.toText()).history;
  };

  public shared (msg) func getWatchlist() : async [Text] {
    getUser(msg.caller.toText()).watchlist;
  };

  public shared (msg) func addToWatchlist(symbol : Text) : async () {
    let id = msg.caller.toText();
    let u = getUser(id);
    if (u.watchlist.find(func s { s == symbol }) == null) {
      upsertUser({ u with watchlist = u.watchlist.concat([symbol]) });
    };
  };

  public shared (msg) func removeFromWatchlist(symbol : Text) : async () {
    let id = msg.caller.toText();
    let u = getUser(id);
    upsertUser({ u with watchlist = u.watchlist.filter(func s { s != symbol }) });
  };

  public shared (msg) func buyStock(symbol : Text, quantity : Float, price : Float) : async TradeResult {
    let id = msg.caller.toText();
    let u = getUser(id);
    let cost = quantity * price;
    if (cost > u.balance) { return { ok = false; message = "Insufficient balance" } };
    let newHoldings : [Holding] = switch (u.holdings.find(func h { h.symbol == symbol })) {
      case null {
        let h : Holding = { symbol = symbol; quantity = quantity; avgBuyPrice = price };
        u.holdings.concat([h]);
      };
      case (?ex) {
        let totalQty = ex.quantity + quantity;
        let newAvg = (ex.quantity * ex.avgBuyPrice + quantity * price) / totalQty;
        u.holdings.map(func h {
          if (h.symbol != symbol) { h } else {
            let updated : Holding = { symbol = symbol; quantity = totalQty; avgBuyPrice = newAvg };
            updated;
          };
        });
      };
    };
    let t : Trade = { symbol = symbol; action = "buy"; quantity = quantity; price = price; timestamp = Time.now() };
    upsertUser({
      u with
      balance = u.balance - cost;
      holdings = newHoldings;
      history = u.history.concat([t]);
    });
    { ok = true; message = "Order executed" };
  };

  public shared (msg) func sellStock(symbol : Text, quantity : Float, price : Float) : async TradeResult {
    let id = msg.caller.toText();
    let u = getUser(id);
    switch (u.holdings.find(func h { h.symbol == symbol })) {
      case null { return { ok = false; message = "No holdings for " # symbol } };
      case (?ex) {
        if (ex.quantity < quantity) { return { ok = false; message = "Insufficient holdings" } };
        let newQty = ex.quantity - quantity;
        let newHoldings : [Holding] = if (newQty <= 0.0) {
          u.holdings.filter(func h { h.symbol != symbol });
        } else {
          u.holdings.map(func h {
            if (h.symbol != symbol) { h } else {
              let updated : Holding = { symbol = symbol; quantity = newQty; avgBuyPrice = ex.avgBuyPrice };
              updated;
            };
          });
        };
        let t : Trade = { symbol = symbol; action = "sell"; quantity = quantity; price = price; timestamp = Time.now() };
        upsertUser({
          u with
          balance = u.balance + quantity * price;
          holdings = newHoldings;
          history = u.history.concat([t]);
        });
        return { ok = true; message = "Order executed" };
      };
    };
  };

  public shared func getLeaderboard() : async [LeaderboardEntry] {
    let entries = users.map(func u {
      let pv = u.holdings.foldLeft(0.0, func(acc, h) { acc + h.quantity * h.avgBuyPrice });
      let e : LeaderboardEntry = {
        userId = u.userId;
        displayName = lookupName(u.userId);
        balance = u.balance;
        portfolioValue = pv;
      };
      e;
    });
    let sorted = entries.sort(func(a, b) {
      let at = a.balance + a.portfolioValue;
      let bt = b.balance + b.portfolioValue;
      if (at > bt) #less else if (at < bt) #greater else #equal;
    });
    if (sorted.size() > 20) Array.tabulate(20, func i { sorted[i] })
    else sorted;
  };

  /// Transform function: strips response headers so all replica nodes
  /// return identical output (required for IC HTTP outcall consensus).
  public func transformResponse(raw : { response : HttpResponsePayload; context : [Nat8] }) : async HttpResponsePayload {
    {
      status = raw.response.status;
      headers = [];
      body = raw.response.body;
    };
  };

  /// Fetch live prices from Yahoo Finance via IC HTTP outcall.
  public shared func fetchYahooPrices(symbolsParam : Text) : async Text {
    let url = "https://query1.finance.yahoo.com/v8/finance/quote?symbols=" # symbolsParam # "&fields=regularMarketPrice,symbol";
    let request : HttpRequestArgs = {
      url = url;
      max_response_bytes = ?500_000;
      headers = [
        { name = "User-Agent"; value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        { name = "Accept"; value = "application/json" },
        { name = "Accept-Language"; value = "en-US,en;q=0.9" },
      ];
      body = null;
      method = #get;
      transform = ?{
        function = transformResponse;
        context = [];
      };
    };
    try {
      let response = await (with cycles = 230_949_972_000) ic.http_request(request);
      if (response.status >= 200 and response.status < 300) {
        let blob = Blob.fromArray(response.body);
        switch (blob.decodeUtf8()) {
          case (?t) t;
          case null "";
        };
      } else {
        let url2 = "https://query2.finance.yahoo.com/v7/finance/quote?symbols=" # symbolsParam # "&fields=regularMarketPrice,symbol";
        let req2 : HttpRequestArgs = {
          url = url2;
          max_response_bytes = ?500_000;
          headers = [
            { name = "User-Agent"; value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            { name = "Accept"; value = "application/json" },
          ];
          body = null;
          method = #get;
          transform = ?{
            function = transformResponse;
            context = [];
          };
        };
        let r2 = await (with cycles = 230_949_972_000) ic.http_request(req2);
        let blob2 = Blob.fromArray(r2.body);
        switch (blob2.decodeUtf8()) {
          case (?t) t;
          case null "";
        };
      };
    } catch (_) {
      "";
    };
  };

};
