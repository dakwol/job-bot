import { ReactNode } from 'react';
import styles from './styles.module.scss';
import { AppProviders } from '../../../app/providers/ui/AppProviders';

interface BaseLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}

export const BaseLayout = ({ header, sidebar, children }: BaseLayoutProps) => {
  return (
    <AppProviders>
      <div className={styles.layout}>
        {header && <header className={styles.header}>{header}</header>}

        <div className={styles.body}>
          {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
          <main className={styles.content}>{children}</main>
        </div>

      </div>
    </AppProviders>
  );
};
