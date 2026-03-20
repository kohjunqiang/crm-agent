'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Deal, DealStage, DealProduct, Payment, Quotation, Invoice, Receipt, CreateDealInput, CreatePaymentInput } from '@agent-crm/shared';
import { toast } from 'sonner';
import { getDeals, createDeal, updateDeal, deleteDeal } from '@/app/actions/deals';
import { getPayments, createPayment } from '@/app/actions/payments';
import {
  getQuotations,
  getInvoices,
  getReceipt,
  generateQuotation,
  generateInvoice,
  generateReceipt,
  getDocumentDownloadUrl,
} from '@/app/actions/documents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { ALL_STAGES, STAGE_LABELS, STAGE_BADGE_COLORS } from '@/lib/stages';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  DollarSign,
  Receipt as ReceiptIcon,
  Briefcase,
  Package,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';


function totalPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

// ----------------------------------------------------------------
// LineItemRow
// ----------------------------------------------------------------
interface LineItemRowProps {
  item: DealProduct;
  onRemove: () => void;
}

function LineItemRow({ item, onRemove }: LineItemRowProps) {
  const subtotal = (item.qty ?? 1) * (item.price ?? 0);
  return (
    <div className="flex items-center gap-2 rounded border px-3 py-2 text-xs">
      <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
      <span className="shrink-0 text-muted-foreground">
        {item.qty ?? 0} × {formatCurrency(item.price ?? 0)}
      </span>
      <span className="shrink-0 font-medium">{formatCurrency(subtotal)}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${item.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// AddLineItemForm
// ----------------------------------------------------------------
interface AddLineItemFormProps {
  onAdd: (item: DealProduct) => void;
}

function AddLineItemForm({ onAdd }: AddLineItemFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      qty: parseInt(qty) || 1,
      price: parseFloat(price) || 0,
    });
    setName('');
    setQty('1');
    setPrice('');
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        Add Item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border p-2">
      <div className="flex gap-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="h-7 flex-1 text-xs"
          autoFocus
          required
        />
        <Input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          className="h-7 w-14 text-xs"
          min={1}
        />
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          className="h-7 w-20 text-xs"
          min={0}
          step="0.01"
        />
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-6 px-2 text-xs"
          disabled={!name.trim()}
        >
          Add
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// LineItemsEditor
// ----------------------------------------------------------------
interface LineItemsEditorProps {
  products: DealProduct[];
  onUpdate: (products: DealProduct[]) => Promise<void>;
}

function LineItemsEditor({ products, onUpdate }: LineItemsEditorProps) {
  const total = products.reduce((sum, p) => sum + (p.qty ?? 1) * (p.price ?? 0), 0);

  const handleAdd = async (item: DealProduct) => {
    await onUpdate([...products, item]);
  };

  const handleRemove = async (index: number) => {
    await onUpdate(products.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold">Line Items</span>
      {products.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items yet. Add line items to build the deal.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {products.map((item, i) => (
            <LineItemRow key={i} item={item} onRemove={() => handleRemove(i)} />
          ))}
          <div className="flex justify-between border-t pt-1.5 text-xs font-medium">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
      <AddLineItemForm onAdd={handleAdd} />
    </div>
  );
}

// ----------------------------------------------------------------
// PaymentRow (with Generate Receipt)
// ----------------------------------------------------------------
interface PaymentRowProps {
  payment: Payment;
  dealId: string;
  onReceiptGenerated: (paymentId: string) => void;
}

function PaymentRow({ payment, dealId, onReceiptGenerated }: PaymentRowProps) {
  const [pending, setPending] = useState(false);

  const handleGenerateReceipt = async () => {
    setPending(true);
    try {
      await generateReceipt(payment.id, dealId);
      onReceiptGenerated(payment.id);
      toast.success('Receipt generated.');
    } catch {
      toast.error('Failed to generate receipt.');
    } finally {
      setPending(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!payment.receipt_issued_at) return;
    try {
      const receipt = await getReceipt(payment.id);
      if (receipt?.pdf_path) {
        const url = await getDocumentDownloadUrl(receipt.pdf_path);
        window.open(url, '_blank');
      }
    } catch {
      toast.error('Failed to download receipt.');
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-xs">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{formatCurrency(payment.amount)}</span>
        {payment.label && (
          <span className="text-muted-foreground">{payment.label}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {payment.receipt_issued_at ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-[10px] text-green-700"
            onClick={handleDownloadReceipt}
          >
            <FileText className="h-2.5 w-2.5" />
            Receipt
            <Download className="h-2 w-2" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={handleGenerateReceipt}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ReceiptIcon className="h-3 w-3" />}
            Generate Receipt
          </Button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// DocumentsSection
// ----------------------------------------------------------------
interface DocumentsSectionProps {
  dealId: string;
  stage: DealStage;
  quotations: Quotation[];
  invoices: Invoice[];
  onDocGenerated: () => void;
}

function DocumentsSection({ dealId, stage, quotations, invoices, onDocGenerated }: DocumentsSectionProps) {
  const [generating, setGenerating] = useState<string | null>(null);

  const QUOTATION_STAGES: DealStage[] = ['quotation_sent', 'confirmed', 'ordered', 'fulfilled', 'completed'];
  const INVOICE_STAGES: DealStage[] = ['confirmed', 'ordered', 'fulfilled', 'completed'];

  const canGenerateQuotation = QUOTATION_STAGES.includes(stage);
  const canGenerateInvoice = INVOICE_STAGES.includes(stage);

  const handleGenerate = async (type: 'quotation' | 'invoice') => {
    setGenerating(type);
    try {
      if (type === 'quotation') {
        await generateQuotation(dealId);
      } else {
        await generateInvoice(dealId);
      }
      onDocGenerated();
      toast.success(`${type === 'quotation' ? 'Quotation' : 'Invoice'} generated.`);
    } catch {
      toast.error(`Failed to generate ${type}.`);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (pdfPath: string | null) => {
    if (!pdfPath) return;
    try {
      const url = await getDocumentDownloadUrl(pdfPath);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to get download link.');
    }
  };

  const hasDocuments = quotations.length > 0 || invoices.length > 0;
  const hasActions = canGenerateQuotation || canGenerateInvoice;

  if (!hasDocuments && !hasActions) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold">Documents</span>
      {/* Existing documents */}
      {quotations.map((q) => (
        <div key={q.id} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{q.quotation_number}</span>
              <span className="text-[10px] text-muted-foreground">Quotation</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => handleDownload(q.pdf_path)}
          >
            <Download className="h-3 w-3" />
            PDF
          </Button>
        </div>
      ))}
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{inv.invoice_number}</span>
              <span className="text-[10px] text-muted-foreground">Invoice</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => handleDownload(inv.pdf_path)}
          >
            <Download className="h-3 w-3" />
            PDF
          </Button>
        </div>
      ))}
      {/* Generate buttons */}
      <div className="flex flex-wrap gap-1.5">
        {canGenerateQuotation && quotations.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => handleGenerate('quotation')}
            disabled={generating !== null}
          >
            {generating === 'quotation' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Generate Quotation
          </Button>
        )}
        {canGenerateInvoice && invoices.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => handleGenerate('invoice')}
            disabled={generating !== null}
          >
            {generating === 'invoice' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Generate Invoice
          </Button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// AddPaymentForm
// ----------------------------------------------------------------
interface AddPaymentFormProps {
  onAdd: (input: CreatePaymentInput) => Promise<void>;
}

function AddPaymentForm({ onAdd }: AddPaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    setPending(true);
    try {
      await onAdd({ amount: parsed, label: label.trim() || null });
      setAmount('');
      setLabel('');
      setOpen(false);
    } catch {
      toast.error('Failed to record payment.');
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        Add Payment
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border p-2">
      <div className="flex gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="h-7 text-xs"
          min={0}
          step="0.01"
          required
          autoFocus
        />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="h-7 text-xs"
        />
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-6 px-2 text-xs"
          disabled={pending || !amount}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// DealItem
// ----------------------------------------------------------------
interface DealItemProps {
  deal: Deal;
  onStageChange: (id: string, stage: DealStage) => Promise<void>;
  onProductsUpdate: (id: string, products: DealProduct[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function DealItem({ deal, onStageChange, onProductsUpdate, onDelete }: DealItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);

  const loadDealData = useCallback(async () => {
    if (paymentsLoaded) return;
    setPaymentsLoading(true);
    try {
      const [paymentsData, quotationsData, invoicesData] = await Promise.all([
        getPayments(deal.id),
        getQuotations(deal.id),
        getInvoices(deal.id),
      ]);
      setPayments(paymentsData);
      setQuotationsList(quotationsData);
      setInvoicesList(invoicesData);
      setPaymentsLoaded(true);
    } catch {
      toast.error('Failed to load deal data.');
    } finally {
      setPaymentsLoading(false);
    }
  }, [deal.id, paymentsLoaded]);

  const handleExpand = () => {
    if (!expanded) loadDealData();
    setExpanded((v) => !v);
  };

  const handleAddPayment = async (input: CreatePaymentInput) => {
    const payment = await createPayment(deal.id, input);
    setPayments((prev) => [...prev, payment]);
    toast.success('Payment recorded.');
  };

  const handleDocGenerated = useCallback(async () => {
    // Reload documents
    const [q, i] = await Promise.all([getQuotations(deal.id), getInvoices(deal.id)]);
    setQuotationsList(q);
    setInvoicesList(i);
  }, [deal.id]);

  const handleReceiptGenerated = useCallback((paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, receipt_issued_at: new Date().toISOString() } : p)),
    );
  }, []);

  const paid = totalPaid(payments);

  return (
    <div className="flex flex-col gap-0 rounded-lg border">
      {/* Header */}
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-accent/30"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{deal.title}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5 font-medium text-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(deal.amount, deal.currency)}
            </span>
            {paymentsLoaded && paid > 0 && (
              <>
                <span>·</span>
                <span>{formatCurrency(paid)} paid</span>
              </>
            )}
          </div>
          {/* Document & payment status badges */}
          {paymentsLoaded && (quotationsList.length > 0 || invoicesList.length > 0 || paid > 0) && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {quotationsList.length > 0 && (
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[9px] border-amber-200 bg-amber-50 text-amber-700">
                  <FileText className="h-2 w-2" />
                  Quoted
                </Badge>
              )}
              {invoicesList.length > 0 && (
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[9px] border-blue-200 bg-blue-50 text-blue-700">
                  <FileText className="h-2 w-2" />
                  Invoiced
                </Badge>
              )}
              {deal.amount !== null && paid > 0 && paid < deal.amount && (
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[9px] border-orange-200 bg-orange-50 text-orange-700">
                  <DollarSign className="h-2 w-2" />
                  Partial
                </Badge>
              )}
              {deal.amount !== null && paid >= deal.amount && deal.amount > 0 && (
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[9px] border-green-200 bg-green-50 text-green-700">
                  <DollarSign className="h-2 w-2" />
                  Paid
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('px-1.5 py-0 text-[10px]', STAGE_BADGE_COLORS[deal.stage])}
          >
            {STAGE_LABELS[deal.stage]}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <>
          <Separator />
          <div className="flex flex-col gap-3 px-3 py-3">
            {/* Stage change */}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Stage</span>
              <Select
                value={deal.stage}
                onValueChange={(s) => onStageChange(deal.id, s as DealStage)}
              >
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Items */}
            <LineItemsEditor
              products={deal.products ?? []}
              onUpdate={async (products) => {
                const total = products.reduce((sum, p) => sum + (p.qty ?? 1) * (p.price ?? 0), 0);
                await onProductsUpdate(deal.id, products);
              }}
            />

            {/* Documents */}
            {!paymentsLoading && (
              <DocumentsSection
                dealId={deal.id}
                stage={deal.stage}
                quotations={quotationsList}
                invoices={invoicesList}
                onDocGenerated={handleDocGenerated}
              />
            )}

            {/* Payments */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold">Payments</span>
              {paymentsLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {payments.map((p) => (
                    <PaymentRow
                      key={p.id}
                      payment={p}
                      dealId={deal.id}
                      onReceiptGenerated={handleReceiptGenerated}
                    />
                  ))}
                  {deal.amount !== null && paid > 0 && (
                    <div className="flex justify-between border-t pt-1.5 text-xs font-medium">
                      <span>Total paid</span>
                      <span>
                        {formatCurrency(paid)} / {formatCurrency(deal.amount, deal.currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <AddPaymentForm onAdd={handleAddPayment} />
            </div>

            {/* Notes */}
            {deal.notes && (
              <p className="rounded bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                {deal.notes}
              </p>
            )}

            {/* Delete */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!confirm(`Delete deal "${deal.title}"?`)) return;
                  await onDelete(deal.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Deal
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// CreateDealForm
// ----------------------------------------------------------------
interface CreateDealFormProps {
  onCreated: (deal: Deal) => void;
  contactId: string;
}

function CreateDealForm({ onCreated, contactId }: CreateDealFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<DealStage>('discovery');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const input: CreateDealInput = {
      title: title.trim(),
      amount: amount ? parseFloat(amount) : null,
      stage,
    };

    setPending(true);
    try {
      const deal = await createDeal(contactId, input);
      onCreated(deal);
      toast.success('Deal created.');
      setTitle('');
      setAmount('');
      setStage('discovery');
      setOpen(false);
    } catch {
      toast.error('Failed to create deal.');
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        New Deal
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border p-3"
    >
      <p className="text-xs font-semibold">New Deal</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deal-title" className="text-xs">Title *</Label>
        <Input
          id="deal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deal title"
          className="h-7 text-xs"
          autoFocus
          required
        />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="deal-amount" className="text-xs">Amount</Label>
          <Input
            id="deal-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-7 text-xs"
            min={0}
            step="0.01"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs">Stage</Label>
          <Select value={stage} onValueChange={(s) => setStage(s as DealStage)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STAGES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          {pending ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// ContactDeals
// ----------------------------------------------------------------
interface ContactDealsProps {
  contactId: string;
}

export function ContactDeals({ contactId }: ContactDealsProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeals(contactId);
      setDeals(data);
    } catch {
      toast.error('Failed to load deals.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleStageChange = useCallback(async (id: string, stage: DealStage) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      await updateDeal(id, { stage });
    } catch {
      toast.error('Failed to update stage.');
      fetchDeals();
    }
  }, [fetchDeals]);

  const handleProductsUpdate = useCallback(async (id: string, products: DealProduct[]) => {
    const amount = products.length > 0
      ? products.reduce((sum, p) => sum + (p.qty ?? 1) * (p.price ?? 0), 0)
      : null;
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, products, amount } : d)));
    try {
      await updateDeal(id, { products, amount });
    } catch {
      toast.error('Failed to update line items.');
      fetchDeals();
    }
  }, [fetchDeals]);

  const handleDelete = useCallback(async (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDeal(id);
      toast.success('Deal deleted.');
    } catch {
      toast.error('Failed to delete deal.');
      fetchDeals();
    }
  }, [fetchDeals]);

  const handleCreated = useCallback((deal: Deal) => {
    setDeals((prev) => [deal, ...prev]);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground">Loading deals…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">
            Deals
            {deals.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({deals.length})</span>
            )}
          </span>
        </div>
        <CreateDealForm contactId={contactId} onCreated={handleCreated} />
      </div>

      {/* Deal list */}
      {deals.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No deals yet. Create one to track progress.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {deals.map((deal) => (
            <DealItem
              key={deal.id}
              deal={deal}
              onStageChange={handleStageChange}
              onProductsUpdate={handleProductsUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
