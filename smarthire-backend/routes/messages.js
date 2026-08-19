import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// In-memory fallback thread storage if DB is not connected
const inMemoryThreads = {};

// @route   GET /api/messages
// @desc    Get all chat threads (conversations)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const threadMap = {};

    // 1. Load from memory fallback
    Object.keys(inMemoryThreads).forEach(cId => {
      const threadMsgs = inMemoryThreads[cId];
      if (threadMsgs && threadMsgs.length > 0) {
        const lastMsg = threadMsgs[threadMsgs.length - 1];
        threadMap[cId] = {
          candidateId: cId,
          candidateName: lastMsg.candidateName || 'Unknown',
          jobTitle: lastMsg.jobTitle || 'General',
          lastMessage: lastMsg.text,
          lastMessageTime: lastMsg.timestamp,
          unreadCount: 0
        };
      }
    });

    // 2. Fetch from MongoDB if connected
    try {
      const uniqueCandidateIds = await Message.distinct('candidateId');
      for (const cId of uniqueCandidateIds) {
        const lastMsg = await Message.findOne({ candidateId: cId }).sort({ timestamp: -1 });
        if (lastMsg) {
          if (!threadMap[cId] || new Date(lastMsg.timestamp) > new Date(threadMap[cId].lastMessageTime)) {
            threadMap[cId] = {
              candidateId: cId,
              candidateName: lastMsg.candidateName || 'Candidate',
              jobTitle: lastMsg.jobTitle || 'General',
              lastMessage: lastMsg.text,
              lastMessageTime: lastMsg.timestamp || lastMsg.createdAt,
              unreadCount: 0
            };
          }
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB distinct query failed, using memory fallback:', dbErr.message);
    }

    const threads = Object.values(threadMap).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({
      success: true,
      threads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threads',
      error: error.message
    });
  }
});

// @route   PATCH /api/messages/:candidateId/read
// @desc    Mark candidate thread messages as read
// @access  Public
router.patch('/:candidateId/read', async (req, res) => {
  res.json({ success: true, message: 'Thread marked as read' });
});

// @route   GET /api/messages/:candidateId
// @desc    Get chat message thread for a candidate
// @access  Public
router.get('/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    let messages = [];
    try {
      messages = await Message.find({ candidateId }).sort({ timestamp: 1 });
    } catch (e) {
      messages = inMemoryThreads[candidateId] || [];
    }

    if (!messages || messages.length === 0) {
      // Check in-memory fallback
      messages = inMemoryThreads[candidateId] || [];
    }

    res.json({
      success: true,
      messages: messages.map(m => ({
        id: m._id || m.id,
        sender: m.sender,
        senderName: m.senderName,
        text: m.text,
        timestamp: m.timestamp || m.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages',
      error: error.message
    });
  }
});

// @route   POST /api/messages/:candidateId
// @desc    Post a message to candidate chat thread
// @access  Public
router.post('/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { sender = 'recruiter', text, candidateName, jobTitle, senderName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const newMessageObj = {
      id: 'msg-' + Date.now(),
      candidateId,
      sender,
      senderName: senderName || (sender === 'recruiter' ? 'Recruiter Team' : ''),
      text: text.trim(),
      candidateName,
      jobTitle,
      timestamp: new Date().toISOString()
    };

    // Save to memory fallback
    if (!inMemoryThreads[candidateId]) {
      inMemoryThreads[candidateId] = [];
    }
    inMemoryThreads[candidateId].push(newMessageObj);

    // Try persisting to MongoDB if connected
    try {
      await Message.create({
        candidateId,
        sender,
        senderName: senderName || (sender === 'recruiter' ? 'Recruiter Team' : ''),
        text: text.trim(),
        candidateName,
        jobTitle
      });
      const dbThread = await Message.find({ candidateId }).sort({ timestamp: 1 });
      return res.json({
        success: true,
        message: 'Message sent successfully',
        thread: dbThread.map(m => ({
          id: m._id,
          sender: m.sender,
          senderName: m.senderName,
          text: m.text,
          timestamp: m.timestamp
        }))
      });
    } catch (dbErr) {
      // Fallback response with memory thread
      return res.json({
        success: true,
        message: 'Message sent successfully (memory store)',
        thread: inMemoryThreads[candidateId]
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

export default router;
