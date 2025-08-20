// Mock DB for now
let callHistory = [];

exports.saveNotes = (req, res) => {
  const { callId, notes } = req.body;
  if (!callId || !notes) {
    return res.status(400).json({ error: "callId and notes are required" });
  }

  const record = { callId, notes, timestamp: new Date() };
  callHistory.push(record);

  res.status(201).json({ message: "Notes saved", record });
};

exports.getHistory = (req, res) => {
  res.json({ history: callHistory });
};
