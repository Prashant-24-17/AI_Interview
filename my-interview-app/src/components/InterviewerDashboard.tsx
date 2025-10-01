import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
// Update the path below to the correct location of your store file
import type { RootState } from '../store';
import type { CandidateProfile } from '../store/candidatesSlice';

// --- TYPE DEFINITIONS ---
type SortKey = 'details.name' | 'finalScore';
type SortDirection = 'ascending' | 'descending';

// --- COMPONENT ---
function InterviewerDashboard() {
  // 1. DATA FETCHING: Get all candidate profiles from the Redux store.
  const candidates = useSelector((state: RootState) => state.candidates.profiles);

  // 2. LOCAL STATE: Manage the UI for this component.
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'finalScore', direction: 'descending' });

  // 3. DATA PROCESSING: Filter and sort the candidates.
  // This is wrapped in useMemo for performance, so it only recalculates when data changes.
  const processedCandidates = useMemo(() => {
    let filtered = candidates.filter(c =>
      c.details.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      if (sortConfig.key === 'details.name') {
        aValue = a.details.name || '';
        bValue = b.details.name || '';
      } else { // 'finalScore'
        aValue = a.finalScore;
        bValue = b.finalScore;
        // Place candidates without a score at the bottom
        if (aValue === null) return 1;
        if (bValue === null) return -1;
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [candidates, searchTerm, sortConfig]);

  // 4. HANDLERS: Logic for UI interactions.
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- RENDER LOGIC ---

  // Renders the detailed view when a candidate is selected.
  if (selectedCandidate) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        <button onClick={() => setSelectedCandidate(null)} style={{ marginBottom: '20px' }}>
          &larr; Back to Dashboard
        </button>
        <h2>{selectedCandidate.details.name}'s Interview Details</h2>
        <p><strong>Email:</strong> {selectedCandidate.details.email}</p>
        <p><strong>Phone:</strong> {selectedCandidate.details.phone}</p>
        <hr style={{ margin: '20px 0' }} />
        <h3>Final Evaluation</h3>
        <p><strong>Score:</strong> {selectedCandidate.finalScore}/100</p>
        <p><strong>AI Summary:</strong> {selectedCandidate.finalSummary}</p>
        <hr style={{ margin: '20px 0' }} />
        <h3>Interview Transcript</h3>
        {selectedCandidate.interviewRecords.map((record, index) => (
          <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
            <p><strong>Question {index + 1} ({record.difficulty}):</strong> {record.question}</p>
            <p><strong>Answer:</strong> {record.answer || "No answer provided."}</p>
          </div>
        ))}
      </div>
    );
  }

  // Renders the main dashboard list.
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <h2>Interviewer Dashboard</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '20px', padding: '8px', width: '300px' }}
      />
      {processedCandidates.length === 0 ? (
        <p>No candidates found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => requestSort('details.name')}>Candidate Name</th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => requestSort('finalScore')}>Score</th>
              <th style={{ padding: '12px' }}>AI Summary</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedCandidates.map((candidate) => (
              <tr key={candidate.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{candidate.details.name}</td>
                <td style={{ padding: '12px' }}>{candidate.finalScore !== null ? `${candidate.finalScore}/100` : 'N/A'}</td>
                <td style={{ padding: '12px' }}>{candidate.finalSummary}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => setSelectedCandidate(candidate)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InterviewerDashboard;