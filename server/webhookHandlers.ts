import { Request, Response } from 'express';
import { storage } from './storage';
import { sendEmail } from './emailService';
import { NotificationService } from './notifications';

export class WebhookHandlers {
  static async processWebhook(body: Buffer, signature: string, uuid?: string) {
    console.log('📥 Webhook received, processing...');
    try {
      const event = JSON.parse(body.toString());
      console.log('📥 Event parsed:', event.type);
      await this.handleStripeWebhook(event);
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }

  static async handleStripeWebhook(event: any) {
    console.log(`🔔 Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('✅ Checkout completed:', session.id);
        await this.handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('✅ Subscription created/updated:', subscription.id);
        await this.handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('❌ Subscription cancelled:', subscription.id);
        await this.handleSubscriptionCancelled(subscription);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object;
        console.log('💰 Payment succeeded:', charge.id);
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object;
        console.log('❌ Payment failed:', charge.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('📄 Invoice paid:', invoice.id);
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }
  }

  private static async handleCheckoutComplete(session: any) {
    try {
      const customerId = session.customer;
      if (!customerId) return;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) {
        console.log('User not found for customer:', customerId);
        return;
      }

      const subscriptionId = session.subscription;
      if (subscriptionId) {
        await storage.updateUserStripeSubscription(user.id, subscriptionId);
        console.log('✅ User subscription updated:', user.id, subscriptionId);
      }
    } catch (error) {
      console.error('Checkout complete handler error:', error);
    }
  }

  private static async handleSubscriptionUpdate(subscription: any) {
    try {
      const customerId = subscription.customer;
      if (!customerId) return;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) {
        console.log('User not found for customer:', customerId);
        return;
      }

      // Get price info directly from subscription object first
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const priceAmount = subscription.items?.data?.[0]?.price?.unit_amount;
      const priceInterval = subscription.items?.data?.[0]?.price?.recurring?.interval;
      
      console.log('📊 Subscription details:', { priceId, priceAmount, priceInterval });
      
      let planName = 'Free';

      // Map price to plan based on amount and interval
      if (priceAmount) {
        const amountBRL = priceAmount / 100; // Convert from cents
        console.log('💰 Price amount:', amountBRL, 'BRL, interval:', priceInterval);
        
        if (priceInterval === 'year' || amountBRL >= 900) {
          planName = 'Anual'; // Annual plan - show as "Anual"
        } else if (amountBRL >= 90) {
          planName = 'Premium'; // Monthly premium R$99
        } else if (amountBRL >= 40) {
          planName = 'Basic'; // Monthly basic R$49
        }
      } else if (priceId) {
        // Fallback to database lookup
        const price = await storage.getStripePrice(priceId);
        console.log('📊 Price from DB:', price);
        if (price) {
          const productId = price.product;
          const product = await storage.getStripeProduct(productId);
          console.log('📊 Product from DB:', product);
          if (product?.metadata) {
            const metadata = typeof product.metadata === 'string' 
              ? JSON.parse(product.metadata) 
              : product.metadata;
            const tier = metadata?.tier;
            console.log('📊 Tier from metadata:', tier);
            if (tier === 'basic') planName = 'Basic';
            else if (tier === 'premium') planName = 'Premium';
            else if (tier === 'premium_annual') planName = 'Anual';
          }
        }
      }

      const status = subscription.status;
      console.log('📊 Final plan:', planName, 'Status:', status);
      
      if (status === 'active' || status === 'trialing') {
        await storage.updateUserPlan(user.id, planName);
        await storage.updateUserStripeSubscription(user.id, subscription.id);
        console.log('✅ User plan updated:', user.id, planName);
      }
    } catch (error) {
      console.error('Subscription update handler error:', error);
    }
  }

  private static async handleSubscriptionCancelled(subscription: any) {
    try {
      const customerId = subscription.customer;
      if (!customerId) return;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) return;

      await storage.updateUserPlan(user.id, 'Free');
      console.log('✅ User plan reset to Free:', user.id);
    } catch (error) {
      console.error('Subscription cancelled handler error:', error);
    }
  }
}
