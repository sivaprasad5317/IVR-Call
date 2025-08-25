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

export const getACSToken = async (userId) => {
  // Placeholder function
  // Will later call Azure SDK to generate token once credentials are ready
  return { token: "PLACEHOLDER_TOKEN", expiresOn: new Date(Date.now() + 3600*1000) };
};
