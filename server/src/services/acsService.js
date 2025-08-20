export const startCall = async (data) => {
  // TODO: integrate with Azure ACS
  return {
    id: Date.now().toString(),
    status: "started",
    participants: data.participants || [],
  };
};

export const fetchCall = async (id) => {
  // TODO: fetch call details from ACS
  return {
    id,
    status: "in-progress",
    participants: ["user1", "user2"],
  };
};
