// src/App.js
import { useState } from 'react';
import IntervieweeView from './components/IntervieweeView';
import InterviewerDashboard from './components/InterviewerDashboard';
import './App.css'; // You can add basic styles here

function App() {
  const [activeTab, setActiveTab] = useState('interviewee'); // 'interviewee' or 'interviewer'

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI-Powered Interview Assistant</h1>
        <nav className="tab-nav">
          <button
            onClick={() => setActiveTab('interviewee')}
            className={activeTab === 'interviewee' ? 'active' : ''}
          >
            Interviewee
          </button>
          <button
            onClick={() => setActiveTab('interviewer')}
            className={activeTab === 'interviewer' ? 'active' : ''}
          >
            Interviewer
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'interviewee' ? <IntervieweeView /> : <InterviewerDashboard />}
      </main>
    </div>
  );
}

export default App;