import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

interface ReceiptData {
  receiptNumber: string;
  date: string;
  // Client
  clientName: string;
  clientEmail?: string | null;
  clientCompany?: string | null;
  // Payment
  amount: number;
  currency: string;
  paymentLabel?: string | null;
  dealTitle: string;
  dealTotal: number;
  totalPaid: number;
  balanceRemaining: number;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ReceiptTemplate({ data }: { data: ReceiptData }) {
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
          <Text style={styles.title}>Payment Receipt</Text>
          <View>
            <Text style={styles.docNumber}>{data.receiptNumber}</Text>
            <Text style={styles.docNumber}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Received From</Text>
            <Text style={styles.infoValue}>{data.clientName}</Text>
            {data.clientCompany && <Text style={styles.infoValue}>{data.clientCompany}</Text>}
            {data.clientEmail && <Text style={styles.infoValue}>{data.clientEmail}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue}>{data.dealTitle}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '60%' }}><Text style={styles.headerText}>Description</Text></View>
            <View style={{ width: '40%', textAlign: 'right' }}><Text style={styles.headerText}>Amount</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ width: '60%' }}>
              <Text style={styles.cellText}>
                Payment{data.paymentLabel ? ` — ${data.paymentLabel}` : ''}
              </Text>
            </View>
            <View style={{ width: '40%', textAlign: 'right' }}>
              <Text style={styles.cellBold}>{formatCurrency(data.amount, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Balance Summary */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Deal Total</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.dealTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Paid</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.totalPaid, data.currency)}</Text>
          </View>
          <View style={styles.totalsFinal}>
            <Text style={styles.totalsFinalLabel}>Balance</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrency(data.balanceRemaining, data.currency)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This receipt confirms payment received. Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
}
