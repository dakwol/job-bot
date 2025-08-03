import React, { type FC } from 'react';
import styles from './styles.module.scss'
;
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button:FC<ButtonProps> = ({label, onClick, disabled}) => {
  return (
    <button onClick={onClick} disabled={disabled} className={styles.button}>{label}</button>
  )
}
