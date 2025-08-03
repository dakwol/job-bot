import { type FC, useEffect, useState } from 'react';
import styles from './styles.module.scss';

interface AlertProps {
  label: string;
}

export const Alert: FC<AlertProps> = ({ label }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (label) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [label]);

  return (
    <div className={`${styles.alertContainer} ${visible ? styles.visible : ''}`}>
      {label}
    </div>
  );
};
