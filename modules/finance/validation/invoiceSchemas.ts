import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Amount/discount/fine come from text inputs (RHF stores strings).
// Validate them as numeric strings — actual number coercion happens at submit
// time, outside the resolver, to avoid RHF's input/output type divergence with z.coerce.
const positiveAmountString = z
  .string()
  .min(1, 'Amount required')
  .refine((s) => {
    const n = parseFloat(s);
    return !Number.isNaN(n) && n > 0;
  }, 'Amount must be greater than 0');

const nonnegativeOptionalString = z
  .string()
  .optional()
  .refine((s) => {
    if (s === undefined || s === '') return true;
    const n = parseFloat(s);
    return !Number.isNaN(n) && n >= 0;
  }, 'Must be 0 or greater');

export const invoiceItemSchema = z.object({
  fee_head: z.string().trim().min(1, 'Fee head required'),
  period: z.string().trim().optional(),
  amount: positiveAmountString,
  discount: nonnegativeOptionalString,
  fine: nonnegativeOptionalString,
});

export const createInvoiceSchema = z.object({
  student_id: z.string().min(1, 'Pick a student'),
  academic_year: z.string().min(1, 'Academic year required'),
  issue_date: z.string().regex(ISO_DATE_RE, 'Issue date required'),
  due_date: z.string().regex(ISO_DATE_RE, 'Due date required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one fee item required'),
  notes: z.string().trim().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
