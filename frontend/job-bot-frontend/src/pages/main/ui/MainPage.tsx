import React from 'react'
import { BaseLayout } from '../../../shared/BaseLayout'
import { LogoApp } from '../../../components/logoApp'
import styles from './styles.module.scss';

export const MainPage = () => {


  return (
    <BaseLayout >
      <LogoApp link={'/logo.svg'} text={'Coffee Job Bot'} />

      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.active : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Поиск вакансий
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'applications' ? styles.active : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Мои отклики ({applications.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'bot' ? styles.active : ''}`}
          onClick={() => setActiveTab('bot')}
        >
          🤖 Автобот {botStatus.is_running && '(работает)'}
        </button>
      </div>

      {error && <Alert label={error} />}

      <div className={styles.tabContent}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'applications' && renderApplicationsTab()}
        {activeTab === 'bot' && renderBotTab()}
      </div>
    </BaseLayout>
  )
}
