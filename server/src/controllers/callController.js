import { startCall, fetchCall } from "../services/acsService.js";

export const createCall = async (req, res) => {
  try {
    const call = await startCall(req.body);
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCall = async (req, res) => {
  try {
    const call = await fetchCall(req.params.id);
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
