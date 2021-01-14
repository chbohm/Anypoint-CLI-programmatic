let basePath = './node_modules/'
let anypointCliBasePath = './node_modules/anypoint-cli/src/'
var Path = require('upath')
var Promise = require('bluebird')
var _ = require('lodash')
var cli = require('./vorpal')()
var rls = require('readline-sync')
var glob = Promise.promisify(require('glob'))
var pjson = require(anypointCliBasePath + '../package.json')
var errorUtils = require(anypointCliBasePath + './error_utils')
var Session = require(anypointCliBasePath + './session')
var autocomplete = require(anypointCliBasePath + './autocomplete_provider')
var configLoader = require(anypointCliBasePath + './config_loader')
var utils = require(anypointCliBasePath + './utils')
var minimist = require('minimist')

cli.find('exit').description('Exits anypoint-cli')

var session = Session()

async function executeCommand(commandString) {
  let originalLog = console.log;
  let result = [];
  console.log = function (message, args) {
    result.push(message);
  }

  let code = await cli.exec(commandString);
  console.log = originalLog;
  if (code) {
    throw 'Error code: ' + code;
  }
  if (result.length > 1) {
    return result.slice(1).join('');
  }
  return '{}';
}

function init() {
  return getGlobalOptions()
    .then(function (opts) {
      opts.interactive = false;
      session.setOpts(opts)
      if (session.opts.interactive) {
        outputBanner()
      }
      if (_.isUndefined(session.opts.bearer)) {
        if (session.opts.username && session.opts.client_id) {
          logErrorAndQuit('Both username and client_id are specified. Only one is allowed.');
        }

        if (session.opts.client_id && _.isUndefined(session.opts.client_secret)) {
          logErrorAndQuit('client_id specified without client_secret');
        }

        if (_.isUndefined(session.opts.username) && _.isUndefined(session.opts.client_id)) {
          logErrorAndQuit('At least one authorization mechanism (bearer, username, or client_id) must be specified.');
        }

        if (!_.isUndefined(session.opts.username) && _.isUndefined(session.opts.password)) {
          session.opts.password = rls.question('Password: ', {
            hideEchoBack: true
          })
        }
      }
      if (session.opts.interactive) {
        cli.log('Connecting to the Anypoint Platform...')
      }
      return session.load()
    })
    .then(function () {
      return getRestructuredCreds()
    })
    .then(function (creds) {
      session.restructuredCreds = creds
      return configLoader.loadOpts()
    })
    .then(defaultGlobalOpts => {
      session.defaultGlobalOpts = defaultGlobalOpts
      return loadCommands()
    })
    .then(bindCliToSession)
    .then(function () {
      if (session.opts.interactive) {
        autocomplete.init(session)
        cli
          .delimiter('>')
          .show()
      }
      // else {
      //   return cli.exec(session.opts.commandString)
      //     .then(function () {
      //       process.exit(session.exitCode)
      //     })
      // }
    })
    .catch(function (e) {
      // Handles error throws
      cli.log(errorUtils.describe(e))
      process.exit(1)
    })
}

function logErrorAndQuit(errorText) {
  cli.log(`ERROR: ${errorText} \n\n`);
  outputUsage();
  process.exit(1);
}

function bindCliToSession() {
  session.cli = cli
}

function loadCommands() {
  return glob(Path.join(__dirname, anypointCliBasePath + 'commands/**/*.js'))
    .each(function (filePath) {
      cli.use(Path.resolve(filePath), session)
    })
    .then(function () {
      _.each(cli.commands, function (cmd) {
        if (cmd._fn !== undefined) {
          var originalFn = cmd._fn
          cmd._fn = _.wrap(originalFn, handleCommand)
        }
      })
    })
    .then(function () {
      cli.addGlobalOptions(session)
      cli.patchCommandsLogging()
      if (!session.opts.interactive) {
        disableInteractiveOnlyCmds()
      }
    })
}

function disableInteractiveOnlyCmds() {
  var commandsNames = [
    'use business-group',
    'use environment'
  ]
  var cmd
  _.each(commandsNames, function (cmdName) {
    cmd = cli.find(cmdName)
    if (cmd) {
      cmd.validate(function () {
        cli.log('Error: This command is only available in interactive mode')
        return false
      })
    }
  })
}

function handleCommand(fn, cmdArgs, cb) {
  var self = this
  var returnVal = fn.call(self, cmdArgs, cb)
  if (returnVal !== undefined) {
    return Promise.resolve(returnVal)
      .then(function () {
        session.exitCode = 0
      })
      .catch(errorUtils.isUnauthorizedError, function (e) {
        if (session.opts.bearer) {
          cli.log(errorUtils.describe(e))
          process.exit(1)
        }
        return session.login()
          .then(function () {
            return Promise.resolve(fn.call(self, cmdArgs, cb))
          })
      })
      .catch(function (e) {
        // Handles promise rejects
        cli.log(errorUtils.describe(e))
        session.exitCode = -1
      })
  }
}

// parseArgv parses process args and converts cred opts to strings
function parseArgv() {
  var argvCopy = process.argv.slice()
  argvCopy.shift()
  argvCopy.shift()
  var parsedArgv = minimist(argvCopy, { string: ['_', 'apiVersion'] })
  var credOpts = [
    'username',
    'password',
    'bearer',
    'environment',
    'organization',
    'host'
  ]
  return _.mapValues(parsedArgv, function (val, key) {
    if (_.includes(credOpts, key) && _.isNumber(val)) {
      return val.toString()
    }
    return val
  })
}

function getGlobalOptions() {
  var parsedArgv = parseArgv()
  return configLoader.load(parsedArgv)
    .then(function (opts) {
      if (!_.isEmpty(parsedArgv._)) {
        opts.commandString = quoteArgs(parsedArgv._).join(' ')
        delete parsedArgv.username
        delete parsedArgv.password
        delete parsedArgv.client_id
        delete parsedArgv.client_secret
        delete parsedArgv.environment
        delete parsedArgv.organization
        delete parsedArgv.host
        delete parsedArgv.bearer
        delete parsedArgv._
        var options = _.map(_.keys(parsedArgv), function (k) {
          return composeOptionString(k, parsedArgv[k])
        })
        opts.commandString += ' ' + options.join(' ')
        opts.interactive = false
      }
      return opts
    })
}

/* Restructure credentials by grouping by host->org:env */
function getRestructuredCreds() {
  return configLoader.loadJSONFile(configLoader.CREDENTIALS_FILE)
    .then(function (data) {
      var creds = {}
      _.each(Object.keys(data), function (prof) {
        var profData = data[prof]
        creds[utils.getCredsKey(profData)] = {
          username: profData.username,
          password: profData.password
        }
      })
      return creds
    })
}

function quoteArgs(args) {
  return _.map(args, function (val) {
    if (val.indexOf(' ') > -1) {
      val = "'" + val + "'"
    }
    return val
  })
}

function composeOptionString(key, values) {
  if (!_.isArray(values)) {
    values = [values]
  }
  var pieces = _.map(values, function (val) {
    if (_.isString(val)) {
      val = "'" + val + "'"
    }
    var opt = ''
    if (_.isBoolean(val) && !val) {
      opt += '--no-' + key
    } else {
      opt += '--' + key
    }
    if (!_.isBoolean(val)) {
      opt += ' ' + val
    }
    return opt
  })
  return pieces.join(' ')
}

function outputUsage() {
  var defaultCredentialFile = {
    default: {
      username: '',
      password: ''
    },
    otherProfile: {
      username: '',
      password: '',
      organization: '',
      environment: '',
      host: ''
    },
    connAppProfile: {
      client_id: '',
      client_secret: '',
      organization: '',
      environment: '',
      host: ''
    }
  };
  cli.log(
    `Error: required parameters not set
Required: 
  (username, password) OR
  (client_id, client_secret) OR
  bearer
Optional:
  organization
  environment
  host

Parameters are loaded from one of the profiles in ~/.anypoint/credentials, which has the form
${JSON.stringify(defaultCredentialFile, null, ' ')}
The 'default' profile is used unless the ANYPOINT_PROFILE env variable is set.

Environment variables override credentials file parameters:
  ANYPOINT_USERNAME, ANYPOINT_PASSWORD, ANYPOINT_CLIENT_ID, ANYPOINT_CLIENT_SECRET, ANYPOINT_ORG, ANYPOINT_ENV, ANYPOINT_BEARER
  
Command line parameters override environment variables:
  --username, --password, --client_id, --client_secret, --organization, --environment, --bearer
  
If a 'password' parameter is not included when a username is supplied, you will be prompted for one.
`)
}

function outputBanner() {
  // From http://www.network-science.de/ascii/ in standard font
  cli.log(
    '    _                            _       _   ____  _       _    __                      \n' +
    '   / \\   _ __  _   _ _ __   ___ (_)_ __ | |_|  _ \\| | __ _| |_ / _| ___  _ __ _ __ ___  \n' +
    '  / _ \\ | \'_ \\| | | | \'_ \\ / _ \\| | \'_ \\| __| |_) | |/ _` | __| |_ / _ \\| \'__| \'_ ` _ \\ \n' +
    ' / ___ \\| | | | |_| | |_) | (_) | | | | | |_|  __/| | (_| | |_|  _| (_) | |  | | | | | |\n' +
    '/_/   \\_\\_| |_|\\__, | .__/ \\___/|_|_| |_|\\__|_|   |_|\\__,_|\\__|_|  \\___/|_|  |_| |_| |_|\n' +
    '               |___/|_|                                                                   CLI v' + pjson.version + '\n' +
    '                                              \n'
  )
}

module.exports.init = init
module.exports.executeCommand = executeCommand
