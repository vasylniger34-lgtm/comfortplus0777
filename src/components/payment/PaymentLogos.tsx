import React from 'react';

interface PaymentLogosProps {
  className?: string;
  variant?: 'footer' | 'checkout';
}

export default function PaymentLogos({ className = '', variant = 'footer' }: PaymentLogosProps) {
  const logos = [
    { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg' },
    { name: 'Mastercard', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
    { name: 'Portmone', url: 'https://www.portmone.com.ua/r3/images/logo.svg' },
    { name: 'Prostir', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Prostir_Logo.svg/512px-Prostir_Logo.svg.png' },
    { name: 'GPay', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg' },
    { name: 'ApplePay', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg' }
  ];

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {logos.map((logo) => (
        <img 
          key={logo.name}
          src={logo.url} 
          alt={logo.name} 
          className={variant === 'footer' ? 'h-6 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all' : 'h-8 w-auto'}
          title={logo.name}
        />
      ))}
      <div className="flex gap-2 ml-2">
        <div className="text-[10px] text-brand-muted border border-brand-border px-1 rounded uppercase font-medium">Verified by Visa</div>
        <div className="text-[10px] text-brand-muted border border-brand-border px-1 rounded uppercase font-medium">MasterCard SecureCode</div>
      </div>
    </div>
  );
}
