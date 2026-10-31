'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './help.module.css';

const faqs = [
  {
    q: 'How do I track my order delivery in real time?',
    a: 'You can track all active orders directly by visiting "My Orders" from your account or clicking the "Track Package" button on any order card. Our live logistics tracker updates timestamps at every step (Confirmed, Packed, Shipped, Delivered).'
  },
  {
    q: 'What is PulseKart\'s 7-Day Replacement Policy?',
    a: 'All eligible products purchased on PulseKart come with a hassle-free 7-day replacement guarantee. If you receive a damaged, defective, or incorrect item, you can initiate a return or replacement directly from your order details page.'
  },
  {
    q: 'Can I cancel an order after placing it?',
    a: 'Yes, orders can be cancelled anytime before they are out for delivery. Simply open your order in "My Orders" and click "Cancel This Order". The refund is automatically initiated to your original payment method.'
  },
  {
    q: 'How do I use coupons & discount voucher codes?',
    a: 'Visit the "Coupons & Rewards" hub to browse all currently active vouchers. Click "Apply Now" or copy the coupon code and paste it on the checkout screen to enjoy instant discounts.'
  },
  {
    q: 'When will my refund reflect in my account?',
    a: 'UPI refunds are credited instantly within 2 to 4 hours. Credit/Debit card refunds typically reflect within 2 to 3 banking business days.'
  }
];

export default function HelpCentrePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  // Live Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! 👋 I am your PulseBot 24x7 Assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendPrompt = (promptText) => {
    const userMsg = { sender: 'user', text: promptText };
    let botReply = '';

    if (promptText.toLowerCase().includes('track') || promptText.toLowerCase().includes('order')) {
      botReply = 'You can review real-time delivery status and tracking updates for all your shipments on the "My Orders" page anytime!';
    } else if (promptText.toLowerCase().includes('cancel')) {
      botReply = 'To cancel an order, navigate to "My Orders" -> Select Order -> Click "Cancel This Order". Any prepaid amount is reversed instantly to your bank account.';
    } else if (promptText.toLowerCase().includes('refund')) {
      botReply = 'Refunds for cancelled or returned orders are processed automatically within 2-4 hours for UPI and 2-3 business days for Cards.';
    } else if (promptText.toLowerCase().includes('agent') || promptText.toLowerCase().includes('call')) {
      botReply = 'Our customer care executives are on standby 24x7! You can reach our toll-free support line at 1800-208-9898 or write to care@pulsekart.in.';
    } else {
      botReply = `Thanks for reaching out! Regarding "${promptText}", our support team is available round the clock. You can track orders, request returns, or call our toll-free desk anytime.`;
    }

    setChatMessages(prev => [...prev, userMsg, { sender: 'bot', text: botReply }]);
  };

  const handleCustomSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleSendPrompt(chatInput.trim());
    setChatInput('');
  };

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
         f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Help Centre</span>
      </div>

      {/* Hero Banner */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>PulseKart 24x7 Help Centre</h1>
        <p className={styles.heroSub}>
          We are here to help with your orders, deliveries, returns, and payments.
        </p>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search queries, issues, or order questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Issue Topic Cards */}
      <div className={styles.categoriesGrid}>
        <Link href="/orders" className={styles.topicCard}>
          <div className={styles.topicIcon}>📦</div>
          <div>
            <div className={styles.topicTitle}>My Orders & Tracking</div>
            <div className={styles.topicDesc}>Track, cancel, or modify items</div>
          </div>
        </Link>

        <div
          className={styles.topicCard}
          onClick={() => handleSendPrompt('How do I request a return or replacement?')}
        >
          <div className={styles.topicIcon}>🔄</div>
          <div>
            <div className={styles.topicTitle}>Returns & Replacements</div>
            <div className={styles.topicDesc}>7-Day easy return policy</div>
          </div>
        </div>

        <Link href="/coupons" className={styles.topicCard}>
          <div className={styles.topicIcon}>🏷️</div>
          <div>
            <div className={styles.topicTitle}>Coupons & SuperCoins</div>
            <div className={styles.topicDesc}>Check active offers & balance</div>
          </div>
        </Link>

        <div
          className={styles.topicCard}
          onClick={() => handleSendPrompt('Check my payment and refund status')}
        >
          <div className={styles.topicIcon}>💳</div>
          <div>
            <div className={styles.topicTitle}>Payments & Invoices</div>
            <div className={styles.topicDesc}>UPI, Card refunds & receipts</div>
          </div>
        </div>
      </div>

      {/* Interactive 24x7 Support Bot Assistant */}
      <div className={styles.chatCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
            <span>🤖</span>
            <span>PulseBot Live Support Assistant</span>
            <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ● 24x7 Online
            </span>
          </div>
        </div>

        {/* Message Log */}
        <div className={styles.chatMessages}>
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={msg.sender === 'user' ? styles.msgUser : styles.msgBot}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className={styles.quickPrompts}>
          <button
            type="button"
            className={styles.promptChip}
            onClick={() => handleSendPrompt('Track my active order')}
          >
            📦 Track Order
          </button>
          <button
            type="button"
            className={styles.promptChip}
            onClick={() => handleSendPrompt('When will I get my refund?')}
          >
            💰 Refund Status
          </button>
          <button
            type="button"
            className={styles.promptChip}
            onClick={() => handleSendPrompt('How to cancel an order?')}
          >
            ✕ Cancel Order
          </button>
          <button
            type="button"
            className={styles.promptChip}
            onClick={() => handleSendPrompt('Talk to customer care executive')}
          >
            🎧 Talk to Agent
          </button>
        </div>

        {/* Input Row */}
        <form onSubmit={handleCustomSend} className={styles.chatInputRow}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder="Type your question or issue here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className={styles.sendBtn}>
            Send
          </button>
        </form>
      </div>

      {/* Frequently Asked Questions */}
      <div className={styles.sectionHeader}>
        <span>❓</span>
        <span>Frequently Asked Questions</span>
      </div>

      <div className={styles.faqList}>
        {filteredFaqs.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <div key={i} className={styles.faqItem}>
              <div
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(isOpen ? null : i)}
              >
                <span>{faq.q}</span>
                <span style={{ color: '#2874f0', fontSize: '18px' }}>
                  {isOpen ? '−' : '+'}
                </span>
              </div>
              {isOpen && <div className={styles.faqAnswer}>{faq.a}</div>}
            </div>
          );
        })}
      </div>

      {/* Contact Channels Grid */}
      <div className={styles.contactGrid}>
        <div className={styles.contactCard}>
          <div className={styles.contactIcon}>📞</div>
          <div className={styles.contactInfo}>
            <h4>Call Toll-Free 24x7</h4>
            <p>1800-208-9898 (Toll Free, All India)</p>
          </div>
        </div>

        <div className={styles.contactCard}>
          <div className={styles.contactIcon} style={{ background: '#eff6ff', color: '#2874f0' }}>
            ✉️
          </div>
          <div className={styles.contactInfo}>
            <h4>Email PulseKart Care</h4>
            <p>care@pulsekart.in (Avg. response time: 2 hrs)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

