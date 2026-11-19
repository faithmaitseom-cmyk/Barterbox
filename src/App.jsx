import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  Search, Plus, Heart, MessageSquare, User, MapPin, ArrowLeftRight, Send, Database,
  LogOut, Package, Briefcase, X, Check, RefreshCw, ArrowLeft, Upload, Bell, Star,
  Pencil, Trash2, Pause, Play, CheckCircle2, Settings, HelpCircle, AlertTriangle,
  MessageCircleHeart, ChevronDown, ChevronUp, ShieldCheck, FileText, Scale
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

const SAFETY_CHECKLIST = [
  { id: 'public_spot', text: 'Meet in a busy, well-lit public place during daylight hours (e.g. shopping mall or near a police station).' },
  { id: 'inspect_item', text: 'Inspect goods thoroughly (test electronics, check condition or expiry dates) before handing over your item.' },
  { id: 'backup_plan', text: 'Bring a friend or share your meetup spot and time with someone you trust.' },
  { id: 'clear_terms', text: 'Confirm all swap details and items in Trade Chat before meeting.' }
];

const FAQ_ITEMS = [
  {
    q: 'How does bartering work on BarterBox?',
    a: 'Browse listings, send a barter offer using one of your active items or a custom good/service, negotiate in Trade Chat, and both confirm once the exchange is complete.'
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
    a: 'Always meet in public spaces during the day, inspect items before swapping, and use the Trade Safety Checklist on your Trades screen before finalizing a meetup.'
  }
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80';
const EMPTY_FORM = { title: '', description: '', type: 'good', category: 'Food & Drinks', city: 'Gaborone', looking_for: '', image_url: '' };

const STATUS_STYLE = {
  pending: 'bg-slate-100 text-slate-700', countered: 'bg-amber-100 text-amber-800',
  accepted: 'bg-[#2f6fa8]/15 text-[#2f6fa8]', completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700', withdrawn: 'bg-slate-100 text-slate-500',
  active: 'bg-emerald-100 text-emerald-700', paused: 'bg-amber-100 text-amber-800', traded: 'bg-[#2f6fa8]/15 text-[#2f6fa8]'
};
const TRADE_FILTERS = {
  open: { label: 'Open', statuses: ['pending', 'countered', 'accepted'] },
  done: { label: 'Completed', statuses: ['completed'] },
  closed: { label: 'Closed', statuses: ['rejected', 'withdrawn'] }
};

const INPUT = 'w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm';
const LABEL = 'text-xs font-medium text-slate-700';
const PRIMARY = 'bg-[#2f6fa8] hover:bg-[#2f6fa8]/90 text-white font-semibold rounded-xl text-sm transition';
const BACK_BTN = 'text-xs font-medium text-[#2f6fa8] bg-[#2f6fa8]/10 px-3 py-1.5 rounded-xl flex items-center gap-1';
const CARD = 'bg-white border border-slate-200 rounded-2xl';
const SM = 'text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1';

const ago = (d) => {
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

function SupportEmailLink({ email = SUPPORT_EMAIL, subject = '' }) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return (
    <a
      href={href}
      className="text-[#2f6fa8] font-semibold underline hover:text-[#2f6fa8]/80 break-all"
    >
      {email}
    </a>
  );
}

function Modal({ onClose, children, className = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full shadow-xl ${className}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
          <Star className={`w-7 h-7 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function TermsOfServiceModal({ onClose, onAccept }) {
  return (
    <Modal onClose={onClose} className="max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#2f6fa8]" />
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">BarterBox Terms of Service</h2>
            <p className="text-[11px] text-slate-500">
              Effective date: 1 November 2026 • Gaborone, Botswana
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">1. About these terms</h3>
          <p>
            BarterBox ("BarterBox", "we", "us") is an online marketplace operated from Gaborone, Botswana. It lets people and businesses list goods and services and propose to exchange them with each other, usually without money changing hands.
          </p>
          <p>
            By accessing or using the BarterBox web application, Progressive Web App (PWA) or related services (together, the Platform), including by creating an account or browsing, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use BarterBox.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">2. What BarterBox is, and what it is not</h3>
          <p>
            BarterBox is a venue that connects users. We are not a party to any exchange between users. We do not own, inspect, store, deliver, guarantee or take responsibility for any item or service listed, and we do not check that listings, descriptions, photos or users are accurate, lawful or trustworthy. BarterBox is not an agent, broker, insurer or escrow service for any user.
          </p>
          <p>
            Every exchange is an agreement only between the users involved. You are responsible for deciding whether to trade, with whom, and on what terms.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">3. Who can use BarterBox</h3>
          <p>
            You must be at least 18 years old (the age of majority under the laws of Botswana) and able to enter a legally binding agreement. If you use BarterBox for a business, you confirm that you are authorised to bind that business to these Terms.
          </p>
          <p>
            You may not use BarterBox if we have previously suspended or removed your account, unless we have agreed in writing that you may return.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">4. Your account</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Give accurate and current information, including your name, city and contact details.</li>
            <li>Keep your password confidential. You are responsible for all activity on your account.</li>
            <li>Tell us promptly at <SupportEmailLink subject="Account Security - BarterBox" /> if you think someone else has accessed your account.</li>
            <li>One person or business may hold only one account unless we agree otherwise.</li>
            <li>Your profile name, city, profile picture, ratings and reviews are visible to other users.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">5. Listings</h3>
          <p>When you create a listing you confirm that:</p>
          <ul className="list-disc pl-4 space-y-1">
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
          <h3 className="font-bold text-sm text-slate-900">6. Prohibited items and conduct</h3>
          <p>You must not list, offer or request:</p>
          <ul className="list-disc pl-4 space-y-1">
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
          <ul className="list-disc pl-4 space-y-1">
            <li>harass, threaten, discriminate against or defraud other users;</li>
            <li>ask for payment of money, deposits or fees outside the barter itself in order to scam or mislead;</li>
            <li>post false reviews, manipulate ratings, or offer rewards for reviews;</li>
            <li>use bots, scrapers or other automated tools, or try to break, probe or overload BarterBox;</li>
            <li>use BarterBox to send spam or unrelated advertising;</li>
            <li>try to avoid our rules by creating new accounts after being suspended.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">7. Barter proposals and agreements</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>A user can send a proposal on another user's listing, offering one of their own listings or a custom offer, and can attach a message.</li>
            <li>The listing owner can accept, decline or send a counter-offer. The sender can withdraw a proposal that is still pending.</li>
            <li>A trade is agreed only when both users have accepted the same terms in BarterBox. Messages in the chat are for discussion and do not by themselves make an agreement.</li>
            <li>Once a proposal is accepted, both users are expected to complete the exchange honestly and on time. Either user may mark their side of the exchange as completed. A trade is treated as complete when both users have confirmed it.</li>
            <li>If you can no longer go ahead, tell the other user as early as possible and use the tools in the app to update the status.</li>
            <li>BarterBox does not hold goods, valuables or money, and does not provide escrow.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">8. Meeting, delivery and safety</h3>
          <p>You are responsible for arranging how and where an exchange happens. We strongly encourage you to:</p>
          <ul className="list-disc pl-4 space-y-1">
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
          <h3 className="font-bold text-sm text-slate-900">9. Reviews and ratings</h3>
          <p>
            After a completed trade, each user may rate and review the other. Reviews must be honest, based on your own experience, and must not contain abuse, hate speech, private information or false statements. We may remove reviews that break these rules, but we do not edit them or verify that they are correct.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">10. Fees</h3>
          <p>
            BarterBox is currently free to use. We do not charge commission or transaction fees on exchanges.
          </p>
          <p>
            We may introduce optional paid features in future, such as sponsored listings, featured advertisements, business advertising or premium visibility. If we do, we will tell you before it applies to you, and nothing will be charged without your clear agreement.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">11. Taxes and legal compliance</h3>
          <p>
            You are solely responsible for any tax, duty, licensing, municipal permits and other legal or regulatory requirements that apply to your trades under the laws of the Republic of Botswana. Exchanging goods or services can have tax consequences, particularly if you trade regularly or as a business. We do not give tax or legal advice and do not collect or pay tax on your behalf.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">12. Your content</h3>
          <p>
            You keep ownership of the text, photos and other content you post ("your content"). You give BarterBox a non-exclusive, worldwide, royalty-free licence to host, store, display, reproduce and distribute your content, in order to run, improve and promote BarterBox. This licence ends when you delete your content or your account, except for copies that other users have already received in messages, and copies kept in backups or where the law requires us to keep them.
          </p>
          <p>You confirm that you have the right to give this licence.</p>
          <p>
            BarterBox's name, logo, design and software belong to us or our licensors. You may not copy or reuse them without our written permission.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">13. Privacy and your data</h3>
          <p>
            We collect and use personal information, such as your name, email address, city, phone number, listings, messages and trade history, to run BarterBox, keep users safe and improve the service. Our Privacy Policy (available in the app) explains what we collect, why, who we share it with, how long we keep it, and your rights under the data protection laws that apply to you.
          </p>
          <p>
            Messages in BarterBox are private between the people in a conversation, but we may review them if needed to investigate a report, prevent fraud or abuse, or meet a legal obligation.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">14. Reporting problems and enforcement</h3>
          <p>You can report a listing, message, review or user to <SupportEmailLink subject="Report Issue - BarterBox" />. We may, at our discretion and with or without notice:</p>
          <ul className="list-disc pl-4 space-y-1">
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
          <h3 className="font-bold text-sm text-slate-900">15. Availability and changes to the service</h3>
          <p>
            We work to keep BarterBox running, but we do not promise that it will always be available, secure or free from errors. We may change, pause or stop any part of the service at any time, for example for maintenance or when we add new features.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">16. Disclaimers</h3>
          <p>
            BarterBox is provided "as is" and "as available". To the fullest extent the law allows, we do not give any warranty about the quality, safety, legality, value or suitability of any item or service, the identity or reliability of any user, or that the service will be uninterrupted or error-free.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">17. Limit of our responsibility</h3>
          <p>To the fullest extent the law allows, the following applies to BarterBox and to its founders, operators and affiliates:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>we are not liable for any loss, damage, injury or dispute arising from an exchange between users, or from content posted by users;</li>
            <li>we are not liable for indirect or consequential loss, loss of profit, loss of data or loss of opportunity;</li>
            <li>if we are found liable to you despite this, our total liability is limited to BWP 500 in total.</li>
          </ul>
          <p>
            Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including for fraud or for death or personal injury caused by our negligence.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">18. Your responsibility to us</h3>
          <p>
            You agree to compensate us for losses, claims and costs (including reasonable legal fees) arising from your content, your breach of these Terms or the law, or your dealings with other users, to the extent the law allows.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">19. Closing your account</h3>
          <p>
            You can stop using BarterBox and delete your account at any time. Before you do, complete or cancel any open trades. We may suspend or close your account if you break these Terms, create risk or harm for others or for us, or if we are required to by law. Sections that by their nature should continue (for example content licence for copies already delivered, disclaimers, liability, indemnity and governing law) will continue after your account ends.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">20. Changes to these terms</h3>
          <p>
            We may update these Terms from time to time. We will post the new version in the app and update the effective date, and for significant changes we will tell you by email or in the app. If you keep using BarterBox after the changes take effect, you accept them. If you do not agree, you should stop using BarterBox and close your account.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">21. Governing law and disputes</h3>
          <p>
            These Terms are governed by the laws of the Republic of Botswana. We encourage you to contact us first at <SupportEmailLink subject="Complaint - BarterBox" /> so we can try to resolve a complaint informally. If that does not work, the courts of Botswana have exclusive jurisdiction. Nothing in this section limits any rights you have under consumer protection or data protection laws that cannot be waived.
          </p>
          <p>
            As BarterBox expands into other countries, additional or local terms may apply to users there. We will make these available before they apply.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">22. General</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>These Terms, together with our Privacy Policy, are the whole agreement between you and us about BarterBox.</li>
            <li>If a part of these Terms is found unenforceable, the rest continues to apply.</li>
            <li>If we do not enforce a right straight away, we have not given it up.</li>
            <li>You may not transfer your account or rights under these Terms without our consent. We may transfer ours as part of a sale or reorganisation of the business.</li>
            <li>We may contact you by email or in-app notifications about your account, trades and changes to the service.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">23. Contact</h3>
          <p>BarterBox Gaborone, Botswana Email: <SupportEmailLink subject="Contact BarterBox" /></p>
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 rounded-xl text-xs transition">
          Close
        </button>
        {onAccept && (
          <button type="button" onClick={onAccept} className={`flex-1 ${PRIMARY} py-2.5 text-xs`}>
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
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#2f6fa8]" />
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">BarterBox Privacy Policy</h2>
            <p className="text-[11px] text-slate-500">
              Gaborone, Botswana • <SupportEmailLink subject="BarterBox Privacy Inquiry" />
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">1. Who we are</h3>
          <p>
            BarterBox ("BarterBox", "we", "us") is an online marketplace for exchanging goods and services, operated from Gaborone, Botswana. For the personal information described in this policy, we are the "data controller", meaning we decide how and why it is used.
          </p>
          <p><strong>Contact for privacy questions and requests:</strong> <SupportEmailLink subject="Privacy Request - BarterBox" /></p>
          <p>
            This policy explains what we collect, why, who sees it, how long we keep it, and the choices you have. It should be read together with our Terms of Service. We aim to follow Botswana's Data Protection Act, which replaced the 2018 Act, and the guidance of the Information and Data Protection Commission.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">2. Information we collect</h3>
          <p className="font-semibold text-slate-800">Information you give us</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Account details:</strong> your full name, email address and password, and the city or town you choose.</li>
            <li><strong>Profile details:</strong> a profile picture, phone number and short bio, if you add them.</li>
            <li><strong>Listings:</strong> titles, descriptions, categories, location, photos, and what you want in exchange.</li>
            <li><strong>Trades:</strong> proposals, counter-offers, your messages in Trade Chat, confirmations of completed trades, and the reviews and ratings you give.</li>
            <li><strong>Activity you choose to save:</strong> items on your wishlist.</li>
            <li><strong>Support messages:</strong> anything you send us when you report a problem or ask for help.</li>
          </ul>
          <p className="font-semibold text-slate-800 pt-1">Information collected automatically</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Device and usage data:</strong> browser type, device type, operating system, language, pages and features you use, and the time and date of your visits.</li>
            <li><strong>Approximate technical identifiers:</strong> your IP address and log entries, used for security and fault-finding.</li>
            <li><strong>Browser storage:</strong> small pieces of data stored on your device, such as a sign-in session, so that you stay logged in and the app works properly.</li>
          </ul>
          <p className="font-semibold text-slate-800 pt-1">Information from others</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Other users may mention you in messages or reviews, and we may receive reports about you or your listings.</li>
          </ul>
          <p className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl">
            Please do not post sensitive information (such as ID numbers, bank details or health information) in listings, photos or messages. Photos you upload may contain hidden location data, so consider removing it before uploading.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">3. How we use your information and why</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-semibold">
                <tr>
                  <th className="p-2 border-b border-slate-200">What we do</th>
                  <th className="p-2 border-b border-slate-200">Why we are allowed to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2">Create and manage your account, show your listings and profile, and let you send proposals, chat, save items and leave reviews</td>
                  <td className="p-2">To provide the service you asked for</td>
                </tr>
                <tr>
                  <td className="p-2">Send notifications about messages, proposals and trade status, and service emails such as password resets</td>
                  <td className="p-2">To provide the service, and our legitimate interest in keeping you informed</td>
                </tr>
                <tr>
                  <td className="p-2">Keep BarterBox safe: detect scams, fake reviews, prohibited items and abuse, and enforce our Terms</td>
                  <td className="p-2">Our legitimate interest in running a safe marketplace, and legal obligations</td>
                </tr>
                <tr>
                  <td className="p-2">Fix faults, measure performance and improve features</td>
                  <td className="p-2">Our legitimate interest in improving the service</td>
                </tr>
                <tr>
                  <td className="p-2">Comply with the law, respond to lawful requests from authorities, and protect our rights</td>
                  <td className="p-2">Legal obligation and legitimate interest</td>
                </tr>
                <tr>
                  <td className="p-2">Send you news or marketing about BarterBox, if we ever do</td>
                  <td className="p-2">Your consent, which you can withdraw at any time</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-medium text-slate-800">We do not sell your personal information. We do not use your messages to show advertising.</p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">4. Who can see your information</h3>
          <p className="font-semibold text-slate-800">Other users</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Your full name, city, profile picture, ratings, reviews you have received and your active listings are visible to other users and may be visible to visitors who are not signed in.</li>
            <li>Your messages are visible only to you and the other person in that conversation, plus us if needed to investigate a report, as described in the Terms.</li>
            <li>We do not show your email address or phone number to other users unless you choose to share them in a message.</li>
          </ul>
          <p className="font-semibold text-slate-800 pt-1">Service providers</p>
          <p>We use trusted companies to help run BarterBox, and they may handle your information only on our instructions. Currently these include:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Supabase</strong>, for our database, sign-in and photo storage;</li>
            <li><strong>Vercel</strong>, for hosting the app;</li>
            <li><strong>Google (Gmail)</strong>, for receiving and replying to support emails.</li>
          </ul>
          <p className="font-semibold text-slate-800 pt-1">Authorities and legal reasons</p>
          <p>We may disclose information to the police, courts or regulators where the law requires it, or where we believe it is necessary to protect someone's safety, investigate fraud or enforce our Terms.</p>
          <p className="font-semibold text-slate-800 pt-1">Business changes</p>
          <p>If BarterBox is sold, merged or reorganised, personal information may be transferred to the new owner, who must continue to protect it under this policy.</p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">5. Sending information outside Botswana</h3>
          <p>
            Our providers may store or process your information on servers in other countries, such as Ireland (Europe). Where we do this, we take reasonable steps, such as using providers with appropriate security commitments and contracts, to make sure your information stays protected in line with Botswana's data protection law.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">6. How long we keep it</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Account and profile:</strong> until you delete your account.</li>
            <li><strong>Listings:</strong> until you delete them or your account. Deleted listings are hidden from other users straight away and removed from our systems within (30) days, except where we must keep them (for example, as part of a trade record).</li>
            <li><strong>Messages and trade records:</strong> while needed for the trade and for (12) months afterwards, so we can deal with disputes, reports and fraud, unless the law requires longer.</li>
            <li><strong>Reviews:</strong> kept so the community can see an honest record. When you delete your account we remove your name from your reviews or anonymise them.</li>
            <li><strong>Logs and security records:</strong> up to (12) months.</li>
            <li><strong>Backups:</strong> deleted information is removed from backups on their normal cycle, usually within [90] days.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">7. Keeping your information secure</h3>
          <p>
            We use reasonable technical and organisational measures, including encrypted connections, access controls that limit what each user can see in the database, limited staff access and secure providers. No system is completely secure, so we cannot promise absolute security. Please choose a strong, unique password and keep it private.
          </p>
          <p>
            If a breach is likely to put your rights at risk, we will notify you and the Information and Data Protection Commission as the law requires.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">8. Your rights</h3>
          <p>Subject to the law, you can ask us to:</p>
          <ul className="list-disc pl-4 space-y-1">
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
          <h3 className="font-bold text-sm text-slate-900">9. Children</h3>
          <p>
            BarterBox is for people aged 18 and over. We do not knowingly collect information from anyone under 18. If you think a child has given us personal information, please tell us at <SupportEmailLink subject="Underage Account Report - BarterBox" /> and we will delete it.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">10. Cookies and similar technologies</h3>
          <p>
            BarterBox uses browser storage and similar technologies that are necessary to keep you signed in and make the app work, including when you install it on your phone.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">11. Links and third parties</h3>
          <p>
            BarterBox may contain links to other websites or services. We are not responsible for their privacy practices, so please read their policies.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">12. Future features</h3>
          <p>
            We plan to keep BarterBox free and may later offer sponsored listings or business advertising. If this means using your information in new ways, we will update this policy, tell you in advance and, where the law requires, ask for your consent.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">13. Changes to this policy</h3>
          <p>
            We may update this policy from time to time. We will post the new version in the app with a new effective date, and tell you about significant changes by email or in the app. Using BarterBox after changes take effect means you accept them.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-900">14. Contact us</h3>
          <p>BarterBox. Gaborone, Botswana • Email: <SupportEmailLink subject="Contact BarterBox" /></p>
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 rounded-xl text-xs transition">
          Close
        </button>
        {onAccept && (
          <button type="button" onClick={onAccept} className={`flex-1 ${PRIMARY} py-2.5 text-xs`}>
            I Agree & Close
          </button>
        )}
      </div>
    </Modal>
  );
}

export default function App() {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('bb_sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('bb_sb_key') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('bb_sb_url'));

  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('open');

  const [checkedSafety, setCheckedSafety] = useState({});

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
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

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
        setMyListings([]);
        setNotifications([]);
        setMyReviews([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    fetchListings();
    if (uid) { fetchProfile(); fetchFavorites(); fetchProposals(); fetchMyListings(); fetchNotifications(); fetchMyReviews(); }
  }, [session]);

  useEffect(() => {
    if (!supabase || !uid) return;
    const ch = supabase.channel('bb-notes-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => { fetchNotifications(); fetchProposals(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  useEffect(() => {
    if (!supabase || !activeProposal) return;
    const id = activeProposal.id;
    const ch = supabase.channel('bb-chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `proposal_id=eq.${id}` },
        () => loadMessages(id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeProposal?.id]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('bb_sb_url', supabaseUrl.trim());
    localStorage.setItem('bb_sb_key', supabaseKey.trim());
    window.location.reload();
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

  const toggleSafetyCheck = (proposalId, stepId) => {
    setCheckedSafety((prev) => {
      const current = prev[proposalId] || {};
      return {
        ...prev,
        [proposalId]: { ...current, [stepId]: !current[stepId] }
      };
    });
  };

  const fetchListings = async () => {
    setLoadingData(true);
    setLoadError('');
    let { data, error } = await supabase.from('listings')
      .select('*, profiles(full_name, city, avatar_url, rating)')
      .eq('status', 'active').order('created_at', { ascending: false });
    if (error) {
      console.error('Listings query failed, retrying without seller details:', error);
      ({ data, error } = await supabase.from('listings').select('*')
        .eq('status', 'active').order('created_at', { ascending: false }));
    }
    if (error) setLoadError(error.message);
    if (data) setListings(data);
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
    const { data } = await supabase.from('trade_proposals').select(`
      *,
      sender:profiles!trade_proposals_sender_id_fkey(full_name, city),
      receiver:profiles!trade_proposals_receiver_id_fkey(full_name, city),
      target_listing:listings!trade_proposals_target_listing_id_fkey(id, title, image_url, type),
      offered_listing:listings!trade_proposals_offered_listing_id_fkey(id, title, image_url, type),
      completion:trade_completions(*),
      reviews(reviewer_id)
    `).or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).order('created_at', { ascending: false });
    if (data) setProposals(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data);
  };

  const fetchMyReviews = async () => {
    const { data } = await supabase.from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewee_id', uid).order('created_at', { ascending: false }).limit(10);
    if (data) setMyReviews(data);
  };

  const loadMessages = async (proposalId) => {
    const { data } = await supabase.from('messages').select('*, profiles(full_name)')
      .eq('proposal_id', proposalId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const refreshAll = () => { fetchListings(); fetchMyListings(); fetchProposals(); };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (authMode === 'signup' && (!acceptedTerms || !acceptedPrivacy)) {
      setAuthMessage('Please read and agree to both the Terms of Service and Privacy Policy before creating an account.');
      return;
    }
    setAuthLoading(true);
    setAuthMessage('');
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: { full_name: fullName, city } }
      });
      if (error) setAuthMessage(error.message);
      else {
        if (data?.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName || email.split('@')[0], city: city || 'Gaborone' });
        }
        const { data: login, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) setAuthMessage('Account created! Please sign in.');
        else if (login?.session) { setSession(login.session); setActiveTab('explore'); }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setAuthMessage(error.message);
      else { if (data?.session) setSession(data.session); setActiveTab('explore'); }
    }
    setAuthLoading(false);
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

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setListingError(''); setShowListingModal(true); };
  const openEdit = (l) => {
    if (!canEditListing(l)) {
      setLoadError('Listings can only be edited within 1 hour of posting. Delete this listing and post a new one instead.');
      return;
    }
    setEditingId(l.id);
    setForm({ title: l.title, description: l.description || '', type: l.type || 'good', category: l.category, city: l.city, looking_for: l.looking_for || '', image_url: l.image_url || '' });
    setListingError('');
    setShowListingModal(true);
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setSubmittingListing(true);
    setListingError('');
    const body = {
      title: form.title.trim(), description: form.description.trim(), type: form.type,
      category: form.category, city: form.city, looking_for: form.looking_for.trim(),
      image_url: form.image_url.trim() || FALLBACK_IMG
    };
    const { error } = editingId
      ? await supabase.from('listings').update(body).eq('id', editingId)
      : await supabase.from('listings').insert({ ...body, owner_id: uid, status: 'active' });
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
    const key = p.sender_id === uid ? 'proposer_confirmed' : 'owner_confirmed';
    const { error } = await supabase.from('trade_completions').update({ [key]: true }).eq('proposal_id', p.id);
    if (error) alert(error.message);
    else { refreshAll(); fetchNotifications(); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const p = reviewFor;
    const { error } = await supabase.from('reviews').insert({
      proposal_id: p.id, reviewer_id: uid,
      reviewee_id: p.sender_id === uid ? p.receiver_id : p.sender_id,
      rating: reviewRating, comment: reviewComment.trim() || null
    });
    if (error) { alert('Could not save review: ' + error.message); return; }
    setReviewFor(null); setReviewRating(5); setReviewComment('');
    fetchProposals();
  };

  const openChat = async (p) => { setActiveProposal(p); setMessages([]); await loadMessages(p.id); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeProposal || !uid) return;
    const text = newMessage.trim();
    setNewMessage('');
    const { error } = await supabase.from('messages').insert({ proposal_id: activeProposal.id, sender_id: uid, content: text });
    if (error) alert(error.message);
    else loadMessages(activeProposal.id);
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

  const filteredListings = useMemo(() => listings.filter((item) => {
    if (activeTab === 'wishlist' && !favorites.includes(item.id)) return false;
    if (selectedCity !== 'All Cities' && item.city !== selectedCity) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (listingTypeFilter !== 'all' && item.type !== listingTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (![item.title, item.description, item.looking_for].some((t) => t?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [listings, activeTab, favorites, selectedCity, selectedCategory, listingTypeFilter, searchQuery]);

  const offerable = myListings.filter((l) => l.status === 'active');
  const unread = notifications.filter((n) => !n.read).length;
  const needsAction = proposals.filter((p) =>
    (p.status === 'pending' && p.receiver_id === uid) || (p.status === 'countered' && p.sender_id === uid)).length;
  const visibleTrades = proposals.filter((p) => TRADE_FILTERS[tradeFilter].statuses.includes(p.status));

  const navItems = [
    { id: 'explore', label: 'Explore', Icon: Search },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart },
    { id: 'trades', label: 'Trades', Icon: ArrowLeftRight },
    { id: 'profile', label: uid ? 'Profile' : 'Sign In', Icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#2f6fa8]" />
          {supabase
            ? <span className="text-emerald-400 font-medium">● Connected to Supabase</span>
            : <span className="text-amber-300 font-medium">● Database Not Connected</span>}
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="underline text-[#2f6fa8] hover:text-white">
          {showConfig ? 'Hide Keys' : 'Configure Supabase'}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveConfig} className="bg-slate-800 text-white p-4 border-b border-slate-700">
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-xs text-slate-300">Paste your Supabase <strong>Project URL</strong> and <strong>Anon Public Key</strong>.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="url" required placeholder="https://your-project.supabase.co" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm text-white" />
              <input type="text" required placeholder="eyJhbGciOiJIUzI1Ni..." value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} className="px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm text-white" />
            </div>
            <button type="submit" className="bg-[#2f6fa8] hover:bg-[#2f6fa8]/90 text-white text-xs font-semibold px-4 py-2 rounded-lg">Save & Connect</button>
          </div>
        </form>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeTab !== 'explore' && (
              <button onClick={() => setActiveTab('explore')} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Back to Dashboard">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <img src="/icon-192.png" alt="BarterBox logo" className="w-10 h-10 rounded-2xl shadow-sm object-cover" />
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 cursor-pointer" onClick={() => setActiveTab('explore')}>
                Barter<span className="text-[#2f6fa8]">Box</span>
              </h1>
              <p className="text-[11px] text-slate-500">Botswana's Peer-to-Peer Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-xs font-semibold text-[#2f6fa8] bg-[#2f6fa8]/10 hover:bg-[#2f6fa8]/20 px-3 py-2 rounded-xl transition"
            >
              Install App
            </button>
            {uid && (
              <button onClick={() => setActiveTab('notifications')} className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700" title="Notifications">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
              </button>
            )}
            {uid ? (
              <button onClick={openCreate} className={`${PRIMARY} font-medium px-3.5 py-2 flex items-center gap-1.5 shadow-sm`}>
                <Plus className="w-4 h-4" /><span>Post Item</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('profile')} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl">Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        {(activeTab === 'explore' || activeTab === 'wishlist') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input type="text" placeholder="Search food, smartphones, plumbing, furniture..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2f6fa8]" />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#2f6fa8] absolute left-3 top-3 pointer-events-none" />
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#2f6fa8]">
                    {BW_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <select value={listingTypeFilter} onChange={(e) => setListingTypeFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#2f6fa8]">
                  <option value="all">Goods & Services</option>
                  <option value="good">Goods Only</option>
                  <option value="service">Services Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${selectedCategory === cat ? 'bg-[#2f6fa8] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>{cat}</button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <h2 className="font-bold text-base text-slate-800">{activeTab === 'wishlist' ? 'Saved Wishlist Items' : 'Available for Barter'}</h2>
              <button onClick={fetchListings} className="text-xs text-[#2f6fa8] flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
            </div>

            {loadError && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs"><strong>Notice:</strong> {loadError}</div>}
            {!supabase ? (
              <div className={`${CARD} p-8 text-center space-y-2`}>
                <Database className="w-8 h-8 text-[#2f6fa8] mx-auto" />
                <h3 className="font-semibold text-slate-800">Connect Your Supabase Backend</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">Enter your Project URL and Anon Key in the top banner.</p>
              </div>
            ) : loadingData ? (
              <div className="text-center py-12 text-sm text-slate-500">Loading Botswana marketplace...</div>
            ) : filteredListings.length === 0 ? (
              <div className={`${CARD} p-10 text-center space-y-2`}>
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">No listings found</p>
                <p className="text-xs text-slate-500">Try clearing filters or be the first to post an item!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((item) => {
                  const isFav = favorites.includes(item.id);
                  return (
                    <div key={item.id} onClick={() => setSelectedListing(item)} className={`${CARD} overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col`}>
                      <div className="relative h-44 bg-slate-100">
                        <img src={item.image_url || FALLBACK_IMG} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          {item.type === 'service' ? <Briefcase className="w-3 h-3 text-amber-400" /> : <Package className="w-3 h-3 text-[#2f6fa8]" />}
                          {item.type === 'service' ? 'Service' : 'Good'}
                        </span>
                        <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-105 transition" title="Save to wishlist">
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-[#2f6fa8]" /><span>{item.city}</span><span>•</span><span>{item.category}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        <div className="bg-[#2f6fa8]/10 border border-[#2f6fa8]/20 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#2f6fa8] block">Looking For:</span>
                          <p className="text-xs font-medium text-slate-800 line-clamp-1 mt-0.5">{item.looking_for || 'Open to fair barter offers'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg text-slate-900">Your Barter Proposals & History</h2>
            {!uid ? (
              <div className={`${CARD} p-8 text-center space-y-3`}>
                <p className="text-sm text-slate-600">Sign in to view your incoming and outgoing barter offers.</p>
                <button onClick={() => setActiveTab('profile')} className={`${PRIMARY} font-medium px-5 py-2`}>Go to Sign In</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {Object.entries(TRADE_FILTERS).map(([key, f]) => (
                    <button key={key} onClick={() => setTradeFilter(key)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${tradeFilter === key ? 'bg-[#2f6fa8] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{f.label}</button>
                  ))}
                </div>
                {visibleTrades.length === 0 ? (
                  <div className={`${CARD} p-8 text-center`}>
                    <p className="text-sm text-slate-500">{tradeFilter === 'open' ? 'No open trades. Browse items and make an offer!' : 'Nothing here yet.'}</p>
                    <button onClick={() => setActiveTab('explore')} className={`${PRIMARY} mt-3 text-xs font-medium px-4 py-2`}>Browse Marketplace</button>
                  </div>
                ) : visibleTrades.map((p) => {
                  const amSender = p.sender_id === uid;
                  const other = amSender ? p.receiver : p.sender;
                  const c = Array.isArray(p.completion) ? p.completion[0] : p.completion;
                  const myDone = c ? (amSender ? c.proposer_confirmed : c.owner_confirmed) : false;
                  const theirDone = c ? (amSender ? c.owner_confirmed : c.proposer_confirmed) : false;
                  const reviewed = (p.reviews || []).some((r) => r.reviewer_id === uid);

                  const proposalChecks = checkedSafety[p.id] || {};
                  const checkedCount = SAFETY_CHECKLIST.filter((s) => proposalChecks[s.id]).length;
                  const allSafetyChecked = checkedCount === SAFETY_CHECKLIST.length;

                  return (
                    <div key={p.id} className={`${CARD} p-4 space-y-3 shadow-sm`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${amSender ? 'bg-[#2f6fa8]/15 text-[#2f6fa8]' : 'bg-amber-100 text-amber-800'}`}>
                          {amSender ? `Sent to ${other?.full_name || 'Member'}` : `Offer from ${other?.full_name || 'Member'}`}
                        </span>
                        <span className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                        <div><span className="text-slate-400 block">Target Item:</span><strong className="text-slate-800 text-sm">{p.target_listing?.title}</strong></div>
                        <div><span className="text-slate-400 block">Offered in Exchange:</span><strong className="text-[#2f6fa8] text-sm">{p.offered_listing?.title || p.custom_offer}</strong></div>
                      </div>
                      {p.status === 'countered' && p.counter_text && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                          <span className="font-bold text-amber-800 block">Counter-offer from {p.receiver?.full_name || 'owner'}:</span>
                          <p className="text-slate-800 mt-0.5">{p.counter_text}</p>
                        </div>
                      )}

                      {['pending', 'countered', 'accepted'].includes(p.status) && (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#2f6fa8] shrink-0" />
                              Safety Tips Before Finalizing Trade Meet
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${allSafetyChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                              {checkedCount}/{SAFETY_CHECKLIST.length} ticked
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {SAFETY_CHECKLIST.map((tip) => {
                              const isTicked = !!proposalChecks[tip.id];
                              return (
                                <label key={tip.id} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isTicked}
                                    onChange={() => toggleSafetyCheck(p.id, tip.id)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f6fa8] focus:ring-[#2f6fa8]"
                                  />
                                  <span className={isTicked ? 'line-through text-slate-500' : ''}>{tip.text}</span>
                                </label>
                              );
                            })}
                          </div>
                          {allSafetyChecked && (
                            <p className="text-[11px] font-semibold text-emerald-700">
                              ✓ All safety checks ticked — you're ready to finalize your meetup details.
                            </p>
                          )}
                        </div>
                      )}

                      {p.status === 'accepted' && (
                        <div className="bg-[#2f6fa8]/10 border border-[#2f6fa8]/20 rounded-xl p-3 text-xs space-y-2">
                          <p className="font-bold text-[#2f6fa8]">Both of you must confirm once the exchange has happened.</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={myDone ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>{myDone ? '✓ You confirmed' : 'You: not yet'}</span>
                            <span className={theirDone ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>{theirDone ? `✓ ${other?.full_name || 'They'} confirmed` : `${other?.full_name || 'They'}: not yet`}</span>
                          </div>
                          {!myDone && <button onClick={() => confirmCompletion(p)} className={`${SM} bg-emerald-600 text-white`}><CheckCircle2 className="w-3.5 h-3.5" /> Confirm trade completed</button>}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button onClick={() => openChat(p)} className={`${SM} bg-slate-900 text-white`}><MessageSquare className="w-3.5 h-3.5" /> Trade Chat</button>
                        <div className="flex flex-wrap gap-2">
                          {p.status === 'pending' && !amSender && (
                            <>
                              <button onClick={() => updateProposal(p.id, { status: 'accepted' })} className={`${SM} bg-emerald-600 text-white`}><Check className="w-3.5 h-3.5" /> Accept</button>
                              <button onClick={() => { setCounterFor(p); setCounterText(''); }} className={`${SM} bg-amber-100 text-amber-800`}><ArrowLeftRight className="w-3.5 h-3.5" /> Counter</button>
                              <button onClick={() => updateProposal(p.id, { status: 'rejected' })} className={`${SM} bg-rose-100 text-rose-700`}><X className="w-3.5 h-3.5" /> Decline</button>
                            </>
                          )}
                          {p.status === 'countered' && amSender && (
                            <>
                              <button onClick={() => updateProposal(p.id, { status: 'accepted' })} className={`${SM} bg-emerald-600 text-white`}><Check className="w-3.5 h-3.5" /> Accept counter</button>
                              <button onClick={() => updateProposal(p.id, { status: 'rejected' })} className={`${SM} bg-rose-100 text-rose-700`}><X className="w-3.5 h-3.5" /> Decline</button>
                            </>
                          )}
                          {p.status === 'countered' && !amSender && <span className="text-xs text-slate-500 self-center">Waiting for their reply</span>}
                          {['pending', 'countered'].includes(p.status) && amSender && (
                            <button onClick={() => updateProposal(p.id, { status: 'withdrawn' })} className={`${SM} bg-slate-100 text-slate-700`}>Withdraw</button>
                          )}
                          {p.status === 'completed' && !reviewed && (
                            <button onClick={() => { setReviewFor(p); setReviewRating(5); setReviewComment(''); }} className={`${SM} bg-amber-400 text-slate-900`}><Star className="w-3.5 h-3.5" /> Leave a review</button>
                          )}
                          {p.status === 'completed' && reviewed && <span className="text-xs text-emerald-700 font-semibold self-center">✓ Review submitted</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Notifications</h2>
              {unread > 0 && <button onClick={markAllRead} className={BACK_BTN}><Check className="w-3.5 h-3.5" /> Mark all as read</button>}
            </div>
            {notifications.length === 0 ? (
              <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>You're all caught up. New offers, messages and trade updates will show here.</div>
            ) : notifications.map((n) => (
              <button key={n.id} onClick={() => markRead(n)} className={`${CARD} w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 ${n.read ? '' : 'border-[#2f6fa8]/40 bg-[#2f6fa8]/5'}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-[#2f6fa8]'}`} />
                <span className="flex-1">
                  <span className="text-sm text-slate-800 block">{n.body}</span>
                  <span className="text-[11px] text-slate-400">{ago(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto space-y-3">
            <button onClick={() => setActiveTab('explore')} className={BACK_BTN}><ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard</button>
            {isPasswordRecovery && uid ? (
              <div className={`${CARD} p-6 shadow-sm space-y-4`}>
                <div className="text-center">
                  <h2 className="font-bold text-xl text-slate-900">Set a New Password</h2>
                  <p className="text-xs text-slate-500 mt-1">Enter and confirm your new BarterBox password below.</p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-3">
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
                    <p className="text-xs text-[#2f6fa8] bg-[#2f6fa8]/10 p-2.5 rounded-lg">{recoveryFeedback}</p>
                  )}
                  <button type="submit" disabled={updatingPassword} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                    {updatingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              </div>
            ) : !uid ? (
              <div className={`${CARD} p-6 shadow-sm space-y-4`}>
                {authMode === 'login' && resetMode ? (
                  <>
                    <div className="text-center">
                      <h2 className="font-bold text-xl text-slate-900">Reset Your Password</h2>
                      <p className="text-xs text-slate-500 mt-1">We'll email you a recovery link to set a new password.</p>
                    </div>
                    <form onSubmit={handleSendResetEmail} className="space-y-3">
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
                        <p className="text-xs text-[#2f6fa8] bg-[#2f6fa8]/10 p-2.5 rounded-lg">{resetFeedback}</p>
                      )}
                      <button type="submit" disabled={sendingReset || !supabase} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                        {sendingReset ? 'Sending Link...' : 'Send Reset Link'}
                      </button>
                    </form>
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setResetMode(false); setResetFeedback(''); }}
                        className="text-xs text-[#2f6fa8] font-medium hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h2 className="font-bold text-xl text-slate-900">{authMode === 'login' ? 'Welcome Back to BarterBox' : 'Join BarterBox Botswana'}</h2>
                      <p className="text-xs text-slate-500 mt-1">Zero fees. Direct peer-to-peer trading.</p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-3">
                      {authMode === 'signup' && (
                        <>
                          <div>
                            <label className={LABEL}>Full Name</label>
                            <input type="text" required placeholder="e.g. Kagiso Molefe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT} />
                          </div>
                          <div>
                            <label className={LABEL}>City / Town</label>
                            <select value={city} onChange={(e) => setCity(e.target.value)} className={`${INPUT} bg-white`}>
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
                            className="text-xs text-[#2f6fa8] font-medium hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {authMode === 'signup' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                          <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f6fa8] focus:ring-[#2f6fa8]"
                            />
                            <span>
                              I am 18 or older and I agree to the{' '}
                              <button
                                type="button"
                                onClick={() => setLegalModal('terms')}
                                className="text-[#2f6fa8] font-semibold underline hover:text-[#2f6fa8]/80"
                              >
                                Terms of Service
                              </button>
                              .
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={acceptedPrivacy}
                              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f6fa8] focus:ring-[#2f6fa8]"
                            />
                            <span>
                              I have read and agree to the{' '}
                              <button
                                type="button"
                                onClick={() => setLegalModal('privacy')}
                                className="text-[#2f6fa8] font-semibold underline hover:text-[#2f6fa8]/80"
                              >
                                Privacy Policy
                              </button>
                              .
                            </span>
                          </label>
                        </div>
                      )}

                      {authMessage && <p className="text-xs text-[#2f6fa8] bg-[#2f6fa8]/10 p-2.5 rounded-lg">{authMessage}</p>}
                      <button
                        type="submit"
                        disabled={authLoading || !supabase || (authMode === 'signup' && (!acceptedTerms || !acceptedPrivacy))}
                        className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}
                      >
                        {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Free Account'}
                      </button>
                    </form>
                    <div className="text-center pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === 'login' ? 'signup' : 'login');
                          setAuthMessage('');
                          setResetMode(false);
                        }}
                        className="text-xs text-[#2f6fa8] font-medium hover:underline block mx-auto"
                      >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                      </button>
                      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                        <button
                          type="button"
                          onClick={() => setLegalModal('terms')}
                          className="hover:text-[#2f6fa8] underline"
                        >
                          Terms of Service
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setLegalModal('privacy')}
                          className="hover:text-[#2f6fa8] underline"
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
                <div className={`${CARD} p-6 flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={profile?.avatar_url || '/icon-192.png'}
                      alt={profile?.full_name || 'Profile avatar'}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="font-bold text-lg text-slate-900 truncate">{profile?.full_name || session.user.email}</h2>
                      {profile?.username && <p className="text-xs text-[#2f6fa8] font-medium truncate">@{profile.username}</p>}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-[#2f6fa8]" /> {profile?.city || 'Botswana'}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {profile?.rating_count ? `${Number(profile.rating_avg).toFixed(1)} from ${profile.rating_count} review${profile.rating_count > 1 ? 's' : ''}` : 'No reviews yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => openSettings('edit')} className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5 text-[#2f6fa8]" /> Settings
                    </button>
                    <button onClick={handleLogout} className="text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>

                <div className={`${CARD} p-5 space-y-3`}>
                  <h3 className="font-bold text-sm text-slate-800">My Listings ({myListings.length})</h3>
                  {myListings.length === 0 ? (
                    <p className="text-xs text-slate-500">You haven't posted any items or services yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {myListings.map((item) => {
                        const editable = canEditListing(item);
                        return (
                          <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                                <p className="text-slate-500">{item.city} • {item.category}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                            </div>
                            {item.status !== 'traded' && (
                              <div className="flex flex-wrap items-center gap-2">
                                {editable ? (
                                  <button type="button" onClick={() => openEdit(item)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-1 font-medium">
                                    <Pencil className="w-3 h-3" /> Edit
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Edit window closed (1h limit)</span>
                                )}
                                {item.status === 'active'
                                  ? <button type="button" onClick={() => setListingStatus(item, 'paused')} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-1 font-medium"><Pause className="w-3 h-3" /> Pause</button>
                                  : <button type="button" onClick={() => setListingStatus(item, 'active')} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-1 font-medium"><Play className="w-3 h-3" /> Resume</button>}
                                <button type="button" onClick={() => setListingStatus(item, 'deleted')} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 flex items-center gap-1 font-medium"><Trash2 className="w-3 h-3" /> Delete</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`${CARD} p-5 space-y-3`}>
                  <h3 className="font-bold text-sm text-slate-800">Reviews about you</h3>
                  {myReviews.length === 0 ? <p className="text-xs text-slate-500">Reviews appear here after you complete trades.</p> : myReviews.map((r) => (
                    <div key={r.id} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{r.reviewer?.full_name || 'Member'}</span>
                        <span className="text-amber-500">{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span></span>
                      </div>
                      {r.comment && <p className="text-slate-600 mt-0.5">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showInstallModal && (
        <Modal onClose={() => setShowInstallModal(false)} className="max-w-md">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">Install BarterBox on Your Phone</h2>
              <button type="button" onClick={() => setShowInstallModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <p className="font-bold text-slate-900">Android (Chrome)</p>
                <p>1. Open <strong>https://barterbox-lemon.vercel.app</strong> in Chrome.</p>
                <p>2. Tap the <strong>three dots (⋮)</strong> → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <p className="font-bold text-slate-900">iPhone (Safari)</p>
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#2f6fa8]" />
                <h2 className="font-bold text-lg text-slate-900">Account & App Settings</h2>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    settingsSection === id
                      ? id === 'delete' ? 'bg-rose-600 text-white' : 'bg-[#2f6fa8] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>
            </div>

            {settingsNotice && (
              <div className="bg-[#2f6fa8]/10 border border-[#2f6fa8]/25 text-[#2f6fa8] text-xs font-medium p-3 rounded-xl">
                {settingsNotice}
              </div>
            )}

            {settingsSection === 'edit' && (
              <form onSubmit={handleSaveProfileSettings} className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatarUrl || '/icon-192.png'}
                    alt="Preview avatar"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-100"
                  />
                  <div className="space-y-1">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#2f6fa8]" />
                      <span>{uploadingAvatar ? 'Uploading...' : 'Upload New Profile Picture'}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                    </label>
                    <p className="text-[11px] text-slate-500">JPG, PNG, or WebP up to 5MB.</p>
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
                  <select value={editCity} onChange={(e) => setEditCity(e.target.value)} className={`${INPUT} bg-white`}>
                    {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={savingProfile || uploadingAvatar} className={`w-full ${PRIMARY} py-2.5 disabled:opacity-50`}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}

            {settingsSection === 'help' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Need Help with BarterBox?</h3>
                  <p>We're here to help with account access, listing issues, trade proposals, and community safety across Botswana.</p>
                  <p className="text-slate-800 font-medium">
                    Support Email: <SupportEmailLink subject="BarterBox Help & Support" />
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSettingsSection('faq')} className={`${SM} bg-slate-100 text-slate-800`}>Browse FAQ</button>
                  <button type="button" onClick={() => setSettingsSection('problem')} className={`${SM} bg-[#2f6fa8] text-white`}>Report a Problem</button>
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
                        className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span>{item.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                      </button>
                      {isOpen && <p className="px-3.5 py-2.5 text-xs text-slate-600 bg-white">{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {settingsSection === 'problem' && (
              <form onSubmit={(e) => handleSupportSubmit(e, 'problem')} className="space-y-3">
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
              <form onSubmit={(e) => handleSupportSubmit(e, 'feedback')} className="space-y-3">
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
              <form onSubmit={handleDeleteAccount} className="space-y-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h3 className="font-bold text-sm text-rose-800">Delete Your BarterBox Account</h3>
                <p className="text-xs text-rose-700">
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
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm py-2.5 transition disabled:opacity-40"
                >
                  {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}

      {selectedListing && (
        <Modal onClose={() => setSelectedListing(null)} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="relative h-52 bg-slate-100">
            <img src={selectedListing.image_url || FALLBACK_IMG} alt={selectedListing.title} className="w-full h-full object-cover rounded-t-2xl" />
            <button onClick={() => setSelectedListing(null)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="bg-[#2f6fa8]/15 text-[#2f6fa8] font-semibold px-2 py-0.5 rounded-full uppercase">{selectedListing.type}</span>
                <span>{selectedListing.city}</span><span>•</span><span>Posted by {selectedListing.profiles?.full_name || 'Member'}</span>
                {Number(selectedListing.profiles?.rating) > 0 && <span className="flex items-center gap-0.5 text-amber-600 font-semibold"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(selectedListing.profiles.rating).toFixed(1)}</span>}
              </div>
              <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedListing.title}</h2>
              <p className="text-sm text-slate-600 mt-2">{selectedListing.description}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-xs font-bold text-amber-800 block">Owner is looking for:</span>
              <p className="text-sm text-slate-800 mt-0.5">{selectedListing.looking_for || 'Open to offers'}</p>
            </div>
            {uid === selectedListing.owner_id ? (
              <p className="text-xs text-center text-slate-500 bg-slate-100 py-2.5 rounded-xl">This is your own listing.</p>
            ) : !uid ? (
              <button onClick={() => { setSelectedListing(null); setActiveTab('profile'); }} className={`w-full ${PRIMARY} py-2.5`}>Sign In to Propose a Trade</button>
            ) : (
              <form onSubmit={handleSendProposal} className="space-y-3 border-t border-slate-100 pt-3">
                <h3 className="font-bold text-sm text-slate-900">Propose a Barter Offer</h3>
                {offerable.length > 0 && (
                  <div>
                    <label className={LABEL}>Offer one of your listed items:</label>
                    <select value={offeredListingId} onChange={(e) => setOfferedListingId(e.target.value)} className={`${INPUT} bg-white`}>
                      <option value="">-- Select your item/service (optional) --</option>
                      {offerable.map((ml) => <option key={ml.id} value={ml.id}>{ml.title}</option>)}
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
      )}

      {showListingModal && (
        <Modal onClose={() => setShowListingModal(false)} className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">{editingId ? 'Edit listing' : 'Post to BarterBox'}</h2>
              <button onClick={() => setShowListingModal(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveListing} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[['good', 'Physical Good'], ['service', 'Skill / Service']].map(([val, text]) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, type: val })} className={`py-2 rounded-xl text-xs font-semibold border ${form.type === val ? 'bg-[#2f6fa8] text-white border-[#2f6fa8]' : 'bg-white text-slate-600 border-slate-200'}`}>{text}</button>
                ))}
              </div>
              <div>
                <label className={LABEL}>Title</label>
                <input type="text" required placeholder="e.g. Homemade Seswaa, Fresh Eggs, or HP Laptop" value={form.title} onChange={setF('title')} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LABEL}>Category</label>
                  <select value={form.category} onChange={setF('category')} className={`${INPUT} bg-white`}>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Location</label>
                  <select value={form.city} onChange={setF('city')} className={`${INPUT} bg-white`}>
                    {BW_CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Description & Condition</label>
                <textarea rows={2} required placeholder="Describe ingredients, quantity, or condition..." value={form.description} onChange={setF('description')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>What do you want in exchange?</label>
                <input type="text" required placeholder="e.g. Maize meal, charcoal, or smartphone" value={form.looking_for} onChange={setF('looking_for')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Listing Photo (Upload from Device or Paste URL)</label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                  <input type="url" placeholder="Or paste image URL (https://...)" value={form.image_url} onChange={setF('image_url')} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                {form.image_url && (
                  <div className="mt-2 h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              {listingError && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs"><strong>Error:</strong> {listingError}</div>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowListingModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
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
          <form onSubmit={submitCounter} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Make a counter-offer</h2>
              <button type="button" onClick={() => setCounterFor(null)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500">They offered: <strong>{counterFor.offered_listing?.title || counterFor.custom_offer}</strong> for your <strong>{counterFor.target_listing?.title}</strong>. Tell them what you'd accept instead.</p>
            <textarea rows={3} required autoFocus placeholder="e.g. I'd accept the laptop plus two bags of maize meal." value={counterText} onChange={(e) => setCounterText(e.target.value)} className={INPUT} />
            <button type="submit" className={`w-full ${PRIMARY} py-2.5`}>Send counter-offer</button>
          </form>
        </Modal>
      )}

      {reviewFor && (
        <Modal onClose={() => setReviewFor(null)} className="max-w-md">
          <form onSubmit={submitReview} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Rate this trade</h2>
              <button type="button" onClick={() => setReviewFor(null)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500">How was your exchange with <strong>{(reviewFor.sender_id === uid ? reviewFor.receiver : reviewFor.sender)?.full_name || 'this member'}</strong>?</p>
            <Stars value={reviewRating} onChange={setReviewRating} />
            <textarea rows={3} placeholder="Add a comment (optional)" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className={INPUT} />
            <button type="submit" className={`w-full ${PRIMARY} py-2.5`}>Submit review</button>
          </form>
        </Modal>
      )}

      {activeProposal && (
        <Modal onClose={() => setActiveProposal(null)} className="max-w-md h-[75vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Trade Negotiation</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{activeProposal.target_listing?.title}</p>
            </div>
            <button onClick={() => setActiveProposal(null)} className="p-1.5 rounded-full hover:bg-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
            {messages.length === 0 ? (
              <p className="text-xs text-center text-slate-400 pt-8">Coordinate meetup spots or finalize trade details here.</p>
            ) : messages.map((msg) => {
              const isMe = msg.sender_id === uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${isMe ? 'bg-[#2f6fa8] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>{msg.content}</div>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input type="text" placeholder="Write a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#2f6fa8]" />
            <button type="submit" className="bg-[#2f6fa8] text-white p-2.5 rounded-xl hover:bg-[#2f6fa8]/90" title="Send"><Send className="w-4 h-4" /></button>
          </form>
        </Modal>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40">
        <div className="max-w-md mx-auto flex justify-around py-2">
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium relative ${activeTab === id ? 'text-[#2f6fa8]' : 'text-slate-500'}`}>
              <Icon className="w-5 h-5" /><span>{label}</span>
              {id === 'trades' && needsAction > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-3" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}