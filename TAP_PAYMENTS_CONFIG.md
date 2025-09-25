# Tap Payments Configuration

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Tap Payments Configuration
TAP_PAYMENTS_SECRET_KEY=sk_test_your_secret_key_here
TAP_PAYMENTS_BASE_URL=https://api.tap.company/v2
TAP_PAYMENTS_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Getting Your Tap Payments Credentials

1. **Create a Tap Payments Account**: Visit [Tap Payments](https://www.tap.company/) and create an account
2. **Get Your Secret Key**: 
   - Log in to your Tap Payments dashboard
   - Navigate to Settings > API Keys
   - Copy your Secret Key (starts with `sk_test_` for test mode or `sk_live_` for live mode)
3. **Set Up Webhooks**:
   - Go to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/payment/webhook`
   - Copy the webhook secret (starts with `whsec_`)

## API Endpoints

### Hotel Payments
- `POST /payment/user/hotel` - Create hotel payment
- `GET /payment/user/hotel/status/:charge_id` - Get payment status
- `POST /payment/user/hotel/refund` - Create refund
- `GET /payment/user/hotel/refund/:refund_id` - Get refund status
- `GET /payment/user/hotel/charges` - List charges

### Tour Payments
- `POST /payment/user/tour` - Create tour payment
- `GET /payment/user/tour/status/:charge_id` - Get payment status
- `POST /payment/user/tour/refund` - Create refund
- `GET /payment/user/tour/refund/:refund_id` - Get refund status

### Car Rental Payments
- `POST /payment/user/car-rental` - Create car rental payment
- `GET /payment/user/car-rental/status/:charge_id` - Get payment status
- `POST /payment/user/car-rental/refund` - Create refund
- `GET /payment/user/car-rental/refund/:refund_id` - Get refund status

### Visa Payments
- `POST /payment/user/visa` - Create visa payment
- `GET /payment/user/visa/status/:charge_id` - Get payment status
- `POST /payment/user/visa/refund` - Create refund
- `GET /payment/user/visa/refund/:refund_id` - Get refund status

### Webhooks
- `POST /payment/webhook` - Handle Tap Payments webhooks

## Example Usage

### Creating a Hotel Payment

```javascript
const response = await fetch('/payment/user/hotel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 100.00,
    currency: 'USD',
    customer: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: {
        country_code: '+1',
        number: '1234567890'
      }
    },
    hotel_id: 'hotel_123',
    booking_id: 'booking_456',
    description: 'Hotel booking payment',
    redirect_url: 'https://yoursite.com/payment/success',
    post_url: 'https://yoursite.com/payment/webhook'
  })
});

const data = await response.json();
console.log(data.data.payment_url); // Redirect user to this URL
```

### Checking Payment Status

```javascript
const response = await fetch('/payment/user/hotel/status/charge_123');
const data = await response.json();
console.log(data.data.status); // 'CAPTURED', 'PENDING', 'FAILED', etc.
```

### Creating a Refund

```javascript
const response = await fetch('/payment/user/hotel/refund', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    charge_id: 'charge_123',
    amount: 50.00, // Partial refund
    reason: 'requested_by_customer',
    description: 'Partial refund for hotel booking'
  })
});
```

## Webhook Events

The webhook endpoint handles the following events:
- `charge.created` - Payment intent created
- `charge.captured` - Payment completed successfully
- `charge.failed` - Payment failed
- `refund.created` - Refund created
- `refund.updated` - Refund status updated

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Security Notes

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** to ensure requests are from Tap Payments
3. **Use HTTPS** for all webhook endpoints
4. **Validate all input data** before processing payments
5. **Log all payment activities** for audit purposes

## Testing

Use Tap Payments test mode for development:
- Test cards: Use Tap Payments test card numbers
- Test amounts: Use small amounts for testing
- Webhook testing: Use tools like ngrok to test webhooks locally

## Support

For Tap Payments specific issues:
- Documentation: [Tap Payments Docs](https://www.tap.company/docs)
- Support: Contact Tap Payments support team
