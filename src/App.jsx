import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  Search, Plus, Heart, MessageSquare, User, MapPin, ArrowLeftRight, Send,
  LogOut, Package, Briefcase, X, Check, RefreshCw, ArrowLeft, Upload, Bell, Star,
  Pencil, Trash2, Pause, Play, CheckCircle2, Settings, HelpCircle, AlertTriangle,
  MessageCircleHeart, ChevronDown, ChevronUp, ShieldCheck, FileText, Scale, Sparkles, WifiOff, Inbox
} from 'lucide-react';

const SUPPORT_EMAIL = 'barterboxsupport@gmail.com';
const ONE_HOUR_MS = 60 * 60 * 1000;

const BW_CITIES = [
  'All Cities', 'Gaborone', 'Francistown', 'Maun', 'Serowe', 'Molepolole',
  'Kanye', 'Mahalapye', 'Mochudi', 'Palapye', 'Lobatse', 'Selibe Phikwe', 'Kasane'
];

const CATEGORIES = [
  'All', 'Food & Drinks', 'Electronics', 'Home & Garden', 'Vehicles & Parts',
  'Fashion & Beauty', 'Professional Services', 'Manual Labor & Trades',
  'Agriculture & Livestock', 'Books & Education'
];

const PRODUCT_CONDITIONS = ['New', 'Mint', 'Good', 'Fair', 'Old'];

const CONDITION_BADGE = {
  New: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  Mint: 'bg-teal-100 text-teal-950 border-teal-300',
  Good: 'bg-sky-100 text-sky-950 border-sky-300',
  Fair: 'bg-amber-100 text-amber-950 border-amber-300',
  Old: 'bg-stone-200 text-stone-900 border-stone-300'
};

const SAFETY_CHECKLIST = [
  { id: 'public_spot', text: 'Meet in a busy, well-lit public place during daylight hours (e.g. shopping mall or near a police station).' },
  { id: 'inspect_item', text: 'Inspect goods thoroughly (test electronics, check condition or expiry dates) before handing over your item.' },
  { id: 'backup_plan', text: 'Bring a friend or share your meetup spot and time with someone you trust.' },
  { id: 'clear_terms', text: 'Confirm all swap details and items in Trade Chat before meeting.' }
];

const FAQ_ITEMS = [
  {
    q: 'How does bartering work on BarterBox?',
    a: 'Browse listings, send a barter offer using one of your active items or a custom good/service, negotiate in Trade Chat, and confirm once the exchange is complete.'
  },
  {
    q: 'Does BarterBox charge listing or trading fees?',
    a: 'No. BarterBox is a free peer-to-peer venue where members trade goods and services directly with each other.'
  },
  {
    q: 'What items are not allowed on BarterBox?',
    a: 'Alcohol, tobacco, illegal or stolen goods, weapons, restricted wildlife products, and unsafe or expired items are strictly prohibited.'
  },
  {
    q: 'How do I stay safe when meeting another trader?',
    a: 'Always meet in public spaces during the day, inspect items before swapping, and read the safety tips that appear when an offer is accepted.'
  }
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80';
const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'good',
  condition: 'Mint',
  category: 'Food & Drinks',
  city: 'Gaborone',
  looking_for: '',
  image_url: ''
};

const STARTER_LISTINGS = [
  {
    id: 'starter-1',
    title: 'Homemade Seswaa (2kg Tub)',
    description: 'Slow-cooked beef seswaa prepared fresh in Gaborone, sealed for easy sharing.',
    type: 'good',
    condition: 'New',
    category: 'Food & Drinks',
    city: 'Gaborone',
    looking_for: 'Fresh farm eggs, charcoal, or household goods',
    image_url: FALLBACK_IMG,
    owner_id: 'starter-owner-1',
    profiles: { full_name: 'Thabo Kgosi', username: 'thabo_bw', city: 'Gaborone', rating: 4.9, rating_count: 12 }
  },
  {
    id: 'starter-2',
    title: 'Phone & Laptop Diagnostics',
    description: 'Battery check, storage cleanup, and setup help for Android phones and laptops.',
    type: 'service',
    condition: 'Mint',
    category: 'Electronics',
    city: 'Gaborone',
    looking_for: 'Power bank, chargers, or skill swap',
    image_url: FALLBACK_IMG,
    owner_id: 'starter-owner-2',
    profiles: { full_name: 'Neo Ditsele', username: 'neo_tech', city: 'Gaborone', rating: 4.8, rating_count: 8 }
  },
  {
    id: 'starter-3',
    title: 'Potted Herbs & Garden Starters',
    description: 'Healthy mint, basil, and aloe starters ready for home gardens in Gaborone.',
    type: 'good',
    condition: 'Good',
    category: 'Home & Garden',
    city: 'Gaborone',
    looking_for: 'Plant pots, garden soil, or books',
    image_url: FALLBACK_IMG,
    owner_id: 'starter-owner-3',
    profiles: { full_name: 'Mpho Tau', username: 'mpho_gardens', city: 'Gaborone', rating: 5.0, rating_count: 15 }
  }
];

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-950 border border-amber-300',
  countered: 'bg-orange-100 text-orange-950 border border-orange-300',
  accepted: 'bg-sky-100 text-sky-950 border border-sky-300',
  completed: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
  rejected: 'bg-rose-100 text-rose-950 border border-rose-300',
  withdrawn: 'bg-slate-200 text-slate-800 border border-slate-300',
  active: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
  paused: 'bg-amber-100 text-amber-950 border border-amber-300',
  traded: 'bg-indigo-100 text-indigo-950 border border-indigo-300'
};

const TRADE_FILTERS = {
  open: { label: 'Open', statuses: ['pending', 'countered', 'accepted'] },
  done: { label: 'Completed', statuses: ['completed'] },
  closed: { label: 'Closed', statuses: ['rejected', 'withdrawn'] }
};

const INPUT = 'w-full mt-1.5 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base text-slate-900 font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1e7be6]/30 focus:border-[#1e7be6] transition';
const LABEL = 'text-sm font-bold text-slate-800 block';
const PRIMARY = 'bg-gradient-to-b from-[#4a9bf2] to-[#1e7be6] hover:from-[#3d90ee] hover:to-[#1a6fd0] text-white font-bold rounded-xl text-sm sm:text-base shadow-sm hover:shadow active:scale-[0.99] transition-all';
const SECONDARY_3D = 'bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl text-sm border border-slate-300 shadow-xs active:scale-[0.99] transition-all';
const BACK_BTN = 'text-sm font-bold text-[#1e7be6] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all';
const CARD = 'bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow';
const SM = 'text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-[0.99] transition-all';

const ago = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const canEditListing = (item, nowMs = Date.now()) => {
  if (!item?.created_at) return true;
  const createdMs = new Date(item.created_at).getTime();
  if (Number.isNaN(createdMs)) return true;
  return nowMs - createdMs <= ONE_HOUR_MS;
};

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

let sharedAudioCtx = null;

const playMessageAlertSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    sharedAudioCtx = sharedAudioCtx || new AudioCtx();
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(740, now);
    osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.14);
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.24);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.3);
  } catch {
    // Audio playback can be blocked before first user gesture
  }
};

function SupportEmailLink({ email = SUPPORT_EMAIL, subject = '' }) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return (
    <a
      href={href}
      className="text-[#1e7be6] font-extrabold underline decoration-2 hover:text-[#1559ab] break-all"
    >
      {email}
    </a>
  );
}

function Modal({ onClose, children, className = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px] z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white border border-slate-200 rounded-2xl w-full shadow-xl ${className}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`} className="active:scale-95 transition">
          <Star className={`w-7 h-7 ${n <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function TermsOfServiceModal({ onClose, onAccept }) {
  return (
    <Modal onClose={onClose} className="max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-[#1e7be6]" />
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-slate-950">BarterBox Terms of Service</h2>
            <p className="text-xs font-semibold text-slate-600">
              Effective date: 1 November 2026 • Gaborone, Botswana
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-800 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">1. About these terms</h3>
          <p>
            BarterBox ("BarterBox", "we", "us") is an online marketplace operated from Gaborone, Botswana. It lets people and businesses list goods and services and propose to exchange them with each other, usually without money changing hands.
          </p>
          <p>
            By accessing or using the BarterBox web application, Progressive Web App (PWA) or related services (together, the Platform), including by creating an account or browsing, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use BarterBox.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">2. What BarterBox is, and what it is not</h3>
          <p>
            BarterBox is a venue that connects users. We are not a party to any exchange between users. We do not own, inspect, store, deliver, guarantee or take responsibility for any item or service listed, and we do not check that listings, descriptions, photos or users are accurate, lawful or trustworthy. BarterBox is not an agent, broker, insurer or escrow service for any user.
          </p>
          <p>
            Every exchange is an agreement only between the users involved. You are responsible for deciding whether to trade, with whom, and on what terms.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">3. Who can use BarterBox</h3>
          <p>
            You must be at least 18 years old (the age of majority under the laws of Botswana) and able to enter a legally binding agreement. If you use BarterBox for a business, you confirm that you are authorised to bind that business to these Terms.
          </p>
          <p>
            You may not use BarterBox if we have previously suspended or removed your account, unless we have agreed in writing that you may return.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">4. Your account</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Give accurate and current information, including your name, city and contact details.</li>
            <li>Keep your password confidential. You are responsible for all activity on your account.</li>
            <li>Tell us promptly at <SupportEmailLink subject="Account Security - BarterBox" /> if you think someone else has accessed your account.</li>
            <li>One person or business may hold only one account unless we agree otherwise.</li>
            <li>Your profile name, city, profile picture, ratings and reviews are visible to other users.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">5. Listings</h3>
          <p>When you create a listing you confirm that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>you own the item or are legally entitled to trade it, or you hold any qualifications, licences or permits required to provide the service;</li>
            <li>the title, description, condition, photos, location and what you want in exchange are accurate and not misleading;</li>
            <li>the photos are your own or you have permission to use them;</li>
            <li>the item or service is lawful to trade in Botswana and in the place where the exchange happens.</li>
          </ul>
          <p>
            You may edit, pause or delete your listings at any time. Deleting or pausing a listing does not cancel an exchange you have already agreed to. We may remove or hide any listing at our discretion, for example if it breaks these Terms or the law.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">6. Prohibited items and conduct</h3>
          <p>You must not list, offer or request:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>firearms, ammunition, explosives, hazardous materials or other weapons;</li>
            <li>illegal drugs, controlled substances, prescription medicines, alcohol or tobacco products;</li>
            <li>stolen or illegally obtained property, counterfeit or pirated goods, fraudulent services or pyramid schemes;</li>
            <li>ivory, rhino horn, protected wildlife, trophies or any wildlife product, plant or animal that cannot be traded legally;</li>
            <li>livestock or animal products unless you comply with Botswana's rules on identification, brand certificates, movement permits and health requirements;</li>
            <li>human remains or body parts, adult or sexually explicit content or services, or anything that exploits or endangers children;</li>
            <li>vehicles or regulated goods without the paperwork the law requires, or food and drink that is expired, contaminated or unsafe;</li>
            <li>anything that infringes someone else's intellectual property or privacy.</li>
          </ul>
          <p className="pt-1">You also must not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>harass, threaten, discriminate against or defraud other users;</li>
            <li>ask for payment of money, deposits or fees outside the barter itself in order to scam or mislead;</li>
            <li>post false reviews, manipulate ratings, or offer rewards for reviews;</li>
            <li>use bots, scrapers or other automated tools, or try to break, probe or overload BarterBox;</li>
            <li>use BarterBox to send spam or unrelated advertising;</li>
            <li>try to avoid our rules by creating new accounts after being suspended.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">7. Barter proposals and agreements</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>A user can send a proposal on another user's listing, offering one of their own listings or a custom offer, and can attach a message.</li>
            <li>The listing owner can accept, decline or send a counter-offer. The sender can withdraw a proposal that is still pending.</li>
            <li>A trade is agreed only when both users have accepted the same terms in BarterBox. Messages in the chat are for discussion and do not by themselves make an agreement.</li>
            <li>Once a proposal is accepted, both users are expected to complete the exchange honestly and on time. After the exchange has happened, the user who accepted the offer confirms it in the app. The trade stays open until that confirmation is made.</li>
            <li>If you can no longer go ahead, tell the other user as early as possible and use the tools in the app to update the status.</li>
            <li>BarterBox does not hold goods, valuables or money, and does not provide escrow.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">8. Meeting, delivery and safety</h3>
          <p>You are responsible for arranging how and where an exchange happens. We strongly encourage you to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>meet in a public, well-lit place, and bring someone with you where possible;</li>
            <li>inspect goods properly before agreeing to swap them;</li>
            <li>agree on the quality, quantity and timing of services before work begins;</li>
            <li>avoid sharing financial details or passwords, and keep conversations in the app until you are comfortable;</li>
            <li>report anything suspicious to us at <SupportEmailLink subject="Safety Report - BarterBox" />.</li>
          </ul>
          <p>
            By meeting other users and inspecting goods in person you accept the risks involved, and we are not responsible for what happens when users meet or for any loss, injury or damage that results.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">9. Reviews and ratings</h3>
          <p>
            After a completed trade, each user may rate and review the other. Reviews must be honest, based on your own experience, and must not contain abuse, hate speech, private information or false statements. We may remove reviews that break these rules, but we do not edit them or verify that they are correct.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">10. Fees</h3>
          <p>
            BarterBox is currently free to use. We do not charge commission or transaction fees on exchanges.
          </p>
          <p>
            We may introduce optional paid features in future, such as sponsored listings, featured advertisements, business advertising or premium visibility. If we do, we will tell you before it applies to you, and nothing will be charged without your clear agreement.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">11. Taxes and legal compliance</h3>
          <p>
            You are solely responsible for any tax, duty, licensing, municipal permits and other legal or regulatory requirements that apply to your trades under the laws of the Republic of Botswana. Exchanging goods or services can have tax consequences, particularly if you trade regularly or as a business. We do not give tax or legal advice and do not collect or pay tax on your behalf.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">12. Your content</h3>
          <p>
            You keep ownership of the text, photos and other content you post ("your content"). You give BarterBox a non-exclusive, worldwide, royalty-free licence to host, store, display, reproduce and distribute your content, in order to run, improve and promote BarterBox. This licence ends when you delete your content or your account, except for copies that other users have already received in messages, and copies kept in backups or where the law requires us to keep them.
          </p>
          <p>You confirm that you have the right to give this licence.</p>
          <p>
            BarterBox's name, logo, design and software belong to us or our licensors. You may not copy or reuse them without our written permission.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">13. Privacy and your data</h3>
          <p>
            We collect and use personal information, such as your name, email address, city, phone number, listings, messages and trade history, to run BarterBox, keep users safe and improve the service. Our Privacy Policy (available in the app) explains what we collect, why, who we share it with, how long we keep it, and your rights under the data protection laws that apply to you.
          </p>
          <p>
            Messages in BarterBox are private between the people in a conversation, but we may review them if needed to investigate a report, prevent fraud or abuse, or meet a legal obligation.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">14. Reporting problems and enforcement</h3>
          <p>You can report a listing, message, review or user to <SupportEmailLink subject="Report Issue - BarterBox" />. We may, at our discretion and with or without notice:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>remove or hide content;</li>
            <li>limit features, or suspend or close accounts;</li>
            <li>cancel pending proposals linked to a removed listing or account;</li>
            <li>share information with the police, regulators or other authorities where we believe the law requires it or that someone may be in danger.</li>
          </ul>
          <p>
            We are not obliged to mediate or resolve disputes between users. If you have a disagreement with another user, we encourage you to try to settle it directly and politely first.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">15. Availability and changes to the service</h3>
          <p>
            We work to keep BarterBox running, but we do not promise that it will always be available, secure or free from errors. We may change, pause or stop any part of the service at any time, for example for maintenance or when we add new features.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">16. Disclaimers</h3>
          <p>
            BarterBox is provided "as is" and "as available". To the fullest extent the law allows, we do not give any warranty about the quality, safety, legality, value or suitability of any item or service, the identity or reliability of any user, or that the service will be uninterrupted or error-free.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">17. Limit of our responsibility</h3>
          <p>To the fullest extent the law allows, the following applies to BarterBox and to its founders, operators and affiliates:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>we are not liable for any loss, damage, injury or dispute arising from an exchange between users, or from content posted by users;</li>
            <li>we are not liable for indirect or consequential loss, loss of profit, loss of data or loss of opportunity;</li>
            <li>if we are found liable to you despite this, our total liability is limited to BWP 500 in total.</li>
          </ul>
          <p>
            Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including for fraud or for death or personal injury caused by our negligence.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">18. Your responsibility to us</h3>
          <p>
            You agree to compensate us for losses, claims and costs (including reasonable legal fees) arising from your content, your breach of these Terms or the law, or your dealings with other users, to the extent the law allows.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">19. Closing your account</h3>
          <p>
            You can stop using BarterBox and delete your account at any time. Before you do, complete or cancel any open trades. We may suspend or close your account if you break these Terms, create risk or harm for others or for us, or if we are required to by law. Sections that by their nature should continue (for example content licence for copies already delivered, disclaimers, liability, indemnity and governing law) will continue after your account ends.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">20. Changes to these terms</h3>
          <p>
            We may update these Terms from time to time. We will post the new version in the app and update the effective date, and for significant changes we will tell you by email or in the app. If you keep using BarterBox after the changes take effect, you accept them. If you do not agree, you should stop using BarterBox and close your account.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">21. Governing law and disputes</h3>
          <p>
            These Terms are governed by the laws of the Republic of Botswana. We encourage you to contact us first at <SupportEmailLink subject="Complaint - BarterBox" /> so we can try to resolve a complaint informally. If that does not work, the courts of Botswana have exclusive jurisdiction. Nothing in this section limits any rights you have under consumer protection or data protection laws that cannot be waived.
          </p>
          <p>
            As BarterBox expands into other countries, additional or local terms may apply to users there. We will make these available before they apply.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">22. General</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>These Terms, together with our Privacy Policy, are the whole agreement between you and us about BarterBox.</li>
            <li>If a part of these Terms is found unenforceable, the rest continues to apply.</li>
            <li>If we do not enforce a right straight away, we have not given it up.</li>
            <li>You may not transfer your account or rights under these Terms without our consent. We may transfer ours as part of a sale or reorganisation of the business.</li>
            <li>We may contact you by email or in-app notifications about your account, trades and changes to the service.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">23. Contact</h3>
          <p>BarterBox, Gaborone, Botswana. Email: <SupportEmailLink subject="Contact BarterBox" /></p>
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5">
        <button type="button" onClick={onClose} className={`flex-1 ${SECONDARY_3D} py-2.5`}>
          Close
        </button>
        {onAccept && (
          <button type="button" onClick={onAccept} className={`flex-1 ${PRIMARY} py-2.5`}>
            I Agree & Close
          </button>
        )}
      </div>
    </Modal>
  );
}

function PrivacyPolicyModal({ onClose, onAccept }) {
  return (
    <Modal onClose={onClose} className="max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#1e7be6]" />
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-slate-950">BarterBox Privacy Policy</h2>
            <p className="text-xs font-semibold text-slate-600">
              Effective date: 1 November 2026 • Gaborone, Botswana
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-800 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">1. Who we are</h3>
          <p>
            BarterBox ("BarterBox", "we", "us") is an online marketplace for exchanging goods and services, operated from Gaborone, Botswana. For the personal information described in this policy, we are the "data controller", meaning we decide how and why it is used.
          </p>
          <p><strong>Contact for privacy questions and requests:</strong> <SupportEmailLink subject="Privacy Request - BarterBox" /></p>
          <p>
            This policy explains what we collect, why, who sees it, how long we keep it, and the choices you have. It should be read together with our Terms of Service. We aim to follow Botswana's Data Protection Act, which replaced the 2018 Act, and the guidance of the Information and Data Protection Commission.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">2. Information we collect</h3>
          <p className="font-bold text-slate-900">Information you give us</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account details:</strong> your full name, email address and password, and the city or town you choose.</li>
            <li><strong>Profile details:</strong> a profile picture, phone number and short bio, if you add them.</li>
            <li><strong>Listings:</strong> titles, descriptions, categories, location, photos, and what you want in exchange.</li>
            <li><strong>Trades:</strong> proposals, counter-offers, your messages in Trade Chat, confirmations of completed trades, and the reviews and ratings you give.</li>
            <li><strong>Activity you choose to save:</strong> items on your wishlist.</li>
            <li><strong>Support messages:</strong> anything you send us when you report a problem or ask for help.</li>
          </ul>
          <p className="font-bold text-slate-900 pt-1">Information collected automatically</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Device and usage data:</strong> browser type, device type, operating system, language, pages and features you use, and the time and date of your visits.</li>
            <li><strong>Approximate technical identifiers:</strong> your IP address and log entries, used for security and fault-finding.</li>
            <li><strong>Browser storage:</strong> small pieces of data stored on your device, such as a sign-in session, so that you stay logged in and the app works properly.</li>
          </ul>
          <p className="font-bold text-slate-900 pt-1">Information from others</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Other users may mention you in messages or reviews, and we may receive reports about you or your listings.</li>
          </ul>
          <p className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl font-medium">
            Please do not post sensitive information (such as ID numbers, bank details or health information) in listings, photos or messages. Photos you upload may contain hidden location data, so consider removing it before uploading.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">3. How we use your information and why</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-950 font-bold">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">What we do</th>
                  <th className="p-2.5 border-b border-slate-200">Why we are allowed to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5">Create and manage your account, show your listings and profile, and let you send proposals, chat, save items and leave reviews</td>
                  <td className="p-2.5">To provide the service you asked for</td>
                </tr>
                <tr>
                  <td className="p-2.5">Send notifications about messages, proposals and trade status, and service emails such as password resets</td>
                  <td className="p-2.5">To provide the service, and our legitimate interest in keeping you informed</td>
                </tr>
                <tr>
                  <td className="p-2.5">Keep BarterBox safe: detect scams, fake reviews, prohibited items and abuse, and enforce our Terms</td>
                  <td className="p-2.5">Our legitimate interest in running a safe marketplace, and legal obligations</td>
                </tr>
                <tr>
                  <td className="p-2.5">Fix faults, measure performance and improve features</td>
                  <td className="p-2.5">Our legitimate interest in improving the service</td>
                </tr>
                <tr>
                  <td className="p-2.5">Comply with the law, respond to lawful requests from authorities, and protect our rights</td>
                  <td className="p-2.5">Legal obligation and legitimate interest</td>
                </tr>
                <tr>
                  <td className="p-2.5">Send you news or marketing about BarterBox, if we ever do</td>
                  <td className="p-2.5">Your consent, which you can withdraw at any time</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-bold text-slate-900">We do not sell your personal information. We do not use your messages to show advertising.</p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">4. Who can see your information</h3>
          <p className="font-bold text-slate-900">Other users</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your full name, city, profile picture, ratings, reviews you have received and your active listings are visible to other users and may be visible to visitors who are not signed in.</li>
            <li>Your messages are visible only to you and the other person in that conversation, plus us if needed to investigate a report, as described in the Terms.</li>
            <li>We do not show your email address or phone number to other users unless you choose to share them in a message.</li>
          </ul>
          <p className="font-bold text-slate-900 pt-1">Service providers</p>
          <p>We use trusted companies to help run BarterBox, and they may handle your information only on our instructions. Currently these include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong>, for our database, sign-in and photo storage;</li>
            <li><strong>Vercel</strong>, for hosting the app;</li>
            <li><strong>Google (Gmail)</strong>, for receiving and replying to support emails.</li>
          </ul>
          <p className="font-bold text-slate-900 pt-1">Authorities and legal reasons</p>
          <p>We may disclose information to the police, courts or regulators where the law requires it, or where we believe it is necessary to protect someone's safety, investigate fraud or enforce our Terms.</p>
          <p className="font-bold text-slate-900 pt-1">Business changes</p>
          <p>If BarterBox is sold, merged or reorganised, personal information may be transferred to the new owner, who must continue to protect it under this policy.</p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">5. Sending information outside Botswana</h3>
          <p>
            Our providers may store or process your information on servers in other countries, such as Ireland (Europe). Where we do this, we take reasonable steps, such as using providers with appropriate security commitments and contracts, to make sure your information stays protected in line with Botswana's data protection law.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">6. How long we keep it</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account and profile:</strong> until you delete your account.</li>
            <li><strong>Listings:</strong> until you delete them or your account. Deleted listings are hidden from other users straight away and removed from our systems within 30 days, except where we must keep them (for example, as part of a trade record).</li>
            <li><strong>Messages and trade records:</strong> while needed for the trade and for 12 months afterwards, so we can deal with disputes, reports and fraud, unless the law requires longer.</li>
            <li><strong>Reviews:</strong> kept so the community can see an honest record. When you delete your account we remove your name from your reviews or anonymise them.</li>
            <li><strong>Logs and security records:</strong> up to 12 months.</li>
            <li><strong>Backups:</strong> deleted information is removed from backups on their normal cycle, usually within 90 days.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">7. Keeping your information secure</h3>
          <p>
            We use reasonable technical and organisational measures, including encrypted connections, access controls that limit what each user can see in the database, limited staff access and secure providers. No system is completely secure, so we cannot promise absolute security. Please choose a strong, unique password and keep it private.
          </p>
          <p>
            If a breach is likely to put your rights at risk, we will notify you and the Information and Data Protection Commission as the law requires.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">8. Your rights</h3>
          <p>Subject to the law, you can ask us to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>tell you what personal information we hold about you and give you a copy;</li>
            <li>correct information that is wrong or out of date (you can also edit most of it in your profile);</li>
            <li>delete your information, or close your account;</li>
            <li>stop or restrict certain uses, including objecting to processing based on our legitimate interests;</li>
            <li>withdraw your consent where we rely on it, without affecting what we did before;</li>
            <li>explain how automated or manual decisions about your account were made, if one has affected you seriously.</li>
          </ul>
          <p>
            To use any of these rights, email <SupportEmailLink subject="Data Rights Request - BarterBox" />. We may ask you to confirm who you are first, and we will reply within the time the law allows. If you are unhappy with our answer, you may complain to the Information and Data Protection Commission in Botswana. We would appreciate the chance to put things right first.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">9. Children</h3>
          <p>
            BarterBox is for people aged 18 and over. We do not knowingly collect information from anyone under 18. If you think a child has given us personal information, please tell us at <SupportEmailLink subject="Underage Account Report - BarterBox" /> and we will delete it.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">10. Cookies and similar technologies</h3>
          <p>
            BarterBox uses browser storage and similar technologies that are necessary to keep you signed in and make the app work, including when you install it on your phone.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">11. Links and third parties</h3>
          <p>
            BarterBox may contain links to other websites or services. We are not responsible for their privacy practices, so please read their policies.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">12. Future features</h3>
          <p>
            We plan to keep BarterBox free and may later offer sponsored listings or business advertising. If this means using your information in new ways, we will update this policy, tell you in advance and, where the law requires, ask for your consent.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">13. Changes to this policy</h3>
          <p>
            We may update this policy from time to time. We will post the new version in the app with a new effective date, and tell you about significant changes by email or in the app. Using BarterBox after changes take effect means you accept them.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-950">14. Contact us</h3>
          <p>BarterBox, Gaborone, Botswana. Email: <SupportEmailLink subject="Contact BarterBox" /></p>
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5">
        <button type="button" onClick={onClose} className={`flex-1 ${SECONDARY_3D} py-2.5`}>
          Close
        </button>
        {onAccept && (
          <button type="button" onClick={onAccept} className={`flex-1 ${PRIMARY} py-2.5`}>
            I Agree & Close
          </button>
        )}
      </div>
    </Modal>
  );
}

export default function App() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Gaborone');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');
  const [emailJustConfirmed, setEmailJustConfirmed] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState('');

  const [activeTab, setActiveTab] = useState('explore');
  const [previousTab, setPreviousTab] = useState('explore');
  const [viewedMember, setViewedMember] = useState(null);
  const [viewedMemberListings, setViewedMemberListings] = useState([]);
  const [viewedMemberReviews, setViewedMemberReviews] = useState([]);
  const [loadingMemberProfile, setLoadingMemberProfile] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('open');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsSection, setSettingsSection] = useState('edit');
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editCity, setEditCity] = useState('Gaborone');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [chatPreviews, setChatPreviews] = useState({});
  const [lastReadMap, setLastReadMap] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('bb_chat_last_read') || '{}');
    } catch {
      return {};
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selectedListing, setSelectedListing] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [showListingModal, setShowListingModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [listingError, setListingError] = useState('');

  const [offeredListingId, setOfferedListingId] = useState('');
  const [customOffer, setCustomOffer] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [counterFor, setCounterFor] = useState(null);
  const [counterText, setCounterText] = useState('');
  const [reviewFor, setReviewFor] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const uid = session?.user?.id;
  const proposalIdsRef = useRef([]);
  const activeProposalIdRef = useRef(null);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeProposalIdRef.current = activeProposal?.id || null;
  }, [activeProposal?.id]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('bb_chat_last_read', JSON.stringify(lastReadMap));
    } catch {
      // Ignore storage quota errors
    }
  }, [lastReadMap]);

  const markProposalChatRead = (proposalId, timestampIso = new Date().toISOString()) => {
    if (!proposalId) return;
    setLastReadMap((prev) => {
      const currentTs = prev[proposalId] ? new Date(prev[proposalId]).getTime() : 0;
      const nextTs = new Date(timestampIso).getTime() || Date.now();
      if (nextTs <= currentTs) return prev;
      return { ...prev, [proposalId]: new Date(nextTs).toISOString() };
    });
  };

  const markAllChatsRead = (proposalList = proposals) => {
    if (!Array.isArray(proposalList) || proposalList.length === 0) return;
    const nowIso = new Date().toISOString();
    setLastReadMap((prev) => {
      const updated = { ...prev };
      for (const p of proposalList) {
        const latestMsgTs = chatPreviews[p.id]?.created_at;
        updated[p.id] = latestMsgTs || nowIso;
      }
      return updated;
    });
  };

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const [reviewItemRating, setReviewItemRating] = useState(5);
  const [safetyPopupFor, setSafetyPopupFor] = useState(null);
  const [safetySeen, setSafetySeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bb_safety_seen') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    if (!uid || safetyPopupFor) return;
    const next = proposals.find((p) => p.status === 'accepted' && !safetySeen[p.id]);
    if (next) setSafetyPopupFor(next);
  }, [proposals, uid, safetySeen, safetyPopupFor]);

  const dismissSafetyPopup = () => {
    if (!safetyPopupFor) return;
    const updated = { ...safetySeen, [safetyPopupFor.id]: true };
    setSafetySeen(updated);
    try { localStorage.setItem('bb_safety_seen', JSON.stringify(updated)); } catch { /* ignore */ }
    setSafetyPopupFor(null);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const syncInstalledState = () => {
      const standalone = mq.matches || window.navigator.standalone === true;
      setIsInstalled(standalone);
      if (standalone) {
        setInstallPrompt(null);
        setShowInstallModal(false);
      }
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallModal(false);
      setIsInstalled(true);
    };

    syncInstalledState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    mq.addEventListener('change', syncInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mq.removeEventListener('change', syncInstalledState);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  useEffect(() => {
    const unlock = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      sharedAudioCtx = sharedAudioCtx || new AudioCtx();
      if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    const raw = `${window.location.hash || ''}${window.location.search || ''}`;
    if (raw.includes('type=signup')) setEmailJustConfirmed(true);
    if (raw.includes('error_code=otp_expired')) {
      setActiveTab('profile');
      setAuthMessage('That confirmation link has expired. Sign in below and we will send you a new one.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkRecoveryUrl = () => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return hash.includes('type=recovery') || search.includes('type=recovery');
  };

  useEffect(() => {
    if (!supabase) return;

    if (checkRecoveryUrl()) {
      setIsPasswordRecovery(true);
      setActiveTab('profile');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && checkRecoveryUrl()) {
        setIsPasswordRecovery(true);
        setActiveTab('profile');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY' || (s && checkRecoveryUrl())) {
        setIsPasswordRecovery(true);
        setActiveTab('profile');
        setRecoveryFeedback('');
      }
      if (!s) {
        setProfile(null);
        setFavorites([]);
        setProposals([]);
        setChatPreviews({});
        setMyListings([]);
        setNotifications([]);
        setMyReviews([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    fetchListings(false);
  }, []);

  useEffect(() => {
    if (!supabase || !uid) return;
    fetchProfile();
    fetchFavorites();
    fetchProposals();
    fetchMyListings();
    fetchNotifications();
    fetchMyReviews();
  }, [uid]);

  useEffect(() => {
    if (!supabase || !uid) return;
    const ch = supabase.channel('bb-notes-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          fetchNotifications();
          fetchProposals();
          if (payload?.new?.type !== 'message') playMessageAlertSound();
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  useEffect(() => {
    if (!supabase || !uid) return;
    const msgCh = supabase.channel('bb-incoming-msgs-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload?.new;
        if (!row) return;
        const belongsToUserTrade = proposalIdsRef.current.includes(row.proposal_id);
        if (!belongsToUserTrade) {
          fetchProposals();
          return;
        }

        setChatPreviews((prev) => ({
          ...prev,
          [row.proposal_id]: row
        }));

        if (row.sender_id !== uid) {
          if (activeProposalIdRef.current === row.proposal_id) {
            loadMessages(row.proposal_id);
            markProposalChatRead(row.proposal_id, row.created_at || new Date().toISOString());
          } else {
            playMessageAlertSound();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(msgCh); };
  }, [uid]);

  const fetchChatPreviews = async (proposalList) => {
    if (!supabase || !Array.isArray(proposalList) || proposalList.length === 0) {
      proposalIdsRef.current = [];
      setChatPreviews({});
      return;
    }
    const ids = proposalList.map((p) => p.id).filter(Boolean);
    proposalIdsRef.current = ids;
    if (ids.length === 0) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id, proposal_id, sender_id, content, created_at')
      .in('proposal_id', ids)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const latestByProposal = {};
    for (const msg of data) {
      if (!latestByProposal[msg.proposal_id]) {
        latestByProposal[msg.proposal_id] = msg;
      }
    }
    setChatPreviews(latestByProposal);
  };

  const openMemberProfile = async (ownerId, fallbackInfo = {}) => {
    setSelectedListing(null);

    if (!ownerId) {
      setActiveTab('explore');
      return;
    }

    if (uid && ownerId === uid) {
      setActiveTab('profile');
      return;
    }

    if (activeTab !== 'memberProfile') {
      setPreviousTab(activeTab);
    }

    const baseMember = {
      id: ownerId,
      full_name: fallbackInfo.full_name || 'BarterBox Member',
      city: fallbackInfo.city || 'Botswana',
      avatar_url: fallbackInfo.avatar_url || null,
      username: fallbackInfo.username || null,
      rating_avg: Number(fallbackInfo.rating_avg ?? fallbackInfo.rating ?? 0) || 0,
      rating_count: Number(fallbackInfo.rating_count ?? 0) || 0
    };

    setViewedMember(baseMember);
    setActiveTab('memberProfile');
    setLoadingMemberProfile(true);

    const pool = listings.length > 0 ? listings : STARTER_LISTINGS;
    const localMatchingListings = pool.filter((item) => item.owner_id === ownerId);
    setViewedMemberListings(localMatchingListings);
    setViewedMemberReviews([]);

    if (!supabase || String(ownerId).startsWith('starter-')) {
      setLoadingMemberProfile(false);
      return;
    }

    const [profileRes, memberListingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', ownerId).maybeSingle(),
      supabase
        .from('listings')
        .select('*, profiles(full_name, city, avatar_url, rating)')
        .eq('owner_id', ownerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(15)
    ]);

    if (profileRes?.data) {
      setViewedMember((prev) => ({
        ...prev,
        ...profileRes.data,
        rating_avg: Number(profileRes.data.rating_avg ?? profileRes.data.rating ?? prev?.rating_avg ?? 0) || 0,
        rating_count: Number(profileRes.data.rating_count ?? prev?.rating_count ?? 0) || 0
      }));
    }

    if (!memberListingsRes?.error && memberListingsRes?.data) {
      setViewedMemberListings(memberListingsRes.data);
    }

    if (!reviewsRes?.error && reviewsRes?.data && reviewsRes.data.length > 0) {
      const reviewerIds = [...new Set(reviewsRes.data.map((r) => r.reviewer_id).filter(Boolean))];
      let reviewerMap = {};
      if (reviewerIds.length > 0) {
        const { data: reviewersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', reviewerIds);
        if (reviewersData) {
          reviewerMap = Object.fromEntries(reviewersData.map((rv) => [rv.id, rv.full_name]));
        }
      }
      setViewedMemberReviews(
        reviewsRes.data.map((rev) => ({
          ...rev,
          reviewer: { full_name: reviewerMap[rev.reviewer_id] || 'Member' }
        }))
      );
    }

    setLoadingMemberProfile(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) {
      setProfile(data);
      setEditFullName(data.full_name || '');
      setEditUsername(data.username || '');
      setEditCity(data.city || 'Gaborone');
      setEditAvatarUrl(data.avatar_url || '');
    }
  };

  const openSettings = (section = 'edit') => {
    setEditFullName(profile?.full_name || '');
    setEditUsername(profile?.username || '');
    setEditCity(profile?.city || 'Gaborone');
    setEditAvatarUrl(profile?.avatar_url || '');
    setSettingsSection(section);
    setSettingsNotice('');
    setSupportSubject('');
    setSupportMessage('');
    setDeleteConfirmText('');
    setShowSettingsModal(true);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    if (file.size > 5 * 1024 * 1024) {
      setSettingsNotice('Please choose a profile photo under 5MB.');
      return;
    }
    setUploadingAvatar(true);
    setSettingsNotice('');
    const ext = file.name.split('.').pop();
    const path = `avatars/${uid}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file, { upsert: true });
    if (error) {
      setSettingsNotice('Avatar upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (data?.publicUrl) {
        setEditAvatarUrl(data.publicUrl);
        setSettingsNotice('Profile photo uploaded! Click "Save Profile" to apply.');
      }
    }
    setUploadingAvatar(false);
  };

  const handleSaveProfileSettings = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setSavingProfile(true);
    setSettingsNotice('');

    const cleanUsername = editUsername.trim().replace(/^@+/, '').toLowerCase();
    const fullPayload = {
      full_name: editFullName.trim(),
      username: cleanUsername || null,
      city: editCity,
      avatar_url: editAvatarUrl.trim() || null
    };

    let { error } = await supabase.from('profiles').update(fullPayload).eq('id', uid);
    if (error && (error.message.includes('username') || error.message.includes('avatar_url'))) {
      ({ error } = await supabase.from('profiles').update({
        full_name: editFullName.trim(),
        city: editCity
      }).eq('id', uid));
    }

    setSavingProfile(false);
    if (error) {
      setSettingsNotice('Could not update profile: ' + error.message);
    } else {
      await fetchProfile();
      setSettingsNotice('Profile updated successfully.');
    }
  };

  const handleSupportSubmit = async (e, type) => {
    e.preventDefault();
    if (!uid || !supportMessage.trim()) return;
    setSubmittingSupport(true);
    setSettingsNotice('');

    const { error } = await supabase.from('support_submissions').insert({
      user_id: uid,
      submission_type: type,
      subject: supportSubject.trim() || (type === 'problem' ? 'Problem Report' : 'App Feedback'),
      message: supportMessage.trim()
    });

    setSubmittingSupport(false);
    if (error) {
      setSettingsNotice(
        type === 'problem'
          ? `Problem report noted. You can also email ${SUPPORT_EMAIL} directly.`
          : 'Feedback noted! Thank you for helping improve BarterBox.'
      );
    } else {
      setSettingsNotice(
        type === 'problem'
          ? 'Your problem report has been submitted. Thank you for letting us know.'
          : 'Thank you! Your feedback has been sent.'
      );
    }
    setSupportSubject('');
    setSupportMessage('');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!uid || deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setDeletingAccount(true);
    setSettingsNotice('');

    await supabase.from('listings').update({ status: 'deleted' }).eq('owner_id', uid);
    await supabase.from('profiles').update({
      full_name: 'Deleted Member',
      username: null,
      avatar_url: null
    }).eq('id', uid);

    await supabase.auth.signOut();
    setDeletingAccount(false);
    setShowSettingsModal(false);
    setActiveTab('explore');
  };

  const fetchListings = async (shouldShuffle = false) => {
    setLoadingData(true);
    setLoadError('');
    if (!supabase) {
      if (shouldShuffle) {
        setListings((prev) => shuffleArray(prev.length > 0 ? prev : STARTER_LISTINGS));
      }
      setLoadingData(false);
      return;
    }

    let { data, error } = await supabase.from('listings')
      .select('*, profiles(full_name, city, avatar_url, rating)')
      .eq('status', 'active').order('created_at', { ascending: false });
    if (error) {
      console.error('Listings query failed, retrying without seller details:', error);
      ({ data, error } = await supabase.from('listings').select('*')
        .eq('status', 'active').order('created_at', { ascending: false }));
    }
    if (error) {
      setLoadError(error.message);
      if (shouldShuffle) {
        setListings((prev) => shuffleArray(prev.length > 0 ? prev : STARTER_LISTINGS));
      }
    } else if (data) {
      setListings(shouldShuffle ? shuffleArray(data) : data);
    }
    setLoadingData(false);
  };

  const fetchMyListings = async () => {
    const { data } = await supabase.from('listings').select('*')
      .eq('owner_id', uid).neq('status', 'deleted').order('created_at', { ascending: false });
    if (data) setMyListings(data);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', uid);
    if (data) setFavorites(data.map((f) => f.listing_id));
  };

  const fetchProposals = async () => {
    if (!supabase || !uid) return;

    const richSelect = `
      *,
      sender:profiles!trade_proposals_sender_id_fkey(full_name, city),
      receiver:profiles!trade_proposals_receiver_id_fkey(full_name, city),
      target_listing:listings!trade_proposals_target_listing_id_fkey(id, title, image_url, type, condition),
      offered_listing:listings!trade_proposals_offered_listing_id_fkey(id, title, image_url, type, condition),
      completion:trade_completions(*),
      reviews(reviewer_id)
    `;

    const { data: richData, error } = await supabase
      .from('trade_proposals')
      .select(richSelect)
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (!error && richData) {
      setProposals(richData);
      await fetchChatPreviews(richData);
      return;
    }

    const { data: baseRows, error: baseError } = await supabase
      .from('trade_proposals')
      .select('*')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (baseError || !baseRows) {
      console.warn('Could not load trade proposals:', baseError?.message || error?.message);
      return;
    }

    const profileIds = [
      ...new Set(baseRows.flatMap((p) => [p.sender_id, p.receiver_id]).filter(Boolean))
    ];
    const listingIds = [
      ...new Set(
        baseRows.flatMap((p) => [p.target_listing_id, p.offered_listing_id]).filter(Boolean)
      )
    ];

    const [profilesRes, listingsRes] = await Promise.all([
      profileIds.length > 0
        ? supabase.from('profiles').select('id, full_name, city').in('id', profileIds)
        : Promise.resolve({ data: [] }),
      listingIds.length > 0
        ? supabase.from('listings').select('*').in('id', listingIds)
        : Promise.resolve({ data: [] })
    ]);

    const profileById = Object.fromEntries((profilesRes.data || []).map((pr) => [pr.id, pr]));
    const listingById = Object.fromEntries((listingsRes.data || []).map((li) => [li.id, li]));

    const hydrated = baseRows.map((p) => ({
      ...p,
      sender: profileById[p.sender_id] || null,
      receiver: profileById[p.receiver_id] || null,
      target_listing: listingById[p.target_listing_id] || null,
      offered_listing: p.offered_listing_id ? listingById[p.offered_listing_id] || null : null,
      completion: p.completion || [],
      reviews: p.reviews || []
    }));

    setProposals(hydrated);
    await fetchChatPreviews(hydrated);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data);
  };

  const fetchMyReviews = async () => {
    if (!supabase || !uid) return;

    const { data: joinedData, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewee_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && joinedData) {
      setMyReviews(joinedData);
      return;
    }

    const { data: plainData, error: plainError } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (plainError || !plainData) {
      console.warn('Could not load reviews:', plainError?.message || error?.message);
      return;
    }

    const reviewerIds = [...new Set(plainData.map((r) => r.reviewer_id).filter(Boolean))];
    let nameMap = {};
    if (reviewerIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds);
      if (profs) {
        nameMap = Object.fromEntries(profs.map((p) => [p.id, p.full_name]));
      }
    }

    setMyReviews(
      plainData.map((r) => ({
        ...r,
        reviewer: { full_name: nameMap[r.reviewer_id] || 'Member' }
      }))
    );
  };

  const loadMessages = async (proposalId) => {
    const { data } = await supabase.from('messages').select('*, profiles(full_name)')
      .eq('proposal_id', proposalId).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      if (data.length > 0) {
        const latest = data[data.length - 1];
        setChatPreviews((prev) => ({ ...prev, [proposalId]: latest }));
        if (activeProposalIdRef.current === proposalId) {
          markProposalChatRead(proposalId, latest.created_at || new Date().toISOString());
        }
      }
    }
  };

  const refreshAll = () => { fetchListings(true); fetchMyListings(); fetchProposals(); };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthMessage('Supabase connection is not configured yet. Check your environment variables.');
      return;
    }
    if (authMode === 'signup' && (!acceptedTerms || !acceptedPrivacy)) {
      setAuthMessage('Please read and agree to both the Terms of Service and Privacy Policy before creating an account.');
      return;
    }
    setAuthLoading(true);
    setAuthMessage('');
    const cleanEmail = email.trim();
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName, city, accepted_terms_at: new Date().toISOString() },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        setAuthMessage(error.message);
      } else if (data?.session) {
        // Email confirmation is switched off in Supabase: user is signed in straight away
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName || cleanEmail.split('@')[0], city: city || 'Gaborone' });
        }
        setSession(data.session);
        setActiveTab('explore');
      } else if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        // Supabase returns an empty identities list when the email is already registered
        setAuthMessage('An account with this email already exists. Try signing in, or use "Forgot password?".');
        setAuthMode('login');
      } else {
        // Confirmation required: the user must click the link we emailed
        setResendFeedback('');
        setPendingConfirmEmail(cleanEmail);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        if (error.message.toLowerCase().includes('not confirmed')) {
          setResendFeedback('');
          setPendingConfirmEmail(cleanEmail);
        } else {
          setAuthMessage(error.message);
        }
      } else {
        if (data?.session) setSession(data.session);
        setActiveTab('explore');
      }
    }
    setAuthLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!supabase || !pendingConfirmEmail) return;
    setResending(true);
    setResendFeedback('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingConfirmEmail,
      options: { emailRedirectTo: window.location.origin }
    });
    setResending(false);
    setResendFeedback(
      error
        ? error.message
        : `Another confirmation email is on its way to ${pendingConfirmEmail}. It can take a few minutes.`
    );
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setResetFeedback('Please enter the email address linked to your account.');
      return;
    }
    setSendingReset(true);
    setResetFeedback('');
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.origin
    });
    setSendingReset(false);
    if (error) {
      setResetFeedback(error.message);
    } else {
      setResetFeedback(`Password reset link sent to ${targetEmail}. Check your inbox and spam folder.`);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (newPassword.length < 6) {
      setRecoveryFeedback('Choose a password with at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryFeedback('Passwords do not match.');
      return;
    }
    setUpdatingPassword(true);
    setRecoveryFeedback('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      setRecoveryFeedback(error.message);
    } else {
      setIsPasswordRecovery(false);
      setNewPassword('');
      setConfirmNewPassword('');
      window.history.replaceState({}, document.title, window.location.pathname);
      setAuthMessage('Password updated! You are now signed in.');
      setActiveTab('explore');
    }
  };

  const handleLogout = async () => {
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
    setShowSettingsModal(false);
    setActiveTab('explore');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uid) { alert('Please sign in before uploading a photo.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File size too large. Please select an image under 5MB.'); return; }
    setUploadingImage(true);
    const path = `${uid}/${Math.random().toString(36).substring(2)}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file);
    if (error) alert('Failed to upload image: ' + error.message);
    else {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (data?.publicUrl) setForm((f) => ({ ...f, image_url: data.publicUrl }));
    }
    setUploadingImage(false);
  };

  const openCreate = () => {
    if (!uid) {
      setActiveTab('profile');
      return;
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    setListingError('');
    setShowListingModal(true);
  };

  const openEdit = (l) => {
    if (!canEditListing(l)) {
      setLoadError('Listings can only be edited within 1 hour of posting. Delete this listing and post a new one instead.');
      return;
    }
    setEditingId(l.id);
    setForm({
      title: l.title,
      description: l.description || '',
      type: l.type || 'good',
      condition: PRODUCT_CONDITIONS.includes(l.condition) ? l.condition : (l.type === 'service' ? 'Mint' : 'Good'),
      category: l.category,
      city: l.city,
      looking_for: l.looking_for || '',
      image_url: l.image_url || ''
    });
    setListingError('');
    setShowListingModal(true);
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setSubmittingListing(true);
    setListingError('');
    const baseBody = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      category: form.category,
      city: form.city,
      looking_for: form.looking_for.trim(),
      image_url: form.image_url.trim() || FALLBACK_IMG
    };
    const fullBody = { ...baseBody, condition: form.condition || 'Good' };

    let { error } = editingId
      ? await supabase.from('listings').update(fullBody).eq('id', editingId)
      : await supabase.from('listings').insert({ ...fullBody, owner_id: uid, status: 'active' });

    if (error && error.message.toLowerCase().includes('condition')) {
      ({ error } = editingId
        ? await supabase.from('listings').update(baseBody).eq('id', editingId)
        : await supabase.from('listings').insert({ ...baseBody, owner_id: uid, status: 'active' }));
    }

    setSubmittingListing(false);
    if (error) { setListingError(error.message); return; }
    setShowListingModal(false);
    setForm(EMPTY_FORM);
    refreshAll();
  };

  const setListingStatus = async (l, status) => {
    if (!supabase || !uid) return;
    if (status === 'deleted' && !window.confirm(`Delete "${l.title}"? This cannot be undone.`)) return;

    const { data, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', l.id)
      .eq('owner_id', uid)
      .select();

    if (error) {
      console.error('Failed to update listing status:', error);
      setLoadError(`Could not update listing "${l.title}": ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      const msg = 'Listing was not updated—check that you are signed in as the owner and that your Supabase UPDATE policy allows this change.';
      console.warn(msg, { listingId: l.id, uid });
      setLoadError(msg);
      return;
    }

    setLoadError('');
    refreshAll();
  };

  const toggleFavorite = async (e, listingId) => {
    e.stopPropagation();
    if (!uid) { setActiveTab('profile'); return; }
    if (favorites.includes(listingId)) {
      setFavorites(favorites.filter((id) => id !== listingId));
      await supabase.from('favorites').delete().eq('user_id', uid).eq('listing_id', listingId);
    } else {
      setFavorites([...favorites, listingId]);
      await supabase.from('favorites').insert({ user_id: uid, listing_id: listingId });
    }
  };

  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!uid || !selectedListing) return;
    if (String(selectedListing.id).startsWith('starter-')) {
      alert('This is a sample listing. Sign in and post or select a live member listing to send an offer.');
      return;
    }
    if (!offeredListingId && !customOffer.trim()) { alert('Please select one of your listings or describe a custom offer.'); return; }
    setSubmittingProposal(true);
    const { error } = await supabase.from('trade_proposals').insert({
      sender_id: uid, receiver_id: selectedListing.owner_id, target_listing_id: selectedListing.id,
      offered_listing_id: offeredListingId || null, custom_offer: customOffer.trim() || null, status: 'pending'
    });
    setSubmittingProposal(false);
    if (error) { alert('Failed to send offer: ' + error.message); return; }
    setSelectedListing(null); setOfferedListingId(''); setCustomOffer('');
    fetchProposals();
    setTradeFilter('open');
    setActiveTab('trades');
  };

  const updateProposal = async (id, patch) => {
    const { error } = await supabase.from('trade_proposals')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) alert(error.message);
    else fetchProposals();
  };

  const submitCounter = async (e) => {
    e.preventDefault();
    if (!counterText.trim()) return;
    await updateProposal(counterFor.id, { status: 'countered', counter_text: counterText.trim() });
    setCounterFor(null); setCounterText('');
  };

  const confirmCompletion = async (p) => {
    if (!supabase || !uid) return;
    if (p.receiver_id !== uid) {
      alert('Only the person who accepted this offer can confirm the trade.');
      return;
    }
    const { error } = await supabase.rpc('confirm_trade_completed', { p_proposal_id: p.id });
    if (error) { alert('Could not confirm trade: ' + error.message); return; }
    await Promise.all([fetchProposals(), fetchListings(false), fetchMyListings(), fetchNotifications()]);
    setReviewRating(5);
    setReviewItemRating(5);
    setReviewComment('');
    setActiveTab('bartered');
    setReviewFor({ ...p, status: 'completed' });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const p = reviewFor;
    const base = {
      proposal_id: p.id,
      reviewer_id: uid,
      reviewee_id: p.sender_id === uid ? p.receiver_id : p.sender_id,
      rating: reviewRating,
      comment: reviewComment.trim() || null
    };
    let { error } = await supabase.from('reviews').insert({ ...base, item_rating: reviewItemRating });
    if (error && error.message.toLowerCase().includes('item_rating')) {
      ({ error } = await supabase.from('reviews').insert(base));
    }
    if (error) { alert('Could not save review: ' + error.message); return; }
    setReviewFor(null);
    setReviewRating(5);
    setReviewItemRating(5);
    setReviewComment('');
    fetchProposals();
  };

  const openChat = async (p) => {
    if (!p) return;
    setActiveProposal(p);
    setMessages([]);
    const latestTs = chatPreviews[p.id]?.created_at || p.updated_at || new Date().toISOString();
    markProposalChatRead(p.id, latestTs);
    await loadMessages(p.id);
  };

  const handleOpenInbox = async () => {
    setActiveTab('messages');
    markAllChatsRead(proposals);
    if (uid) {
      await fetchProposals();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeProposal || !uid) return;
    const text = newMessage.trim();
    setNewMessage('');
    const { error } = await supabase.from('messages').insert({ proposal_id: activeProposal.id, sender_id: uid, content: text });
    if (error) alert(error.message);
    else {
      await loadMessages(activeProposal.id);
      markProposalChatRead(activeProposal.id, new Date().toISOString());
      fetchChatPreviews(proposals);
    }
  };

  const markRead = async (n) => {
    if (!n.read) {
      setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    }
    setTradeFilter('open');
    setActiveTab('trades');
  };

  const markAllRead = async () => {
    setNotifications((list) => list.map((x) => ({ ...x, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false);
  };

  const sourceListings = supabase && listings.length > 0 ? listings : STARTER_LISTINGS;

  const filteredListings = useMemo(() => sourceListings.filter((item) => {
    if (activeTab === 'wishlist' && !favorites.includes(item.id)) return false;
    if (selectedCity !== 'All Cities' && item.city !== selectedCity) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (selectedCondition !== 'All' && (item.condition || 'Good') !== selectedCondition) return false;
    if (listingTypeFilter !== 'all' && item.type !== listingTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (![item.title, item.description, item.looking_for, item.condition].some((t) => t?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [sourceListings, activeTab, favorites, selectedCity, selectedCategory, selectedCondition, listingTypeFilter, searchQuery]);

  const offerable = myListings.filter((l) => l.status === 'active');
  const unread = notifications.filter((n) => !n.read).length;

  const unreadInboxCount = useMemo(() => {
    if (!uid || activeTab === 'messages') return 0;
    let count = 0;
    for (const p of proposals) {
      const latestMsg = chatPreviews[p.id];
      if (!latestMsg || latestMsg.sender_id === uid) continue;
      if (activeProposal?.id === p.id) continue;
      const lastReadIso = lastReadMap[p.id];
      const lastReadMs = lastReadIso ? new Date(lastReadIso).getTime() : 0;
      const msgMs = new Date(latestMsg.created_at).getTime();
      if (msgMs > lastReadMs) {
        count += 1;
      }
    }
    return count;
  }, [uid, activeTab, proposals, chatPreviews, lastReadMap, activeProposal?.id]);

  const needsAction = proposals.filter((p) =>
    (p.status === 'pending' && p.receiver_id === uid) ||
    (p.status === 'countered' && p.sender_id === uid) ||
    (p.status === 'accepted' && p.receiver_id === uid)).length;
  const barteredTrades = proposals.filter((p) => p.status === 'completed');
  const visibleTrades = proposals.filter((p) => TRADE_FILTERS[tradeFilter].statuses.includes(p.status));

  const sortedChats = useMemo(() => {
    return [...proposals].sort((a, b) => {
      const aTime = new Date(chatPreviews[a.id]?.created_at || a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(chatPreviews[b.id]?.created_at || b.updated_at || b.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [proposals, chatPreviews]);

  const memberRatingDisplay = useMemo(() => {
    if (!viewedMember) return { avg: 0, count: 0 };
    if (viewedMemberReviews.length > 0) {
      const total = viewedMemberReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
      return {
        avg: total / viewedMemberReviews.length,
        count: viewedMemberReviews.length
      };
    }
    return {
      avg: Number(viewedMember.rating_avg ?? viewedMember.rating ?? 0) || 0,
      count: Number(viewedMember.rating_count ?? 0) || 0
    };
  }, [viewedMember, viewedMemberReviews]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-slate-100 to-amber-50/40 text-slate-950 pb-24 text-base">
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTab !== 'explore' && (
              <button
                onClick={() => setActiveTab(activeTab === 'memberProfile' ? previousTab || 'explore' : 'explore')}
                className={BACK_BTN}
                title={activeTab === 'memberProfile' ? 'Back' : 'Back to Dashboard'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <img
              src="/icon-192.png"
              alt="BarterBox logo"
              onClick={() => setActiveTab('explore')}
              className="w-10 h-10 rounded-xl border border-sky-200 shadow-xs object-cover cursor-pointer shrink-0"
            />
            <div className="truncate">
              <span onClick={() => setActiveTab('explore')} className="font-black text-xl tracking-tight text-slate-950 cursor-pointer block leading-none">
                Barter<span className="text-[#1e7be6]">Box</span>
              </span>
              <span className="text-xs font-semibold text-slate-600 block mt-0.5 truncate">Swap Goods & Skills in BW</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="text-xs sm:text-sm font-bold text-[#1e7be6] bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs transition-all"
              >
                Install App
              </button>
            )}
            {uid ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenInbox}
                  className={`relative p-2 rounded-xl border text-slate-800 transition ${
                    activeTab === 'messages'
                      ? 'bg-sky-100 border-sky-300 text-[#1e7be6]'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                  title="Messages"
                  aria-label="Messages"
                >
                  <Inbox className="w-5 h-5" />
                  {unreadInboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className={`relative p-2 rounded-xl border text-slate-800 transition ${
                    activeTab === 'notifications'
                      ? 'bg-sky-100 border-sky-300 text-[#1e7be6]'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                </button>
              </>
            ) : (
              <button onClick={() => setActiveTab('profile')} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all">Sign In</button>
            )}
          </div>
        </div>
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="bg-amber-100 border-t border-amber-300 text-amber-950"
          >
            <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-800 shrink-0" />
                <span>You're offline — viewing cached BarterBox data. Reconnect to post, message, or update trades.</span>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 text-[11px] font-extrabold uppercase">
                Offline
              </span>
            </div>
          </div>
        )}
      </header>

      {emailJustConfirmed && uid && (
        <div className="bg-emerald-100 border-b border-emerald-300 text-emerald-950">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-bold">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Email confirmed. Welcome to BarterBox!</span>
            <button type="button" onClick={() => setEmailJustConfirmed(false)} className="p-1 rounded-lg hover:bg-emerald-200" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 pt-4">
        {(activeTab === 'explore' || activeTab === 'wishlist') && (
          <div className="space-y-4">
            {activeTab === 'explore' && (
              <section className="relative overflow-hidden bg-gradient-to-br from-[#1e7be6] via-[#1a6fd0] to-[#1559ab] text-white rounded-2xl p-5 sm:p-6 border border-sky-300/50 shadow-md">
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="p-1 bg-white rounded-2xl shadow-sm border border-amber-200">
                    <img
                      src="/icon-192.png"
                      alt="BarterBox Emblem"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                    />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Barter<span className="text-amber-300">Box</span>
                  </h1>
                  <p className="text-sm sm:text-base font-medium text-sky-100 max-w-md">
                    Botswana's peer-to-peer barter hub — trade everyday goods & local skills with zero fees.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 bg-amber-200 text-slate-950 font-bold text-xs sm:text-sm px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" /> Gaborone & Nationwide BW
                    </span>
                    {!uid && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="bg-white hover:bg-sky-50 text-[#1e7be6] font-bold text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-xs transition"
                      >
                        Start Trading Free →
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            <div className={`${CARD} p-4 space-y-3`}>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search seswaa, phones, plumbing, furniture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e7be6]/25 focus:border-[#1e7be6] focus:bg-white transition"
                  />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <MapPin className="w-4 h-4 text-rose-600 absolute left-3 top-3 pointer-events-none" />
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full pl-8 pr-7 py-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1e7be6]">
                      {BW_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <select value={listingTypeFilter} onChange={(e) => setListingTypeFilter(e.target.value)} className="flex-1 sm:flex-initial px-3 py-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1e7be6]">
                    <option value="all">Goods & Services</option>
                    <option value="good">Goods Only</option>
                    <option value="service">Services Only</option>
                  </select>
                  <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} aria-label="Filter by condition" className="flex-1 sm:flex-initial px-3 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1e7be6]">
                    <option value="All">All Conditions</option>
                    {PRODUCT_CONDITIONS.map((cond) => <option key={cond} value={cond}>{cond}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#1e7be6] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h2 className="font-extrabold text-xl text-slate-950">{activeTab === 'wishlist' ? 'Saved Wishlist Items' : 'Available for Barter'}</h2>
              <button type="button" onClick={() => fetchListings(true)} className={BACK_BTN}><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {loadError && <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-sm font-medium"><strong>Notice:</strong> {loadError}</div>}

            {loadingData && listings.length === 0 ? (
              <div className={`${CARD} p-10 text-center text-base font-semibold text-slate-600`}>Loading Botswana marketplace...</div>
            ) : filteredListings.length === 0 ? (
              <div className={`${CARD} p-10 text-center space-y-2`}>
                <Package className="w-9 h-9 text-[#1e7be6] mx-auto" />
                <p className="font-extrabold text-lg text-slate-900">No listings match your filter</p>
                <p className="text-sm text-slate-600">Try clearing filters or post an item to start trading!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((item) => {
                  const isFav = favorites.includes(item.id);
                  const cond = item.condition || 'Good';
                  return (
                    <div key={item.id} onClick={() => setSelectedListing(item)} className={`${CARD} overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col`}>
                      <div className="relative h-44 bg-slate-200 border-b border-slate-100">
                        <img src={item.image_url || FALLBACK_IMG} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs ${
                            item.type === 'service'
                              ? 'bg-amber-200 text-slate-950 border border-amber-300'
                              : 'bg-sky-600 text-white'
                          }`}>
                            {item.type === 'service' ? <Briefcase className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                            {item.type === 'service' ? 'Service' : 'Good'}
                          </span>
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border shadow-xs ${CONDITION_BADGE[cond] || CONDITION_BADGE.Good}`}>
                            {cond}
                          </span>
                        </div>
                        <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center shadow-xs hover:bg-white transition" title="Save to wishlist">
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : 'text-slate-700'}`} />
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{item.city}</span>
                            <span>•</span>
                            <span className="text-[#1e7be6] truncate">{item.category}</span>
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-950 line-clamp-1">{item.title}</h3>
                          <p className="text-sm text-slate-700 line-clamp-2 mt-1 leading-snug">{item.description}</p>
                        </div>
                        <div className="bg-sky-50/90 border border-sky-200/80 rounded-xl p-2.5">
                          <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#1e7be6] block">Looking For:</span>
                          <p className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">{item.looking_for || 'Open to fair barter offers'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'memberProfile' && viewedMember && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => setActiveTab(previousTab || 'explore')} className={BACK_BTN}>
                <ArrowLeft className="w-4 h-4" /> Back to Listings
              </button>
            </div>

            <div className={`${CARD} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={viewedMember.avatar_url || '/icon-192.png'}
                  alt={viewedMember.full_name || 'Member avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-sky-200 bg-slate-100 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <h2 className="font-extrabold text-2xl text-slate-950 truncate">
                    {viewedMember.full_name || 'BarterBox Member'}
                  </h2>
                  {viewedMember.username && (
                    <p className="text-sm font-bold text-[#1e7be6] truncate">@{viewedMember.username}</p>
                  )}
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{viewedMember.city || 'Botswana'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 shrink-0">
                <Star className="w-7 h-7 fill-amber-400 text-amber-500 shrink-0" />
                <div>
                  <p className="font-black text-xl text-slate-950 leading-none">
                    {memberRatingDisplay.count > 0 ? memberRatingDisplay.avg.toFixed(1) : 'New'}
                    <span className="text-xs font-bold text-slate-600"> / 5.0</span>
                  </p>
                  <p className="text-xs font-bold text-amber-950 mt-1">
                    {memberRatingDisplay.count > 0
                      ? `${memberRatingDisplay.count} review${memberRatingDisplay.count > 1 ? 's' : ''}`
                      : 'No ratings yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-extrabold text-xl text-slate-950">
                Active Listings by {viewedMember.full_name || 'Member'} ({viewedMemberListings.length})
              </h3>
              {loadingMemberProfile && viewedMemberListings.length === 0 ? (
                <div className={`${CARD} p-8 text-center text-sm font-semibold text-slate-600`}>
                  Loading member listings...
                </div>
              ) : viewedMemberListings.length === 0 ? (
                <div className={`${CARD} p-8 text-center text-sm font-medium text-slate-600`}>
                  This member has no active listings right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {viewedMemberListings.map((item) => {
                    const cond = item.condition || 'Good';
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedListing(item)}
                        className={`${CARD} overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col`}
                      >
                        <div className="relative h-40 bg-slate-200 border-b border-slate-100">
                          <img src={item.image_url || FALLBACK_IMG} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs ${
                              item.type === 'service'
                                ? 'bg-amber-200 text-slate-950 border border-amber-300'
                                : 'bg-sky-600 text-white'
                            }`}>
                              {item.type === 'service' ? <Briefcase className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                              {item.type === 'service' ? 'Service' : 'Good'}
                            </span>
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border shadow-xs ${CONDITION_BADGE[cond] || CONDITION_BADGE.Good}`}>
                              {cond}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-600" />
                              <span>{item.city}</span>
                              <span>•</span>
                              <span className="text-[#1e7be6] truncate">{item.category}</span>
                            </div>
                            <h4 className="font-extrabold text-base text-slate-950 line-clamp-1">{item.title}</h4>
                            <p className="text-sm text-slate-700 line-clamp-2 mt-1">{item.description}</p>
                          </div>
                          <div className="bg-sky-50/90 border border-sky-200/80 rounded-xl p-2">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#1e7be6] block">Looking For:</span>
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.looking_for || 'Open to fair barter offers'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${CARD} p-5 space-y-3`}>
              <h3 className="font-extrabold text-base text-slate-950">
                Trader Reviews & Ratings ({viewedMemberReviews.length})
              </h3>
              {viewedMemberReviews.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {memberRatingDisplay.count > 0
                    ? `Rated ${memberRatingDisplay.avg.toFixed(1)} across ${memberRatingDisplay.count} completed trade${memberRatingDisplay.count > 1 ? 's' : ''}.`
                    : 'No written reviews yet for this member.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {viewedMemberReviews.map((r) => (
                    <div key={r.id} className="text-sm border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{r.reviewer?.full_name || 'Member'}</span>
                        <span className="text-amber-500 font-bold">
                          {'★'.repeat(Number(r.rating) || 0)}
                          <span className="text-slate-300">{'★'.repeat(Math.max(0, 5 - (Number(r.rating) || 0)))}</span>
                        </span>
                      </div>
                      {r.comment && <p className="text-slate-700 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-2xl text-slate-950">Messages</h2>
              {uid && (
                <button type="button" onClick={() => { fetchProposals(); fetchListings(true); }} className={BACK_BTN}>
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              )}
            </div>
            {!uid ? (
              <div className={`${CARD} p-8 text-center space-y-3`}>
                <p className="text-base font-medium text-slate-700">Sign in to view all your trade chats and messages.</p>
                <button onClick={() => setActiveTab('profile')} className={`${PRIMARY} px-6 py-2.5`}>Go to Sign In</button>
              </div>
            ) : sortedChats.length === 0 ? (
              <div className={`${CARD} p-8 text-center space-y-3`}>
                <MessageSquare className="w-9 h-9 text-[#1e7be6] mx-auto" />
                <p className="font-extrabold text-lg text-slate-900">No trade chats yet</p>
                <p className="text-sm text-slate-600">Send or receive a barter proposal on a listing to start a conversation.</p>
                <button onClick={() => setActiveTab('explore')} className={`${PRIMARY} px-5 py-2.5`}>Browse Marketplace</button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedChats.map((p) => {
                  const amSender = p.sender_id === uid;
                  const partner = amSender ? p.receiver : p.sender;
                  const latestMsg = chatPreviews[p.id];
                  const timestamp = latestMsg?.created_at || p.updated_at || p.created_at;
                  const lastReadMs = lastReadMap[p.id] ? new Date(lastReadMap[p.id]).getTime() : 0;
                  const isUnreadThread =
                    !!latestMsg &&
                    latestMsg.sender_id !== uid &&
                    new Date(latestMsg.created_at).getTime() > lastReadMs;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openChat(p)}
                      className={`${CARD} w-full text-left p-4 hover:border-sky-300 flex items-center justify-between gap-3 ${
                        isUnreadThread ? 'border-sky-300 bg-sky-50/50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-base text-slate-950 truncate flex items-center gap-2">
                            <span>{partner?.full_name || 'BarterBox Member'}</span>
                            {isUnreadThread && <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">
                            {ago(timestamp)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1e7be6] truncate">
                          Trade: {p.target_listing?.title || 'Listing'} ↔ {p.offered_listing?.title || p.custom_offer || 'Offer'}
                        </p>
                        <p className={`text-sm truncate ${isUnreadThread ? 'font-bold text-slate-950' : 'text-slate-700'}`}>
                          {latestMsg
                            ? `${latestMsg.sender_id === uid ? 'You: ' : ''}${latestMsg.content}`
                            : 'Tap to open Trade Chat and coordinate your swap.'}
                        </p>
                      </div>
                      <span className={`${SM} bg-[#1e7be6] text-white shrink-0`}>
                        <MessageSquare className="w-4 h-4" /> Chat
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-extrabold text-2xl text-slate-950">Your Barter Proposals & History</h2>
              <button type="button" onClick={() => setActiveTab('bartered')} className={BACK_BTN}>
                <CheckCircle2 className="w-4 h-4" /> Bartered Items
              </button>
            </div>
            {!uid ? (
              <div className={`${CARD} p-8 text-center space-y-3`}>
                <p className="text-base font-medium text-slate-700">Sign in to view your incoming and outgoing barter offers.</p>
                <button onClick={() => setActiveTab('profile')} className={`${PRIMARY} px-6 py-2.5`}>Go to Sign In</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TRADE_FILTERS).map(([key, f]) => (
                    <button key={key} onClick={() => setTradeFilter(key)} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${tradeFilter === key ? 'bg-[#1e7be6] text-white shadow-xs' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'}`}>{f.label}</button>
                  ))}
                </div>
                {visibleTrades.length === 0 ? (
                  <div className={`${CARD} p-8 text-center space-y-3`}>
                    <p className="text-base font-medium text-slate-600">{tradeFilter === 'open' ? 'No open trades. Browse items and make an offer!' : 'Nothing here yet.'}</p>
                    <button onClick={() => setActiveTab('explore')} className={`${PRIMARY} px-5 py-2.5`}>Browse Marketplace</button>
                  </div>
                ) : visibleTrades.map((p) => {
                  const amSender = p.sender_id === uid;
                  const isAcceptor = p.receiver_id === uid;
                  const other = amSender ? p.receiver : p.sender;
                  const reviewed = (p.reviews || []).some((r) => r.reviewer_id === uid);

                  const targetCond = p.target_listing?.condition;
                  const offeredCond = p.offered_listing?.condition;

                  return (
                    <div key={p.id} className={`${CARD} p-4 sm:p-5 space-y-3.5`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg ${amSender ? 'bg-sky-100 text-sky-950 border border-sky-200' : 'bg-amber-100 text-amber-950 border border-amber-200'}`}>
                          {amSender ? `Sent to ${other?.full_name || 'Member'}` : `Offer from ${other?.full_name || 'Member'}`}
                        </span>
                        <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm">
                        <div className="space-y-1">
                          <span className="text-xs font-bold uppercase text-slate-500 block">Target Item:</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-slate-950 text-base">{p.target_listing?.title}</strong>
                            {targetCond && (
                              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${CONDITION_BADGE[targetCond] || CONDITION_BADGE.Good}`}>
                                {targetCond}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold uppercase text-slate-500 block">Offered in Exchange:</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-[#1e7be6] text-base">{p.offered_listing?.title || p.custom_offer}</strong>
                            {p.offered_listing && offeredCond && (
                              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${CONDITION_BADGE[offeredCond] || CONDITION_BADGE.Good}`}>
                                {offeredCond}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {p.status === 'countered' && p.counter_text && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                          <span className="font-bold text-amber-950 block">Counter-offer from {p.receiver?.full_name || 'owner'}:</span>
                          <p className="text-slate-900 font-medium mt-0.5">{p.counter_text}</p>
                        </div>
                      )}

                      {p.status === 'accepted' && (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-sm space-y-2.5">
                          <p className="font-extrabold text-[#1e7be6] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 shrink-0" /> Offer accepted. Meet up safely, then confirm.
                          </p>
                          {isAcceptor ? (
                            <>
                              <p className="text-slate-700 font-medium">
                                After you've met and swapped, confirm the trade below. Until you confirm, this trade stays open.
                              </p>
                              <button type="button" onClick={() => confirmCompletion(p)} className={`${SM} bg-emerald-600 text-white`}>
                                <CheckCircle2 className="w-4 h-4" /> Confirm trade after meetup
                              </button>
                            </>
                          ) : (
                            <p className="text-slate-700 font-medium">
                              Waiting for {other?.full_name || 'the other trader'} to confirm the trade after your meetup. The trade stays open until they do.
                            </p>
                          )}
                          <button type="button" onClick={() => setSafetyPopupFor(p)} className="text-xs font-bold text-[#1e7be6] underline">
                            View safety tips
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button onClick={() => openChat(p)} className={`${SM} bg-slate-900 text-white`}><MessageSquare className="w-4 h-4" /> Trade Chat</button>
                        <div className="flex flex-wrap gap-2">
                          {p.status === 'pending' && !amSender && (
                            <>
                              <button onClick={() => updateProposal(p.id, { status: 'accepted' })} className={`${SM} bg-emerald-600 text-white`}><Check className="w-4 h-4" /> Accept</button>
                              <button onClick={() => { setCounterFor(p); setCounterText(''); }} className={`${SM} bg-amber-200 text-amber-950`}><ArrowLeftRight className="w-4 h-4" /> Counter</button>
                              <button onClick={() => updateProposal(p.id, { status: 'rejected' })} className={`${SM} bg-rose-100 text-rose-900`}><X className="w-4 h-4" /> Decline</button>
                            </>
                          )}
                          {p.status === 'countered' && amSender && (
                            <>
                              <button onClick={() => updateProposal(p.id, { status: 'accepted' })} className={`${SM} bg-emerald-600 text-white`}><Check className="w-4 h-4" /> Accept counter</button>
                              <button onClick={() => updateProposal(p.id, { status: 'rejected' })} className={`${SM} bg-rose-100 text-rose-900`}><X className="w-4 h-4" /> Decline</button>
                            </>
                          )}
                          {p.status === 'countered' && !amSender && <span className="text-sm font-semibold text-slate-600 self-center">Waiting for their reply</span>}
                          {['pending', 'countered'].includes(p.status) && amSender && (
                            <button onClick={() => updateProposal(p.id, { status: 'withdrawn' })} className={`${SM} bg-slate-200 text-slate-800`}>Withdraw</button>
                          )}
                          {p.status === 'completed' && !reviewed && (
                            <button onClick={() => { setReviewFor(p); setReviewRating(5); setReviewItemRating(5); setReviewComment(''); }} className={`${SM} bg-amber-400 text-slate-950`}><Star className="w-4 h-4" /> Leave a review</button>
                          )}
                          {p.status === 'completed' && reviewed && <span className="text-sm text-emerald-800 font-bold self-center">✓ Review submitted</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'bartered' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-extrabold text-2xl text-slate-950">Bartered Items</h2>
              <button type="button" onClick={() => setActiveTab('trades')} className={BACK_BTN}>
                <ArrowLeft className="w-4 h-4" /> Trades
              </button>
            </div>
            <p className="text-sm font-medium text-slate-600">Items you have already swapped on BarterBox.</p>
            {!uid ? (
              <div className={`${CARD} p-8 text-center space-y-3`}>
                <p className="text-base font-medium text-slate-700">Sign in to see your bartered items.</p>
                <button onClick={() => setActiveTab('profile')} className={`${PRIMARY} px-6 py-2.5`}>Go to Sign In</button>
              </div>
            ) : barteredTrades.length === 0 ? (
              <div className={`${CARD} p-8 text-center space-y-2`}>
                <Package className="w-9 h-9 text-[#1e7be6] mx-auto" />
                <p className="font-extrabold text-lg text-slate-900">No bartered items yet</p>
                <p className="text-sm text-slate-600">Once a trade is confirmed after your meetup, the items you swapped will appear here.</p>
              </div>
            ) : (
              barteredTrades.map((p) => {
                const iAmLister = p.receiver_id === uid;
                const partner = iAmLister ? p.sender : p.receiver;
                const gaveText = iAmLister ? p.target_listing?.title : (p.offered_listing?.title || p.custom_offer);
                const gotText = iAmLister ? (p.offered_listing?.title || p.custom_offer) : p.target_listing?.title;
                const gaveImg = iAmLister ? p.target_listing?.image_url : p.offered_listing?.image_url;
                const gotImg = iAmLister ? p.offered_listing?.image_url : p.target_listing?.image_url;
                return (
                  <div key={p.id} className={`${CARD} p-4 space-y-3`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300">
                        Bartered with {partner?.full_name || 'a member'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{ago(p.updated_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[['You gave', gaveText, gaveImg], ['You received', gotText, gotImg]].map(([label, text, img]) => (
                        <div key={label} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <div className="h-28 bg-slate-200">
                            {img
                              ? <img src={img} alt={text || label} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 px-2 text-center">Custom offer</div>}
                          </div>
                          <div className="p-2.5">
                            <span className="text-[11px] uppercase font-extrabold text-slate-500 block">{label}</span>
                            <p className="text-sm font-extrabold text-slate-950 line-clamp-2">{text || 'Item'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-2xl text-slate-950">Notifications</h2>
              {unread > 0 && <button onClick={markAllRead} className={BACK_BTN}><Check className="w-4 h-4" /> Mark all as read</button>}
            </div>
            {notifications.length === 0 ? (
              <div className={`${CARD} p-8 text-center text-base font-medium text-slate-600`}>You're all caught up. New offers, messages and trade updates will show here.</div>
            ) : notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left p-4 flex items-start gap-3 rounded-2xl border shadow-sm transition ${
                  n.read
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200/70'
                    : 'bg-sky-100 border-sky-400 hover:bg-sky-200/70'
                }`}
              >
                <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-[#1e7be6]'}`} />
                <span className="flex-1">
                  <span className={`text-base block ${n.read ? 'font-medium text-slate-500' : 'font-extrabold text-slate-950'}`}>{n.body}</span>
                  <span className="text-xs font-semibold text-slate-500">{ago(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto space-y-4">
            <button onClick={() => setActiveTab('explore')} className={BACK_BTN}><ArrowLeft className="w-4 h-4" /> Back to Explore</button>
            {isPasswordRecovery && uid ? (
              <div className={`${CARD} p-6 space-y-4`}>
                <div className="text-center">
                  <h2 className="font-extrabold text-2xl text-slate-950">Set a New Password</h2>
                  <p className="text-sm text-slate-600 mt-1">Enter and confirm your new BarterBox password below.</p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                  <div>
                    <label className={LABEL}>New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={INPUT}
                    />
                  </div>
                  {recoveryFeedback && (
                    <p className="text-sm font-bold text-[#1e7be6] bg-sky-50 border border-sky-200 p-3 rounded-xl">{recoveryFeedback}</p>
                  )}
                  <button type="submit" disabled={updatingPassword} className={`w-full ${PRIMARY} py-3 disabled:opacity-50`}>
                    {updatingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              </div>
            ) : !uid ? (
              <div className={`${CARD} p-6 space-y-4`}>
                {pendingConfirmEmail ? (
                  <div className="text-center space-y-3.5">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                      <Inbox className="w-7 h-7 text-[#1e7be6]" />
                    </div>
                    <h2 className="font-extrabold text-2xl text-slate-950">Check your email</h2>
                    <p className="text-sm text-slate-700 font-medium">
                      We sent a confirmation link to <strong>{pendingConfirmEmail}</strong>. Tap the link to activate your account, then come back and sign in. It can take a few minutes, so check your spam folder too.
                    </p>
                    {resendFeedback && (
                      <p className="text-sm font-bold text-[#1e7be6] bg-sky-50 border border-sky-200 p-3 rounded-xl">{resendFeedback}</p>
                    )}
                    <button type="button" onClick={handleResendConfirmation} disabled={resending} className={`w-full ${PRIMARY} py-3 disabled:opacity-50`}>
                      {resending ? 'Sending...' : 'Resend confirmation email'}
                    </button>
                    <div className="flex items-center justify-center gap-4 text-sm font-bold text-[#1e7be6]">
                      <button type="button" onClick={() => { setPendingConfirmEmail(''); setResendFeedback(''); setAuthMessage(''); setAuthMode('signup'); }} className="hover:underline">
                        Use a different email
                      </button>
                      <button type="button" onClick={() => { setPendingConfirmEmail(''); setResendFeedback(''); setAuthMessage(''); setAuthMode('login'); }} className="hover:underline">
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                ) : authMode === 'login' && resetMode ? (
                  <>
                    <div className="text-center">
                      <h2 className="font-extrabold text-2xl text-slate-950">Reset Your Password</h2>
                      <p className="text-sm text-slate-600 mt-1">We'll email you a recovery link to set a new password.</p>
                    </div>
                    <form onSubmit={handleSendResetEmail} className="space-y-3.5">
                      <div>
                        <label className={LABEL}>Account Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.co.bw"
                          value={resetEmail || email}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className={INPUT}
                        />
                      </div>
                      {resetFeedback && (
                        <p className="text-sm font-bold text-[#1e7be6] bg-sky-50 border border-sky-200 p-3 rounded-xl">{resetFeedback}</p>
                      )}
                      <button type="submit" disabled={sendingReset} className={`w-full ${PRIMARY} py-3 disabled:opacity-50`}>
                        {sendingReset ? 'Sending Link...' : 'Send Reset Link'}
                      </button>
                    </form>
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setResetMode(false); setResetFeedback(''); }}
                        className="text-sm text-[#1e7be6] font-bold hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-1">
                      <img src="/icon-192.png" alt="BarterBox" className="w-12 h-12 rounded-xl mx-auto border border-sky-200 shadow-xs" />
                      <h2 className="font-extrabold text-2xl text-slate-950 pt-1">{authMode === 'login' ? 'Welcome Back to BarterBox' : 'Join BarterBox Botswana'}</h2>
                      <p className="text-sm font-medium text-slate-600">Zero fees. Direct peer-to-peer trading.</p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-3.5">
                      {authMode === 'signup' && (
                        <>
                          <div>
                            <label className={LABEL}>Full Name</label>
                            <input type="text" required placeholder="e.g. Kagiso Molefe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT} />
                          </div>
                          <div>
                            <label className={LABEL}>City / Town</label>
                            <select value={city} onChange={(e) => setCity(e.target.value)} className={INPUT}>
                              {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                      <div>
                        <label className={LABEL}>Email Address</label>
                        <input type="email" required placeholder="you@example.co.bw" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Password</label>
                        <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} />
                      </div>

                      {authMode === 'login' && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmail(email);
                              setResetFeedback('');
                              setResetMode(true);
                            }}
                            className="text-sm text-[#1e7be6] font-bold hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {authMode === 'signup' && (
                        <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3 space-y-2">
                          <label className="flex items-start gap-2.5 text-sm text-slate-800 font-medium cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-400 text-[#1e7be6] focus:ring-[#1e7be6]"
                            />
                            <span>
                              I am 18 or older and I agree to the{' '}
                              <button
                                type="button"
                                onClick={() => setLegalModal('terms')}
                                className="text-[#1e7be6] font-bold underline"
                              >
                                Terms of Service
                              </button>
                              .
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 text-sm text-slate-800 font-medium cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={acceptedPrivacy}
                              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-400 text-[#1e7be6] focus:ring-[#1e7be6]"
                            />
                            <span>
                              I have read and agree to the{' '}
                              <button
                                type="button"
                                onClick={() => setLegalModal('privacy')}
                                className="text-[#1e7be6] font-bold underline"
                              >
                                Privacy Policy
                              </button>
                              .
                            </span>
                          </label>
                        </div>
                      )}

                      {authMessage && <p className="text-sm font-bold text-[#1e7be6] bg-sky-50 border border-sky-200 p-3 rounded-xl">{authMessage}</p>}
                      <button
                        type="submit"
                        disabled={authLoading || (authMode === 'signup' && (!acceptedTerms || !acceptedPrivacy))}
                        className={`w-full ${PRIMARY} py-3 disabled:opacity-50`}
                      >
                        {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Free Account'}
                      </button>
                    </form>
                    <div className="text-center pt-1.5 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === 'login' ? 'signup' : 'login');
                          setAuthMessage('');
                          setResetMode(false);
                        }}
                        className="text-sm text-[#1e7be6] font-bold hover:underline block mx-auto"
                      >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                      </button>
                      <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setLegalModal('terms')}
                          className="hover:text-[#1e7be6] underline"
                        >
                          Terms of Service
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setLegalModal('privacy')}
                          className="hover:text-[#1e7be6] underline"
                        >
                          Privacy Policy
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`${CARD} p-5 flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={profile?.avatar_url || '/icon-192.png'}
                      alt={profile?.full_name || 'Profile avatar'}
                      className="w-14 h-14 rounded-xl object-cover border border-sky-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-xl text-slate-950 truncate">{profile?.full_name || session.user.email}</h2>
                      {profile?.username && <p className="text-sm text-[#1e7be6] font-bold truncate">@{profile.username}</p>}
                      <p className="text-sm font-medium text-slate-600 flex items-center gap-1 mt-0.5"><MapPin className="w-4 h-4 text-rose-600" /> {profile?.city || 'Botswana'}</p>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        {profile?.rating_count ? `${Number(profile.rating_avg).toFixed(1)} from ${profile.rating_count} review${profile.rating_count > 1 ? 's' : ''}` : 'No reviews yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => openSettings('edit')} className={`${SECONDARY_3D} px-3 py-1.5 flex items-center gap-1.5`}>
                      <Settings className="w-4 h-4 text-[#1e7be6]" /> Settings
                    </button>
                    <button onClick={handleLogout} className="text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>

                <div className={`${CARD} p-5 space-y-3`}>
                  <h3 className="font-extrabold text-base text-slate-950">My Listings ({myListings.length})</h3>
                  {myListings.length === 0 ? (
                    <p className="text-sm text-slate-600">You haven't posted any items or services yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {myListings.map((item) => {
                        const editable = canEditListing(item);
                        const cond = item.condition || 'Good';
                        return (
                          <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-950 truncate">{item.title}</p>
                                <p className="text-xs font-medium text-slate-600">{item.city} • {item.category} • Condition: <strong>{cond}</strong></p>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                            </div>
                            {item.status !== 'traded' && (
                              <div className="flex flex-wrap items-center gap-2">
                                {editable ? (
                                  <button type="button" onClick={() => openEdit(item)} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1 text-xs font-bold">
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">Edit window closed (1h limit)</span>
                                )}
                                {item.status === 'active'
                                  ? <button type="button" onClick={() => setListingStatus(item, 'paused')} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1 text-xs font-bold"><Pause className="w-3.5 h-3.5" /> Pause</button>
                                  : <button type="button" onClick={() => setListingStatus(item, 'active')} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1 text-xs font-bold"><Play className="w-3.5 h-3.5" /> Resume</button>}
                                <button type="button" onClick={() => setListingStatus(item, 'deleted')} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`${CARD} p-5 space-y-3`}>
                  <h3 className="font-extrabold text-base text-slate-950">Reviews about you</h3>
                  {myReviews.length === 0 ? <p className="text-sm text-slate-600">Reviews appear here after you complete trades.</p> : myReviews.map((r) => (
                    <div key={r.id} className="text-sm border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{r.reviewer?.full_name || 'Member'}</span>
                        <span className="text-amber-500">{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span></span>
                      </div>
                      {r.comment && <p className="text-slate-700 mt-0.5">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showInstallModal && !isInstalled && (
        <Modal onClose={() => setShowInstallModal(false)} className="max-w-md">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-extrabold text-xl text-slate-950">Install BarterBox on Your Phone</h2>
              <button type="button" onClick={() => setShowInstallModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-800">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 space-y-1">
                <p className="font-bold text-slate-950">Android (Chrome)</p>
                <p>1. Open <strong>https://barterbox-lemon.vercel.app</strong> in Chrome.</p>
                <p>2. Tap the <strong>three dots (⋮)</strong> → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                <p className="font-bold text-slate-950">iPhone (Safari)</p>
                <p>1. Open <strong>https://barterbox-lemon.vercel.app</strong> in Safari.</p>
                <p>2. Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> → <strong>Add</strong>.</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowInstallModal(false)} className={`w-full ${PRIMARY} py-2.5`}>
              Got It
            </button>
          </div>
        </Modal>
      )}

      {legalModal === 'terms' && (
        <TermsOfServiceModal
          onClose={() => setLegalModal(null)}
          onAccept={
            !uid && authMode === 'signup'
              ? () => {
                  setAcceptedTerms(true);
                  setLegalModal(null);
                }
              : null
          }
        />
      )}

      {legalModal === 'privacy' && (
        <PrivacyPolicyModal
          onClose={() => setLegalModal(null)}
          onAccept={
            !uid && authMode === 'signup'
              ? () => {
                  setAcceptedPrivacy(true);
                  setLegalModal(null);
                }
              : null
          }
        />
      )}

      {showSettingsModal && uid && (
        <Modal onClose={() => setShowSettingsModal(false)} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#1e7be6]" />
                <h2 className="font-extrabold text-xl text-slate-950">Account & App Settings</h2>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'edit', label: 'Edit Profile', Icon: User },
                { id: 'help', label: 'Help & Support', Icon: HelpCircle },
                { id: 'faq', label: 'FAQ', Icon: MessageSquare },
                { id: 'problem', label: 'Report a Problem', Icon: AlertTriangle },
                { id: 'feedback', label: 'Send Feedback', Icon: MessageCircleHeart },
                { id: 'delete', label: 'Delete Account', Icon: Trash2 }
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setSettingsSection(id); setSettingsNotice(''); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    settingsSection === id
                      ? id === 'delete' ? 'bg-rose-600 text-white' : 'bg-[#1e7be6] text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>
            </div>

            {settingsNotice && (
              <div className="bg-sky-50 border border-sky-200 text-[#1e7be6] text-sm font-bold p-3 rounded-xl">
                {settingsNotice}
              </div>
            )}

            {settingsSection === 'edit' && (
              <form onSubmit={handleSaveProfileSettings} className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatarUrl || '/icon-192.png'}
                    alt="Preview avatar"
                    className="w-14 h-14 rounded-xl object-cover border border-sky-200 bg-slate-100"
                  />
                  <div className="space-y-1">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 inline-flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#1e7be6]" />
                      <span>{uploadingAvatar ? 'Uploading...' : 'Upload New Profile Picture'}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-500">JPG, PNG, or WebP up to 5MB.</p>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Display Name</label>
                  <input type="text" required value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className={INPUT} />
                </div>

                <div>
                  <label className={LABEL}>Username</label>
                  <input
                    type="text"
                    placeholder="e.g. kagiso_bw"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className={LABEL}>City / Town</label>
                  <select value={editCity} onChange={(e) => setEditCity(e.target.value)} className={INPUT}>
                    {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={savingProfile || uploadingAvatar} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}

            {settingsSection === 'help' && (
              <div className="space-y-3 text-sm text-slate-700">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-extrabold text-base text-slate-950">Need Help with BarterBox?</h3>
                  <p>We're here to help with account access, listing issues, trade proposals, and community safety across Botswana.</p>
                  <p className="text-slate-900 font-bold">
                    Support Email: <SupportEmailLink subject="BarterBox Help & Support" />
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSettingsSection('faq')} className={`${SM} bg-slate-200 text-slate-900`}>Browse FAQ</button>
                  <button type="button" onClick={() => setSettingsSection('problem')} className={`${SM} bg-[#1e7be6] text-white`}>Report a Problem</button>
                </div>
              </div>
            )}

            {settingsSection === 'faq' && (
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={item.q} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-slate-950 bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span>{item.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />}
                      </button>
                      {isOpen && <p className="px-4 py-3 text-sm text-slate-700 bg-white">{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {settingsSection === 'problem' && (
              <form onSubmit={(e) => handleSupportSubmit(e, 'problem')} className="space-y-3.5">
                <div>
                  <label className={LABEL}>What went wrong?</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photo upload failed or chat message delayed"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us what you were doing and what happened..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <button type="submit" disabled={submittingSupport} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                  {submittingSupport ? 'Submitting...' : 'Submit Problem Report'}
                </button>
              </form>
            )}

            {settingsSection === 'feedback' && (
              <form onSubmit={(e) => handleSupportSubmit(e, 'feedback')} className="space-y-3.5">
                <div>
                  <label className={LABEL}>Topic (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. New categories or app experience"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Your Feedback</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share ideas or suggestions to make BarterBox better..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <button type="submit" disabled={submittingSupport} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                  {submittingSupport ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}

            {settingsSection === 'delete' && (
              <form onSubmit={handleDeleteAccount} className="space-y-3.5 bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h3 className="font-extrabold text-base text-rose-900">Delete Your BarterBox Account</h3>
                <p className="text-sm text-rose-800">
                  This removes your active listings, clears your profile details, and signs you out. Type <strong>DELETE</strong> below to confirm.
                </p>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={`${INPUT} bg-white border-rose-300`}
                />
                <button
                  type="submit"
                  disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm py-2.5 transition disabled:opacity-40"
                >
                  {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}

      {selectedListing && (() => {
        const posterName = selectedListing.profiles?.full_name || 'Member';
        const posterId = selectedListing.owner_id || selectedListing.user_id || '';
        return (
          <Modal onClose={() => setSelectedListing(null)} className="max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="relative h-52 bg-slate-200">
              <img src={selectedListing.image_url || FALLBACK_IMG} alt={selectedListing.title} className="w-full h-full object-cover rounded-t-2xl" />
              <button onClick={() => setSelectedListing(null)} className="absolute top-3 right-3 bg-white/95 border border-slate-200 p-1.5 rounded-full shadow-xs hover:bg-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-600">
                  <span className="bg-sky-100 text-[#1e7be6] font-extrabold px-2.5 py-0.5 rounded-full uppercase">{selectedListing.type}</span>
                  <span className={`font-extrabold px-2.5 py-0.5 rounded-full border ${CONDITION_BADGE[selectedListing.condition || 'Good'] || CONDITION_BADGE.Good}`}>
                    Condition: {selectedListing.condition || 'Good'}
                  </span>
                  <span>{selectedListing.city}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <span>Posted by</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMemberProfile(posterId, {
                          ...(selectedListing.profiles || {}),
                          full_name: posterName,
                          city: selectedListing.profiles?.city || selectedListing.city
                        });
                      }}
                      className="text-[#1e7be6] hover:text-[#1559ab] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg font-extrabold underline decoration-2 underline-offset-2 transition cursor-pointer"
                    >
                      {posterName}
                    </button>
                  </span>
                  {Number(selectedListing.profiles?.rating) > 0 && <span className="flex items-center gap-0.5 text-amber-700 font-bold"><Star className="w-4 h-4 fill-amber-400 text-amber-500" />{Number(selectedListing.profiles.rating).toFixed(1)}</span>}
                </div>
                <h2 className="font-extrabold text-2xl text-slate-950 mt-1.5">{selectedListing.title}</h2>
                <p className="text-base text-slate-700 mt-1.5 leading-relaxed">{selectedListing.description}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <span className="text-xs uppercase font-extrabold text-amber-950 block">Owner is looking for:</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{selectedListing.looking_for || 'Open to offers'}</p>
              </div>
              {uid === selectedListing.owner_id ? (
                <p className="text-sm font-semibold text-center text-slate-600 bg-slate-100 py-2.5 rounded-xl">This is your own listing.</p>
              ) : !uid ? (
                <button onClick={() => { setSelectedListing(null); setActiveTab('profile'); }} className={`w-full ${PRIMARY} py-2.5`}>Sign In to Propose a Trade</button>
              ) : (
                <form onSubmit={handleSendProposal} className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="font-extrabold text-base text-slate-950">Propose a Barter Offer</h3>
                  {offerable.length > 0 && (
                    <div>
                      <label className={LABEL}>Offer one of your listed items:</label>
                      <select value={offeredListingId} onChange={(e) => setOfferedListingId(e.target.value)} className={INPUT}>
                        <option value="">-- Select your item/service (optional) --</option>
                        {offerable.map((ml) => (
                          <option key={ml.id} value={ml.id}>
                            {ml.title} ({ml.condition || 'Good'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={LABEL}>Or describe a custom trade / skill offer:</label>
                    <textarea rows={2} placeholder="e.g. I can trade my Samsung tablet or 2 days of tiling work..." value={customOffer} onChange={(e) => setCustomOffer(e.target.value)} className={INPUT} />
                  </div>
                  <button type="submit" disabled={submittingProposal} className={`w-full ${PRIMARY} py-2.5 flex items-center justify-center gap-2 disabled:opacity-50`}>
                    <ArrowLeftRight className="w-4 h-4" />{submittingProposal ? 'Sending Offer...' : 'Send Barter Proposal'}
                  </button>
                </form>
              )}
            </div>
          </Modal>
        );
      })()}

      {showListingModal && (
        <Modal onClose={() => setShowListingModal(false)} className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-extrabold text-xl text-slate-950">{editingId ? 'Edit listing' : 'Post to BarterBox'}</h2>
              <button onClick={() => setShowListingModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveListing} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                {[['good', 'Physical Good'], ['service', 'Skill / Service']].map(([val, text]) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, type: val })} className={`py-2 rounded-xl text-sm font-bold border transition ${form.type === val ? 'bg-[#1e7be6] text-white border-[#1e7be6]' : 'bg-white text-slate-800 border-slate-200'}`}>{text}</button>
                ))}
              </div>
              <div>
                <label className={LABEL}>Title</label>
                <input type="text" required placeholder="e.g. Homemade Seswaa, Fresh Eggs, or HP Laptop" value={form.title} onChange={setF('title')} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LABEL}>Condition</label>
                  <select value={form.condition} onChange={setF('condition')} className={INPUT}>
                    {PRODUCT_CONDITIONS.map((cond) => <option key={cond} value={cond}>{cond}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Category</label>
                  <select value={form.category} onChange={setF('category')} className={INPUT}>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Location</label>
                <select value={form.city} onChange={setF('city')} className={INPUT}>
                  {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Description & Condition Notes</label>
                <textarea rows={2} required placeholder="Describe condition details, wear/tear, or service scope..." value={form.description} onChange={setF('description')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>What do you want in exchange?</label>
                <input type="text" required placeholder="e.g. Maize meal, charcoal, or smartphone" value={form.looking_for} onChange={setF('looking_for')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Listing Photo (Upload from Device or Paste URL)</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition">
                    <Upload className="w-4 h-4 text-[#1e7be6]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                  <input type="url" placeholder="Or paste image URL (https://...)" value={form.image_url} onChange={setF('image_url')} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                {form.image_url && (
                  <div className="mt-2 h-24 w-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              {listingError && <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs font-semibold"><strong>Error:</strong> {listingError}</div>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowListingModal(false)} className={`flex-1 ${SECONDARY_3D} py-2.5`}>Cancel</button>
                <button type="submit" disabled={submittingListing || uploadingImage} className={`flex-1 ${PRIMARY} py-2.5 disabled:opacity-50`}>
                  {submittingListing ? 'Saving...' : editingId ? 'Save changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {counterFor && (
        <Modal onClose={() => setCounterFor(null)} className="max-w-md">
          <form onSubmit={submitCounter} className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xl text-slate-950">Make a counter-offer</h2>
              <button type="button" onClick={() => setCounterFor(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-700">They offered: <strong>{counterFor.offered_listing?.title || counterFor.custom_offer}</strong> for your <strong>{counterFor.target_listing?.title}</strong>. Tell them what you'd accept instead.</p>
            <textarea rows={3} required autoFocus placeholder="e.g. I'd accept the laptop plus two bags of maize meal." value={counterText} onChange={(e) => setCounterText(e.target.value)} className={INPUT} />
            <button type="submit" className={`w-full ${PRIMARY} py-2.5`}>Send counter-offer</button>
          </form>
        </Modal>
      )}

      {reviewFor && (
        <Modal onClose={() => setReviewFor(null)} className="max-w-md">
          <form onSubmit={submitReview} className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xl text-slate-950">Rate this trade</h2>
              <button type="button" onClick={() => setReviewFor(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-700">
              Your trade with <strong>{(reviewFor.sender_id === uid ? reviewFor.receiver : reviewFor.sender)?.full_name || 'this member'}</strong> is complete. Ratings are optional, but they help the community.
            </p>
            <div className="space-y-1">
              <span className={LABEL}>Overall trade experience</span>
              <Stars value={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="space-y-1">
              <span className={LABEL}>The offer: {reviewFor.offered_listing?.title || reviewFor.custom_offer || 'item'}</span>
              <Stars value={reviewItemRating} onChange={setReviewItemRating} />
            </div>
            <textarea rows={3} placeholder="Add a comment (optional)" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className={INPUT} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setReviewFor(null)} className={`flex-1 ${SECONDARY_3D} py-2.5`}>Skip for now</button>
              <button type="submit" className={`flex-1 ${PRIMARY} py-2.5`}>Submit ratings</button>
            </div>
          </form>
        </Modal>
      )}

      {safetyPopupFor && (
        <Modal onClose={dismissSafetyPopup} className="max-w-md">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-[#1e7be6] shrink-0" />
              <h2 className="font-extrabold text-xl text-slate-950">Offer accepted! Stay safe at your meetup</h2>
            </div>
            <ul className="space-y-2.5">
              {SAFETY_CHECKLIST.map((tip) => (
                <li key={tip.id} className="flex items-start gap-2 text-sm text-slate-800 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm bg-sky-50 border border-sky-200 rounded-xl p-3 text-slate-800 font-medium">
              {safetyPopupFor.receiver_id === uid
                ? 'After you meet and swap, open Trades and tap "Confirm trade after meetup". The trade stays open until you do.'
                : 'After you meet and swap, the person who accepted your offer will confirm the trade. It stays open until they do.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { const p = safetyPopupFor; dismissSafetyPopup(); openChat(p); }}
                className={`flex-1 ${SECONDARY_3D} py-2.5`}
              >
                Open Trade Chat
              </button>
              <button type="button" onClick={dismissSafetyPopup} className={`flex-1 ${PRIMARY} py-2.5`}>
                I Understand
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeProposal && (
        <Modal onClose={() => setActiveProposal(null)} className="max-w-md h-[75vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            {(() => {
              const amSender = activeProposal.sender_id === uid;
              const partnerId = amSender ? activeProposal.receiver_id : activeProposal.sender_id;
              const partner = amSender ? activeProposal.receiver : activeProposal.sender;
              return (
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => { setActiveProposal(null); openMemberProfile(partnerId, partner || {}); }}
                    className="font-extrabold text-base text-[#1e7be6] underline decoration-2 underline-offset-2 hover:text-[#1559ab] truncate max-w-full text-left"
                    title="View profile"
                  >
                    {partner?.full_name || 'BarterBox Member'}
                  </button>
                  <p className="text-xs font-semibold text-slate-600 line-clamp-1">Trade: {activeProposal.target_listing?.title}</p>
                </div>
              );
            })()}
            <button onClick={() => setActiveProposal(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/60">
            {messages.length === 0 ? (
              <p className="text-sm font-medium text-center text-slate-500 pt-8">Coordinate meetup spots or finalize trade details here.</p>
            ) : messages.map((msg) => {
              const isMe = msg.sender_id === uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-sm font-medium ${isMe ? 'bg-[#1e7be6] text-white rounded-br-none shadow-xs' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs'}`}>{msg.content}</div>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input type="text" placeholder="Write a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1e7be6]" />
            <button type="submit" className="bg-[#1e7be6] text-white p-2.5 rounded-xl shadow-xs hover:bg-[#1a6fd0] active:scale-[0.98]" title="Send"><Send className="w-4 h-4" /></button>
          </form>
        </Modal>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40 shadow-sm">
        <div className="max-w-md mx-auto flex items-end justify-around py-1.5 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-bold relative transition-all ${
              activeTab === 'explore' || activeTab === 'memberProfile'
                ? 'text-[#1e7be6] bg-sky-50'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'explore' || activeTab === 'memberProfile' ? 'stroke-[2.4]' : ''}`} />
            <span>Explore</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-bold relative transition-all ${
              activeTab === 'wishlist'
                ? 'text-[#1e7be6] bg-sky-50'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'wishlist' ? 'stroke-[2.4]' : ''}`} />
            <span>Wishlist</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            aria-label="Add listing"
            title="Add listing"
            className="w-12 h-12 -mt-3 rounded-2xl bg-gradient-to-b from-[#4a9bf2] to-[#1e7be6] hover:from-[#3d90ee] hover:to-[#1a6fd0] text-white shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center border-2 border-white transition-all shrink-0"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-bold relative transition-all ${
              activeTab === 'trades' || activeTab === 'bartered'
                ? 'text-[#1e7be6] bg-sky-50'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'trades' || activeTab === 'bartered' ? 'stroke-[2.4]' : ''}`} />
            <span>Trades</span>
            {needsAction > 0 && (
              <span className="absolute -top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                {needsAction > 9 ? '9+' : needsAction}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-bold relative transition-all ${
              activeTab === 'profile'
                ? 'text-[#1e7be6] bg-sky-50'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.4]' : ''}`} />
            <span>{uid ? 'Profile' : 'Sign In'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
