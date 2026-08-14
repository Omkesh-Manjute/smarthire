import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['recruiter', 'candidate', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  candidateName: {
    type: String
  },
  jobTitle: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
