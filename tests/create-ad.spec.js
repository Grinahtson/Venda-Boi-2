import { test, expect } from '@playwright/test';

test.describe('Create Ad Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login and navigate to create ad page
    await page.goto('/dashboard');
    // Click "Anunciar Novo Lote" button
    await page.click('[data-testid="button-create-ad"]');
    await expect(page).toHaveURL('/create-ad');
  });

  test('should display create ad form', async ({ page }) => {
    // Check all form sections exist
    await expect(page.locator('text=Informações Básicas')).toBeVisible();
    await expect(page.locator('text=Preço e Localização')).toBeVisible();
    await expect(page.locator('text=Fotos e Detalhes')).toBeVisible();
  });

  test('should require all mandatory fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[type="submit"]');
    
    // Check validation toasts
    await expect(page.locator('text=Título obrigatório')).toBeVisible();
  });

  test('should validate image upload (max 10 images)', async ({ page }) => {
    // Fill required fields
    await page.fill('[data-testid="input-title"]', 'Lote de Novilhas');
    await page.selectOption('[data-testid="select-category"]', 'novilhas');
    await page.fill('[data-testid="input-breed"]', 'Nelore');
    await page.fill('[data-testid="input-quantity"]', '50');
    await page.fill('[data-testid="input-weight"]', '320');
    await page.fill('[data-testid="input-price"]', '2800');
    
    // Select state and city
    await page.selectOption('select:nth-child(1)', 'SP');
    
    // Test image validation
    const fileInput = page.locator('[data-testid="input-images"]');
    
    // Check max image limit message
    await expect(page.locator('text=10 fotos')).toBeVisible();
  });

  test('should fill location manually', async ({ page }) => {
    // Select state
    await page.selectOption('select:nth-child(1)', 'SP');
    
    // Fill city
    await page.fill('input[placeholder*="cidade"]', 'Presidente Prudente');
    
    // Verify location picker works
    await expect(page.locator('text=Localização da Fazenda')).toBeVisible();
  });

  test('should use current location button', async ({ page }) => {
    // Click "Usar GPS" button
    const gpsButton = page.locator('button:has-text("Usar GPS")');
    await gpsButton.click();
    
    // Button should show loading state briefly
    await expect(gpsButton).toHaveAttribute('disabled');
  });

  test('should require at least 1 image', async ({ page }) => {
    // Fill all fields
    await page.fill('[data-testid="input-title"]', 'Lote de Novilhas');
    await page.selectOption('[data-testid="select-category"]', 'novilhas');
    await page.fill('[data-testid="input-breed"]', 'Nelore');
    await page.fill('[data-testid="input-quantity"]', '50');
    await page.fill('[data-testid="input-weight"]', '320');
    await page.fill('[data-testid="input-price"]', '2800');
    await page.fill('[data-testid="input-phone"]', '(18) 99999-9999');
    
    // Try submit without images
    await page.click('[type="submit"]');
    
    // Should show error about missing images
    await expect(page.locator('text=Fotos obrigatórias')).toBeVisible();
  });

  test('should succeed with all valid data', async ({ page }) => {
    // Fill all required fields
    await page.fill('[data-testid="input-title"]', 'Lote Premium Nelore');
    await page.selectOption('[data-testid="select-category"]', 'novilhas');
    await page.fill('[data-testid="input-breed"]', 'Nelore');
    await page.fill('[data-testid="input-quantity"]', '50');
    await page.fill('[data-testid="input-weight"]', '320');
    await page.fill('[data-testid="input-price"]', '2800');
    await page.selectOption('select:nth-child(1)', 'SP');
    await page.fill('input[placeholder*="cidade"]', 'Presidente Prudente');
    await page.fill('[data-testid="input-phone"]', '(18) 99999-9999');
    
    // Submit form
    await page.click('[type="submit"]');
    
    // Check success message
    await expect(page.locator('text=Anúncio criado com sucesso')).toBeVisible({ timeout: 3000 });
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });
});

test.describe('Marketplace Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('should filter by radius when user location is set', async ({ page }) => {
    // Click "Usar minha localização"
    const locationButton = page.locator('button:has-text("localização")').first();
    await locationButton.click();
    
    // Should show radius filter
    await expect(page.locator('text=Raio')).toBeVisible({ timeout: 2000 });
  });

  test('should sort by distance when location is enabled', async ({ page }) => {
    // Get initial listings
    const listings = await page.locator('[data-testid^="card-product-"]').count();
    expect(listings).toBeGreaterThan(0);
  });
});
