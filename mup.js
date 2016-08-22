module.exports = {
  servers: {
    one: {
      host: '69.175.107.251',
      username: 'root',
      // pem:
      password: '231sb3MtYs'
      // or leave blank for authenticate from ssh-agent
    }
  },

  meteor: {
    name: 'nflconfidencepool',
    path: '~/nfl-meteor',
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'asitewithnoname.com/nfl',
      MONGO_URL: 'mongodb://localhost/nfl'
    },

    //dockerImage: 'kadirahq/meteord'
    deployCheckWaitTime: 120
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
