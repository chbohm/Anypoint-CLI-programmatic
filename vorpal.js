/*
  Module with a custom Vorpal subclass. Main purpose of it is to
  update command action context with a _log function that adds a
  pretty way to log Table instances of cli-table2 with fields
  limiting and output formating.
*/
var _ = require('lodash')
var OrigVorpal = require('vorpal')

function ConstructVorpal () {
  return new Vorpal()
}

function Vorpal () {
  OrigVorpal.call(this)
}

Vorpal.prototype = new OrigVorpal()

/* Adds global options to all the commands */
Vorpal.prototype.addGlobalOptions = function (session) {
  _.each(this.commands, function (cmd) {
    addCmdGlobalOptions(cmd, session)
  })
}

/* Adds global options `--output` and `--fields` one particular command */
function addCmdGlobalOptions (cmd, session) {
  cmd.option(
    '-o, --output <format>',
    'Output format. Supported values are: table, text, json. ' +
    'Defaults to `text` for non-interactive and ' +
    '`table` for interactive sessions.')
  cmd.option(
    '-f, --fields [name][,name2...]',
    'Name of fields to output. Provide multiple comma-separated values to limit ' +
    'output to multiple fields. E.g.: "--fields \'Email,First name\'". ' +
    'Use this option without any values to list all available fields.')
  var cmdSpecificValidation = cmd._validate
  cmd.validate(function (args) {
    saveGlobalOptions.call(this, args, session)
    if (cmdSpecificValidation !== undefined) {
      return cmdSpecificValidation.call(this, args)
    }
    return true
  })
}

/* Saves values of global options to a command action context. */
function saveGlobalOptions (args, session) {
  var defOpts = session.defaultGlobalOpts || {}
  this.output = args.options.output || defOpts.output
  if (!this.output) {
    this.output = session.opts.interactive ? 'table' : 'text'
  }
  this.fields = args.options.fields || defOpts.fields
}

/*
  Patches all commands and adds _log method to their command action
  contexts.
*/
Vorpal.prototype.patchCommandsLogging = function () {
  _.each(this.commands, function (cmd) {
    cmd._fn = _.wrap(cmd._fn, function (fn, cmdArgs, cb) {
      this._log = _log
      return fn.call(this, cmdArgs, cb)
    })
  })
}

/*
  Accepts table, sets `output` and `fields` options in it and loggs
  results of calling table's `toString` method.
*/
function _log (table) {
  table.setOutputOption(this.output)
  table.setFieldsOption(this.fields)
  return this.log(table.toString())
}

module.exports = ConstructVorpal
