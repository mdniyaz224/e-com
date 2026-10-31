'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
import { numberToWords } from '@/utils/numberToWords';
import styles from './invoice.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getHsnCode(category, name) {
  const text = `${category || ''} ${name || ''}`.toLowerCase();
  if (text.includes('headphone') || text.includes('audio') || text.includes('sound') || text.includes('earbud')) {
    return '85183000';
  }
  if (text.includes('watch') || text.includes('smartwatch') || text.includes('wearable')) {
    return '85176290';
  }
  if (text.includes('cable') || text.includes('charger') || text.includes('adapter')) {
    return '85044090';
  }
  if (text.includes('mobile') || text.includes('phone') || text.includes('smartphone')) {
    return '85171300';
  }
  if (text.includes('tv') || text.includes('television') || text.includes('appliance')) {
    return '85287200';
  }
  return '85235200';
}

export default function OrderInvoicePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const orderId = params.id;
  const shouldAutoPrint = searchParams?.get('print') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`${API_URL}/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
        if (shouldAutoPrint) {
          setTimeout(() => {
            window.print();
          }, 600);
        }
      })
      .catch((err) => {
        console.error('Invoice fetch error:', err);
        setLoading(false);
      });
  }, [orderId, shouldAutoPrint]);

  if (loading) {
    return (
      <div className={styles.invoicePage} style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>Generating Tax Invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.invoicePage} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Invoice Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
          Could not locate Tax Invoice details for Order #{orderId}.
        </p>
        <Link href={`/orders/${orderId}`} className={styles.backBtn}>
          ← Back to Order
        </Link>
      </div>
    );
  }

  // Calculate GST breakdowns for items (Standard 18% GST: 9% CGST + 9% SGST)
  const itemsWithTax = (order.items || []).map((item, idx) => {
    const qty = item.quantity || 1;
    const totalItemPrice = (item.price || 0) * qty;
    const originalItemPrice = (item.originalPrice || item.price || 0) * qty;
    const discount = Math.max(0, originalItemPrice - totalItemPrice);

    // Taxable value = Total / 1.18
    const taxableValue = parseFloat((totalItemPrice / 1.18).toFixed(2));
    const totalTax = parseFloat((totalItemPrice - taxableValue).toFixed(2));
    const cgst = parseFloat((totalTax / 2).toFixed(2));
    const sgst = parseFloat((totalTax - cgst).toFixed(2)); // handle rounding pennies

    return {
      slNo: idx + 1,
      name: item.name || 'PulseKart Catalog Product',
      color: item.color || 'Standard',
      seller: item.seller || 'RetailNet Private Limited',
      hsn: getHsnCode(item.category, item.name),
      qty,
      grossAmount: originalItemPrice,
      discount,
      taxableValue,
      cgst,
      sgst,
      totalTax,
      totalAmount: totalItemPrice
    };
  });

  const totalTaxable = itemsWithTax.reduce((sum, it) => sum + it.taxableValue, 0);
  const totalCgst = itemsWithTax.reduce((sum, it) => sum + it.cgst, 0);
  const totalSgst = itemsWithTax.reduce((sum, it) => sum + it.sgst, 0);
  const grandTotal = order.totalAmount || itemsWithTax.reduce((sum, it) => sum + it.totalAmount, 0);

  const orderDateFormatted = order.date
    ? new Date(order.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '29 Oct 2026, 07:07 PM';

  const invoiceDateFormatted = order.date
    ? new Date(order.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '29 Oct 2026';

  const invoiceNumber = `PK-INV-${order.id ? order.id.replace('OD', '') : '892418'}`;
  const amountInWords = numberToWords(grandTotal);

  return (
    <div className={styles.invoicePage}>
      {/* On-Screen Action Controls Bar (Hidden during print) */}
      <div className={styles.controlBar}>
        <Link href={`/orders/${order.id}`} className={styles.backBtn}>
          <span>←</span>
          <span>Back to Order Details</span>
        </Link>

        <button onClick={() => window.print()} className={styles.printBtn}>
          <span>🖨️</span>
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Formal Flipkart Standard Tax Invoice Document */}
      <div className={styles.invoiceSheet}>
        {/* Header Block */}
        <div className={styles.headerGrid}>
          <div>
            <div className={styles.brandLogoRow}>
              <span className={styles.brandLogoText}>PulseKart</span>
              <span className={styles.brandLogoTag}>Plus</span>
            </div>
            <div className={styles.companyAddress}>
              <strong>PulseKart Internet Private Limited</strong>
              <br />
              Buildings Alyssa, Begonia & Clover, Embassy Tech Village,
              <br />
              Outer Ring Road, Devarabeesanahalli Village, Bengaluru – 560103, Karnataka, India
              <br />
              CIN: U51109KA2012PTC066107 • Phone: 1800-208-9898 • Email: care@pulsekart.in
            </div>
          </div>

          <div className={styles.invoiceTitleBlock}>
            <div className={styles.invoiceMainTitle}>Tax Invoice / Bill of Supply / Cash Memo</div>
            <div className={styles.invoiceSubTitle}>(Original for Recipient)</div>

            <div className={styles.barcodeWrap}>
              <div className={styles.barcodeLines}>||||||| | ||||| |||| | |||||| ||</div>
              <span className={styles.barcodeText}>*{order.id}*</span>
            </div>
          </div>
        </div>

        {/* Order & Seller Metadata Grid */}
        <div className={styles.metaBoxGrid}>
          {/* Order Details (Left) */}
          <div className={styles.metaCol}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Order Number:</span>
              <span className={styles.metaValue} style={{ color: '#2874f0' }}>#{order.id}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Order Date:</span>
              <span className={styles.metaValue}>{orderDateFormatted}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Invoice Number:</span>
              <span className={styles.metaValue}>{invoiceNumber}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Invoice Date:</span>
              <span className={styles.metaValue}>{invoiceDateFormatted}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Reverse Charge:</span>
              <span className={styles.metaValue}>No</span>
            </div>
          </div>

          {/* Sold By Details (Right) */}
          <div className={styles.metaCol}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Sold By:</span>
              <span className={styles.metaValue}>RetailNet Private Limited</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Warehouse Address:</span>
              <span className={styles.metaValue}>Plot 84, Electronic City Ph-1, Bengaluru, KA 560100</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>GSTIN:</span>
              <span className={styles.metaValue}>29AABCR8924C1Z5</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>PAN Number:</span>
              <span className={styles.metaValue}>AABCR8924C</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>State / UT Code:</span>
              <span className={styles.metaValue}>29 (Karnataka)</span>
            </div>
          </div>
        </div>

        {/* Addresses Grid (Billing vs Shipping) */}
        <div className={styles.addressGrid}>
          {/* Billing Address */}
          <div className={styles.addressCol}>
            <div className={styles.addressTitle}>Billing Address</div>
            <div className={styles.addressText}>
              <strong>{order.address?.name || 'Customer'}</strong>
              <br />
              {order.address?.address || 'Standard Delivery Address'}
              <br />
              {order.address?.city || ''}{order.address?.pincode ? ` - ${order.address.pincode}` : ''}
              {order.address?.phone ? (
                <>
                  <br />
                  Contact: {order.address.phone}
                </>
              ) : null}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.addressCol}>
            <div className={styles.addressTitle}>Shipping Address</div>
            <div className={styles.addressText}>
              <strong>{order.address?.name || 'Customer'}</strong>
              <br />
              {order.address?.address || 'Standard Delivery Address'}
              <br />
              {order.address?.city || ''}{order.address?.pincode ? ` - ${order.address.pincode}` : ''}
              {order.address?.phone ? (
                <>
                  <br />
                  Contact: {order.address.phone}
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Flipkart Itemized Tax Table */}
        <div className={styles.tableWrap}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th style={{ width: '28px' }}>#</th>
                <th className={styles.alignLeft}>Description of Goods</th>
                <th style={{ width: '60px' }}>HSN</th>
                <th style={{ width: '32px' }}>Qty</th>
                <th className={styles.alignRight} style={{ width: '65px' }}>Gross (₹)</th>
                <th className={styles.alignRight} style={{ width: '60px' }}>Discount</th>
                <th className={styles.alignRight} style={{ width: '75px' }}>Taxable Val</th>
                <th className={styles.alignRight} style={{ width: '55px' }}>CGST (9%)</th>
                <th className={styles.alignRight} style={{ width: '55px' }}>SGST (9%)</th>
                <th className={styles.alignRight} style={{ width: '80px' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {itemsWithTax.map((it) => (
                <tr key={it.slNo}>
                  <td className={styles.alignCenter}>{it.slNo}</td>
                  <td className={styles.alignLeft}>
                    <div className={styles.itemTitleBold}>{it.name}</div>
                    <div className={styles.itemSubDetail}>
                      Variant: <strong>{it.color}</strong> • Seller: <strong>{it.seller}</strong>
                    </div>
                  </td>
                  <td className={styles.alignCenter}>{it.hsn}</td>
                  <td className={styles.alignCenter}>{it.qty}</td>
                  <td className={styles.alignRight}>{it.grossAmount.toFixed(2)}</td>
                  <td className={styles.alignRight} style={{ color: it.discount > 0 ? '#15803d' : 'inherit' }}>
                    {it.discount > 0 ? `-${it.discount.toFixed(2)}` : '0.00'}
                  </td>
                  <td className={styles.alignRight}>{it.taxableValue.toFixed(2)}</td>
                  <td className={styles.alignRight}>{it.cgst.toFixed(2)}</td>
                  <td className={styles.alignRight}>{it.sgst.toFixed(2)}</td>
                  <td className={styles.alignRight} style={{ fontWeight: 700 }}>
                    {it.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Subtotal Row */}
              <tr className={styles.totalRow}>
                <td colSpan={6} className={styles.alignRight}>Total Taxable & Taxes:</td>
                <td className={styles.alignRight}>₹{totalTaxable.toFixed(2)}</td>
                <td className={styles.alignRight}>₹{totalCgst.toFixed(2)}</td>
                <td className={styles.alignRight}>₹{totalSgst.toFixed(2)}</td>
                <td className={styles.alignRight}>₹{grandTotal.toFixed(2)}</td>
              </tr>

              {/* Shipping Row */}
              <tr>
                <td colSpan={9} className={styles.alignRight} style={{ fontStyle: 'italic' }}>
                  Shipping & Handling Charges:
                </td>
                <td className={styles.alignRight} style={{ color: '#15803d', fontWeight: 700 }}>
                  FREE
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr className={styles.grandTotalRow}>
                <td colSpan={9} className={styles.alignRight} style={{ fontSize: '12px' }}>
                  GRAND TOTAL (INCL. TAXES):
                </td>
                <td className={styles.alignRight} style={{ fontSize: '13px', color: '#000000' }}>
                  {formatPrice(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words & Signature Block */}
        <div className={styles.bottomMetaGrid}>
          {/* Amount in Words & Declarations */}
          <div className={styles.wordsCol}>
            <div className={styles.wordsTitle}>Total Amount in Words:</div>
            <div className={styles.wordsText}>{amountInWords}</div>

            <div className={styles.declarationBox}>
              <strong>Declaration:</strong>
              <br />
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. The goods sold are intended for end-user retail consumption and not for resale.
              <br />
              <span style={{ marginTop: '4px', display: 'block' }}>
                Mode of Payment: <strong>{order.paymentMethod || 'UPI (Google Pay)'}</strong> • Courier: <strong>{order.courier || 'PulseKart Express'}</strong> (AWB: <strong>{order.trackingNumber || 'PKEXP892174'}</strong>)
              </span>
            </div>
          </div>

          {/* Digital Signature Box */}
          <div className={styles.signatureCol}>
            <div className={styles.signForCompany}>
              For <strong>RetailNet Private Limited</strong>:
            </div>

            <div className={styles.stampBox}>
              ✓ DIGITALLY SIGNED & VERIFIED
            </div>

            <div className={styles.signLabel}>
              Authorized Signatory
              <br />
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>Electronic Verification Stamp</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.invoiceFooter}>
          <span>PulseKart 24x7 Customer Care: 1800-208-9898 • care@pulsekart.in</span>
          <span>Computer Generated Tax Invoice. No Physical Signature Required.</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

