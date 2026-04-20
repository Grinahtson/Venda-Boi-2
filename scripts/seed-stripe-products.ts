import { getUncachableStripeClient, getStripeSync } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Criando produtos no Stripe...');

  // Plano Free
  const freeProduct = await stripe.products.create({
    name: 'Plano Free',
    description: 'Plano gratuito com funcionalidades básicas',
    metadata: {
      tier: 'free',
      maxAds: '5',
      features: 'Anúncios básicos, sem destaque',
    },
  });
  console.log('Plano Free criado:', freeProduct.id);

  // Plano Basic
  const basicProduct = await stripe.products.create({
    name: 'Plano Basic',
    description: 'Plano com mais anúncios e destaque',
    metadata: {
      tier: 'basic',
      maxAds: '50',
      features: 'Até 50 anúncios, 5 destaques por mês',
    },
  });
  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 4900,
    currency: 'brl',
    recurring: { interval: 'month' },
  });
  console.log('Plano Basic criado:', basicProduct.id, basicPrice.id);

  // Plano Premium
  const premiumProduct = await stripe.products.create({
    name: 'Plano Premium',
    description: 'Plano completo com recursos avançados',
    metadata: {
      tier: 'premium',
      maxAds: 'unlimited',
      features: 'Anúncios ilimitados, destaque permanente, analytics',
    },
  });
  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 9900,
    currency: 'brl',
    recurring: { interval: 'month' },
  });
  console.log('Plano Premium criado:', premiumProduct.id, premiumPrice.id);

  // Plano Anual
  const annualProduct = await stripe.products.create({
    name: 'Plano Anual',
    description: 'Plano Premium com desconto de 20% no pagamento anual',
    metadata: {
      tier: 'premium_annual',
      maxAds: 'ilimitado',
      features: 'Anúncios ilimitados,Destaque na busca,Verificação prioritária,Suporte VIP,Dashboard avançado,Relatórios de mercado,Desconto de 20%',
    },
  });
  const annualPrice = await stripe.prices.create({
    product: annualProduct.id,
    unit_amount: 95904,
    currency: 'brl',
    recurring: { interval: 'year' },
  });
  console.log('Plano Anual criado:', annualProduct.id, annualPrice.id);

  // Sincronizar
  console.log('Sincronizando com banco de dados...');
  const stripeSync = await getStripeSync();
  await stripeSync.syncBackfill();
  console.log('Pronto! Produtos criados e sincronizados.');
}

createProducts().catch(console.error);
