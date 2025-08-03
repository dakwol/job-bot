import { type FC } from 'react';
import styles from './styles.module.scss';

interface LogoAppProps {
  link: string;
  text: string
}

export const LogoApp:FC<LogoAppProps> = ({link, text}) => {
  return (
    <div className={styles.logoContainer}>
      <img src={link} className={styles.logo}></img>
      <h1 className={styles.logoTitle}>{text}</h1>
    </div>
  )
}
