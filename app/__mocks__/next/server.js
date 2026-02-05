module.exports = {
  NextResponse: {
    json: (data) => ({
      json: () => Promise.resolve(data),
      status: 200,
    }),
  },
};
