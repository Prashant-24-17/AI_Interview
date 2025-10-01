// import { createSlice } from '@reduxjs/toolkit';
// import type { PayloadAction } from '@reduxjs/toolkit';
// import { v4 as uuidv4 } from 'uuid';

// // --- TYPE DEFINITIONS ---
// export interface CandidateProfile {
//   id: string;
//   timestamp: string;
//   details: {
//     name: string | null;
//     email: string | null;
//     phone: string | null;
//   };
//   interviewRecords: {
//     question: string;
//     answer: string;
//     difficulty: 'Easy' | 'Medium' | 'Hard';
//   }[];
//   finalScore: number | null;
//   finalSummary: string;
// }

// interface CurrentEvaluation {
//   score: number | null;
//   summary: string;
// }

// interface CandidatesState {
//   profiles: CandidateProfile[];
//   currentEvaluation: {
//     status: 'idle' | 'loading' | 'succeeded' | 'failed';
//     data: CurrentEvaluation | null;
//     error: string | null;
//   };
// }

// const initialState: CandidatesState = {
//   profiles: [],
//   currentEvaluation: {
//     status: 'idle',
//     data: null,
//     error: null,
//   },
// };

// const candidatesSlice = createSlice({
//   name: 'candidates',
//   initialState,
//   reducers: {
//     startEvaluation: (state) => {
//       state.currentEvaluation.status = 'loading';
//       state.currentEvaluation.data = null;
//       state.currentEvaluation.error = null;
//     },
//     evaluationError: (state, action: PayloadAction<string>) => {
//       state.currentEvaluation.status = 'failed';
//       state.currentEvaluation.error = action.payload;
//     },
//     addProfile: (state, action: PayloadAction<Omit<CandidateProfile, 'id' | 'timestamp'>>) => {
//       const newProfile: CandidateProfile = {
//         id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         ...action.payload,
//       };
//       state.profiles.unshift(newProfile);
//       state.currentEvaluation.status = 'succeeded';
//       state.currentEvaluation.data = {
//         score: newProfile.finalScore,
//         summary: newProfile.finalSummary,
//       };
//     },
//   },
// });

// // This line exports the ACTION CREATORS (the functions you should call)
// export const { startEvaluation, evaluationError, addProfile } = candidatesSlice.actions;

// // This line exports the REDUCER (for the store configuration)
// export default candidatesSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// --- TYPE DEFINITIONS ---
export interface CandidateDetails {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface InterviewRecord {
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CandidateProfile {
  id: string;
  timestamp: string;
  details: CandidateDetails;
  interviewRecords: InterviewRecord[];
  finalScore: number | null;
  finalSummary: string;
}

interface CurrentEvaluation {
  score: number | null;
  summary: string;
}

// NEW: This interface tracks the state of the interview currently in progress.
export interface InProgressInterview {
  step: 'upload' | 'collectingInfo' | 'ready' | 'interviewing' | 'finished';
  details: CandidateDetails;
  interviewRecords: InterviewRecord[];
  // You can add more fields to save, like the current questionIndex or timer
}

interface CandidatesState {
  profiles: CandidateProfile[];
  currentEvaluation: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    data: CurrentEvaluation | null;
    error: string | null;
  };
  inProgress: InProgressInterview | null; // NEW: Tracks the current session
}

const initialState: CandidatesState = {
  profiles: [],
  currentEvaluation: {
    status: 'idle',
    data: null,
    error: null,
  },
  inProgress: null, // No interview is in progress initially
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    startEvaluation: (state) => {
      state.currentEvaluation.status = 'loading';
      state.currentEvaluation.data = null;
      state.currentEvaluation.error = null;
    },
    evaluationError: (state, action: PayloadAction<string>) => {
      state.currentEvaluation.status = 'failed';
      state.currentEvaluation.error = action.payload;
    },
    addProfile: (state, action: PayloadAction<Omit<CandidateProfile, 'id' | 'timestamp'>>) => {
      const newProfile: CandidateProfile = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.profiles.unshift(newProfile);
      state.currentEvaluation.status = 'succeeded';
      state.currentEvaluation.data = {
        score: newProfile.finalScore,
        summary: newProfile.finalSummary,
      };
      state.inProgress = null; // MODIFIED: Clear the in-progress session on completion
    },
    // NEW: This action updates the in-progress interview state.
    updateInProgress: (state, action: PayloadAction<InProgressInterview | null>) => {
      state.inProgress = action.payload;
    },
  },
});

// MODIFIED: Export the new action creator.
export const { startEvaluation, evaluationError, addProfile, updateInProgress } = candidatesSlice.actions;

export default candidatesSlice.reducer;