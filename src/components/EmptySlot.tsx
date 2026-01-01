import React from 'react';

type Props = {
  onAdd: (e: React.MouseEvent<HTMLButtonElement>) => void;
  hint?: string;
};

export default function EmptySlot({ onAdd, hint }: Props) {
  return (
    <div className="empty-slot">
      <div className="empty-slot__text">{hint ?? 'Add a step'}</div>
      <button type="button" className="empty-slot__btn" onClick={onAdd}>
        +
      </button>
    </div>
  );
}
