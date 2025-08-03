import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <BrowserRouter>
        {children}
    </BrowserRouter>
  );
};
