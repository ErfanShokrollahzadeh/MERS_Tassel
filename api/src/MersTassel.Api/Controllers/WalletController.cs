using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
[Tags("Wallet")]
public class WalletController(IWalletService wallets, ICurrentUser currentUser) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<WalletDto>>> Get(
        [FromQuery] string currency = "TRY",
        CancellationToken ct = default)
    {
        var userId = currentUser.UserId ?? throw new ForbiddenException("Sign in to view store credit.");
        return Ok(ApiResponse<WalletDto>.Ok(await wallets.GetAsync(userId, currency, ct)));
    }
}
