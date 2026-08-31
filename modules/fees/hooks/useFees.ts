/**
 * Fees Invoice + Receipt React Query hooks
 */

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { feesService } from "../services/feesService";
import type {
  CreateInvoiceInput,
  InvoicePage,
  RecordPaymentInput,
} from "../services/feesService";

const KEYS = {
  invoices: ["fees", "invoices"] as const,
  invoicesList: (params?: object) =>
    ["fees", "invoices", params ?? {}] as const,
  invoice: (id: string) => ["fees", "invoice", id] as const,
  payment: (id: string) => ["fees", "payment", id] as const,
};

/**
 * Invoices, a page at a time.
 *
 * The header's outstanding total and next due date come from `summary` on any
 * page rather than from the rows loaded — a trust billing three terms has tens
 * of thousands of invoices, and summing a page would show the wrong amount
 * owed.
 */
export function useInvoices(params?: {
  student_id?: string;
  status?: string;
  academic_year?: string;
}) {
  return useInfiniteQuery<InvoicePage>({
    queryKey: KEYS.invoicesList(params),
    queryFn: ({ pageParam }) =>
      feesService.getInvoices({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useInvoice(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: KEYS.invoice(id ?? ""),
    queryFn: () => feesService.getInvoice(id!),
    enabled: !!id && enabled,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => feesService.createInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}

export function useSendReminder(invoiceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feesService.sendReminder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}

export function useRecordPayment(invoiceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPaymentInput) => feesService.recordPayment(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.invoice(vars.invoice_id) });
      qc.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}

export function usePayment(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: KEYS.payment(id ?? ""),
    queryFn: () => feesService.getPayment(id!),
    enabled: !!id && enabled,
  });
}
