import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import type { DealProduct } from '@agent-crm/shared';

interface QuotationData {
  quotationNumber: string;
  date: string;
  validUntil: string;
  // Client
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientCompany?: string | null;
  // Items
  items: DealProduct[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  currency: string;
  // Terms
  terms?: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function QuotationTemplate({ data }: { data: QuotationData }) {
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
          <Text style={styles.title}>Quotation</Text>
          <View>
            <Text style={styles.docNumber}>{data.quotationNumber}</Text>
            <Text style={styles.docNumber}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Client & Validity */}
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
            <Text style={styles.infoLabel}>Valid Until</Text>
            <Text style={styles.infoValue}>{data.validUntil}</Text>
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
            <Text style={styles.totalsValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>GST ({(data.gstRate * 100).toFixed(0)}%)</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.gstAmount, data.currency)}</Text>
          </View>
          <View style={styles.totalsFinal}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrency(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* Terms */}
        {data.terms && (
          <View style={styles.terms}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{data.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business. This quotation is valid until {data.validUntil}.
        </Text>
      </Page>
    </Document>
  );
}
