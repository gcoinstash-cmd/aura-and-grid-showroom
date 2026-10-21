/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, Lock, Send, FileCheck, CreditCard, Sparkles } from "lucide-react";

export default function IntegrationLayer() {
  return (
    <div className="border border-gold-300/20 bg-[#161616] p-8 rounded-none transition-all duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold-400 font-medium">System Core</span>
          <h2 className="text-2xl font-serif text-white tracking-tight mt-1">
            [🔌 System Integration Layer - Closed Archive]
          </h2>
          <p className="text-neutral-400 text-sm mt-1 max-w-xl">
            SaaS-level micro-triggers compiled for downstream workflow engines. Actual external webhooks and authorization sequences are secured in vault variables.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full shrink-0">
          <Lock className="w-3.5 h-3.5 text-gold-400" />
          <span className="font-mono text-xs font-semibold tracking-wider uppercase tracking-wider text-gold-400 font-medium">Ready but Paused</span>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: CRM */}
        <div className="group relative border border-white/5 bg-[#121212] p-6 hover:border-gold-400/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-neutral-900 border border-white/5 text-gold-400 rounded-none group-hover:border-gold-400/30 transition-all">
                <Link className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wider tracking-wider text-neutral-500 uppercase">CRM Sync</span>
            </div>
            <h3 className="font-serif text-lg text-white mb-2">HoneyBook & Dubsado Webhook</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Automatically capture incoming high-ticket wedding or corporate inquiries from HoneyBook or Dubsado. Map fields directly into the Master Bookings database without typing.
            </p>
          </div>
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs font-semibold font-mono text-neutral-500 leading-snug">
              ⚠️ <span className="text-gold-400 font-medium">Integration Disabled</span>: Requires custom external server routing and unique workspace security handshake protocols.
            </p>
          </div>
        </div>

        {/* Module 2: DocuSign */}
        <div className="group relative border border-white/5 bg-[#121212] p-6 hover:border-gold-400/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-neutral-900 border border-white/5 text-gold-400 rounded-none group-hover:border-gold-400/30 transition-all">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wider tracking-wider text-neutral-500 uppercase">E-Sign API</span>
            </div>
            <h3 className="font-serif text-lg text-white mb-2">DocuSign Contract Pipeline</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Spins up bespoke client agreements automatically when event status moves to &quot;Proposal Sent&quot;. Maps the guest count, location, and gold cutlery clauses into standard legal templates.
            </p>
          </div>
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs font-semibold font-mono text-neutral-500 leading-snug">
              ⚠️ <span className="text-gold-400 font-medium">Integration Disabled</span>: Requires certified DocuSign Integrator Key and docusign-esign Node module handshake.
            </p>
          </div>
        </div>

        {/* Module 3: Stripe */}
        <div className="group relative border border-white/5 bg-[#121212] p-6 hover:border-gold-400/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-neutral-900 border border-white/5 text-gold-400 rounded-none group-hover:border-gold-400/30 transition-all">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wider tracking-wider text-neutral-500 uppercase">Fintech</span>
            </div>
            <h3 className="font-serif text-lg text-white mb-2">Stripe 50% Deposit Invoice</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              When contract is signed, Stripe triggers an automated invoice requesting 50% deposit. Updates the event status from &quot;Contract Signed&quot; to &quot;Deposit Paid&quot; immediately after successful payout.
            </p>
          </div>
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs font-semibold font-mono text-neutral-500 leading-snug">
              ⚠️ <span className="text-gold-400 font-medium">Integration Disabled</span>: Requires active Stripe webhook signatures and private Stripe secret keys configured on standard server.
            </p>
          </div>
        </div>

      </div>

      {/* Decorative Architecture Wire */}
      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-neutral-500 font-mono text-xs font-semibold tracking-wider">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" />
          <span>VAULT ARCHIVE_ID: SYNC_2026_X</span>
        </div>
        <span>STRICT SECURE ACCESS</span>
      </div>
    </div>
  );
}
