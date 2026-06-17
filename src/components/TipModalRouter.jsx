import React from 'react';
import TipModal from './TipModal';
import TipModalDomestic from './TipModalDomestic';

export default function TipModalRouter({
  open,
  mode,
  channels = [],
  testMode = false,
  customUnitUsd = 1,
  onClose,
}) {
  if (mode === 'domestic') {
    return <TipModalDomestic open={open} channels={channels} onClose={onClose} />;
  }
  return (
    <TipModal
      open={open}
      testMode={testMode}
      customUnitUsd={customUnitUsd}
      onClose={onClose}
    />
  );
}
