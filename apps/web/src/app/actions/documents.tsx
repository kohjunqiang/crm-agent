'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import type { Quotation, Invoice, Receipt } from '@agent-crm/shared';
import { QuotationTemplate } from '@/lib/pdf/quotation-template';
import { InvoiceTemplate } from '@/lib/pdf/invoice-template';
import { ReceiptTemplate } from '@/lib/pdf/receipt-template';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

async function getNextDocNumber(
  supabase: any,
  userId: string,
  type: 'quotation' | 'invoice' | 'receipt',
): Promise<string> {
  const year = new Date().getFullYear();
  const prefixMap = { quotation: 'DW-Q', invoice: 'DW-INV', receipt: 'DW-R' };

  const { data, error } = await supabase.rpc('next_doc_number', {
    p_user_id: userId,
    p_type: type,
  });

  if (error) throw new Error(`Failed to generate document number: ${error.message}`);

  const nextNum = data as number;
  return `${prefixMap[type]}-${year}-${String(nextNum).padStart(3, '0')}`;
}

async function uploadPdf(
  supabase: any,
  userId: string,
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const filePath = `${userId}/${fileName}`;

  // Ensure bucket exists (idempotent)
  await supabase.storage.createBucket('documents', { public: false }).catch(() => {});

  const { error } = await supabase.storage
    .from('documents')
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return filePath;
}

// ----------------------------------------------------------------
// Quotation
// ----------------------------------------------------------------

export async function getQuotations(dealId: string): Promise<Quotation[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Quotation[];
}

export async function generateQuotation(dealId: string): Promise<Quotation> {
  const { supabase, userId } = await getUserId();

  // Get deal + contact
  const { data: deal } = await supabase
    .from('deals')
    .select('*, contacts(*)')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single();

  if (!deal) throw new Error('Deal not found');

  const contact = deal.contacts;
  const products = deal.products ?? [];
  const subtotal = products.reduce(
    (sum: number, p: any) => sum + (p.qty ?? 1) * (p.price ?? 0),
    0,
  );
  const gstRate = 0.09;
  const gstAmount = Math.round(subtotal * gstRate * 100) / 100;
  const total = subtotal + gstAmount;

  const quotationNumber = await getNextDocNumber(supabase, userId, 'quotation');
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);

  const dateStr = now.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
  const validStr = validUntil.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    <QuotationTemplate
      data={{
        quotationNumber,
        date: dateStr,
        validUntil: validStr,
        clientName: contact?.name || 'Customer',
        clientEmail: contact?.email,
        clientPhone: contact?.phone,
        clientAddress: contact?.address,
        clientCompany: contact?.company,
        items: products,
        subtotal,
        gstRate,
        gstAmount,
        total,
        currency: deal.currency || 'SGD',
        terms: '50% deposit required to confirm order. Balance payable upon completion of installation. Prices are inclusive of installation unless stated otherwise.',
      }}
    />,
  );

  const fileName = `${quotationNumber.replace(/\//g, '-')}.pdf`;
  const pdfPath = await uploadPdf(supabase, userId, Buffer.from(pdfBuffer), fileName);

  // Save record
  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      deal_id: dealId,
      user_id: userId,
      quotation_number: quotationNumber,
      items: products,
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      terms: '50% deposit required to confirm order. Balance payable upon completion of installation.',
      validity_days: 30,
      status: 'sent',
      pdf_path: pdfPath,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    contactId: deal.contact_id,
    entityType: 'quotation',
    entityId: quotation.id,
    eventType: 'created',
    actor: 'human',
    metadata: { quotation_number: quotationNumber, total },
  });

  return quotation as Quotation;
}

// ----------------------------------------------------------------
// Invoice
// ----------------------------------------------------------------

export async function getInvoices(dealId: string): Promise<Invoice[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Invoice[];
}

export async function generateInvoice(dealId: string): Promise<Invoice> {
  const { supabase, userId } = await getUserId();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, contacts(*)')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single();

  if (!deal) throw new Error('Deal not found');

  const contact = deal.contacts;
  const products = deal.products ?? [];
  const amount = products.reduce(
    (sum: number, p: any) => sum + (p.qty ?? 1) * (p.price ?? 0),
    0,
  );
  const gstRate = 0.09;
  const gstAmount = Math.round(amount * gstRate * 100) / 100;
  const total = amount + gstAmount;

  const invoiceNumber = await getNextDocNumber(supabase, userId, 'invoice');
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);

  const dateStr = now.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueStr = dueDate.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  const pdfBuffer = await renderToBuffer(
    <InvoiceTemplate
      data={{
        invoiceNumber,
        date: dateStr,
        dueDate: dueStr,
        paymentTerms: 'Net 14 days',
        clientName: contact?.name || 'Customer',
        clientEmail: contact?.email,
        clientPhone: contact?.phone,
        clientAddress: contact?.address,
        clientCompany: contact?.company,
        items: products,
        amount,
        gstRate,
        gstAmount,
        total,
        currency: deal.currency || 'SGD',
      }}
    />,
  );

  const fileName = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
  const pdfPath = await uploadPdf(supabase, userId, Buffer.from(pdfBuffer), fileName);

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      deal_id: dealId,
      user_id: userId,
      invoice_number: invoiceNumber,
      items: products,
      amount,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      due_date: dueDate.toISOString().split('T')[0],
      payment_terms: 'Net 14 days',
      status: 'sent',
      pdf_path: pdfPath,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    contactId: deal.contact_id,
    entityType: 'invoice',
    entityId: invoice.id,
    eventType: 'created',
    actor: 'human',
    metadata: { invoice_number: invoiceNumber, total },
  });

  return invoice as Invoice;
}

// ----------------------------------------------------------------
// Receipt
// ----------------------------------------------------------------

export async function getReceipt(paymentId: string): Promise<Receipt | null> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Receipt;
}

export async function generateReceipt(paymentId: string, dealId: string): Promise<Receipt> {
  const { supabase, userId } = await getUserId();

  // Get payment
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (!payment) throw new Error('Payment not found');

  // Get deal + contact
  const { data: deal } = await supabase
    .from('deals')
    .select('*, contacts(*)')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single();

  if (!deal) throw new Error('Deal not found');

  // Get all payments for balance calc
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('deal_id', dealId)
    .eq('user_id', userId);

  const totalPaid = (allPayments ?? []).reduce((sum: number, p: any) => sum + p.amount, 0);
  const dealTotal = deal.amount ?? 0;

  const contact = deal.contacts;
  const receiptNumber = await getNextDocNumber(supabase, userId, 'receipt');
  const dateStr = new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const pdfBuffer = await renderToBuffer(
    <ReceiptTemplate
      data={{
        receiptNumber,
        date: dateStr,
        clientName: contact?.name || 'Customer',
        clientEmail: contact?.email,
        clientCompany: contact?.company,
        amount: payment.amount,
        currency: deal.currency || 'SGD',
        paymentLabel: payment.label,
        dealTitle: deal.title,
        dealTotal,
        totalPaid,
        balanceRemaining: dealTotal - totalPaid,
      }}
    />,
  );

  const fileName = `${receiptNumber.replace(/\//g, '-')}.pdf`;
  const pdfPath = await uploadPdf(supabase, userId, Buffer.from(pdfBuffer), fileName);

  // Update payment receipt_issued_at
  await supabase
    .from('payments')
    .update({ receipt_issued_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('user_id', userId);

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert({
      payment_id: paymentId,
      user_id: userId,
      receipt_number: receiptNumber,
      amount: payment.amount,
      pdf_path: pdfPath,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId,
    contactId: deal.contact_id,
    entityType: 'receipt',
    entityId: receipt.id,
    eventType: 'created',
    actor: 'human',
    metadata: { receipt_number: receiptNumber, amount: payment.amount },
  });

  return receipt as Receipt;
}

// ----------------------------------------------------------------
// Download URL
// ----------------------------------------------------------------

export async function getDocumentDownloadUrl(pdfPath: string): Promise<string> {
  const { supabase } = await getUserId();
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(pdfPath, 3600); // 1 hour expiry

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
