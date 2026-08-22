import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

export default function ContactPlayerModal({ isOpen, onClose, profile }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profile.discordTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal
      title={`Contacter ${profile.displayName}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={handleCopy}>
          {copied ? 'Copie !' : 'Copier le tag Discord'}
        </Button>
      }
    >
      <p className="mb-3">Tu peux aussi ajouter ce joueur sur Discord avec le tag ci-dessous.</p>
      <div className="rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-yang-200">
        {profile.discordTag || 'Aucun tag Discord renseigne.'}
      </div>
    </Modal>
  );
}
