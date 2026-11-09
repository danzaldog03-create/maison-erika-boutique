import assert from 'node:assert/strict'
import test from 'node:test'

// Test shipping logic
function calculateShipping(subtotal: number, flatRate: number, freeThreshold: number): number {
  if (subtotal >= freeThreshold) return 0
  return flatRate
}

test('calculates shipping correctly based on threshold', () => {
  const flatRate = 150
  const freeThreshold = 999

  // Under threshold
  assert.equal(calculateShipping(500, flatRate, freeThreshold), 150)
  assert.equal(calculateShipping(998.99, flatRate, freeThreshold), 150)

  // At or above threshold
  assert.equal(calculateShipping(999, flatRate, freeThreshold), 0)
  assert.equal(calculateShipping(1500, flatRate, freeThreshold), 0)
})

test('validates order items quantity and recalculates totals safely', () => {
  const items = [
    { unitPrice: 350, quantity: 2 },
    { unitPrice: 120, quantity: 1 }
  ]

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  assert.equal(subtotal, 820)

  const shipping = calculateShipping(subtotal, 150, 999)
  assert.equal(shipping, 150)

  const grandTotal = subtotal + shipping
  assert.equal(grandTotal, 970)
})

test('rejects negative or zero item quantities', () => {
  const invalidQuantities = [0, -1, -5, NaN, Infinity]
  for (const qty of invalidQuantities) {
    const isValid = Number.isSafeInteger(qty) && qty > 0
    assert.equal(isValid, false, `Quantity ${qty} should be invalid`)
  }
})
