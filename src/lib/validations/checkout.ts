import { z } from 'zod'

const clientNameSchema = z
  .string()
  .min(2, 'Nome precisa ter pelo menos 2 caracteres.')
  .max(100, 'Nome muito longo.')
  .refine(v => v.trim().split(/\s+/).filter(Boolean).length >= 2, 'Informe nome e sobrenome.')

const shippingAddressSchema = z.object({
  street: z.string().min(3, 'Endereço inválido.'),
  number: z.string().min(1, 'Número obrigatório.'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro inválido.'),
  city: z.string().min(2, 'Cidade inválida.'),
  state: z.string().length(2, 'UF inválida.'),
  zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido.'),
})

export const createOrderSchema = z.object({
  name: clientNameSchema,

  whatsapp: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^(55)?\d{11}$/, 'WhatsApp inválido. Informe o DDD + 9 dígitos.')),

  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),

  items: z
    .array(z.object({
      productId: z.string().uuid('Produto inválido.'),
      quantity: z.number().int().min(1, 'Quantidade inválida.'),
    }))
    .min(1, 'Carrinho vazio.'),

  fulfillmentMethod: z.enum(['envio', 'retirada']),

  shippingRateId: z.string().uuid().optional(),
  shippingAddress: shippingAddressSchema.optional(),

  couponCode: z.string().optional(),
}).refine(
  data => data.fulfillmentMethod !== 'envio' || (data.shippingRateId && data.shippingAddress),
  { message: 'Informe o endereço e a faixa de frete para envio.', path: ['shippingAddress'] }
)

export type CreateOrderInput = z.infer<typeof createOrderSchema>
