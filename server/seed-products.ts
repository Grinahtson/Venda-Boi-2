import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating Stripe products...');

  // Free Plan
  const freeProduct = await stripe.products.create({
    name: 'Plano Free',
    description: 'Plano gratuito com funcionalidades básicas',
    metadata: {
      tier: 'free',
      maxAds: '5',
      features: 'Anúncios básicos, sem destaque',
    }
  });

  // Basic Plan
  const basicProduct = await stripe.products.create({
    name: 'Plano Basic',
    description: 'Plano com mais anúncios e destaque',
    metadata: {
      tier: 'basic',
      maxAds: '50',
      features: 'Até 50 anúncios, 5 destaques por mês',
    }
  });

  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 4900, // R$49.00
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
  });

  // Premium Plan
  const premiumProduct = await stripe.products.create({
    name: 'Plano Premium',
    description: 'Plano completo com recursos avançados',
    metadata: {
      tier: 'premium',
      maxAds: 'unlimited',
      features: 'Anúncios ilimitados, destaque permanente, analytics',
    }
  });

  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 9900, // R$99.00
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
  });

  console.log('✅ Products created:');
  console.log('Free Product:', freeProduct.id);
  console.log('Basic Product:', basicProduct.id, '- Price:', basicPrice.id);
  console.log('Premium Product:', premiumProduct.id, '- Price:', premiumPrice.id);
}

createProducts().catch(console.error);
