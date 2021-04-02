module.exports = {
  projects: {
    "@lotun/api": {
      documents: ["packages/api/src/documents/**/*.graphql"],
      extensions: {
        endpoints: {
          "Lotun API endpoint": {
            url: "http://localhost:4000/graphql",
          },
        },
      },
    },
  },
};
