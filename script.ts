import * as fs from 'fs';

const content = fs.readFileSync('src/components/SlayerIntro.tsx', 'utf-8');

// Find the start of the pricing-matrices section
const startIndex = content.indexOf('{/* ==================================================\n          TACTICAL MEMBERSHIP SUBSCRIPTION MATRICES');
const endIndex = content.indexOf('</div>\n  );\n}');

if (startIndex !== -1 && endIndex !== -1) {
  const pricingSection = content.substring(startIndex, endIndex);

  // Extract necessary imports and states
  const fileOutput = `
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Lock, CreditCard, ChevronRight, X, AlertTriangle, Shield, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useContractStore } from '../lib/store';

interface SubscriptionPricingProps {
  onUpgradeComplete?: (tier: 'guest' | 'discord' | 'intraday' | 'quant' | 'enterprise' | 'lifetime') => void;
  onEnterApp?: () => void;
  session: any;
}

export function SubscriptionPricing({ onUpgradeComplete, onEnterApp, session }: SubscriptionPricingProps) {
  const serverState = useContractStore(s => s.serverState);
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Interactive mock checkout state variables
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [checkoutSubStep, setCheckoutSubStep] = useState<'details' | 'billing'>('details');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userZip, setUserZip] = useState('');
  const [mockCardNumber, setMockCardNumber] = useState('4242 4242 4242 4242');
  const [mockCardName, setMockCardName] = useState('');
  const [mockCardExpiry, setMockCardExpiry] = useState('12/28');
  const [mockCardCvv, setMockCardCvv] = useState('123');
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [mockEmail, setMockEmail] = useState('');
  const [mockCompanyName, setMockCompanyName] = useState('');
  
  const [lifetimeContactType, setLifetimeContactType] = useState<'individual' | 'corporate'>('individual');
  const [isValidatingSuccess, setIsValidatingSuccess] = useState(false);

  const paymentAreaRef = useRef<HTMLDivElement>(null);

  const handleCheckoutPlan = (plan: string) => {
    // If user is not authenticated, we could prompt login, but for mock, we show checkout directly
    setSelectedPlanForCheckout(plan);
    setCheckoutStep('details');
    setCheckoutSubStep('details');
    setProcessingLogs([]);
    setMockCardName(session?.name || '');
    setMockEmail(session?.email || '');
    setIsValidatingSuccess(false);
  };

  ${pricingSection}
}
`;

  fs.writeFileSync('src/components/SubscriptionPricing.tsx', fileOutput);

  // Now remove the section from SlayerIntro.tsx
  const newSlayerIntro = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync('src/components/SlayerIntro.tsx', newSlayerIntro);
  console.log("Migration successful!");
}
