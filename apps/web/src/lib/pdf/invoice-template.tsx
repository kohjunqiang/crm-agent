import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import type { DealProduct } from '@agent-crm/shared';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string | null;
  paymentTerms?: string | null;
  // Client
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientCompany?: string | null;
  // Items
  items: DealProduct[];
  amount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function InvoiceTemplate({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Drapeworks</Text>
          <Text style={styles.companyDetail}>Curtains & Blinds Specialist</Text>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Invoice</Text>
          <View>
            <Text style={styles.docNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.docNumber}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Client & Payment Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoValue}>{data.clientName}</Text>
            {data.clientCompany && <Text style={styles.infoValue}>{data.clientCompany}</Text>}
            {data.clientAddress && <Text style={styles.infoValue}>{data.clientAddress}</Text>}
            {data.clientEmail && <Text style={styles.infoValue}>{data.clientEmail}</Text>}
            {data.clientPhone && <Text style={styles.infoValue}>{data.clientPhone}</Text>}
          </View>
          <View style={styles.infoCol}>
            {data.dueDate && (
              <>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{data.dueDate}</Text>
              </>
            )}
            {data.paymentTerms && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 8 }]}>Payment Terms</Text>
                <Text style={styles.infoValue}>{data.paymentTerms}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colName}><Text style={styles.headerText}>Description</Text></View>
            <View style={styles.colQty}><Text style={styles.headerText}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={styles.headerText}>Unit Price</Text></View>
            <View style={styles.colTotal}><Text style={styles.headerText}>Amount</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colName}><Text style={styles.cellText}>{item.name}</Text></View>
              <View style={styles.colQty}><Text style={styles.cellText}>{item.qty ?? 1}</Text></View>
              <View style={styles.colPrice}><Text style={styles.cellText}>{formatCurrency(item.price ?? 0, data.currency)}</Text></View>
              <View style={styles.colTotal}><Text style={styles.cellBold}>{formatCurrency((item.qty ?? 1) * (item.price ?? 0), data.currency)}</Text></View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.amount, data.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>GST ({(data.gstRate * 100).toFixed(0)}%)</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.gstAmount, data.currency)}</Text>
          </View>
          <View style={styles.totalsFinal}>
            <Text style={styles.totalsFinalLabel}>Total Due</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrency(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.terms}>
          {/* TODO: Replace with actual bank details from settings */}
          <Text style={styles.termsTitle}>Payment Details</Text>
          <Text style={styles.termsText}>Bank: DBS Bank</Text>
          <Text style={styles.termsText}>Account Name: Drapeworks</Text>
          <Text style={styles.termsText}>Account Number: (to be configured)</Text>
          <Text style={styles.termsText}>PayNow UEN: (to be configured)</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
}
