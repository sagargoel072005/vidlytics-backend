const clients = new Map();

const addClient = (jobId, res) => {
  clients.set(jobId, res);
};

const removeClient = (jobId) => {
  clients.delete(jobId);
};

const sendProgress = (
  jobId,
  data
) => {

  const client =
    clients.get(jobId);

  if (!client) return;

  client.write(
    `data: ${JSON.stringify(data)}\n\n`
  );
};

module.exports = {
  addClient,
  removeClient,
  sendProgress
};