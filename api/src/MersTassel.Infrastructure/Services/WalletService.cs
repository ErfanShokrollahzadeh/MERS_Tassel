using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class WalletService(AppDbContext db) : IWalletService
{
    public async Task<WalletDto> GetAsync(string userId, string currency = "TRY", CancellationToken ct = default)
    {
        currency = NormalizeCurrency(currency);
        var wallet = await db.StoreWallets
            .Include(x => x.Transactions.OrderByDescending(t => t.CreatedAt).Take(20))
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Currency == currency, ct);

        return wallet is null
            ? new WalletDto { Currency = currency }
            : ToDto(wallet);
    }

    public async Task<decimal> ApplyToOrderAsync(
        string userId,
        string currency,
        decimal maximumAmount,
        string orderNumber,
        CancellationToken ct = default)
    {
        if (maximumAmount <= 0) return 0m;
        currency = NormalizeCurrency(currency);
        var idempotencyKey = $"wallet:checkout:{orderNumber}";
        var existing = await db.StoreWalletTransactions.FirstOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, ct);
        if (existing is not null) return Math.Abs(existing.Amount);

        var wallet = await db.StoreWallets.FirstOrDefaultAsync(
            x => x.UserId == userId && x.Currency == currency, ct);
        if (wallet is null || wallet.Balance <= 0) return 0m;

        var applied = Math.Min(wallet.Balance, Math.Round(maximumAmount, 2));
        wallet.Balance -= applied;
        wallet.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        wallet.UpdatedAt = DateTimeOffset.UtcNow;
        wallet.Transactions.Add(new StoreWalletTransaction
        {
            Type = WalletTransactionType.CheckoutDebit,
            Amount = -applied,
            BalanceAfter = wallet.Balance,
            Description = $"Store credit applied to order {orderNumber}",
            ReferenceType = "order",
            ReferenceId = orderNumber,
            IdempotencyKey = idempotencyKey,
        });
        return applied;
    }

    public async Task<StoreWalletTransaction?> CreditExchangeDifferenceAsync(
        ExchangeRequest exchange,
        CancellationToken ct = default)
    {
        if (exchange.WalletCredit <= 0) return null;
        var idempotencyKey = $"wallet:exchange:{exchange.Id}";
        var existing = await db.StoreWalletTransactions.FirstOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, ct);
        if (existing is not null) return existing;

        var currency = NormalizeCurrency(exchange.Currency);
        var wallet = await db.StoreWallets.FirstOrDefaultAsync(
            x => x.UserId == exchange.UserId && x.Currency == currency, ct);
        if (wallet is null)
        {
            wallet = new StoreWallet { UserId = exchange.UserId, Currency = currency };
            db.StoreWallets.Add(wallet);
        }

        wallet.Balance += exchange.WalletCredit;
        wallet.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        wallet.UpdatedAt = DateTimeOffset.UtcNow;
        var transaction = new StoreWalletTransaction
        {
            Wallet = wallet,
            Type = WalletTransactionType.ExchangeCredit,
            Amount = exchange.WalletCredit,
            BalanceAfter = wallet.Balance,
            Description = $"Exchange difference for {exchange.OrderItem.ProductName}",
            ReferenceType = "exchange",
            ReferenceId = exchange.Id.ToString(),
            IdempotencyKey = idempotencyKey,
        };
        db.StoreWalletTransactions.Add(transaction);
        return transaction;
    }

    public async Task<StoreWalletTransaction?> CreditTradeInRemainderAsync(
        TradeInRequest tradeIn,
        CancellationToken ct = default)
    {
        var usedOnOrder = tradeIn.Order?.TradeInCredit ?? 0m;
        var remainder = Math.Max(0m, tradeIn.EstimatedCredit - usedOnOrder);
        if (remainder <= 0 || string.IsNullOrWhiteSpace(tradeIn.UserId)) return null;

        var idempotencyKey = $"wallet:trade-in:{tradeIn.Id}";
        var existing = await db.StoreWalletTransactions.FirstOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, ct);
        if (existing is not null) return existing;

        var currency = NormalizeCurrency(tradeIn.Currency);
        var wallet = await db.StoreWallets.FirstOrDefaultAsync(
            x => x.UserId == tradeIn.UserId && x.Currency == currency, ct);
        if (wallet is null)
        {
            wallet = new StoreWallet { UserId = tradeIn.UserId, Currency = currency };
            db.StoreWallets.Add(wallet);
        }

        wallet.Balance += remainder;
        wallet.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        wallet.UpdatedAt = DateTimeOffset.UtcNow;
        var transaction = new StoreWalletTransaction
        {
            Wallet = wallet,
            Type = WalletTransactionType.ExchangeCredit,
            Amount = remainder,
            BalanceAfter = wallet.Balance,
            Description = $"Unused verified trade-in credit for {tradeIn.BrandModel}",
            ReferenceType = "trade_in",
            ReferenceId = tradeIn.Id.ToString(),
            IdempotencyKey = idempotencyKey,
        };
        db.StoreWalletTransactions.Add(transaction);
        return transaction;
    }

    public async Task ReverseOrderDebitAsync(Order order, CancellationToken ct = default)
    {
        if (order.WalletCredit <= 0 || string.IsNullOrWhiteSpace(order.UserId)) return;
        var reversalKey = $"wallet:order-reversal:{order.Number}";
        if (await db.StoreWalletTransactions.AnyAsync(x => x.IdempotencyKey == reversalKey, ct)) return;

        var debit = await db.StoreWalletTransactions.FirstOrDefaultAsync(
            x => x.IdempotencyKey == $"wallet:checkout:{order.Number}", ct);
        if (debit is null) return;

        var wallet = await db.StoreWallets.FirstOrDefaultAsync(x => x.Id == debit.WalletId, ct);
        if (wallet is null) return;

        var amount = Math.Abs(debit.Amount);
        wallet.Balance += amount;
        wallet.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        wallet.UpdatedAt = DateTimeOffset.UtcNow;
        wallet.Transactions.Add(new StoreWalletTransaction
        {
            Type = WalletTransactionType.OrderReversal,
            Amount = amount,
            BalanceAfter = wallet.Balance,
            Description = $"Store credit restored from order {order.Number}",
            ReferenceType = "order",
            ReferenceId = order.Number,
            IdempotencyKey = reversalKey,
        });
    }

    private static WalletDto ToDto(StoreWallet wallet) => new()
    {
        Balance = wallet.Balance,
        Currency = wallet.Currency,
        Transactions = wallet.Transactions.OrderByDescending(x => x.CreatedAt).Select(x => new WalletTransactionDto
        {
            Id = x.Id,
            Type = ToApi(x.Type),
            Amount = x.Amount,
            BalanceAfter = x.BalanceAfter,
            Description = x.Description,
            ReferenceType = x.ReferenceType,
            ReferenceId = x.ReferenceId,
            CreatedAt = x.CreatedAt,
        }).ToList(),
    };

    private static string NormalizeCurrency(string _currency) => "TRY";

    private static string ToApi(WalletTransactionType type) => type switch
    {
        WalletTransactionType.ExchangeCredit => "exchange_credit",
        WalletTransactionType.CheckoutDebit => "checkout_debit",
        WalletTransactionType.OrderReversal => "order_reversal",
        _ => "admin_adjustment",
    };
}
