/**
 * Order status label/color — shared by the client-facing order pages
 * (OrdersListSection, /pedido/[code]). Not used by the admin order list,
 * which has its own i18n-aware dot+label treatment (t.products.orders.statusLabel).
 */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  preparando: 'Preparando',
  enviado: 'Enviado',
  pronto_retirada: 'Pronto para retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  aguardando_pagamento: 'text-gold',
  pago: 'text-sage-light',
  preparando: 'text-sage-light',
  enviado: 'text-sage-light',
  pronto_retirada: 'text-sage-light',
  concluido: 'text-offwhite/55',
  cancelado: 'text-error/60',
}
