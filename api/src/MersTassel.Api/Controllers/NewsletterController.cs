using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/newsletter")]
[Tags("Newsletter")]
public class NewsletterController(
    INewsletterService newsletter,
    IValidator<NewsletterSubscribeRequest> validator) : ApiControllerBase
{
    [HttpPost("subscribe")]
    public async Task<ActionResult<ApiResponse<NewsletterSubscriptionDto>>> Subscribe(
        NewsletterSubscribeRequest request, CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        var subscription = await newsletter.SubscribeAsync(request, ct);

        var response = ApiResponse<NewsletterSubscriptionDto>.Ok(
            subscription,
            subscription.AlreadySubscribed ? "Already subscribed." : "Subscription saved.");

        return subscription.AlreadySubscribed
            ? Ok(response)
            : StatusCode(StatusCodes.Status201Created, response);
    }
}
