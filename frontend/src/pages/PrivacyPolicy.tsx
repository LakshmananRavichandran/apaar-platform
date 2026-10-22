import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  EyeOff,
  Clock,
  Trash2,
  FileText,
  UserCheck,
  Scale,
  Building,
  CheckCircle2
} from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const principles = [
    {
      icon: UserCheck,
      title: 'Consent-First Architecture (Section 6)',
      desc: 'No personal student academic credential data is shared with third-party verifiers, universities, or prospective employers without explicit, granular, time-bound consent authorized by the student.'
    },
    {
      icon: EyeOff,
      title: 'Data Minimization & Mandatory Masking (Section 8)',
      desc: 'All 12-digit Aadhaar identifiers are truncated to last-4 digits only and encrypted at rest using AES-256 Fernet field-level cryptography. Mobile numbers and domestic addresses are masked in accordance with role-based access limits.'
    },
    {
      icon: Scale,
      title: 'Purpose Limitation',
      desc: 'Data ingested from AICTE-approved institutions is strictly utilized for academic credential authentication, scholarship eligibility auditing, and degree validation. Commercial re-monetization or advertising profiling is prohibited.'
    },
    {
      icon: Clock,
      title: 'Storage & Retention Limitation (Section 9)',
      desc: 'Verifier consent grants automatically expire after a maximum duration of 30 days unless explicitly renewed. Institutional transcripts are retained in immutable archival storage for educational credential verification.'
    },
    {
      icon: Trash2,
      title: 'Right to Correction & Erasure (Section 12)',
      desc: 'Data principals (students) possess statutory rights under the DPDP Act 2023 to inspect their data trail, download machine-readable records, request factual corrections via nodal officers, and petition for data erasure.'
    },
    {
      icon: Lock,
      title: 'Tamper-Evident Hash Chain Audit Trails',
      desc: 'Every access, verification query, and data change is sealed in an unbroken SHA-256 cryptographic hash chain, guaranteeing institutional accountability and tamper-evident auditing.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          Statutory Compliance Charter
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Digital Personal Data Protection (DPDP) Act 2023 Compliance
        </h1>
        <p className="text-sm text-[#B3B3B3] max-w-2xl mx-auto">
          AICTE APAAR Verify is architected ground-up to safeguard individual privacy, enforce data principal rights, and provide verifiable academic credential management.
        </p>
      </div>

      {/* DPDP Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {principles.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-2.5 hover:border-[#1DB954]/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#242424] text-[#1DB954] rounded-xl">
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{p.title}</h3>
            </div>
            <p className="text-xs text-[#B3B3B3] leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Regulatory Governance Section */}
      <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-[#1DB954]" />
          Data Protection Officer & Institutional Grievance Redressal
        </h3>
        <p className="text-xs text-[#B3B3B3] leading-relaxed">
          In compliance with DPDP Act Section 10 rules for Significant Data Fiduciaries, AICTE has designated an independent Data Protection Officer (DPO) and established institutional nodal officers in every approved college.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#242424] p-3.5 rounded-xl border border-white/5">
            <div className="text-[#B3B3B3]">Central Data Protection Officer</div>
            <div className="text-white font-bold mt-0.5">dpo@aicte-india.org</div>
            <div className="text-[11px] text-[#B3B3B3] mt-1">AICTE Headquarters, Nelson Mandela Marg, Vasant Kunj, New Delhi</div>
          </div>
          <div className="bg-[#242424] p-3.5 rounded-xl border border-white/5">
            <div className="text-[#B3B3B3]">Grievance SLA Resolution</div>
            <div className="text-white font-bold mt-0.5">72 Business Hours Maximum</div>
            <div className="text-[11px] text-[#B3B3B3] mt-1">Escalations handled directly through the Support Tickets queue</div>
          </div>
        </div>
      </div>
    </div>
  );
};
