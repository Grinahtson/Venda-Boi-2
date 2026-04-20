export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Remove special characters from phone
  const clean = phoneNumber.replace(/\D/g, "");
  
  // Add Brazil country code if not present
  const fullPhone = clean.startsWith("55") ? clean : `55${clean}`;
  
  // Encode message
  const encoded = encodeURIComponent(message);
  
  return `https://wa.me/${fullPhone}?text=${encoded}`;
}

export function getDefaultMessage(animalTitle: string, quantity: number, price: number): string {
  return `Olá! Tenho interesse no anúncio: "${animalTitle}" (${quantity} cabeças). Qual é a melhor proposta que você pode fazer? Obrigado.`;
}
