import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ShieldAlert 
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const SupportView: React.FC = () => {
  const { settings } = useFarm();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');

  const faqs = [
    {
      q: 'How does digital egg harvesting work?',
      a: 'When you acquire a digital hen plan (such as Hen Plan 01), your flock begins an active laying cycle in your roosts. Each day, eggs are ready for harvest in the pasture. Once collected into your inventory, you can redeem them for confirmed PKR balance at the current exchange rate.'
    },
    {
      q: 'How do I deposit funds via Easypaisa or JazzCash?',
      a: 'Visit the Deposit page, copy the official mobile account number and account title, send the exact PKR amount using your mobile app, copy the Transaction ID (TID), and submit the form. Our audit team validates the transaction and credits your wallet.'
    },
    {
      q: 'What are the withdrawal processing times and fees?',
      a: 'Withdrawal requests are audited and processed during business hours. A standard 5% platform fee applies to cover gateway disbursement processing costs. Payouts are sent directly to your specified Easypaisa or JazzCash mobile account.'
    },
    {
      q: 'Are profits or returns guaranteed?',
      a: 'No. EGGS NAVA PRO is purely an interactive digital poultry farm simulation and reward entertainment platform. Digital hens and eggs are gamified virtual reward mechanics. We do not provide financial investment advisory or guaranteed capital returns.'
    },
    {
      q: 'How do referral commissions work?',
      a: 'When other users register through your unique referral link and acquire digital hen coops, you receive an automated multi-tier commission (5% on Tier 1 direct invites) credited straight to your confirmed ledger balance.'
    }
  ];

  const handleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setTicketSent(true);
    setTicketMessage('');
    setTimeout(() => setTicketSent(false), 4000);
  };

  const whatsappClean = (settings.whatsappNumber || '+923001234567').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Farmer Helpline</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Help Center & Official Support
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Get assistance with deposits, payouts, hen flock cycles, or account questions from our dedicated support representatives.
        </p>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp Card */}
        <a
          href={`https://wa.me/${whatsappClean}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-3xl bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-500/30 hover:border-emerald-400 transition shadow-xl group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
            Direct WhatsApp Helpline
          </span>
          <h4 className="text-lg font-black text-white font-['Outfit'] mt-0.5">
            {settings.whatsappNumber || '+92 300 1234567'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Instant chat assistance for deposits, payout verifications & inquiries.
          </p>
        </a>

        {/* Email Support Card */}
        <a
          href={`mailto:${settings.supportEmail || 'support@eggsnavapro.com'}`}
          className="p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition">
            <Mail className="w-6 h-6" />
          </div>
          <span className="text-xs text-teal-400 font-bold uppercase tracking-wider block">
            Official Email Support
          </span>
          <h4 className="text-lg font-black text-white font-['Outfit'] mt-0.5">
            {settings.supportEmail || 'support@eggsnavapro.com'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Send formal inquiries, payment screenshots, and technical tickets.
          </p>
        </a>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit']">
          Frequently Asked Questions
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Quick Message Form */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit']">
          Send a Support Message
        </h3>

        <form onSubmit={handleTicket} className="space-y-3">
          <textarea
            required
            rows={3}
            value={ticketMessage}
            onChange={(e) => setTicketMessage(e.target.value)}
            placeholder="Type your question or issue description here..."
            className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-emerald-400 transition"
          />

          {ticketSent && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your message was sent to our support desk. We will respond promptly!</span>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </button>
        </form>
      </div>

      <DisclaimerBanner variant="full" />
    </div>
  );
};
