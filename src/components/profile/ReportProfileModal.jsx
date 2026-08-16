import { useState } from 'react';
import { REPORT_REASONS } from '../../data/constants.js';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormField, { inputClassName } from '../common/FormField.jsx';

export default function ReportProfileModal({ isOpen, onClose, onSubmit, reportedDisplayName }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ reason, details });
    setReason(REPORT_REASONS[0]);
    setDetails('');
  }

  return (
    <Modal title={`Signaler ${reportedDisplayName}`} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Motif" htmlFor="report-reason">
          <select
            id="report-reason"
            className={inputClassName}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {REPORT_REASONS.map((reasonOption) => (
              <option key={reasonOption} value={reasonOption}>
                {reasonOption}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Details (optionnel)" htmlFor="report-details">
          <textarea
            id="report-details"
            rows={3}
            className={inputClassName}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Decris ce qui s'est passe..."
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="danger">
            Envoyer le signalement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
